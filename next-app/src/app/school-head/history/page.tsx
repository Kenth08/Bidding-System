"use client";
import { useState, useEffect } from "react";
import { projectsAPI } from "@/services/api";
import StatusBadge from "@/components/shared/StatusBadge";

export default function SchoolHeadHistory() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsAPI.getApprovedRecords().then((res) => setRecords(res.data?.results || res.data || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-400">Loading...</div>;

  if (!records.length) return <div className="flex items-center justify-center py-20 text-slate-400">No approved projects found for this school head.</div>;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/60">
          <tr>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Title</th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Budget</th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Reviewed By</th>
            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Deadline</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {records.map((r) => (
            <tr key={r.id} className="transition-colors hover:bg-slate-50/50">
              <td className="px-5 py-3 font-medium text-slate-800">{r.title}</td>
              <td className="px-5 py-3 text-slate-600">₱{Number(r.budget).toLocaleString()}</td>
              <td className="px-5 py-3"><StatusBadge status={r.procurement_request?.status || r.status} /></td>
              <td className="px-5 py-3 text-slate-500">{r.procurement_request?.reviewed_by?.full_name || "School Head"}</td>
              <td className="px-5 py-3 text-slate-500">{r.deadline ? new Date(r.deadline).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
