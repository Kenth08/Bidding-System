import { db } from "@/lib/db";
import { json } from "@/lib/api-utils";

export async function GET(_request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project || project.status !== "awarded") {
      return json({ error: "Result not found" }, 404);
    }

    // Get winning bid
    const winningBid = await db.bid.findFirst({ where: { project_id: projectId, status: "won" } });
    if (!winningBid) return json({ error: "Result not found" }, 404);

    // Get supplier (public fields only)
    let supplierName = winningBid.company_name || "—";
    try {
      const supplier = await db.user.findUnique({ where: { id: winningBid.supplier_id } });
      if (supplier) supplierName = supplier.company_name || supplier.full_name || supplierName;
    } catch { /* fallback */ }

    // Get blockchain record if exists
    let verificationHash: string | null = null;
    try {
      const record = await db.blockchainRecord.findFirst({ where: { project_id: projectId } });
      if (record) verificationHash = record.hash || null;
    } catch { /* no record */ }

    // Get audit timeline from bid activity logs
    let timeline: { action: string; description: string; created_at: string }[] = [];
    try {
      const logs = await db.bidActivityLog.findMany({
        where: { project_id: projectId },
        orderBy: { created_at: "asc" },
      });
      timeline = (logs || []).map((l: any) => ({
        action: l.action,
        description: l.description || "",
        created_at: l.created_at,
      }));
    } catch { /* no logs */ }

    return json({
      project_id: project.id,
      project_title: project.title,
      description: project.requirements || project.technical_specifications || "",
      procurement_type: project.procurement_type,
      budget: Number(project.budget || 0),
      deadline: project.deadline,
      awarded_at: project.awarded_at || project.updated_at,
      status: project.status,
      winner: {
        supplier_name: supplierName,
        bid_amount: Number(winningBid.bid_amount || 0),
        submitted_at: winningBid.submitted_at,
      },
      verificationHash,
      timeline,
    });
  } catch (error) {
    console.error("[public results detail error]", error);
    return json({ error: "Failed to load result details" }, 500);
  }
}
