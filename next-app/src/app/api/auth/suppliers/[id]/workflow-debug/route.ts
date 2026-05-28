import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import {
  SUPPLIER_DOCUMENT_DEFINITIONS,
  isDocumentUploaded,
  mapVerificationStatusToState,
} from "@/lib/supplier-documents";
import {
  getSupplierWorkflow,
  listSupplierWorkflowActivity,
} from "@/lib/supplier-workflow-db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;

  const supplier = await db.user.findUnique({ where: { id } });
  if (!supplier) return json({ error: "Supplier not found." }, 404);

  const uploads = await db.documentUpload.findMany({
    where: { user_id: id },
    orderBy: { updated_at: "desc" },
  });

  const latestByType = new Map<string, any>();
  for (const upload of uploads) {
    if (!latestByType.has(upload.document_type)) {
      latestByType.set(upload.document_type, upload);
    }
  }

  const workflow = await getSupplierWorkflow(id);
  const activity = await listSupplierWorkflowActivity(id, 100);

  const documents = SUPPLIER_DOCUMENT_DEFINITIONS.map((definition) => {
    const upload = latestByType.get(definition.id);
    const uploaded = isDocumentUploaded(supplier as unknown as Record<string, unknown>, definition);
    const state = mapVerificationStatusToState(upload?.verification_status, uploaded);

    return {
      id: definition.id,
      name: definition.name,
      category: definition.category,
      required: definition.required,
      uploaded,
      state,
      file: uploaded ? (supplier as any)[definition.userField] ?? upload?.file ?? null : null,
      expiryDate: definition.expiryField ? (supplier as any)[definition.expiryField] || null : null,
      latestUpload: upload
        ? {
            id: upload.id,
            verification_status: upload.verification_status,
            verification_notes: upload.verification_notes,
            verified_by_id: upload.verified_by_id,
            verified_at: upload.verified_at,
            updated_at: upload.updated_at,
          }
        : null,
    };
  });

  return json({
    supplier: {
      id: supplier.id,
      full_name: supplier.full_name,
      email: supplier.email,
      status: supplier.status,
      verification_status: supplier.verification_status,
      is_active: supplier.is_active,
    },
    workflow: {
      id: workflow.id,
      supplier_id: workflow.supplier_id,
      account_locked: workflow.account_locked,
      notif_sent: workflow.notif_sent,
      flagged_reasons: workflow.flagged_reasons,
      created_at: workflow.created_at,
      updated_at: workflow.updated_at,
    },
    documents,
    activity,
  });
}
