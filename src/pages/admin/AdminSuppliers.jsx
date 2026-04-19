// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\admin\AdminSuppliers.jsx
import { useEffect, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import SectionHeader from "../../components/shared/SectionHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import TableWrapper from "../../components/shared/TableWrapper";
import { getAllSuppliers, updateSupplierStatus } from "../../services/authService";

export default function AdminSuppliers({ suppliers, setSuppliers, supplierSearch, setSupplierSearch }) {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const normalizedQuery = supplierSearch.trim().toLowerCase();
  const filteredSuppliers = suppliers.filter((supplier) =>
    String(supplier.full_name || supplier.name || "").toLowerCase().includes(normalizedQuery)
  );

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const { data, error } = await getAllSuppliers();
      if (!error) {
        setSuppliers(data);
      }
      setIsLoading(false);
    }

    load();
  }, []);

  async function handleApprove(id) {
    const { success } = await updateSupplierStatus(id, "Approved");
    if (success) {
      setSuppliers((prev) => prev.map((supplier) => (supplier.id === id ? { ...supplier, status: "Approved" } : supplier)));
    }
  }

  async function handleReject(id) {
    const { success } = await updateSupplierStatus(id, "Rejected");
    if (success) {
      setSuppliers((prev) => prev.map((supplier) => (supplier.id === id ? { ...supplier, status: "Rejected" } : supplier)));
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <SectionHeader title="Suppliers" subtitle="Manage and approve registered suppliers" />
        <SearchBar
          value={supplierSearch}
          onChange={(event) => setSupplierSearch(event.target.value)}
          placeholder="Search supplier by name..."
        />
      </div>

      <TableWrapper>
        {isLoading ? (
          <LoadingSkeleton rows={5} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Supplier Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Registered Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
              {filteredSuppliers.length ? (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="transition-colors duration-100 hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{supplier.full_name || supplier.name || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{supplier.company_name || supplier.company || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{supplier.email || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{supplier.created_at || supplier.registeredDate || "-"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={supplier.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(supplier.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 px-3 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(supplier.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSupplier(supplier)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-slate-50"
                        >
                          View Details
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
        isOpen={Boolean(selectedSupplier)}
        onClose={() => setSelectedSupplier(null)}
        title="Supplier Details"
        subtitle="Review supplier profile and registration info"
      >
        {selectedSupplier ? (
          <div className="space-y-2 text-sm text-slate-600">
            <p><span className="font-semibold text-slate-800">Name:</span> {selectedSupplier.full_name || selectedSupplier.name || "-"}</p>
            <p><span className="font-semibold text-slate-800">Company:</span> {selectedSupplier.company_name || selectedSupplier.company || "-"}</p>
            <p><span className="font-semibold text-slate-800">Email:</span> {selectedSupplier.email || "-"}</p>
            <p><span className="font-semibold text-slate-800">Registered Date:</span> {selectedSupplier.created_at || selectedSupplier.registeredDate || "-"}</p>
            <div className="pt-2">
              <StatusBadge status={selectedSupplier.status} />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
