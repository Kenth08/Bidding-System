import { db } from "@/lib/db";
import {
  addSupplierWorkflowActivity,
  getSupplierWorkflow,
  updateSupplierWorkflow,
} from "@/lib/supplier-workflow-db";
import {
  DEFAULT_REQUIRED_DOCUMENT_FLAG_REASON,
  SUPPLIER_DOCUMENT_DEFINITIONS,
  isDocumentUploaded,
  shouldAutoFlagRequiredDocument,
} from "@/lib/supplier-documents";

export async function autoFlagMissingRequiredDocuments(supplierId: string, actorId?: string) {
  const supplier = await db.user.findUnique({ where: { id: supplierId } });
  if (!supplier) return { autoFlagged: [] as string[] };

  const uploads = await db.documentUpload.findMany({
    where: { user_id: supplierId },
    orderBy: { updated_at: "desc" },
  });

  const latestByType = new Map<string, any>();
  for (const upload of uploads) {
    if (!latestByType.has(upload.document_type)) {
      latestByType.set(upload.document_type, upload);
    }
  }

  const workflow = await getSupplierWorkflow(supplierId);
  const nextFlaggedReasons = { ...workflow.flagged_reasons };
  const autoFlagged: string[] = [];

  for (const definition of SUPPLIER_DOCUMENT_DEFINITIONS.filter((d) => d.required)) {
    const upload = latestByType.get(definition.id);
    const hasFile = isDocumentUploaded(supplier as unknown as Record<string, unknown>, definition);

    const shouldFlag = shouldAutoFlagRequiredDocument({
      required: definition.required,
      hasFile,
      verificationStatus: upload?.verification_status,
    });

    if (!shouldFlag) continue;

    const reason = DEFAULT_REQUIRED_DOCUMENT_FLAG_REASON;
    nextFlaggedReasons[definition.id] = reason;

    if (upload?.id) {
      await db.documentUpload.update({
        where: { id: upload.id },
        data: {
          verification_status: "Flagged",
          verification_notes: reason,
          verified_by_id: actorId || null,
          verified_at: new Date(),
        },
      });
    } else {
      await db.documentUpload.create({
        data: {
          user_id: supplierId,
          document_type: definition.id,
          file_name: definition.name,
          file: null,
          file_size: 0,
          verification_status: "Flagged",
          verification_notes: reason,
          verified_by_id: actorId || null,
          verified_at: new Date(),
        },
      });
    }

    autoFlagged.push(definition.id);
  }

  if (autoFlagged.length > 0) {
    await updateSupplierWorkflow(supplierId, {
      accountLocked: true,
      notifSent: false,
      flaggedReasons: nextFlaggedReasons,
    });

    await db.user.update({ where: { id: supplierId }, data: { status: "revision_required" } });

    await addSupplierWorkflowActivity({
      supplierId,
      actorId: actorId || null,
      eventType: "SUPPLIER_REQUIRED_DOCUMENTS_AUTO_FLAGGED",
      message: "Required missing/invalid documents were auto-flagged for revision.",
      tone: "red",
      metadata: { documentTypes: autoFlagged },
    }).catch(() => {});
  }

  return { autoFlagged };
}
