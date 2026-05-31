import { dbDirect } from "@/lib/db-direct";
import { v4 as uuid } from "uuid";

export async function createBidLog(params: {
  projectId: string;
  bidId?: string | null;
  supplierId?: string | null;
  userId?: string | null;
  role?: string;
  action: string;
  description: string;
}) {
  try {
    await dbDirect.query(
      `INSERT INTO bid_activity_logs (id, project_id, bid_id, supplier_id, user_id, role, action, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        uuid(),
        params.projectId,
        params.bidId || null,
        params.supplierId || null,
        params.userId || null,
        params.role || "system",
        params.action,
        params.description,
      ]
    );
  } catch (e) {
    console.error("[createBidLog]", e);
  }
}
