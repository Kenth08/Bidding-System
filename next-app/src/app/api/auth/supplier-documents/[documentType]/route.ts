import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
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

async function saveFile(file: File, folder: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || ".bin";
  const filename = `${uuid()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

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
  if (definition.declarationOnly) return json({ error: "This declaration cannot be uploaded as a file." }, 400);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file || file.size <= 0) {
    return json({ error: "Please upload a file before resubmitting." }, 400);
  }

  const filePath = await saveFile(file, "documents");
  const updateData: Record<string, unknown> = {
    [definition.userField]: filePath,
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

  const existing = await db.documentUpload.findFirst({
    where: { user_id: user!.id, document_type: normalizedType },
    orderBy: { updated_at: "desc" },
  });

  if (existing) {
    await db.documentUpload.update({
      where: { id: existing.id },
      data: {
        file: filePath,
        file_name: file.name,
        file_size: file.size,
        verification_status: "Revised",
        verification_notes: null,
        verified_at: null,
        verified_by_id: null,
      },
    });
  } else {
    await db.documentUpload.create({
      data: {
        user_id: user!.id,
        document_type: normalizedType,
        file_name: file.name,
        file: normalizeDocumentFile(filePath),
        file_size: file.size,
        verification_status: "Revised",
        verification_notes: null,
      },
    });
  }

  const workflow = await getSupplierWorkflow(user!.id);
  const nextFlaggedReasons = { ...workflow.flagged_reasons };
  delete nextFlaggedReasons[normalizedType];

  await updateSupplierWorkflow(user!.id, {
    accountLocked: false,
    notifSent: false,
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
    metadata: { documentType: normalizedType, file: filePath },
  }).catch(() => {});

  return json({
    success: true,
    documentType: normalizedType,
    file: filePath,
    state: "revised",
    accountLocked: false,
    notifSent: false,
  });
}
