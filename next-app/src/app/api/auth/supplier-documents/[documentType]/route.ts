import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";
import { notifyAdmins } from "@/lib/actions";
import {
  SUPPLIER_DOCUMENT_LOOKUP,
} from "@/lib/supplier-documents";
import {
  addSupplierWorkflowActivity,
  getSupplierWorkflow,
  updateSupplierWorkflow,
} from "@/lib/supplier-workflow-db";
import { uploadSupplierDocumentToSupabase } from "@/lib/supabase-upload";

function normalizeDocumentFile(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^(https?:\/\/|\/)/i.test(trimmed)) return trimmed;
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ documentType: string }> }
) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  if (user!.role !== "supplier") return json({ error: "Only suppliers can resubmit documents." }, 403);

  const { documentType } = await params;
  const normalizedType = String(documentType || "").trim();
  const definition = SUPPLIER_DOCUMENT_LOOKUP.get(normalizedType);
  if (!definition) return json({ error: "Unknown document type." }, 400);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!definition.declarationOnly && (!file || file.size <= 0)) {
    return json({ error: "Please upload a file before resubmitting." }, 400);
  }

  const workflow = await getSupplierWorkflow(user!.id);
  const latest = await db.documentUpload.findFirst({
    where: { user_id: user!.id, document_type: normalizedType },
    orderBy: { updated_at: "desc" },
  });
  const latestStatus = String(latest?.verification_status || "").toLowerCase();
  const isFlagged = Object.prototype.hasOwnProperty.call(workflow.flagged_reasons, normalizedType)
    || latestStatus === "flagged"
    || latestStatus === "needs revision"
    || latestStatus === "rejected"
    || latestStatus === "invalid";

  if (!isFlagged) {
    return json({ error: "Only flagged documents can be re-uploaded." }, 400);
  }

  let filePath: string | null = null;
  let fileUrl: string | null = null;

  if (!definition.declarationOnly) {
    let uploadResult;
    try {
      uploadResult = await uploadSupplierDocumentToSupabase({
        supplierId: user!.id,
        documentType: normalizedType,
        file: file!,
      });
    } catch (e: any) {
      return json({ error: e?.message || "Failed to upload document." }, 400);
    }

    filePath = uploadResult.filePath;
    fileUrl = uploadResult.signedUrl;
  }

  const updateData: Record<string, unknown> = {
    [definition.userField]: definition.declarationOnly ? true : (fileUrl || filePath),
  };

  if (definition.expiryField) {
    const expiryRaw = String(formData.get("expiry") || "").trim();
    if (expiryRaw) {
      updateData[definition.expiryField] = new Date(expiryRaw);
    }
  }

  await db.user.update({
    where: { id: user!.id },
    data: updateData,
  });

  // Keep upload history by inserting a fresh row for each re-upload cycle.
  await db.documentUpload.create({
    data: {
      user_id: user!.id,
      document_type: normalizedType,
      file_name: definition.declarationOnly ? definition.name : file!.name,
      file: normalizeDocumentFile(fileUrl || filePath),
      file_size: definition.declarationOnly ? 0 : file!.size,
      verification_status: "Pending_Review",
      verification_notes: null,
    },
  });

  const nextFlaggedReasons = { ...workflow.flagged_reasons };
  delete nextFlaggedReasons[normalizedType];

  await updateSupplierWorkflow(user!.id, {
    accountLocked: true,
    notifSent: workflow.notif_sent,
    flaggedReasons: nextFlaggedReasons,
  });

  await notifyAdmins(
    "supplier_document_resubmitted",
    "Supplier Document Resubmitted",
    `Supplier has resubmitted ${definition.name}. Please re-review.`,
    "/admin/suppliers",
    user!.id
  ).catch(() => {});

  await addSupplierWorkflowActivity({
    supplierId: user!.id,
    actorId: user!.id,
    eventType: "SUPPLIER_DOCUMENT_RESUBMITTED",
    message: `Supplier has resubmitted ${definition.name}. Please re-review.`,
    tone: "blue",
    metadata: { documentType: normalizedType, filePath, fileUrl },
  }).catch(() => {});

  return json({
    success: true,
    documentType: normalizedType,
    filePath,
    fileUrl,
    state: "pending_review",
    accountLocked: true,
    notifSent: workflow.notif_sent,
    requiresSubmit: true,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ documentType: string }> }
) {
  return PATCH(request, context);
}
