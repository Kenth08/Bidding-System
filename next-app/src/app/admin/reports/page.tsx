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
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type?: "success" | "error" }>>([]);
  const pushToast = (msg: string, type: "success" | "error" = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  };

  useEffect(() => {
    Promise.all([
      reportsAPI.getProcurement().then((r) => setProcData(r.data)).catch(() => setProcData(null)),
      reportsAPI.getSuppliers().then((r) => setSuppData(r.data)).catch(() => setSuppData(null)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonTable />;

  async function downloadCSV(kind: "procurement" | "suppliers") {
    setExportingCSV(true);
    try {
      const res = await fetch(`/api/reports/export?type=${kind}&format=csv`, { method: "GET" });
      if (!res.ok) throw new Error("Failed to export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}-report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      pushToast("CSV download started", "success");
    } catch (e) {
      console.error(e);
      pushToast("CSV export failed", "error");
    } finally {
      setExportingCSV(false);
    }
  }

  function exportPDF(kind: "procurement" | "suppliers") {
    setExportingPDF(true);
    (async () => {
      try {
        const res = await fetch(`/api/reports/export?type=${kind}&format=pdf`, { method: "GET" });
        if (!res.ok) throw new Error("Failed to export PDF");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${kind}-report.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        pushToast("PDF download started", "success");
      } catch (e) {
        console.error(e);
        pushToast("PDF export failed", "error");
      } finally {
        setExportingPDF(false);
      }
    })();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex gap-1">
          <button onClick={() => setTab("procurement")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "procurement" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Procurement Report</button>
          <button onClick={() => setTab("suppliers")} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === "suppliers" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Supplier Report</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadCSV(tab)} disabled={exportingCSV} className={`px-3 py-2 rounded-xl text-sm ${exportingCSV ? 'bg-slate-200 text-slate-400 cursor-wait' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            {exportingCSV ? (
              <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Exporting...</span>
            ) : ('Export CSV')}
          </button>
          <button onClick={() => exportPDF(tab)} disabled={exportingPDF} className={`px-3 py-2 rounded-xl text-sm ${exportingPDF ? 'bg-emerald-300 text-white cursor-wait' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>
            {exportingPDF ? (
              <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Exporting PDF...</span>
            ) : ('Export PDF')}
          </button>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed right-4 bottom-4 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-2 rounded shadow-md text-sm ${t.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
            {t.msg}
          </div>
        ))}
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
