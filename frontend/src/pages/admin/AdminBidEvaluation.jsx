import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileText,
  Save,
  XCircle,
} from "lucide-react";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EmptyState from "../../components/shared/EmptyState";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";
import { bidsAPI } from "../../services/api";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const value = new Date(dateStr);
  if (Number.isNaN(value.getTime())) return "—";
  return value.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeStr(val) {
  return (val ?? "").toString().toLowerCase();
}

function getBidProjectKey(bid) {
  return bid.projectId || bid.project || bid.project_id || "";
}

function getProjectTitle(bid, projects) {
  const projectId = String(getBidProjectKey(bid));
  const matchedProject = projects.find((project) => String(project.id) === projectId);
  return matchedProject?.title || bid.projectTitle || bid.projectName || "Unknown Project";
}

function getBidAmount(bid) {
  return Number(bid.bidAmount || bid.bid_amount || 0);
}

function getComplianceValue(bid) {
  if (typeof bid.is_technically_compliant === "boolean") return bid.is_technically_compliant;
  if (typeof bid.technical_compliance === "boolean") return bid.technical_compliance;
  return false;
}

function getStatusLabel(status) {
  const normalized = safeStr(status);
  if (normalized === "won") return "Selected";
  if (normalized === "lost") return "Rejected";
  if (normalized === "under_evaluation" || normalized === "under review") return "Under Review";
  if (normalized === "submitted") return "Submitted";
  return status || "—";
}

export default function AdminBidEvaluation({
  bids = [],
  setBids,
  projects = [],
  selectedProjectId = null,
  onBackToProjects,
  onClearSelection,
  setProjects,
  isLoading,
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [remarks, setRemarks] = useState({});
  const [compliance, setCompliance] = useState({});
  const [toast, setToast] = useState(null);
  const [savingRemarks, setSavingRemarks] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmWinner, setConfirmWinner] = useState(null);
  const [confirmBlockchain, setConfirmBlockchain] = useState(null);

  const filters = ["All", "Submitted", "Under Review", "Compliant", "Non-Compliant", "Selected", "Rejected"];

  useEffect(() => {
    const nextRemarks = {};
    const nextCompliance = {};
    bids.forEach((bid) => {
      nextRemarks[bid.id] = bid.evaluation_remarks || "";
      nextCompliance[bid.id] = getComplianceValue(bid);
    });
    setRemarks(nextRemarks);
    setCompliance(nextCompliance);
  }, [bids]);

  function showToast(message, type = "success") {
    setToast({ message, type });
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(null), 3500);
  }

  const visibleBids = useMemo(() => {
    const scopedBids = selectedProjectId
      ? bids.filter((bid) => String(getBidProjectKey(bid)) === String(selectedProjectId))
      : bids;

    return scopedBids.filter((bid) => {
      const statusLabel = getStatusLabel(bid.status);
      let matchesFilter = filter === "All";
      if (filter === "Compliant") matchesFilter = getComplianceValue(bid) === true;
      else if (filter === "Non-Compliant") matchesFilter = getComplianceValue(bid) === false;
      else if (filter !== "All") matchesFilter = safeStr(statusLabel) === safeStr(filter);

      const projectTitle = getProjectTitle(bid, projects);
      const matchesSearch =
        safeStr(bid.supplierName || bid.supplier_name).includes(safeStr(search)) ||
        safeStr(bid.company || bid.company_name).includes(safeStr(search)) ||
        safeStr(projectTitle).includes(safeStr(search));

      return matchesFilter && matchesSearch;
    });
  }, [bids, filter, projects, search, selectedProjectId]);

  const summary = useMemo(() => {
    const total = bids.length;
    const submitted = bids.filter((bid) => safeStr(bid.status) === "submitted").length;
    const underReview = bids.filter((bid) => safeStr(bid.status) === "under_evaluation" || safeStr(bid.status) === "under review").length;
    const compliant = bids.filter((bid) => getComplianceValue(bid) === true).length;
    const selected = bids.filter((bid) => safeStr(bid.status) === "won").length;
    return { total, submitted, underReview, compliant, selected };
  }, [bids]);

  const grouped = useMemo(() => {
    return visibleBids.reduce((accumulator, bid) => {
      const projectId = String(getBidProjectKey(bid) || "unknown");
      if (!accumulator[projectId]) {
        accumulator[projectId] = {
          id: projectId,
          title: getProjectTitle(bid, projects),
          bids: [],
        };
      }
      accumulator[projectId].bids.push(bid);
      return accumulator;
    }, {});
  }, [projects, visibleBids]);

  async function handleMarkReview(id) {
    setActionLoading(`${id}:review`);
    try {
      const response = await bidsAPI.markReview(id);
      setBids?.((previous) => previous.map((bid) => (bid.id === id ? { ...bid, ...response.data } : bid)));
      showToast("Bid marked as Under Review.");
    } catch (error) {
      console.error("Failed to mark bid for review", error);
      showToast(error.response?.data?.error || "Failed to update bid.", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveRemarks(bid) {
    setSavingRemarks(bid.id);
    try {
      const response = await bidsAPI.saveRemarks(bid.id, {
        evaluation_remarks: remarks[bid.id] || "",
        technical_compliance: compliance[bid.id] ?? false,
      });

      setBids?.((previous) => previous.map((item) => (item.id === bid.id ? { ...item, ...response.data } : item)));
      showToast(compliance[bid.id] ? "Evaluation saved. Bid is compliant." : "Evaluation saved. Bid remains non-compliant.", compliance[bid.id] ? "success" : "warning");
    } catch (error) {
      console.error("Failed to save evaluation", error);
      showToast(error.response?.data?.error || "Failed to save evaluation.", "error");
    } finally {
      setSavingRemarks(null);
    }
  }

  async function handleSelectWinner(bid) {
    setActionLoading(`${bid.id}:winner`);
    try {
      const response = await bidsAPI.selectWinner(bid.id);
      const winner = response.data;
      const winningProjectId = String(winner.project || getBidProjectKey(winner));

      setBids?.((previous) =>
        previous.map((item) => {
          if (String(getBidProjectKey(item)) !== winningProjectId) return item;
          if (item.id === winner.id) return { ...item, ...winner };
          return { ...item, status: "lost" };
        })
      );

      setProjects?.((previous) =>
        previous.map((project) =>
          String(project.id) === winningProjectId
            ? { ...project, status: "awarded", awarded_at: project.awarded_at || new Date().toISOString() }
            : project
        )
      );

      setConfirmWinner(null);
      showToast("Winner selected successfully.");
    } catch (error) {
      console.error("Failed to select winner", error);
      showToast(error.response?.data?.error || "Failed to select winner.", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRecordBlockchain(bid) {
    setActionLoading(`${bid.id}:blockchain`);
    try {
      const response = await bidsAPI.recordBlockchain(bid.id);
      setBids?.((previous) => previous.map((item) => (item.id === bid.id ? { ...item, ...response.data } : item)));
      setConfirmBlockchain(null);
      showToast("Successfully recorded to blockchain.");
    } catch (error) {
      console.error("Failed to record blockchain entry", error);
      showToast(error.response?.data?.error || "Failed to record to blockchain.", "error");
    } finally {
      setActionLoading(null);
    }
  }

  const selectedProject = selectedProjectId
    ? projects.find((project) => String(project.id) === String(selectedProjectId))
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Bid Evaluation</h1>
          <p className="mt-0.5 text-sm text-slate-500">Review submitted bids, evaluate compliance, and select a winning supplier</p>
        </div>
        {selectedProject ? (
          <button
            type="button"
            onClick={() => {
              onClearSelection?.();
              onBackToProjects?.();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" /> Back to Projects
          </button>
        ) : null}
      </div>

      {selectedProject ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Title</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{selectedProject.title}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{formatPeso(selectedProject.budget)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deadline</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{formatDate(selectedProject.deadline)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <div className="mt-1">
                <StatusBadge status={selectedProject.status} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {[
          { label: "Total Bids", value: summary.total, color: "text-slate-900", bg: "bg-white border-slate-100" },
          { label: "Submitted", value: summary.submitted, color: "text-slate-600", bg: "bg-white border-slate-100" },
          { label: "Under Review", value: summary.underReview, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
          { label: "Compliant", value: summary.compliant, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
          { label: "Selected", value: summary.selected, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} border rounded-2xl p-4`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <div>
          <p className="mb-1 text-sm font-semibold text-blue-800">Evaluation Rules</p>
          <div className="space-y-0.5 text-xs text-blue-700">
            <p>1. All submitted bids start as <strong>Non-Compliant</strong> by default.</p>
            <p>2. Review the bid documents and proposal, then add evaluation remarks.</p>
            <p>3. Mark the bid as <strong>Technically Compliant</strong> and save the evaluation.</p>
            <p>4. Only compliant bids can be selected as winner.</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="flex gap-1 border-b border-slate-100 px-6 pt-4 overflow-x-auto">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all whitespace-nowrap ${filter === item ? "text-emerald-600 border-emerald-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="px-6 py-3 border-b border-slate-50">
          <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by supplier, company, or project..." />
        </div>

        {visibleBids.length === 0 ? (
          <EmptyState icon={FileText} title="No bids found" subtitle="No bids match the current filter." />
        ) : (
          <div className="space-y-4 p-4">
            {Object.values(grouped).map((group) => {
              const orderedBids = [...group.bids].sort((a, b) => getBidAmount(a) - getBidAmount(b));
              const isGroupExpanded = Boolean(expandedGroups[group.id]);
              return (
                <div key={group.id} className="overflow-hidden rounded-2xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setExpandedGroups((previous) => ({ ...previous, [group.id]: !previous[group.id] }))}
                    className="flex w-full items-center gap-3 bg-slate-50/50 px-6 py-3 text-left"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">{group.title}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">{orderedBids.length} bid{orderedBids.length === 1 ? "" : "s"}</span>
                    <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">{orderedBids.filter((bid) => getComplianceValue(bid)).length} compliant</span>
                    <span className="ml-auto text-slate-400">{isGroupExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
                  </button>

                  {isGroupExpanded ? (
                    <div className="divide-y divide-slate-50">
                      {orderedBids.map((bid, index) => {
                      const complianceValue = compliance[bid.id] ?? getComplianceValue(bid);
                      const remarksValue = remarks[bid.id] ?? bid.evaluation_remarks ?? "";
                      const bidStatus = safeStr(bid.status);
                      const canSelectWinner = complianceValue === true && !["won", "lost"].includes(bidStatus);

                      return (
                        <div key={bid.id}>
                          <div className="flex cursor-pointer items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/50" onClick={() => setExpandedId((previous) => (previous === bid.id ? null : bid.id))}>
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                              {index === 0 ? "🥇" : `#${index + 1}`}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-slate-800">{bid.supplierName || bid.supplier_name || "Supplier"}</p>
                                {complianceValue ? (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                    <CheckCircle className="h-3 w-3" /> Compliant
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-red-100 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-500">
                                    <XCircle className="h-3 w-3" /> Non-Compliant
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-slate-400">{bid.company || bid.company_name || "—"} · Submitted {formatDate(bid.submittedAt || bid.submitted_at)}</p>
                            </div>

                            <div className="shrink-0 text-right">
                              <p className="text-base font-bold text-slate-900">{formatPeso(bid.bidAmount || bid.bid_amount)}</p>
                              <p className="text-xs text-slate-400">Bid Amount</p>
                            </div>

                            <div className="shrink-0">
                              <StatusBadge status={getStatusLabel(bid.status)} />
                            </div>

                            <div className="flex shrink-0 items-center gap-2" onClick={(event) => event.stopPropagation()}>
                              {bidStatus === "submitted" ? (
                                <button
                                  type="button"
                                  onClick={() => handleMarkReview(bid.id)}
                                  disabled={actionLoading === `${bid.id}:review`}
                                  className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50"
                                >
                                  <Eye className="h-3.5 w-3.5" /> Review
                                </button>
                              ) : null}

                              {(bidStatus === "under_evaluation" || bidStatus === "under review") && (canSelectWinner ? (
                                <button
                                  type="button"
                                  onClick={() => setConfirmWinner(bid)}
                                  disabled={actionLoading === `${bid.id}:winner`}
                                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                                >
                                  <Award className="h-3.5 w-3.5" /> Select Winner
                                </button>
                              ) : (
                                <span className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400" title="Mark as compliant first to select as winner">
                                  <XCircle className="h-3.5 w-3.5" /> Not Compliant
                                </span>
                              ))}

                              {bidStatus === "won" && !bid.recorded ? (
                                <button
                                  type="button"
                                  onClick={() => setConfirmBlockchain(bid)}
                                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-900"
                                >
                                  <Clock className="h-3.5 w-3.5" /> Record to Blockchain
                                </button>
                              ) : null}

                              {bid.recorded ? (
                                <span className="flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600">
                                  <CheckCircle className="h-3.5 w-3.5" /> Recorded ✓
                                </span>
                              ) : null}

                              {expandedId === bid.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                            </div>
                          </div>

                          {expandedId === bid.id ? (
                            <div className="border-t border-slate-100 bg-slate-50/30 px-6 pb-5">
                              <div className="grid grid-cols-1 gap-6 pt-4 lg:grid-cols-2">
                                <div className="space-y-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bid Details</p>

                                  <div>
                                    <p className="mb-1 text-xs font-semibold text-slate-500">Technical Proposal</p>
                                    <div className="rounded-xl border border-slate-100 bg-white p-3">
                                      <p className="text-sm leading-relaxed text-slate-700">{bid.proposal || "No proposal submitted."}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="mb-2 text-xs font-semibold text-slate-500">Submitted Documents</p>
                                    <div className="space-y-2">
                                      {[
                                        { label: "Quotation Document", url: bid.quotation_document || bid.quotationFile },
                                        { label: "Technical Document", url: bid.technical_document || bid.technicalProposal },
                                      ].map(({ label, url }) => (
                                        <div key={label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2">
                                          <span className="text-xs font-medium text-slate-600">{label}</span>
                                          {url ? (
                                            <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                                              <Eye className="h-3 w-3" /> View
                                            </a>
                                          ) : (
                                            <span className="text-xs italic text-slate-400">Not submitted</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Evaluation</p>

                                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                                    <p className="mb-3 text-xs font-semibold text-slate-600">Technical Compliance</p>
                                    <div className="flex items-center gap-3">
                                      <button
                                        type="button"
                                        onClick={() => setCompliance((previous) => ({ ...previous, [bid.id]: true }))}
                                        className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${complianceValue ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:border-emerald-200"}`}
                                      >
                                        <CheckCircle className="mr-2 inline-block h-4 w-4" /> Compliant
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setCompliance((previous) => ({ ...previous, [bid.id]: false }))}
                                        className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${complianceValue === false ? "border-red-500 bg-red-500 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:border-red-200"}`}
                                      >
                                        <XCircle className="mr-2 inline-block h-4 w-4" /> Non-Compliant
                                      </button>
                                    </div>
                                    <p className="mt-2 text-center text-xs text-slate-400">
                                      {complianceValue
                                        ? "This bid will be eligible for winner selection after saving."
                                        : "This bid cannot be selected as winner until marked compliant."}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Evaluation Remarks</label>
                                    <textarea
                                      rows={4}
                                      value={remarksValue}
                                      onChange={(event) => setRemarks((previous) => ({ ...previous, [bid.id]: event.target.value }))}
                                      placeholder="Add evaluation notes, compliance findings, or reasons for non-compliance..."
                                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleSaveRemarks(bid)}
                                    disabled={savingRemarks === bid.id}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-900 disabled:bg-slate-400"
                                  >
                                    {savingRemarks === bid.id ? <Clock className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    {savingRemarks === bid.id ? "Saving..." : "Save Evaluation"}
                                  </button>

                                  {!complianceValue && (bidStatus === "submitted" || bidStatus === "under_evaluation" || bidStatus === "under review") ? (
                                    <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                                      <p className="text-xs text-amber-700">Mark this bid as <strong>Compliant</strong> and save the evaluation to enable winner selection.</p>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirmWinner)}
        onClose={() => setConfirmWinner(null)}
        onConfirm={() => handleSelectWinner(confirmWinner)}
        title="Select as Winner?"
        confirmLabel="Select Winner"
        confirmVariant="primary"
        message={
          confirmWinner ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                You are selecting <strong>{confirmWinner.supplierName || confirmWinner.supplier_name}</strong> as the winning supplier for <strong>{getProjectTitle(confirmWinner, projects)}</strong>.
              </p>
              <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Supplier</span>
                  <span className="font-semibold text-slate-800">{confirmWinner.supplierName || confirmWinner.supplier_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Company</span>
                  <span className="font-semibold text-slate-800">{confirmWinner.company || confirmWinner.company_name || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Bid Amount</span>
                  <span className="font-bold text-emerald-600">{formatPeso(confirmWinner.bidAmount || confirmWinner.bid_amount)}</span>
                </div>
              </div>
              <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-600">⚠️ All other bids for this project will be marked as Rejected.</p>
            </div>
          ) : ""
        }
      />

      <ConfirmDialog
        isOpen={Boolean(confirmBlockchain)}
        onClose={() => setConfirmBlockchain(null)}
        onConfirm={() => handleRecordBlockchain(confirmBlockchain)}
        title="Record to Blockchain?"
        confirmLabel="Confirm & Record"
        confirmVariant="primary"
        message={
          <div className="space-y-3">
            <p className="text-sm text-slate-600">This will permanently store the award on the blockchain ledger.</p>
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2">
              <p className="text-xs font-medium text-red-600">⚠️ This action is permanent and cannot be undone.</p>
            </div>
          </div>
        }
      />

      {toast ? <Toast message={toast.message} type={toast.type} isVisible onClose={() => setToast(null)} /> : null}
    </div>
  );
}