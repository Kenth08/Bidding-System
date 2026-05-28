import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { requireAuth, requireRole, json } from "@/lib/api-utils";
import { logAudit, notifyUser } from "@/lib/actions";

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  if (user!.role === "supplier") return json([]);

  const where: Record<string, unknown> =
    user!.role === "admin" ? { created_by_id: user!.id } : user!.role === "school_head" ? { status: { not: "Draft" } } : {};

  const procurements = await db.procurement.findMany({
    where,
    include: {
      created_by: { select: { id: true, full_name: true, email: true } },
      reviewed_by: { select: { id: true, full_name: true, email: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return json(procurements);
}

export async function POST(request: Request) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const body = await request.json();
  const procurement = await db.procurement.create({
    data: {
      id: uuid(),
      project_title: body.project_title,
      budget: body.budget,
      deadline: body.deadline ? new Date(body.deadline) : new Date(Date.now() + 14 * 86400000),
      public_result_expiry_date: body.public_result_expiry_date ? new Date(body.public_result_expiry_date) : null,
      procurement_type: body.procurement_type || "Services",
      technical_specifications: body.technical_specifications || "",
      procurement_schedule: body.procurement_schedule || "",
      delivery_period: body.delivery_period || "",
      status: "Pending Review",
      created_by_id: user!.id,
    },
  });

  await logAudit("CREATE", user!.id, `Created procurement request ${procurement.project_title}`, "procurement", procurement.id);

  return json(procurement, 201);
}
