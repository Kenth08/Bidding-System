"use client";
import { useState, useEffect, useMemo } from "react";
import { FileText, Loader2 } from "lucide-react";
import { bidsAPI, awardsAPI } from "@/services/api";
import EmptyState from "@/components/shared/EmptyState";
import SearchBar from "@/components/shared/SearchBar";
import StatusBadge from "@/components/shared/StatusBadge";
import AwardDocumentModal from "@/components/shared/AwardDocumentModal";
import Toast from "@/components/shared/Toast";
import { SkeletonTable } from "@/components/ui/Skeleton";

function formatPeso(v: unknown) { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(v || 0)); }
function formatDate(d: unknown) { if (!d) return "\u2014"; const v = new Date(d as string); return isNaN(v.getTime()) ? "\u2014" : v.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }); }

export default function AdminAwarding() {
  const [awards, setAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [docModal, setDocModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [docLoading, setDocLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    bidsAPI.getAll().then((r) => {
      const data = Array.isArray(r.data) ? r.data : r.data.results || [];
      setAwards(data.filter((b: any) => b.status === "won"));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return awards.filter((b) => !q || (b.supplier?.full_name || b.company_name || "").toLowerCase().includes(q) || (b.project?.title || "").toLowerCase().includes(q));
  }, [awards, search]);

  const totalAmount = awards.reduce((s, b) => s + Number(b.bid_amount || 0), 0);
  const latestDate = awards.length ? awards.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())[0]?.updated_at : null;

  async function handleGenerate(bidId: string, type: "noa" | "ntp" | "resolution") {
    setDocLoading(`${bidId}-${type}`);
    try {
      const fn = type === "noa" ? awardsAPI.generateNOA : type === "ntp" ? awardsAPI.generateNTP : awardsAPI.generateResolution;
      const res = await fn(bidId);
      setDocModal({ open: true, data: res.data });
    } catch { setToast({ message: "Failed to generate document", type: "error" }); }
    finally { setDocLoading(null); }
  }

  if (loading) return <SkeletonTable />;

  return (
    <div>
      {awards.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase text-emerald-600">Total Awards</p><p className="mt-1 text-2xl font-bold text-emerald-700">{awards.length}</p></div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-semibold uppercase text-blue-600">Total Awarded Amount</p><p className="mt-1 text-2xl font-bold text-blue-700">{formatPeso(totalAmount)}</p></div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4"><p className="text-xs font-semibold uppercase text-purple-600">Documents Available</p><p className="mt-1 text-2xl font-bold text-purple-700">{awards.length * 3}</p></div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-semibold uppercase text-amber-600">Latest Award Date</p><p className="mt-1 text-lg font-bold text-amber-700">{formatDate(latestDate)}</p></div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-50 px-6 py-3"><SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by supplier or project" /></div>
        <table className="w-full">
          <thead><tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Supplier</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Award Amount</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Award Date</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Documents</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={6}><EmptyState icon={FileText} title="No awarded bids yet" subtitle="Select a winner from bid evaluation to generate award documents." /></td></tr>
            ) : filtered.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 text-sm font-medium text-slate-800">{b.supplier?.full_name || b.company_name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{b.project?.title || "\u2014"}</td>
                <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{formatPeso(b.bid_amount)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(b.updated_at)}</td>
                <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {([["noa", "NOA"], ["ntp", "NTP"], ["resolution", "Resolution"]] as const).map(([type, label]) => (
                      <button key={type} onClick={() => handleGenerate(b.id, type)} disabled={docLoading === `${b.id}-${type}`} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                        {docLoading === `${b.id}-${type}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}{label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3"><FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><div><h3 className="text-sm font-semibold text-blue-900">About Award Documents</h3><p className="mt-1 text-sm text-blue-700">Once a winning bid is selected, three official documents are available:</p><ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-blue-700"><li><strong>NOA:</strong> Official notification to the winning supplier</li><li><strong>NTP:</strong> Authorization for the supplier to begin work</li><li><strong>Resolution:</strong> Official resolution documenting the award decision</li></ul></div></div>
      </div>

      <AwardDocumentModal isOpen={docModal.open} onClose={() => setDocModal({ open: false, data: null })} document={docModal.data} />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
