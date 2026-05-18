import { Fragment, useMemo, useState } from "react";
import { ArrowLeft, FileText, Trophy } from "lucide-react";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import LoadingButton from "../../components/ui/LoadingButton";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/shared/EmptyState";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";
import { bidsAPI } from "../../services/api";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

function formatDateTime(value) {
  if (!value) return "—";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) return value;
  return dateValue.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getProjectKey(project) {
  return project?.id || project?.project_id || project?._id || "";
}

function getBidProjectKey(bid) {
  return bid.projectId || bid.project || bid.project_id || "";
}

function ProjectStatusPill({ status }) {
  const key = String(status || "").toLowerCase();
  const isAwarded = key === "awarded";
  const isOpen = key === "open" || key === "active" || key === "open for bidding";
  const isClosed = key === "closed";
  const label = isAwarded ? "Awarded" : isOpen ? "Open for Bidding" : isClosed ? "Closed" : status || "Draft";
  const className = isAwarded
    ? "border-blue-100 bg-blue-50 text-blue-600"
    : isOpen
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-100 text-slate-600";

  return <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${className}`}>{label}</span>;
}

function FileLinks({ bid }) {
  const links = [
    { label: "Quotation", url: bid.quotationFile || bid.quotation_document },
    { label: "Technical Proposal", url: bid.technicalProposal || bid.technical_document },
    { label: "Supporting Documents", url: bid.supportingDocuments },
  ].filter((item) => item.url);

  if (links.length === 0) {
    return <span className="text-xs text-slate-400">No documents</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((item) => (
        <a
          key={item.label}
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

function safeStr(val) {
  return (val ?? "").toString().toLowerCase();
}

export default function AdminBidEvaluation({
  bids = [],
  setBids,
  projects = [],
  selectedProjectId = null,
  onBackToProjects,
  onClearSelection,
  onOpenProject,
  onOpenAwarding,
  onAwardProject,
  setProjects,
  isLoading,
}) {
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [showWinnerConfirm, setShowWinnerConfirm] = useState(false);
  const [selectingBid, setSelectingBid] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(selectedProjectId)),
    [projects, selectedProjectId]
  );

  const projectList = useMemo(() => {
    const query = safeStr(search);
    return projects
      .filter((project) => Number(project.bid_count || 0) > 0)
      .filter((project) => {
        if (!query) return true;
        return [project.title, project.procurement_type, project.status]
          .filter(Boolean)
          .some((value) => safeStr(value).includes(query));
      })
      .slice()
      .sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
  }, [projects, search]);

  const selectedProjectBids = useMemo(() => {
    if (!selectedProjectId) return [];
    const query = safeStr(search);
    return bids
      .filter((bid) => String(getBidProjectKey(bid)) === String(selectedProjectId))
      .filter((bid) => {
        if (!query) return true;
        return [bid.supplierName, bid.supplier_name, bid.projectTitle, bid.projectName]
          .filter(Boolean)
          .some((value) => safeStr(value).includes(query));
      })
      .slice()
      .sort((a, b) => Number(a.bidAmount || a.bid_amount || 0) - Number(b.bidAmount || b.bid_amount || 0));
  }, [bids, search, selectedProjectId]);

  const selectedProjectWinner = useMemo(
    () => selectedProjectBids.find((bid) => safeStr(bid.status) === "won") || null,
    [selectedProjectBids]
  );

  function updateReviewDraft(id, patch) {
    setReviewDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        ...patch,
      },
    }));
  }

  function isLowestCompliantBid(bid) {
    const compliant = selectedProjectBids.filter((item) => item.technical_compliance === true);
    if (compliant.length === 0) return false;
    return compliant[0].id === bid.id;
  }

  function lockProjectAsAwarded(winningBid) {
    const now = new Date().toISOString();
    setProjects?.((current) =>
      current.map((project) =>
        String(getProjectKey(project)) === String(selectedProjectId)
          ? { ...project, status: "Awarded", awarded_at: now }
          : project
      )
    );

    setBids?.((current) =>
      current.map((bid) => {
        if (String(getBidProjectKey(bid)) !== String(selectedProjectId)) return bid;
        if (bid.id === winningBid.id) return { ...bid, status: "won" };
        return { ...bid, status: "lost" };
      })
    );
  }

  async function saveEvaluation(bid) {
    const draft = reviewDrafts[bid.id] || {};
    setActionLoading(true);
    try {
      const response = await bidsAPI.update(bid.id, {
        status: "under_evaluation",
        technical_compliance:
          typeof draft.technical_compliance === "boolean" ? draft.technical_compliance : bid.technical_compliance,
        evaluation_remarks: draft.evaluation_remarks ?? bid.evaluation_remarks ?? "",
      });
      setBids((prev) => prev.map((item) => (item.id === bid.id ? response.data : item)));
      setToast({ message: "Evaluation saved successfully.", type: "success" });
    } catch (error) {
      console.error("Failed to save evaluation", error);
      setToast({ message: error.response?.data?.detail || "Could not save evaluation.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmWinnerSelection() {
    if (!selectingBid) return;
    setActionLoading(true);
    try {
      const response = await bidsAPI.selectWinner(selectingBid.id);
      const winner = response.data;
      lockProjectAsAwarded(winner);
      setToast({ message: "Winner selected. Project is now awarded and bidding is closed.", type: "success" });
      onAwardProject?.(String(selectedProjectId));
    } catch (error) {
      console.error("Failed to select winner", error);
      setToast({ message: error.response?.data?.error || "Could not select winner.", type: "error" });
    } finally {
      setSelectingBid(null);
      setShowWinnerConfirm(false);
      setActionLoading(false);
    }
  }

  if (!selectedProjectId) {
    if (isLoading) {
      return (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Bid Evaluation</h1>
              <p className="mt-0.5 text-sm text-slate-500">Review projects that have received bids</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-6">
            <SkeletonTable rows={5} cols={4} />
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Bid Evaluation</h1>
            <p className="mt-0.5 text-sm text-slate-500">Review projects that have received bids</p>
          </div>
        </div>

        <div className="mb-4">
          <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by project title, type, or status" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Procurement Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Number of Bids</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projectList.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState title="No projects with bids yet" subtitle="Projects will appear here once suppliers submit bids." />
                  </td>
                </tr>
              ) : (
                projectList.map((project) => {
                  const statusKey = String(project.status || "").toLowerCase();
                  const awarded = statusKey === "awarded";
                  return (
                    <tr key={project.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{project.title}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{project.procurement_type || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatPeso(project.budget)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{project.deadline ? formatDateTime(project.deadline) : "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{project.bid_count || 0}</td>
                      <td className="px-6 py-4"><ProjectStatusPill status={project.status} /></td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (awarded) {
                              onOpenAwarding?.(String(project.id));
                            } else {
                              onOpenProject?.(String(project.id));
                            }
                          }}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${awarded ? "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                        >
                          {awarded ? "View Results" : "Evaluate Bids"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const projectWinnerName = selectedProjectWinner?.supplierName || selectedProjectWinner?.supplier_name || "No winner yet";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Bid Evaluation</h1>
          <p className="mt-0.5 text-sm text-slate-500">Review bids for {selectedProject?.title || "Selected Project"}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onClearSelection?.();
            onBackToProjects?.();
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </button>
      </div>

      {selectedProject ? (
        <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Title</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{selectedProject.title}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Type</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{selectedProject.procurement_type || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{formatPeso(selectedProject.budget)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deadline</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{selectedProject.deadline ? formatDateTime(selectedProject.deadline) : "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Number of Bids</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{selectedProject.bid_count || 0}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <div className="mt-1"><ProjectStatusPill status={selectedProject.status} /></div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Winner</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{projectWinnerName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awarded At</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{selectedProject.awarded_at ? formatDateTime(selectedProject.awarded_at) : "—"}</p>
            </div>
          </div>
        </div>
      ) : null}

      {selectedProjectWinner ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <p className="font-semibold">Winner has been selected. This project is now closed and locked.</p>
          <p className="mt-0.5">Winner: {projectWinnerName}</p>
        </div>
      ) : null}

      <div className="mb-4">
        <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by supplier or project" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-50 px-6 py-3">
          <p className="text-sm text-slate-500">{selectedProjectBids.length} bid{selectedProjectBids.length === 1 ? "" : "s"} for this project</p>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Supplier Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Bid Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Submitted At</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Documents</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Compliance</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Remarks</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {selectedProjectBids.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState icon={FileText} title="No bids found" subtitle="Try changing filters or search terms." />
                </td>
              </tr>
            ) : (
              selectedProjectBids.map((bid) => {
                const draft = reviewDrafts[bid.id] || {};
                const complianceValue = draft.technical_compliance ?? bid.technical_compliance;
                const remarksValue = draft.evaluation_remarks ?? bid.evaluation_remarks ?? "";
                const projectStatus = String(selectedProject?.status || "").toLowerCase();
                const isAwarded = projectStatus === "awarded";
                const bidStatus = String(bid.status || "").toLowerCase();
                const canSelectWinner = complianceValue === true && !isAwarded && bidStatus !== "won";

                return (
                  <Fragment key={bid.id}>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{bid.supplierName || bid.supplier_name || "Supplier"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatPeso(bid.bidAmount || bid.bid_amount)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDateTime(bid.submittedAt || bid.submitted_at)}</td>
                      <td className="px-6 py-4"><FileLinks bid={bid} /></td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateReviewDraft(bid.id, { technical_compliance: true })}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold ${complianceValue === true ? "bg-emerald-500 text-white" : "border border-slate-200 text-slate-600"}`}
                            disabled={isAwarded}
                          >
                            Compliant
                          </button>
                          <button
                            type="button"
                            onClick={() => updateReviewDraft(bid.id, { technical_compliance: false })}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold ${complianceValue === false ? "bg-red-500 text-white" : "border border-slate-200 text-slate-600"}`}
                            disabled={isAwarded}
                          >
                            Non-Compliant
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <textarea
                          rows={2}
                          value={remarksValue}
                          onChange={(event) => updateReviewDraft(bid.id, { evaluation_remarks: event.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                          placeholder="Add remarks"
                          disabled={isAwarded}
                        />
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={bid.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <LoadingButton
                            type="button"
                            onClick={() => saveEvaluation(bid)}
                            isLoading={actionLoading}
                            loadingText="Saving..."
                            className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
                            disabled={isAwarded}
                          >
                            Save Evaluation
                          </LoadingButton>
                          {canSelectWinner ? (
                            <LoadingButton
                              type="button"
                              onClick={() => {
                                setSelectingBid(bid);
                                setShowWinnerConfirm(true);
                              }}
                              isLoading={actionLoading}
                              loadingText="Awarding..."
                              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-600"
                            >
                              Select Winner
                            </LoadingButton>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={showWinnerConfirm}
        onClose={() => setShowWinnerConfirm(false)}
        onConfirm={confirmWinnerSelection}
        title="Select this supplier as winner?"
        message="This will mark the chosen bid as won, the other bids as lost, and permanently close bidding for this project."
        confirmLabel="Select Winner"
        confirmVariant="danger"
        icon={<Trophy className="h-4 w-4" />}
        infoCard={selectingBid ? <div className="text-sm text-slate-600"><p>Supplier: {selectingBid.supplierName}</p><p>Project: {selectingBid.projectTitle || selectingBid.projectName}</p><p>Amount: {formatPeso(selectingBid.bidAmount || selectingBid.bid_amount)}</p></div> : null}
        isConfirmLoading={actionLoading}
        confirmLoadingText="Awarding..."
      />

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}