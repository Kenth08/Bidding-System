// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\school_head\SchoolHeadRequests.jsx
import { CheckCircle, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";
import { getStatusLabel } from "../../lib/procurementStatus";
import { procurementAPI } from "../../services/api";

function formatDate(value) {
  if (!value) return "—";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) return value;
  return dateValue.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function safeStr(val) {
  return (val ?? "").toString().toLowerCase();
}

export default function SchoolHeadRequests({ refreshToken = 0, onRefresh }) {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState("approved");
  const [remarks, setRemarks] = useState("");
  const [showRemarks, setShowRemarks] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const filters = ["All", "Pending Review", "Approved", "Rejected", "Revision Required"];

  async function loadRequests() {
    setLoading(true);
    try {
      const response = await procurementAPI.getAll();
      const items = response.data.results || response.data || [];
      setRequests(items);
    } catch (error) {
      console.error("Failed to load procurement requests", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, [refreshToken]);

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

  function openDetails(request) {
    setSelectedRequest(request);
    setReviewAction("approved");
    setRemarks("");
    setShowRemarks(false);
  }

  async function submitReview(action) {
    if (!selectedRequest) return;
    if ((action === "rejected" || action === "revision_required") && !remarks.trim()) {
      showToast("Remarks are required for rejection or revision.", "error");
      return;
    }
    try {
      await procurementAPI.review(selectedRequest.id, action, remarks);
      setSelectedRequest(null);
      setRemarks("");
      setShowRemarks(false);
      await loadRequests();
      onRefresh?.();
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
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <div className="p-6">
                    <LoadingSkeleton rows={5} />
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
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
                    <td className="px-6 py-4"><StatusBadge status={request.status} /></td>
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

      <Modal
        isOpen={Boolean(selectedRequest)}
        onClose={() => { setSelectedRequest(null); setRemarks(""); }}
        title="Request Details"
        subtitle="Read-only details with review actions"
        size="lg"
      >
        {selectedRequest ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Title</p>
                <p className="mt-1 text-sm text-slate-800">{selectedRequest.title || selectedRequest.project_title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</p>
                <p className="mt-1 text-sm text-slate-800">₱{Number(selectedRequest.budget || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Type</p>
                <p className="mt-1 text-sm text-slate-800">{selectedRequest.procurement_type || "Goods"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deadline</p>
                <p className="mt-1 text-sm text-slate-800">{formatDate(selectedRequest.deadline)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Schedule</p>
                <p className="mt-1 text-sm text-slate-800">{selectedRequest.procurement_schedule || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Period</p>
                <p className="mt-1 text-sm text-slate-800">{selectedRequest.delivery_period || "—"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Specifications</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{selectedRequest.technical_specifications || "—"}</p>
            </div>

            {showRemarks ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remarks</p>
                <textarea
                  rows={4}
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                  placeholder="Enter remarks"
                />
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => { setSelectedRequest(null); setRemarks(""); }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={async () => { setReviewAction("approved"); setShowRemarks(false); await submitReview("approved"); }}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
              >
                Approve
              </button>
              <button
                onClick={() => { setReviewAction("revision_required"); setShowRemarks(true); }}
                className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              >
                Needs Revision
              </button>
              <button
                onClick={() => { setReviewAction("rejected"); setShowRemarks(true); }}
                className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                Reject
              </button>
              {showRemarks ? (
                <button
                  onClick={async () => await submitReview(reviewAction)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white ${reviewAction === "rejected" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  Submit {reviewAction === "rejected" ? "Rejection" : "Revision"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      {toast ? <Toast message={toast.message} type={toast.type} isVisible onClose={() => setToast(null)} /> : null}
    </div>
  );
}
