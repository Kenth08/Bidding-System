import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { requireAuth, requireRole, json } from "@/lib/api-utils";
import { logAudit } from "@/lib/actions";

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get("status");
  const today = new Date();

  // Auto-close expired active projects
  await db.project.updateMany({
    where: { status: "active", deadline: { lt: today }, is_archived: false },
    data: { status: "closed" },
  });

  let where: Record<string, unknown> = { is_archived: false };

  if (user!.role === "supplier") {
    if (!["approved", "active"].includes(user!.status)) return json([]);
    where = { ...where, status: "active", deadline: { gte: today } };
  }

  if (statusFilter) where.status = statusFilter;

  const projects = await db.project.findMany({
    where,
    include: { created_by: { select: { id: true, full_name: true, email: true } }, procurement_request: true, bids: true },
    orderBy: { created_at: "desc" },
  });

  return json(projects);
}

export async function POST(request: Request) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const body = await request.json();
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
      created_by_id: user!.id,
    },
  });

  await logAudit("CREATE", user!.id, `Created project ${project.title}`, "project", project.id);
  return json(project, 201);
}
