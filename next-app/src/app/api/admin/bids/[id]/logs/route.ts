import { dbDirect } from "@/lib/db-direct";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const { id: projectId } = await params;

  // Get the procurement_request_id for this project
  const projectResult = await dbDirect.query(
    `SELECT procurement_request_id FROM projects_project WHERE id = $1::uuid`,
    [projectId]
  );
  const procurementId = projectResult.rows[0]?.procurement_request_id || null;

  // audit_logs.resource_id is VARCHAR, bids_bid.id and blockchain ids are UUID
  // Must cast UUID to text for IN comparison
  let query = `SELECT l.id, l.action, l.description, 'system' as role, u.full_name as user_name, l.created_at
     FROM audit_logs l
     LEFT JOIN users u ON u.id = l.user_id
     WHERE (l.resource_type = 'project' AND l.resource_id = $1)
        OR (l.resource_type = 'bid' AND l.resource_id = $1)
        OR (l.resource_type = 'bid' AND l.resource_id IN (SELECT id::text FROM bids_bid WHERE project_id = $1::uuid))
        OR (l.resource_type = 'blockchain' AND l.resource_id IN (SELECT id::text FROM blockchain_blockchainrecord WHERE project_id = $1::uuid))`;

  const queryParams: string[] = [projectId];

  if (procurementId) {
    query += ` OR (l.resource_type = 'procurement' AND l.resource_id = $2)`;
    queryParams.push(procurementId);
  }

  query += ` ORDER BY l.created_at ASC`;

  const result = await dbDirect.query(query, queryParams);
  return json(result.rows);
}
