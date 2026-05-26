"use client";
import { CheckCircle2, Clock, FileText, X, Flag } from "lucide-react";
import { useState } from "react";

interface DocumentChecklistItem {
  key: string;
  label: string;
  fileField?: string;
  expiryField?: string;
  isRequired: boolean;
}

interface SupplierVerificationChecklistProps {
  supplier: any;
  onDocumentApprove: (field: string) => Promise<void>;
  onDocumentFlag: (field: string, reason: string) => Promise<void>;
  isEditing?: boolean;
}

const DOCUMENT_CHECKLIST: DocumentChecklistItem[] = [
  { key: "sec_dti_certificate", label: "SEC/DTI Certificate", fileField: "sec_dti_certificate", isRequired: true },
  { key: "mayors_permit", label: "Mayor's Permit", fileField: "mayors_permit", expiryField: "mayors_permit_expiry", isRequired: true },
  { key: "tax_clearance", label: "Tax Clearance", fileField: "tax_clearance", expiryField: "tax_clearance_expiry", isRequired: true },
  { key: "philgeps_registration", label: "PhilGEPS Registration", fileField: "philgeps_registration", isRequired: true },
  { key: "blacklisting_declaration", label: "Blacklisting Declaration", fileField: "blacklisting_declaration_document", isRequired: true },
  { key: "past_contracts_document", label: "Past Contracts / Purchase Orders", fileField: "past_contracts_document", isRequired: true },
  { key: "performance_certificates", label: "Performance Certificates / ISO Certifications", fileField: "performance_certificates", isRequired: true },
  { key: "audited_financial_statements", label: "Audited Financial Statements", fileField: "audited_financial_statements", isRequired: true },
  { key: "bank_reference_document", label: "Bank Reference Letter", fileField: "bank_reference_document", isRequired: true },
  { key: "valid_id", label: "Valid ID", fileField: "valid_id", isRequired: true },
  { key: "representative_authorization_document", label: "Representative Authorization Letter", fileField: "representative_authorization_document", isRequired: true },
];

function DocumentChecklistRow({
  item,
  supplier,
  isApproved,
  isFlagged,
  flagReason,
  onApprove,
  onFlag,
  isEditing,
}: {
  item: DocumentChecklistItem;
  supplier: any;
  isApproved: boolean;
  isFlagged: boolean;
  flagReason: string;
  onApprove: () => void;
  onFlag: (reason: string) => void;
  isEditing: boolean;
}) {
  const [showFlagReason, setShowFlagReason] = useState(false);
  const [reason, setReason] = useState(flagReason || "");

  const fileUrl = item.fileField ? supplier[item.fileField] : null;
  const hasFile = !!fileUrl;
  const expiryDate = item.expiryField ? supplier[item.expiryField] : null;
  const isExpired = expiryDate && new Date(expiryDate) < new Date();
  const isExpiringSoon = expiryDate && new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && !isExpired;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 mb-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isApproved ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : isFlagged ? (
              <Flag className="h-5 w-5 text-red-600" />
            ) : isExpired ? (
              <X className="h-5 w-5 text-red-600" />
            ) : isExpiringSoon ? (
              <Clock className="h-5 w-5 text-amber-600" />
            ) : (
              <FileText className="h-5 w-5 text-slate-400" />
            )}
            <span className="font-semibold text-slate-900">{item.label}</span>
            {item.isRequired && <span className="text-red-600 text-xs font-bold">*</span>}
          </div>

          {hasFile && (
            <p className="text-sm text-slate-600 mb-2">
              📎 File:{" "}
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                View Document
              </a>
            </p>
          )}

          {expiryDate && (
            <p className={`text-sm mb-2 ${isExpired ? "text-red-600 font-semibold" : isExpiringSoon ? "text-amber-600 font-semibold" : "text-slate-600"}`}>
              {isExpired ? "❌ EXPIRED: " : isExpiringSoon ? "⚠️ EXPIRING SOON: " : "📅 Expires: "}
              {new Date(expiryDate).toLocaleDateString()}
            </p>
          )}

          {isFlagged && flagReason && (
            <p className="text-sm text-red-600 italic mt-2">
              <strong>Flag reason:</strong> {flagReason}
            </p>
          )}

          {showFlagReason && isEditing && (
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for flagging this document..."
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              rows={2}
            />
          )}
        </div>

        {isEditing && (
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              disabled={isFlagged}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isApproved
                  ? "bg-emerald-100 text-emerald-700 cursor-default"
                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              Approve
            </button>
            <button
              onClick={() => {
                if (showFlagReason) {
                  onFlag(reason);
                  setShowFlagReason(false);
                } else {
                  setShowFlagReason(true);
                }
              }}
              disabled={isApproved}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isFlagged
                  ? "bg-red-100 text-red-700 cursor-default"
                  : "bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {showFlagReason ? "Save Flag" : "Flag"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function SupplierVerificationChecklist({
  supplier,
  onDocumentApprove,
  onDocumentFlag,
  isEditing = true,
}: SupplierVerificationChecklistProps) {
  const [approvedDocs, setApprovedDocs] = useState<Set<string>>(new Set());
  const [flaggedDocs, setFlaggedDocs] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const approved = approvedDocs.size;
  const flagged = flaggedDocs.size;
  const total = DOCUMENT_CHECKLIST.filter((d) => d.isRequired).length;
  const uploaded = DOCUMENT_CHECKLIST.filter((d) => supplier[d.fileField || ""]).length;
  const expiring = DOCUMENT_CHECKLIST.filter((d) => {
    const expiry = supplier[d.expiryField || ""];
    return expiry && new Date(expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }).length;
  const expired = DOCUMENT_CHECKLIST.filter((d) => {
    const expiry = supplier[d.expiryField || ""];
    return expiry && new Date(expiry) < new Date();
  }).length;

  const handleApprove = async (field: string) => {
    setIsLoading(true);
    try {
      await onDocumentApprove(field);
      setApprovedDocs((p) => new Set([...p, field]));
      setFlaggedDocs((p) => {
        const next = new Map(p);
        next.delete(field);
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlag = async (field: string, reason: string) => {
    setIsLoading(true);
    try {
      await onDocumentFlag(field, reason);
      setFlaggedDocs((p) => new Map(p).set(field, reason));
      setApprovedDocs((p) => {
        const next = new Set(p);
        next.delete(field);
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{uploaded}</p>
          <p className="text-xs text-slate-600 mt-1">Documents Uploaded</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{expiring}</p>
          <p className="text-xs text-amber-700 mt-1">Expiring Soon</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{expired}</p>
          <p className="text-xs text-red-700 mt-1">Expired</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{approved}</p>
          <p className="text-xs text-emerald-700 mt-1">Approved</p>
        </div>
      </div>

      {/* Document Checklist */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-4">Document Verification Checklist</h3>
        {DOCUMENT_CHECKLIST.filter((d) => d.isRequired).map((item) => (
          <DocumentChecklistRow
            key={item.key}
            item={item}
            supplier={supplier}
            isApproved={approvedDocs.has(item.fileField || "")}
            isFlagged={flaggedDocs.has(item.fileField || "")}
            flagReason={flaggedDocs.get(item.fileField || "") || ""}
            onApprove={() => handleApprove(item.fileField || "")}
            onFlag={(reason) => handleFlag(item.fileField || "", reason)}
            isEditing={isEditing}
          />
        ))}
      </div>

      {/* Approval Status */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-600">
          {approved === total ? (
            <span className="text-emerald-600 font-semibold">✓ All required documents approved</span>
          ) : approved === 0 ? (
            <span className="text-slate-600">No documents approved yet</span>
          ) : (
            <span className="text-amber-600 font-semibold">{approved}/{total} documents approved</span>
          )}
        </p>
      </div>
    </div>
  );
}
