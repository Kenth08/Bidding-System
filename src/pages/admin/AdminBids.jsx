// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\admin\AdminBids.jsx
import { Fragment, useEffect, useState } from "react";
import { Shield } from "lucide-react";
import EmptyState from "../../components/shared/EmptyState";
import Modal from "../../components/shared/Modal";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import SectionHeader from "../../components/shared/SectionHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import TableWrapper from "../../components/shared/TableWrapper";
import Toast from "../../components/shared/Toast";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function truncate(text, max = 65) {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}...`;
}

export default function AdminBids({
  bids,
  setBids,
  projects,
  setProjects,
  onRecordToBlockchain,
  expandedBidId,
  setExpandedBidId,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [recordModalBid, setRecordModalBid] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  function selectWinner(bidId, projectName) {
    setBids((prev) =>
      prev.map((bid) => {
        if (bid.projectName !== projectName) {
          return bid;
        }
        if (bid.id === bidId) {
          return { ...bid, status: "Selected" };
        }
        return { ...bid, status: "Rejected" };
      })
    );
  }

  function confirmRecordToBlockchain() {
    if (!recordModalBid) {
      return;
    }

    const project = projects.find((item) => item.name === recordModalBid.projectName);
    const record = {
      id: `REC-${Date.now()}`,
      projectId: project?.id || "PRJ-UNKNOWN",
      projectName: recordModalBid.projectName,
      winner: recordModalBid.supplierName,
      bidAmount: formatCurrency(recordModalBid.bidAmount),
      timestamp: `${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })} UTC`,
      hash: `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`.slice(0, 66),
    };

    onRecordToBlockchain((prev) => [record, ...prev]);
    setProjects((prev) =>
      prev.map((item) =>
        item.name === recordModalBid.projectName ? { ...item, status: "Awarded" } : item
      )
    );
    setBids((prev) => prev.map((bid) => (bid.id === recordModalBid.id ? { ...bid, status: "Recorded ✓" } : bid)));
    setRecordModalBid(null);
    setToastMessage("Successfully recorded to blockchain!");
    setTimeout(() => setToastMessage(""), 1800);
  }

  function getProjectRank(currentBid) {
    const ranked = bids
      .filter((item) => item.projectName === currentBid.projectName)
      .sort((a, b) => a.bidAmount - b.bidAmount);
    return ranked.findIndex((item) => item.id === currentBid.id) + 1;
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Bids" subtitle="Review submitted offers and select winners" />

      <TableWrapper>
        {isLoading ? (
          <LoadingSkeleton rows={6} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Supplier Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Bid Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Proposal</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Submitted At</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bids.length ? (
                  bids.map((bid) => {
                    const isExpanded = expandedBidId === bid.id;
                    return (
                      <Fragment key={bid.id}>
                        <tr
                          className="cursor-pointer transition-colors duration-100 hover:bg-slate-50/50"
                          onClick={() => setExpandedBidId(isExpanded ? null : bid.id)}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{bid.supplierName}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{bid.projectName}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{formatCurrency(bid.bidAmount)}</td>
                          <td className="px-6 py-4 text-sm text-slate-500" title={bid.proposal}>
                            {truncate(bid.proposal, 46)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">{bid.submittedAt}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={bid.status} />
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr>
                            <td className="px-6 pb-4" colSpan={6}>
                              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Full Proposal</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{bid.proposal}</p>
                                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                  Rank for this project: <span className="font-semibold text-slate-800">#{getProjectRank(bid)}</span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {bid.status === "Selected" || bid.status === "Recorded ✓" ? null : (
                                    <button
                                      type="button"
                                      onClick={() => selectWinner(bid.id, bid.projectName)}
                                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-emerald-600"
                                    >
                                      Select as Winner
                                    </button>
                                  )}

                                  {bid.status === "Selected" ? (
                                    <button
                                      type="button"
                                      onClick={() => setRecordModalBid(bid)}
                                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-emerald-600"
                                    >
                                      Record to Blockchain
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableWrapper>

      <Modal
        isOpen={Boolean(recordModalBid)}
        onClose={() => setRecordModalBid(null)}
        title="Confirm Blockchain Recording"
        subtitle="This action writes immutable data to the ledger"
      >
        {recordModalBid ? (
          <div className="space-y-4">
            <div className="mx-auto w-fit rounded-xl border border-emerald-100 bg-emerald-50 p-2 text-emerald-700">
              <Shield className="h-5 w-5" />
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-700">Project Name:</span> {recordModalBid.projectName}</p>
              <p className="mt-1"><span className="font-semibold text-slate-700">Winner:</span> {recordModalBid.supplierName}</p>
              <p className="mt-1"><span className="font-semibold text-slate-700">Bid Amount:</span> {formatCurrency(recordModalBid.bidAmount)}</p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              ⚠️ This action is permanent and cannot be undone. The result will be stored on the blockchain ledger.
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRecordModalBid(null)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRecordToBlockchain}
                className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-emerald-600"
              >
                Confirm &amp; Record
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Toast message={toastMessage} isVisible={Boolean(toastMessage)} />
    </div>
  );
}
