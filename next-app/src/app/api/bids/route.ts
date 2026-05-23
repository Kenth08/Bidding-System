import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";
import { logAudit, notifyAdmins } from "@/lib/actions";

function recalculateRanks(bids: { id: string; bid_amount: unknown; submitted_at: Date }[]) {
  const sorted = [...bids].sort((a, b) => Number(a.bid_amount) - Number(b.bid_amount) || a.submitted_at.getTime() - b.submitted_at.getTime());
  return sorted.map((b, i) => ({ id: b.id, rank: i + 1 }));
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
      include: { project: true, supplier: { select: { id: true, full_name: true, email: true, company_name: true } } },
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

  if (user!.role !== "supplier" || !["approved", "active"].includes(user!.status)) {
    return json({ error: "Only approved suppliers can submit bids." }, 403);
  }

  const body = await request.json();
  const projectId = body.project || body.project_id;
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

  const existing = await db.bid.findUnique({ where: { project_id_supplier_id: { project_id: projectId, supplier_id: user!.id } } });
  if (existing) return json({ project: "You have already submitted a bid for this project." }, 400);

  const bid = await db.bid.create({
    data: {
      id: uuid(),
      project_id: projectId,
      supplier_id: user!.id,
      company_name: user!.company_name || "",
      bid_amount: body.bid_amount,
      proposal: body.proposal || "",
      quotation_file: body.quotation_file || null,
      technical_proposal: body.technical_proposal || null,
      supporting_documents: body.supporting_documents || null,
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
  await notifyAdmins("new_bid", "New Bid Submitted", `${user!.company_name || user!.full_name} submitted a bid of ₱${Number(body.bid_amount).toLocaleString()} on ${project.title}.`, `/admin/bid-evaluation?project=${project.id}`, bid.id);

  return json(bid, 201);
}
