import hashlib from "crypto";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit, notifyAdmins } from "@/lib/actions";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const bid = await db.bid.findUnique({ where: { id }, include: { project: true, supplier: true } });
  if (!bid || bid.status !== "won") return json({ error: "Bid not found or not selected" }, 404);

  if (bid.recorded) return json({ error: "Already recorded on blockchain" }, 400);

  const raw = `${bid.project_id}${bid.supplier_id}${bid.bid_amount}${Date.now()}`;
  const hashValue = "0x" + hashlib.createHash("sha256").update(raw).digest("hex");
  const projectRef = `PRJ-${bid.project_id.slice(0, 6).toUpperCase()}`;

  const record = await db.blockchainRecord.create({
    data: { id: uuid(), project_id: bid.project_id, bid_id: id, winner_id: bid.supplier_id, bid_amount: bid.bid_amount, hash: hashValue, project_ref_id: projectRef },
  });

  await db.bid.update({ where: { id }, data: { recorded: true } });
  await logAudit("RECORD_BLOCKCHAIN", user!.id, `Recorded blockchain entry for ${bid.project.title}`, "blockchain", record.id);
  await notifyAdmins("blockchain_recorded", "Blockchain Record Saved", `"${bid.project.title}" award for ${bid.supplier.full_name} has been permanently recorded on the blockchain.`);

  return json(record, 201);
}
