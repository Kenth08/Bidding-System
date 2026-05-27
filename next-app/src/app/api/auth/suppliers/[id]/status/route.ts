import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit, notifyUser } from "@/lib/actions";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const supplierId = params.id;
  const body = await request.json();
  const status = String(body.status || "");

  try {
    let updated: any = null;
    if (status === "approved" || status === "rejected") {
      updated = await db.user.update({ where: { id: supplierId }, data: { status } });
      await logAudit("SUPPLIER_STATUS", user.id, `Supplier ${supplierId} status set to ${status}`, "supplier", supplierId).catch(() => {});
      await notifyUser(supplierId, "supplier_status", `Supplier ${status}`, `Your supplier account status has been updated to ${status}.`).catch(() => {});
    } else if (status === "verify") {
      updated = await db.user.update({ where: { id: supplierId }, data: { verification_status: "verified", verified_at: new Date(), verified_by_id: user.id } });
      await logAudit("SUPPLIER_VERIFIED", user.id, `Supplier ${supplierId} documents qualified`, "supplier", supplierId).catch(() => {});
      await notifyUser(supplierId, "supplier_verified", "Documents Qualified", "Your submitted documents have been qualified by the admin.", "/supplier/profile").catch(() => {});
    } else if (status === "verification_rejected") {
      const notes = String(body.notes || "");
      updated = await db.user.update({ where: { id: supplierId }, data: { verification_status: "verification_rejected", verification_notes: notes, verified_at: new Date(), verified_by_id: user.id } });
      await logAudit("SUPPLIER_VERIFICATION_REJECTED", user.id, `Supplier ${supplierId} verification rejected: ${notes}`, "supplier", supplierId).catch(() => {});
      await notifyUser(supplierId, "supplier_verification_rejected", "Verification Rejected", `Your documents were not accepted: ${notes}`, "/supplier/profile").catch(() => {});
    } else {
      return json({ error: "Unknown status" }, 400);
    }

    return json(updated);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}
import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit, notifyUser } from "@/lib/actions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const status = String(body.status || "").toLowerCase();
  
  // Check if this is a verification status update
  const verificationStatuses = ["verified", "verification_rejected"];
  const regularStatuses = ["approved", "rejected", "active", "inactive"];
  
  const isVerificationUpdate = verificationStatuses.includes(status);
  const allowed = [...regularStatuses, ...verificationStatuses];
  
  if (!allowed.includes(status)) {
    return json({ error: `Status must be one of: ${allowed.join(", ")}` }, 400);
  }

  const supplier = await db.user.findFirst({ where: { id, role: "supplier" } });
  if (!supplier) return json({ error: "Supplier not found" }, 404);

  const updateData: any = {};
  if (isVerificationUpdate) {
    updateData.verification_status = status;
    updateData.verified_at = status === "verified" ? new Date() : null;
    updateData.verified_by_id = user!.id;
  } else {
    updateData.status = status;
  }

  await db.user.update({ where: { id }, data: updateData });
  
  if (isVerificationUpdate) {
    await logAudit("VERIFY", user!.id, `Supplier ${supplier.full_name} documents ${status}`, "supplier", id);
    if (status === "verified") {
      await notifyUser(id, "documents_verified", "Documents Verified", "Your documents have been verified. You can now submit bids on projects.", "/supplier/projects");
    } else if (status === "verification_rejected") {
      await notifyUser(id, "documents_rejected", "Documents Rejected", "Your documents were not approved. Please upload valid documents to submit bids.", "/supplier/profile");
    }
  } else {
    await logAudit("UPDATE", user!.id, `Supplier ${supplier.full_name} status changed to ${status}`, "supplier", id);
    if (status === "approved") {
      await notifyUser(id, "supplier_approved", "Account Approved", "Your supplier account has been approved. You can now view and bid on projects.", "/supplier/projects");
    } else if (status === "rejected") {
      await notifyUser(id, "supplier_rejected", "Account Rejected", "Your supplier account was not approved. Please contact the administrator.", "/supplier/profile");
    }
  }

  const updated = await db.user.findUnique({ where: { id } });
  const { password_hash: _, ...safe } = updated!;
  return json(safe);
}
