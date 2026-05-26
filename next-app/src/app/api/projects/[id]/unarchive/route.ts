import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) return json({ error: "Project not found." }, 404);
  if (!project.is_archived) return json({ error: "Project is not archived." }, 400);

  const updated = await db.project.update({
    where: { id },
    data: { is_archived: false, archived_at: null, archived_reason: null },
  });

  return json({ message: `Project "${project.title}" has been restored.`, project: updated });
}
