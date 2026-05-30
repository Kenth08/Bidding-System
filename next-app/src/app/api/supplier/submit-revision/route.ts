import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { getSupplierWorkflow, updateSupplierWorkflow, addSupplierWorkflowActivity } from "@/lib/supplier-workflow-db";
import { sendReuploadConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { user, error } = await requireRole(request, "supplier");
  if (error) return error;

  const supplierId = user!.id;
  const workflow = await getSupplierWorkflow(supplierId);
  const flaggedDocIds = Object.keys(workflow.flagged_reasons || {});
  if (flaggedDocIds.length > 0) {
    return json({
      error: "Please re-upload all flagged documents before submitting.",
      pending: flaggedDocIds,
    }, 400);
  }

  const supplier = await db.user.findUnique({ where: { id: supplierId } });
  const nextSessionVersion = ((supplier?.session_version as number) || 0) + 1;

  try {
    await db.user.update({
      where: { id: supplierId },
      data: {
        status: "waiting_admin_review",
        session_version: nextSessionVersion,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/session_version/i.test(message) || !/does not exist|undefined/.test(message)) {
      throw error;
    }

    await db.user.update({
      where: { id: supplierId },
      data: {
        status: "waiting_admin_review",
      },
    });
  }

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
