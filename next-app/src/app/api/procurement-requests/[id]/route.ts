import { db } from "@/lib/db";
import { requireAuth, requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  if (user!.role === "supplier") return json({ error: "Forbidden." }, 403);

  const { id } = await params;
  const procurement = await db.procurement.findUnique({
    where: { id },
    include: {
      created_by: { select: { id: true, full_name: true, email: true } },
      reviewed_by: { select: { id: true, full_name: true, email: true } },
    },
  });
  if (!procurement) return json({ error: "Not found." }, 404);

  if (user!.role === "admin" && procurement.created_by_id !== user!.id) return json({ error: "Not found." }, 404);
  return json(procurement);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const procurement = await db.procurement.findUnique({ where: { id } });
  if (!procurement) return json({ error: "Not found." }, 404);

  if (!["Pending Review", "Revision Required"].includes(procurement.status)) {
    return json({ error: "Only pending review or revision required requests can be edited." }, 400);
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};
  for (const key of ["project_title", "procurement_type", "technical_specifications", "procurement_schedule", "delivery_period"]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (body.budget !== undefined) data.budget = body.budget;
  if (body.deadline) data.deadline = new Date(body.deadline);
  if (body.public_result_expiry_date) data.public_result_expiry_date = new Date(body.public_result_expiry_date);

  const updated = await db.procurement.update({ where: { id }, data });
  return json(updated);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const procurement = await db.procurement.findUnique({ where: { id } });
  if (!procurement) return json({ error: "Not found." }, 404);

  await db.procurement.delete({ where: { id } });
  return json({ success: true });
}
