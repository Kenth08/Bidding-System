import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const records = await db.blockchainRecord.findMany({
    include: {
      project: { select: { id: true, title: true, procurement_type: true, budget: true } },
      bid: { select: { id: true, bid_amount: true, company_name: true } },
      winner: { select: { id: true, full_name: true, company_name: true, email: true } },
    },
    orderBy: { recorded_at: "desc" },
  });

  return json(records);
}
