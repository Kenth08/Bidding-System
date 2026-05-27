import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";
import { logAudit, notifyAdmins } from "@/lib/actions";
import { publishEvent } from "@/lib/sse";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

function recalculateRanks(bids: { id: string; bid_amount: unknown; submitted_at: Date }[]) {
  const sorted = [...bids].sort((a, b) => Number(a.bid_amount) - Number(b.bid_amount) || a.submitted_at.getTime() - b.submitted_at.getTime());
  return sorted.map((b, i) => ({ id: b.id, rank: i + 1 }));
}

async function saveFile(file: File, folder: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || ".bin";
  const filename = `${uuid()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

function parseBoolean(value: unknown) {
  return value === true || value === "true" || value === "1" || value === "on";
}

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const url = new URL(request.url);
  const projectId = url.searchParams.get("project");

  if (user!.role === "admin") {
    const where: Record<string, unknown> = {};
    if (projectId) where.project_id = projectId;
    const bids = await db.bid.findMany({
      where,
      include: { project: true, supplier: { select: { id: true, full_name: true, email: true, company_name: true, verification_status: true } } },
      orderBy: [{ bid_amount: "asc" }, { submitted_at: "asc" }],
    });
    return json(bids);
  }

  if (user!.role === "supplier") {
    const bids = await db.bid.findMany({
      where: { supplier_id: user!.id },
      include: { project: true },
      orderBy: { submitted_at: "desc" },
    });
    return json(bids);
  }

  return json([]);
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  if (user!.role !== "supplier") {
    return json({ error: "Only suppliers can submit bids." }, 403);
  }

  const contentType = request.headers.get("content-type") || "";
  let body: Record<string, any> = {};
  let quotationDocument: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    body = Object.fromEntries(formData.entries()) as Record<string, any>;
    const file = formData.get("quotation_document");
    if (file instanceof File && file.size > 0) {
      quotationDocument = await saveFile(file, "bids");
    } else if (typeof body.quotation_document === "string") {
      quotationDocument = body.quotation_document;
    }
  } else {
    body = await request.json();
    quotationDocument = body.quotation_document || body.quotation_file || null;
  }

  const projectId = String(body.project || body.project_id || "").trim();
  const bidAmount = Number(body.bid_amount);
  const proposal = String(body.proposal || "").trim();
  const noConflictOfInterest = parseBoolean(body.no_conflict_of_interest);
  const conflictOfInterestPerson = String(body.conflict_of_interest_person || "").trim();
  const noPastScmIssues = parseBoolean(body.no_past_scm_issues);

  if (!projectId) return json({ project: "Project is required." }, 400);

  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return json({ project: "Project not found." }, 400);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (project.deadline && new Date(project.deadline) < today) {
    return json({ error: `Bidding is closed. The deadline was ${project.deadline}.` }, 403);
  }
  if (project.status !== "active") {
    return json({ project: "Bidding is closed for this project." }, 403);
  }

  if (!Number.isFinite(bidAmount) || bidAmount <= 0) return json({ bid_amount: "Enter a valid bid amount." }, 400);
  if (!proposal) return json({ proposal: "Proposal is required." }, 400);
  if (!quotationDocument) return json({ quotation_document: "Quotation document is required." }, 400);

  if (!noConflictOfInterest) {
    if (!conflictOfInterestPerson) {
      return json({ conflict_of_interest_person: "Name the person if you have a relationship with the committee or school administration." }, 400);
    }
  }

  if (!noPastScmIssues) {
    return json({ past_scm_practices: "Bids cannot be submitted if you have past SCM blacklisting or penalty issues." }, 403);
  }

  const existing = await db.bid.findUnique({ where: { project_id_supplier_id: { project_id: projectId, supplier_id: user!.id } } });
  if (existing) return json({ project: "You have already submitted a bid for this project." }, 409);

  const bid = await db.bid.create({
    data: {
      id: uuid(),
      project_id: projectId,
      supplier_id: user!.id,
      company_name: user!.company_name || "",
      bid_amount: bidAmount,
      proposal,
      quotation_file: quotationDocument,
      quotation_document: quotationDocument,
      technical_proposal: body.technical_proposal || null,
      supporting_documents: body.supporting_documents || null,
      no_conflict_of_interest: noConflictOfInterest,
      conflict_of_interest_person: noConflictOfInterest ? null : conflictOfInterestPerson,
      no_past_scm_issues: noPastScmIssues,
      status: "submitted",
    },
  });

  // Recalculate ranks
  const allBids = await db.bid.findMany({ where: { project_id: projectId }, select: { id: true, bid_amount: true, submitted_at: true } });
  const ranked = recalculateRanks(allBids);
  for (const r of ranked) {
    await db.bid.update({ where: { id: r.id }, data: { rank: r.rank } });
  }

  await logAudit("SUBMIT_BID", user!.id, `Submitted bid for ${project.title}`, "bid", project.id);
  await notifyAdmins("new_bid", "New Bid Submitted", `${user!.company_name || user!.full_name} submitted a bid of ₱${bidAmount.toLocaleString()} on ${project.title}.`, `/admin/bid-evaluation?project=${project.id}`, bid.id);

  // publish SSE for real-time clients
  try {
    publishEvent("bid_created", { id: bid.id, project_id: projectId, supplier_id: user!.id, bid_amount: Number(bidAmount), project_title: project.title });
  } catch (e) {
    // non-fatal
  }

  return json(bid, 201);
}
