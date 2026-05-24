"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { bidsAPI, projectsAPI } from "@/services/api";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import StatusBadge from "@/components/shared/StatusBadge";
import Toast from "@/components/shared/Toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import LoadingButton from "@/components/ui/LoadingButton";
import { SkeletonTable } from "@/components/ui/Skeleton";

function formatPeso(v: unknown) { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(v || 0)); }

export default function AdminBidEvaluation() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(searchParams.get("project"));
  const [evalModal, setEvalModal] = useState<any>(null);
  const [evalForm, setEvalForm] = useState({ technical_compliance: false, evaluation_remarks: "" });
  const [winnerConfirm, setWinnerConfirm] = useState<any>(null);
  const [reviewConfirm, setReviewConfirm] = useState<any>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isEvalSaving, setIsEvalSaving] = useState(false);
  const [bidDetail, setBidDetail] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    Promise.all([
      projectsAPI.getAll().then((r) => setProjects(Array.isArray(r.data) ? r.data : r.data.results || [])),
      bidsAPI.getAll().then((r) => setBids(Array.isArray(r.data) ? r.data : r.data.results || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const projectsWithBids = useMemo(() => {
    const bidsByProject: Record<string, any[]> = {};
    bids.forEach((b) => { const pid = b.project_id || b.project?.id; if (pid) { if (!bidsByProject[pid]) bidsByProject[pid] = []; bidsByProject[pid].push(b); } });
    return projects.filter((p) => bidsByProject[p.id]?.length).map((p) => ({ ...p, bidCount: bidsByProject[p.id]?.length || 0 }));
  }, [projects, bids]);

  const currentBids = useMemo(() => {
    if (!selectedProject) return [];
    return bids.filter((b) => (b.project_id || b.project?.id) === selectedProject).sort((a, b) => Number(a.bid_amount) - Number(b.bid_amount));
  }, [bids, selectedProject]);

  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  async function handleMarkReview() {
    if (!reviewConfirm) return;
    setIsConfirmLoading(true);
    try { await bidsAPI.markReview(reviewConfirm.id); setToast({ message: "Marked under evaluation", type: "success" }); refreshBids(); } catch { setToast({ message: "Failed", type: "error" }); }
    finally { setIsConfirmLoading(false); setReviewConfirm(null); }
  }

  async function handleSaveRemarks() {
    if (!evalModal) return;
    setIsEvalSaving(true);
    try { await bidsAPI.saveRemarks(evalModal.id, { technical_compliance: evalForm.technical_compliance, evaluation_remarks: evalForm.evaluation_remarks }); setToast({ message: "Evaluation saved", type: "success" }); setEvalModal(null); refreshBids(); } catch { setToast({ message: "Failed to save", type: "error" }); }
    finally { setIsEvalSaving(false); }
  }

  async function handleSelectWinner() {
    if (!winnerConfirm) return;
    setIsConfirmLoading(true);
    try { await bidsAPI.selectWinner(winnerConfirm.id); setToast({ message: "Winner selected!", type: "success" }); setWinnerConfirm(null); refreshBids(); } catch (e: any) { setToast({ message: e?.response?.data?.error || "Failed", type: "error" }); setWinnerConfirm(null); }
    finally { setIsConfirmLoading(false); }
  }

  function refreshBids() { bidsAPI.getAll().then((r) => setBids(Array.isArray(r.data) ? r.data : r.data.results || [])); }

  if (loading) return <SkeletonTable />;

  if (!selectedProject) {
    return (
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Select a Project to Evaluate</h2>
        {projectsWithBids.length === 0 ? <EmptyState title="No projects with bids" subtitle="Bids will appear here once suppliers submit them." /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectsWithBids.map((p) => (
              <button key={p.id} onClick={() => setSelectedProject(p.id)} className="rounded-2xl border border-slate-100 bg-white p-5 text-left transition-all hover:border-emerald-200 hover:shadow-sm">
                <p className="text-sm font-semibold text-slate-800">{p.title}</p>
                <p className="text-xs text-slate-400 mt-1">{formatPeso(p.budget)} &middot; {p.bidCount} bid{p.bidCount > 1 ? "s" : ""}</p>
                <div className="mt-2"><StatusBadge status={p.status} /></div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setSelectedProject(null)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4"><ArrowLeft className="h-4 w-4" />Back to all projects</button>

      {selectedProjectData && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 mb-5">
          <div className="flex items-center justify-between">
            <div><p className="text-base font-semibold text-slate-800">{selectedProjectData.title}</p><p className="text-xs text-slate-400 mt-0.5">Budget: {formatPeso(selectedProjectData.budget)} &middot; Deadline: {selectedProjectData.deadline ? new Date(selectedProjectData.deadline).toLocaleDateString() : "\u2014"} &middot; {currentBids.length} bids</p></div>
            <StatusBadge status={selectedProjectData.status} />
          </div>
        </div>
      )}

      {currentBids.length === 0 ? <EmptyState title="No bids for this project" /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <table className="w-full">
            <thead><tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Verification</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Compliance</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {currentBids.map((b, i) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm text-slate-600">{b.rank || i + 1}</td>
                  <td className="px-6 py-4"><p className="text-sm font-medium text-slate-800">{b.supplier?.full_name || b.company_name}</p><p className="text-xs text-slate-400">{b.supplier?.company_name || b.company_name}</p></td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${b.supplier?.verification_status === "verified" ? "bg-emerald-100 text-emerald-700" : b.supplier?.verification_status === "verification_rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {b.supplier?.verification_status || "pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{formatPeso(b.bid_amount)}</td>
                  <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                  <td className="px-6 py-4">{b.technical_compliance ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-slate-300" />}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <button onClick={() => setBidDetail(b)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">View</button>
                      {b.status === "submitted" && <button onClick={() => setReviewConfirm(b)} className="rounded-lg border border-blue-200 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">Review</button>}
                      <button onClick={() => { setEvalModal(b); setEvalForm({ technical_compliance: b.technical_compliance || false, evaluation_remarks: b.evaluation_remarks || "" }); }} className="rounded-lg border border-amber-200 px-2 py-1 text-xs text-amber-600 hover:bg-amber-50">Evaluate</button>
                      {b.technical_compliance && b.status !== "won" && b.status !== "lost" && <button onClick={() => setWinnerConfirm(b)} className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-100">Select Winner</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={Boolean(evalModal)} onClose={() => setEvalModal(null)} title="Evaluation Remarks" size="md">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-700">Technical Compliance:</span>
            <button onClick={() => setEvalForm({ ...evalForm, technical_compliance: !evalForm.technical_compliance })} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${evalForm.technical_compliance ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-red-100 text-red-700 border border-red-200"}`}>{evalForm.technical_compliance ? "PASS" : "FAIL"}</button>
          </div>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Evaluation Remarks</span><textarea value={evalForm.evaluation_remarks} onChange={(e) => setEvalForm({ ...evalForm, evaluation_remarks: e.target.value })} rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" placeholder="Enter evaluation notes..." /></label>
          <div className="flex gap-3"><button onClick={() => setEvalModal(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><LoadingButton isLoading={isEvalSaving} onClick={handleSaveRemarks} loadingText="Saving..." className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">Save Evaluation</LoadingButton></div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(bidDetail)} onClose={() => setBidDetail(null)} title="Bid Details" size="lg">
        {bidDetail && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Supplier", value: bidDetail.supplier?.full_name || bidDetail.company_name }, 
                { label: "Company", value: bidDetail.supplier?.company_name || bidDetail.company_name }, 
                { label: "Verification Status", value: bidDetail.supplier?.verification_status || "pending" },
                { label: "Bid Amount", value: formatPeso(bidDetail.bid_amount) }, 
                { label: "Status", value: bidDetail.status }, 
                { label: "Rank", value: bidDetail.rank || "\u2014" }, 
                { label: "Compliance", value: bidDetail.technical_compliance ? "Pass" : "Fail" }
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400 mb-0.5">{label}</p><p className="text-sm font-semibold text-slate-800">{value}</p></div>
              ))}
            </div>
            {bidDetail.proposal && <div className="rounded-xl border border-slate-100 p-3"><p className="text-xs font-semibold text-slate-500 mb-1">Proposal</p><p className="text-sm text-slate-700">{bidDetail.proposal}</p></div>}
            {bidDetail.evaluation_remarks && <div className="rounded-xl border border-amber-100 bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-600 mb-1">Evaluation Remarks</p><p className="text-sm text-amber-800">{bidDetail.evaluation_remarks}</p></div>}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={Boolean(reviewConfirm)} onClose={() => setReviewConfirm(null)} onConfirm={handleMarkReview} title="Mark for Review" message={`Mark this bid from "${reviewConfirm?.supplier?.full_name || reviewConfirm?.company_name}" as under evaluation?`} confirmLabel="Mark for Review" isConfirmLoading={isConfirmLoading} />
      <ConfirmDialog isOpen={Boolean(winnerConfirm)} onClose={() => setWinnerConfirm(null)} onConfirm={handleSelectWinner} title="Select Winner" message={`Select "${winnerConfirm?.supplier?.full_name || winnerConfirm?.company_name}" as the winner with a bid of ${formatPeso(winnerConfirm?.bid_amount)}? This will mark all other bids as lost and record the award on blockchain.`} confirmLabel="Select Winner" isConfirmLoading={isConfirmLoading} />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
