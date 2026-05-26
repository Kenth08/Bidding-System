"use client";
import { Fragment, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle, Trophy, XCircle } from "lucide-react";
import { bidsAPI, projectsAPI } from "@/services/api";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import StatusBadge from "@/components/shared/StatusBadge";
import Toast from "@/components/shared/Toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import LoadingButton from "@/components/ui/LoadingButton";
import { SkeletonTable } from "@/components/ui/Skeleton";

function formatPeso(v: unknown) { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(v || 0)); }

function getSupplierName(bid: any) {
  return bid?.supplier?.full_name || bid?.company_name || "—";
}

function getCompanyName(bid: any) {
  return bid?.supplier?.company_name || bid?.company_name || "—";
}

function getBidDocuments(bid: any) {
  return [
    { label: "Quotation Document", url: bid?.quotation_document || bid?.quotation_file },
    { label: "Quotation File", url: bid?.quotation_file },
    { label: "Supporting Documents", url: bid?.supporting_documents },
    { label: "Technical Document", url: bid?.technical_document },
  ].filter((item) => Boolean(item.url));
}

function getRankTone(rank: number) {
  if (rank === 1) return "bg-amber-100 text-amber-700 border-amber-200";
  if (rank === 2) return "bg-slate-100 text-slate-700 border-slate-200";
  if (rank === 3) return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function getQualificationStatus(bid: any) {
  if (bid?.status === "won") return "Winner Selected";
  if (bid?.status === "under_evaluation") return "Under Review";
  if (bid?.technical_compliance) return "Qualified";
  if (bid?.status === "lost") return bid?.rank === 2 ? "Runner-Up" : "Disqualified";
  return "Under Review";
}

function getQualificationTone(status: string) {
  if (status === "Winner Selected") return "bg-amber-100 text-amber-700";
  if (status === "Qualified") return "bg-emerald-100 text-emerald-700";
  if (status === "Runner-Up") return "bg-slate-100 text-slate-700";
  if (status === "Disqualified") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
}

function DetailBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function AdminBidEvaluationContent() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(searchParams.get("project"));
  const [expandedBidId, setExpandedBidId] = useState<string | null>(null);
  const [evalForm, setEvalForm] = useState({ technical_compliance: false, evaluation_remarks: "" });
  const [winnerConfirm, setWinnerConfirm] = useState<any>(null);
  const [reviewConfirm, setReviewConfirm] = useState<any>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isEvalSaving, setIsEvalSaving] = useState(false);
  const [bidDetail, setBidDetail] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    Promise.all([
      projectsAPI.getAll().then((r) => setProjects(Array.isArray(r.data) ? r.data : r.data.results || [])).catch(() => setProjects([])),
      bidsAPI.getAll().then((r) => setBids(Array.isArray(r.data) ? r.data : r.data.results || [])).catch(() => setBids([])),
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

  const summaryStats = useMemo(() => ({
    total: currentBids.length,
    underReview: currentBids.filter((b) => b.status === "under_evaluation").length,
    compliant: currentBids.filter((b) => Boolean(b.technical_compliance)).length,
    selected: currentBids.filter((b) => b.status === "won").length,
    suppliers: new Set(currentBids.map((b) => b.supplier_id || b.supplier?.id || b.company_name || b.id)).size,
  }), [currentBids]);

  const expandedBid = useMemo(() => currentBids.find((b) => b.id === expandedBidId) || null, [currentBids, expandedBidId]);

  async function handleMarkReview() {
    if (!reviewConfirm) return;
    setIsConfirmLoading(true);
    try { await bidsAPI.markReview(reviewConfirm.id); setToast({ message: "Marked under evaluation", type: "success" }); refreshBids(); } catch { setToast({ message: "Failed", type: "error" }); }
    finally { setIsConfirmLoading(false); setReviewConfirm(null); }
  }

  async function handleSaveRemarks() {
    if (!expandedBid) return;
    setIsEvalSaving(true);
    try { await bidsAPI.saveRemarks(expandedBid.id, { technical_compliance: evalForm.technical_compliance, evaluation_remarks: evalForm.evaluation_remarks }); setToast({ message: "Evaluation saved", type: "success" }); refreshBids(); } catch { setToast({ message: "Failed to save", type: "error" }); }
    finally { setIsEvalSaving(false); }
  }

  async function handleSelectWinner() {
    if (!winnerConfirm) return;
    setIsConfirmLoading(true);
    try { await bidsAPI.selectWinner(winnerConfirm.id); setToast({ message: "Winner selected!", type: "success" }); setWinnerConfirm(null); refreshBids(); } catch (e: any) { setToast({ message: e?.response?.data?.error || "Failed", type: "error" }); setWinnerConfirm(null); }
    finally { setIsConfirmLoading(false); }
  }

  function refreshBids() { bidsAPI.getAll().then((r) => setBids(Array.isArray(r.data) ? r.data : r.data.results || [])).catch(() => setBids([])); }

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
        <div className="rounded-2xl border border-slate-100 bg-white p-5 mb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-2xl font-semibold text-slate-900">{selectedProjectData.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>Budget: {formatPeso(selectedProjectData.budget)}</span>
                <span>&middot;</span>
                <span>Deadline: {selectedProjectData.deadline ? new Date(selectedProjectData.deadline).toLocaleDateString() : "\u2014"}</span>
                <span>&middot;</span>
                <span>{currentBids.length} bids</span>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{summaryStats.suppliers} suppliers competed</span>
              </div>
            </div>
            <StatusBadge status={selectedProjectData.status} />
          </div>
        </div>
      )}

      {currentBids.length === 0 ? <EmptyState title="No bids for this project" /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Bid Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Qualification Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Submission Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentBids.map((b, i) => {
                const isExpanded = expandedBidId === b.id;
                const isWinner = b.status === "won";
                const docs = getBidDocuments(b);
                const qualificationStatus = getQualificationStatus(b);

                return (
                  <Fragment key={b.id}>
                    <tr className="align-top hover:bg-slate-50/60">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <span className={`inline-flex min-w-10 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getRankTone(i + 1)}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">{getSupplierName(b)}</p>
                        <p className="text-xs text-slate-400">{getCompanyName(b)}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatPeso(b.bid_amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getQualificationTone(qualificationStatus)}`}>
                          {qualificationStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${b.status === "won" ? "bg-amber-100 text-amber-700" : b.status === "lost" ? "bg-red-100 text-red-700" : b.status === "under_evaluation" ? "bg-slate-100 text-slate-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {b.status === "won" ? "Winner Selected" : b.status === "lost" ? "Lost" : b.status === "under_evaluation" ? "Under Review" : "Submitted"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isWinner ? (
                          <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                            <Trophy className="h-3.5 w-3.5" /> Selected Winner
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            <button onClick={() => setBidDetail(b)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">View Info</button>
                            {b.status === "submitted" && <button onClick={() => setReviewConfirm(b)} className="rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">Review</button>}
                            <button onClick={() => {
                              setExpandedBidId(isExpanded ? null : b.id);
                              setEvalForm({ technical_compliance: Boolean(b.technical_compliance), evaluation_remarks: b.evaluation_remarks || "" });
                            }} className="rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50">
                              {isExpanded ? "Close" : "Evaluate"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {isExpanded ? (
                      <tr className="border-t border-slate-100 bg-slate-50/40">
                        <td colSpan={7} className="px-6 py-5">
                          <div className="grid gap-5 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-100 bg-white p-5">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bid Details</p>
                              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <DetailBadge label="Supplier" value={getSupplierName(b)} />
                                <DetailBadge label="Company" value={getCompanyName(b)} />
                                <DetailBadge label="Amount" value={formatPeso(b.bid_amount)} />
                                <DetailBadge label="Qualification Status" value={getQualificationStatus(b)} />
                                <DetailBadge label="Submission Status" value={b.status === "won" ? "Winner Selected" : b.status === "lost" ? "Lost" : b.status === "under_evaluation" ? "Under Review" : "Submitted"} />
                                <DetailBadge label="Rank" value={`#${i + 1}`} />
                              </div>

                              {b.proposal ? (
                                <div className="mt-4 rounded-xl border border-slate-100 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proposal</p>
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{b.proposal}</p>
                                </div>
                              ) : null}

                              {docs.length > 0 ? (
                                <div className="mt-4 rounded-xl border border-slate-100 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Uploaded Documents</p>
                                  <div className="mt-3 space-y-2">
                                    {docs.map((doc) => (
                                      <a key={doc.label} href={String(doc.url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                                        <span>{doc.label}</span>
                                        <span className="text-xs text-emerald-600">Open</span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white p-5">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Qualification Evaluation</p>
                              <div className="mt-4 flex items-center gap-3">
                                <span className="text-sm text-slate-700">Qualification Status</span>
                                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                                  <button
                                    type="button"
                                    onClick={() => setEvalForm((prev) => ({ ...prev, technical_compliance: true }))}
                                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${evalForm.technical_compliance ? "bg-emerald-500 text-white" : "text-slate-600 hover:bg-white"}`}
                                  >
                                    Qualified
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEvalForm((prev) => ({ ...prev, technical_compliance: false }))}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${!evalForm.technical_compliance ? "bg-red-500 text-white" : "text-slate-600 hover:bg-white"}`}
                                  >
                                    Disqualified
                                  </button>
                                </div>
                              </div>

                              <label className="mt-4 block">
                                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Evaluation Remarks</span>
                                <textarea
                                  value={evalForm.evaluation_remarks}
                                  onChange={(e) => setEvalForm((prev) => ({ ...prev, evaluation_remarks: e.target.value }))}
                                  rows={10}
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                                  placeholder="Enter evaluation notes..."
                                />
                              </label>

                              <div className="mt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setExpandedBidId(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
                                <LoadingButton isLoading={isEvalSaving} onClick={handleSaveRemarks} loadingText="Saving..." className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
                                  Save Evaluation
                                </LoadingButton>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={Boolean(bidDetail)} onClose={() => setBidDetail(null)} title="Bid Details" size="lg">
        {bidDetail && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Supplier", value: getSupplierName(bidDetail) },
                { label: "Company", value: getCompanyName(bidDetail) },
                { label: "Bid Amount", value: formatPeso(bidDetail.bid_amount) },
                { label: "Qualification Status", value: getQualificationStatus(bidDetail) },
                { label: "Submission Status", value: bidDetail.status === "won" ? "Winner Selected" : bidDetail.status === "lost" ? "Lost" : bidDetail.status === "under_evaluation" ? "Under Review" : "Submitted" },
                { label: "Rank", value: bidDetail.rank || "\u2014" }
              ].map(({ label, value }) => (
                <DetailBadge key={label} label={label} value={String(value)} />
              ))}
            </div>
            {bidDetail.proposal && <div className="rounded-xl border border-slate-100 p-3"><p className="text-xs font-semibold text-slate-500 mb-1">Proposal</p><p className="text-sm text-slate-700">{bidDetail.proposal}</p></div>}
            {getBidDocuments(bidDetail).length > 0 && (
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">Uploaded Documents</p>
                <div className="space-y-2">
                  {getBidDocuments(bidDetail).map((doc) => (
                    <a key={doc.label} href={String(doc.url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <span>{doc.label}</span>
                      <span className="text-xs text-emerald-600">Open</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {bidDetail.evaluation_remarks && <div className="rounded-xl border border-amber-100 bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-600 mb-1">Evaluation Remarks</p><p className="text-sm text-amber-800">{bidDetail.evaluation_remarks}</p></div>}
            <div className="flex flex-wrap gap-2 pt-2">
              {bidDetail.status === "submitted" && <button onClick={() => { setBidDetail(null); setReviewConfirm(bidDetail); }} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">Review Bid</button>}
              <button onClick={() => { setBidDetail(null); setExpandedBidId(bidDetail.id); setEvalForm({ technical_compliance: bidDetail.technical_compliance || false, evaluation_remarks: bidDetail.evaluation_remarks || "" }); }} className="rounded-xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50">Evaluate Bid</button>
              {bidDetail.technical_compliance && bidDetail.status !== "won" && bidDetail.status !== "lost" && <button onClick={() => { setBidDetail(null); setWinnerConfirm(bidDetail); }} className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-100"><Trophy className="h-4 w-4" />Select Winner</button>}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={Boolean(reviewConfirm)} onClose={() => setReviewConfirm(null)} onConfirm={handleMarkReview} title="Mark for Review" message={`Mark this bid from "${reviewConfirm?.supplier?.full_name || reviewConfirm?.company_name}" as under evaluation?`} confirmLabel="Mark for Review" isConfirmLoading={isConfirmLoading} />
      <ConfirmDialog isOpen={Boolean(winnerConfirm)} onClose={() => setWinnerConfirm(null)} onConfirm={handleSelectWinner} title="Select Winner" message={`Select "${winnerConfirm?.supplier?.full_name || winnerConfirm?.company_name}" as the winner with a bid of ${formatPeso(winnerConfirm?.bid_amount)}? This will mark all other bids as lost and finalize the award.`} confirmLabel="Select Winner" isConfirmLoading={isConfirmLoading} />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}

export default function AdminBidEvaluation() {
  return (
    <Suspense fallback={<SkeletonTable />}>
      <AdminBidEvaluationContent />
    </Suspense>
  );
}
