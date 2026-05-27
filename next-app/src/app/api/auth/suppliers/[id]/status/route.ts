import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit, notifyUser } from "@/lib/actions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await requireRole(request, "admin");
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const status = String(body.status || "").toLowerCase();

    const allowed = ["approved", "rejected", "active", "inactive", "verified", "verification_rejected"];
    if (!allowed.includes(status)) {
      return json({ error: `Status must be one of: ${allowed.join(", ")}` }, 400);
    }

    const supplier = await db.user.findUnique({ where: { id } });
    if (!supplier) return json({ error: "Supplier not found" }, 404);
    if (!["supplier", "viewer"].includes(String(supplier.role || ""))) return json({ error: "Supplier not found" }, 404);

    const updateData: Record<string, unknown> = {};
    const isVerificationUpdate = status === "verified" || status === "verification_rejected";
    if (isVerificationUpdate) {
      updateData.verification_status = status;
      updateData.verified_at = new Date();
      updateData.verified_by_id = user.id;
      if (status === "verified") {
        await logAudit("VERIFY", user.id, `Supplier ${supplier.full_name} documents verified`, "supplier", id);
        await notifyUser(id, "documents_verified", "Documents Verified", "Your documents have been verified. You can now submit bids on projects.", "/supplier/projects");
      } else {
        await logAudit("SUPPLIER_VERIFICATION_REJECTED", user.id, `Supplier ${supplier.full_name} verification rejected`, "supplier", id);
        await notifyUser(id, "documents_rejected", "Documents Rejected", "Your documents were not approved. Please upload valid documents to submit bids.", "/supplier/profile");
      }
    } else {
      updateData.status = status;
      if (status === "approved") updateData.is_active = true;
      await logAudit("UPDATE", user.id, `Supplier ${supplier.full_name} status changed to ${status}`, "supplier", id);
      if (status === "approved") {
        await notifyUser(id, "supplier_approved", "Account Approved", "Your supplier account has been approved. You can now view and bid on projects.", "/supplier/projects");
      } else if (status === "rejected") {
        await notifyUser(id, "supplier_rejected", "Account Rejected", "Your supplier account was not approved. Please contact the administrator.", "/supplier/profile");
      }
    }

    await db.user.update({ where: { id }, data: updateData });
    const updated = await db.user.findUnique({ where: { id } });
    if (!updated) return json({ error: "Supplier not found after update" }, 404);
    const { password_hash: _, ...safe } = updated as any;
    return json(safe);
  } catch (e) {
    console.error("[supplier status]", e);
    return json({ error: (e as Error).message, stack: (e as Error).stack || null }, 500);
  }
}
