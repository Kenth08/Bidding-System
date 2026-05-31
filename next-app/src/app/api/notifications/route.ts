import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("page_size")) || 20));
  const skip = (page - 1) * pageSize;

  const where = { recipient_id: user!.id };

  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: pageSize,
    }),
    db.notification.count({ where }),
  ]);

  return json({ results: notifications, total, page, page_size: pageSize });
}
