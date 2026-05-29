import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";
import {
  SUPPLIER_DOCUMENT_DEFINITIONS,
  isDocumentUploaded,
  mapVerificationStatusToState,
} from "@/lib/supplier-documents";
import { getSupplierWorkflow } from "@/lib/supplier-workflow-db";

function normalizeDocumentFile(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed === "DECLARED") return null;
  if (/^(https?:\/\/|\/)/i.test(trimmed)) return trimmed;
  return null;
}

function buildVerificationState(documents: Array<{ required: boolean; state: string }>) {
  const requiredDocs = documents.filter((doc) => doc.required);
  const allRequiredApproved = requiredDocs.length > 0 && requiredDocs.every((doc) => doc.state === "approved");
  const hasFlaggedDocs = documents.some((doc) => doc.state === "flagged");
  const hasPendingDocs = documents.some((doc) => doc.state === "uploaded" || doc.state === "revised" || doc.state === "missing");

  const verificationState = allRequiredApproved ? "verified" : hasFlaggedDocs ? "flagged" : hasPendingDocs ? "pending" : "restricted";
  const accessState = verificationState === "verified" ? "verified" : "restricted";

  return { verificationState, accessState };
}

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  if (user!.role !== "supplier") return json({ error: "Only suppliers can access this endpoint." }, 403);

  const uploads = await db.documentUpload.findMany({
    where: { user_id: user!.id },
    orderBy: { updated_at: "desc" },
  });

  const latestByType = new Map<string, any>();
  for (const upload of uploads) {
    if (!latestByType.has(upload.document_type)) {
      latestByType.set(upload.document_type, upload);
    }
  }

  const documents = SUPPLIER_DOCUMENT_DEFINITIONS.map((definition) => {
    const upload = latestByType.get(definition.id);
    const hasUpload = Boolean(upload?.file);
    const uploaded = isDocumentUploaded(user as unknown as Record<string, unknown>, definition) || hasUpload;
    const state = mapVerificationStatusToState(upload?.verification_status, uploaded);
    const userFile = normalizeDocumentFile((user as any)[definition.userField]);
    const uploadFile = normalizeDocumentFile(upload?.file);

    return {
      id: definition.id,
      name: definition.name,
      required: definition.required,
      declarationOnly: Boolean(definition.declarationOnly),
      uploaded,
      file: uploaded ? userFile ?? uploadFile : null,
      state,
      status: !uploaded ? "not_uploaded" : String(upload?.verification_status || "uploaded").toLowerCase(),
      adminComment: upload?.verification_notes || null,
      flagReason: state === "flagged" ? upload?.verification_notes || null : null,
      reviewedById: upload?.verified_by_id || null,
      reviewedAt: upload?.verified_at || null,
      reason: state === "flagged" ? upload?.verification_notes || null : null,
      expiryDate: definition.expiryField ? (user as any)[definition.expiryField] || null : null,
    };
  });

  const workflow = await getSupplierWorkflow(user!.id);
  const { verificationState: computedState } = buildVerificationState(documents);
  const accountStatus = String(user!.status || user!.verification_status || "");
  const accessState =
    accountStatus === "verified"
      ? "verified"
      : accountStatus === "revision_required"
        ? "revision_required"
        : "restricted";

  const flaggedRequired = documents.filter((doc) => doc.required && doc.state === "flagged");
  const hasRequiredPendingReview = documents.some(
    (doc) => doc.required && (doc.state === "revised" || doc.state === "uploaded")
  );
  const canSubmitRevision =
    accessState === "revision_required" &&
    flaggedRequired.length === 0 &&
    hasRequiredPendingReview;

  return json({
    accountLocked: workflow.account_locked,
    notifSent: workflow.notif_sent,
    accountStatus,
    verificationState: accountStatus === "verified" ? "verified" : computedState,
    accessState,
    canSubmitRevision,
    flaggedRequiredCount: flaggedRequired.length,
    documents,
  });
}
