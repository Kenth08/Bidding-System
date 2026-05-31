"use client";
import { useState, useEffect } from "react";
import { useBids } from "@/hooks/useQueryHooks";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import Toast from "@/components/shared/Toast";
import { Bid } from "@/types/bid";
import SupplierBidProgress from "@/components/shared/SupplierBidProgress";
import BidActivityLogModal from "@/components/shared/BidActivityLogModal";
import Modal from "@/components/shared/Modal";
import { ClipboardList } from "lucide-react";

function getBidDocuments(bid: Bid) {
  return [
    { label: "Quotation / Price Proposal", url: bid?.quotation_document || bid?.quotation_file },
    { label: "Technical Proposal / Specifications", url: bid?.technical_proposal || bid?.technical_document },
    { label: "Supporting Documents", url: bid?.supporting_documents },
  ].filter((item) => Boolean(item.url));
}

export default function SupplierBids() {
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [logProjectId, setLogProjectId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);

  const getProjectTitle = (project: Bid["project"]) => {
    if (typeof project === "string") return project;
    return project?.title || project?.project_title || "—";
  };

  const getDisplayStatus = (bid: Bid) => {
    // Prefer showing 'Qualified' when technical compliance has been set
    if (bid.technical_compliance && bid.status !== "won" && bid.status !== "lost") return "Qualified";
    if (bid.status === "won") return "Won";
    if (bid.status === "lost") return "Lost";
    if (bid.status === "under_evaluation") return "Under Evaluation";
    return "Submitted";
  };

  const getEvaluationRemarks = (bid: Bid) => {
    const remarks = bid.evaluation_remarks?.trim();
    if (!remarks) return "No evaluation remarks yet.";
    return remarks;
  };

  const { data: bidsData, isLoading: loading, refetch } = useBids();
  const bids = (bidsData?.results || []) as Bid[];

  // subscribe to SSE updates; refetch when a bid for this supplier is updated
  useEffect(() => {
    if (typeof window === "undefined") return;
    const es = new EventSource("/api/updates/stream");
    const handleEvent = () => { refetch(); };
    es.addEventListener("bid_created", handleEvent);
    es.addEventListener("bid_updated", handleEvent);
    return () => es.close();
  }, [refetch]);

  // render toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-16 rounded-2xl bg-slate-100" /><div className="h-16 rounded-2xl bg-slate-100" /></div>;
  if (!bids.length) return <EmptyState title="No bids yet" subtitle="Submit a bid on an active project to get started." />;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/60">
          <tr>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Project</th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Offered Price</th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Rank</th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Evaluation Remarks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {bids.map((b) => (
                <tr key={b.id} onClick={() => setSelectedBid(b)} className="cursor-pointer transition hover:bg-slate-50/50">
              <td className="px-5 py-3.5 font-medium text-slate-900">
                <div className="space-y-1">
                  <p>{getProjectTitle(b.project)}</p>
                  <p className="text-xs font-normal text-slate-400">{getDisplayStatus(b)}</p>
                </div>
              </td>
              <td className="px-5 py-3.5 text-slate-600">₱{Number(b.bid_amount).toLocaleString()}</td>
              <td className="px-5 py-3.5"><StatusBadge status={getDisplayStatus(b)} /></td>
              <td className="px-5 py-3.5 text-slate-600">{b.rank ?? "—"}</td>
              <td className="px-5 py-3.5 text-slate-600">
                <p className="max-w-[28rem] whitespace-pre-wrap text-sm leading-6 text-slate-600">{getEvaluationRemarks(b)}</p>
              </td>
                </tr>
          ))}
        </tbody>
      </table>

      <Modal
        isOpen={Boolean(selectedBid)}
        onClose={() => setSelectedBid(null)}
        title={selectedBid ? getProjectTitle(selectedBid.project) : "Bid Details"}
        subtitle={selectedBid ? getDisplayStatus(selectedBid) : undefined}
        size="xl"
      >
        {selectedBid ? (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Offered Price</p>
                <p className="mt-1 text-base font-semibold text-slate-900">₱{Number(selectedBid.bid_amount).toLocaleString()}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
                <div className="mt-2"><StatusBadge status={getDisplayStatus(selectedBid)} /></div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Rank</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{selectedBid.rank ?? "—"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Result</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{getDisplayStatus(selectedBid)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Required Bid Documents</p>
              <div className="mt-3 space-y-2">
                {getBidDocuments(selectedBid).map((doc) => (
                  <a key={doc.label} href={String(doc.url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50">
                    <span>{doc.label}</span>
                    <span className="text-xs font-medium text-emerald-600">Open</span>
                  </a>
                ))}
                {!getBidDocuments(selectedBid).length ? <p className="text-sm text-slate-500">No bid documents uploaded.</p> : null}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Conflict of Interest</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedBid.no_conflict_of_interest ? "No Conflict of Interest" : "Conflict Declared"}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Supplier Declaration</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedBid.no_past_scm_issues ? "Confirmed" : "Not Confirmed"}</p>
              </div>
            </div>

            <SupplierBidProgress status={selectedBid.status} technical_compliance={selectedBid.technical_compliance} />

            <button onClick={() => { setLogProjectId(typeof selectedBid.project === "string" ? selectedBid.project : selectedBid.project?.id || selectedBid.project_id || null); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"><ClipboardList className="h-4 w-4" />My Bid Logs</button>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Evaluation Remarks</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{getEvaluationRemarks(selectedBid)}</p>
            </div>
          </div>
        ) : null}
      </Modal>
      {toast ? <Toast message={toast.message} type={toast.type} isVisible={Boolean(toast)} onClose={() => setToast(null)} /> : null}
      <BidActivityLogModal isOpen={Boolean(logProjectId)} onClose={() => setLogProjectId(null)} projectId={logProjectId} apiBase="supplier" />
    </div>
  );
}
