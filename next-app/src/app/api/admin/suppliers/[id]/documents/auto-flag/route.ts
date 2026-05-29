import { requireRole, json } from "@/lib/api-utils";
import { autoFlagMissingRequiredDocuments } from "@/lib/supplier-verification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const result = await autoFlagMissingRequiredDocuments(id, user!.id);
  return json({ success: true, autoFlagged: result.autoFlagged });
}
