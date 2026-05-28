import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { notifyUser } from "@/lib/actions";
import {
  SUPPLIER_DOCUMENT_LOOKUP,
} from "@/lib/supplier-documents";
import {
  addSupplierWorkflowActivity,
  getSupplierWorkflow,
  updateSupplierWorkflow,
} from "@/lib/supplier-workflow-db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const supplier = await db.user.findUnique({ where: { id } });
  if (!supplier) return json({ error: "Supplier not found." }, 404);

  const flagged = await db.documentUpload.findMany({
    where: {
      user_id: id,
      verification_status: { in: ["Needs Revision", "Rejected"] },
    },
    orderBy: { updated_at: "desc" },
  });

  const latestByType = new Map<string, any>();
  for (const row of flagged) {
    if (!latestByType.has(row.document_type)) {
      latestByType.set(row.document_type, row);
    }
  }

  const flaggedNames = Array.from(latestByType.keys()).map((docType) => {
    return SUPPLIER_DOCUMENT_LOOKUP.get(docType)?.name || docType;
  });

  if (!flaggedNames.length) {
    return json({ error: "No flagged documents to notify." }, 400);
  }

  const workflow = await getSupplierWorkflow(id);
  if (workflow.notif_sent) {
    return json({ error: "Flagged-document notification has already been sent." }, 400);
  }

  const nextFlaggedReasons = { ...workflow.flagged_reasons };
  for (const row of latestByType.values()) {
    nextFlaggedReasons[row.document_type] = row.verification_notes || "Document requires revision.";
  }

  await updateSupplierWorkflow(id, {
    accountLocked: false,
    notifSent: true,
    flaggedReasons: nextFlaggedReasons,
  });

  const message = `Your qualification documents have been reviewed. The following files require revision: ${flaggedNames.join(", ")}. Please log out of your account, revise and resubmit the listed documents, then wait for admin approval. You will receive a confirmation once your account has been approved for bidding.`;

  await notifyUser(
    id,
    "supplier_documents_flagged",
    "Document Revision Required",
    message,
    "/supplier/profile",
    id
  ).catch(() => {});

  await addSupplierWorkflowActivity({
    supplierId: id,
    actorId: user!.id,
    eventType: "SUPPLIER_FLAG_NOTIFICATION_SENT",
    message: `Notified supplier ${supplier.full_name} of flagged documents: ${flaggedNames.join(", ")}`,
    tone: "amber",
    metadata: { flaggedDocuments: flaggedNames },
  }).catch(() => {});

  return json({
    accountLocked: false,
    notifSent: true,
    flaggedDocuments: flaggedNames,
  });
}
