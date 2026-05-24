import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const { error } = await requireRole(request, "admin");
    if (error) return error;

    const suppliers = await db.user.findMany({ where: { role: "supplier" }, orderBy: { created_at: "desc" } });
    const safe = suppliers.map(({ password_hash: _, ...u }) => u);
    return json({ data: safe });
  } catch (error) {
    console.error("[api/auth/suppliers]", error);
    const message = error instanceof Error ? error.message : (() => {
      try {
        return JSON.stringify(error);
      } catch {
        return String(error);
      }
    })();
    return json({ error: message }, 500);
  }
}
