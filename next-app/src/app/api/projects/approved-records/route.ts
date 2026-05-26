import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { user, error } = await requireRole(request, "school_head");
  if (error) return error;

  const projects = await db.project.findMany({
    where: {
      procurement_request: {
        status: "Approved",
        reviewed_by_id: user!.id,
      },
    },
    include: {
      created_by: { select: { id: true, full_name: true, email: true } },
      procurement_request: { include: { reviewed_by: { select: { id: true, full_name: true, email: true } } } },
      bids: true,
    },
    orderBy: [{ updated_at: "desc" }, { created_at: "desc" }],
  });

  return json(projects);
}
