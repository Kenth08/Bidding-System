// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\admin\AdminDashboard.jsx
import { Activity, Award, BriefcaseBusiness, ChevronRight, ClipboardList, PlusCircle, Scale, ShieldCheck, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import SectionHeader from "../../components/shared/SectionHeader";
import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";
import TableWrapper from "../../components/shared/TableWrapper";

const DASHBOARD_STATS = [
  { title: "Total Projects", value: "12", icon: BriefcaseBusiness },
  { title: "Total Bids", value: "48", icon: ClipboardList },
  { title: "Active Bidding", value: "3", icon: Activity },
  { title: "Awarded Contracts", value: "7", icon: Award },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminDashboard({ projects }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-5">
      <SectionHeader title="Dashboard" subtitle="Monitor procurement activity and take action" />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_STATS.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} accentLine={stat.title === "Active Bidding"} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <TableWrapper>
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Recent Projects</h3>
              <p className="mt-0.5 text-xs text-slate-400">Latest procurement activity</p>
            </div>
          </div>

          {isLoading ? (
            <LoadingSkeleton rows={5} cols={4} />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Budget</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Deadline</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {projects.slice(0, 5).map((project) => (
                    <tr key={project.id} className="group transition-colors duration-100 hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{project.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatCurrency(project.budget)}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{project.deadline}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={project.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TableWrapper>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-800">Quick Actions</h3>
            <p className="mt-0.5 text-xs text-slate-400">Common admin operations</p>
          </div>

          <div className="divide-y divide-slate-50">
            {[
              {
                title: "Create New Project",
                description: "Define scope, budget, and submission timeline.",
                icon: PlusCircle,
              },
              {
                title: "Review Suppliers",
                description: "Validate registration and compliance details.",
                icon: UserCheck,
              },
              {
                title: "Evaluate Bids",
                description: "Compare bids and prepare final selection.",
                icon: Scale,
              },
              {
                title: "View Blockchain Records",
                description: "Verify awarded contract hashes and timestamps.",
                icon: ShieldCheck,
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  type="button"
                  className="group flex w-full cursor-pointer items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 transition-all group-hover:border-emerald-100 group-hover:bg-emerald-50">
                    <Icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{action.title}</p>
                    <p className="truncate text-xs text-slate-400">{action.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
