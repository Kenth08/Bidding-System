import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";

export async function PATCH(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  await db.notification.updateMany({ where: { recipient_id: user!.id, is_read: false }, data: { is_read: true } });
  return json({ message: "All notifications marked as read." });
}

export async function POST(request: Request) {
  return PATCH(request);
}
