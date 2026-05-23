import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit, notifyUser } from "@/lib/actions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) return json({ error: "Not found." }, 404);

  if (project.status !== "draft") {
    return json({ error: "Only draft projects can be published." }, 400);
  }

  const updated = await db.project.update({
    where: { id },
    data: { status: "active", published_at: new Date() },
  });

  await logAudit("UPDATE", user!.id, `Published project ${project.title}`, "project", id);

  // Notify approved suppliers
  const suppliers = await db.user.findMany({ where: { role: "supplier", status: "approved", is_active: true } });
  for (const supplier of suppliers) {
    await notifyUser(supplier.id, "project_published", "New Bidding Opportunity", `A new project "${project.title}" is now open for bidding.`, "/supplier/projects", id);
  }

  return json(updated);
}
