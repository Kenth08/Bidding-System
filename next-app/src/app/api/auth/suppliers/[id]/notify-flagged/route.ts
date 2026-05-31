import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { notifyUser } from "@/lib/actions";
import {
  DEFAULT_REQUIRED_DOCUMENT_FLAG_REASON,
  SUPPLIER_DOCUMENT_DEFINITIONS,
  SUPPLIER_DOCUMENT_LOOKUP,
} from "@/lib/supplier-documents";
import {
  addSupplierWorkflowActivity,
  getSupplierWorkflow,
  updateSupplierWorkflow,
} from "@/lib/supplier-workflow-db";
import { autoFlagMissingRequiredDocuments } from "@/lib/supplier-verification";
import { sendRevisionRequiredEmail } from "@/lib/email";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const supplier = await db.user.findUnique({ where: { id } });
  if (!supplier) return json({ error: "Supplier not found." }, 404);

  await autoFlagMissingRequiredDocuments(id, user!.id);

  const flagged = await db.documentUpload.findMany({
    where: {
      user_id: id,
      verification_status: { in: ["Needs Revision", "Rejected", "Flagged", "invalid"] },
    },
    orderBy: { updated_at: "desc" },
  });

  const latestByType = new Map<string, any>();
  for (const row of flagged) {
    if (!latestByType.has(row.document_type)) {
      latestByType.set(row.document_type, row);
    }
  }

  const requiredDocIds = new Set(
    SUPPLIER_DOCUMENT_DEFINITIONS.filter((d) => d.required).map((d) => d.id)
  );

  const flaggedRequiredRows = Array.from(latestByType.values()).filter((row: any) =>
    requiredDocIds.has(String(row.document_type || ""))
  );

  const flaggedNames = flaggedRequiredRows.map((row: any) => {
    return SUPPLIER_DOCUMENT_LOOKUP.get(row.document_type)?.name || row.document_type;
  });

  if (!flaggedNames.length) {
    return json({ error: "No flagged required documents to notify." }, 400);
  }

  const workflow = await getSupplierWorkflow(id);
  if (workflow.notif_sent) {
    return json({ error: "Flagged-document notification has already been sent." }, 400);
  }

  const nextFlaggedReasons = { ...workflow.flagged_reasons };
  for (const row of flaggedRequiredRows) {
    nextFlaggedReasons[row.document_type] = row.verification_notes || DEFAULT_REQUIRED_DOCUMENT_FLAG_REASON;
  }

  await updateSupplierWorkflow(id, {
    accountLocked: true,
    notifSent: true,
    flaggedReasons: nextFlaggedReasons,
  });

  // mark supplier account status
  await db.user.update({ where: { id }, data: { status: "revision_required", verification_status: "revision_required" } });

  const loginUrl = `${new URL(request.url).origin}/login`;
  const emailItems = flaggedRequiredRows.map((row: any) => ({
    documentName: SUPPLIER_DOCUMENT_LOOKUP.get(row.document_type)?.name || row.document_type,
    reason: row.verification_notes || DEFAULT_REQUIRED_DOCUMENT_FLAG_REASON,
  }));

  // send email notification
  try {
    await sendRevisionRequiredEmail({
      to: String(supplier.email),
      supplierName: String(supplier.full_name || "Supplier"),
      flaggedDocuments: emailItems,
      loginUrl,
    });
  } catch (e) {
    // ignore email send failures
  }

  const message = `Your supplier verification documents require revision. Please log in to your account and upload the corrected requirements. Flagged required documents: ${flaggedNames.join(", ")}.`;

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
    accountLocked: true,
    notifSent: true,
    flaggedDocuments: flaggedNames,
  });
}
