import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const projects = await db.project.findMany({
    where: { is_archived: true },
    include: { created_by: { select: { id: true, full_name: true, email: true } }, procurement_request: true, bids: true },
    orderBy: [{ archived_at: "desc" }, { created_at: "desc" }],
  });

  return json(projects);
}
