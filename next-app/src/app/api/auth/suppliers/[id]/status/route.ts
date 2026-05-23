import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit, notifyUser } from "@/lib/actions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const status = String(body.status || "").toLowerCase();
  const allowed = ["approved", "rejected", "active", "inactive"];
  if (!allowed.includes(status)) {
    return json({ error: `Status must be one of: ${allowed.join(", ")}` }, 400);
  }

  const supplier = await db.user.findFirst({ where: { id, role: "supplier" } });
  if (!supplier) return json({ error: "Supplier not found" }, 404);

  await db.user.update({ where: { id }, data: { status } });
  await logAudit("UPDATE", user!.id, `Supplier ${supplier.full_name} status changed to ${status}`, "supplier", id);

  if (status === "approved") {
    await notifyUser(id, "supplier_approved", "Account Approved", "Your supplier account has been approved. You can now view and bid on projects.", "/supplier/projects");
  } else if (status === "rejected") {
    await notifyUser(id, "supplier_rejected", "Account Rejected", "Your supplier account was not approved. Please contact the administrator.", "/supplier/profile");
  }

  const updated = await db.user.findUnique({ where: { id } });
  const { password_hash: _, ...safe } = updated!;
  return json(safe);
}
