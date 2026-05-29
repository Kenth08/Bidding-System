import { supabaseServer } from "@/lib/supabase-server";
import path from "path";
import { v4 as uuid } from "uuid";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const DOCUMENTS_BUCKET = "documents";
let bucketReady = false;

async function ensureDocumentsBucket() {
  if (bucketReady) return;

  const { data: buckets, error: listError } = await supabaseServer.storage.listBuckets();
  if (listError) {
    throw new Error(`Failed to list storage buckets: ${listError.message}`);
  }

  const hasBucket = (buckets || []).some((b) => b.name === DOCUMENTS_BUCKET);
  if (!hasBucket) {
    const { error: createError } = await supabaseServer.storage.createBucket(DOCUMENTS_BUCKET, {
      public: false,
      fileSizeLimit: MAX_FILE_SIZE_BYTES,
    });
    if (createError) {
      throw new Error(`Failed to create storage bucket: ${createError.message}`);
    }
  }

  bucketReady = true;
}

export function validateSupplierDocumentFile(file: File) {
  if (!file || file.size <= 0) {
    throw new Error("Please choose a valid file.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File size exceeds 10MB limit.");
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Invalid file type. Only PDF, JPG, and PNG are allowed.");
  }
}

export async function uploadSupplierDocumentToSupabase(params: {
  supplierId: string;
  documentType: string;
  file: File;
}) {
  validateSupplierDocumentFile(params.file);
  await ensureDocumentsBucket();

  const safeDocumentType = params.documentType.replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = path.extname(params.file.name || "") || ".bin";
  const filePath = `supplier-documents/${params.supplierId}/${safeDocumentType}/${uuid()}${ext}`;

  const buffer = Buffer.from(await params.file.arrayBuffer());
  const { error: uploadError } = await supabaseServer.storage
    .from(DOCUMENTS_BUCKET)
    .upload(filePath, buffer, {
      contentType: params.file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload document: ${uploadError.message}`);
  }

  const { data: signedData, error: signedError } = await supabaseServer.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, 60 * 60 * 24 * 7);

  if (signedError) {
    throw new Error(`Failed to generate signed URL: ${signedError.message}`);
  }

  return {
    filePath,
    signedUrl: signedData?.signedUrl || null,
  };
}
