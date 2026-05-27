import { db } from "@/lib/db";
import { v4 as uuid } from "uuid";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit, notifySuppliers, notifyUser } from "@/lib/actions";
import { publishEvent } from "@/lib/sse";
import hashlib from "crypto";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const bid = await db.bid.findUnique({ where: { id }, include: { project: true, supplier: true } });
  if (!bid) return json({ error: "Bid not found" }, 404);

  // Allow selecting a winner only when the bid is qualified (technical_compliance)
  // or when the supplier account is verified. Qualification is the preferred
  // gate for awarding; supplier verification is an alternate path.
  if (!(bid.technical_compliance || bid.supplier?.verification_status === "verified")) {
    return json({ error: "Cannot select winner. The bid must be qualified or the supplier must be verified before selecting a winner." }, 400);
  }

  // Only allow selecting a winner after bidding has closed.
  if (bid.project.status !== "closed") {
    return json({ error: "Winner selection is only allowed after bidding is closed." }, 400);
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
  } else {
    await db.blockchainRecord.update({
      where: { id: existingRecord.id },
      data: {
        bid_id: id,
        winner_id: bid.supplier_id,
        bid_amount: bid.bid_amount,
        project_ref_id: existingRecord.project_ref_id || `PRJ-${bid.project_id.slice(0, 6).toUpperCase()}`,
      },
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

  await notifySuppliers(
    "bid_result_finalized",
    "Bid Result Released",
    `Bid results for ${bid.project.title} are now finalized. Winner: ${bid.supplier.full_name}.`,
    "/supplier/results",
    id
  );

  // Publish SSE updates for winner and losers so clients update in real-time
  try {
    const updated = await db.bid.findUnique({ where: { id }, include: { project: true, supplier: { select: { id: true, full_name: true, email: true, company_name: true } } } });
    if (updated) publishEvent("bid_updated", { id: updated.id, project_id: updated.project_id, supplier_id: updated.supplier_id, status: updated.status, technical_compliance: Boolean(updated.technical_compliance) });
    for (const lb of losingBids) {
      publishEvent("bid_updated", { id: lb.id, project_id: lb.project_id, supplier_id: lb.supplier_id, status: lb.status, technical_compliance: Boolean(lb.technical_compliance) });
    }
  } catch (e) {
    // non-fatal
  }

  const updatedFinal = await db.bid.findUnique({ where: { id }, include: { project: true, supplier: { select: { id: true, full_name: true, email: true, company_name: true } } } });
  return json(updatedFinal);
}
