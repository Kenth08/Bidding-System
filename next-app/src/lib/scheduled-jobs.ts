/**
 * Scheduled (cron) jobs.
 *
 * Run automatically every CRON_INTERVAL_SECONDS (default 60) by the in-process
 * scheduler in src/lib/scheduler.ts, started from src/instrumentation.ts.
 * Can also be triggered by an admin ("Run now" on the dashboard) or by an
 * external cron hitting GET /api/cron/scheduled-jobs with the CRON_SECRET.
 *
 * Every job is safe to run repeatedly:
 *  - status changes "claim" the row with a conditional update, so a project is
 *    closed once even if two runs overlap;
 *  - reminder notifications check for an existing notification first, so
 *    nobody gets the same reminder twice.
 *
 * Automatic actions are written to the audit log with no user (shown as "System").
 */
import { db } from "@/lib/db";
import { createNotification, logAudit, notifyAdmins } from "@/lib/actions";
import { createBidLog } from "@/lib/bid-log";
import { publishEvent } from "@/lib/sse";
import { canSupplierAccessProject } from "@/lib/project-access";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Remind suppliers this many days before a bidding deadline. */
const DEADLINE_REMINDER_DAYS = 1;
/** Warn suppliers this many days before a document expires. */
const DOCUMENT_WARNING_DAYS = 30;

/** Business time zone for deciding what "today" is (deadlines are calendar dates). */
const TIME_ZONE = process.env.APP_TIME_ZONE || "Asia/Manila";

/** Calendar date in the business time zone as YYYY-MM-DD (independent of the server's own time zone). */
function localDateKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/**
 * Today as a value to compare against DATE columns. Prisma compares DATE
 * columns by their UTC calendar day, so this must be UTC midnight of today's
 * date - not local midnight, which is still "yesterday" in UTC.
 */
function todayAsDbDate() {
  return new Date(`${localDateKey(new Date())}T00:00:00.000Z`);
}

/** A Postgres DATE column comes back as UTC midnight; this gives its YYYY-MM-DD. */
function dbDateKey(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

async function alreadyNotified(recipientId: string, type: string, relatedId: string) {
  const existing = await db.notification.findFirst({ where: { recipient_id: recipientId, type, related_id: relatedId }, select: { id: true } });
  return Boolean(existing);
}

async function notifySchoolHeads(type: string, title: string, message: string, link: string, relatedId: string) {
  const heads = await db.user.findMany({ where: { role: "school_head", is_active: true }, select: { id: true } });
  for (const head of heads) await createNotification({ recipientId: head.id, type, title, message, link, relatedId });
}

/** Active projects whose deadline day has passed are closed, and everyone involved is told. */
export async function closeExpiredProjects(): Promise<number> {
  const today = todayAsDbDate(); // a project closes the day after its deadline date

  const candidates = await db.project.findMany({
    where: { status: "active", deadline: { lt: today }, is_archived: false },
    select: { id: true, title: true },
  });

  let closed = 0;
  for (const project of candidates) {
    const claim = await db.project.updateMany({ where: { id: project.id, status: "active" }, data: { status: "closed" } });
    if (claim.count === 0) continue; // someone else closed it first
    closed++;

    const bids = await db.bid.findMany({ where: { project_id: project.id }, select: { id: true, supplier_id: true } });
    const bidCount = bids.length;

    await logAudit("CLOSE_BIDDING", null, `Bidding for ${project.title} closed automatically after the deadline (${bidCount} bid(s) received)`, "project", project.id);
    await createBidLog({ projectId: project.id, role: "system", action: "BIDDING_CLOSED", description: `Bidding closed automatically after the deadline with ${bidCount} bid(s)` });

    await notifyAdmins("bidding_closed", "Bidding Closed", `Bidding for "${project.title}" closed on its deadline with ${bidCount} bid(s). It is ready for evaluation.`, "/admin/bid-evaluation", project.id);
    await notifySchoolHeads("bidding_closed", "Bidding Closed", `Bidding for "${project.title}" has closed with ${bidCount} bid(s).`, "/school-head", project.id);
    for (const bid of bids) {
      await createNotification({ recipientId: bid.supplier_id, type: "bidding_closed", title: "Bidding Closed", message: `Bidding for "${project.title}" has closed. Your bid is now awaiting evaluation.`, link: "/supplier/bids", relatedId: project.id });
    }

    try { publishEvent("project_closed", { id: project.id, title: project.title, status: "closed" }); } catch { /* non-fatal */ }
  }
  return closed;
}

/** Remind eligible suppliers who have not bid yet that a deadline is near. */
export async function sendDeadlineReminders(): Promise<number> {
  const now = new Date();
  const todayKey = localDateKey(now);
  const tomorrowKey = localDateKey(new Date(now.getTime() + DAY_MS));
  const reminderKeys = new Set(Array.from({ length: DEADLINE_REMINDER_DAYS + 1 }, (_, i) => localDateKey(new Date(now.getTime() + i * DAY_MS))));

  // Rough DB filter, exact day match below.
  const projects = await db.project.findMany({
    where: {
      status: "active",
      is_archived: false,
      deadline: { gte: new Date(now.getTime() - 2 * DAY_MS), lte: new Date(now.getTime() + (DEADLINE_REMINDER_DAYS + 2) * DAY_MS) },
    },
    include: { project_business_types: { include: { business_type: true } }, bids: { select: { supplier_id: true } } },
  });
  const dueProjects = projects.filter((p) => reminderKeys.has(dbDateKey(p.deadline)));
  if (!dueProjects.length) return 0;

  const suppliers = await db.user.findMany({
    where: { role: "supplier", verification_status: "verified", is_active: true },
    select: { id: true, supplier_business_types: { include: { business_type: true } } },
  });

  let sent = 0;
  for (const project of dueProjects) {
    const deadlineKey = dbDateKey(project.deadline);
    const when = deadlineKey === todayKey ? "today" : deadlineKey === tomorrowKey ? "tomorrow" : `on ${formatDate(project.deadline)}`;
    const bidderIds = new Set(project.bids.map((b) => b.supplier_id));
    const projectBTNames = project.project_business_types.map((pbt) => pbt.business_type?.name).filter(Boolean) as string[];
    let sentForProject = 0;

    for (const supplier of suppliers) {
      if (bidderIds.has(supplier.id)) continue;
      const supplierBTNames = supplier.supplier_business_types.map((s) => s.business_type?.name).filter(Boolean) as string[];
      if (!canSupplierAccessProject(supplierBTNames, projectBTNames, project.open_to_all ?? true, project.procurement_type)) continue;
      if (await alreadyNotified(supplier.id, "deadline_reminder", project.id)) continue;

      await createNotification({ recipientId: supplier.id, type: "deadline_reminder", title: "Bidding Deadline Approaching", message: `Bidding for "${project.title}" closes ${when}. Submit your bid before the deadline.`, link: "/supplier/projects", relatedId: project.id });
      sentForProject++;
    }

    if (sentForProject) {
      sent += sentForProject;
      await logAudit("DEADLINE_REMINDER", null, `Sent bidding deadline reminders for ${project.title} to ${sentForProject} supplier(s)`, "project", project.id);
    }
  }
  return sent;
}

const DOCUMENT_FIELDS = [
  { field: "mayors_permit_expiry", label: "Mayor's Permit" },
  { field: "tax_clearance_expiry", label: "Tax Clearance" },
  { field: "philgeps_registration_expiry", label: "PhilGEPS Registration" },
  { field: "iso_certificate_expiry", label: "ISO Certificate" },
] as const;

/** Warn suppliers (and admins) about documents expiring within 30 days or that just expired. */
export async function sendDocumentExpiryReminders(): Promise<number> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - DOCUMENT_WARNING_DAYS * DAY_MS); // recently expired
  const windowEnd = new Date(now.getTime() + DOCUMENT_WARNING_DAYS * DAY_MS); // expiring soon

  const suppliers = await db.user.findMany({
    where: {
      role: "supplier",
      is_active: true,
      OR: DOCUMENT_FIELDS.map(({ field }) => ({ [field]: { gte: windowStart, lte: windowEnd } })),
    },
    select: { id: true, full_name: true, company_name: true, mayors_permit_expiry: true, tax_clearance_expiry: true, philgeps_registration_expiry: true, iso_certificate_expiry: true },
  });

  let sent = 0;
  for (const supplier of suppliers) {
    for (const { field, label } of DOCUMENT_FIELDS) {
      const expiry = supplier[field];
      if (!expiry || expiry < windowStart || expiry > windowEnd) continue;

      const expired = expiry < now;
      const type = expired ? "document_expired" : "document_expiring";
      const relatedId = `${field}:${new Date(expiry).toISOString().slice(0, 10)}`; // once per document per expiry date
      if (await alreadyNotified(supplier.id, type, relatedId)) continue;

      const dateText = new Date(expiry).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric", timeZone: TIME_ZONE });
      await createNotification({
        recipientId: supplier.id,
        type,
        title: expired ? `${label} Expired` : `${label} Expiring Soon`,
        message: expired
          ? `Your ${label} expired on ${dateText}. Please upload a renewed copy to keep bidding.`
          : `Your ${label} expires on ${dateText}. Please renew it before it expires.`,
        link: "/supplier/documents",
        relatedId,
      });
      if (expired) {
        const name = supplier.company_name || supplier.full_name;
        await notifyAdmins("document_expired", "Supplier Document Expired", `${name}'s ${label} expired on ${dateText}.`, "/admin/suppliers", supplier.id);
      }
      await logAudit("DOCUMENT_EXPIRY_NOTICE", null, `${label} ${expired ? "expired" : "expiring"} notice sent to ${supplier.company_name || supplier.full_name}`, "user", supplier.id);
      sent++;
    }
  }
  return sent;
}

/** Tell admins when an awarded project's public result posting period ends. */
export async function notifyExpiredPublicResults(): Promise<number> {
  const today = todayAsDbDate();

  const projects = await db.project.findMany({
    where: { status: "awarded", is_archived: false, public_result_expiry_date: { lt: today } },
    select: { id: true, title: true, public_result_expiry_date: true },
  });
  if (!projects.length) return 0;

  const admins = await db.user.findMany({ where: { role: "admin", is_active: true }, select: { id: true } });
  let notified = 0;
  for (const project of projects) {
    let sentForProject = 0;
    for (const admin of admins) {
      if (await alreadyNotified(admin.id, "result_expired", project.id)) continue;
      await createNotification({ recipientId: admin.id, type: "result_expired", title: "Public Result Posting Ended", message: `The public result for "${project.title}" expired on ${formatDate(project.public_result_expiry_date!)}. You may archive the project.`, link: "/admin/projects", relatedId: project.id });
      sentForProject++;
    }
    if (sentForProject) {
      notified++;
      await logAudit("RESULT_POSTING_ENDED", null, `Public result posting period ended for ${project.title}`, "project", project.id);
    }
  }
  return notified;
}

export const JOBS = [
  { name: "close_expired_projects", description: "Close bidding after the deadline and notify admins, school heads and bidders", run: closeExpiredProjects },
  { name: "deadline_reminders", description: `Remind suppliers ${DEADLINE_REMINDER_DAYS} day before a bidding deadline`, run: sendDeadlineReminders },
  { name: "document_expiry_reminders", description: `Warn suppliers about documents expiring within ${DOCUMENT_WARNING_DAYS} days`, run: sendDocumentExpiryReminders },
  { name: "expired_public_results", description: "Notify admins when a public result posting period ends", run: notifyExpiredPublicResults },
] as const;

export type JobResult = { ok: true; count: number } | { ok: false; error: string };

/** Run every job; one failing job does not stop the others. */
export async function runAllJobs(): Promise<Record<string, JobResult>> {
  const results: Record<string, JobResult> = {};
  for (const job of JOBS) {
    try {
      results[job.name] = { ok: true, count: await job.run() };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[cron] job ${job.name} failed:`, message);
      results[job.name] = { ok: false, error: message };
    }
  }
  return results;
}
