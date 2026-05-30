import { db } from "@/lib/db";
import { requireAuth, requireRole, json } from "@/lib/api-utils";
import { logAudit } from "@/lib/actions";
import { createBidLog } from "@/lib/bid-log";
import { canSupplierAccessProject } from "@/lib/project-access";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      created_by: { select: { id: true, full_name: true, email: true } },
      procurement_request: true,
      project_business_types: { include: { business_type: true } },
      bids: true,
    },
  });
  if (!project) return json({ error: "Not found." }, 404);

  if (user!.role === "supplier") {
    // Block suppliers who are not fully verified or whose account is locked due to document workflow
    const { getSupplierWorkflow } = await import("@/lib/supplier-workflow-db");
    const workflow = await getSupplierWorkflow(user!.id);
    if (user!.verification_status !== "verified" || workflow.account_locked) return json({ error: "Not found." }, 404);

    if (project.status !== "active") return json({ error: "Not found." }, 404);

    const supplierBTs = await db.supplierBusinessType.findMany({
      where: { supplier_id: user!.id },
      include: { business_type: true },
    });
    const supplierBTNames = supplierBTs.map((s: any) => s.business_type?.name).filter(Boolean);
    const projectBTNames = (project.project_business_types || []).map((pbt: any) => pbt.business_type?.name).filter(Boolean);

    if (!canSupplierAccessProject(supplierBTNames, projectBTNames, project.open_to_all ?? true)) {
      return json({ error: "You are not eligible to view this project based on your registered business type." }, 403);
    }
  }

  return json(project);
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
  if (body.open_to_all !== undefined) data.open_to_all = body.open_to_all;

  const updated = await db.project.update({ where: { id }, data });

  // Sync eligible business types
  if (Array.isArray(body.business_type_ids)) {
    await db.projectBusinessType.deleteMany({ where: { project_id: id } });
    if (body.business_type_ids.length > 0) {
      await db.projectBusinessType.createMany({
        data: body.business_type_ids.map((btId: string) => ({ project_id: id, business_type_id: btId })),
      });
    }
  }
  await logAudit("UPDATE", user!.id, `Updated project ${updated.title}`, "project", id);
  await createBidLog({ projectId: id, userId: user!.id, role: "admin", action: "PROJECT_REVISED", description: `Bidding "${updated.title}" was revised` });
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
