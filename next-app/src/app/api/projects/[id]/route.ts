import { db } from "@/lib/db";
import { requireAuth, requireRole, json } from "@/lib/api-utils";
import { logAudit } from "@/lib/actions";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: { created_by: { select: { id: true, full_name: true, email: true } }, procurement_request: true, bids: true },
  });
  if (!project) return json({ error: "Not found." }, 404);

  // include related audit logs when available (admin use)
  let audit_logs: any[] = [];
  try {
    const all = await db.auditLog.findMany({ include: { user: { select: { id: true, full_name: true, email: true } } }, orderBy: { created_at: "asc" } });
    const bidIds = (project.bids || []).map((b: any) => String(b.id));
    const related = all.filter((r: any) => {
      const rid = String(r.resource_id || "");
      return rid === String(project.id) || bidIds.includes(rid) || (project.procurement_request && rid === String(project.procurement_request.id));
    });
    audit_logs = related;
  } catch (e) {
    // ignore if audit logs unavailable in current DB wrapper
  }

  if (user!.role === "supplier" && project.status !== "active") return json({ error: "Not found." }, 404);
  // return project with optional audit_logs attached for admin UIs
  return json({ ...project, audit_logs });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) return json({ error: "Not found." }, 404);

  if (["active", "closed", "awarded"].includes(project.status)) {
    return json({ error: "This project has been published and cannot be edited." }, 403);
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const key of ["title", "requirements", "procurement_type", "technical_specifications"]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.budget !== undefined) data.budget = body.budget;
  if (body.delivery_period !== undefined) data.delivery_period = body.delivery_period;
  if (body.deadline) data.deadline = new Date(body.deadline);
  if (body.procurement_schedule) data.procurement_schedule = new Date(body.procurement_schedule);
  if (body.public_result_expiry_date) data.public_result_expiry_date = new Date(body.public_result_expiry_date);

  const updated = await db.project.update({ where: { id }, data });
  await logAudit("UPDATE", user!.id, `Updated project ${updated.title}`, "project", id);
  return json(updated);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) return json({ error: "Not found." }, 404);

  if (["active", "closed", "awarded"].includes(project.status)) {
    return json({ error: "This project has been published and cannot be deleted." }, 403);
  }

  await db.project.delete({ where: { id } });
  await logAudit("DELETE", user!.id, `Deleted project ${project.title}`, "project", id);
  return json({ success: true });
}
