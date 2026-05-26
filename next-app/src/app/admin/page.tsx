"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, FileText, FolderOpen, Trophy } from "lucide-react";
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
        <StatCard title="Total Projects" value={stats?.total_projects ?? 0} icon={FolderOpen} subtitle="All created procurement projects" accentLine leftBorderColor="#10B981" iconColor="#10B981" />
        <StatCard title="Total Bids" value={stats?.total_bids ?? 0} icon={FileText} subtitle="Submitted bid entries" accentLine leftBorderColor="#10B981" iconColor="#10B981" />
        <StatCard title="Active Bidding" value={stats?.active_bidding ?? 0} icon={Activity} subtitle="Projects currently open" accentLine leftBorderColor="#10B981" iconColor="#10B981" />
        <StatCard title="Awarded Contracts" value={stats?.awarded_contracts ?? 0} icon={Trophy} subtitle="Finalized awards" accentLine leftBorderColor="#10B981" iconColor="#10B981" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-sm font-semibold text-slate-800">Recent Projects</h3><p className="text-xs text-slate-400 mt-0.5">Last 5 projects</p></div>
          <table className="w-full">
            <thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Budget</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Deadline</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {projects.slice(0, 5).map((p) => (
                <tr key={p.id} className="odd:bg-slate-50/40 transition-colors hover:bg-emerald-50/40"><td className="px-6 py-3 text-sm text-slate-700">{p.title}</td><td className="px-6 py-3 text-sm text-slate-600">{formatPeso(p.budget)}</td><td className="px-6 py-3 text-sm text-slate-600">{p.deadline ? new Date(p.deadline).toLocaleDateString() : "\u2014"}</td><td className="px-6 py-3"><StatusBadge status={p.status} /></td></tr>
              ))}
              {projects.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">No projects yet</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Next Actions</h3>
          <div className="space-y-3">
            {[
              { title: "Create or Manage Projects", desc: "Review draft, active, and awarded projects", action: () => router.push("/admin/projects") },
              { title: "Review Suppliers", desc: "Check supplier profiles and approvals", action: () => router.push("/admin/suppliers") },
              { title: "Evaluate Bids", desc: "Open bid evaluation for submitted projects", action: () => router.push("/admin/bid-evaluation") },
            ].map((item) => (
              <button key={item.title} onClick={item.action} className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3.5 text-left transition-all hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
