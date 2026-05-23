"use client";
import { useState, useEffect, useMemo } from "react";
import { Eye, EyeOff, PlusCircle } from "lucide-react";
import { usersAPI } from "@/services/api";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import SearchBar from "@/components/shared/SearchBar";
import StatusBadge from "@/components/shared/StatusBadge";
import Toast from "@/components/shared/Toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import LoadingButton from "@/components/ui/LoadingButton";
import { SkeletonTable } from "@/components/ui/Skeleton";

const ROLES = ["All", "admin", "school_head", "supplier", "viewer"];
const INITIAL_FORM = { full_name: "", email: "", password: "", role: "supplier", status: "active" };
const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetch = () => { setLoading(true); usersAPI.getAll().then((r) => { setUsers(Array.isArray(r.data) ? r.data : r.data.results || []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const filtered = useMemo(() => users.filter((u) => {
    const roleMatch = filter === "All" || u.role === filter;
    const q = search.toLowerCase();
    const searchMatch = !q || (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
    return roleMatch && searchMatch;
  }), [users, filter, search]);

  function openCreate() { setEditing(null); setForm(INITIAL_FORM); setErrors({}); setShowPassword(false); setShowModal(true); }
  function openEdit(u: any) { setEditing(u); setForm({ full_name: u.full_name || "", email: u.email || "", password: "", role: u.role || "supplier", status: u.status || "active" }); setErrors({}); setShowPassword(false); setShowModal(true); }

  async function handleSave() {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!editing && !form.password) e.password = "Required for new users";
    if (Object.keys(e).length) { setErrors(e); return; }
    setIsSaving(true);
    try {
      const payload: any = { full_name: form.full_name, email: form.email, role: form.role, status: form.status };
      if (form.password) payload.password = form.password;
      if (editing) await usersAPI.update(editing.id, payload);
      else await usersAPI.create(payload);
      setToast({ message: editing ? "User updated" : "User created", type: "success" });
      setShowModal(false); fetch();
    } catch { setToast({ message: "Failed to save user", type: "error" }); }
    finally { setIsSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try { await usersAPI.delete(deleteTarget.id); setToast({ message: "User deleted", type: "success" }); fetch(); }
    catch { setToast({ message: "Failed to delete", type: "error" }); }
    finally { setDeleteTarget(null); }
  }

  if (loading) return <SkeletonTable />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {ROLES.map((r) => (
            <button key={r} onClick={() => setFilter(r)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filter === r ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {r === "All" ? "All" : r.replace("_", " ")}
            </button>
          ))}
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"><PlusCircle className="h-4 w-4" />Add User</button>
      </div>

      <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="mb-4" />

      {filtered.length === 0 ? <EmptyState title="No users found" /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <table className="w-full">
            <thead><tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{u.full_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{u.email}</td>
                  <td className="px-6 py-4"><StatusBadge status={u.role} /></td>
                  <td className="px-6 py-4"><StatusBadge status={u.status} /></td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => openEdit(u)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50">Edit</button>
                    <button onClick={() => setDeleteTarget(u)} className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit User" : "Create User"} size="md">
        <div className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</span><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputClass} />{errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}</label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />{errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}</label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Password {editing && "(leave blank to keep)"}</span>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder={editing ? "••••••••" : ""} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Role</span><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass}><option value="admin">Admin</option><option value="school_head">School Head</option><option value="supplier">Supplier</option><option value="viewer">Viewer</option></select></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option></select></label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <LoadingButton isLoading={isSaving} onClick={handleSave} loadingText="Saving..." className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">{editing ? "Update" : "Create"}</LoadingButton>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete User" message={`Are you sure you want to delete "${deleteTarget?.full_name}"? This action cannot be undone.`} confirmLabel="Delete" confirmVariant="danger" />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
