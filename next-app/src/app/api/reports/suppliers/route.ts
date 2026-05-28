import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const { error } = await requireRole(request, "admin");
    if (error) return error;

    const [suppliers, bids] = await Promise.all([
      db.user.findMany({
        where: { role: "supplier" },
        select: { id: true, full_name: true, email: true, company_name: true, business_type: true, status: true, created_at: true, _count: { select: { bids: true, blockchain_records: true } } },
        orderBy: { created_at: "desc" },
      }),
      db.bid.findMany({ select: { supplier_id: true, status: true } }),
    ]);

    const bidCounts = Object.values(
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
    for (const supplier of suppliers) {
      supplierById.set(supplier.id, supplier);
    }

    for (const bidRow of bidCounts) {
      if (!supplierById.has(bidRow.supplier_id)) {
        const user = await db.user.findUnique({ where: { id: bidRow.supplier_id } });
        if (user) supplierById.set(user.id, user);
      }
    }

    const mergedSuppliers = Array.from(supplierById.values());

    const supplier_list = mergedSuppliers.map((s: any) => ({
      id: s.id,
      full_name: s.full_name,
      email: s.email,
      company_name: s.company_name,
      business_type: s.business_type,
      status: s.status,
      bid_count: s._count?.bids ?? bidCounts.find((row) => row.supplier_id === s.id)?.bid_count ?? 0,
      wins: s._count?.blockchain_records ?? bidCounts.find((row) => row.supplier_id === s.id)?.win_count ?? 0,
    }));

    const total = supplier_list.length;
    const approved = supplier_list.filter((s: any) => s.status === "approved").length;
    const pending = supplier_list.filter((s: any) => s.status === "pending").length;
    const rejected = supplier_list.filter((s: any) => s.status === "rejected").length;

    return json({
      summary: { total_suppliers: total, approved, pending, rejected },
      supplier_list,
    });
  } catch (error) {
    console.error("[api/reports/suppliers]", error);
    return json({ error: error instanceof Error ? error.message : "Failed to load supplier report." }, 500);
  }
}
