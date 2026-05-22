import EmptyState from "../../components/shared/EmptyState";
import { Award, Calendar, DollarSign } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export default function SchoolHeadApprovedProjects({ projects = [] }) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return <EmptyState icon={Award} title="No approved projects" subtitle="No approved projects to show." />;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Deadline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {projects.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-800">{p.title || p.project_title}</p>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">₱{Number(p.budget || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{formatDate(p.deadline)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
