// c:\Users\Mico\Bidding-System\frontend\src\pages\admin\AdminSuppliers.jsx
import { CheckCircle, Eye, Pencil, Users, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import LoadingButton from "../../components/ui/LoadingButton";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";
import { suppliersAPI, documentAPI, usersAPI } from "../../services/api";
import { useData } from "../../context/DataContext";

function safeStr(val) {
  return (val ?? "").toString().toLowerCase();
}

export default function AdminSuppliers({ notificationTargetSupplierId = null, notificationTargetVersion = 0 }) {
  const { cache, loadSuppliers, updateItem } = useData();
  const [suppliers, setSuppliers] = useState(() => cache.suppliers || []);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [supplierDocs, setSupplierDocs] = useState([]);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (!Array.isArray(cache.suppliers)) {
      loadSuppliers();
    }
  }, [cache.suppliers, loadSuppliers]);

  useEffect(() => {
    if (Array.isArray(cache.suppliers)) {
      setSuppliers(cache.suppliers);
    }
  }, [cache.suppliers]);

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
      setSuppliers((prev) => prev.map((supplier) => (supplier.id === id ? { ...supplier, status: localStatus } : supplier)));
      updateItem('suppliers', id, { status: localStatus, status_display: localStatus });
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
      updateItem('suppliers', editingSupplier.id, editForm);
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

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
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

        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Company</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Business Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Permit Document</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Registered</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState icon={Users} title="No suppliers registered yet" subtitle="New supplier registrations will appear here." />
                </td>
              </tr>
            ) : filtered.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 text-sm font-medium text-slate-800">{supplier.full_name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{supplier.company_name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{supplier.email}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{supplier.phone || "-"}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{supplier.business_type || "-"}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{supplier.business_permit_document_name || "-"}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{supplier.created_at?.slice(0, 10)}</td>
                <td className="px-6 py-4"><StatusBadge status={supplier.status || supplier.status_display} /></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => setViewingSupplier(supplier)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Eye className="h-4 w-4" /></button>
                    {supplier.status !== "Verified" && supplier.status !== "approved" && (
                      <LoadingButton onClick={() => changeStatus(supplier.id, "approved")} isLoading={actionLoading === `${supplier.id}:approved`} loadingText="Approving..." className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-600">
                        Approve
                      </LoadingButton>
                    )}
                    {supplier.status !== "Rejected" && (
                      <LoadingButton onClick={() => changeStatus(supplier.id, "rejected")} isLoading={actionLoading === `${supplier.id}:rejected`} loadingText="Rejecting..." className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600">
                        Reject
                      </LoadingButton>
                    )}
                    {String(supplier.status).toLowerCase() === "rejected" && (
                      <button onClick={() => setEditingSupplier(supplier)} className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50" title="Edit rejected supplier details">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
