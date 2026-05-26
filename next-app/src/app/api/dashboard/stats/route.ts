import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const [total_projects, total_bids, active_bidding, awarded_contracts] = await Promise.all([
    db.project.count(),
    db.bid.count(),
    db.project.count({ where: { status: "active" } }),
    db.project.count({ where: { status: "awarded" } }),
  ]);

  return json({ total_projects, total_bids, active_bidding, awarded_contracts });
}
