import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const count = await db.notification.count({ where: { recipient_id: user!.id, is_read: false } });
  return json({ count });
}
