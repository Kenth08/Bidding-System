import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const count = await db.notification.count({ where: { recipient_id: user!.id, is_read: false } });
    return json({ count });
  } catch (error) {
    console.error("Failed to load unread notification count:", error);
    return json({ count: 0 });
  }
}
