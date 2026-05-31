"use client";
import { Fragment, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle, ClipboardList, FolderOpen, FileText, ShieldCheck, Signature, Trophy, XCircle } from "lucide-react";
import { bidsAPI, projectsAPI } from "@/services/api";
import { useProjects, useBids } from "@/hooks/useQueryHooks";
import EmptyState from "@/components/shared/EmptyState";
import BiddingLifecycleProgress from "@/components/shared/BiddingLifecycleProgress";
import BidActivityLogModal from "@/components/shared/BidActivityLogModal";
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
    { label: "Quotation / Price Proposal", url: bid?.quotation_document || bid?.quotation_file },
    { label: "Technical Proposal / Specifications", url: bid?.technical_proposal || bid?.technical_document },
    { label: "Supporting Documents", url: bid?.supporting_documents },
  ].filter((item) => Boolean(item.url));
}

function getConflictLabel(bid: any) {
  if (bid?.no_conflict_of_interest === true) return "No Conflict";
  if (bid?.no_conflict_of_interest === false) return "Conflict Declared";
  return "Not Declared";
}

function getSupplierDeclarationLabel(bid: any) {
  if (bid?.no_past_scm_issues === true) return "Confirmed";
  if (bid?.no_past_scm_issues === false) return "Not Confirmed";
  return "Pending";
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

type ProcurementCategory = "all" | "goods" | "services" | "infrastructure" | "more";

function normalizeText(v: unknown) {
  return String(v || "").trim().toLowerCase();
}

function getProcurementCategory(value: unknown): Exclude<ProcurementCategory, "all"> {
  const t = normalizeText(value);
  if (t === "goods") return "goods";
  if (t === "services") return "services";
  if (t === "infrastructure") return "infrastructure";
  return "more";
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
  const [selectedProject, setSelectedProject] = useState<string | null>(searchParams.get("project"));
  const [expandedBidId, setExpandedBidId] = useState<string | null>(null);
  const [evalForm, setEvalForm] = useState({ technical_compliance: false, evaluation_remarks: "" });
  const [winnerConfirm, setWinnerConfirm] = useState<any>(null);
  const [reviewConfirm, setReviewConfirm] = useState<any>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isEvalSaving, setIsEvalSaving] = useState(false);
  const [bidDetail, setBidDetail] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProcurementCategory>("all");
  const [showLogs, setShowLogs] = useState(false);
  const [closeBiddingConfirm, setCloseBiddingConfirm] = useState(false);
  const [isClosingBidding, setIsClosingBidding] = useState(false);

  const { data: projectsData, isLoading: projectsLoading } = useProjects({ page_size: 100 });
  const { data: bidsData, isLoading: bidsLoading, refetch: refreshBids } = useBids({ page_size: 100 });
  const projects = projectsData?.results || [];
  const bids = bidsData?.results || [];
  const loading = projectsLoading || bidsLoading;

  // Subscribe to SSE for live updates — just refetch via React Query
  useEffect(() => {
    if (typeof window === "undefined") return;
    const es = new EventSource("/api/updates/stream");
    const onUpdate = () => { refreshBids(); };
    es.addEventListener("bid_created", onUpdate);
    es.addEventListener("bid_updated", onUpdate);
    es.addEventListener("project_published", onUpdate);
    return () => es.close();
  }, [refreshBids]);

  // Show all published projects (active/closed/awarded) even if there are 0 bids.
  const projectsList = useMemo(() => {
    const bidsByProject: Record<string, any[]> = {};
    bids.forEach((b) => { const pid = b.project_id || b.project?.id; if (pid) { if (!bidsByProject[pid]) bidsByProject[pid] = []; bidsByProject[pid].push(b); } });
    return projects
      .filter((p) => ["active", "closed", "awarded"].includes(p.status))
      .map((p) => {
        const procurementType = p.procurement_type || p.procurement_request?.procurement_type || "More";
        const procurementCategory = getProcurementCategory(procurementType);
        return {
          ...p,
          procurementType,
          procurementCategory,
          bidCount: bidsByProject[p.id]?.length || 0,
          hasUnderEvaluation: (bidsByProject[p.id] || []).some((b) => b.status === "under_evaluation"),
          hasWinner: (bidsByProject[p.id] || []).some((b) => b.status === "won"),
        };
      });
  }, [projects, bids]);

  const filteredProjectsList = useMemo(() => {
    if (selectedCategory === "all") return projectsList;
    return projectsList.filter((p) => p.procurementCategory === selectedCategory);
  }, [projectsList, selectedCategory]);

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
    try {
      await bidsAPI.saveRemarks(expandedBid.id, { technical_compliance: evalForm.technical_compliance, evaluation_remarks: evalForm.evaluation_remarks });
      setToast({ message: "Evaluation saved", type: "success" });
      setExpandedBidId(null);
      refreshBids();
    } catch {
      setToast({ message: "Failed to save", type: "error" });
    }
    finally { setIsEvalSaving(false); }
  }

  async function handleSelectWinner() {
    if (!winnerConfirm) return;
    setIsConfirmLoading(true);
    try { await bidsAPI.selectWinner(winnerConfirm.id); setToast({ message: "Winner selected!", type: "success" }); setWinnerConfirm(null); refreshBids(); } catch (e: any) { setToast({ message: e?.response?.data?.error || "Failed", type: "error" }); setWinnerConfirm(null); }
    finally { setIsConfirmLoading(false); }
  }

  async function handleCloseBidding() {
    if (!selectedProject) return;
    setIsClosingBidding(true);
    try {
      await projectsAPI.closeBidding(selectedProject);
      setToast({ message: "Bidding has been closed. You can now select a winner.", type: "success" });
      refreshBids();
    } catch (e: any) {
      setToast({ message: e?.response?.data?.error || "Failed to close bidding", type: "error" });
    } finally { setIsClosingBidding(false); setCloseBiddingConfirm(false); }
  }

  if (loading) return <SkeletonTable />;

  if (!selectedProject) {
    return (
      <div>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Select a Project to Evaluate</h2>
          <p className="mt-1 text-sm text-slate-500">Click a project below to review and evaluate submitted bids.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {([
              { key: "all", label: "All" },
              { key: "goods", label: "Goods" },
              { key: "services", label: "Services" },
              { key: "infrastructure", label: "Infrastructure" },
              { key: "more", label: "More" },
            ] as Array<{ key: ProcurementCategory; label: string }>).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedCategory(opt.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${selectedCategory === opt.key ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {filteredProjectsList.length === 0 ? (
          <EmptyState
            title={projectsList.length === 0 ? "No projects available for evaluation" : "No projects for this category"}
            subtitle={projectsList.length === 0 ? "Published projects will appear here; bids will update automatically." : "Try another category filter or publish more projects."}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjectsList.map((p) => (
              <button key={p.id} onClick={() => setSelectedProject(p.id)} className="group flex min-h-[190px] flex-col justify-between rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <p className="text-base font-semibold text-slate-900">{p.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatPeso(p.budget)} budget</p>
                    <p className="mt-1 text-xs font-medium text-emerald-700">{p.procurementType}</p>
                    <p className="mt-3 text-xs leading-5 text-slate-400">Click to open the project, review submitted bids, and mark the winning supplier.</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">{p.bidCount} bid{p.bidCount !== 1 ? "s" : ""}</span>
                  <StatusBadge status={p.status} className={p.status === "awarded" ? "text-amber-700" : ""} />
                </div>
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
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] mb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-2xl font-semibold text-slate-900">{selectedProjectData.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>Approved Budget: {formatPeso(selectedProjectData.budget)}</span>
                <span>&middot;</span>
                <span>Deadline: {selectedProjectData.deadline ? new Date(selectedProjectData.deadline).toLocaleDateString() : "\u2014"}</span>
                <span>&middot;</span>
                <span>{currentBids.length} bids</span>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{summaryStats.suppliers} suppliers competed</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowLogs(true)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"><ClipboardList className="h-3.5 w-3.5" />View Logs</button>
              {selectedProjectData.status === "active" && currentBids.length > 0 && !currentBids.some((b: any) => b.status === "won") && (
                <button onClick={() => setCloseBiddingConfirm(true)} className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"><ShieldCheck className="h-3.5 w-3.5" />Close Bidding &amp; Start Evaluation</button>
              )}
              <StatusBadge status={selectedProjectData.status} />
            </div>
          </div>
          <div className="mt-5">
            <BiddingLifecycleProgress
              projectStatus={selectedProjectData.status}
              procurementStatus={selectedProjectData.procurement_request?.status}
              bidCount={currentBids.length}
              hasUnderEvaluation={currentBids.some((b) => b.status === "under_evaluation")}
              hasWinner={currentBids.some((b) => b.status === "won")}
            />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <DetailBadge label="Lowest Offered Price" value={currentBids.length ? formatPeso(currentBids[0]?.bid_amount) : "—"} />
            <DetailBadge label="Qualified Bids" value={String(summaryStats.compliant)} />
            <DetailBadge label="Under Review" value={String(summaryStats.underReview)} />
            <DetailBadge label="Winner Selected" value={String(summaryStats.selected)} />
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
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Offered Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Bid Compliance</th>
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
                            {b.technical_compliance ? (
                              <span className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-600">Qualified</span>
                            ) : (
                              <button onClick={() => {
                                setExpandedBidId(isExpanded ? null : b.id);
                                setEvalForm({ technical_compliance: Boolean(b.technical_compliance), evaluation_remarks: b.evaluation_remarks || "" });
                              }} className="rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50">
                                {isExpanded ? "Close" : "Evaluate"}
                              </button>
                            )}
                            {b.technical_compliance && b.status !== "won" && b.status !== "lost" && !currentBids.some((cb: any) => cb.status === "won") && (
                              <button onClick={() => setWinnerConfirm(b)} className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-100">Select Winner</button>
                            )}
                            {b.technical_compliance && b.status !== "won" && b.status !== "lost" && currentBids.some((cb: any) => cb.status === "won") && (
                              <span className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-400">Winner already selected</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>

                    {isExpanded ? (
                      <tr className="border-t border-slate-100 bg-slate-50/40">
                        <td colSpan={7} className="px-6 py-5">
                          <div className="grid gap-5 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-100 bg-white p-5">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bid Summary</p>
                              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <DetailBadge label="Supplier" value={getSupplierName(b)} />
                                <DetailBadge label="Company" value={getCompanyName(b)} />
                                <DetailBadge label="Offered Price" value={formatPeso(b.bid_amount)} />
                                <DetailBadge label="Conflict Declaration" value={getConflictLabel(b)} />
                                <DetailBadge label="Supplier Declaration" value={getSupplierDeclarationLabel(b)} />
                                <DetailBadge label="Bid Compliance" value={getQualificationStatus(b)} />
                                <DetailBadge label="Submission Status" value={b.status === "won" ? "Winner Selected" : b.status === "lost" ? "Lost" : b.status === "under_evaluation" ? "Under Review" : "Submitted"} />
                                <DetailBadge label="Rank" value={`#${i + 1}`} />
                              </div>

                              {b.proposal ? (
                                <div className="mt-4 rounded-xl border border-slate-100 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Additional Remarks</p>
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{b.proposal}</p>
                                </div>
                              ) : null}

                              {docs.length > 0 ? (
                                <div className="mt-4 rounded-xl border border-slate-100 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Required Bid Documents</p>
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

                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <DetailBadge label="Signature Name" value={b.signature_name || "—"} />
                                <DetailBadge label="Signature State" value={b.digital_signature ? "Saved" : "Not Uploaded"} />
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white p-5">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Qualification Evaluation</p>
                              <div className="mt-4 flex items-center gap-3">
                                <span className="text-sm text-slate-700">Qualification Status</span>
                                <div className="inline-flex items-center rounded-xl border border-slate-200 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => setEvalForm((prev) => ({ ...prev, technical_compliance: true }))}
                                    className={`px-3 py-1.5 text-sm font-semibold transition-colors ${evalForm.technical_compliance ? "bg-emerald-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                                  >
                                    Qualified
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setEvalForm((prev) => ({ ...prev, technical_compliance: false }))}
                                    className={`px-3 py-1.5 text-sm font-semibold transition-colors ${!evalForm.technical_compliance ? "bg-red-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
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
                { label: "Offered Price", value: formatPeso(bidDetail.bid_amount) },
                { label: "Bid Compliance", value: getQualificationStatus(bidDetail) },
                { label: "Conflict Declaration", value: getConflictLabel(bidDetail) },
                { label: "Supplier Declaration", value: getSupplierDeclarationLabel(bidDetail) },
                { label: "Submission Status", value: bidDetail.status === "won" ? "Winner Selected" : bidDetail.status === "lost" ? "Lost" : bidDetail.status === "under_evaluation" ? "Under Review" : "Submitted" },
                { label: "Rank", value: bidDetail.rank || "\u2014" }
              ].map(({ label, value }) => (
                <DetailBadge key={label} label={label} value={String(value)} />
              ))}
            </div>
            {bidDetail.proposal && <div className="rounded-xl border border-slate-100 p-3"><p className="text-xs font-semibold text-slate-500 mb-1">Additional Remarks</p><p className="text-sm text-slate-700">{bidDetail.proposal}</p></div>}
            {getBidDocuments(bidDetail).length > 0 && (
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">Required Bid Documents</p>
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
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-700 mb-1">Supplier Signature</p>
              <p className="text-sm text-emerald-800">{bidDetail.signature_name || "No signatory name provided"}</p>
              {bidDetail.digital_signature ? <p className="text-xs text-emerald-700 mt-1">Digital signature image saved.</p> : null}
            </div>
            {bidDetail.evaluation_remarks && <div className="rounded-xl border border-amber-100 bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-600 mb-1">Evaluation Remarks</p><p className="text-sm text-amber-800">{bidDetail.evaluation_remarks}</p></div>}
            <div className="flex flex-wrap gap-2 pt-2">
              {bidDetail.status === "submitted" && <button onClick={() => { setBidDetail(null); setReviewConfirm(bidDetail); }} className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">Review Bid</button>}
              {!bidDetail.technical_compliance ? (
                <button onClick={() => { setBidDetail(null); setExpandedBidId(bidDetail.id); setEvalForm({ technical_compliance: bidDetail.technical_compliance || false, evaluation_remarks: bidDetail.evaluation_remarks || "" }); }} className="rounded-xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50">Evaluate Bid</button>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600">Qualified</span>
              )}
              {bidDetail.technical_compliance && bidDetail.status !== "won" && bidDetail.status !== "lost" && (
                <button onClick={() => { setBidDetail(null); setWinnerConfirm(bidDetail); }} className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-100"><Trophy className="h-4 w-4" />Select Winner</button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={Boolean(reviewConfirm)} onClose={() => setReviewConfirm(null)} onConfirm={handleMarkReview} title="Mark for Review" message={`Mark this bid from "${reviewConfirm?.supplier?.full_name || reviewConfirm?.company_name}" as under evaluation?`} confirmLabel="Mark for Review" isConfirmLoading={isConfirmLoading} />
      <ConfirmDialog isOpen={Boolean(winnerConfirm)} onClose={() => setWinnerConfirm(null)} onConfirm={handleSelectWinner} title="Select Winning Supplier?" message={`Are you sure you want to select "${winnerConfirm?.supplier?.full_name || winnerConfirm?.company_name}" as the winner for this project? This action will mark the bid as the winning bid.`} confirmLabel="Confirm Winner" isConfirmLoading={isConfirmLoading} />
      <ConfirmDialog isOpen={closeBiddingConfirm} onClose={() => setCloseBiddingConfirm(false)} onConfirm={handleCloseBidding} title="Close Bidding?" message="This will stop suppliers from submitting new bids and move the project to bid evaluation." confirmLabel="Close Bidding" isConfirmLoading={isClosingBidding} />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
      <BidActivityLogModal isOpen={showLogs} onClose={() => setShowLogs(false)} projectId={selectedProject} apiBase="admin" />
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
