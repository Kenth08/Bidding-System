import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const bid = await db.bid.findUnique({
    where: { id },
    include: { project: true, supplier: { select: { id: true, full_name: true, email: true, company_name: true } } },
  });
  if (!bid) return json({ error: "Bid not found" }, 404);
  return json(bid);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const { id } = await params;
  const bid = await db.bid.findUnique({ where: { id } });
  if (!bid) return json({ error: "Bid not found" }, 404);

  return json({ error: "Submitted bids cannot be edited." }, 403);
}
