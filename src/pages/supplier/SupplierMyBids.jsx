// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\supplier\SupplierMyBids.jsx
import { FileText } from "lucide-react";
import { useMemo, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import StatusBadge from "../../components/shared/StatusBadge";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

export default function SupplierMyBids({ supplierBids }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("All");
  const filtered = useMemo(() => supplierBids.filter((bid) => filter === "All" || bid.status === filter), [filter, supplierBids]);

  const summary = {
    total: supplierBids.length,
    underReview: supplierBids.filter((bid) => bid.status === "Under Review").length,
    selected: supplierBids.filter((bid) => bid.status === "Selected").length,
    rejected: supplierBids.filter((bid) => bid.status === "Rejected").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">My Bids</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track your submitted bids and outcomes</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <span className="bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg">Total: {summary.total}</span>
        <span className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-100">Under Review: {summary.underReview}</span>
        <span className="bg-emerald-50 text-emerald-600 text-xs font-medium px-3 py-1.5 rounded-lg border border-emerald-100">Selected: {summary.selected}</span>
        <span className="bg-red-50 text-red-500 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-100">Rejected: {summary.rejected}</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 pt-4 flex gap-4 border-b border-slate-50">
          {["All", "Submitted", "Under Review", "Selected", "Rejected"].map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)} className={`pb-3 text-sm font-medium border-b-2 ${filter === tab ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"}`}>{tab}</button>
          ))}
        </div>
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project Name</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Bid Amount</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Company</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Submitted</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th></tr></thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon={FileText} title="No bids yet" subtitle="Browse active projects and submit your first bid." actionLabel="Browse Projects" /></td></tr>
            ) : filtered.map((bid) => (
              <>
                <tr key={bid.id} onClick={() => setExpandedId((prev) => (prev === bid.id ? null : bid.id))} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{bid.projectTitle || bid.projectName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatPeso(bid.bidAmount)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{bid.company}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{bid.submittedAt}</td>
                  <td className="px-6 py-4"><StatusBadge status={bid.status} /></td>
                </tr>
                {expandedId === bid.id && (
                  <tr><td colSpan={5} className="px-6 py-3 bg-slate-50/70 text-sm text-slate-600">{bid.proposal}</td></tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
