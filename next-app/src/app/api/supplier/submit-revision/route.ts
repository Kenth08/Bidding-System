import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { getSupplierWorkflow, updateSupplierWorkflow, addSupplierWorkflowActivity } from "@/lib/supplier-workflow-db";
import { sendReuploadConfirmationEmail } from "@/lib/email";
import { notifyAdmins } from "@/lib/actions";

export async function POST(request: Request) {
  const { user, error } = await requireRole(request, "supplier");
  if (error) return error;

  const supplierId = user!.id;
  const workflow = await getSupplierWorkflow(supplierId);
  const remainingFlagged = Object.keys(workflow.flagged_reasons || {});

  // Block if there are still unreuploaded flagged documents
  if (remainingFlagged.length > 0) {
    return json({
      error: "Please re-upload all flagged documents before submitting.",
      pending: remainingFlagged,
    }, 400);
  }

  const supplier = await db.user.findUnique({ where: { id: supplierId } });
  const nextSessionVersion = ((supplier?.session_version as number) || 0) + 1;

  // Transition to waiting_admin_review and bump session to force logout
  await db.user.update({
    where: { id: supplierId },
    data: {
      verification_status: "waiting_admin_review",
      status: "waiting_admin_review",
      session_version: nextSessionVersion,
    },
  });

  await updateSupplierWorkflow(supplierId, {
    accountLocked: true,
    notifSent: false,
    flaggedReasons: {},
  });

  await addSupplierWorkflowActivity({
    supplierId,
    actorId: supplierId,
    eventType: "SUPPLIER_REVISION_SUBMITTED",
    message: "Supplier submitted corrected documents for admin review.",
    tone: "blue",
  }).catch(() => {});

  await notifyAdmins(
    "supplier_revision_submitted",
    "Supplier Submitted Corrected Documents",
    `${supplier?.full_name || "A supplier"} has submitted corrected verification documents for review.`,
    "/admin/suppliers",
    supplierId
  ).catch(() => {});

  try {
    await sendReuploadConfirmationEmail({
      to: String(supplier?.email || ""),
      supplierName: String(supplier?.full_name || "Supplier"),
    });
  } catch {}

  return json({
    success: true,
    forceLogout: true,
    message: "Your corrected documents have been submitted successfully. Please wait for admin approval.",
  });
}
