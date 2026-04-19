// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\admin\AdminDashboard.jsx
import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

export default function AdminDashboard({ projects, bids, blockchainRecords, setActivePage }) {
  const stats = {
    projects: projects.length,
    bids: bids.length,
    active: projects.filter((project) => project.status === "Active").length,
    recorded: blockchainRecords.length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-lg font-bold text-slate-900">Dashboard</h1><p className="text-sm text-slate-500 mt-0.5">Procurement activity overview</p></div></div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Projects" value={stats.projects} />
        <StatCard title="Total Bids" value={stats.bids} />
        <StatCard title="Active Bidding" value={stats.active} />
        <StatCard title="Blockchain Records" value={stats.recorded} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Recent Projects</h3><p className="text-xs text-slate-400 mt-0.5">Last 5 projects</p></div>
          <table className="w-full"><thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Budget</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th></tr></thead><tbody className="divide-y divide-slate-50">{projects.slice(0, 5).map((project) => (<tr key={project.id}><td className="px-6 py-3 text-sm text-slate-700">{project.title}</td><td className="px-6 py-3 text-sm text-slate-600">{formatPeso(project.budget)}</td><td className="px-6 py-3"><StatusBadge status={project.status} /></td></tr>))}</tbody></table>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-800">Quick Actions</h3>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">Jump to common admin tasks</p>
          <div className="space-y-2">
            <button onClick={() => setActivePage("projects")} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Create or Manage Projects</button>
            <button onClick={() => setActivePage("suppliers")} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Review Suppliers</button>
            <button onClick={() => setActivePage("bids")} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Evaluate Bids</button>
            <button onClick={() => setActivePage("records")} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">Open Blockchain Records</button>
          </div>
        </div>
      </div>
    </div>
  );
}
