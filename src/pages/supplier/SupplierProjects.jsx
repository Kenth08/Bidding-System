// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\supplier\SupplierProjects.jsx
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import Modal from "../../components/shared/Modal";
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

export default function SupplierProjects({
  supplierProjects,
  supplierProjectFilter,
  setSupplierProjectFilter,
  showBidModal,
  setShowBidModal,
  selectedProject,
  setSelectedProject,
  bidDraft,
  setBidDraft,
  setSupplierBids,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const filteredProjects =
    supplierProjectFilter === "All"
      ? supplierProjects
      : supplierProjects.filter((project) => project.status === supplierProjectFilter);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  function openBidModal(project) {
    const today = new Date().toISOString().slice(0, 10);
    if (project.deadline < today) {
      setToastMessage("Submission closed: project deadline has passed.");
      setTimeout(() => setToastMessage(""), 1800);
      return;
    }

    setSelectedProject(project);
    setBidDraft({ bidAmount: "", proposal: "", proposalFile: "" });
    setShowBidModal(true);
  }

  function submitBid() {
    if (!selectedProject || !bidDraft.bidAmount || !bidDraft.proposal.trim()) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    if (selectedProject.deadline < today) {
      setToastMessage("Cannot submit bid after deadline.");
      setTimeout(() => setToastMessage(""), 1800);
      return;
    }

    const bid = {
      id: `SBID-${2000 + Date.now().toString().slice(-3)}`,
      projectName: selectedProject.name,
      bidAmount: Number(bidDraft.bidAmount),
      proposal: bidDraft.proposal.trim(),
      proposalFile: bidDraft.proposalFile || "",
      submittedAt: new Date().toISOString().slice(0, 10),
      status: "Pending",
    };

    setSupplierBids((prev) => [bid, ...prev]);
    setShowBidModal(false);
    setSelectedProject(null);
    setBidDraft({ bidAmount: "", proposal: "", proposalFile: "" });
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Available Projects" subtitle="Browse active opportunities and submit your bids" />

      <div className="mb-5 flex gap-1 border-b border-slate-100">
        {["All", "Active", "Closing Soon", "Awarded"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSupplierProjectFilter(tab)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
              supplierProjectFilter === tab
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <TableWrapper>
        {isLoading ? (
          <LoadingSkeleton rows={5} cols={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
              {filteredProjects.length ? (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="transition-colors duration-100 hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{project.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatCurrency(project.budget)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{project.deadline}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-6 py-4">
                      {project.deadline < new Date().toISOString().slice(0, 10) ? (
                        <span className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-400">Closed</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openBidModal(project)}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-emerald-600"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Submit Bid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
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
        isOpen={showBidModal}
        onClose={() => {
          setShowBidModal(false);
          setSelectedProject(null);
        }}
        title={`Submit Bid${selectedProject ? ` - ${selectedProject.name}` : ""}`}
        subtitle="Provide bid amount, proposal details, and supporting file"
      >
        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Bid Amount</span>
            <input
              type="number"
              value={bidDraft.bidAmount}
              onChange={(event) => setBidDraft((prev) => ({ ...prev, bidAmount: event.target.value }))}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              placeholder="Enter your bid amount"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Proposal</span>
            <textarea
              rows={4}
              value={bidDraft.proposal}
              onChange={(event) => setBidDraft((prev) => ({ ...prev, proposal: event.target.value }))}
              className="resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              placeholder="Describe your approach, timeline, and terms"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Upload Proposal</span>
            <input
              type="file"
              onChange={(event) =>
                setBidDraft((prev) => ({
                  ...prev,
                  proposalFile: event.target.files?.[0]?.name || "",
                }))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
            />
            {bidDraft.proposalFile ? <p className="text-xs text-slate-400">Selected file: {bidDraft.proposalFile}</p> : null}
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-0 pt-4">
          <button
            type="button"
            onClick={() => {
              setShowBidModal(false);
              setSelectedProject(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submitBid}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-emerald-600"
          >
            Submit
          </button>
        </div>
      </Modal>

      <Toast message={toastMessage} isVisible={Boolean(toastMessage)} />
    </div>
  );
}
