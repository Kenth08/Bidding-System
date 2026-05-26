import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const notif = await db.notification.findFirst({ where: { id, recipient_id: user!.id } });
  if (!notif) return json({ error: "Notification not found" }, 404);

  const updated = await db.notification.update({ where: { id }, data: { is_read: true } });
  return json(updated);
}
