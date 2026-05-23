import { db } from "@/lib/db";
import { json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const hashValue = (url.searchParams.get("hash") || "").trim();
  if (!hashValue) return json({ error: "Please provide a hash value." }, 400);

  const record = await db.blockchainRecord.findUnique({
    where: { hash: hashValue },
    include: {
      project: { select: { title: true } },
      winner: { select: { full_name: true, company_name: true } },
    },
  });

  if (!record) {
    return json({ verified: false, message: "No record found for this hash. This record may be invalid or tampered." }, 404);
  }

  return json({
    verified: true,
    project_title: record.project.title,
    project_ref_id: record.project_ref_id,
    winner_name: record.winner.full_name,
    winner_company: record.winner.company_name,
    bid_amount: Number(record.bid_amount),
    recorded_at: record.recorded_at,
    message: "This record is authentic and has not been tampered with.",
  });
}
