import { db } from "@/lib/db";
import { json } from "@/lib/api-utils";

export async function GET() {
  const [total_projects, active_bidding] = await Promise.all([
    db.project.count(),
    db.project.count({ where: { status: "active" } }),
  ]);

  return json({ total_projects, active_bidding });
}
