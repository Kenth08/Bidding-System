// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\admin\AdminUsers.jsx
import {
  Ban,
  Pencil,
  PlusCircle,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import SectionHeader from "../../components/shared/SectionHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import TableWrapper from "../../components/shared/TableWrapper";

const ROLE_CLASS = {
  admin: "border border-blue-100 bg-blue-50 text-blue-600",
  supplier: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  viewer: "border border-slate-200 bg-slate-100 text-slate-500",
};

const INITIAL_USER = {
  fullName: "",
  email: "",
  password: "",
  role: "supplier",
  status: "Active",
};

export default function AdminUsers({ users, setUsers }) {
  const [roleFilter, setRoleFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [userForm, setUserForm] = useState(INITIAL_USER);
  const [editingUserId, setEditingUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((item) => {
      const roleMatch = roleFilter === "All" || item.role === roleFilter.toLowerCase();
      const searchMatch =
        !query ||
        item.fullName.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query);

      return roleMatch && searchMatch;
    });
  }, [roleFilter, search, users]);

  function openCreateModal() {
    setEditingUserId(null);
    setUserForm(INITIAL_USER);
    setShowModal(true);
  }

  function openEditModal(user) {
    setEditingUserId(user.id);
    setUserForm({
      fullName: user.fullName,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    });
    setShowModal(true);
  }

  function saveUser() {
    if (!userForm.fullName.trim() || !userForm.email.trim() || (!editingUserId && !userForm.password)) {
      return;
    }

    if (editingUserId) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUserId
            ? { ...user, fullName: userForm.fullName.trim(), email: userForm.email.trim(), role: userForm.role, status: userForm.status }
            : user
        )
      );
    } else {
      const payload = {
        id: `${users.length + 1}`,
        fullName: userForm.fullName.trim(),
        email: userForm.email.trim(),
        role: userForm.role,
        status: userForm.status,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setUsers((prev) => [payload, ...prev]);
    }

    setShowModal(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeader title="User Management" subtitle="Manage all system accounts and roles" />
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-emerald-600 active:scale-95"
        >
          <PlusCircle className="h-4 w-4" />
          Add New User
        </button>
      </div>

      <SearchBar
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search users by name or email"
      />

      <div className="flex gap-1 border-b border-slate-100">
        {["All", "Admin", "Supplier", "Viewer"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setRoleFilter(tab)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
              roleFilter === tab
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
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Created Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.length ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="transition-colors duration-100 hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{user.fullName}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${ROLE_CLASS[user.role] || "border border-slate-200 bg-slate-100 text-slate-500"}`}>
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                          {user.role[0].toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{user.createdAt}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => openEditModal(user)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, status: "Inactive" } : item)))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setUsers((prev) => prev.filter((item) => item.id !== user.id))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
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
                      <EmptyState icon={Users} title="No users found" subtitle="Try clearing filters or create a new user." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableWrapper>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUserId ? "Edit User" : "Add New User"}
        subtitle="Manage account details and access roles"
      >
        <div className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</span>
            <input
              type="text"
              value={userForm.fullName}
              onChange={(event) => setUserForm((prev) => ({ ...prev, fullName: event.target.value }))}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
            <input
              type="email"
              value={userForm.email}
              onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
            />
          </label>

          {!editingUserId ? (
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Password</span>
              <input
                type="password"
                value={userForm.password}
                onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              />
            </label>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</span>
              <select
                value={userForm.role}
                onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              >
                <option value="admin">Admin</option>
                <option value="supplier">Supplier</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
              <select
                value={userForm.status}
                onChange={(event) => setUserForm((prev) => ({ ...prev, status: event.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-0 pt-4">
          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveUser}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-emerald-600"
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}
