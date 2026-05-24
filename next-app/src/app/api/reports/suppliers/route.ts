import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const { error } = await requireRole(request, "admin");
    if (error) return error;

    const suppliers = await db.user.findMany({
      where: { role: "supplier" },
      select: { id: true, full_name: true, email: true, company_name: true, business_type: true, status: true, created_at: true, _count: { select: { bids: true, blockchain_records: true } } },
      orderBy: { created_at: "desc" },
    });

    const supplier_list = suppliers.map((s: any) => ({
      id: s.id,
      full_name: s.full_name,
      email: s.email,
      company_name: s.company_name,
      business_type: s.business_type,
      status: s.status,
      bid_count: s._count?.bids ?? 0,
      wins: s._count?.blockchain_records ?? 0,
    }));

    const total = suppliers.length;
    const approved = suppliers.filter((s: any) => s.status === "approved").length;
    const pending = suppliers.filter((s: any) => s.status === "pending").length;
    const rejected = suppliers.filter((s: any) => s.status === "rejected").length;

    return json({
      summary: { total_suppliers: total, approved, pending, rejected },
      supplier_list,
    });
  } catch (error) {
    console.error("[api/reports/suppliers]", error);
    return json({ error: error instanceof Error ? error.message : "Failed to load supplier report." }, 500);
  }
}
