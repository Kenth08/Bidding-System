import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { notifyUser } from "@/lib/actions";
import {
  SUPPLIER_DOCUMENT_DEFINITIONS,
  SUPPLIER_DOCUMENT_LOOKUP,
  isDocumentUploaded,
  mapVerificationStatusToState,
} from "@/lib/supplier-documents";
import {
  addSupplierWorkflowActivity,
  updateSupplierWorkflow,
} from "@/lib/supplier-workflow-db";
import { sendSupplierApprovedEmail } from "@/lib/email";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
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

  const missingApprovals = SUPPLIER_DOCUMENT_DEFINITIONS
    .filter((doc) => doc.required)
    .filter((doc) => {
      const uploaded = isDocumentUploaded(supplier as unknown as Record<string, unknown>, doc);
      const upload = latestByType.get(doc.id);
      const state = mapVerificationStatusToState(upload?.verification_status, uploaded);
      return state !== "approved";
    });

  if (missingApprovals.length) {
    return json({
      error: "All required documents must be approved before unlocking the supplier.",
      pending: missingApprovals.map((doc) => SUPPLIER_DOCUMENT_LOOKUP.get(doc.id)?.name || doc.id),
    }, 400);
  }

  await updateSupplierWorkflow(id, {
    accountLocked: false,
    notifSent: false,
    flaggedReasons: {},
  });

  await db.user.update({
    where: { id },
    data: {
      verification_status: "verified",
      status: "verified",
      verified_at: new Date(),
      verified_by_id: user!.id,
    },
  });

  // send in-app notification
  await notifyUser(
    id,
    "supplier_documents_approved",
    "All Documents Approved",
    "All required qualification documents have been approved. Your supplier account is fully unlocked and bidding access is now enabled.",
    "/supplier/projects",
    id
  ).catch(() => {});

  // send approval email
  try {
    await sendSupplierApprovedEmail({
      to: String(supplier.email),
      supplierName: String(supplier.full_name || "Supplier"),
    });
  } catch (e) {
    // ignore
  }

  await addSupplierWorkflowActivity({
    supplierId: id,
    actorId: user!.id,
    eventType: "SUPPLIER_DOCUMENTS_FULLY_APPROVED",
    message: "All documents approved. Supplier account fully unlocked.",
    tone: "green",
  }).catch(() => {});

  return json({
    accountLocked: false,
    notifSent: false,
    message: "All documents approved. Supplier account fully unlocked.",
  });
}
