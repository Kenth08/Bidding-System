import { Archive, CheckCircle, Eye, Megaphone, Pencil, Trash2, CircleAlert, FolderOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EmptyState from "../../components/shared/EmptyState";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import { projectsAPI } from "../../services/api";
import { SkeletonTable } from "../../components/ui/Skeleton";
import LoadingButton from "../../components/ui/LoadingButton";
import Toast from "../../components/shared/Toast";

const INITIAL_FORM = { title: "", budget: "", deadline: "", requirements: "", status: "draft" };
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "—";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) return value;
  return dateValue.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getTiming(project) {
  const deadline = project?.deadline ? new Date(project.deadline) : null;
  if (!deadline || Number.isNaN(deadline.getTime())) {
    return { isOpen: false, isClosed: true, daysRemaining: null, label: "Closed", closesLabel: "Bidding closes: —" };
  }

  const diffDays = Math.ceil((deadline.getTime() - startOfToday().getTime()) / MS_PER_DAY);
  const closesLabel = `Bidding closes: ${formatDate(project.deadline)}`;

  if (diffDays < 0) {
    return { isOpen: false, isClosed: true, daysRemaining: diffDays, label: "Closed", closesLabel };
  }
  if (diffDays === 0) {
    return { isOpen: true, isClosed: false, daysRemaining: 0, label: "Closes Today", closesLabel };
  }
  return { isOpen: true, isClosed: false, daysRemaining: diffDays, label: `${diffDays} days left`, closesLabel };
}

function ProjectStatusPill({ status }) {
  const statusKey = String(status || "draft").toLowerCase();
  const config = {
    draft: { label: "Draft", className: "border-slate-200 bg-slate-100 text-slate-600", icon: FolderOpen },
    active: { label: "Open for Bidding", className: "border-emerald-100 bg-emerald-50 text-emerald-700", icon: Megaphone },
    closed: { label: "Closed", className: "border-red-100 bg-red-50 text-red-500", icon: CircleAlert },
    awarded: { label: "Awarded", className: "border-blue-100 bg-blue-50 text-blue-600", icon: CheckCircle },
  }[statusKey] || { label: statusKey || "Draft", className: "border-slate-200 bg-slate-100 text-slate-600", icon: FolderOpen };

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
      {statusKey === "awarded" ? <span className="ml-1" title="This project has been awarded and is locked">🔒</span> : null}
    </span>
  );
}

function safeStr(val) {
  return (val ?? "").toString().toLowerCase();
}

export default function AdminProjects({ onViewBids, isLoading }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [archiveModal, setArchiveModal] = useState({ open: false, project: null });
  const [archiveReason, setArchiveReason] = useState("");
  const [archiving, setArchiving] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const response = await projectsAPI.getAll();
      const items = response.data.results || response.data || [];
      setProjects(items);
    } catch (error) {
      console.error("Failed to load projects", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const projectStatus = safeStr(project.status || "draft");
      const timing = getTiming(project);
      const effectiveStatus = projectStatus === "active" && timing.isClosed ? "closed" : projectStatus;
      const filterKey = filter === "Open for Bidding" ? "active" : safeStr(filter).replace(/\s+/g, "_");
      const matchesFilter = filter === "All" ? true : safeStr(effectiveStatus) === filterKey;
      const matchesSearch =
        safeStr(project.title).includes(safeStr(search)) ||
        safeStr(project.procurement_type).includes(safeStr(search));
      return matchesFilter && matchesSearch;
    });
  }, [filter, projects, search, now]);

  if (isLoading || loading) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Project Management</h1>
            <p className="mt-0.5 text-sm text-slate-500">Approved procurement projects published for bidding</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-6">
          <SkeletonTable rows={5} cols={5} />
        </div>
      </div>
    );
  }

  

  function openEdit(project) {
    setEditingProject(project);
    setForm({
      title: project.title || "",
      budget: String(project.budget || ""),
      deadline: project.deadline || "",
      requirements: project.requirements || "",
      status: String(project.status || "draft").toLowerCase(),
    });
    setErrors({});
    setShowModal(true);
  }

  function openDetails(project) {
    setSelectedProject(project);
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
    if (!editingProject || !validateForm()) return;

    setIsSaving(true);
    try {
      await projectsAPI.update(editingProject.id, {
        title: form.title.trim(),
        budget: Number(form.budget),
        deadline: form.deadline,
        requirements: form.requirements.trim(),
        status: form.status,
      });
      setShowModal(false);
      await loadProjects();
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
      await loadProjects();
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to delete project.", type: "error" });
    } finally {
      setDeletingId(null);
      setShowConfirm(false);
    }
  }

  async function handleArchive() {
    if (!archiveModal.project) return;

    setArchiving(archiveModal.project.id);
    try {
      await projectsAPI.archive(archiveModal.project.id, archiveReason || "Archived by admin");
      await loadProjects();
      setArchiveModal({ open: false, project: null });
      setArchiveReason("");
      setToast({ message: `"${archiveModal.project.title}" moved to history.`, type: "success" });
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to archive project.", type: "error" });
    } finally {
      setArchiving(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Project Management</h1>
          <p className="mt-0.5 text-sm text-slate-500">Approved procurement projects published for bidding</p>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
          <Megaphone className="h-4 w-4 text-emerald-500" />
        </div>
        <p className="text-sm text-slate-600">
          Projects are automatically created when the School Head approves a procurement request. To create a new project, go to <span className="font-semibold text-emerald-600">Procurement Planning</span>.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="flex gap-4 border-b border-slate-50 px-6 pt-4">
          {["All", "Draft", "Open for Bidding", "Closed", "Awarded"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`border-b-2 pb-3 text-sm font-medium ${filter === tab ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="border-b border-slate-50 px-6 py-3">
          <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by project title" />
        </div>

        <table className="w-full">
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
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">Loading projects...</td>
              </tr>
            ) : filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={FolderOpen} title="No projects found" subtitle="Try a different filter or search keyword." />
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => {
                const timing = getTiming(project);
                const projectStatus = String(project.status || "draft").toLowerCase();
                const effectiveStatus = projectStatus === "active" && timing.isClosed ? "closed" : projectStatus;
                const procurementRequest = project.procurement_request_details || {};
                return (
                  <tr key={project.id} className="group transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{project.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatPeso(project.budget)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div>
                        <p>{timing.closesLabel}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{timing.label}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{project.requirements?.length > 40 ? `${project.requirements.slice(0, 40)}...` : project.requirements}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <ProjectStatusPill status={effectiveStatus} />
                        <p className="text-xs text-slate-400">{project.bid_count || 0} Bids Received</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openDetails(project)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="View details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => onViewBids?.(project.id)} className="rounded-lg p-2 text-emerald-600 hover:bg-slate-100" title="View bids">
                          <Megaphone className="h-4 w-4" />
                        </button>
                        <button onClick={() => setArchiveModal({ open: true, project })} className="rounded-lg p-2 text-amber-500 hover:bg-slate-100" title="Archive project" disabled={archiving === project.id}>
                          <Archive className="h-4 w-4" />
                        </button>
                        {effectiveStatus === "awarded" ? (
                          <div title="This project has been awarded and is locked" className="rounded-lg p-2 text-slate-500">
                            <span className="text-sm">🔒</span>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => openEdit(project)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Edit project">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => { setDeletingId(project.id); setShowConfirm(true); }} className="rounded-lg p-2 text-red-500 hover:bg-slate-100" title="Delete project">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Edit Project" subtitle="Manage project details" size="lg">
        <div className="grid gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Project Title <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm" />
            {errors.title ? <p className="mt-1 text-xs text-red-500">{errors.title}</p> : null}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Budget P <span className="text-red-400">*</span></label>
              <input type="number" value={form.budget} onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm" />
              {errors.budget ? <p className="mt-1 text-xs text-red-500">{errors.budget}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Deadline <span className="text-red-400">*</span></label>
              <input type="date" value={form.deadline} onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm" />
              {errors.deadline ? <p className="mt-1 text-xs text-red-500">{errors.deadline}</p> : null}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Requirements</label>
            <textarea rows={4} value={form.requirements} onChange={(event) => setForm((prev) => ({ ...prev, requirements: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm">
              <option value="draft">Draft</option>
              <option value="active">Open for Bidding</option>
              <option value="closed">Closed</option>
              <option value="awarded">Awarded</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600">Cancel</button>
            <LoadingButton
              onClick={saveProject}
              isLoading={isSaving}
              loadingText="Saving..."
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Save
            </LoadingButton>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(selectedProject)} onClose={() => setSelectedProject(null)} title={selectedProject?.title || "Project Details"} subtitle="Project and procurement request details" size="lg">
        {selectedProject ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Title</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Status</p>
                <div className="mt-1"><ProjectStatusPill status={String(selectedProject.status || "draft").toLowerCase() === "active" && getTiming(selectedProject).isClosed ? "closed" : selectedProject.status} /></div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bidding Deadline</p>
                <p className="mt-1 text-sm text-slate-800">{getTiming(selectedProject).closesLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bids Received</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.bid_count || 0} bids received</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</p>
                <p className="mt-1 text-sm text-slate-800">{formatPeso(selectedProject.budget)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Type</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.procurement_type || selectedProject.procurement_request_details?.procurement_type || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Period</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.delivery_period || selectedProject.procurement_request_details?.delivery_period || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Schedule</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.procurement_request_details?.procurement_schedule || "—"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Specifications</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{selectedProject.technical_specifications || selectedProject.procurement_request_details?.technical_specifications || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requirements</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{selectedProject.requirements || selectedProject.procurement_request_details?.technical_specifications || "—"}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reviewed By</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.procurement_request_details?.reviewed_by_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reviewed At</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.procurement_request_details?.reviewed_at ? formatDate(selectedProject.procurement_request_details.reviewed_at) : "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review Remarks</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.procurement_request_details?.review_remarks || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revision Notes</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.procurement_request_details?.revision_notes || "—"}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Request Details</p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Request Title</p>
                  <p className="text-sm text-slate-800">{selectedProject.procurement_request_details?.title || selectedProject.title}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Request Status</p>
                  <p className="text-sm text-slate-800">{selectedProject.procurement_request_details?.status || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created By</p>
                  <p className="text-sm text-slate-800">{selectedProject.procurement_request_details?.created_by_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created At</p>
                  <p className="text-sm text-slate-800">{selectedProject.procurement_request_details?.created_at ? formatDate(selectedProject.procurement_request_details.created_at) : "—"}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setSelectedProject(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
                Close
              </button>
              <button onClick={() => onViewBids?.(selectedProject.id)} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
                View Bids
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={archiveModal.open}
        onClose={() => { setArchiveModal({ open: false, project: null }); setArchiveReason(""); }}
        title="Archive Project"
        subtitle="Move this project to history"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <Archive className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-sm text-amber-700">
              This will hide <strong>"{archiveModal.project?.title}"</strong> from active projects and supplier browsing. You can restore it later from Project History.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Archive Reason (optional)</label>
            <input
              type="text"
              value={archiveReason}
              onChange={(event) => setArchiveReason(event.target.value)}
              placeholder="e.g. Project completed, outdated, replaced by a newer request"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={() => { setArchiveModal({ open: false, project: null }); setArchiveReason(""); }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleArchive}
              disabled={Boolean(archiving)}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:bg-amber-300"
            >
              <Archive className="h-4 w-4" />
              Move to History
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
        isConfirmLoading={Boolean(deletingId)}
        confirmLoadingText="Deleting..."
      />

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
