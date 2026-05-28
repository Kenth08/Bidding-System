import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const records = await db.blockchainRecord.findMany({
    where: { winner_id: user!.id },
    include: {
      project: { select: { id: true, title: true, procurement_type: true, budget: true } },
      winner: { select: { id: true, full_name: true, company_name: true } },
    },
    orderBy: { recorded_at: "desc" },
  });

  // No hash exposed for supplier view
  const safeRecords = records.map((record: any) => {
    const { hash, ...safeRecord } = record;
    return safeRecord;
  });
  return json(safeRecords);
}
