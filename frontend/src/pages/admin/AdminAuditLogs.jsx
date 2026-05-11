import { Activity, Filter } from "lucide-react";
import { useContext, useMemo, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import SearchBar from "../../components/shared/SearchBar";
import { ProcurementContext } from "../../lib/ProcurementContext";

const ACTION_TYPES = [
  "LOGIN",
  "CREATE",
  "UPDATE",
  "DELETE",
  "APPROVE",
  "REJECT",
  "SUBMIT_BID",
  "SELECT_WINNER",
  "RECORD_BLOCKCHAIN",
];

export default function AdminAuditLogs() {
  const procurement = useContext(ProcurementContext);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("All");

  const logs = useMemo(() => (procurement?.auditLogs || []).map((item) => ({
    id: item.id,
    action: item.action,
    user: item.user || "Unknown",
    role: item.role || "",
    timestamp: item.timestamp,
    description: item.action,
    actionType: String(item.action || "").toLowerCase().replace(/\s+/g, "_"),
  })), [procurement?.auditLogs]);

  const filtered = useMemo(() => {
    return logs
      .filter((log) => {
        const matchesSearch = search === "" || 
          log.description.toLowerCase().includes(search.toLowerCase()) ||
          log.user.toLowerCase().includes(search.toLowerCase()) ||
          log.action.toLowerCase().includes(search.toLowerCase());
        
        const matchesFilter = filterAction === "All" || log.action === filterAction;
        
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [logs, search, filterAction]);

  const getActionBadgeColor = (actionType) => {
    const colors = {
      login: "bg-slate-100 text-slate-700",
      create: "bg-blue-100 text-blue-700",
      update: "bg-yellow-100 text-yellow-700",
      delete: "bg-red-100 text-red-700",
      approve: "bg-emerald-100 text-emerald-700",
      reject: "bg-red-100 text-red-700",
      submit_bid: "bg-purple-100 text-purple-700",
      select_winner: "bg-orange-100 text-orange-700",
      record_blockchain: "bg-emerald-100 text-emerald-700",
    };
    return colors[actionType] || "bg-slate-100 text-slate-700";
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track all system activities and changes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Total Actions</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{logs.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Today</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {logs.filter((l) => {
              const today = new Date().toDateString();
              return new Date(l.timestamp).toDateString() === today;
            }).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">This Week</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {logs.filter((l) => {
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              return new Date(l.timestamp) > weekAgo;
            }).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Users</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {new Set(logs.map((l) => l.user)).size}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by user, action, or description"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="All">All Actions</option>
                {ACTION_TYPES.map((action) => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="px-6 py-12">
              <EmptyState
                icon={Activity}
                title="No logs found"
                subtitle="Try adjusting your search or filter"
              />
            </div>
          ) : (
            filtered.map((log) => (
              <div key={log.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getActionBadgeColor(log.actionType)}`}>
                    {log.action}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{log.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-xs text-slate-500">
                      <span>By <span className="font-semibold text-slate-600">{log.user}{log.role ? ` (${log.role})` : ""}</span></span>
                      <span>{formatTimestamp(log.timestamp)}</span>
                      <span className="hidden sm:inline text-slate-300">•</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
