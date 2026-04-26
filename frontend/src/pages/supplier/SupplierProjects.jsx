// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\supplier\SupplierProjects.jsx
import { useMemo, useState } from "react";
import { bidsAPI } from "../../services/api";
import EmptyState from "../../components/shared/EmptyState";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

function isDeadlineSoon(deadline) {
  const diff = new Date(deadline).getTime() - new Date().getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
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
  activeUser,
}) {
  const [search, setSearch] = useState("");
  const [submittedProjectIds, setSubmittedProjectIds] = useState([]);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return supplierProjects.filter((project) => {
      const filterMatch =
        supplierProjectFilter === "All" ||
        (supplierProjectFilter === "Active" && project.status === "Active") ||
        (supplierProjectFilter === "Deadline Soon" && isDeadlineSoon(project.deadline));
      const searchMatch = !query || project.title.toLowerCase().includes(query);
      return filterMatch && searchMatch;
    });
  }, [search, supplierProjectFilter, supplierProjects]);

  function openBid(project) {
    setSelectedProject(project);
    setBidDraft({ bidAmount: "", proposal: "" });
    setErrors({});
    setShowBidModal(true);
  }

  async function submitBid() {
    const next = {};
    if (!bidDraft.bidAmount || Number(bidDraft.bidAmount) <= 0) next.bidAmount = "Enter a valid amount.";
    if (!bidDraft.proposal || bidDraft.proposal.trim().length < 20) next.proposal = "Proposal must be at least 20 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setIsSubmitting(true);
    try {
      const payload = {
        project: selectedProject.id,
        bid_amount: Number(bidDraft.bidAmount),
        proposal: bidDraft.proposal.trim(),
      };
      const res = await bidsAPI.create(payload);
      setSupplierBids((prev) => [res.data, ...prev]);
      setSubmittedProjectIds((prev) => [...prev, selectedProject.id]);
      setShowBidModal(false);
      setToast({ message: "Bid submitted successfully!", type: "success" });
    } catch (error) {
      console.error("Failed to submit bid", error);
      setToast({ message: "Failed to submit bid. Please try again.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Available Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">Browse and submit competitive bids</p>
        </div>
      </div>
      <div className="mb-4">
        <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by project name" />
      </div>
      <div className="mb-5 flex gap-4 border-b border-slate-100">
        {["All", "Active", "Deadline Soon"].map((tab) => (
          <button key={tab} onClick={() => setSupplierProjectFilter(tab)} className={`pb-3 text-sm font-medium border-b-2 ${supplierProjectFilter === tab ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"}`}>{tab}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100"><EmptyState title="No matching projects" subtitle="Try another filter or search term." /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const alreadySubmitted = submittedProjectIds.includes(project.id);
            return (
              <div key={project.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-slate-800">{project.title}</h3><StatusBadge status={project.status} /></div>
                <p className="text-sm text-slate-500 mt-3">Budget: {formatPeso(project.budget)}</p>
                <p className="text-sm text-slate-500">Deadline: {project.deadline}</p>
                <p className="mt-3 text-sm text-slate-600 line-clamp-2">{project.requirements}</p>
                <button disabled={alreadySubmitted} onClick={() => openBid(project)} className={`mt-4 w-full rounded-xl px-3 py-2 text-sm font-semibold ${alreadySubmitted ? "bg-slate-100 text-slate-400" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>{alreadySubmitted ? "Bid Submitted" : "Submit Bid ->"}</button>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showBidModal} onClose={() => setShowBidModal(false)} title="Submit Bid" subtitle={selectedProject?.title} size="lg">
        <div className="grid gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Bid Amount P <span className="text-red-400">*</span></label>
            <input type="number" value={bidDraft.bidAmount || ""} onChange={(event) => setBidDraft((prev) => ({ ...prev, bidAmount: event.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
            {errors.bidAmount && <p className="text-xs text-red-500 mt-1">{errors.bidAmount}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Proposal Summary <span className="text-red-400">*</span></label>
            <textarea rows={4} value={bidDraft.proposal || ""} onChange={(event) => setBidDraft((prev) => ({ ...prev, proposal: event.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
            {errors.proposal && <p className="text-xs text-red-500 mt-1">{errors.proposal}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Company Name</label>
            <input readOnly value={activeUser?.company_name || "Blue Grid Works"} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500" />
          </div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowBidModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600">Cancel</button><button onClick={submitBid} disabled={isSubmitting} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">{isSubmitting ? "Submitting..." : "Submit Bid"}</button></div>
        </div>
      </Modal>

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
