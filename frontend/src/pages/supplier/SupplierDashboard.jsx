import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";

export default function SupplierDashboard({ supplierProjects = [], supplierBids = [], user, setActivePage }) {
  const hasSubmittedBid = (projectId) => supplierBids.some((bid) => String(bid.projectId || bid.project_id || bid.project) === String(projectId));
  const isProjectOpen = (project) => String(project.status || "").toLowerCase() === "open for bidding";

  const stats = {
    available: supplierProjects.length,
    myBids: supplierBids.length,
    review: supplierBids.filter((bid) => String(bid.status || "").toLowerCase() === "under_evaluation").length,
    results: supplierBids.filter((bid) => ["won", "lost"].includes(String(bid.status || "").toLowerCase())).length,
  };

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Welcome back, {user?.full_name || user?.fullName || "Supplier"}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{user?.company_name || "Supplier Company"}</p>
          </div>
          <button onClick={() => setActivePage?.("available-projects")} className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100">
            View open opportunities
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Opportunities" value={stats.available} leftBorderColor="#3B82F6" iconColor="#3B82F6" subtitle="Active projects you can bid on" />
        <StatCard title="My Bids" value={stats.myBids} leftBorderColor="#8B5CF6" iconColor="#8B5CF6" subtitle="Submitted proposals" />
        <StatCard title="Under Review" value={stats.review} leftBorderColor="#10B981" iconColor="#10B981" subtitle="Currently being evaluated" />
        <StatCard title="Results" value={stats.results} leftBorderColor="#F59E0B" iconColor="#F59E0B" subtitle="Released outcomes" />
      </div>

      {/* Next Action card removed; guidance moved into the welcome area above */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Active Projects</h3></div>
          <div className="divide-y divide-slate-50">
            {supplierProjects.slice(0, 3).map((project) => (
              <div key={project.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">{project.title}</p>
                  <p className="text-xs text-slate-500">Deadline: {project.deadline}</p>
                </div>
                {hasSubmittedBid(project.id) ? (
                  <span className="inline-flex items-center rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Bid Submitted ✓</span>
                ) : isProjectOpen(project) ? (
                  <button onClick={() => setActivePage?.("available-projects")} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100">Bid Now</button>
                ) : (
                  <span className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">Closed</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">My Recent Bids</h3></div>
          <div className="divide-y divide-slate-50">
            {supplierBids.slice(0, 3).map((bid) => (
              <div key={bid.id} className="px-5 py-3 flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-slate-800">{bid.projectTitle || bid.projectName}</p><p className="text-xs text-slate-500">{bid.submittedAt}</p></div><StatusBadge status={bid.status} /></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}