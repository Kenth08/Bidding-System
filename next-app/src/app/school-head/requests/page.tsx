"use client";
import { useState, useEffect } from "react";
import { procurementAPI } from "@/services/api";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Toast from "@/components/shared/Toast";

export default function SchoolHeadRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [remarks, setRemarks] = useState("");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    procurementAPI.getAll().then((res) => setRequests(res.data?.results || res.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const initiateReview = (action: string) => {
    if (selected?.status !== "Pending Review") {
      setError("Only requests pending review can be acted on.");
      return;
    }
    if ((action === "rejected" || action === "revision_required") && !remarks.trim()) {
      setError(action === "rejected" ? "Rejection reason is required." : "Revision notes are required.");
      return;
    }
    setError("");
    setConfirmAction(action);
  };

  const handleConfirmReview = async () => {
    if (!selected || !confirmAction) return;
    setIsConfirmLoading(true);
    try {
      await procurementAPI.review(selected.id, confirmAction, remarks);
      setToast({ message: `Request ${confirmAction === "approved" ? "approved" : confirmAction === "rejected" ? "rejected" : "returned for revision"}`, type: "success" });
      setSelected(null); setRemarks("");
      fetchRequests();
    } catch (err: any) {
      setToast({ message: err.response?.data?.error || "Something went wrong.", type: "error" });
    } finally { setIsConfirmLoading(false); setConfirmAction(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-400">Loading...</div>;

  const confirmMessages: Record<string, string> = {
    approved: `Approve "${selected?.project_title}"? This will create a project from this request.`,
    rejected: `Reject "${selected?.project_title}"? The requester will be notified.`,
    revision_required: `Return "${selected?.project_title}" for revision? The requester will need to update and resubmit.`,
  };

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Title</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Budget</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Deadline</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requests.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-5 py-3 font-medium text-slate-800">{r.project_title}</td>
                <td className="px-5 py-3 text-slate-600">₱{Number(r.budget).toLocaleString()}</td>
                <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-5 py-3 text-slate-500">{r.deadline ? new Date(r.deadline).toLocaleDateString() : "—"}</td>
                <td className="px-5 py-3">
                  <button onClick={() => setSelected(r)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700">{r.status === "Pending Review" ? "Review" : "View"}</button>
                </td>
              </tr>
            ))}
            {!requests.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No procurement requests found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setRemarks(""); setError(""); }} title="Review Request" subtitle={selected?.project_title} size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Budget</p>
              <p className="mt-1 text-sm font-medium text-slate-800">₱{Number(selected?.budget || 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
              <div className="mt-1"><StatusBadge status={selected?.status || ""} /></div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Procurement Type</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{selected?.procurement_type || "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bidding Deadline</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{selected?.deadline ? new Date(selected.deadline).toLocaleDateString() : "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Procurement Schedule</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{selected?.procurement_schedule ? new Date(selected.procurement_schedule).toLocaleDateString() : "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Expected Delivery</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{selected?.delivery_period ? new Date(selected.delivery_period).toLocaleDateString() : "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Public Result Expiry</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{selected?.public_result_expiry_date ? new Date(selected.public_result_expiry_date).toLocaleDateString() : "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Requested By</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{selected?.created_by?.full_name || selected?.created_by?.email || "—"}</p>
            </div>
          </div>
          {selected?.technical_specifications && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Technical Specifications</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{selected.technical_specifications}</p>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-slate-400" placeholder="Add remarks (required for reject/revision)..." />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {selected?.status === "Pending Review" ? (
            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={() => initiateReview("approved")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">Approve</button>
              <button onClick={() => initiateReview("rejected")} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700">Reject</button>
              <button onClick={() => initiateReview("revision_required")} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600">Return for Revision</button>
            </div>
          ) : (
            <p className="pt-2 text-sm text-slate-500">This request is not pending review, so it cannot be acted on from here.</p>
          )}
        </div>
      </Modal>

      <ConfirmDialog isOpen={Boolean(confirmAction)} onClose={() => setConfirmAction(null)} onConfirm={handleConfirmReview} title={confirmAction === "approved" ? "Approve Request" : confirmAction === "rejected" ? "Reject Request" : "Return for Revision"} message={confirmAction ? confirmMessages[confirmAction] || "" : ""} confirmLabel={confirmAction === "approved" ? "Approve" : confirmAction === "rejected" ? "Reject" : "Return"} confirmVariant={confirmAction === "rejected" ? "danger" : "primary"} isConfirmLoading={isConfirmLoading} />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </>
  );
}
