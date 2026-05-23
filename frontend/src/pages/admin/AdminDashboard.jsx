import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";
import { normalizeProject } from "../../lib/procurementStatus";
import { useData } from "../../context/DataContext";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

function normalizeDashboardStats(source) {
  if (!source || typeof source !== "object") return null;

  return {
    total_projects: source.total_projects ?? source.totalProjects ?? null,
    total_bids: source.total_bids ?? source.totalBids ?? null,
    active_bidding: source.active_bidding ?? source.activeBidding ?? null,
    awarded_contracts: source.awarded_contracts ?? source.awardedContracts ?? null,
    blockchain_records: source.blockchain_records ?? source.blockchainRecords ?? null,
  };
}

export default function AdminDashboard({ setActivePage, stats, projects = [], bids = [], blockchainRecords = [] }) {
  const { cache } = useData();

  const projectItems = projects.length ? projects : cache.projects || [];
  const bidItems = bids.length ? bids : cache.bids || [];
  const blockchainItems = blockchainRecords.length ? blockchainRecords : cache.blockchainRecords || [];
  const normalizedProjects = projectItems.map(normalizeProject);
  const counts = normalizeDashboardStats(stats || cache.stats) || {
    total_projects: normalizedProjects.length,
    total_bids: bidItems.length,
    active_bidding: normalizedProjects.filter((project) => ["active", "open for bidding"].includes(String(project.status || "").toLowerCase()) || project.status === 3).length,
    awarded_contracts: normalizedProjects.filter((project) => String(project.status || "").toLowerCase() === "awarded" || project.status === 5).length,
    blockchain_records: blockchainItems.length,
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Projects" value={counts.total_projects ?? 0} leftBorderColor="#3B82F6" iconColor="#3B82F6" />
        <StatCard title="Total Bids" value={counts.total_bids ?? 0} leftBorderColor="#8B5CF6" iconColor="#8B5CF6" />
        <StatCard title="Active Bidding" value={counts.active_bidding ?? 0} leftBorderColor="#10B981" iconColor="#10B981" />
        <StatCard title="Awarded Contracts" value={counts.awarded_contracts ?? 0} leftBorderColor="#F59E0B" iconColor="#F59E0B" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Recent Projects</h3><p className="text-xs text-slate-400 mt-0.5">Last 5 projects</p></div>
          <table className="w-full"><thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Budget</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Deadline</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th></tr></thead><tbody className="divide-y divide-slate-50">{normalizedProjects.slice(0, 5).map((project) => (<tr key={project.id}><td className="px-6 py-3 text-sm text-slate-700">{project.title}</td><td className="px-6 py-3 text-sm text-slate-600">{formatPeso(project.budget)}</td><td className="px-6 py-3 text-sm text-slate-600">{project.deadline}</td><td className="px-6 py-3"><StatusBadge status={project.status} /></td></tr>))}</tbody></table>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <h3 className="text-sm font-semibold text-slate-800">Next Actions</h3>
          <div className="space-y-2">
            <button onClick={() => setActivePage("projects")} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50">Create or Manage Projects</button>
            <button onClick={() => setActivePage("suppliers")} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50">Review Suppliers</button>
            <button onClick={() => setActivePage("bids")} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50">Evaluate Bids</button>
          </div>
        </div>
      </div>
    </div>
  )
}