import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit } from "@/lib/actions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) return json({ error: "Project not found." }, 404);
  if (project.is_archived) return json({ error: "Project is already archived." }, 400);

  const body = await request.json();
  const reason = String(body.reason || "Archived by admin").trim() || "Archived by admin";

  const updated = await db.project.update({
    where: { id },
    data: { is_archived: true, archived_at: new Date(), archived_reason: reason },
  });

  await logAudit("UPDATE", user!.id, `Archived project ${project.title}`, "project", id);
  return json({ message: `Project "${project.title}" has been archived.`, project: updated });
}
