// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\supplier\SupplierDashboard.jsx
import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";

export default function SupplierDashboard({ supplierProjects, supplierBids, user, setActivePage }) {
  const stats = {
    available: supplierProjects.length,
    myBids: supplierBids.length,
    review: supplierBids.filter((bid) => bid.status === "Under Review").length,
    results: supplierBids.filter((bid) => ["Selected", "Rejected"].includes(bid.status)).length,
  };

  return (
    <div>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 mb-6">
        <h1 className="text-lg font-bold text-slate-900">Welcome back, {user?.full_name || user?.fullName || "Supplier"}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{user?.company_name || "Supplier Company"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Available Projects" value={stats.available} />
        <StatCard title="My Bids" value={stats.myBids} />
        <StatCard title="Under Review" value={stats.review} />
        <StatCard title="Results Released" value={stats.results} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Active Projects</h3></div>
          <div className="divide-y divide-slate-50">
            {supplierProjects.slice(0, 3).map((project) => (
              <div key={project.id} className="px-5 py-3 flex items-center justify-between"><div><p className="text-sm font-medium text-slate-800">{project.title}</p><p className="text-xs text-slate-500">Deadline: {project.deadline}</p></div><button onClick={() => setActivePage?.("available-projects")} className="text-xs font-semibold text-emerald-600">Bid Now</button></div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">My Recent Bids</h3></div>
          <div className="divide-y divide-slate-50">
            {supplierBids.slice(0, 3).map((bid) => (
              <div key={bid.id} className="px-5 py-3 flex items-center justify-between"><div><p className="text-sm font-medium text-slate-800">{bid.projectTitle || bid.projectName}</p><p className="text-xs text-slate-500">{bid.submittedAt}</p></div><StatusBadge status={bid.status} /></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
