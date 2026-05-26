import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

function buildPayload(bid: { bid_amount: unknown; updated_at: Date; company_name: string; supplier: { full_name: string; company_name: string }; project: { id: string; title: string; procurement_type: string; budget: unknown; delivery_period: number } }, docType: string) {
  const refMap: Record<string, string> = { "Notice of Award": "NOA", "Notice to Proceed": "NTP", "Resolution to Award": "RES" };
  const prefix = refMap[docType] || "DOC";
  const savings = Math.max(Number(bid.project.budget || 0) - Number(bid.bid_amount), 0);
  return {
    document_type: docType,
    reference: `${prefix}-${bid.project.id.slice(0, 8).toUpperCase()}`,
    project_title: bid.project.title,
    procurement_type: bid.project.procurement_type,
    supplier_name: bid.supplier.full_name,
    company_name: bid.company_name || bid.supplier.company_name,
    bid_amount: Number(bid.bid_amount),
    budget: Number(bid.project.budget || 0),
    award_date: bid.updated_at.toISOString().split("T")[0],
    proceed_date: bid.updated_at.toISOString().split("T")[0],
    resolution_date: bid.updated_at.toISOString().split("T")[0],
    delivery_period: bid.project.delivery_period,
    savings,
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const bid = await db.bid.findFirst({ where: { id, status: "won" }, include: { project: true, supplier: true } });
  if (!bid) return json({ error: "Bid not found or not selected" }, 404);

  return json(buildPayload(bid, "Notice of Award"));
}
