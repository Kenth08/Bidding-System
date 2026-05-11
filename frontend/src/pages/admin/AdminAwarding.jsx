import { FileText, Loader2 } from "lucide-react";
import { useContext, useMemo, useState } from "react";
import AwardDocumentModal from "../../components/shared/AwardDocumentModal";
import EmptyState from "../../components/shared/EmptyState";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";
import { ProcurementContext } from "../../lib/ProcurementContext";
import { normalizeBid } from "../../lib/procurementStatus";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

export default function AdminAwarding({ bids = [], projects = [] }) {
  const procurement = useContext(ProcurementContext);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [docModal, setDocModal] = useState({ open: false, data: null });
  const [docLoading, setDocLoading] = useState(null);

  const awardedBids = useMemo(() => {
    return bids
      .filter((bid) => bid.status === "Selected")
      .filter((bid) => {
        const query = search.toLowerCase();
        return (
          (bid.supplierName || "").toLowerCase().includes(query) ||
          (bid.projectTitle || bid.projectName || "").toLowerCase().includes(query)
        );
      })
      .map((bid) => {
        const normalizedBid = normalizeBid(bid);
        const project = projects.find((projectItem) => projectItem.id === normalizedBid.projectId || projectItem.title === normalizedBid.projectTitle || projectItem.title === normalizedBid.projectName);
        return {
          ...normalizedBid,
          projectDetails: project || {},
        };
      });
  }, [bids, projects, search]);

  async function handleGenerateDocument(bidId, type) {
    setDocLoading(`${bidId}-${type}`);
    try {
      const bid = procurement?.bids?.find((item) => item.id === bidId);
      if (!bid) throw new Error("Bid not found");
      const project = procurement?.projects?.find((item) => item.id === bid.projectId);
      const document = {
        type,
        projectId: bid.projectId,
        projectTitle: project?.project_title || bid.projectTitle,
        winner: bid.supplierName,
        company: bid.supplierCompany,
        amount: bid.amount,
        generatedAt: new Date().toISOString(),
        title:
          type === "noa" ? "Notice of Award"
          : type === "ntp" ? "Notice to Proceed"
          : "Resolution to Award",
      };
      setDocModal({ open: true, data: document });
      procurement?.pushAudit?.("Admin", `Generated ${document.title} for ${bid.projectId}`);
    } catch (error) {
      console.error('Failed to generate award document', error);
      setToast({ message: 'Failed to generate document', type: 'error' });
    } finally {
      setDocLoading(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Awarding</h1>
          <p className="mt-0.5 text-sm text-slate-500">Generate and manage award documents for winning bids</p>
        </div>
      </div>

      {awardedBids.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase text-emerald-600">Total Awards</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{awardedBids.length}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase text-blue-600">Total Awarded Amount</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{formatPeso(awardedBids.reduce((sum, bid) => sum + (bid.bidAmount || 0), 0))}</p>
          </div>
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-xs font-semibold uppercase text-purple-600">Documents Generated</p>
            <p className="mt-1 text-2xl font-bold text-purple-700">{awardedBids.length * 3}</p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-50 px-6 py-3">
          <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by supplier or project" />
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Award Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Documents</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {awardedBids.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={FileText}
                    title="No awarded bids yet"
                    subtitle="Select a winner from bid evaluation to generate award documents."
                  />
                </td>
              </tr>
            ) : (
              awardedBids.map((bid) => (
                <tr key={bid.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{bid.supplierName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{bid.projectTitle || bid.projectName}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{formatPeso(bid.bidAmount)}</td>
                  <td className="px-6 py-4 text-sm"><StatusBadge status={bid.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { type: 'noa', label: 'Notice of Award' },
                        { type: 'ntp', label: 'Notice to Proceed' },
                        { type: 'resolution', label: 'Resolution to Award' },
                      ].map(({ type, label }) => (
                        <button
                          key={type}
                          onClick={() => handleGenerateDocument(bid.id, type)}
                          disabled={docLoading === `${bid.id}-${type}`}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                        >
                          {docLoading === `${bid.id}-${type}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                          {label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">About Award Documents</h3>
            <p className="mt-1 text-sm text-blue-700">
              Once a winning bid is selected, three official documents are available for generation:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-sm text-blue-700">
              <li><strong>Notice of Award:</strong> Official notification to the winning supplier</li>
              <li><strong>Notice to Proceed:</strong> Authorization for the supplier to begin work</li>
              <li><strong>Resolution to Award:</strong> Official resolution documenting the award decision</li>
            </ul>
          </div>
        </div>
      </div>

      <AwardDocumentModal
        isOpen={docModal.open}
        onClose={() => setDocModal({ open: false, data: null })}
        document={docModal.data}
      />

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
