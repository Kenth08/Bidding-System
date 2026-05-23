"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { projectsAPI } from "@/services/api";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import SearchBar from "@/components/shared/SearchBar";
import StatusBadge from "@/components/shared/StatusBadge";
import Toast from "@/components/shared/Toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import LoadingButton from "@/components/ui/LoadingButton";
import { SkeletonTable } from "@/components/ui/Skeleton";

const TABS = ["All", "draft", "active", "closed", "awarded"];
const PROCUREMENT_TYPES = ["Goods", "Services", "Infrastructure"];
const EMPTY_FORM = { title: "", budget: "", deadline: "", procurement_type: "Services", technical_specifications: "", delivery_period: "", procurement_schedule: "", public_result_expiry_date: "" };
const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20";

function formatPeso(v: unknown) { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(v || 0)); }

export default function AdminProjects() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [archiveTarget, setArchiveTarget] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchData = () => { setLoading(true); projectsAPI.getAll().then((r) => { setProjects(Array.isArray(r.data) ? r.data : r.data.results || []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => projects.filter((p) => {
    const statusMatch = filter === "All" || p.status === filter;
    const q = search.toLowerCase();
    return statusMatch && (!q || (p.title || "").toLowerCase().includes(q));
  }), [projects, filter, search]);

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); }
  function openEdit(p: any) {
    setEditing(p);
    setForm({ title: p.title || "", budget: String(p.budget || ""), deadline: String(p.deadline || "").slice(0, 10), procurement_type: p.procurement_type || "Services", technical_specifications: p.technical_specifications || "", delivery_period: String(p.delivery_period || ""), procurement_schedule: String(p.procurement_schedule || "").slice(0, 10), public_result_expiry_date: String(p.public_result_expiry_date || "").slice(0, 10) });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.budget) return;
    setIsSaving(true);
    try {
      const payload = { title: form.title.trim(), budget: form.budget, deadline: form.deadline, procurement_type: form.procurement_type, technical_specifications: form.technical_specifications, delivery_period: Number(form.delivery_period) || 0, procurement_schedule: form.procurement_schedule || null, public_result_expiry_date: form.public_result_expiry_date || null };
      if (editing) await projectsAPI.update(editing.id, payload);
      else await projectsAPI.create(payload);
      setToast({ message: editing ? "Project updated" : "Project created", type: "success" });
      setShowModal(false); fetchData();
    } catch { setToast({ message: "Failed to save", type: "error" }); }
    finally { setIsSaving(false); }
  }

  async function handlePublish(id: string) {
    try { await projectsAPI.publish(id); setToast({ message: "Project published!", type: "success" }); fetchData(); }
    catch { setToast({ message: "Failed to publish", type: "error" }); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try { await projectsAPI.delete(deleteTarget.id); setToast({ message: "Project deleted", type: "success" }); fetchData(); }
    catch { setToast({ message: "Failed to delete", type: "error" }); }
    finally { setDeleteTarget(null); }
  }

  async function handleArchive() {
    if (!archiveTarget) return;
    try { await projectsAPI.archive(archiveTarget.id, "Archived by admin"); setToast({ message: "Project archived", type: "success" }); fetchData(); }
    catch { setToast({ message: "Failed to archive", type: "error" }); }
    finally { setArchiveTarget(null); }
  }

  if (loading) return <SkeletonTable />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${filter === t ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{t}</button>
          ))}
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"><PlusCircle className="h-4 w-4" />New Project</button>
      </div>

      <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects" className="mb-4" />

      {filtered.length === 0 ? <EmptyState title="No projects found" actionLabel="Create Project" onAction={openCreate} /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <table className="w-full">
            <thead><tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Deadline</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{p.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatPeso(p.budget)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.deadline ? new Date(p.deadline).toLocaleDateString() : "\u2014"}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{p.procurement_type || "\u2014"}</td>
                  <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {p.status === "draft" && <button onClick={() => handlePublish(p.id)} className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs text-emerald-600 hover:bg-emerald-100">Publish</button>}
                      {p.status === "draft" && <button onClick={() => openEdit(p)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50">Edit</button>}
                      {p.status === "draft" && <button onClick={() => setDeleteTarget(p)} className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50">Delete</button>}
                      {["active", "closed", "awarded"].includes(p.status) && <button onClick={() => router.push(`/admin/bid-evaluation?project=${p.id}`)} className="rounded-lg border border-blue-200 px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50">View Bids</button>}
                      {!p.is_archived && p.status !== "draft" && <button onClick={() => setArchiveTarget(p)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50">Archive</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Project" : "Create Project"} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Project Title</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Enter project title" /></label>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Budget ({"\u20B1"})</span><input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className={inputClass} min="0" step="1000" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Deadline</span><input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={inputClass} /></label>
          </div>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Type</span><select value={form.procurement_type} onChange={(e) => setForm({ ...form, procurement_type: e.target.value })} className={inputClass}>{PROCUREMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Specifications</span><textarea value={form.technical_specifications} onChange={(e) => setForm({ ...form, technical_specifications: e.target.value })} className={inputClass} rows={3} placeholder="Describe requirements" /></label>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Period (days)</span><input type="number" value={form.delivery_period} onChange={(e) => setForm({ ...form, delivery_period: e.target.value })} className={inputClass} min="0" /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Schedule</span><input type="date" value={form.procurement_schedule} onChange={(e) => setForm({ ...form, procurement_schedule: e.target.value })} className={inputClass} /></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Public Result Expiry</span><input type="date" value={form.public_result_expiry_date} onChange={(e) => setForm({ ...form, public_result_expiry_date: e.target.value })} className={inputClass} /></label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <LoadingButton type="submit" isLoading={isSaving} loadingText="Saving..." className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">{editing ? "Update" : "Create"}</LoadingButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Project" message={`Delete "${deleteTarget?.title}"? This cannot be undone.`} confirmLabel="Delete" confirmVariant="danger" />
      <ConfirmDialog isOpen={Boolean(archiveTarget)} onClose={() => setArchiveTarget(null)} onConfirm={handleArchive} title="Archive Project" message={`Archive "${archiveTarget?.title}"?`} confirmLabel="Archive" />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
