import { v4 as uuid } from "uuid";
import { dbDirect } from "@/lib/db-direct";

export type WorkflowTone = "green" | "red" | "blue" | "amber";

export interface SupplierWorkflowRow {
  id: string;
  supplier_id: string;
  account_locked: boolean;
  notif_sent: boolean;
  flagged_reasons: Record<string, string>;
  created_at: Date;
  updated_at: Date;
}

function toObject(value: unknown): Record<string, string> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, String(val || "")])
    );
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>).map(([key, val]) => [key, String(val || "")])
        );
      }
    } catch {
      return {};
    }
  }
  return {};
}

function hydrateWorkflow(row: any): SupplierWorkflowRow {
  return {
    id: row.id,
    supplier_id: row.supplier_id,
    account_locked: Boolean(row.account_locked),
    notif_sent: Boolean(row.notif_sent),
    flagged_reasons: toObject(row.flagged_reasons),
    created_at: row.created_at ? new Date(String(row.created_at)) : new Date(),
    updated_at: row.updated_at ? new Date(String(row.updated_at)) : new Date(),
  };
}

export async function ensureSupplierWorkflow(supplierId: string): Promise<SupplierWorkflowRow> {
  const result = await dbDirect.query(
    `INSERT INTO supplier_document_workflows (id, supplier_id, account_locked, notif_sent, flagged_reasons, created_at, updated_at)
     VALUES ($1, $2, false, false, '{}'::jsonb, NOW(), NOW())
     ON CONFLICT (supplier_id) DO NOTHING
     RETURNING *`,
    [uuid(), supplierId]
  );

  if (result.rows[0]) return hydrateWorkflow(result.rows[0]);

  const fallback = await dbDirect.query(
    `SELECT * FROM supplier_document_workflows WHERE supplier_id = $1 LIMIT 1`,
    [supplierId]
  );

  if (!fallback.rows[0]) {
    throw new Error("Failed to initialize supplier workflow record.");
  }

  return hydrateWorkflow(fallback.rows[0]);
}

export async function getSupplierWorkflow(supplierId: string): Promise<SupplierWorkflowRow> {
  const result = await dbDirect.query(
    `SELECT * FROM supplier_document_workflows WHERE supplier_id = $1 LIMIT 1`,
    [supplierId]
  );

  if (!result.rows[0]) return ensureSupplierWorkflow(supplierId);
  return hydrateWorkflow(result.rows[0]);
}

export async function updateSupplierWorkflow(
  supplierId: string,
  update: {
    accountLocked?: boolean;
    notifSent?: boolean;
    flaggedReasons?: Record<string, string>;
  }
): Promise<SupplierWorkflowRow> {
  const current = await getSupplierWorkflow(supplierId);

  const next = {
    accountLocked: update.accountLocked ?? current.account_locked,
    notifSent: update.notifSent ?? current.notif_sent,
    flaggedReasons: update.flaggedReasons ?? current.flagged_reasons,
  };

  const result = await dbDirect.query(
    `UPDATE supplier_document_workflows
     SET account_locked = $2,
         notif_sent = $3,
         flagged_reasons = $4::jsonb,
         updated_at = NOW()
     WHERE supplier_id = $1
     RETURNING *`,
    [supplierId, next.accountLocked, next.notifSent, JSON.stringify(next.flaggedReasons)]
  );

  if (!result.rows[0]) {
    throw new Error("Failed to update supplier workflow.");
  }

  return hydrateWorkflow(result.rows[0]);
}

export async function addSupplierWorkflowActivity(params: {
  supplierId: string;
  actorId?: string | null;
  eventType: string;
  message: string;
  tone: WorkflowTone;
  metadata?: Record<string, unknown>;
}) {
  await dbDirect.query(
    `INSERT INTO supplier_document_workflow_activity
      (id, supplier_id, actor_id, event_type, message, tone, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())`,
    [
      uuid(),
      params.supplierId,
      params.actorId ?? null,
      params.eventType,
      params.message,
      params.tone,
      JSON.stringify(params.metadata || {}),
    ]
  );
}

export async function listSupplierWorkflowActivity(supplierId: string, limit = 30) {
  const result = await dbDirect.query(
    `SELECT id, event_type, message, tone, created_at
     FROM supplier_document_workflow_activity
     WHERE supplier_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [supplierId, limit]
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    eventType: row.event_type,
    message: row.message,
    tone: row.tone,
    createdAt: row.created_at,
  }));
}
