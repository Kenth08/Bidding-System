import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { requireAuth, requireRole, json } from "@/lib/api-utils";
import { logAudit } from "@/lib/actions";
import { createBidLog } from "@/lib/bid-log";
import { canSupplierAccessProject } from "@/lib/project-access";

// Auto-close runs at most once per 5 minutes (in-memory throttle per server instance)
let lastAutoClose = 0;
async function autoCloseExpiredProjects() {
  const now = Date.now();
  if (now - lastAutoClose < 5 * 60 * 1000) return;
  lastAutoClose = now;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await db.project.updateMany({
    where: { status: "active", deadline: { lt: today }, is_archived: false },
    data: { status: "closed" },
  });
}

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("page_size")) || 20));
  const skip = (page - 1) * pageSize;

  // Throttled auto-close (non-blocking for the response)
  autoCloseExpiredProjects().catch(() => {});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let where: Record<string, unknown> = { is_archived: false };

  if (user!.role === "supplier") {
    if (user!.verification_status !== "verified") return json({ results: [], total: 0, page, page_size: pageSize });
    where = { ...where, status: "active" };
  }

  if (statusFilter) where.status = statusFilter;

  if (user!.role === "supplier") {
    // Supplier path: need filtering by business type (can't easily paginate pre-filter)
    const { getSupplierWorkflow } = await import("@/lib/supplier-workflow-db");
    const workflow = await getSupplierWorkflow(user!.id);
    if (user!.verification_status !== "verified" || workflow.account_locked) {
      return json({ results: [], total: 0, page, page_size: pageSize });
    }

    const supplierBTs = await db.supplierBusinessType.findMany({
      where: { supplier_id: user!.id },
      include: { business_type: true },
    });
    const supplierBTNames = supplierBTs.map((s: any) => s.business_type?.name).filter(Boolean);

    const projects = await db.project.findMany({
      where,
      include: {
        created_by: { select: { id: true, full_name: true, email: true } },
        procurement_request: true,
        project_business_types: { include: { business_type: true } },
        bids: { where: { supplier_id: user!.id }, select: { id: true, status: true, submitted_at: true, bid_amount: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const visibleProjects = projects.filter((project: any) => {
      const deadline = project.deadline ? new Date(project.deadline) : null;
      if (!deadline || deadline < today) return false;
      const projectBTNames = (project.project_business_types || [])
        .map((pbt: any) => pbt.business_type?.name)
        .filter(Boolean);
      return canSupplierAccessProject(supplierBTNames, projectBTNames, project.open_to_all ?? true, project.procurement_type);
    });

    const total = visibleProjects.length;
    const paginated = visibleProjects.slice(skip, skip + pageSize);
    return json({ results: paginated, total, page, page_size: pageSize });
  }

  // Admin/other roles: use DB-level pagination
  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      include: {
        created_by: { select: { id: true, full_name: true, email: true } },
        procurement_request: true,
        project_business_types: { include: { business_type: true } },
        bids: true,
      },
      orderBy: { created_at: "desc" },
      skip,
      take: pageSize,
    }),
    db.project.count({ where }),
  ]);

  return json({ results: projects, total, page, page_size: pageSize });
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

  if (Array.isArray(body.business_type_ids) && body.business_type_ids.length > 0) {
    await db.projectBusinessType.createMany({
      data: body.business_type_ids.map((btId: string) => ({ project_id: project.id, business_type_id: btId })),
    });
  }

  await logAudit("CREATE", user!.id, `Created project ${project.title}`, "project", project.id);
  await createBidLog({ projectId: project.id, userId: user!.id, role: "admin", action: "PROJECT_CREATED", description: `Bidding "${project.title}" was created` });
  return json(project, 201);
}
