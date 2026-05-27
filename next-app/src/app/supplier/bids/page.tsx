"use client";
import { useState, useEffect } from "react";
import { bidsAPI } from "@/services/api";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Bid } from "@/types/bid";
import SupplierBidProgress from "@/components/shared/SupplierBidProgress";
import Modal from "@/components/shared/Modal";

export default function SupplierBids() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);

  const getProjectTitle = (project: Bid["project"]) => {
    if (typeof project === "string") return project;
    return project?.title || project?.project_title || "—";
  };

  const getBidStatusNote = (bid: Bid) => {
    if (bid.status === "won") return "Awarded";
    if (bid.status === "lost") return "Not selected";
    if (bid.status === "under_evaluation") return "Under evaluation";
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
      es.addEventListener("bid_created", (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          if (!userId) {
            // fallback: refresh — typically the event is recent and client likely the submitter
            bidsAPI.getAll().then((r) => setBids(r.data)).catch(() => {});
            return;
          }
          if (String(payload.supplier_id) === String(userId)) {
            bidsAPI.getAll().then((r) => setBids(r.data)).catch(() => {});
          }
        } catch (err) {}
      });
      return () => es.close();
    }
  }, []);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-16 rounded-2xl bg-slate-100" /><div className="h-16 rounded-2xl bg-slate-100" /></div>;
  if (!bids.length) return <EmptyState title="No bids yet" subtitle="Submit a bid on an active project to get started." />;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/60">
          <tr>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Project</th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Amount</th>
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
                  <p className="text-xs font-normal text-slate-400">{getBidStatusNote(b)}</p>
                </div>
              </td>
              <td className="px-5 py-3.5 text-slate-600">₱{Number(b.bid_amount).toLocaleString()}</td>
              <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
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
        subtitle={selectedBid ? getBidStatusNote(selectedBid) : undefined}
        size="xl"
      >
        {selectedBid ? (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Amount</p>
                <p className="mt-1 text-base font-semibold text-slate-900">₱{Number(selectedBid.bid_amount).toLocaleString()}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
                <div className="mt-2"><StatusBadge status={selectedBid.status} /></div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Rank</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{selectedBid.rank ?? "—"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Result</p>
                <p className="mt-1 text-base font-semibold text-slate-900">{getBidStatusNote(selectedBid)}</p>
              </div>
            </div>

            <SupplierBidProgress status={selectedBid.status} />

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Evaluation Remarks</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{getEvaluationRemarks(selectedBid)}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
