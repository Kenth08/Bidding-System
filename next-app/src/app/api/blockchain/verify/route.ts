import { ethers } from "ethers";
import { db } from "@/lib/db";
import { json } from "@/lib/api-utils";
import { getBlockchainProvider, getProcureChainContract } from "@/lib/blockchain";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const hashValue = (url.searchParams.get("hash") || "").trim();
  if (!hashValue) return json({ error: "Please provide a hash value." }, 400);

  const record = await db.blockchainRecord.findUnique({
    where: { hash: hashValue },
    include: {
      project: { select: { title: true } },
      winner: { select: { full_name: true, company_name: true } },
    },
  });

  if (!record) {
    return json({ verified: false, message: "No record found for this hash. This record may be invalid or tampered." }, 404);
  }

  let blockchainVerified = false;
  let blockNumber: number | null = null;
  let gasUsed: string | null = null;
  let blockTimestamp: string | null = null;

  // Document verification variables
  let noaHashOnChain: string | null = null;
  let ntpHashOnChain: string | null = null;
  let resolutionHashOnChain: string | null = null;
  let noaVerified = false;
  let ntpVerified = false;
  let resolutionVerified = false;

  try {
    const provider = getBlockchainProvider();
    const tx = await provider.getTransaction(hashValue);
    const receipt = await provider.getTransactionReceipt(hashValue);
    
    if (tx && receipt && receipt.status === 1) {
      const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || "0x0165878A594ca255338adfa4d48449f69242Eb8F";
      if (tx.to?.toLowerCase() === contractAddress.toLowerCase()) {
        const contract = getProcureChainContract();
        
        // Parse event logs to verify parameters match database
        const parsedLogs = receipt.logs.map(log => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        }).filter((l): l is NonNullable<typeof l> => l !== null);

        const event = parsedLogs.find(l => l.name === "RecordCreated");
        if (event) {
          const [
            eventProjectId,
            eventBidId,
            eventWinnerId,
            eventBidAmount,
            eventProjectRefId,
            eventNoaHash,
            eventNtpHash,
            eventResolutionHash
          ] = event.args;
          
          const dbAmountBigInt = ethers.parseUnits(record.bid_amount.toString(), 18);

          // Get the bid to retrieve updated_at and build document payloads
          const bid = await db.bid.findUnique({
            where: { id: record.bid_id },
            include: { project: true, supplier: true }
          });

          if (bid) {
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

            if (
              eventProjectId === record.project_id &&
              eventBidId === record.bid_id &&
              eventWinnerId === record.winner_id &&
              eventBidAmount === dbAmountBigInt &&
              eventProjectRefId === record.project_ref_id
            ) {
              blockchainVerified = true;
              blockNumber = receipt.blockNumber;
              gasUsed = receipt.gasUsed.toString();
              
              noaHashOnChain = eventNoaHash;
              ntpHashOnChain = eventNtpHash;
              resolutionHashOnChain = eventResolutionHash;
              
              noaVerified = eventNoaHash === noaHash;
              ntpVerified = eventNtpHash === ntpHash;
              resolutionVerified = eventResolutionHash === resolutionHash;

              const block = await provider.getBlock(receipt.blockHash);
              if (block) {
                blockTimestamp = new Date(block.timestamp * 1000).toISOString();
              }
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.warn("Could not verify on local blockchain node:", err.message);
  }

  return json({
    verified: true,
    blockchain_verified: blockchainVerified,
    project_title: record.project.title,
    project_ref_id: record.project_ref_id,
    winner_name: record.winner.full_name,
    winner_company: record.winner.company_name,
    bid_amount: Number(record.bid_amount),
    recorded_at: record.recorded_at,
    block_number: blockNumber,
    gas_used: gasUsed,
    block_timestamp: blockTimestamp,
    
    // Anchored document hashes and verify states
    noa_hash: noaHashOnChain,
    ntp_hash: ntpHashOnChain,
    resolution_hash: resolutionHashOnChain,
    noa_verified: noaVerified,
    ntp_verified: ntpVerified,
    resolution_verified: resolutionVerified,

    message: blockchainVerified 
      ? `This record is authentic, verified on the blockchain (Block #${blockNumber}), and matches all local records. Document hashes (NOA, NTP, Resolution) are securely anchored.`
      : 'This record was found in the database, but could not be validated on-chain (contract mismatch or network offline).',
  });
}
