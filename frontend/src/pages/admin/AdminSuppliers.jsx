// c:\Users\Mico\Bidding-System\frontend\src\pages\admin\AdminSuppliers.jsx
import { Eye, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";
import { suppliersAPI } from "../../services/api";

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    async function loadSuppliers() {
      setLoading(true);
      try {
        const res = await suppliersAPI.getAll();
        setSuppliers(res.data.data || res.data || []);
      } catch (error) {
        console.error("Failed to fetch suppliers", error);
      } finally {
        setLoading(false);
      }
    }

    loadSuppliers();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      const statusMatch = filter === "All" || supplier.status === filter || supplier.status_display === filter;
      const text = `${supplier.full_name} ${supplier.company_name}`.toLowerCase();
      return statusMatch && (!query || text.includes(query));
    });
  }, [filter, search, suppliers]);

  async function changeStatus(id, status) {
    try {
      await suppliersAPI.updateStatus(id, status);
      setSuppliers((prev) => prev.map((supplier) => (supplier.id === id ? { ...supplier, status } : supplier)));
      setToast({ message: status === "Approved" ? "Supplier approved" : "Supplier rejected", type: status === "Approved" ? "success" : "warning" });
    } catch (error) {
      console.error("Failed to update supplier status", error);
      setToast({ message: "Failed to update supplier status.", type: "error" });
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
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Registered</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <LoadingSkeleton rows={5} />
            ) : filtered.length === 0 ? (
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
                <td className="px-6 py-4 text-sm text-slate-600">{supplier.created_at?.slice(0, 10)}</td>
                <td className="px-6 py-4"><StatusBadge status={supplier.status || supplier.status_display} /></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => setViewingSupplier(supplier)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Eye className="h-4 w-4" /></button>
                    {supplier.status !== "Approved" && (
                      <button onClick={() => changeStatus(supplier.id, "approved")} className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-600">Approve</button>
                    )}
                    {supplier.status !== "Rejected" && (
                      <button onClick={() => changeStatus(supplier.id, "rejected")} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600">Reject</button>
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
            <p><span className="font-semibold">Registered Date:</span> {viewingSupplier.created_at?.slice(0, 10)}</p>
            <StatusBadge status={viewingSupplier.status || viewingSupplier.status_display} />
          </div>
        )}
      </Modal>

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
