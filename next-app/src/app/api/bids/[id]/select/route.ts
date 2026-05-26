import { db } from "@/lib/db";
import { v4 as uuid } from "uuid";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit, notifyUser } from "@/lib/actions";
import hashlib from "crypto";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const bid = await db.bid.findUnique({ where: { id }, include: { project: true, supplier: true } });
  if (!bid) return json({ error: "Bid not found" }, 404);

  if (!bid.technical_compliance) {
    return json({ error: "Cannot select winner. This bid is not technically compliant. Please evaluate and mark as compliant first." }, 400);
  }

  if (bid.project.status === "awarded") {
    return json({ error: "Bidding is already completed for this project. A winner has already been selected." }, 400);
  }

  const existingWinner = await db.bid.findFirst({ where: { project_id: bid.project_id, status: "won", NOT: { id } } });
  if (existingWinner) {
    return json({ error: "Bidding is already completed for this project. A winner has already been selected." }, 400);
  }

  // Mark all other bids as lost
  await db.bid.updateMany({ where: { project_id: bid.project_id, NOT: { id } }, data: { status: "lost" } });

  // Mark this bid as won
  await db.bid.update({ where: { id }, data: { status: "won" } });

  // Update project to awarded
  await db.project.update({ where: { id: bid.project_id }, data: { status: "awarded", awarded_at: new Date() } });

  // Create blockchain record if not exists
  const existingRecord = await db.blockchainRecord.findFirst({ where: { project_id: bid.project_id } });
  if (!existingRecord) {
    const raw = `${bid.project_id}${bid.supplier_id}${bid.bid_amount}${Date.now()}`;
    const hashValue = "0x" + hashlib.createHash("sha256").update(raw).digest("hex");
    const projectRef = `PRJ-${bid.project_id.slice(0, 6).toUpperCase()}`;

    await db.blockchainRecord.create({
      data: { id: uuid(), project_id: bid.project_id, bid_id: id, winner_id: bid.supplier_id, bid_amount: bid.bid_amount, hash: hashValue, project_ref_id: projectRef },
    });
    await db.bid.update({ where: { id }, data: { recorded: true } });
  }

  // Recalculate ranks
  const allBids = await db.bid.findMany({ where: { project_id: bid.project_id }, select: { id: true, bid_amount: true, submitted_at: true } });
  const sorted = [...allBids].sort((a, b) => Number(a.bid_amount) - Number(b.bid_amount) || a.submitted_at.getTime() - b.submitted_at.getTime());
  for (let i = 0; i < sorted.length; i++) {
    await db.bid.update({ where: { id: sorted[i].id }, data: { rank: i + 1 } });
  }

  await logAudit("SELECT_WINNER", user!.id, `Selected winner for ${bid.project.title}: ${bid.supplier.full_name}`, "bid", id);

  // Notify winner
  await notifyUser(bid.supplier_id, "bid_won", "Congratulations! Your Bid Won", `Your bid of ₱${Number(bid.bid_amount).toLocaleString()} was selected as the winner for ${bid.project.title}.`, "/supplier/bids", id);

  // Notify losers
  const losingBids = await db.bid.findMany({ where: { project_id: bid.project_id, NOT: { id } }, include: { supplier: true } });
  for (const lb of losingBids) {
    await notifyUser(lb.supplier_id, "bid_lost", "Bid Result", `Your bid for ${bid.project.title} was not selected. Thank you for participating.`, "/supplier/bids", lb.id);
  }

  const updated = await db.bid.findUnique({ where: { id }, include: { project: true, supplier: { select: { id: true, full_name: true, email: true, company_name: true } } } });
  return json(updated);
}
