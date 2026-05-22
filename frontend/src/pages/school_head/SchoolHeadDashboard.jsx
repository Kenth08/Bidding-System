import { CheckCircle, Clock, FileText, XCircle } from "lucide-react";
import { useMemo } from "react";
import { getStatusLabel } from "../../lib/procurementStatus";
import StatusBadge from "../../components/shared/StatusBadge";
import StatCard from "../../components/shared/StatCard";

export default function SchoolHeadDashboard({ user, requests = [], setActivePage }) {
  const counts = useMemo(() => ({
    pending: requests.filter((request) => getStatusLabel(request.status) === "Pending Review").length,
    approved: requests.filter((request) => getStatusLabel(request.status) === "Approved").length,
    rejected: requests.filter((request) => getStatusLabel(request.status) === "Rejected").length,
    revision: requests.filter((request) => getStatusLabel(request.status) === "Revision Required").length,
  }), [requests]);

  const pendingRequests = requests.filter((request) => getStatusLabel(request.status) === "Pending Review" || getStatusLabel(request.status) === "Revision Required").slice(0, 5);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Dashboard</h2>
        <p className="mt-0.5 text-sm text-slate-500">Welcome back, {user?.full_name || "School Head"}. Review procurement requests below — review pending requests or open the approval records history.</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Next Action</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActivePage?.("requests")} className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100">
              Review requests
            </button>
            <button onClick={() => setActivePage?.("history")} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50">
              Open records
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Pending Review" value={counts.pending} icon={Clock} leftBorderColor="#3B82F6" iconColor="#3B82F6" />
        <StatCard title="Approved" value={counts.approved} icon={CheckCircle} leftBorderColor="#8B5CF6" iconColor="#8B5CF6" />
        <StatCard title="Rejected" value={counts.rejected} icon={XCircle} leftBorderColor="#10B981" iconColor="#10B981" />
        <StatCard title="Needs Revision" value={counts.revision} icon={FileText} leftBorderColor="#F59E0B" iconColor="#F59E0B" />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
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
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="mb-3 h-10 w-10 text-emerald-200" />
              <p className="text-sm font-semibold text-slate-500">All caught up!</p>
              <p className="mt-1 text-xs text-slate-400">No pending requests to review</p>
            </div>
          ) : (
            pendingRequests.map((request) => (
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

      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Approved Project Records</h3>
          <p className="mt-0.5 text-xs text-slate-400">View requests that have already been approved and published</p>
        </div>
        <button onClick={() => setActivePage?.("history")} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
          Open history →
        </button>
      </div>
    </div>
  )
}