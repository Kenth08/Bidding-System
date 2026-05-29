import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit, notifyUser } from "@/lib/actions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "school_head");
  if (error) return error;

  const { id } = await params;
  const procurement = await db.procurement.findUnique({ where: { id } });
  if (!procurement) return json({ error: "Procurement request not found." }, 404);

  if (procurement.status !== "Pending Review") {
    return json({ error: "Only pending review requests can be reviewed." }, 400);
  }

  const body = await request.json();
  const action = String(body.action || "").trim().toLowerCase();
  const remarks = String(body.remarks || body.rejection_reason || body.revision_notes || "").trim();

  if (!["approved", "rejected", "revision_required"].includes(action)) {
    return json({ error: "Invalid action." }, 400);
  }

  const updateData: Record<string, unknown> = {
    reviewed_by_id: user!.id,
    reviewed_at: new Date(),
    review_remarks: remarks,
  };

  let project = null;

  if (action === "approved") {
    updateData.status = "Approved";
    updateData.rejection_reason = "";
    updateData.revision_notes = "";

    const deliveryPeriod = procurement.delivery_period
      ? parseInt(String(procurement.delivery_period).replace(/\D/g, "")) || 0
      : 0;

    const existingProject = await db.project.findFirst({ where: { procurement_request_id: id } });
    const projectData = {
      title: procurement.project_title,
      budget: procurement.budget,
      deadline: procurement.deadline || new Date(Date.now() + 14 * 86400000),
      procurement_schedule: procurement.procurement_schedule ? new Date(procurement.procurement_schedule) : null,
      public_result_expiry_date: procurement.public_result_expiry_date,
      requirements: procurement.technical_specifications,
      procurement_type: procurement.procurement_type,
      delivery_period: deliveryPeriod,
      technical_specifications: procurement.technical_specifications,
      status: "draft",
      created_by_id: procurement.created_by_id,
    };

    project = existingProject
      ? await db.project.update({ where: { id: existingProject.id }, data: projectData })
      : await db.project.create({ data: { id: uuid(), procurement_request_id: id, ...projectData } });

    await logAudit("APPROVE", user!.id, `Approved procurement request ${procurement.project_title}`, "procurement", id);
    if (procurement.created_by_id) {
      await notifyUser(procurement.created_by_id, "request_approved", "Procurement Request Approved", `School Head approved your procurement request: ${procurement.project_title}. Publish it when ready.`, "/admin/projects", id);
    }
  } else if (action === "rejected") {
    if (!remarks) return json({ error: "Rejection reason is required." }, 400);
    updateData.status = "Rejected";
    updateData.rejection_reason = remarks;
    updateData.revision_notes = "";

    await logAudit("REJECT", user!.id, `Rejected procurement request ${procurement.project_title}`, "procurement", id);
    if (procurement.created_by_id) {
      await notifyUser(procurement.created_by_id, "request_rejected", "Procurement Request Rejected", `School Head rejected your procurement request: ${procurement.project_title}. Reason: ${remarks}`, "/admin/procurement", id);
    }
  } else {
    if (!remarks) return json({ error: "Revision notes are required." }, 400);
    updateData.status = "Revision Required";
    updateData.revision_notes = remarks;
    updateData.rejection_reason = "";

    await logAudit("UPDATE", user!.id, `Returned procurement request ${procurement.project_title} for revision`, "procurement", id);
  }

  const updated = await db.procurement.update({ where: { id }, data: updateData });

  const response: Record<string, unknown> = {
    message: "Request reviewed successfully.",
    request: updated,
  };
  if (project) response.project = project;

  return json(response);
}
