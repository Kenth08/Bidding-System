"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Clock3, Upload } from "lucide-react";
import { suppliersAPI } from "@/services/api";
import Toast from "@/components/shared/Toast";
import LoadingButton from "@/components/ui/LoadingButton";

interface SupplierDocWorkflowItem {
  id: string;
  name: string;
  required: boolean;
  declarationOnly?: boolean;
  uploaded: boolean;
  file: string | null;
  state: "missing" | "uploaded" | "flagged" | "revised" | "approved";
  adminComment?: string | null;
  reason?: string | null;
}

export default function SupplierDocumentReuploadPage() {
  const [documents, setDocuments] = useState<SupplierDocWorkflowItem[]>([]);
  const [accountLocked, setAccountLocked] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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
    loadDocumentWorkflow().finally(() => setLoading(false));
  }, []);

  async function handleSubmitRevision() {
    setIsSubmittingRevision(true);
    try {
      const flagged = documents.filter((doc) => doc.state === "flagged");
      const missing = flagged.filter((doc) => !doc.declarationOnly && !selectedFiles[doc.id]);
      if (missing.length > 0) {
        setToast({ message: "Please choose a file for every flagged document before submitting.", type: "error" });
        return;
      }

      for (const doc of flagged) {
        const file = selectedFiles[doc.id];
        const payload = new FormData();
        if (file) payload.append("file", file);
        console.log('Resubmitting document', doc.id, file?.name, file?.size);
        const res = await suppliersAPI.resubmitDocument(doc.id, payload);
        if (res?.data?.forceLogout) {
          try {
            await fetch("/api/auth/logout", { method: "POST" });
          } catch {}
          window.location.href = "/login?error=submitted_review";
          return;
        }
      }

      const res = await suppliersAPI.submitRevision();
      setToast({ message: res?.data?.message || "Revision submitted.", type: "success" });
      if (res?.data?.forceLogout) {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {}
        window.location.href = "/login?error=submitted_review";
        return;
      }
      await loadDocumentWorkflow();
    } catch (error: any) {
      setToast({ message: error?.response?.data?.error || "Failed to submit revision.", type: "error" });
    } finally {
      setIsSubmittingRevision(false);
    }
  }

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-16 rounded-2xl bg-slate-100" /><div className="h-16 rounded-2xl bg-slate-100" /></div>;
  }

  const flaggedDocs = documents.filter((doc) => doc.state === "flagged");
  const pendingReviewDocs = documents.filter((doc) => doc.state === "revised");
  const approvedDocs = documents.filter((doc) => doc.state === "approved");
  const readyToSubmit = flaggedDocs.length > 0 && flaggedDocs.every((doc) => doc.declarationOnly || Boolean(selectedFiles[doc.id]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Your account has flagged verification documents. Please re-upload the required files before participating in bidding.</p>
            <p className="mt-1 text-xs text-amber-700">After you re-upload, admin will review the documents again automatically.</p>
          </div>
        </div>
      </div>

      {accountLocked ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Supplier access is restricted until the flagged documents are re-reviewed.
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Re-upload flagged documents</h2>
          <p className="text-xs text-slate-500">Only flagged documents can be re-uploaded.</p>
        </div>

        {flaggedDocs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No flagged documents need re-upload right now.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {flaggedDocs.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{doc.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{doc.reason || doc.adminComment || "Please upload an updated file for review."}</p>
                  </div>
                  <AlertCircle className="h-4 w-4 text-red-600" />
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
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 border-t border-slate-200 pt-4">
          <LoadingButton
            type="button"
            isLoading={isSubmittingRevision}
            disabled={flaggedDocs.length === 0 || !readyToSubmit || isSubmittingRevision}
            onClick={handleSubmitRevision}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit all corrected documents
          </LoadingButton>
          {flaggedDocs.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              There are no flagged documents to re-upload right now.
            </p>
          ) : !readyToSubmit ? (
            <p className="mt-2 text-xs text-slate-500">
              Choose a file for every flagged document, then submit once to upload them all for review.
            </p>
          ) : null}
        </div>
      </div>

      {pendingReviewDocs.length > 0 ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <h3 className="text-sm font-semibold text-blue-900">Pending review</h3>
          <ul className="mt-2 space-y-1 text-xs text-blue-800">
            {pendingReviewDocs.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5" />
                <span>{doc.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {approvedDocs.length > 0 ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <h3 className="text-sm font-semibold text-emerald-900">Approved documents</h3>
          <ul className="mt-2 space-y-1 text-xs text-emerald-800">
            {approvedDocs.map((doc) => (
              <li key={doc.id}>{doc.name}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}