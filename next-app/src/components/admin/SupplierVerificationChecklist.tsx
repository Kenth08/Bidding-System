import { AlertCircle, CheckCircle2, Clock3, FileText, Flag, Lock, Upload, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

export type SupplierDocumentState = "missing" | "uploaded" | "flagged" | "revised" | "approved";

export interface SupplierReviewDocument {
  id: string;
  name: string;
  category: "legal" | "financial" | "technical";
  required: boolean;
  uploaded: boolean;
  file: string | null;
  state: SupplierDocumentState;
  reason?: string | null;
  expiryDate?: string | null;
}

export interface SupplierActivityLogItem {
  id: string;
  message: string;
  createdAt: string;
  tone: "green" | "red" | "blue" | "amber";
}

interface SupplierVerificationChecklistProps {
  documents: SupplierReviewDocument[];
  accountLocked: boolean;
  notifSent: boolean;
  activityLog: SupplierActivityLogItem[];
  onApproveDocument: (documentId: string) => Promise<void> | void;
  onFlagDocument: (documentId: string, reason: string) => Promise<void> | void;
  onNotifySupplier: () => Promise<void> | void;
  onApproveAllUnlock: () => Promise<void> | void;
  isBusy?: boolean;
}

function Dot({ tone }: { tone: SupplierActivityLogItem["tone"] }) {
  const style = tone === "green"
    ? "bg-emerald-500"
    : tone === "red"
      ? "bg-red-500"
      : tone === "blue"
        ? "bg-blue-500"
        : "bg-amber-500";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${style}`} />;
}

function formatStatus(document: SupplierReviewDocument) {
  if (document.state === "approved") return "Approved";
  if (document.state === "flagged") return "Flagged";
  if (document.state === "revised") return "Revised - re-review";
  if (document.state === "uploaded") return "Uploaded";
  return document.required ? "Not uploaded - Required" : "Not uploaded";
}

function statusPillClass(state: SupplierDocumentState) {
  if (state === "approved") return "bg-emerald-100 text-emerald-700";
  if (state === "flagged") return "bg-red-100 text-red-700";
  if (state === "revised") return "bg-blue-100 text-blue-700";
  if (state === "uploaded") return "bg-slate-100 text-slate-700";
  return "bg-amber-100 text-amber-700";
}

function stateIcon(state: SupplierDocumentState) {
  if (state === "approved") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (state === "flagged") return <Flag className="h-4 w-4 text-red-600" />;
  if (state === "revised") return <Clock3 className="h-4 w-4 text-blue-600" />;
  if (state === "uploaded") return <FileText className="h-4 w-4 text-slate-600" />;
  return <XCircle className="h-4 w-4 text-amber-600" />;
}

function isRenderableFileUrl(file: unknown): file is string {
  return typeof file === "string" && file.trim().length > 0;
}

function getOverallStatus(documents: SupplierReviewDocument[]) {
  const required = documents.filter((doc) => doc.required);
  const missingRequired = required.some((doc) => !doc.uploaded);
  const allRequiredApproved = required.length > 0 && required.every((doc) => doc.state === "approved");
  const hasFlagged = documents.some((doc) => doc.state === "flagged");
  const allRequiredUploaded = required.every((doc) => doc.uploaded);

  if (allRequiredApproved) return { label: "Approved", className: "bg-emerald-100 text-emerald-700" };
  if (hasFlagged) return { label: "Documents Flagged", className: "bg-red-100 text-red-700" };
  if (!missingRequired && allRequiredUploaded) return { label: "Pending", className: "bg-blue-100 text-blue-700" };
  return { label: "Incomplete", className: "bg-amber-100 text-amber-700" };
}

export default function SupplierVerificationChecklist({
  documents,
  accountLocked,
  notifSent,
  activityLog,
  onApproveDocument,
  onFlagDocument,
  onNotifySupplier,
  onApproveAllUnlock,
  isBusy = false,
}: SupplierVerificationChecklistProps) {
  const [flagDrafts, setFlagDrafts] = useState<Record<string, string>>({});

  const stats = useMemo(() => {
    const total = documents.length;
    const uploaded = documents.filter((doc) => doc.uploaded).length;
    const approved = documents.filter((doc) => doc.state === "approved").length;
    const flagged = documents.filter((doc) => doc.state === "flagged").length;

    const now = Date.now();
    const soonLimit = now + 30 * 24 * 60 * 60 * 1000;
    const expiringSoon = documents.filter((doc) => {
      if (!doc.expiryDate) return false;
      const expiresAt = new Date(doc.expiryDate).getTime();
      return expiresAt >= now && expiresAt <= soonLimit;
    }).length;

    return { total, uploaded, approved, flagged, expiringSoon };
  }, [documents]);

  const flaggedDocuments = useMemo(
    () => documents.filter((doc) => doc.state === "flagged"),
    [documents]
  );

  const canNotifySupplier = flaggedDocuments.length > 0 && !notifSent;
  const canApproveAllUnlock = useMemo(() => {
    const required = documents.filter((doc) => doc.required);
    return required.length > 0 && required.every((doc) => doc.state === "approved");
  }, [documents]);

  const overall = getOverallStatus(documents);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard label="Uploaded" value={`${stats.uploaded}/${stats.total}`} tone="slate" />
        <StatCard label="Expiring Soon" value={String(stats.expiringSoon)} tone="amber" />
        <StatCard label="Flagged" value={String(stats.flagged)} tone="red" />
        <StatCard label="Approved" value={String(stats.approved)} tone="green" />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall Status</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${overall.className}`}>{overall.label}</span>
      </div>

      {accountLocked ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Supplier account is locked pending document revisions.</p>
              <p className="mt-1 text-xs text-amber-700">
                Documents requiring revision: {flaggedDocuments.length ? flaggedDocuments.map((doc) => doc.name).join(", ") : "None"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="divide-y divide-slate-200">
          {documents.map((document) => {
            const canApprove = document.uploaded && document.state !== "approved";
            const canFlag = document.uploaded && document.state !== "approved";
            const draftReason = flagDrafts[document.id] ?? document.reason ?? "";

            return (
              <div key={document.id} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {stateIcon(document.state)}
                      <p className="truncate text-sm font-semibold text-slate-900">{document.name}</p>
                      {!document.required ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">Optional</span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusPillClass(document.state)}`}>
                        {formatStatus(document)}
                      </span>
                      {isRenderableFileUrl(document.file) ? (
                        <a href={document.file} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-emerald-600 hover:underline">
                          View file
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">No file preview available</span>
                      )}
                    </div>
                    {document.state === "flagged" && document.reason ? (
                      <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <span className="font-semibold">Flag reason:</span> {document.reason}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!canApprove || isBusy}
                      onClick={() => onApproveDocument(document.id)}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={!canFlag || isBusy}
                      onClick={() => {
                        const reason = draftReason.trim();
                        if (!reason) return;
                        onFlagDocument(document.id, reason);
                      }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Flag
                    </button>
                  </div>
                </div>

                {canFlag ? (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={draftReason}
                      onChange={(event) => setFlagDrafts((prev) => ({ ...prev, [document.id]: event.target.value }))}
                      placeholder="Enter a reason before flagging"
                      className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-red-300"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          disabled={!canNotifySupplier || isBusy}
          onClick={() => onNotifySupplier()}
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Notify supplier of flagged documents
        </button>
        <button
          type="button"
          disabled={!canApproveAllUnlock || isBusy}
          onClick={() => onApproveAllUnlock()}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Approve all & unlock supplier
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Activity Log</p>
        </div>
        <div className="max-h-52 space-y-2 overflow-y-auto px-4 py-3">
          {activityLog.length === 0 ? (
            <p className="text-xs text-slate-400">No document activity yet.</p>
          ) : (
            activityLog.map((item) => (
              <div key={item.id} className="flex items-start gap-2 text-xs text-slate-600">
                <Dot tone={item.tone} />
                <div className="min-w-0 flex-1">
                  <p className="text-slate-700">{item.message}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <p>
            Notify button is enabled only when there are flagged documents and notification has not been sent. Final unlock is enabled only when all required documents are approved.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "slate" | "amber" | "red" | "green" }) {
  const classes = tone === "amber"
    ? "border-amber-200 bg-amber-50 text-amber-900"
    : tone === "red"
      ? "border-red-200 bg-red-50 text-red-900"
      : tone === "green"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : "border-slate-200 bg-slate-50 text-slate-900";

  return (
    <div className={`rounded-xl border px-3 py-2 ${classes}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
