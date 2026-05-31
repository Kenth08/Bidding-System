import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const { error } = await requireRole(request, "admin");
    if (error) return error;

    const [allUsers, bids] = await Promise.all([
      db.user.findMany({
        where: { role: "supplier" },
        orderBy: { created_at: "desc" },
        include: { supplier_business_types: { include: { business_type: true } } },
      }),
      db.bid.findMany({ select: { supplier_id: true, status: true } }),
    ]);

    // Exclude suppliers who haven't completed registration
    const users = allUsers.filter((u: any) => u.status !== "draft" && u.status !== "incomplete");

    const bidRows = Object.values(
      bids.reduce((acc: Record<string, { supplier_id: string; bid_count: number; win_count: number }>, bid: any) => {
        const supplierId = String(bid?.supplier_id || "");
        if (!supplierId) return acc;
        if (!acc[supplierId]) acc[supplierId] = { supplier_id: supplierId, bid_count: 0, win_count: 0 };
        acc[supplierId].bid_count += 1;
        if (bid?.status === "won") acc[supplierId].win_count += 1;
        return acc;
      }, {})
    ) as Array<{ supplier_id: string; bid_count: number; win_count: number }>;

    const supplierById = new Map<string, any>();

    for (const user of users) {
      const { password_hash, ...safeUser } = user as any;
      supplierById.set(user.id, {
        ...safeUser,
        bid_count: 0,
        wins: 0,
      });
    }

    for (const bidRow of bidRows) {
      const existing = supplierById.get(bidRow.supplier_id);
      if (existing) {
        existing.bid_count = bidRow.bid_count ?? existing.bid_count;
        existing.wins = bidRow.win_count ?? existing.wins;
      }
    }

    const safe = Array.from(supplierById.values()).sort((left, right) => {
      const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
      const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
      return rightTime - leftTime;
    });

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
