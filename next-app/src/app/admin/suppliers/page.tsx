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
  const [documentWorkflow, setDocumentWorkflow] = useState<any | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [detailBusy, setDetailBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ id: string; name: string; action: "approved" | "rejected" | "verify" | "reject_verification" } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchData = () => { setLoading(true); suppliersAPI.getAll().then((r) => { setSuppliers(Array.isArray(r.data.data) ? r.data.data : []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() => suppliers.filter((s) => {
    const statusMatch = filter === "All" || s.status === filter;
    const q = search.toLowerCase();
    const searchMatch = !q || (s.company_name || "").toLowerCase().includes(q) || (s.full_name || "").toLowerCase().includes(q);
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
      if (viewing && confirmAction.id === viewing.id) {
        setViewing(null);
        setDocumentWorkflow(null);
      }
    } catch {
      setToast({ message: "Failed to update status", type: "error" });
    } finally {
      setIsConfirmLoading(false);
      setConfirmAction(null);
    }
  }

  async function loadDocumentWorkflow(supplierId: string) {
    setWorkflowLoading(true);
    try {
      const res = await suppliersAPI.getDocumentWorkflow(supplierId);
      setDocumentWorkflow(res.data);
    } catch {
      setDocumentWorkflow(null);
      setToast({ message: "Failed to load supplier documents.", type: "error" });
    } finally {
      setWorkflowLoading(false);
    }
  }

  useEffect(() => {
    if (!viewing) {
      setDocumentWorkflow(null);
      return;
    }
    loadDocumentWorkflow(viewing.id);
  }, [viewing]);

  async function handleApproveDocument(documentId: string) {
    if (!viewing) return;
    setDetailBusy(true);
    try {
      await suppliersAPI.reviewDocument(viewing.id, documentId, "approve");
      setToast({ message: "Document approved.", type: "success" });
      await loadDocumentWorkflow(viewing.id);
    } catch {
      setToast({ message: "Failed to approve document.", type: "error" });
    } finally {
      setDetailBusy(false);
    }
  }

  async function handleFlagDocument(documentId: string, reason: string) {
    if (!viewing) return;
    setDetailBusy(true);
    try {
      await suppliersAPI.reviewDocument(viewing.id, documentId, "flag", reason);
      setToast({ message: "Document marked for revision.", type: "success" });
      await loadDocumentWorkflow(viewing.id);
    } catch {
      setToast({ message: "Failed to mark document for revision.", type: "error" });
    } finally {
      setDetailBusy(false);
    }
  }

  async function handleNotifySupplier() {
    if (!viewing) return;
    setDetailBusy(true);
    try {
      await suppliersAPI.notifyFlagged(viewing.id);
      setToast({ message: "Supplier notified of flagged documents.", type: "success" });
      await loadDocumentWorkflow(viewing.id);
    } catch {
      setToast({ message: "Failed to notify supplier.", type: "error" });
    } finally {
      setDetailBusy(false);
    }
  }

  async function handleApproveAllUnlock() {
    if (!viewing) return;
    setDetailBusy(true);
    try {
      await suppliersAPI.approveAllUnlock(viewing.id);
      setToast({ message: "All required documents approved and supplier unlocked.", type: "success" });
      await loadDocumentWorkflow(viewing.id);
      fetchData();
    } catch {
      setToast({ message: "Failed to unlock supplier.", type: "error" });
    } finally {
      setDetailBusy(false);
    }
  }

  if (loading) return <SkeletonTable />;

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize ${filter === t ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{t}</button>
        ))}
      </div>

      <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by company or name" className="mb-4" />

      {filtered.length === 0 ? <EmptyState title="No suppliers found" /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <table className="w-full">
            <thead><tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Company</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Business Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Qualification Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Email Verified</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Registered</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4"><p className="text-sm font-medium text-slate-800">{s.company_name || "\u2014"}</p></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{s.full_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{s.supplier_business_types?.length ? s.supplier_business_types.map((sbt: any) => sbt.business_type?.name).join(", ") : s.business_type || "\u2014"}</td>
                  <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${s.verification_status === "verified" ? "bg-emerald-100 text-emerald-700" : s.verification_status === "verification_rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {s.verification_status || "pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${s.email_verified ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {s.email_verified ? "Verified" : "Not Verified"}
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

      <Modal isOpen={Boolean(viewing)} onClose={() => setViewing(null)} title="Supplier Details" size="xlwide">
        {viewing && (
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
            {/* Basic Information */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Basic Information</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Full Name", value: viewing.full_name },
                  { label: "Email", value: viewing.email },
                  { label: "Phone", value: viewing.phone || "\u2014" },
                  { label: "Company Name", value: viewing.company_name || "\u2014" },
                  { label: "TIN", value: viewing.tin || "\u2014" },
                  { label: "Representative", value: viewing.representative_name || "\u2014" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400 mb-0.5">{label}</p><p className="text-sm font-semibold text-slate-800">{value}</p></div>
                ))}
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-400 mb-2">Business Types</p>
                <div className="flex flex-wrap gap-2">
                  {viewing.supplier_business_types?.length ? (
                    viewing.supplier_business_types.map((sbt: any) => (
                      <span key={sbt.business_type?.id || sbt.business_type?.name} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">{sbt.business_type?.name}</span>
                    ))
                  ) : viewing.business_type ? (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">{viewing.business_type}</span>
                  ) : (
                    <span className="text-sm text-slate-500">No business type selected</span>
                  )}
                </div>
              </div>
            </div>

            {/* Company Profile */}
            {viewing.company_profile && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Company Profile</p>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewing.company_profile}</p>
                </div>
              </div>
            )}

            {/* Track Record */}
            {viewing.track_record_description && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Track Record</p>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewing.track_record_description}</p>
                </div>
              </div>
            )}

            {/* Status & Dates */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Account Status</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Status", value: viewing.status },
                  { label: "Qualification Status", value: viewing.verification_status || "pending" },
                  { label: "Email Verified", value: viewing.email_verified ? "Verified" : "Not Verified" },
                  { label: "Registered", value: viewing.created_at ? new Date(viewing.created_at).toLocaleDateString() : "\u2014" },
                  { label: "Blacklisting Declaration", value: viewing.not_blacklisted_declaration ? "Confirmed" : "Not Confirmed" },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400 mb-0.5">{label}</p><p className="text-sm font-semibold text-slate-800">{value}</p></div>
                ))}
              </div>
            </div>

            {/* Document Review Workflow */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Document Review Workflow</p>
              {workflowLoading ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Loading document review workflow…</div>
              ) : (
                <SupplierVerificationChecklist
                  documents={documentWorkflow?.documents ?? []}
                  accountLocked={documentWorkflow?.accountLocked ?? false}
                  notifSent={documentWorkflow?.notifSent ?? false}
                  activityLog={documentWorkflow?.activityLog ?? []}
                  onApproveDocument={handleApproveDocument}
                  onFlagDocument={handleFlagDocument}
                  onNotifySupplier={handleNotifySupplier}
                  onApproveAllUnlock={handleApproveAllUnlock}
                  isBusy={detailBusy}
                />
              )}
            </div>

            {/* Action Buttons */}
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
