import { db } from "@/lib/db";
import { json } from "@/lib/api-utils";

export async function GET() {
  const blockchainAwards = await db.blockchainRecord.findMany({
    include: {
      project: { select: { id: true, title: true, procurement_type: true, budget: true, deadline: true, public_result_expiry_date: true, awarded_at: true, updated_at: true } },
      winner: { select: { full_name: true, company_name: true } },
      bid: { select: { bid_amount: true, submitted_at: true, company_name: true } },
    },
    orderBy: { recorded_at: "desc" },
  });

  const results: any[] = [];
  const seenProjectIds = new Set<string>();

  for (const record of blockchainAwards) {
    if (!record.project) continue;

    seenProjectIds.add(record.project.id);
    results.push({
      project_id: record.project.id,
      project_title: record.project.title,
      budget: Number(record.project.budget || 0),
      procurement_type: record.project.procurement_type,
      deadline: record.project.deadline,
      public_result_expiry_date: record.project.public_result_expiry_date,
      awarded_at: record.project.awarded_at || record.recorded_at || record.project.updated_at,
      winner: {
        supplier_name: record.winner?.company_name || record.winner?.full_name || record.bid?.company_name || "—",
        bid_amount: Number(record.bid?.bid_amount || 0),
        submitted_at: record.bid?.submitted_at,
      },
    });
  }

  const projects = await db.project.findMany({
    where: { status: "awarded" },
    include: { bids: { where: { status: "won" }, include: { supplier: { select: { full_name: true, company_name: true } } } } },
    orderBy: [{ awarded_at: "desc" }, { updated_at: "desc" }],
  });

  for (const project of projects) {
    if (seenProjectIds.has(project.id)) continue;

    const winningBid = project.bids[0];
    if (!winningBid) continue;

    results.push({
      project_id: project.id,
      project_title: project.title,
      budget: Number(project.budget || 0),
      procurement_type: project.procurement_type,
      deadline: project.deadline,
      public_result_expiry_date: project.public_result_expiry_date,
      awarded_at: project.awarded_at || project.updated_at,
      winner: {
        supplier_name: winningBid.supplier.company_name || winningBid.supplier.full_name || winningBid.company_name,
        bid_amount: Number(winningBid.bid_amount),
        submitted_at: winningBid.submitted_at,
      },
    });
  }

  return json(results);
}
