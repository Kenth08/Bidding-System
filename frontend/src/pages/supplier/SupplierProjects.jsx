import { CalendarDays, CircleAlert, Eye, Megaphone, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EmptyState from "../../components/shared/EmptyState";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";
import { bidsAPI } from "../../services/api";
import { getStatusLabel, normalizeBid } from "../../lib/procurementStatus";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function safeStr(val) {
  return (val ?? "").toString().toLowerCase();
}

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "—";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) return value;
  return dateValue.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getTiming(project, now) {
  const deadline = project?.deadline ? new Date(project.deadline) : null;
  if (!deadline || Number.isNaN(deadline.getTime())) {
    return { isOpen: false, isClosed: true, daysRemaining: null, label: "Closed", closesLabel: "Bidding closes: —" };
  }

  const diffDays = Math.ceil((deadline.getTime() - startOfToday().getTime()) / MS_PER_DAY);
  const formattedDeadline = formatDate(project.deadline);

  if (diffDays < 0) {
    return { isOpen: false, isClosed: true, daysRemaining: diffDays, label: "Closed", closesLabel: `Bidding closes: ${formattedDeadline}` };
  }

  if (diffDays === 0) {
    return { isOpen: true, isClosed: false, daysRemaining: 0, label: "Closes Today", closesLabel: `Bidding closes: ${formattedDeadline}` };
  }

  return { isOpen: true, isClosed: false, daysRemaining: diffDays, label: `${diffDays} days left`, closesLabel: `Bidding closes: ${formattedDeadline}` };
}

function ProjectStatusPill({ isOpen }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${isOpen ? "border border-emerald-100 bg-emerald-50 text-emerald-700" : "border border-red-100 bg-red-50 text-red-500"}`}>
      {isOpen ? <Megaphone className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
      {isOpen ? "Open for Bidding" : "Closed"}
    </span>
  );
}

export default function SupplierProjects({ supplierProjects = [], supplierBids = [], setSupplierBids, activeUser, setActivePage }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [now, setNow] = useState(() => new Date());
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [bidDraft, setBidDraft] = useState({ bidAmount: "", quotationFile: null, technicalProposal: null, supportingDocuments: null });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredProjects = useMemo(() => {
    return supplierProjects.filter((project) => {
      const timing = getTiming(project, now);
      const matchesSearch =
        safeStr(project.title).includes(safeStr(search)) ||
        safeStr(project.procurement_type).includes(safeStr(search));
      const matchesFilter = filter === "All" || (filter === "Deadline Soon" && timing.isOpen && timing.daysRemaining !== null && timing.daysRemaining <= 7) || (filter === "Open" && timing.isOpen);
      return matchesSearch && matchesFilter;
    });
  }, [filter, now, search, supplierProjects]);

  const hasSubmittedBid = (projectId) => supplierBids.some((bid) => String(bid.projectId || bid.project) === String(projectId));

  const canSubmitBid = (project) => {
    const timing = getTiming(project, now);
    return timing.isOpen && !hasSubmittedBid(project.id);
  };

  function openProjectDetails(project) {
    setSelectedProject(project);
    setShowProjectDetails(true);
  }

  function openBidForm(project) {
    const timing = getTiming(project, now);
    if (!timing.isOpen) {
      setToast({ message: "Bidding closed for this project.", type: "warning" });
      return;
    }
    if (hasSubmittedBid(project.id)) {
      setToast({ message: "You have already submitted a bid for this project.", type: "warning" });
      return;
    }

    setSelectedProject(project);
    setBidDraft({ bidAmount: "", quotationFile: null, technicalProposal: null, supportingDocuments: null });
    setErrors({});
    setShowProjectDetails(false);
    setShowBidModal(true);
  }

  async function submitBid() {
    if (!selectedProject) return;

    const nextErrors = {};
    if (!bidDraft.bidAmount || Number(bidDraft.bidAmount) <= 0) nextErrors.bidAmount = "Bid amount must be greater than 0.";
    if (!bidDraft.quotationFile) nextErrors.quotationFile = "Quotation file is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const timing = getTiming(selectedProject, now);
    if (!timing.isOpen) {
      setToast({ message: "Bidding is closed for this project.", type: "error" });
      return;
    }

    if (hasSubmittedBid(selectedProject.id)) {
      setToast({ message: "You have already submitted a bid for this project.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("project", selectedProject.id);
      formData.append("bid_amount", String(bidDraft.bidAmount));
      formData.append("quotation_file", bidDraft.quotationFile);
      if (bidDraft.technicalProposal) formData.append("technical_proposal", bidDraft.technicalProposal);
      if (bidDraft.supportingDocuments) formData.append("supporting_documents", bidDraft.supportingDocuments);

      const response = await bidsAPI.create(formData);
      const createdBid = normalizeBid(response.data);
      setSupplierBids?.((current) => [createdBid, ...current]);
      setShowBidModal(false);
      setBidDraft({ bidAmount: "", quotationFile: null, technicalProposal: null, supportingDocuments: null });
      setToast({ message: `Bid submitted successfully. Timestamp: ${createdBid.submittedAt || response.data.submittedAt || new Date().toISOString()}`, type: "success" });
      setActivePage?.("my-bids");
    } catch (error) {
      console.error("Failed to submit bid", error);
      const message = error.response?.data?.project?.[0] || error.response?.data?.project || error.response?.data?.error || "Failed to submit bid. Please try again.";
      setToast({ message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedTiming = selectedProject ? getTiming(selectedProject, now) : null;
  const projectMeta = selectedProject?.procurement_request_details || selectedProject || {};
  const projectStatus = selectedProject ? getStatusLabel(selectedProject.status) : "";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Available Projects</h1>
          <p className="mt-0.5 text-sm text-slate-500">Browse active opportunities and submit proposals</p>
        </div>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by project name" />
      </div>

      <div className="mb-5 flex gap-4 border-b border-slate-100">
        {["All", "Open", "Deadline Soon"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`pb-3 text-sm font-medium border-b-2 ${filter === tab ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white">
          <EmptyState title="No matching projects" subtitle="Try another filter or search term." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => {
            const timing = getTiming(project, now);
            const alreadySubmitted = hasSubmittedBid(project.id);
            const openForBidding = timing.isOpen;

            return (
              <div key={project.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{project.title}</h3>
                    <p className="mt-1 text-xs text-slate-400">{timing.closesLabel}</p>
                  </div>
                  <ProjectStatusPill isOpen={openForBidding} />
                </div>

                <p className="mt-3 text-sm text-slate-500">Budget: {formatPeso(project.budget)}</p>
                <p className="text-sm text-slate-500">Procurement Type: {project.procurement_type || "—"}</p>
                <p className="text-sm text-slate-500">Deadline: {formatDate(project.deadline)}</p>
                <p className="mt-1 text-sm text-slate-600">{timing.label}</p>
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">{project.requirements || project.technical_specifications || "No technical specifications provided."}</p>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openProjectDetails(project)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                </div>

                <div className="mt-3">
                  {alreadySubmitted ? (
                    <span className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Bid Already Submitted</span>
                  ) : openForBidding ? (
                    <button
                      onClick={() => openBidForm(project)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
                    >
                      <Upload className="h-4 w-4" />
                      Submit Bid
                    </button>
                  ) : (
                    <span className="inline-flex w-full items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">Bidding Closed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showProjectDetails}
        onClose={() => setShowProjectDetails(false)}
        title={selectedProject?.title || "Project Details"}
        subtitle="Full project details and submission status"
        size="lg"
      >
        {selectedProject ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Title</p>
                <p className="mt-1 text-sm text-slate-800">{projectMeta.project_title || projectMeta.title || selectedProject.title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</p>
                <p className="mt-1 text-sm text-slate-800">{formatPeso(projectMeta.budget || selectedProject.budget)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Type</p>
                <p className="mt-1 text-sm text-slate-800">{projectMeta.procurement_type || selectedProject.procurement_type || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deadline</p>
                <p className="mt-1 text-sm text-slate-800">{formatDate(projectMeta.deadline || selectedProject.deadline)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                <div className="mt-1">
                  <StatusBadge status={projectStatus} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bids Received</p>
                <p className="mt-1 text-sm text-slate-800">{projectMeta.bid_count ?? selectedProject.bid_count ?? 0}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Specifications</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{projectMeta.technical_specifications || selectedProject.technical_specifications || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Period</p>
              <p className="mt-1 text-sm text-slate-700">{projectMeta.delivery_period || selectedProject.delivery_period || "—"}</p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{selectedTiming?.closesLabel}</p>
                  <p className="mt-1 text-sm text-slate-600">{selectedTiming?.label}</p>
                </div>
              </div>
            </div>

            {hasSubmittedBid(selectedProject.id) ? (
              <span className="inline-flex rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">Bid Already Submitted</span>
            ) : selectedTiming?.isOpen ? (
              <button
                onClick={() => openBidForm(selectedProject)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
              >
                <Upload className="h-4 w-4" />
                Submit Bid
              </button>
            ) : (
              <span className="inline-flex rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">Bidding Closed</span>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        title="Submit Bid"
        subtitle={selectedProject?.title || "Project bidding"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Bid Amount P <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={bidDraft.bidAmount}
                onChange={(event) => setBidDraft((prev) => ({ ...prev, bidAmount: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
              />
              {errors.bidAmount ? <p className="mt-1 text-xs text-red-500">{errors.bidAmount}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Quotation File <span className="text-red-400">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(event) => setBidDraft((prev) => ({ ...prev, quotationFile: event.target.files?.[0] || null }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
              />
              {errors.quotationFile ? <p className="mt-1 text-xs text-red-500">{errors.quotationFile}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Proposal</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(event) => setBidDraft((prev) => ({ ...prev, technicalProposal: event.target.files?.[0] || null }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Supporting Documents</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(event) => setBidDraft((prev) => ({ ...prev, supportingDocuments: event.target.files?.[0] || null }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-700">
              <p>Project Title: {selectedProject?.title || "—"}</p>
              <p>Your Bid Amount: {formatPeso(bidDraft.bidAmount || 0)}</p>
              <p>Submission Timestamp: {new Date().toLocaleString()}</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Once submitted, your bid cannot be edited or withdrawn.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowBidModal(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Bid"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={submitBid}
        title="Submit this bid?"
        message="Are you sure you want to submit this bid? This action cannot be undone."
        confirmLabel="Submit Bid"
        confirmVariant="primary"
      />

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
