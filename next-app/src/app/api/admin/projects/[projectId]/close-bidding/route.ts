import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";
import { logAudit } from "@/lib/actions";
import { createBidLog } from "@/lib/bid-log";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const { projectId } = await params;
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return json({ error: "Project not found." }, 404);
  if (project.status !== "active") return json({ error: "Project is not open for bidding." }, 400);

  // Check no winner already selected
  const winner = await db.bid.findFirst({ where: { project_id: projectId, status: "won" } });
  if (winner) return json({ error: "A winner has already been selected." }, 400);

  await db.project.update({ where: { id: projectId }, data: { status: "closed" } });

  await logAudit("CLOSE_BIDDING", user!.id, `Closed bidding for project: ${project.title}`, "project", projectId);
  await createBidLog({ projectId, bidId: null, supplierId: null, userId: user!.id, role: "admin", action: "BIDDING_CLOSED", description: `Admin closed bidding for evaluation` });

  return json({ message: "Bidding has been closed. You can now select a winner." });
}
