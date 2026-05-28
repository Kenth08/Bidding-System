import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { notifyAdmins } from "@/lib/actions";
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

  const definition = SUPPLIER_DOCUMENT_LOOKUP.get(documentType);
  if (!definition) return json({ error: "Unknown document type." }, 400);
  if (definition.declarationOnly) return json({ error: "This declaration cannot be re-uploaded as a file." }, 400);

  const filePath = await saveFile(file, "documents");
  await db.user.update({
    where: { id },
    data: { [definition.userField]: filePath },
  });

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
        verification_status: "Revised",
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
        verification_status: "Revised",
        verification_notes: null,
      },
    });
  }

  const workflow = await getSupplierWorkflow(id);
  const nextFlaggedReasons = { ...workflow.flagged_reasons };
  delete nextFlaggedReasons[documentType];

  await updateSupplierWorkflow(id, {
    accountLocked: false,
    notifSent: false,
    flaggedReasons: nextFlaggedReasons,
  });

  await notifyAdmins(
    "supplier_document_resubmitted",
    "Supplier Document Re-uploaded",
    `Supplier has re-uploaded ${definition.name}. Please re-review.`,
    "/admin/suppliers",
    id
  ).catch(() => {});

  await addSupplierWorkflowActivity({
    supplierId: id,
    actorId: id,
    eventType: "SUPPLIER_DOCUMENT_RESUBMITTED",
    message: `Supplier has re-uploaded ${definition.name}. Please re-review.`,
    tone: "blue",
    metadata: { documentType, file: filePath },
  }).catch(() => {});

  return json({
    success: true,
    documentType,
    file: filePath,
    state: "revised",
    accountLocked: false,
    notifSent: false,
  });
}