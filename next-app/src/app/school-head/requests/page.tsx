"use client";
import { useState, useEffect } from "react";
import { procurementAPI } from "@/services/api";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";

export default function SchoolHeadRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = () => {
    setLoading(true);
    procurementAPI.getAll().then((res) => setRequests(res.data?.results || res.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleReview = async (action: string) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await procurementAPI.review(selected.id, action, remarks);
      setSelected(null);
      setRemarks("");
      fetchRequests();
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-400">Loading...</div>;

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
                  <button onClick={() => setSelected(r)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-700">Review</button>
                </td>
              </tr>
            ))}
            {!requests.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No procurement requests found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setRemarks(""); }} title="Review Request" subtitle={selected?.project_title}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-400">Budget:</span> <span className="font-medium">₱{Number(selected?.budget || 0).toLocaleString()}</span></div>
            <div><span className="text-slate-400">Status:</span> <StatusBadge status={selected?.status || ""} /></div>
            <div><span className="text-slate-400">Deadline:</span> <span className="font-medium">{selected?.deadline ? new Date(selected.deadline).toLocaleDateString() : "—"}</span></div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-slate-400" placeholder="Add remarks (optional)..." />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button disabled={submitting} onClick={() => handleReview("approve")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50">Approve</button>
            <button disabled={submitting} onClick={() => handleReview("reject")} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50">Reject</button>
            <button disabled={submitting} onClick={() => handleReview("revision")} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50">Return for Revision</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
