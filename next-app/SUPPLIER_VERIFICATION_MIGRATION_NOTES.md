# Supplier Verification Migration Notes

## Current State
The repository already contains these database tables required by the revision workflow:

- `users`
- `document_uploads`
- `supplier_document_workflows`
- `supplier_document_workflow_activity`
- `notifications`

Because those tables are already present and used by the app routes, no destructive migration was added in this patch.

## Conceptual Mapping
- `SupplierDocument` -> `document_uploads` (latest row per `document_type` is current state)
- `SupplierDocumentHistory` -> historical rows in `document_uploads` (new row inserted per re-upload)
- `SupplierNotification` -> `notifications`
- `ActivityLog` -> `supplier_document_workflow_activity`

## Optional Future Migration
If you want a separate strict history table instead of reusing `document_uploads` history rows, add:

```sql
CREATE TABLE IF NOT EXISTS supplier_document_history (
  id uuid PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type varchar(64) NOT NULL,
  file_url text,
  file_path text,
  status varchar(32) NOT NULL,
  admin_comment text,
  flag_reason text,
  reviewed_by_id uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

No code in this patch depends on the optional table above.
