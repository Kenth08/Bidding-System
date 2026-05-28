import { db } from "@/lib/db";
import { json } from "@/lib/api-utils";

export async function GET() {
  const records = await db.blockchainRecord.findMany({
    include: {
      project: { select: { id: true, title: true, procurement_type: true, budget: true } },
      winner: { select: { id: true, full_name: true, company_name: true } },
    },
    orderBy: { recorded_at: "desc" },
  });

  // Public view: no hash exposed
  const publicRecords = records.map((record: any) => {
    const { hash, ...safeRecord } = record;
    return safeRecord;
  });
  return json(publicRecords);
}
