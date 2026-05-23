// c:\Users\Mico\Bidding-System\frontend\src\pages\admin\AdminSuppliers.jsx
import { Eye, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import LoadingButton from "../../components/ui/LoadingButton";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";
import { suppliersAPI, documentAPI, usersAPI } from "../../services/api";

function safeStr(val) {
  return (val ?? "").toString().toLowerCase();
}

function getSupplierStatus(supplier) {
  const rawStatus = safeStr(supplier.status || supplier.status_display);

  if (rawStatus === "pending" || rawStatus === "for review" || rawStatus === "submitted") {
    return "pending";
  }

  if (rawStatus === "approved" || rawStatus === "verified" || rawStatus === "active") {
    return "approved";
  }

  if (rawStatus === "rejected" || rawStatus === "declined") {
    return "rejected";
  }

  return rawStatus || "pending";
}

function getSupplierStatusLabel(supplier) {
  const status = getSupplierStatus(supplier);
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function getSupplierStatusClass(supplier) {
  const status = getSupplierStatus(supplier);

  if (status === "approved") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "border-red-100 bg-red-50 text-red-700";
  return "border-amber-100 bg-amber-50 text-amber-700";
}

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function formatReadableDate(value) {
  if (!value) return "-";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "-";
  return parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminSuppliers({ notificationTargetSupplierId = null, notificationTargetVersion = 0 }) {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [supplierDocs, setSupplierDocs] = useState([]);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await suppliersAPI.getAll();
      setSuppliers(res.data.results || res.data || []);
    } catch {
      setSuppliers([]);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Load documents for the supplier when viewingSupplier changes
  useEffect(() => {
    async function loadDocs() {
      if (!viewingSupplier) return setSupplierDocs([]);
      try {
        const res = await documentAPI.getAll();
        const docs = res.data.results || res.data || [];
        setSupplierDocs(docs.filter((d) => d.user === viewingSupplier.id));
      } catch (err) {
        console.error("Failed to fetch documents for supplier", err);
        setSupplierDocs([]);
      }
    }

    loadDocs();
  }, [viewingSupplier]);

  useEffect(() => {
    if (!notificationTargetSupplierId || !suppliers.length) return;
    const target = suppliers.find((supplier) => String(supplier.id) === String(notificationTargetSupplierId));
    if (target) {
      setViewingSupplier(target);
    }
  }, [notificationTargetSupplierId, notificationTargetVersion, suppliers]);

  useEffect(() => {
    if (!editingSupplier) {
      setEditForm({});
      return;
    }

    setEditForm({
      full_name: editingSupplier.full_name || "",
      company_name: editingSupplier.company_name || "",
      company_address: editingSupplier.company_address || "",
      phone: editingSupplier.phone || "",
      business_type: editingSupplier.business_type || "",
      email: editingSupplier.email || "",
    });
  }, [editingSupplier]);

  const filtered = useMemo(() => {
    return suppliers.filter((supplier) => {
      const statusMatch = filter === "All" || safeStr(supplier.status) === safeStr(filter) || safeStr(supplier.status_display) === safeStr(filter);
      const searchMatch =
        safeStr(supplier.full_name).includes(safeStr(search)) ||
        safeStr(supplier.company_name).includes(safeStr(search)) ||
        safeStr(supplier.email).includes(safeStr(search));
      return statusMatch && searchMatch;
    });
  }, [filter, search, suppliers]);

  async function changeStatus(id, status) {
    setActionLoading(`${id}:${status}`);
    try {
      const isApproved = status === 'approved';
      const backendStatus = isApproved ? 'approved' : 'rejected';
      const localStatus = isApproved ? 'Verified' : 'Rejected';

      await suppliersAPI.updateStatus(id, backendStatus);
      setSuppliers((prev) => prev.map((supplier) => (supplier.id === id ? { ...supplier, status: localStatus, status_display: localStatus } : supplier)));
      const message = isApproved ? "Supplier approved successfully" : "Supplier rejected successfully";
      const type = isApproved ? "success" : "warning";
      setToast({ message, type });
    } catch (error) {
      console.error("Failed to update supplier status", error);
      setToast({ message: "Failed to update supplier status.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEditSave() {
    if (!editingSupplier) return;

    try {
      await usersAPI.update(editingSupplier.id, editForm);
      setSuppliers((previous) => previous.map((supplier) => (supplier.id === editingSupplier.id ? { ...supplier, ...editForm } : supplier)));
      setEditingSupplier(null);
      setToast({ message: "Supplier details updated successfully.", type: "success" });
    } catch (error) {
      console.error("Failed to update supplier", error);
      setToast({ message: "Failed to update supplier.", type: "error" });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Review registrations and update approval status</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="px-6 pt-4 flex gap-4 border-b border-slate-50">
          {["All", "Pending", "Approved", "Rejected"].map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)} className={`pb-3 text-sm font-medium border-b-2 ${filter === tab ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="px-6 py-3 border-b border-slate-50">
          <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or company" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1420px] table-fixed">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[24%]" />
              <col className="w-[10%]" />
              <col className="w-[11%]" />
              <col className="w-[13%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Full Name</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Email</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Business Type</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Permit Document</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Registered</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14">
                    <EmptyState
                      icon={Users}
                      title={suppliers.length === 0 ? "No suppliers found" : "No matching suppliers"}
                      subtitle={suppliers.length === 0 ? "Supplier registrations will appear here once they start coming in." : "Try adjusting your search or filter to find a supplier."}
                    />
                  </td>
                </tr>
              ) : filtered.map((supplier) => {
                const status = getSupplierStatus(supplier);
                const statusLabel = getSupplierStatusLabel(supplier);
                const isPending = status === "pending";
                const initials = getInitials(supplier.full_name || supplier.company_name);

                return (
                  <tr key={supplier.id} className="group transition-colors hover:bg-slate-50/70">
                    <td className="px-6 py-3.5 align-middle">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold uppercase text-slate-600">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{supplier.full_name || "-"}</p>
                          <p className="truncate text-xs text-slate-500">{supplier.company_name || "No company listed"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 align-middle text-sm text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                      <span className="block truncate">{supplier.email || "-"}</span>
                    </td>
                    <td className="px-6 py-3.5 align-middle text-sm text-slate-600 whitespace-nowrap">{supplier.phone || "-"}</td>
                    <td className="px-6 py-3.5 align-middle text-sm text-slate-600 whitespace-nowrap">
                      <span className="block truncate">{supplier.business_type || "-"}</span>
                    </td>
                    <td className="px-6 py-3.5 align-middle text-sm text-slate-600 whitespace-nowrap">
                      {supplier.business_permit_document_url ? (
                        <a
                          href={supplier.business_permit_document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
                        >
                          View Document
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 align-middle text-sm text-slate-600 whitespace-nowrap">
                      {formatReadableDate(supplier.created_at)}
                    </td>
                    <td className="px-6 py-3.5 align-middle text-center">
                      <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold ${getSupplierStatusClass(supplier)}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 align-middle">
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => setViewingSupplier(supplier)}
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                              title="View supplier details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                            <LoadingButton
                              onClick={() => changeStatus(supplier.id, "approved")}
                              isLoading={actionLoading === `${supplier.id}:approved`}
                              loadingText="Approving..."
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                            >
                              Approve
                            </LoadingButton>
                            <LoadingButton
                              onClick={() => changeStatus(supplier.id, "rejected")}
                              isLoading={actionLoading === `${supplier.id}:rejected`}
                              loadingText="Rejecting..."
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                            >
                              Reject
                            </LoadingButton>
                          </>
                        ) : (
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${status === "approved" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-700"}`}>
                            {statusLabel}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={Boolean(viewingSupplier)} onClose={() => setViewingSupplier(null)} title="Supplier Profile" subtitle="Registration details" size="md">
        {viewingSupplier && (
          <div className="space-y-3 text-sm text-slate-700">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold">{viewingSupplier.full_name?.charAt(0) || "S"}</div>
            <p><span className="font-semibold">Full Name:</span> {viewingSupplier.full_name}</p>
            <p><span className="font-semibold">Email:</span> {viewingSupplier.email}</p>
            <p><span className="font-semibold">Company:</span> {viewingSupplier.company_name}</p>
            <p><span className="font-semibold">Address:</span> {viewingSupplier.company_address || "-"}</p>
            <p><span className="font-semibold">Phone:</span> {viewingSupplier.phone || "-"}</p>
            <p><span className="font-semibold">Business Type:</span> {viewingSupplier.business_type || "-"}</p>
            <p><span className="font-semibold">Business Permit Document:</span> {viewingSupplier.business_permit_document_name || "-"}</p>
            {viewingSupplier.business_permit_document_url ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{viewingSupplier.business_permit_document_name || "Business Permit Document"}</p>
                  <p className="text-xs text-slate-400">Uploaded business permit</p>
                </div>
                <a href={viewingSupplier.business_permit_document_url} target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50">
                  View Document
                </a>
              </div>
            ) : null}
            <p><span className="font-semibold">Registered Date:</span> {viewingSupplier.created_at?.slice(0, 10)}</p>
            <StatusBadge status={viewingSupplier.status || viewingSupplier.status_display} />
            <div className="pt-4">
              <h3 className="text-sm font-semibold text-slate-800">Uploaded Documents</h3>
              <div className="mt-2 bg-white rounded-md border border-slate-100">
                {supplierDocs.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500">No documents uploaded</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {supplierDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-slate-800">{doc.file_name}</div>
                          <div className="text-xs text-slate-500">{doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <a href={doc.file_url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600">Download</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(editingSupplier)}
        onClose={() => setEditingSupplier(null)}
        title="Edit Rejected Supplier"
        subtitle="Update supplier details before reconsidering"
        size="md"
      >
        {editingSupplier ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <Pencil className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <p className="text-sm text-blue-700">You are editing <strong>{editingSupplier.full_name}</strong>'s details. After editing, you can approve this supplier.</p>
            </div>

            {[
              { key: "full_name", label: "Full Name", type: "text" },
              { key: "email", label: "Email", type: "email" },
              { key: "company_name", label: "Company Name", type: "text" },
              { key: "company_address", label: "Company Address", type: "text" },
              { key: "phone", label: "Phone Number", type: "tel" },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
                <input
                  type={type}
                  value={editForm[key] || ""}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, [key]: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                />
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Business Type</label>
              <select
                value={editForm.business_type || ""}
                onChange={(event) => setEditForm((previous) => ({ ...previous, business_type: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-emerald-400 focus:bg-white"
              >
                {["Construction", "IT Services", "Healthcare", "Logistics", "Consulting", "Other"].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button onClick={() => setEditingSupplier(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">Cancel</button>
              <button onClick={handleEditSave} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600">Save Changes</button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
