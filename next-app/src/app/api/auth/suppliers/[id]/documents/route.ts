import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import {
  SUPPLIER_DOCUMENT_DEFINITIONS,
  SUPPLIER_DOCUMENT_LOOKUP,
  isDocumentUploaded,
  mapVerificationStatusToState,
} from "@/lib/supplier-documents";
import {
  addSupplierWorkflowActivity,
  getSupplierWorkflow,
  listSupplierWorkflowActivity,
  updateSupplierWorkflow,
} from "@/lib/supplier-workflow-db";

function normalizeStatus(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const supplier = await db.user.findUnique({ where: { id } });
  if (!supplier) return json({ error: "Supplier not found" }, 404);

  const uploads = await db.documentUpload.findMany({
    where: { user_id: id },
    orderBy: { updated_at: "desc" },
  });

  const latestByType = new Map<string, any>();
  for (const upload of uploads) {
    if (!latestByType.has(upload.document_type)) {
      latestByType.set(upload.document_type, upload);
    }
  }

  const docs = SUPPLIER_DOCUMENT_DEFINITIONS.map((definition) => {
    const upload = latestByType.get(definition.id);
    const uploaded = isDocumentUploaded(supplier as unknown as Record<string, unknown>, definition);
    const state = mapVerificationStatusToState(upload?.verification_status, uploaded);
    return {
      id: definition.id,
      name: definition.name,
      category: definition.category,
      required: definition.required,
      uploaded,
      file: uploaded ? (supplier as any)[definition.userField] ?? upload?.file ?? null : null,
      state,
      reason: state === "flagged" ? upload?.verification_notes || null : null,
      verification_status: upload?.verification_status || null,
    };
  });

  const workflow = await getSupplierWorkflow(id);
  const activityLog = await listSupplierWorkflowActivity(id, 30);

  return json({
    accountLocked: workflow.account_locked,
    notifSent: workflow.notif_sent,
    documents: docs,
    activityLog,
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const documentType = String(body.documentType || "").trim();
  const action = String(body.action || "").trim().toLowerCase();
  const reason = String(body.reason || "").trim();

  if (!documentType || !["approve", "flag"].includes(action)) {
    return json({ error: "Invalid document action request." }, 400);
  }

  const definition = SUPPLIER_DOCUMENT_LOOKUP.get(documentType);
  if (!definition) return json({ error: "Unknown document type." }, 400);

  const supplier = await db.user.findUnique({ where: { id } });
  if (!supplier) return json({ error: "Supplier not found." }, 404);

  const uploaded = isDocumentUploaded(supplier as unknown as Record<string, unknown>, definition);
  if (!uploaded) {
    return json({ error: "Document cannot be reviewed because it has not been uploaded." }, 400);
  }

  const existing = await db.documentUpload.findFirst({
    where: { user_id: id, document_type: documentType },
    orderBy: { updated_at: "desc" },
  });

  const currentState = mapVerificationStatusToState(existing?.verification_status, uploaded);
  if (action === "approve" && currentState === "approved") {
    return json({ error: "Document is already approved." }, 400);
  }
  if (action === "flag" && currentState === "approved") {
    return json({ error: "Approved documents cannot be flagged." }, 400);
  }

  const verificationStatus = action === "approve" ? "Approved" : "Needs Revision";
  const verificationNotes = action === "flag" ? reason : null;

  if (existing) {
    await db.documentUpload.update({
      where: { id: existing.id },
      data: {
        verification_status: verificationStatus,
        verification_notes: verificationNotes,
        verified_at: new Date(),
        verified_by_id: user!.id,
      },
    });
  } else {
    await db.documentUpload.create({
      data: {
        user_id: id,
        document_type: documentType,
        file_name: definition.name,
        file: definition.declarationOnly ? "DECLARED" : String((supplier as any)[definition.userField] || ""),
        file_size: 0,
        verification_status: verificationStatus,
        verification_notes: verificationNotes,
        verified_at: new Date(),
        verified_by_id: user!.id,
      },
    });
  }

  const workflow = await getSupplierWorkflow(id);
  const nextFlaggedReasons = { ...workflow.flagged_reasons };

  if (action === "flag") {
    nextFlaggedReasons[documentType] = reason || "Document requires revision.";
    await updateSupplierWorkflow(id, {
      flaggedReasons: nextFlaggedReasons,
      notifSent: false,
    });
  } else {
    delete nextFlaggedReasons[documentType];
    await updateSupplierWorkflow(id, {
      flaggedReasons: nextFlaggedReasons,
    });
  }

  await addSupplierWorkflowActivity({
    supplierId: id,
    actorId: user!.id,
    eventType: action === "approve" ? "SUPPLIER_DOCUMENT_APPROVED" : "SUPPLIER_DOCUMENT_FLAGGED",
    message: `${action === "approve" ? "Approved" : "Flagged"} ${definition.name} for supplier ${supplier.full_name}`,
    tone: action === "approve" ? "green" : "red",
    metadata: { documentType, reason: verificationNotes },
  }).catch(() => {});

  const refreshed = await db.documentUpload.findFirst({
    where: { user_id: id, document_type: documentType },
    orderBy: { updated_at: "desc" },
  });

  const updatedWorkflow = await getSupplierWorkflow(id);

  return json({
    id: documentType,
    state: mapVerificationStatusToState(normalizeStatus(refreshed?.verification_status), uploaded),
    reason: refreshed?.verification_notes || null,
    notifSent: updatedWorkflow.notif_sent,
  });
}
