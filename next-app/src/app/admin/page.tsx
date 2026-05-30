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
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);
  const [projectFilter, setProjectFilter] = useState("All");

  useEffect(() => {
    Promise.all([
      dashboardAPI.getStats().then((r) => setStats(r.data)).catch(() => setStats(null)),
      projectsAPI.getAll().then((r) => setProjects(Array.isArray(r.data) ? r.data : r.data.results || [])).catch(() => setProjects([])),
      dashboardAPI.getExpiringDocs().then((r) => setExpiringDocs(r.data?.items || [])).catch(() => setExpiringDocs([])),
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
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Recent Projects</h3>
            <p className="text-xs text-slate-400 mt-0.5">Last 10 projects by status</p>
          </div>
          <div className="px-6 py-3 border-b border-slate-100 flex gap-1 flex-wrap">
            {["All", "Draft", "Active", "Closed", "Awarded"].map((tab) => (
              <button key={tab} onClick={() => setProjectFilter(tab)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${projectFilter === tab ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{tab}</button>
            ))}
          </div>
          <div className="px-6 py-4 space-y-3 max-h-[400px] overflow-y-auto">
            {(() => {
              const filtered = projectFilter === "All" ? projects.slice(0, 10) : projects.filter((p) => p.status === projectFilter.toLowerCase()).slice(0, 10);
              if (!filtered.length) return <p className="text-sm text-slate-400 py-4 text-center">No {projectFilter.toLowerCase()} projects found.</p>;
              return filtered.map((p) => (
                <button key={p.id} onClick={() => router.push(`/admin/projects`)} className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-emerald-200 hover:bg-white">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                    <p className="mt-1 text-xs text-slate-500 truncate">{formatPeso(p.budget)} · {p.deadline ? new Date(p.deadline).toLocaleDateString() : "No deadline"}</p>
                  </div>
                  <StatusBadge status={p.status} className="shrink-0" />
                </button>
              ));
            })()}
          </div>
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
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Expiring Documents (30 days)</h3>
          {expiringDocs.length === 0 ? <p className="text-xs text-slate-400">No documents expiring within 30 days</p> : (
            <ul className="space-y-2">
              {expiringDocs.slice(0, 6).map((d: any) => (
                <li key={`${d.user_id}-${d.document}`} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{d.name}</p>
                    <p className="text-xs text-slate-400">{d.document}</p>
                  </div>
                  <div className="text-xs text-slate-500">{new Date(d.expiry).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
