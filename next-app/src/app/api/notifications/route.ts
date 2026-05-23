import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const notifications = await db.notification.findMany({
    where: { recipient_id: user!.id },
    orderBy: { created_at: "desc" },
  });

  return json(notifications);
}
