"use client";
import { useState, useEffect } from "react";
import { reportsAPI } from "@/services/api";
import StatusBadge from "@/components/shared/StatusBadge";
import { SkeletonTable } from "@/components/ui/Skeleton";

function formatPeso(v: unknown) { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(v || 0)); }

export default function AdminReports() {
  const [tab, setTab] = useState<"procurement" | "suppliers">("procurement");
  const [procData, setProcData] = useState<any>(null);
  const [suppData, setSuppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsAPI.getProcurement().then((r) => setProcData(r.data)).catch(() => setProcData(null)),
      reportsAPI.getSuppliers().then((r) => setSuppData(r.data)).catch(() => setSuppData(null)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonTable />;

  return (
    <div>
      <div className="flex gap-1 mb-6">
        <button onClick={() => setTab("procurement")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "procurement" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Procurement Report</button>
        <button onClick={() => setTab("suppliers")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "suppliers" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Supplier Report</button>
      </div>

      {tab === "procurement" && procData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Projects", value: procData.summary?.total_projects ?? 0, color: "blue" },
              { label: "Active", value: procData.summary?.active_projects ?? 0, color: "emerald" },
              { label: "Awarded", value: procData.summary?.awarded_projects ?? 0, color: "purple" },
              { label: "Total Bids", value: procData.summary?.total_bids ?? 0, color: "amber" },
              { label: "Awarded Amount", value: formatPeso(procData.summary?.total_awarded_amount), color: "emerald" },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl border p-4 border-${color}-200 bg-${color}-50`}><p className={`text-xs font-semibold uppercase text-${color}-600`}>{label}</p><p className={`mt-1 text-xl font-bold text-${color}-700`}>{value}</p></div>
            ))}
          </div>

          {procData.by_procurement_type?.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">By Procurement Type</h3></div>
              <table className="w-full"><thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Type</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Count</th></tr></thead>
                <tbody className="divide-y divide-slate-50">{procData.by_procurement_type.map((t: any) => (<tr key={t.procurement_type}><td className="px-6 py-3 text-sm text-slate-700">{t.procurement_type}</td><td className="px-6 py-3 text-sm font-semibold text-slate-800">{t.count}</td></tr>))}</tbody>
              </table>
            </div>
          )}

          {procData.recent_awards?.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Recent Awards</h3></div>
              <table className="w-full"><thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Winner</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Amount</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Date</th></tr></thead>
                <tbody className="divide-y divide-slate-50">{procData.recent_awards.map((a: any, i: number) => (<tr key={i}><td className="px-6 py-3 text-sm text-slate-700">{a.project__title}</td><td className="px-6 py-3 text-sm text-slate-600">{a.winner__company_name || a.winner__full_name}</td><td className="px-6 py-3 text-sm font-semibold text-slate-800">{formatPeso(a.bid_amount)}</td><td className="px-6 py-3 text-sm text-slate-600">{a.recorded_at ? new Date(a.recorded_at).toLocaleDateString() : "\u2014"}</td></tr>))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "suppliers" && suppData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Suppliers", value: suppData.summary?.total_suppliers ?? 0 },
              { label: "Approved", value: suppData.summary?.approved ?? 0 },
              { label: "Pending", value: suppData.summary?.pending ?? 0 },
              { label: "Rejected", value: suppData.summary?.rejected ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-800">{value}</p></div>
            ))}
          </div>

          {suppData.supplier_list?.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
              <table className="w-full"><thead><tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Company</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Bids</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Wins</th>
              </tr></thead>
                <tbody className="divide-y divide-slate-50">{suppData.supplier_list.map((s: any) => (
                  <tr key={s.id}><td className="px-6 py-3 text-sm text-slate-700">{s.full_name}</td><td className="px-6 py-3 text-sm text-slate-600">{s.company_name}</td><td className="px-6 py-3 text-sm text-slate-600">{s.business_type || "\u2014"}</td><td className="px-6 py-3"><StatusBadge status={s.status} /></td><td className="px-6 py-3 text-sm font-semibold text-slate-800">{s.bid_count}</td><td className="px-6 py-3 text-sm font-semibold text-emerald-600">{s.wins}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
