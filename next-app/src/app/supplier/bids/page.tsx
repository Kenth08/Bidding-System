"use client";
import { useState, useEffect } from "react";
import { bidsAPI } from "@/services/api";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import Toast from "@/components/shared/Toast";
import { Bid } from "@/types/bid";
import SupplierBidProgress from "@/components/shared/SupplierBidProgress";
import Modal from "@/components/shared/Modal";

function getBidDocuments(bid: Bid) {
  return [
    { label: "Quotation / Price Proposal", url: bid?.quotation_document || bid?.quotation_file },
    { label: "Technical Proposal / Specifications", url: bid?.technical_proposal || bid?.technical_document },
    { label: "Supporting Documents", url: bid?.supporting_documents },
  ].filter((item) => Boolean(item.url));
}

export default function SupplierBids() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
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

  useEffect(() => {
    bidsAPI.getAll().then((r) => setBids(r.data)).catch(() => {}).finally(() => setLoading(false));

    // subscribe to SSE updates; refresh when a bid for this supplier is created
    let userId: string | null = null;
    import("@/services/api").then(({ authAPI }) => {
      authAPI.me().then((res) => { userId = res.data?.id; }).catch(() => {});
    });
    if (typeof window !== "undefined") {
      const es = new EventSource("/api/updates/stream");
      const handleEvent = (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          if (!userId) {
            bidsAPI.getAll().then((r) => setBids(r.data)).catch(() => {});
            return;
          }

          if (String(payload.supplier_id) === String(userId)) {
            // capture previous state to compare changes for toast messages
            const prevBid = bids.find((b) => b.id === payload.id);

            bidsAPI.getAll().then((r) => {
              setBids(r.data);
              const updated = (r.data || []).find((x: any) => x.id === payload.id);
              if (selectedBid) {
                const sel = (r.data || []).find((x: any) => x.id === selectedBid.id);
                if (sel) setSelectedBid(sel as any);
              }

              try {
                if (prevBid && updated) {
                  // became qualified
                  if (!prevBid.technical_compliance && updated.technical_compliance) {
                    setToast({ message: `Your bid for ${getProjectTitle(updated.project)} is now Qualified.`, type: "success" });
                  }
                  // result released
                  if (prevBid.status !== updated.status) {
                    if (updated.status === "won") setToast({ message: `Congratulations — your bid for ${getProjectTitle(updated.project)} was selected!`, type: "success" });
                    else if (updated.status === "lost") setToast({ message: `Result released — your bid for ${getProjectTitle(updated.project)} was not selected.`, type: "warning" });
                  }
                }
              } catch (e) {
                /* ignore toast errors */
              }
            }).catch(() => {});
          }
        } catch (err) {}
      };

      es.addEventListener("bid_created", handleEvent);
      es.addEventListener("bid_updated", handleEvent);
      return () => es.close();
    }
  }, []);

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

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Evaluation Remarks</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{getEvaluationRemarks(selectedBid)}</p>
            </div>
          </div>
        ) : null}
      </Modal>
      {toast ? <Toast message={toast.message} type={toast.type} isVisible={Boolean(toast)} onClose={() => setToast(null)} /> : null}
    </div>
  );
}
