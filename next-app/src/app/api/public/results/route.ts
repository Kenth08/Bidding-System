import { db } from "@/lib/db";
import { json } from "@/lib/api-utils";

export async function GET() {
  try {
    const results: any[] = [];
    const seenProjectIds = new Set<string>();

    // 1. Get blockchain records (if any exist)
    try {
      const blockchainAwards = await db.blockchainRecord.findMany({
        include: {
          project: { select: { id: true, title: true, procurement_type: true, budget: true, deadline: true, public_result_expiry_date: true, awarded_at: true, updated_at: true } },
          winner: { select: { full_name: true, company_name: true } },
          bid: { select: { bid_amount: true, submitted_at: true, company_name: true } },
        },
        orderBy: { recorded_at: "desc" },
      });

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
          verificationHash: record.hash || null,
          winner: {
            supplier_name: record.winner?.company_name || record.winner?.full_name || record.bid?.company_name || "—",
            bid_amount: Number(record.bid?.bid_amount || 0),
            submitted_at: record.bid?.submitted_at,
          },
        });
      }
    } catch (e) {
      console.error("[public results] blockchain query error:", e);
    }

    // 2. Get awarded projects (fallback / additional)
    try {
      const projects = await db.project.findMany({
        where: { status: "awarded" },
        orderBy: [{ awarded_at: "desc" }, { updated_at: "desc" }],
      });

      for (const project of projects) {
        if (seenProjectIds.has(project.id)) continue;

        // Fetch winning bid separately to avoid nested include issues
        const winningBid = await db.bid.findFirst({ where: { project_id: project.id, status: "won" } });
        if (!winningBid) continue;

        // Fetch supplier separately
        let supplierName = winningBid.company_name || "—";
        try {
          const supplier = await db.user.findUnique({ where: { id: winningBid.supplier_id } });
          if (supplier) {
            supplierName = supplier.company_name || supplier.full_name || winningBid.company_name || "—";
          }
        } catch { /* use bid company_name */ }

        results.push({
          project_id: project.id,
          project_title: project.title,
          budget: Number(project.budget || 0),
          procurement_type: project.procurement_type,
          deadline: project.deadline,
          public_result_expiry_date: project.public_result_expiry_date,
          awarded_at: project.awarded_at || project.updated_at,
          verificationHash: null,
          winner: {
            supplier_name: supplierName,
            bid_amount: Number(winningBid.bid_amount || 0),
            submitted_at: winningBid.submitted_at,
          },
        });
      }
    } catch (e) {
      console.error("[public results] awarded projects query error:", e);
    }

    return json(results);
  } catch (error) {
    console.error("[public results error]", error);
    return json({ error: "Failed to load results" }, 500);
  }
}
