import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit, notifyUser } from "@/lib/actions";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const id = params.id;
  const body = await request.json();
  const updates: any = {};

  if (body.verification_status) updates.verification_status = String(body.verification_status);
  if (body.verification_notes !== undefined) updates.verification_notes = body.verification_notes;
  if (body.verified_at !== undefined) updates.verified_at = body.verified_at ? new Date(String(body.verified_at)) : null;
  // set verifier to current admin
  updates.verified_by_id = user.id;

  try {
    const doc = await db.documentUpload.update({ where: { id }, data: updates });

    await logAudit("DOCUMENT_VERIFY", user.id, `Document ${doc.document_type} verification updated for user ${doc.user_id}`, "document_upload", doc.id).catch(() => {});
    // notify the document owner
    await notifyUser(doc.user_id, "document_verified", "Document Verification Updated", `Your document ${doc.document_type} has been marked as ${doc.verification_status}.`, `/supplier/profile`, doc.id).catch(() => {});

    return json(doc);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
}
