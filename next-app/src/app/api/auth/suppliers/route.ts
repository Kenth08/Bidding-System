import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const suppliers = await db.user.findMany({ where: { role: "supplier" }, orderBy: { created_at: "desc" } });
  const safe = suppliers.map(({ password_hash: _, ...u }) => u);
  return json({ data: safe });
}
