"use client";
import { useState, useEffect, useMemo } from "react";
import { suppliersAPI } from "@/services/api";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import SearchBar from "@/components/shared/SearchBar";
import StatusBadge from "@/components/shared/StatusBadge";
import Toast from "@/components/shared/Toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { SkeletonTable } from "@/components/ui/Skeleton";

const TABS = ["All", "pending", "approved", "rejected"];

export default function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; name: string; action: "approved" | "rejected" } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchData = () => { setLoading(true); suppliersAPI.getAll().then((r) => { setSuppliers(Array.isArray(r.data.data) ? r.data.data : []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => suppliers.filter((s) => {
    const statusMatch = filter === "All" || s.status === filter;
    const q = search.toLowerCase();
    const searchMatch = !q || (s.company_name || "").toLowerCase().includes(q) || (s.full_name || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q);
    return statusMatch && searchMatch;
  }), [suppliers, filter, search]);

  async function handleStatusChange() {
    if (!confirmAction) return;
    try {
      await suppliersAPI.updateStatus(confirmAction.id, confirmAction.action);
      setToast({ message: `Supplier ${confirmAction.action}`, type: "success" });
      fetchData();
    } catch { setToast({ message: "Failed to update status", type: "error" }); }
    finally { setConfirmAction(null); }
  }

  if (loading) return <SkeletonTable />;

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${filter === t ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{t}</button>
        ))}
      </div>

      <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by company, name, or email" className="mb-4" />

      {filtered.length === 0 ? <EmptyState title="No suppliers found" /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <table className="w-full">
            <thead><tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Company</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Business Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Registered</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4"><p className="text-sm font-medium text-slate-800">{s.company_name || "\u2014"}</p><p className="text-xs text-slate-400">{s.email}</p></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{s.full_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{s.business_type || "\u2014"}</td>
                  <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{s.created_at ? new Date(s.created_at).toLocaleDateString() : "\u2014"}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setViewing(s)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50">View</button>
                      {s.status === "pending" && <>
                        <button onClick={() => setConfirmAction({ id: s.id, name: s.company_name || s.full_name, action: "approved" })} className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs text-emerald-600 hover:bg-emerald-100">Approve</button>
                        <button onClick={() => setConfirmAction({ id: s.id, name: s.company_name || s.full_name, action: "rejected" })} className="rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-100">Reject</button>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={Boolean(viewing)} onClose={() => setViewing(null)} title="Supplier Details" size="lg">
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Full Name", value: viewing.full_name },
                { label: "Email", value: viewing.email },
                { label: "Phone", value: viewing.phone || "\u2014" },
                { label: "Company Name", value: viewing.company_name || "\u2014" },
                { label: "Company Address", value: viewing.company_address || "\u2014" },
                { label: "Business Type", value: viewing.business_type || "\u2014" },
                { label: "Status", value: viewing.status },
                { label: "Registered", value: viewing.created_at ? new Date(viewing.created_at).toLocaleDateString() : "\u2014" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400 mb-0.5">{label}</p><p className="text-sm font-semibold text-slate-800">{value}</p></div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Verification Documents</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Business Permit", key: "business_permit_document" },
                  { label: "PhilGEPS Registration", key: "philgeps_registration" },
                  { label: "Tax Clearance", key: "tax_clearance" },
                  { label: "Valid ID", key: "valid_id" },
                ].map(({ label, key }) => {
                  const url = viewing[key];
                  return (
                    <div key={key} className={`flex items-center justify-between rounded-lg border p-3 ${url ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50"}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${url ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <span className="text-xs font-medium text-slate-700 truncate">{label}</span>
                      </div>
                      {url ? (
                        <div className="flex gap-1.5 shrink-0">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200 transition-colors">View</a>
                          <a href={url} download className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">Download</a>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not uploaded</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {viewing.status === "pending" && (
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setViewing(null); setConfirmAction({ id: viewing.id, name: viewing.company_name || viewing.full_name, action: "approved" }); }} className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">Approve Supplier</button>
                <button onClick={() => { setViewing(null); setConfirmAction({ id: viewing.id, name: viewing.company_name || viewing.full_name, action: "rejected" }); }} className="flex-1 rounded-xl bg-red-50 border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">Reject Supplier</button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={Boolean(confirmAction)} onClose={() => setConfirmAction(null)} onConfirm={handleStatusChange} title={confirmAction?.action === "approved" ? "Approve Supplier" : "Reject Supplier"} message={`Are you sure you want to ${confirmAction?.action === "approved" ? "approve" : "reject"} "${confirmAction?.name}"?`} confirmLabel={confirmAction?.action === "approved" ? "Approve" : "Reject"} confirmVariant={confirmAction?.action === "approved" ? "primary" : "danger"} />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
