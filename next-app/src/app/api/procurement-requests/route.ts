import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { requireAuth, requireRole, json } from "@/lib/api-utils";
import { logAudit } from "@/lib/actions";
import { uploadProcurementPhoto } from "@/lib/supabase-upload";

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

  try {
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
      };
      photos = formData.getAll("photos") as File[];
    } else {
      body = await request.json();
    }

    // Validate photos
    if (photos.length > 5) {
      return json({ error: "Only JPG, PNG, or WEBP images up to 5MB are allowed." }, 400);
    }
    const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    for (const photo of photos) {
      if (photo.size > 5 * 1024 * 1024 || !allowedMimeTypes.has(photo.type)) {
        return json({ error: "Only JPG, PNG, or WEBP images up to 5MB are allowed." }, 400);
      }
    }

    const procurementId = uuid();
    const procurement = await db.procurement.create({
      data: {
        id: procurementId,
        project_title: String(body.project_title || "").trim(),
        budget: body.budget,
        deadline: body.deadline ? new Date(body.deadline) : new Date(Date.now() + 14 * 86400000),
        public_result_expiry_date: body.public_result_expiry_date ? new Date(body.public_result_expiry_date) : null,
        procurement_type: body.procurement_type || "Services",
        technical_specifications: body.technical_specifications || "",
        procurement_schedule: body.procurement_schedule || "",
        delivery_period: body.delivery_period || "",
        status: "Draft",
        created_by_id: user!.id,
      },
    });

    const uploadedUrls: string[] = [];
    if (photos.length > 0) {
      for (const photo of photos) {
        if (photo && photo.size > 0) {
          const uploadedUrl = await uploadProcurementPhoto({
            projectId: procurementId,
            file: photo,
          });
          uploadedUrls.push(uploadedUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        await db.procurement.update({
          where: { id: procurementId },
          data: { photo_urls: uploadedUrls },
        });
        procurement.photo_urls = uploadedUrls;
      }
    }

    await logAudit("CREATE", user!.id, `Created procurement request ${procurement.project_title}`, "procurement", procurement.id);

    return json(procurement, 201);
  } catch (err: any) {
    console.error("[create procurement request error]", err);
    return json({ error: err?.message || "Failed to create procurement request. Please check required fields." }, 500);
  }
}
