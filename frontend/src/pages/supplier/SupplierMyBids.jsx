import { FileText, Link2 } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import Modal from "../../components/shared/Modal";
import StatusBadge from "../../components/shared/StatusBadge";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

function formatDateTime(value) {
  if (!value) return "—";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) return value;
  return dateValue.toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function FileLink({ label, url }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
      <Link2 className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}

function safeStr(val) {
  return (val ?? "").toString().toLowerCase();
}

export default function SupplierMyBids({ supplierBids = [], onNavigate }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => supplierBids.filter((bid) => filter === "All" || safeStr(bid.status) === safeStr(filter).replace(/\s+/g, "_")), [filter, supplierBids]);
  const selectedBid = filtered.find((bid) => bid.id === expandedId) || supplierBids.find((bid) => bid.id === expandedId) || null;

  const summary = {
    total: supplierBids.length,
    submitted: supplierBids.filter((bid) => safeStr(bid.status) === "submitted").length,
    evaluation: supplierBids.filter((bid) => safeStr(bid.status) === "under_evaluation").length,
    won: supplierBids.filter((bid) => safeStr(bid.status) === "won").length,
    lost: supplierBids.filter((bid) => safeStr(bid.status) === "lost").length,
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">My Bids</h1>
          <p className="mt-0.5 text-sm text-slate-500">Track your submitted bids and outcomes</p>
        </div>
      </div>

      <div className="mb-4 flex gap-3">
        <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">Total: {summary.total}</span>
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">Submitted: {summary.submitted}</span>
        <span className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">Under Evaluation: {summary.evaluation}</span>
        <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600">Won: {summary.won}</span>
        <span className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-500">Lost: {summary.lost}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="flex gap-4 border-b border-slate-50 px-6 pt-4">
          {["All", "Submitted", "Under Evaluation", "Won", "Lost"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`border-b-2 pb-3 text-sm font-medium ${filter === tab ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Bid Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Submitted At</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={FileText}
                    title="No bids yet"
                    subtitle="Browse active projects and submit your first bid."
                    actionLabel="Browse Projects"
                    onAction={() => onNavigate?.("available-projects")}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((bid) => (
                <Fragment key={bid.id}>
                  <tr className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{bid.projectTitle || bid.projectName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatPeso(bid.bidAmount)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDateTime(bid.submittedAt)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={bid.status} />
                      {safeStr(bid.status) === "won" ? (
                        <p className="mt-1 text-xs text-emerald-600">Congratulations! Your bid was selected as the winning bid.</p>
                      ) : safeStr(bid.status) === "lost" ? (
                        <p className="mt-1 text-xs text-red-500">Thank you for participating. Another supplier was selected for this project.</p>
                      ) : null}
                      {bid.awardedWinnerName ? (
                        <p className="mt-1 text-xs text-slate-500">Winner: {bid.awardedWinnerName}</p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setExpandedId((prev) => (prev === bid.id ? null : bid.id))}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={Boolean(selectedBid)}
        onClose={() => setExpandedId(null)}
        title={selectedBid?.projectTitle || selectedBid?.projectName || "Bid Details"}
        subtitle="Full bid details and project information"
        size="lg"
      >
        {selectedBid ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Title</p>
                <p className="mt-1 text-sm text-slate-800">{selectedBid.projectTitle || selectedBid.projectName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bid Amount</p>
                <p className="mt-1 text-sm text-slate-800">{formatPeso(selectedBid.bidAmount)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted At</p>
                <p className="mt-1 text-sm text-slate-800">{formatDateTime(selectedBid.submittedAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                <div className="mt-1"><StatusBadge status={selectedBid.status} /></div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Winning Supplier</p>
                <p className="mt-1 text-sm text-slate-800">{selectedBid.awardedWinnerName || "Not selected yet"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Winning Company</p>
                <p className="mt-1 text-sm text-slate-800">{selectedBid.awardedWinnerCompany || "Not selected yet"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Budget</p>
                <p className="mt-1 text-sm text-slate-800">{formatPeso(selectedBid.projectBudget)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Type</p>
                <p className="mt-1 text-sm text-slate-800">{selectedBid.projectProcurementType || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deadline</p>
                <p className="mt-1 text-sm text-slate-800">{formatDateTime(selectedBid.projectDeadline)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Status</p>
                <p className="mt-1 text-sm text-slate-800">{selectedBid.projectStatus || "—"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Specifications</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{selectedBid.projectTechnicalSpecifications || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Period</p>
              <p className="mt-1 text-sm text-slate-700">{selectedBid.projectDeliveryPeriod || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proposal</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{selectedBid.proposal || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documents</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <FileLink label="Quotation File" url={selectedBid.quotationFile || selectedBid.quotation_document} />
                <FileLink label="Technical Proposal" url={selectedBid.technicalProposal || selectedBid.technical_document} />
                <FileLink label="Supporting Documents" url={selectedBid.supportingDocuments} />
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
