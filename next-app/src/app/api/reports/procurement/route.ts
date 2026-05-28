import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const [total_projects, active_projects, awarded_projects, total_bids] = await Promise.all([
    db.project.count(),
    db.project.count({ where: { status: "active" } }),
    db.project.count({ where: { status: "awarded" } }),
    db.bid.count(),
  ]);

  const totalAwardedResult = await db.blockchainRecord.aggregate({ _sum: { bid_amount: true } });
  const total_awarded_amount = Number(totalAwardedResult._sum.bid_amount || 0);

  const byType = await db.project.groupBy({ by: ["procurement_type"], _count: { id: true }, orderBy: { procurement_type: "asc" } });
  const by_procurement_type = byType.map((row: any) => ({ procurement_type: row.procurement_type, count: row._count.id }));

  const recentAwards = await db.blockchainRecord.findMany({
    take: 10,
    orderBy: { recorded_at: "desc" },
    include: { project: { select: { title: true } }, winner: { select: { full_name: true, company_name: true } } },
  });
  const recent_awards = recentAwards.map((row: any) => ({
    project__title: row.project.title,
    winner__full_name: row.winner.full_name,
    winner__company_name: row.winner.company_name,
    bid_amount: Number(row.bid_amount),
    recorded_at: row.recorded_at,
  }));

  return json({
    summary: { total_projects, active_projects, awarded_projects, total_bids, total_awarded_amount },
    by_procurement_type,
    recent_awards,
  });
}
