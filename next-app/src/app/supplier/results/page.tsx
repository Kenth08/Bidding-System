"use client";
import { useState, useEffect } from "react";
import { blockchainAPI } from "@/services/api";
import EmptyState from "@/components/shared/EmptyState";
import { BlockchainRecord } from "@/types/blockchain";
import { Shield } from "lucide-react";

export default function SupplierResults() {
  const [records, setRecords] = useState<BlockchainRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blockchainAPI.getMyResults().then((r) => setRecords(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-16 rounded-2xl bg-slate-100" /><div className="h-16 rounded-2xl bg-slate-100" /></div>;
  if (!records.length) return <EmptyState icon={Shield} title="No award records yet" subtitle="Awarded bids will appear here once they are finalized." />;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/60">
          <tr>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Project</th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Bid Amount</th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Recorded At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {records.map((r) => (
            <tr key={r.id} className="transition hover:bg-slate-50/50">
              <td className="px-5 py-3.5 font-medium text-slate-900">{r.project}</td>
              <td className="px-5 py-3.5 text-slate-600">₱{Number(r.bid_amount).toLocaleString()}</td>
              <td className="px-5 py-3.5 text-slate-500">{new Date(r.recorded_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
