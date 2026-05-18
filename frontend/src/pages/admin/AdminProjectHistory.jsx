import { useEffect, useState } from "react";
import { Archive, Award, Calendar, DollarSign, Eye, RotateCcw, Search } from "lucide-react";
import { projectsAPI } from "../../services/api";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import Toast from "../../components/shared/Toast";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const value = new Date(dateStr);
  if (Number.isNaN(value.getTime())) return "—";
  return value.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function safeStr(value) {
  return (value ?? "").toString().toLowerCase();
}

export default function AdminProjectHistory() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [viewingProject, setViewingProject] = useState(null);
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    try {
      const response = await projectsAPI.getHistory();
      setProjects(response.data.results || response.data || []);
    } catch (error) {
      console.error("Failed to load history", error);
      setToast({ message: "Failed to load project history.", type: "error" });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(project) {
    setRestoringId(project.id);
    try {
      await projectsAPI.unarchive(project.id);
      setProjects((previous) => previous.filter((item) => item.id !== project.id));
      setToast({ message: `"${project.title}" restored to active projects.`, type: "success" });
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to restore project.", type: "error" });
    } finally {
      setRestoringId(null);
    }
  }

  const filteredProjects = projects.filter((project) => {
    const query = safeStr(search);
    return [project.title, project.status, project.procurement_type, project.archived_reason].some((value) => safeStr(value).includes(query));
  });

  const statusStyle = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-100",
    closed: "bg-slate-100 text-slate-500 border-slate-200",
    awarded: "bg-blue-50 text-blue-600 border-blue-100",
    cancelled: "bg-red-50 text-red-500 border-red-100",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Project History</h1>
          <p className="mt-0.5 text-sm text-slate-500">Archived procurement projects and restoration actions</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2">
          <Archive className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-700">
            {projects.length} archived project{projects.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
        <Archive className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p className="text-sm text-slate-600">Archived projects are hidden from active views and supplier browsing. Restore a project to make it active again.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-50 px-6 py-3">
          <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search archived projects..." />
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Final Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Archived On</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-6">
                  <LoadingSkeleton rows={4} />
                </td>
              </tr>
            ) : filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState icon={Archive} title="No archived projects" subtitle="Projects you archive from the Projects page will appear here." />
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-800">{project.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{project.bid_count || 0} bids received</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">₱{Number(project.budget || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{project.procurement_type || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${statusStyle[String(project.status || "").toLowerCase()] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(project.archived_at)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <p className="max-w-[170px] truncate">{project.archived_reason || "—"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewingProject(project)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600" title="View details">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRestore(project)}
                        disabled={restoringId === project.id}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                        title="Restore to active projects"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={Boolean(viewingProject)}
        onClose={() => setViewingProject(null)}
        title="Archived Project Details"
        subtitle={viewingProject?.title}
        size="lg"
      >
        {viewingProject ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Budget", value: `₱${Number(viewingProject.budget || 0).toLocaleString()}`, icon: DollarSign },
                { label: "Type", value: viewingProject.procurement_type || "—", icon: Archive },
                { label: "Deadline", value: formatDate(viewingProject.deadline), icon: Calendar },
                { label: "Final Status", value: viewingProject.status || "—", icon: Award },
                { label: "Bids Received", value: viewingProject.bid_count || 0, icon: Search },
                { label: "Archived On", value: formatDate(viewingProject.archived_at), icon: Calendar },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="mb-0.5 text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>

            {viewingProject.requirements ? (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Requirements</p>
                <p className="text-sm leading-relaxed text-slate-700">{viewingProject.requirements}</p>
              </div>
            ) : null}

            {viewingProject.archived_reason ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                <p className="mb-1 text-xs font-semibold text-amber-600">Archive Reason</p>
                <p className="text-sm text-amber-700">{viewingProject.archived_reason}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {toast ? <Toast message={toast.message} type={toast.type} isVisible onClose={() => setToast(null)} /> : null}
    </div>
  );
}