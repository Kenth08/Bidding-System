import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { requireAuth, requireRole, json } from "@/lib/api-utils";
import { logAudit } from "@/lib/actions";
import { createBidLog } from "@/lib/bid-log";
import { canSupplierAccessProject } from "@/lib/project-access";

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Auto-close expired active projects
  await db.project.updateMany({
    where: { status: "active", deadline: { lt: today }, is_archived: false },
    data: { status: "closed" },
  });

  let where: Record<string, unknown> = { is_archived: false };

  if (user!.role === "supplier") {
    if (!["approved", "active"].includes(user!.status)) return json([]);
    where = { ...where, status: "active" };
  }

  if (statusFilter) where.status = statusFilter;

  const projects = await db.project.findMany({
    where,
    include: {
      created_by: { select: { id: true, full_name: true, email: true } },
      procurement_request: true,
      project_business_types: { include: { business_type: true } },
      bids: user!.role === "supplier" ? { where: { supplier_id: user!.id }, select: { id: true, status: true, submitted_at: true, bid_amount: true } } : true,
    },
    orderBy: { created_at: "desc" },
  });

  if (user!.role === "supplier") {
    // Block suppliers who are not fully verified or whose account is locked due to document workflow
    const { getSupplierWorkflow } = await import("@/lib/supplier-workflow-db");
    const workflow = await getSupplierWorkflow(user!.id);
    if (user!.verification_status !== "verified" || workflow.account_locked) return json([]);

    // Get supplier's business type names
    const supplierBTs = await db.supplierBusinessType.findMany({
      where: { supplier_id: user!.id },
      include: { business_type: true },
    });
    const supplierBTNames = supplierBTs.map((s: any) => s.business_type?.name).filter(Boolean);

    const visibleProjects = projects.filter((project: any) => {
      const deadline = project.deadline ? new Date(project.deadline) : null;
      if (!deadline || deadline < today) return false;
      const projectBTNames = (project.project_business_types || [])
        .map((pbt: any) => pbt.business_type?.name)
        .filter(Boolean);
      return canSupplierAccessProject(supplierBTNames, projectBTNames, project.open_to_all ?? true);
    });

    return json(visibleProjects);
  }

  return json(projects);
}

export async function POST(request: Request) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const body = await request.json();
  const openToAll = body.open_to_all !== false && !(body.business_type_ids?.length > 0);

  const project = await db.project.create({
    data: {
      id: uuid(),
      title: body.title,
      budget: body.budget,
      deadline: new Date(body.deadline),
      procurement_schedule: body.procurement_schedule ? new Date(body.procurement_schedule) : null,
      public_result_expiry_date: body.public_result_expiry_date ? new Date(body.public_result_expiry_date) : null,
      requirements: body.requirements || "",
      procurement_type: body.procurement_type || "Services",
      delivery_period: body.delivery_period || 0,
      technical_specifications: body.technical_specifications || "",
      status: "draft",
      open_to_all: openToAll,
      created_by_id: user!.id,
    },
  });

  // Save eligible business types
  if (Array.isArray(body.business_type_ids) && body.business_type_ids.length > 0) {
    await db.projectBusinessType.createMany({
      data: body.business_type_ids.map((btId: string) => ({ project_id: project.id, business_type_id: btId })),
    });
  }

  await logAudit("CREATE", user!.id, `Created project ${project.title}`, "project", project.id);
  await createBidLog({ projectId: project.id, userId: user!.id, role: "admin", action: "PROJECT_CREATED", description: `Bidding "${project.title}" was created` });
  return json(project, 201);
}
