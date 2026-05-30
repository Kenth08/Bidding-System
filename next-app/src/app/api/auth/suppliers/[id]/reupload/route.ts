import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { SUPPLIER_DOCUMENT_LOOKUP } from "@/lib/supplier-documents";
import { addSupplierWorkflowActivity, getSupplierWorkflow, updateSupplierWorkflow } from "@/lib/supplier-workflow-db";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

async function saveFile(file: File, folder: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || ".bin";
  const filename = `${uuid()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "supplier");
  if (error) return error;

  const { id } = await params;
  if (user!.id !== id) return json({ error: "You can only re-upload your own documents." }, 403);

  const formData = await request.formData();
  const documentType = String(formData.get("documentType") || "").trim();
  const file = formData.get("file") as File | null;
  if (!documentType) return json({ error: "Document type is required." }, 400);
  if (!file || file.size <= 0) return json({ error: "Please choose a file before re-uploading." }, 400);

  // Validate file type
  const ext = path.extname(file.name).toLowerCase();
  if (![".pdf", ".jpg", ".jpeg", ".png"].includes(ext)) {
    return json({ error: "Only PDF, JPG, and PNG files are allowed." }, 400);
  }
  // Validate file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    return json({ error: "File size must not exceed 10MB." }, 400);
  }

  const definition = SUPPLIER_DOCUMENT_LOOKUP.get(documentType);
  if (!definition) return json({ error: "Unknown document type." }, 400);
  if (definition.declarationOnly) return json({ error: "This declaration cannot be re-uploaded as a file." }, 400);

  const filePath = await saveFile(file, "documents");

  // Update user's document field
  await db.user.update({
    where: { id },
    data: { [definition.userField]: filePath },
  });

  // Update or create DocumentUpload record with pending_review status
  const existing = await db.documentUpload.findFirst({
    where: { user_id: id, document_type: documentType },
    orderBy: { updated_at: "desc" },
  });

  if (existing) {
    await db.documentUpload.update({
      where: { id: existing.id },
      data: {
        file: filePath,
        file_name: file.name,
        file_size: file.size,
        verification_status: "pending_review",
        verification_notes: null,
        verified_at: null,
        verified_by_id: null,
      },
    });
  } else {
    await db.documentUpload.create({
      data: {
        user_id: id,
        document_type: documentType,
        file_name: file.name,
        file: filePath,
        file_size: file.size,
        verification_status: "pending_review",
      },
    });
  }

  // Remove this document from flagged_reasons but keep account locked
  const workflow = await getSupplierWorkflow(id);
  const nextFlaggedReasons = { ...workflow.flagged_reasons };
  delete nextFlaggedReasons[documentType];

  await updateSupplierWorkflow(id, {
    accountLocked: true, // Keep locked until submit-revision
    flaggedReasons: nextFlaggedReasons,
  });

  await addSupplierWorkflowActivity({
    supplierId: id,
    actorId: id,
    eventType: "SUPPLIER_DOCUMENT_RESUBMITTED",
    message: `Re-uploaded: ${definition.name}`,
    tone: "blue",
    metadata: { documentType, file: filePath },
  }).catch(() => {});

  // Check if all flagged docs are now reuploaded (no remaining flagged_reasons)
  const allReuploaded = Object.keys(nextFlaggedReasons).length === 0;

  return json({
    success: true,
    documentType,
    file: filePath,
    state: "pending_review",
    allFlaggedReuploaded: allReuploaded,
  });
}
