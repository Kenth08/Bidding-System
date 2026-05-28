import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";
import {
  SUPPLIER_DOCUMENT_DEFINITIONS,
  isDocumentUploaded,
  mapVerificationStatusToState,
} from "@/lib/supplier-documents";
import { getSupplierWorkflow } from "@/lib/supplier-workflow-db";

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  if (user!.role !== "supplier") return json({ error: "Only suppliers can access this endpoint." }, 403);

  const uploads = await db.documentUpload.findMany({
    where: { user_id: user!.id },
    orderBy: { updated_at: "desc" },
  });

  const latestByType = new Map<string, any>();
  for (const upload of uploads) {
    if (!latestByType.has(upload.document_type)) {
      latestByType.set(upload.document_type, upload);
    }
  }

  const documents = SUPPLIER_DOCUMENT_DEFINITIONS.map((definition) => {
    const upload = latestByType.get(definition.id);
    const uploaded = isDocumentUploaded(user as unknown as Record<string, unknown>, definition);
    const state = mapVerificationStatusToState(upload?.verification_status, uploaded);

    return {
      id: definition.id,
      name: definition.name,
      required: definition.required,
      uploaded,
      file: uploaded ? (user as any)[definition.userField] ?? upload?.file ?? null : null,
      state,
      reason: state === "flagged" ? upload?.verification_notes || null : null,
      expiryDate: definition.expiryField ? (user as any)[definition.expiryField] || null : null,
    };
  });

  const workflow = await getSupplierWorkflow(user!.id);
  return json({
    accountLocked: workflow.account_locked,
    notifSent: workflow.notif_sent,
    documents,
  });
}
