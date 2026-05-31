import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const { error } = await requireRole(request, "admin");
    if (error) return error;

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("page_size")) || 20));
    const skip = (page - 1) * pageSize;

    const where = {
      role: "supplier" as const,
      status: { notIn: ["draft", "incomplete"] },
    };

    const [users, total, bidStats] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { created_at: "desc" },
        include: { supplier_business_types: { include: { business_type: true } } },
        skip,
        take: pageSize,
      }),
      db.user.count({ where }),
      db.bid.groupBy({
        by: ["supplier_id"],
        _count: { id: true },
      }),
    ]);

    // Get win counts separately (groupBy doesn't support conditional counting)
    const winStats = await db.bid.groupBy({
      by: ["supplier_id"],
      where: { status: "won" },
      _count: { id: true },
    });

    const bidCountMap = new Map(bidStats.map((s) => [s.supplier_id, s._count.id]));
    const winCountMap = new Map(winStats.map((s) => [s.supplier_id, s._count.id]));

    const data = users.map((user) => {
      const { password_hash, ...safeUser } = user as any;
      return {
        ...safeUser,
        bid_count: bidCountMap.get(user.id) || 0,
        wins: winCountMap.get(user.id) || 0,
      };
    });

    return json({ data, total, page, page_size: pageSize });
  } catch (error) {
    console.error("[api/auth/suppliers]", error);
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 500);
  }
}
