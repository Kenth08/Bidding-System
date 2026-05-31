import { v4 as uuid } from "uuid";
import { ethers } from "ethers";
import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit, notifyAdmins } from "@/lib/actions";
import { getProcureChainContract } from "@/lib/blockchain";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const bid = await db.bid.findUnique({ where: { id }, include: { project: true, supplier: true } });
  if (!bid || bid.status !== "won") return json({ error: "Bid not found or not selected" }, 404);

  if (bid.recorded) return json({ error: "Already recorded on blockchain" }, 400);

  const projectRef = `PRJ-${bid.project_id.slice(0, 6).toUpperCase()}`;

  try {
    const contract = getProcureChainContract();
    
    // Convert bid amount to 18 decimal places BigInt for smart contract
    const amountStr = bid.bid_amount.toString();
    const amountBigInt = ethers.parseUnits(amountStr, 18);

    // Build payloads matching the GET document routes
    const savings = Math.max(Number(bid.project.budget || 0) - Number(bid.bid_amount), 0);
    const dateStr = bid.updated_at.toISOString().split("T")[0];
    const companyName = bid.company_name || bid.supplier.company_name;

    const noaPayload = {
      document_type: "Notice of Award",
      reference: `NOA-${bid.project.id.slice(0, 8).toUpperCase()}`,
      project_title: bid.project.title,
      procurement_type: bid.project.procurement_type,
      supplier_name: bid.supplier.full_name,
      company_name: companyName,
      bid_amount: Number(bid.bid_amount),
      budget: Number(bid.project.budget || 0),
      award_date: dateStr,
      proceed_date: dateStr,
      resolution_date: dateStr,
      delivery_period: bid.project.delivery_period,
      savings,
    };

    const ntpPayload = {
      document_type: "Notice to Proceed",
      reference: `NTP-${bid.project.id.slice(0, 8).toUpperCase()}`,
      project_title: bid.project.title,
      procurement_type: bid.project.procurement_type,
      supplier_name: bid.supplier.full_name,
      company_name: companyName,
      bid_amount: Number(bid.bid_amount),
      budget: Number(bid.project.budget || 0),
      award_date: dateStr,
      proceed_date: dateStr,
      resolution_date: dateStr,
      delivery_period: bid.project.delivery_period,
      savings,
    };

    const resolutionPayload = {
      document_type: "Resolution to Award",
      reference: `RES-${bid.project.id.slice(0, 8).toUpperCase()}`,
      project_title: bid.project.title,
      procurement_type: bid.project.procurement_type,
      supplier_name: bid.supplier.full_name,
      company_name: companyName,
      bid_amount: Number(bid.bid_amount),
      budget: Number(bid.project.budget || 0),
      award_date: dateStr,
      proceed_date: dateStr,
      resolution_date: dateStr,
      delivery_period: bid.project.delivery_period,
      savings,
    };

    // Calculate Keccak256 hashes of the document payloads
    const noaHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(noaPayload)));
    const ntpHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(ntpPayload)));
    const resolutionHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(resolutionPayload)));

    // Call smart contract recordAward function with document hashes
    const tx = await contract.recordAward(
      bid.project_id,
      id,
      bid.supplier_id,
      amountBigInt,
      projectRef,
      noaHash,
      ntpHash,
      resolutionHash
    );

    // Wait for the transaction to be mined (1 confirmation)
    const receipt = await tx.wait();
    if (!receipt || receipt.status === 0) {
      throw new Error("Transaction reverted on-chain");
    }

    const txHash = tx.hash;

    // Save actual blockchain transaction hash
    const record = await db.blockchainRecord.create({
      data: {
        id: uuid(),
        project_id: bid.project_id,
        bid_id: id,
        winner_id: bid.supplier_id,
        bid_amount: bid.bid_amount,
        hash: txHash,
        project_ref_id: projectRef
      },
    });

    await db.bid.update({ where: { id }, data: { recorded: true } });
    await logAudit("RECORD_BLOCKCHAIN", user!.id, `Recorded blockchain entry for ${bid.project.title}`, "blockchain", record.id);
    await notifyAdmins("blockchain_recorded", "Blockchain Record Saved", `"${bid.project.title}" award for ${bid.supplier.full_name} has been permanently recorded on the blockchain with anchored NOA, NTP, and Resolution documents.`);

    return json(record, 201);

  } catch (err: any) {
    console.error("Blockchain error:", err);
    return json({ error: `Failed to record award on blockchain: ${err.message || err}` }, 500);
  }
}
