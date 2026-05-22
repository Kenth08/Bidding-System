import { BadgeCheck, CheckCircle, Clock3, FileText, Lock, ShieldAlert, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import LoadingButton from "../../components/ui/LoadingButton";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";
import { getStatusLabel } from "../../lib/procurementStatus";
import { procurementAPI } from "../../services/api";
import { useData } from "../../context/DataContext";

function formatDate(value) {
  if (!value) return "—";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) return value;
  return dateValue.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function safeStr(val) {
  return (val ?? "").toString().toLowerCase();
}

function getRequestStatusLabel(request) {
  return getStatusLabel(request?.status);
}

function canAction(request) {
  return ["Pending Review", "Revision Required"].includes(getRequestStatusLabel(request));
}

function isLocked(request) {
  return ["Approved", "Rejected"].includes(getRequestStatusLabel(request));
}

function getDecisionMeta(action) {
  if (action === "rejected") {
    return {
      title: "Reject request",
      subtitle: "Provide a clear reason so the admin can revise or close the request cleanly.",
      buttonLabel: "Submit Rejection",
      buttonClassName: "bg-red-600 hover:bg-red-700 focus:ring-red-400/30",
      icon: ShieldAlert,
    };
  }

  return {
    title: "Return for revision",
    subtitle: "Explain what needs to be corrected before the request can be reviewed again.",
    buttonLabel: "Submit Revision Notes",
    buttonClassName: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-400/30",
    icon: FileText,
  };
}

export default function SchoolHeadRequests() {
  const { cache, refreshProcurement, updateItem } = useData();
  const [requests, setRequests] = useState(() => cache.procurementRequests || []);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState("approved");
  const [remarks, setRemarks] = useState("");
  const [showRemarks, setShowRemarks] = useState(false);
  const [remarksInvalid, setRemarksInvalid] = useState(false);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const filters = ["All", "Pending Review", "Approved", "Rejected", "Revision Required"];

  useEffect(() => {
    if (cache.procurementRequests !== null) {
      setRequests(cache.procurementRequests);
    }
  }, [cache.procurementRequests]);

  async function fetchRequests() {
    const items = await refreshProcurement();
    if (Array.isArray(items)) {
      setRequests(items);
    }
    return items;
  }

  const filtered = useMemo(() => {
    return requests.filter((request) => {
      const statusLabel = getStatusLabel(request.status);
      const matchesFilter = filter === "All" || statusLabel === filter;
      const matchesSearch =
        safeStr(request.title || request.project_title).includes(safeStr(search)) ||
        safeStr(request.procurement_type).includes(safeStr(search));
      return matchesFilter && matchesSearch;
    });
  }, [filter, requests, search]);

  function showToast(message, type = "success") {
    setToast({ message, type });
  }

  function closeModal() {
    setSelectedRequest(null);
    setRemarks("");
    setShowRemarks(false);
    setReviewAction("approved");
    setRemarksInvalid(false);
  }

  function openDetails(request) {
    setSelectedRequest(request);
    setReviewAction("approved");
    setRemarks("");
    setShowRemarks(false);
  }

  function startDecision(action) {
    setReviewAction(action);
    setShowRemarks(action !== "approved");
    setRemarksInvalid(false);
  }

  async function submitReview(action) {
    if (!selectedRequest) return;
    if (!canAction(selectedRequest)) {
      showToast("This request is locked and cannot be reviewed again.", "error");
      return;
    }
    if ((action === "rejected" || action === "revision_required") && !remarks.trim()) {
      setRemarksInvalid(true);
      showToast("Remarks are required for rejection or revision.", "error");
      return;
    }

    setActionLoading(true);
    try {
      const response = await procurementAPI.review(selectedRequest.id, action, remarks);
      const updatedRequest = response.data?.request || response.data;
      if (updatedRequest) {
        updateItem("procurement", selectedRequest.id, updatedRequest);
        setRequests((previous) => previous.map((item) => (item.id === selectedRequest.id ? updatedRequest : item)));
      }
      closeModal();
      await fetchRequests();
      showToast(
        action === "approved"
          ? "Request approved. Project has been published successfully."
          : action === "rejected"
            ? "Request has been rejected."
            : "Request returned for revision."
      );
    } catch (error) {
      console.error("Failed to review request", error);
      showToast(error.response?.data?.error || "Failed to review request.", "error");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Procurement Requests</h2>
        <p className="mt-0.5 text-sm text-slate-500">Review and approve procurement requests from the admin.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="flex gap-1 border-b border-slate-100 px-6 pt-4">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${filter === item ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="border-b border-slate-50 px-6 py-3">
          <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by project title" />
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {["Project Title", "Budget", "Type", "Deadline", "Status", "Actions"].map((heading) => (
                <th key={heading} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={CheckCircle} title="No requests found" subtitle="No procurement requests match your filter." />
                </td>
              </tr>
            ) : (
              filtered.map((request) => (
                <Fragment key={request.id}>
                  <tr className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{request.title || request.project_title}</p>
                      <p className="mt-0.5 text-xs text-slate-400">Created by {request.created_by_name || "Admin"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">₱{Number(request.budget || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{request.procurement_type || "Goods"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(request.deadline)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={request.status} />
                        {isLocked(request) ? <Lock className="h-3.5 w-3.5 text-slate-400" /> : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetails(request)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
        </div>
        <p className="text-sm text-slate-600">Approved requests are automatically published as projects.</p>
      </div>

      {selectedRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={closeModal} aria-hidden="true" />
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Request Details</h3>
                <p className="mt-0.5 text-xs text-slate-400">Read-only details with review actions</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-emerald-50/50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={selectedRequest.status} />
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          <Clock3 className="h-3.5 w-3.5" />
                          Review workspace
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold text-slate-900">{selectedRequest.title || selectedRequest.project_title}</h3>
                      <p className="mt-1 text-sm text-slate-500">Decide whether to approve, return for revision, or reject this procurement request.</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Budget</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">₱{Number(selectedRequest.budget || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[
                    { label: "Procurement Type", value: selectedRequest.procurement_type || "Goods", icon: BadgeCheck },
                    { label: "Deadline", value: formatDate(selectedRequest.deadline), icon: Clock3 },
                    { label: "Procurement Schedule", value: selectedRequest.procurement_schedule || "—", icon: FileText },
                    { label: "Delivery Period", value: selectedRequest.delivery_period || "—", icon: FileText },
                    { label: "Created By", value: selectedRequest.created_by_name || "Admin", icon: BadgeCheck },
                    { label: "Review Status", value: getStatusLabel(selectedRequest.status), icon: CheckCircle },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="min-h-[96px] rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                        <div className="flex h-full items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                            <p className="mt-2 text-sm font-medium leading-5 text-slate-800 break-words">{item.value}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Specifications</p>
                      <p className="mt-0.5 text-xs text-slate-400">Read carefully before taking any action</p>
                    </div>
                  </div>
                  <p className="whitespace-pre-line pt-3 text-sm leading-6 text-slate-700">{selectedRequest.technical_specifications || "—"}</p>
                </div>

                {showRemarks ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${reviewAction === "rejected" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                        {reviewAction === "rejected" ? <ShieldAlert className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">{getDecisionMeta(reviewAction).title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{getDecisionMeta(reviewAction).subtitle}</p>
                        <textarea
                          rows={4}
                          value={remarks}
                                  onChange={(event) => { setRemarks(event.target.value); setRemarksInvalid(false); }}
                                  aria-invalid={remarksInvalid}
                                  className={`mt-4 w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 ${remarksInvalid ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-400/20' : 'border border-slate-200 bg-white'}`}
                                  placeholder="Enter your remarks"
                        />
                                {remarksInvalid ? (
                                  <p className="mt-2 text-xs text-red-600">Remarks are required for rejection or revision.</p>
                                ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-xs leading-5 text-slate-500">
                  <p className="font-medium text-slate-700">Review actions</p>
                  <p>Approved requests are converted into projects. Revision and rejection require remarks.</p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Close
                  </button>
                  {isLocked(selectedRequest) ? (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500">
                      <Lock className="h-3.5 w-3.5" />
                      <span>{getRequestStatusLabel(selectedRequest)}</span>
                    </div>
                  ) : showRemarks ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { setReviewAction("approved"); setShowRemarks(false); }}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        Back
                      </button>
                      <LoadingButton
                        onClick={async () => await submitReview(reviewAction)}
                        isLoading={actionLoading}
                        disabled={(reviewAction === 'rejected' || reviewAction === 'revision_required') && !remarks.trim()}
                        loadingText={reviewAction === "rejected" ? "Rejecting..." : "Submitting..."}
                        className={`border px-4 py-2.5 text-sm font-semibold text-white shadow-sm ${getDecisionMeta(reviewAction).buttonClassName}`}
                      >
                        {getDecisionMeta(reviewAction).buttonLabel}
                      </LoadingButton>
                    </>
                  ) : (
                    <>
                      <LoadingButton
                        onClick={async () => { setReviewAction("approved"); setShowRemarks(false); await submitReview("approved"); }}
                        isLoading={actionLoading && reviewAction === "approved"}
                        loadingText="Approving..."
                        className="border border-emerald-200 bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600"
                      >
                        Approve
                      </LoadingButton>
                      <LoadingButton
                        onClick={() => startDecision("revision_required")}
                        isLoading={actionLoading && reviewAction === "revision_required"}
                        loadingText="Opening..."
                        className={`border px-4 py-2.5 text-sm font-semibold ${reviewAction === "revision_required" ? "border-blue-300 bg-blue-600 text-white" : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
                      >
                        Return for Revision
                      </LoadingButton>
                      <LoadingButton
                        onClick={() => startDecision("rejected")}
                        isLoading={actionLoading && reviewAction === "rejected"}
                        loadingText="Opening..."
                        className={`border px-4 py-2.5 text-sm font-semibold ${reviewAction === "rejected" ? "border-red-300 bg-red-600 text-white" : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"}`}
                      >
                        Reject
                      </LoadingButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? <Toast message={toast.message} type={toast.type} isVisible onClose={() => setToast(null)} /> : null}
    </div>
  )
}