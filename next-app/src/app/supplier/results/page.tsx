"use client";
import { useState, useEffect } from "react";
import { bidsAPI } from "@/services/api";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { Bid } from "@/types/bid";
import { AlertCircle, Award, CheckCircle2, Shield, XCircle } from "lucide-react";

type PublicWinner = {
  project_id: string;
  project_title: string;
  awarded_at: string | null;
  winner: {
    supplier_name: string;
    bid_amount: number;
    submitted_at: string | null;
  };
};

export default function SupplierResults() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [winners, setWinners] = useState<PublicWinner[]>([]);
  const [loading, setLoading] = useState(true);

  const getResultLabel = (status: Bid["status"]) => {
    if (status === "won") return "Won";
    if (status === "lost") return "Lost";
    if (status === "under_evaluation") return "Under review";
    return "Submitted";
  };

  const getResultIcon = (status: Bid["status"]) => {
    if (status === "won") return CheckCircle2;
    if (status === "lost") return XCircle;
    return Shield;
  };

  const getProjectId = (project: Bid["project"]) => {
    if (typeof project === "string") return "";
    return project?.id || "";
  };

  const getProjectTitle = (project: Bid["project"]) => {
    if (typeof project === "string") return project;
    return project?.title || project?.project_title || "—";
  };

  const getWinnerForBid = (bid: Bid) => winners.find((winner) => winner.project_id === getProjectId(bid.project));

  const getOutcomeText = (bid: Bid) => {
    const winner = getWinnerForBid(bid);
    if (bid.status === "won") return "You won this project.";
    if (bid.status === "lost") {
      if (winner?.winner.supplier_name) return `You lost to ${winner.winner.supplier_name}.`;
      return "Your bid was not selected.";
    }
    if (bid.status === "under_evaluation") return "This bid is still under review.";
    return "This bid has been submitted.";
  };

  useEffect(() => {
    Promise.all([
      bidsAPI.getAll(),
      fetch("/api/public/results").then((response) => (response.ok ? response.json() : [])),
    ])
      .then(([bidsResponse, publicResults]) => {
        setBids(bidsResponse.data);
        setWinners(Array.isArray(publicResults) ? publicResults : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const finalizedCount = bids.filter((bid) => bid.status === "won" || bid.status === "lost").length;
  const wonCount = bids.filter((bid) => bid.status === "won").length;
  const lostCount = bids.filter((bid) => bid.status === "lost").length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
        </div>
        <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!bids.length) return <EmptyState icon={Shield} title="No bids yet" subtitle="Submit bids to see whether each one won or lost here." />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Total bids</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{bids.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Won</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-900">{wonCount}</p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700">Lost</p>
          <p className="mt-2 text-2xl font-semibold text-rose-900">{lostCount}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Supplier results</p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">Your bidding outcomes</h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
            <AlertCircle className="h-4 w-4" />
            Winner names only. Other participants are private.
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Project</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Your Bid</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Result</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Winner</th>
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {bids.map((bid) => {
              const ResultIcon = getResultIcon(bid.status);
              const winner = getWinnerForBid(bid);

              return (
                <tr key={bid.id} className="transition hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{getProjectTitle(bid.project)}</p>
                      <p className="text-xs text-slate-500">{getOutcomeText(bid)}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-700">₱{Number(bid.bid_amount).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <ResultIcon className="h-4 w-4 text-slate-400" />
                      <StatusBadge status={bid.status} />
                      <span className="text-xs text-slate-500">{getResultLabel(bid.status)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {winner ? (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Award className="h-4 w-4 text-amber-500" />
                        <div>
                          <p className="font-medium text-slate-900">{winner.winner.supplier_name}</p>
                          <p className="text-xs text-slate-500">₱{Number(winner.winner.bid_amount).toLocaleString()}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Not available yet</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-500">{new Date(bid.updated_at || bid.submitted_at).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
