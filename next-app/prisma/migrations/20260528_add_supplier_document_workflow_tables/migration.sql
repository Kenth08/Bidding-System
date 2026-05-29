-- Migration: add dedicated supplier document workflow and activity tables (May 28, 2026)

CREATE TABLE IF NOT EXISTS "supplier_document_workflows" (
  "id" UUID PRIMARY KEY,
  "supplier_id" UUID NOT NULL UNIQUE,
  "account_locked" BOOLEAN NOT NULL DEFAULT false,
  "notif_sent" BOOLEAN NOT NULL DEFAULT false,
  "flagged_reasons" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "supplier_document_workflows_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "supplier_document_workflows_supplier_id_idx"
  ON "supplier_document_workflows" ("supplier_id");

CREATE TABLE IF NOT EXISTS "supplier_document_workflow_activity" (
  "id" UUID PRIMARY KEY,
  "supplier_id" UUID NOT NULL,
  "actor_id" UUID,
  "event_type" VARCHAR(64) NOT NULL,
  "message" TEXT NOT NULL,
  "tone" VARCHAR(16) NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "supplier_document_workflow_activity_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "supplier_document_workflow_activity_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "supplier_document_workflow_activity_supplier_id_idx"
  ON "supplier_document_workflow_activity" ("supplier_id");

CREATE INDEX IF NOT EXISTS "supplier_document_workflow_activity_created_at_idx"
  ON "supplier_document_workflow_activity" ("created_at");
