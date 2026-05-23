import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit } from "@/lib/actions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const bid = await db.bid.findUnique({ where: { id }, include: { project: true, supplier: true } });
  if (!bid) return json({ error: "Bid not found" }, 404);

  const body = await request.json();
  const data: Record<string, unknown> = {};

  let tc = body.technical_compliance ?? body.is_technically_compliant;
  if (tc !== undefined) {
    if (typeof tc === "string") tc = ["true", "1", "yes", "compliant"].includes(tc.trim().toLowerCase());
    else tc = Boolean(tc);
    data.technical_compliance = tc;
  }

  if (body.evaluation_remarks !== undefined) data.evaluation_remarks = body.evaluation_remarks;
  if (bid.status === "submitted") data.status = "under_evaluation";

  await db.bid.update({ where: { id }, data });

  // Recalculate ranks
  const allBids = await db.bid.findMany({ where: { project_id: bid.project_id }, select: { id: true, bid_amount: true, submitted_at: true } });
  const sorted = [...allBids].sort((a, b) => Number(a.bid_amount) - Number(b.bid_amount) || a.submitted_at.getTime() - b.submitted_at.getTime());
  for (let i = 0; i < sorted.length; i++) {
    await db.bid.update({ where: { id: sorted[i].id }, data: { rank: i + 1 } });
  }

  await logAudit("UPDATE", user!.id, `Updated evaluation remarks for bid for ${bid.project.title} by ${bid.supplier.full_name}`, "bid", id);

  const updated = await db.bid.findUnique({ where: { id }, include: { project: true, supplier: { select: { id: true, full_name: true, email: true, company_name: true } } } });
  return json(updated);
}
