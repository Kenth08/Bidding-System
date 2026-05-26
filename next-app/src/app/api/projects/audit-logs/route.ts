import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const logs = await db.auditLog.findMany({
    include: { user: { select: { id: true, full_name: true, email: true } } },
    orderBy: { created_at: "desc" },
  });

  return json(logs);
}
