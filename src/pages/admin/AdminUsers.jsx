// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\admin\AdminUsers.jsx
import { Ban, Eye, EyeOff, Pencil, PlusCircle, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EmptyState from "../../components/shared/EmptyState";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";

const INITIAL_FORM = { fullName: "", email: "", password: "", role: "supplier", status: "Active" };

export default function AdminUsers({ users, setUsers, currentUser }) {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const roleMatch = filter === "All" || user.role.toLowerCase() === filter.toLowerCase();
      const searchMatch = !query || user.fullName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
      return roleMatch && searchMatch;
    });
  }, [filter, search, users]);

  function openCreate() {
    setEditingUser(null);
    setForm(INITIAL_FORM);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(user) {
    setEditingUser(user);
    setForm({ ...user, password: "" });
    setErrors({});
    setShowModal(true);
  }

  function validate() {
    const next = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    if (!editingUser && !form.password.trim()) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function saveUser() {
    if (!validate()) return;
    if (editingUser) {
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...form, fullName: form.fullName.trim(), email: form.email.trim() } : u)));
      setToast({ message: "User updated", type: "success" });
    } else {
      const payload = {
        id: `u-${Date.now()}`,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        status: form.status,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setUsers((prev) => [payload, ...prev]);
      setToast({ message: "User created", type: "success" });
    }
    setShowModal(false);
  }

  function confirmDelete() {
    setUsers((prev) => prev.filter((user) => user.id !== deletingId));
    setShowConfirm(false);
    setDeletingId(null);
    setToast({ message: "User deleted", type: "warning" });
  }

  function toggleStatus(id) {
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, status: user.status === "Active" ? "Inactive" : "Active" } : user)));
    setToast({ message: "User status updated", type: "success" });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage account access and permissions</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
          <PlusCircle className="h-4 w-4" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 pt-4 flex gap-4 border-b border-slate-50">
          {["All", "Admin", "Supplier", "Viewer"].map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)} className={`pb-3 text-sm font-medium border-b-2 ${filter === tab ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"}`}>{tab}</button>
          ))}
        </div>
        <div className="px-6 py-3 border-b border-slate-50">
          <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" />
        </div>
        <table className="w-full">
          <thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">User</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Email</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Role</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Created</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={6}><EmptyState icon={Users} title="No users found" subtitle="Try adjusting your search or filters." /></td></tr>
            ) : filtered.map((user) => {
              const cannotDelete = user.email === (currentUser?.email || "admin@gmail.com");
              return (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{user.fullName}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm capitalize text-slate-600">{user.role}</td>
                  <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.createdAt}</td>
                  <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => openEdit(user)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="h-4 w-4" /></button><button onClick={() => toggleStatus(user.id)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Ban className="h-4 w-4" /></button><button disabled={cannotDelete} onClick={() => { setDeletingId(user.id); setShowConfirm(true); }} className="p-2 rounded-lg hover:bg-slate-100 text-red-500 disabled:text-slate-300"><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? "Edit User" : "Add User"} size="md">
        <div className="grid gap-4">
          <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Full Name <span className="text-red-400">*</span></label><input value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm" />{errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}</div>
          <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email <span className="text-red-400">*</span></label><input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm" />{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}</div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Password {editingUser ? "(leave blank to keep current)" : <span className="text-red-400">*</span>}</label>
            <div className="relative"><input type={showPassword ? "text" : "password"} placeholder={editingUser ? "......" : "Enter password"} value={form.password || ""} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm" /><button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-2.5 text-slate-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Role</label><select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"><option value="admin">Admin</option><option value="supplier">Supplier</option><option value="viewer">Viewer</option></select></div>
            <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Status</label><select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"><option>Active</option><option>Inactive</option></select></div>
          </div>
          <div className="flex justify-end gap-2"><button onClick={() => setShowModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600">Cancel</button><button onClick={saveUser} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Save</button></div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={confirmDelete} title="Delete User?" message="This action cannot be undone." confirmLabel="Delete" confirmVariant="danger" />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
