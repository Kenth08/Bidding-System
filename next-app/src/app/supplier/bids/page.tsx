"use client";
import { useState, useEffect } from "react";
import { bidsAPI } from "@/services/api";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { Bid } from "@/types/bid";

export default function SupplierBids() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bidsAPI.getAll().then((r) => setBids(r.data)).catch(() => {}).finally(() => setLoading(false));
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
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {bids.map((b) => (
            <tr key={b.id} className="transition hover:bg-slate-50/50">
              <td className="px-5 py-3.5 font-medium text-slate-900">{b.project}</td>
              <td className="px-5 py-3.5 text-slate-600">₱{Number(b.bid_amount).toLocaleString()}</td>
              <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
              <td className="px-5 py-3.5 text-slate-600">{b.rank ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
