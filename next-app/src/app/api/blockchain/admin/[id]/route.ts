import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const record = await db.blockchainRecord.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, title: true, procurement_type: true, budget: true } },
      bid: { select: { id: true, bid_amount: true, company_name: true } },
      winner: { select: { id: true, full_name: true, company_name: true, email: true } },
    },
  });

  if (!record) return json({ error: "Record not found" }, 404);
  return json(record);
}
