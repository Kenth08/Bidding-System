// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\school_head\SchoolHeadDashboard.jsx
import { CheckCircle, Clock, FileText, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getStatusLabel } from "../../lib/procurementStatus";
import { procurementAPI } from "../../services/api";
import StatusBadge from "../../components/shared/StatusBadge";

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      <div className="mb-4 flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function SchoolHeadDashboard({ user, requests, setActivePage, refreshToken = 0 }) {
  const [localRequests, setLocalRequests] = useState(Array.isArray(requests) ? requests : []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalRequests(Array.isArray(requests) ? requests : []);
  }, [requests]);

  useEffect(() => {
    async function loadRequests() {
      setLoading(true);
      try {
        const response = await procurementAPI.getAll();
        const items = response.data.results || response.data || [];
        setLocalRequests(items);
      } catch (error) {
        console.error("Failed to load procurement requests", error);
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, [refreshToken]);

  const counts = useMemo(() => ({
    pending: localRequests.filter((request) => getStatusLabel(request.status) === "Pending Review").length,
    approved: localRequests.filter((request) => getStatusLabel(request.status) === "Approved").length,
    rejected: localRequests.filter((request) => getStatusLabel(request.status) === "Rejected").length,
    revision: localRequests.filter((request) => getStatusLabel(request.status) === "Revision Required").length,
  }), [localRequests]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Dashboard</h2>
        <p className="mt-0.5 text-sm text-slate-500">Welcome back, {user?.full_name || "School Head"}. Review procurement requests below.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending Review" value={counts.pending} icon={Clock} />
        <StatCard label="Approved" value={counts.approved} icon={CheckCircle} />
        <StatCard label="Rejected" value={counts.rejected} icon={XCircle} />
        <StatCard label="Needs Revision" value={counts.revision} icon={FileText} />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Pending Requests</h3>
            <p className="mt-0.5 text-xs text-slate-400">Requests waiting for your review</p>
          </div>
          <button onClick={() => setActivePage?.("requests")} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
            View all →
          </button>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="px-6 py-8 text-center text-sm text-slate-500">Loading request counts...</div>
          ) : localRequests.filter((request) => getStatusLabel(request.status) === "Pending Review").slice(0, 5).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="mb-3 h-10 w-10 text-emerald-200" />
              <p className="text-sm font-semibold text-slate-500">All caught up!</p>
              <p className="mt-1 text-xs text-slate-400">No pending requests to review</p>
            </div>
          ) : (
            localRequests.filter((request) => getStatusLabel(request.status) === "Pending Review").slice(0, 5).map((request) => (
              <div key={request.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{request.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">₱{Number(request.budget || 0).toLocaleString()} · {request.procurement_type}</p>
                </div>
                <StatusBadge status={request.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}