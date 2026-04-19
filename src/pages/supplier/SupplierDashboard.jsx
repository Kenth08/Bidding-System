// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\supplier\SupplierDashboard.jsx
import { Activity, BriefcaseBusiness, CheckCircle2, FileBarChart2 } from "lucide-react";
import { useEffect, useState } from "react";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import SectionHeader from "../../components/shared/SectionHeader";
import StatCard from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";
import TableWrapper from "../../components/shared/TableWrapper";

const SUPPLIER_STATS = [
  { title: "Open Projects", value: "6", icon: BriefcaseBusiness },
  { title: "My Active Bids", value: "3", icon: Activity },
  { title: "Contracts Won", value: "2", icon: CheckCircle2 },
  { title: "Performance Score", value: "91%", icon: FileBarChart2 },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SupplierDashboard({ supplierProjects }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-5">
      <SectionHeader title="Supplier Dashboard" subtitle="Track opportunities and bidding performance" />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SUPPLIER_STATS.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} accentLine={stat.title === "My Active Bids"} />
        ))}
      </section>

      <TableWrapper>
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">Newest Available Projects</h3>
          <p className="mt-0.5 text-xs text-slate-400">Review open projects and prepare your bid submissions</p>
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
                {supplierProjects.slice(0, 5).map((project) => (
                  <tr key={project.id} className="transition-colors duration-100 hover:bg-slate-50/50">
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
    </div>
  );
}
