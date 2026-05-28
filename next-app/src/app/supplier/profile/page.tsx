"use client";
import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Clock3, Upload } from "lucide-react";
import { authAPI, suppliersAPI } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { User } from "@/types/user";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Toast from "@/components/shared/Toast";
import LoadingButton from "@/components/ui/LoadingButton";

const FIELDS = [
  { key: "full_name", label: "Full Name", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "representative_name", label: "Representative Name", type: "text" },
  { key: "tin", label: "TIN", type: "text" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "company_name", label: "Company Name", type: "text" },
  { key: "company_address", label: "Company Address", type: "text" },
  { key: "business_type", label: "Business Type", type: "text" },
] as const;

type FormData = Pick<User, "full_name" | "email" | "representative_name" | "tin" | "phone" | "company_name" | "company_address" | "business_type" | "company_profile">;

interface SupplierDocWorkflowItem {
  id: string;
  name: string;
  required: boolean;
  uploaded: boolean;
  file: string | null;
  state: "missing" | "uploaded" | "flagged" | "revised" | "approved";
  reason?: string | null;
}

export default function SupplierProfile() {
  const { setUser } = useAuthStore();
  const [form, setForm] = useState<FormData>({ full_name: "", email: "", representative_name: "", tin: "", phone: "", company_name: "", company_address: "", business_type: "", company_profile: "" });
  const [loading, setLoading] = useState(true);
  const [confirmSave, setConfirmSave] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [documents, setDocuments] = useState<SupplierDocWorkflowItem[]>([]);
  const [accountLocked, setAccountLocked] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [isResubmitting, setIsResubmitting] = useState<Record<string, boolean>>({});

  async function loadDocumentWorkflow() {
    try {
      const response = await suppliersAPI.getMyDocumentWorkflow();
      setDocuments(Array.isArray(response.data?.documents) ? response.data.documents : []);
      setAccountLocked(Boolean(response.data?.accountLocked));
    } catch {
      setDocuments([]);
      setAccountLocked(false);
    }
  }

  useEffect(() => {
    authAPI.me().then((r) => {
      const u = r.data;
      setForm({ full_name: u.full_name, email: u.email, representative_name: u.representative_name || "", tin: u.tin || "", phone: u.phone || "", company_name: u.company_name || "", company_address: u.company_address || "", business_type: u.business_type || "", company_profile: u.company_profile || "" });
    }).catch(() => {}).finally(() => setLoading(false));

    loadDocumentWorkflow();
  }, []);

  async function handleConfirmSave() {
    setIsConfirmLoading(true);
    try {
      const res = await authAPI.updateProfile(form);
      setUser(res.data);
      setToast({ message: "Profile updated successfully.", type: "success" });
    } catch {
      setToast({ message: "Failed to update profile.", type: "error" });
    } finally {
      setIsConfirmLoading(false);
      setConfirmSave(false);
    }
  }

  async function handleResubmit(documentId: string) {
    const file = selectedFiles[documentId];
    if (!file) {
      setToast({ message: "Please choose a file before resubmitting.", type: "error" });
      return;
    }

    setIsResubmitting((prev) => ({ ...prev, [documentId]: true }));
    try {
      const payload = new FormData();
      payload.append("file", file);
      await suppliersAPI.resubmitDocument(documentId, payload);
      setToast({ message: "Document resubmitted. Please wait for admin re-review.", type: "success" });
      setSelectedFiles((prev) => ({ ...prev, [documentId]: null }));
      await loadDocumentWorkflow();
    } catch (error: any) {
      setToast({ message: error?.response?.data?.error || "Failed to resubmit document.", type: "error" });
    } finally {
      setIsResubmitting((prev) => ({ ...prev, [documentId]: false }));
    }
  }

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-12 rounded-xl bg-slate-100" /><div className="h-12 rounded-xl bg-slate-100" /></div>;
  }

  const flaggedOrRevised = documents.filter((doc) => doc.state === "flagged" || doc.state === "revised");

  return (
    <div className="space-y-6">
      {accountLocked ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Your account is temporarily locked while document revisions are pending.</p>
              <p className="mt-1 text-xs text-amber-700">Please resubmit the flagged documents below, then wait for admin approval.</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <form onSubmit={(e) => { e.preventDefault(); setConfirmSave(true); }} className="space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs font-medium text-slate-700">{f.label}</label>
              <input type={f.type} value={String(form[f.key] ?? "")} onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Company Profile</label>
            <textarea value={String(form.company_profile ?? "")} onChange={(e) => setForm((prev) => ({ ...prev, company_profile: e.target.value }))} rows={4} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <LoadingButton type="submit" isLoading={false} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">Save Changes</LoadingButton>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Qualification Documents</h2>
          <p className="text-xs text-slate-500">Resubmit flagged documents for admin re-review</p>
        </div>

        {flaggedOrRevised.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No document revisions required right now.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {flaggedOrRevised.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{doc.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${doc.state === "flagged" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                        {doc.state === "flagged" ? "Flagged" : "Revised - re-review"}
                      </span>
                      {doc.file ? (
                        <a href={doc.file} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-emerald-600 hover:underline">
                          View current file
                        </a>
                      ) : null}
                    </div>
                    {doc.reason ? (
                      <p className="mt-2 text-xs text-red-700">Reason: {doc.reason}</p>
                    ) : null}
                  </div>
                  {doc.state === "revised" ? <Clock3 className="h-4 w-4 text-blue-600" /> : <CheckCircle2 className="h-4 w-4 text-red-600" />}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <Upload className="h-3.5 w-3.5" />
                    <span>{selectedFiles[doc.id]?.name || "Choose file"}</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setSelectedFiles((prev) => ({ ...prev, [doc.id]: file }));
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!selectedFiles[doc.id] || Boolean(isResubmitting[doc.id])}
                    onClick={() => handleResubmit(doc.id)}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isResubmitting[doc.id] ? "Submitting..." : "Resubmit"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog isOpen={confirmSave} onClose={() => setConfirmSave(false)} onConfirm={handleConfirmSave} title="Save Profile Changes" message="Are you sure you want to update your profile information?" confirmLabel="Save Changes" isConfirmLoading={isConfirmLoading} />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
