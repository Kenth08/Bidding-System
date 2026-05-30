import { dbDirect } from "@/lib/db-direct";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "supplier");
  if (error) return error;

  const { id: projectId } = await params;

  // Find audit logs related to this supplier's bids on this project
  const result = await dbDirect.query(
    `SELECT l.id, l.action, l.description, 'system' as role, u.full_name as user_name, l.created_at
     FROM audit_logs l
     LEFT JOIN users u ON u.id = l.user_id
     WHERE (l.resource_type = 'bid' AND l.resource_id = $1 AND l.user_id = $2)
        OR (l.resource_type = 'bid' AND l.resource_id IN (
             SELECT id::text FROM bids_bid WHERE project_id = $1 AND supplier_id = $2
           ))
     ORDER BY l.created_at ASC`,
    [projectId, user!.id]
  );

  return json(result.rows);
}
