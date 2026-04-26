// c:\Users\Mico\Bidding-System\frontend\src\pages\admin\AdminProjects.jsx
import { FolderOpen, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { projectsAPI } from "../../services/api";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EmptyState from "../../components/shared/EmptyState";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";

const INITIAL_FORM = { title: "", budget: "", deadline: "", requirements: "", status: "Active" };

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

export default function AdminProjects({ projects, setProjects }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesFilter = filter === "All" || project.status === filter;
      const matchesSearch = !query || project.title.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, projects, search]);

  function openCreate() {
    setEditingProject(null);
    setForm(INITIAL_FORM);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(project) {
    setEditingProject(project);
    setForm({
      title: project.title || "",
      budget: String(project.budget || ""),
      deadline: project.deadline || "",
      requirements: project.requirements || "",
      status: project.status || "Active",
    });
    setErrors({});
    setShowModal(true);
  }

  function validateForm() {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Project title is required.";
    if (!form.budget || Number(form.budget) <= 0) nextErrors.budget = "Budget is required.";
    if (!form.deadline) nextErrors.deadline = "Deadline is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function saveProject() {
    if (!validateForm()) return;

    setIsSaving(true);
    const payload = {
      title: form.title.trim(),
      budget: Number(form.budget),
      deadline: form.deadline,
      requirements: form.requirements.trim(),
      status: form.status,
    };

    try {
      if (editingProject) {
        const res = await projectsAPI.update(editingProject.id, payload);
        setProjects((prev) => prev.map((item) => (item.id === editingProject.id ? res.data : item)));
        setToast({ message: "Project updated successfully", type: "success" });
      } else {
        const res = await projectsAPI.create(payload);
        setProjects((prev) => [res.data, ...prev]);
        setToast({ message: "Project created successfully", type: "success" });
      }
      setShowModal(false);
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to save project. Please try again.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await projectsAPI.delete(deletingId);
      setProjects((prev) => prev.filter((item) => item.id !== deletingId));
      setToast({ message: "Project deleted", type: "warning" });
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to delete project.", type: "error" });
    } finally {
      setDeletingId(null);
      setShowConfirm(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage procurement projects</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
          <PlusCircle className="h-4 w-4" />
          Create New Project
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 pt-4 flex gap-4 border-b border-slate-50">
          {["All", "Active", "Closed", "Awarded"].map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)} className={`pb-3 text-sm font-medium border-b-2 ${filter === tab ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="px-6 py-3 border-b border-slate-50">
          <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by project title" />
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Project Name</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Budget</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Deadline</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Requirements</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={FolderOpen} title="No projects found" subtitle="Try a different filter or search keyword." />
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{project.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatPeso(project.budget)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{project.deadline}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{project.requirements?.length > 40 ? `${project.requirements.slice(0, 40)}...` : project.requirements}</td>
                  <td className="px-6 py-4"><StatusBadge status={project.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(project)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => { setDeletingId(project.id); setShowConfirm(true); }} className="p-2 rounded-lg hover:bg-slate-100 text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProject ? "Edit Project" : "Create New Project"} subtitle="Manage project details" size="lg">
        <div className="grid gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Project Title <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Budget P <span className="text-red-400">*</span></label>
              <input type="number" value={form.budget} onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
              {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Deadline <span className="text-red-400">*</span></label>
              <input type="date" value={form.deadline} onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
              {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Requirements</label>
            <textarea rows={4} value={form.requirements} onChange={(event) => setForm((prev) => ({ ...prev, requirements: event.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Status</label>
            <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm">
              <option>Active</option>
              <option>Closed</option>
              <option>Awarded</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600">Cancel</button>
            <button onClick={saveProject} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Project?"
        message="This action cannot be undone. All associated bids will also be removed."
        confirmLabel="Delete"
        confirmVariant="danger"
      />

      <Toast
        message={toast?.message || ""}
        type={toast?.type || "success"}
        isVisible={Boolean(toast)}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
