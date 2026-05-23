"use client";
import { useState, useEffect } from "react";
import { Check, Copy, Shield } from "lucide-react";
import { blockchainAPI } from "@/services/api";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import SearchBar from "@/components/shared/SearchBar";
import Toast from "@/components/shared/Toast";
import { SkeletonTable } from "@/components/ui/Skeleton";

function formatPeso(v: unknown) { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(v || 0)); }

export default function AdminBlockchain() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    blockchainAPI.getAll().then((r) => { setRecords(Array.isArray(r.data) ? r.data : r.data.results || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return !q || (r.project?.title || "").toLowerCase().includes(q) || (r.winner?.full_name || "").toLowerCase().includes(q) || (r.hash || "").toLowerCase().includes(q);
  });

  async function copyHash(hash: string, id: string) {
    await navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setToast({ message: "Hash copied!", type: "success" });
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) return <div className="p-6"><SkeletonTable /></div>;

  return (
    <div>
      <div className="mb-5 rounded-2xl bg-slate-900 text-white p-4 flex items-center gap-3">
        <Shield className="h-5 w-5 text-emerald-400" />
        <p className="text-sm flex-1">All entries are immutable and blockchain-verified</p>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-300">Live</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="px-6 py-3 border-b border-slate-50">
          <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by project or winner" />
        </div>
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">#</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Winner</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Recorded At</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Hash</th>
            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={7}><EmptyState title="No records found" subtitle="No blockchain entries match your search." /></td></tr>
            ) : filtered.map((r, i) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 text-sm text-slate-600">{i + 1}</td>
                <td className="px-6 py-4 text-sm font-medium text-slate-800">{r.project?.title || r.project_title || "\u2014"}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{r.winner?.full_name || r.winner_name || "\u2014"}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatPeso(r.bid_amount)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{r.recorded_at ? new Date(r.recorded_at).toLocaleDateString() : "\u2014"}</td>
                <td className="px-6 py-4"><code className="text-xs font-mono text-slate-500">{r.hash?.slice(0, 18)}...</code></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => setViewing(r)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">View</button>
                    <button onClick={() => copyHash(r.hash, r.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                      {copiedId === r.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={Boolean(viewing)} onClose={() => setViewing(null)} title="Blockchain Record Details" size="lg">
        {viewing && (
          <div className="space-y-3 text-sm text-slate-700">
            <p><span className="font-semibold">Project:</span> {viewing.project?.title || viewing.project_title}</p>
            <p><span className="font-semibold">Winner:</span> {viewing.winner?.full_name || viewing.winner_name}</p>
            <p><span className="font-semibold">Company:</span> {viewing.winner?.company_name || "\u2014"}</p>
            <p><span className="font-semibold">Bid Amount:</span> {formatPeso(viewing.bid_amount)}</p>
            <p><span className="font-semibold">Recorded At:</span> {viewing.recorded_at ? new Date(viewing.recorded_at).toLocaleString() : "\u2014"}</p>
            <p><span className="font-semibold">Reference:</span> {viewing.project_ref_id || "\u2014"}</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">Full Hash</p>
              <code className="text-xs font-mono break-all text-slate-600">{viewing.hash}</code>
            </div>
            <button onClick={() => copyHash(viewing.hash, viewing.id)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">Copy Full Hash</button>
          </div>
        )}
      </Modal>

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
