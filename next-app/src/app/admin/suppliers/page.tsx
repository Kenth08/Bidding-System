"use client";
import { useState, useEffect, useMemo } from "react";
import { suppliersAPI } from "@/services/api";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";
import SupplierVerificationChecklist from "@/components/admin/SupplierVerificationChecklist";
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
  const [confirmAction, setConfirmAction] = useState<{ id: string; name: string; action: "approved" | "rejected" | "verify" | "reject_verification" } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
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
    setIsConfirmLoading(true);
    try {
      if (confirmAction.action === "verify" || confirmAction.action === "reject_verification") {
        // For qualification actions, we need to update verification_status (kept as internal field)
        await suppliersAPI.updateStatus(confirmAction.id, confirmAction.action === "verify" ? "verified" : "verification_rejected");
        setToast({ message: `Qualification ${confirmAction.action === "verify" ? "completed" : "rejected"}`, type: "success" });
      } else {
        // For regular status updates
        await suppliersAPI.updateStatus(confirmAction.id, confirmAction.action);
        setToast({ message: `Supplier ${confirmAction.action}`, type: "success" });
      }
      fetchData();
    } catch { setToast({ message: "Failed to update status", type: "error" }); }
    finally { setIsConfirmLoading(false); setConfirmAction(null); }
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
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Qualification Status</th>
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
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${s.verification_status === "verified" ? "bg-emerald-100 text-emerald-700" : s.verification_status === "verification_rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {s.verification_status || "pending"}
                    </span>
                  </td>
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
                { label: "Qualification Status", value: viewing.verification_status || "pending" },
                { label: "Registered", value: viewing.created_at ? new Date(viewing.created_at).toLocaleDateString() : "\u2014" },
                { label: "Verified At", value: viewing.verified_at ? new Date(viewing.verified_at).toLocaleDateString() : "\u2014" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400 mb-0.5">{label}</p><p className="text-sm font-semibold text-slate-800">{value}</p></div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Qualification Documents</p>
              <SupplierVerificationChecklist
                supplier={viewing}
                isEditing={true}
                onDocumentApprove={async (field, approve, reason) => {
                  try {
                    const docsRes = await (await import("@/services/api")).documentAPI.getAll();
                    const docs = Array.isArray(docsRes.data) ? docsRes.data : docsRes.data?.data || [];
                    const doc = docs.find((d: any) => d.user_id === viewing.id && d.document_type === field);
                    if (!doc) {
                      setToast({ message: "No uploaded document found for this field.", type: "error" });
                      return;
                    }
                    const payload: any = { verification_status: approve ? "Approved" : "Rejected" };
                    if (reason) payload.verification_notes = reason;
                    await (await import("@/services/api")).documentAPI.update(doc.id, payload);
                    setToast({ message: `Document ${approve ? "approved" : "flagged"}`, type: "success" });
                    fetchData();
                  } catch (e) {
                    setToast({ message: "Failed to update document", type: "error" });
                  }
                }}
                onDocumentFlagChange={async (field, reason) => {
                  try {
                    const docsRes = await (await import("@/services/api")).documentAPI.getAll();
                    const docs = Array.isArray(docsRes.data) ? docsRes.data : docsRes.data?.data || [];
                    const doc = docs.find((d: any) => d.user_id === viewing.id && d.document_type === field);
                    if (!doc) {
                      setToast({ message: "No uploaded document found to flag.", type: "error" });
                      return;
                    }
                    await (await import("@/services/api")).documentAPI.update(doc.id, { verification_notes: reason, verification_status: "Needs Revision" });
                    setToast({ message: "Flagged document for revision", type: "success" });
                    fetchData();
                  } catch (e) {
                    setToast({ message: "Failed to flag document", type: "error" });
                  }
                }}
              />
            </div>
            <div className="flex gap-3 pt-2">
              {viewing.status === "pending" && (
                <>
                  <button onClick={() => { setViewing(null); setConfirmAction({ id: viewing.id, name: viewing.company_name || viewing.full_name, action: "approved" }); }} className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors">Approve Supplier</button>
                  <button onClick={() => { setViewing(null); setConfirmAction({ id: viewing.id, name: viewing.company_name || viewing.full_name, action: "rejected" }); }} className="flex-1 rounded-xl bg-red-50 border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">Reject Supplier</button>
                </>
              )}
              {viewing.verification_status === "pending" && viewing.status === "approved" && (
                <>
                  <button onClick={() => { setViewing(null); setConfirmAction({ id: viewing.id, name: viewing.company_name || viewing.full_name, action: "verify" }); }} className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors">Qualify Documents</button>
                  <button onClick={() => { setViewing(null); setConfirmAction({ id: viewing.id, name: viewing.company_name || viewing.full_name, action: "reject_verification" }); }} className="flex-1 rounded-xl bg-orange-50 border border-orange-200 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-100 transition-colors">Reject Qualification</button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={Boolean(confirmAction)} onClose={() => setConfirmAction(null)} onConfirm={handleStatusChange} 
        title={confirmAction?.action === "approved" ? "Approve Supplier" : confirmAction?.action === "verify" ? "Qualify Documents" : confirmAction?.action === "reject_verification" ? "Reject Qualification" : "Reject Supplier"} 
        message={`Are you sure you want to ${confirmAction?.action === "approved" ? "approve" : confirmAction?.action === "verify" ? "qualify documents for" : confirmAction?.action === "reject_verification" ? "reject qualification for" : "reject"} "${confirmAction?.name}"?`} 
        confirmLabel={confirmAction?.action === "approved" ? "Approve" : confirmAction?.action === "verify" ? "Qualify" : confirmAction?.action === "reject_verification" ? "Reject" : "Reject"} 
        confirmVariant={confirmAction?.action === "approved" || confirmAction?.action === "verify" ? "primary" : "danger"} 
        isConfirmLoading={isConfirmLoading} />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
