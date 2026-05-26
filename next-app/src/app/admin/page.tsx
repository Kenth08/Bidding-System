"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dashboardAPI, projectsAPI } from "@/services/api";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";

function formatPeso(v: unknown) { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(v || 0)); }

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.getStats().then((r) => setStats(r.data)).catch(() => setStats(null)),
      projectsAPI.getAll().then((r) => setProjects(Array.isArray(r.data) ? r.data : r.data.results || [])).catch(() => setProjects([])),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />)}</div>;

  return (
    <div>
      <div className="mb-6"><h1 className="text-lg font-bold text-slate-900">Dashboard</h1></div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Projects" value={stats?.total_projects ?? 0} leftBorderColor="#3B82F6" iconColor="#3B82F6" />
        <StatCard title="Total Bids" value={stats?.total_bids ?? 0} leftBorderColor="#8B5CF6" iconColor="#8B5CF6" />
        <StatCard title="Active Bidding" value={stats?.active_bidding ?? 0} leftBorderColor="#10B981" iconColor="#10B981" />
        <StatCard title="Awarded Contracts" value={stats?.awarded_contracts ?? 0} leftBorderColor="#F59E0B" iconColor="#F59E0B" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Recent Projects</h3><p className="text-xs text-slate-400 mt-0.5">Last 5 projects</p></div>
          <table className="w-full">
            <thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Budget</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Deadline</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {projects.slice(0, 5).map((p) => (
                <tr key={p.id}><td className="px-6 py-3 text-sm text-slate-700">{p.title}</td><td className="px-6 py-3 text-sm text-slate-600">{formatPeso(p.budget)}</td><td className="px-6 py-3 text-sm text-slate-600">{p.deadline ? new Date(p.deadline).toLocaleDateString() : "\u2014"}</td><td className="px-6 py-3"><StatusBadge status={p.status} /></td></tr>
              ))}
              {projects.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">No projects yet</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Next Actions</h3>
          <div className="space-y-2">
            <button onClick={() => router.push("/admin/projects")} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50">Create or Manage Projects</button>
            <button onClick={() => router.push("/admin/suppliers")} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50">Review Suppliers</button>
            <button onClick={() => router.push("/admin/bid-evaluation")} className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50">Evaluate Bids</button>
          </div>
        </div>
      </div>
    </div>
  );
}
