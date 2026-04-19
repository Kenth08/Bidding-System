// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\admin\AdminProjects.jsx
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import Modal from "../../components/shared/Modal";
import SectionHeader from "../../components/shared/SectionHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import TableWrapper from "../../components/shared/TableWrapper";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function truncate(text, max = 65) {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}...`;
}

export default function AdminProjects({
  projects,
  setProjects,
  projectFilter,
  setProjectFilter,
  showProjectModal,
  setShowProjectModal,
  newProject,
  setNewProject,
}) {
  const [isLoading, setIsLoading] = useState(true);
  const filteredProjects = projectFilter === "All" ? projects : projects.filter((project) => project.status === projectFilter);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  function saveProject() {
    if (!newProject.name.trim() || !newProject.budget || !newProject.deadline || !newProject.requirements.trim()) {
      return;
    }

    const payload = {
      id: `PRJ-${1000 + projects.length + 1}`,
      name: newProject.name.trim(),
      budget: Number(newProject.budget),
      deadline: newProject.deadline,
      requirements: newProject.requirements.trim(),
      status: "Active",
    };

    setProjects((prev) => [payload, ...prev]);
    setNewProject({ name: "", budget: "", deadline: "", requirements: "" });
    setShowProjectModal(false);
    setProjectFilter("All");
  }

  function deleteProject(projectId) {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeader title="Projects" subtitle="Create and manage procurement projects" />
        <button
          type="button"
          onClick={() => setShowProjectModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-emerald-600 active:scale-95"
        >
          <PlusCircle className="h-4 w-4" />
          Create New Project
        </button>
      </div>

      <div className="mb-5 flex gap-1 border-b border-slate-100">
        {["All", "Active", "Closed", "Awarded"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setProjectFilter(tab)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
              projectFilter === tab
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <TableWrapper>
        {isLoading ? (
          <LoadingSkeleton rows={6} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Budget</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Requirements</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
              {filteredProjects.length ? (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="group transition-colors duration-100 hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{project.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatCurrency(project.budget)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{project.deadline}</td>
                    <td className="px-6 py-4 text-sm text-slate-500" title={project.requirements}>
                      {truncate(project.requirements, 54)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-150 hover:bg-slate-100 hover:text-slate-600"
                          aria-label={`Edit ${project.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProject(project.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-150 hover:bg-slate-100 hover:text-slate-600"
                          aria-label={`Delete ${project.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        )}
      </TableWrapper>

      <Modal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        title="Create New Project"
        subtitle="Add procurement details and publish a new bidding project"
      >

        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Project Name</span>
            <input
              type="text"
              value={newProject.name}
              onChange={(event) => setNewProject((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              placeholder="e.g. Smart Street Lighting"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</span>
              <input
                type="number"
                value={newProject.budget}
                onChange={(event) => setNewProject((prev) => ({ ...prev, budget: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                placeholder="250000"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Deadline</span>
              <input
                type="date"
                value={newProject.deadline}
                onChange={(event) => setNewProject((prev) => ({ ...prev, deadline: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              />
            </label>
          </div>

          <label className="grid gap-1.5">
            <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Requirements</span>
            <textarea
              rows={4}
              value={newProject.requirements}
              onChange={(event) => setNewProject((prev) => ({ ...prev, requirements: event.target.value }))}
              className="resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              placeholder="List project scope, qualifications, and deliverables"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-0 pt-4">
          <button
            type="button"
            onClick={() => setShowProjectModal(false)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveProject}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-emerald-600"
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}
