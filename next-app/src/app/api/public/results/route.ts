import { db } from "@/lib/db";
import { json } from "@/lib/api-utils";

export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const projects = await db.project.findMany({
    where: { status: "awarded" },
    include: { bids: { where: { status: "won" }, include: { supplier: { select: { full_name: true, company_name: true } } } } },
    orderBy: [{ awarded_at: "desc" }, { updated_at: "desc" }],
  });

  const results = [];
  for (const project of projects) {
    if (project.public_result_expiry_date && new Date(project.public_result_expiry_date) < today) continue;
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
