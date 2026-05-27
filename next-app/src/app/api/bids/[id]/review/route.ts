import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit } from "@/lib/actions";
import { publishEvent } from "@/lib/sse";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const bid = await db.bid.findUnique({ where: { id }, include: { project: true, supplier: true } });
  if (!bid) return json({ error: "Bid not found" }, 404);

  await db.bid.update({ where: { id }, data: { status: "under_evaluation" } });
  await logAudit("UPDATE", user!.id, `Marked bid from ${bid.supplier.full_name} for ${bid.project.title} under review`, "bid", id);

  const updated = await db.bid.findUnique({ where: { id }, include: { project: true, supplier: { select: { id: true, full_name: true, email: true, company_name: true } } } });
  try {
    publishEvent("bid_updated", { id: updated.id, project_id: updated.project_id, supplier_id: updated.supplier_id, status: updated.status });
  } catch (e) {
    // non-fatal
  }
  return json(updated);
}
