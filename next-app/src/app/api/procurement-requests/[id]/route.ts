import { db } from "@/lib/db";
import { requireAuth, requireRole, json } from "@/lib/api-utils";
import { logAudit, notifyUser } from "@/lib/actions";
import { uploadProcurementPhoto } from "@/lib/supabase-upload";

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

  try {
    const { id } = await params;
    const procurement = await db.procurement.findUnique({ where: { id } });
    if (!procurement) return json({ error: "Not found." }, 404);

    let body: any = {};
    let photos: File[] = [];
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = {
        project_title: formData.get("title") || formData.get("project_title"),
        budget: formData.get("approvedBudget") || formData.get("budget"),
        deadline: formData.get("biddingClosesOn") || formData.get("deadline"),
        public_result_expiry_date: formData.get("publicResultVisibleUntil") || formData.get("public_result_expiry_date"),
        procurement_type: formData.get("procurementType") || formData.get("procurement_type"),
        technical_specifications: formData.get("technicalSpecifications") || formData.get("technical_specifications"),
        procurement_schedule: formData.get("procurementSchedule") || formData.get("procurement_schedule"),
        delivery_period: formData.get("expectedDeliveryDate") || formData.get("delivery_period"),
        action: formData.get("action"),
        existing_photos: formData.getAll("existing_photos"),
      };
      photos = formData.getAll("photos") as File[];
    } else {
      body = await request.json();
    }

    const action = String(body.action || "").trim().toLowerCase();

    if (action === "submit_for_review") {
      if (!["Draft", "Revision Required"].includes(procurement.status)) {
        return json({ error: "Only draft or revision required requests can be submitted." }, 400);
      }

      const updated = await db.procurement.update({
        where: { id },
        data: { status: "Pending Review" },
      });

      await logAudit("UPDATE", user!.id, `Submitted procurement request ${procurement.project_title} for review`, "procurement", id);

      const schoolHeads = await db.user.findMany({ where: { role: "school_head", is_active: true } });
      for (const sh of schoolHeads) {
        await notifyUser(sh.id, "procurement_request", "Procurement Request Ready for Review", `A procurement request is ready for review: ${procurement.project_title}.`, "/school-head/requests", procurement.id);
      }

      return json(updated);
    }

    if (!["Draft", "Revision Required"].includes(procurement.status)) {
      return json({ error: "Only draft or revision required requests can be edited." }, 400);
    }

    // Validate photos
    if (contentType.includes("multipart/form-data")) {
      const totalPhotosCount = (body.existing_photos || []).length + photos.length;
      if (totalPhotosCount > 5) {
        return json({ error: "Only JPG, PNG, or WEBP images up to 5MB are allowed." }, 400);
      }
      const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
      for (const photo of photos) {
        if (photo.size > 5 * 1024 * 1024 || !allowedMimeTypes.has(photo.type)) {
          return json({ error: "Only JPG, PNG, or WEBP images up to 5MB are allowed." }, 400);
        }
      }
    }

    const data: Record<string, unknown> = {};
    for (const key of ["project_title", "procurement_type", "technical_specifications", "procurement_schedule", "delivery_period"]) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    if (body.budget !== undefined) data.budget = body.budget;
    if (body.deadline) data.deadline = new Date(body.deadline);
    if (body.public_result_expiry_date) data.public_result_expiry_date = new Date(body.public_result_expiry_date);

    if (contentType.includes("multipart/form-data")) {
      const uploadedUrls: string[] = [];
      for (const photo of photos) {
        if (photo && photo.size > 0) {
          const uploadedUrl = await uploadProcurementPhoto({
            projectId: id,
            file: photo,
          });
          uploadedUrls.push(uploadedUrl);
        }
      }
      const keptPhotos = (body.existing_photos || []).map(String).filter(Boolean);
      const photoUrls = [...keptPhotos, ...uploadedUrls];
      if (photoUrls.length > 0) {
        data.photo_urls = photoUrls;
      }
    }

    const updated = await db.procurement.update({ where: { id }, data });
    return json(updated);
  } catch (err: any) {
    console.error("[update procurement request error]", err);
    return json({ error: err?.message || "Failed to update procurement request." }, 500);
  }
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
