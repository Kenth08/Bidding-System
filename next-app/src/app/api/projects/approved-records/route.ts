import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { user, error } = await requireRole(request, "school_head");
  if (error) return error;

  const records = await db.procurement.findMany({
    where: {
      status: "Approved",
      reviewed_by_id: user!.id,
    },
    include: {
      created_by: { select: { id: true, full_name: true, email: true } },
      reviewed_by: { select: { id: true, full_name: true, email: true } },
    },
    orderBy: [{ reviewed_at: "desc" }, { created_at: "desc" }],
  });

  return json(records);
}
