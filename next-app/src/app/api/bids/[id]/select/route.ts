import { db } from "@/lib/db";
import { v4 as uuid } from "uuid";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit, notifySuppliers, notifyUser } from "@/lib/actions";
import { createBidLog } from "@/lib/bid-log";
import { publishEvent } from "@/lib/sse";
import { ethers } from "ethers";
import { getProcureChainContract } from "@/lib/blockchain";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const bid = await db.bid.findUnique({ where: { id }, include: { project: true, supplier: true } });
  if (!bid) return json({ error: "Bid not found" }, 404);

  // Allow selecting a winner only when the bid is qualified (technical_compliance=true).
  // Unqualified bids cannot be selected as winner.
  if (!bid.technical_compliance) {
    return json({ error: "Cannot select winner. The bid must be qualified (technically compliant) before selecting a winner." }, 400);
  }

  // Only allow selecting a winner after bidding has closed.
  // Auto-close the project if the deadline has passed but status wasn't updated yet.
  if (bid.project.status === "active") {
    const deadline = new Date(bid.project.deadline);
    deadline.setHours(0, 0, 0, 0);
    if (deadline < new Date()) {
      await db.project.update({ where: { id: bid.project_id }, data: { status: "closed" } });
    } else {
      return json({ error: "Winner selection is only allowed after bidding is closed." }, 400);
    }
  } else if (bid.project.status !== "closed") {
    return json({ error: "Winner selection is only allowed after bidding is closed." }, 400);
  }

  const existingWinner = await db.bid.findFirst({ where: { project_id: bid.project_id, status: "won", id: { not: id } } });
  if (existingWinner) {
    return json({ error: "Bidding is already completed for this project. A winner has already been selected." }, 400);
  }

  // Mark all other bids as lost
  await db.bid.updateMany({ where: { project_id: bid.project_id, id: { not: id } }, data: { status: "lost" } });

  // Mark this bid as won
  await db.bid.update({ where: { id }, data: { status: "won" } });

  // Update project to awarded
  await db.project.update({ where: { id: bid.project_id }, data: { status: "awarded", awarded_at: new Date() } });

  // Real blockchain write: anchor the winning bid parameters and document hashes (NOA, NTP, Resolution) on-chain
  const projectRef = `PRJ-${bid.project_id.slice(0, 6).toUpperCase()}`;
  try {
    const contract = getProcureChainContract();

    // Query updated bid to get the exact updated_at timestamp used for document generation
    const updatedBid = await db.bid.findUnique({ where: { id }, include: { project: true, supplier: true } });
    if (!updatedBid) throw new Error("Updated bid not found");

    const amountStr = updatedBid.bid_amount.toString();
    const amountBigInt = ethers.parseUnits(amountStr, 18);

    const savings = Math.max(Number(updatedBid.project.budget || 0) - Number(updatedBid.bid_amount), 0);
    const dateStr = updatedBid.updated_at.toISOString().split("T")[0];
    const companyName = updatedBid.company_name || updatedBid.supplier.company_name;

    const noaPayload = {
      document_type: "Notice of Award",
      reference: `NOA-${updatedBid.project.id.slice(0, 8).toUpperCase()}`,
      project_title: updatedBid.project.title,
      procurement_type: updatedBid.project.procurement_type,
      supplier_name: updatedBid.supplier.full_name,
      company_name: companyName,
      bid_amount: Number(updatedBid.bid_amount),
      budget: Number(updatedBid.project.budget || 0),
      award_date: dateStr,
      proceed_date: dateStr,
      resolution_date: dateStr,
      delivery_period: updatedBid.project.delivery_period,
      savings,
    };

    const ntpPayload = {
      document_type: "Notice to Proceed",
      reference: `NTP-${updatedBid.project.id.slice(0, 8).toUpperCase()}`,
      project_title: updatedBid.project.title,
      procurement_type: updatedBid.project.procurement_type,
      supplier_name: updatedBid.supplier.full_name,
      company_name: companyName,
      bid_amount: Number(updatedBid.bid_amount),
      budget: Number(updatedBid.project.budget || 0),
      award_date: dateStr,
      proceed_date: dateStr,
      resolution_date: dateStr,
      delivery_period: updatedBid.project.delivery_period,
      savings,
    };

    const resolutionPayload = {
      document_type: "Resolution to Award",
      reference: `RES-${updatedBid.project.id.slice(0, 8).toUpperCase()}`,
      project_title: updatedBid.project.title,
      procurement_type: updatedBid.project.procurement_type,
      supplier_name: updatedBid.supplier.full_name,
      company_name: companyName,
      bid_amount: Number(updatedBid.bid_amount),
      budget: Number(updatedBid.project.budget || 0),
      award_date: dateStr,
      proceed_date: dateStr,
      resolution_date: dateStr,
      delivery_period: updatedBid.project.delivery_period,
      savings,
    };

    const noaHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(noaPayload)));
    const ntpHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(ntpPayload)));
    const resolutionHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(resolutionPayload)));

    const tx = await contract.recordAward(
      updatedBid.project_id,
      id,
      updatedBid.supplier_id,
      amountBigInt,
      projectRef,
      noaHash,
      ntpHash,
      resolutionHash
    );

    const receipt = await tx.wait();
    if (!receipt || receipt.status === 0) {
      throw new Error("Transaction reverted on-chain");
    }

    const txHash = tx.hash;

    // Create or update blockchain record in local database
    const existingRecord = await db.blockchainRecord.findFirst({ where: { project_id: updatedBid.project_id } });
    if (!existingRecord) {
      await db.blockchainRecord.create({
        data: {
          id: uuid(),
          project_id: updatedBid.project_id,
          bid_id: id,
          winner_id: updatedBid.supplier_id,
          bid_amount: updatedBid.bid_amount,
          hash: txHash,
          project_ref_id: projectRef,
        },
      });
    } else {
      await db.blockchainRecord.update({
        where: { id: existingRecord.id },
        data: {
          bid_id: id,
          winner_id: updatedBid.supplier_id,
          bid_amount: updatedBid.bid_amount,
          hash: txHash,
          project_ref_id: projectRef,
        },
      });
    }

    await db.bid.update({ where: { id }, data: { recorded: true } });
    await logAudit("RECORD_BLOCKCHAIN", user!.id, `Recorded blockchain entry for ${updatedBid.project.title}`, "blockchain", txHash);

  } catch (err: any) {
    console.error("Failed to automatically record award on blockchain:", err);
    return json({ error: `Failed to record award on blockchain: ${err.message || err}` }, 500);
  }

  // Recalculate ranks
  const allBids = await db.bid.findMany({ where: { project_id: bid.project_id }, select: { id: true, bid_amount: true, submitted_at: true } });
  const sorted = [...allBids].sort((a, b) => Number(a.bid_amount) - Number(b.bid_amount) || a.submitted_at.getTime() - b.submitted_at.getTime());
  for (let i = 0; i < sorted.length; i++) {
    await db.bid.update({ where: { id: sorted[i].id }, data: { rank: i + 1 } });
  }

  await logAudit("SELECT_WINNER", user!.id, `Selected winner for ${bid.project.title}: ${bid.supplier.full_name}`, "bid", id);
  await createBidLog({ projectId: bid.project_id, bidId: id, supplierId: bid.supplier_id, userId: user!.id, role: "admin", action: "WINNER_SELECTED", description: `${bid.supplier.full_name} selected as winner with bid of ₱${Number(bid.bid_amount).toLocaleString()}` });

  // Notify winner
  await notifyUser(bid.supplier_id, "bid_won", "Congratulations! Your Bid Won", `Your bid of ₱${Number(bid.bid_amount).toLocaleString()} was selected as the winner for ${bid.project.title}.`, "/supplier/bids", id);

  // Notify losers
  const losingBids = await db.bid.findMany({ where: { project_id: bid.project_id, id: { not: id } }, include: { supplier: true } });
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
