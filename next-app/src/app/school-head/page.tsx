"use client";
import { useState, useEffect } from "react";
import { FileText, Clock, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { procurementAPI } from "@/services/api";
import StatCard from "@/components/shared/StatCard";
import { normalizeStatusCode, STATUS } from "@/lib/procurementStatus";

export default function SchoolHeadDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, revision: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    procurementAPI.getAll().then((res) => {
      const requests = res.data?.results || res.data || [];
      setStats({
        total: requests.length,
        pending: requests.filter((r: any) => normalizeStatusCode(r.status) === STATUS.PENDING_REVIEW).length,
        approved: requests.filter((r: any) => normalizeStatusCode(r.status) === STATUS.APPROVED).length,
        rejected: requests.filter((r: any) => normalizeStatusCode(r.status) === STATUS.REJECTED).length,
        revision: requests.filter((r: any) => normalizeStatusCode(r.status) === STATUS.REVISION_REQUIRED).length,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-400">Loading...</div>;

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard title="Total Requests" value={stats.total} icon={FileText} />
      <StatCard title="Pending" value={stats.pending} icon={Clock} leftBorderColor="#f59e0b" iconColor="#f59e0b" />
      <StatCard title="Approved" value={stats.approved} icon={CheckCircle} leftBorderColor="#10b981" iconColor="#10b981" />
      <StatCard title="Rejected" value={stats.rejected} icon={XCircle} leftBorderColor="#ef4444" iconColor="#ef4444" />
      <StatCard title="Revision Required" value={stats.revision} icon={RotateCcw} leftBorderColor="#f97316" iconColor="#f97316" />
    </div>
  );
}
