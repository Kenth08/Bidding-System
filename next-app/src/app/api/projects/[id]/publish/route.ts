import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit, notifyUser } from "@/lib/actions";
import { createBidLog } from "@/lib/bid-log";
import { publishEvent } from "@/lib/sse";
import { normalizeStatusCode, STATUS } from "@/lib/procurementStatus";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const project = await db.project.findUnique({ where: { id } });
  if (!project) return json({ error: "Not found." }, 404);

  if (project.status !== "draft") {
    return json({ error: "Only draft projects can be published." }, 400);
  }

  // Block publishing if the project deadline has already passed (use end-of-day)
  const deadlineDate = project.deadline ? new Date(project.deadline) : null;
  if (deadlineDate) deadlineDate.setHours(23, 59, 59, 999);
  if (deadlineDate && deadlineDate.getTime() < Date.now()) {
    await logAudit("PUBLISH_BLOCKED_EXPIRED", user!.id, `Publishing was blocked because the project deadline already passed. Project: "${project.title}", Deadline: ${new Date(project.deadline).toISOString()}, Previous Status: ${project.status}`, "project", id);
    await createBidLog({ projectId: id, userId: user!.id, role: "admin", action: "PUBLISH_BLOCKED_EXPIRED", description: `Publishing was blocked because the project deadline already passed.` });
    return json({ error: "Cannot publish. The project deadline has already passed." }, 400);
  }

  // If this project was created from a procurement request, ensure the
  // procurement was approved by the Head before allowing publish.
  if (project.procurement_request_id) {
    const procurement = await db.procurement.findUnique({ where: { id: project.procurement_request_id } });
    if (!procurement) return json({ error: "Linked procurement request not found." }, 400);
    const code = normalizeStatusCode(procurement.status);
    if (code !== STATUS.APPROVED) {
      return json({ error: "Cannot publish. Procurement request must be approved by the Head before publishing." }, 400);
    }
  }

  const updated = await db.project.update({
    where: { id },
    data: { status: "active", published_at: new Date() },
  });

  await logAudit("UPDATE", user!.id, `Published project ${project.title}`, "project", id);
  await createBidLog({ projectId: id, userId: user!.id, role: "admin", action: "PROJECT_PUBLISHED", description: `Bidding "${project.title}" was published and is now open for suppliers` });

  // Notify verified suppliers
  const suppliers = await db.user.findMany({ where: { role: "supplier", verification_status: "verified", is_active: true } });
  for (const supplier of suppliers) {
    await notifyUser(supplier.id, "project_published", "New Bidding Opportunity", `A new project "${project.title}" is now open for bidding.`, "/supplier/projects", id);
  }

  // Publish SSE to update connected clients
  try {
    publishEvent("project_published", { id, title: project.title, status: "active" });
  } catch (e) {
    // non-fatal
  }

  return json(updated);
}
