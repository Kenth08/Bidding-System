import { AlertCircle, CheckCircle2, Clock, FileCheck, FileText, Upload, X } from "lucide-react";
import { useState } from "react";

interface DocumentChecklistItem {
  id: string;
  label: string;
  field: string;
  fileValue: string | null;
  expiryDate?: string | null;
  expiryField?: string;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  isApproved?: boolean;
  flagReason?: string;
}

interface SupplierVerificationChecklistProps {
  supplier: any;
  onDocumentApprove: (field: string, approve: boolean, reason?: string) => void;
  onDocumentFlagChange?: (field: string, reason: string) => void;
  isEditing?: boolean;
}

export default function SupplierVerificationChecklist({
  supplier,
  onDocumentApprove,
  onDocumentFlagChange,
  isEditing = false,
}: SupplierVerificationChecklistProps) {
  const today = new Date();
  const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const isDocExpired = (dateStr: string | null) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDocExpiringSoon = (dateStr: string | null) => {
    if (!dateStr || isDocExpired(dateStr)) return false;
    const date = new Date(dateStr);
    return date <= in30Days;
  };

  const documents: DocumentChecklistItem[] = [
    // Legal Documents
    {
      id: "sec-dti",
      label: "SEC or DTI Certificate",
      field: "sec_dti_certificate",
      fileValue: supplier?.sec_dti_certificate,
    },
    {
      id: "mayors-permit",
      label: "Mayor's Permit / Business Permit",
      field: "mayors_permit",
      fileValue: supplier?.mayors_permit,
      expiryDate: supplier?.mayors_permit_expiry,
      expiryField: "mayors_permit_expiry",
      isExpired: isDocExpired(supplier?.mayors_permit_expiry),
      isExpiringSoon: isDocExpiringSoon(supplier?.mayors_permit_expiry),
    },
    {
      id: "philgeps",
      label: "PhilGEPS Registration",
      field: "philgeps_registration",
      fileValue: supplier?.philgeps_registration,
    },
    {
      id: "valid-id",
      label: "Valid ID (Government-Issued)",
      field: "valid_id",
      fileValue: supplier?.valid_id,
    },
    // Financial Documents
    {
      id: "tax-clearance",
      label: "Tax Clearance Certificate",
      field: "tax_clearance",
      fileValue: supplier?.tax_clearance,
      expiryDate: supplier?.tax_clearance_expiry,
      expiryField: "tax_clearance_expiry",
      isExpired: isDocExpired(supplier?.tax_clearance_expiry),
      isExpiringSoon: isDocExpiringSoon(supplier?.tax_clearance_expiry),
    },
    {
      id: "financial-statements",
      label: "Audited Financial Statements",
      field: "audited_financial_statements",
      fileValue: supplier?.audited_financial_statements,
    },
    {
      id: "bank-reference",
      label: "Bank Reference Letter or Credit Report",
      field: "bank_reference_document",
      fileValue: supplier?.bank_reference_document,
    },
    // Qualifications & Track Record
    {
      id: "performance-certs",
      label: "Performance Certificates / ISO Certifications",
      field: "performance_certificates",
      fileValue: supplier?.performance_certificates,
    },
    {
      id: "past-contracts",
      label: "Similar Past Contracts or Purchase Orders",
      field: "past_contracts_document",
      fileValue: supplier?.past_contracts_document,
    },
    // Representative & Declarations
    {
      id: "representative-auth",
      label: "Representative Authorization / SPA",
      field: "representative_authorization_document",
      fileValue: supplier?.representative_authorization_document,
    },
    {
      id: "not-blacklisted",
      label: "Good Standing Declaration (Not Blacklisted)",
      field: "not_blacklisted_declaration",
      fileValue: supplier?.not_blacklisted_declaration ? "DECLARED" : null,
    },
  ];

  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [flaggedDocs, setFlaggedDocs] = useState<Record<string, string>>({});

  const handleFlagChange = (field: string, reason: string) => {
    setFlaggedDocs((prev) => ({
      ...prev,
      [field]: reason,
    }));
    onDocumentFlagChange?.(field, reason);
  };

  const handleApproveDocument = (field: string) => {
    onDocumentApprove(field, true);
    setFlaggedDocs((prev) => {
      const newFlagged = { ...prev };
      delete newFlagged[field];
      return newFlagged;
    });
  };

  const handleFlagDocument = (field: string) => {
    const reason = flaggedDocs[field] || "Does not meet requirements";
    onDocumentApprove(field, false, reason);
  };

  const requiredCount = documents.length;
  const uploadedCount = documents.filter((d) => d.fileValue).length;
  const expiredCount = documents.filter((d) => d.isExpired).length;
  const expiringSoonCount = documents.filter((d) => d.isExpiringSoon).length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs text-slate-500 font-medium">UPLOADED</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {uploadedCount}/{requiredCount}
          </p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs text-yellow-700 font-medium">EXPIRING SOON</p>
          <p className="mt-1 text-2xl font-bold text-yellow-900">{expiringSoonCount}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-700 font-medium">EXPIRED</p>
          <p className="mt-1 text-2xl font-bold text-red-900">{expiredCount}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs text-emerald-700 font-medium">STATUS</p>
          <p className="mt-1 text-sm font-bold text-emerald-900">
            {supplier?.verification_status ? supplier.verification_status.toUpperCase() : "PENDING"}
          </p>
        </div>
      </div>

      {/* Document Checklist */}
      <div className="space-y-2">
        <h3 className="font-semibold text-slate-900 text-sm">Required Documents Checklist</h3>

        {/* Legal Documents Section */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900">Legal Documents</h4>
          </div>
          <div className="divide-y divide-slate-200">
            {documents
              .slice(0, 4)
              .map((doc) => (
                <DocumentChecklistRow
                  key={doc.id}
                  doc={doc}
                  expanded={expandedDoc === doc.id}
                  onExpand={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                  flagReason={flaggedDocs[doc.field]}
                  onFlagChange={(reason) => handleFlagChange(doc.field, reason)}
                  onApprove={() => handleApproveDocument(doc.field)}
                  onFlag={() => handleFlagDocument(doc.field)}
                  isEditing={isEditing}
                />
              ))}
          </div>
        </div>

        {/* Financial Documents Section */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900">Financial Documents</h4>
          </div>
          <div className="divide-y divide-slate-200">
            {documents
              .slice(4, 7)
              .map((doc) => (
                <DocumentChecklistRow
                  key={doc.id}
                  doc={doc}
                  expanded={expandedDoc === doc.id}
                  onExpand={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                  flagReason={flaggedDocs[doc.field]}
                  onFlagChange={(reason) => handleFlagChange(doc.field, reason)}
                  onApprove={() => handleApproveDocument(doc.field)}
                  onFlag={() => handleFlagDocument(doc.field)}
                  isEditing={isEditing}
                />
              ))}
          </div>
        </div>

        {/* Qualifications Section */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900">Qualifications & Track Record</h4>
          </div>
          <div className="divide-y divide-slate-200">
            {documents
              .slice(7, 9)
              .map((doc) => (
                <DocumentChecklistRow
                  key={doc.id}
                  doc={doc}
                  expanded={expandedDoc === doc.id}
                  onExpand={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                  flagReason={flaggedDocs[doc.field]}
                  onFlagChange={(reason) => handleFlagChange(doc.field, reason)}
                  onApprove={() => handleApproveDocument(doc.field)}
                  onFlag={() => handleFlagDocument(doc.field)}
                  isEditing={isEditing}
                />
              ))}
          </div>
        </div>

        {/* Representative & Declarations Section */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900">Representative & Declarations</h4>
          </div>
          <div className="divide-y divide-slate-200">
            {documents
              .slice(9)
              .map((doc) => (
                <DocumentChecklistRow
                  key={doc.id}
                  doc={doc}
                  expanded={expandedDoc === doc.id}
                  onExpand={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                  flagReason={flaggedDocs[doc.field]}
                  onFlagChange={(reason) => handleFlagChange(doc.field, reason)}
                  onApprove={() => handleApproveDocument(doc.field)}
                  onFlag={() => handleFlagDocument(doc.field)}
                  isEditing={isEditing}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">Verification Guidelines</p>
          <ul className="mt-1 text-xs text-blue-700 space-y-1">
            <li>• Red flags indicate expired documents or issues to resolve</li>
            <li>• Yellow warnings mean documents expire within 30 days</li>
            <li>• Supplier can only submit bids when all documents are approved</li>
            <li>• Use the flag button to request corrections or document re-submission</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function DocumentChecklistRow({
  doc,
  expanded,
  onExpand,
  flagReason,
  onFlagChange,
  onApprove,
  onFlag,
  isEditing,
}: {
  doc: DocumentChecklistItem;
  expanded: boolean;
  onExpand: () => void;
  flagReason?: string;
  onFlagChange: (reason: string) => void;
  onApprove: () => void;
  onFlag: () => void;
  isEditing: boolean;
}) {
  const hasFile = !!doc.fileValue;
  const isExpired = doc.isExpired;
  const isExpiringSoon = doc.isExpiringSoon;

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className="mt-0.5 flex-shrink-0">
          {isExpired ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <X className="h-4 w-4 text-red-600" />
            </div>
          ) : isExpiringSoon && hasFile ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          ) : hasFile ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <FileText className="h-4 w-4 text-slate-400" />
            </div>
          )}
        </div>

        {/* Document Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-slate-900">{doc.label}</p>
            {isExpired && <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">EXPIRED</span>}
            {isExpiringSoon && !isExpired && (
              <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded font-medium">EXPIRING SOON</span>
            )}
            {!hasFile && (
              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded font-medium">NOT UPLOADED</span>
            )}
          </div>

          {hasFile && doc.expiryDate && (
            <p className="text-xs text-slate-500 mt-1">
              {doc.expiryField === "mayors_permit_expiry" ? "Permit Expiry: " : "Expires: "}
              {new Date(doc.expiryDate).toLocaleDateString()}
            </p>
          )}

          {hasFile && !doc.fileValue?.includes("DECLARED") && (
            <div className="mt-2 flex items-center gap-1">
              <FileCheck className="h-4 w-4 text-slate-400" />
              <a href={doc.fileValue!} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline">
                View Document
              </a>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onApprove}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition"
              title="Approve this document"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              onClick={onExpand}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition"
              title="Flag this document for revision"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Flag
            </button>
          </div>
        )}
      </div>

      {/* Expanded Flag Section */}
      {expanded && isEditing && (
        <div className="mt-3 ml-11 space-y-2 p-2 bg-slate-50 rounded">
          <input
            type="text"
            value={flagReason || ""}
            onChange={(e) => onFlagChange(e.target.value)}
            placeholder="Reason for flag (e.g., 'Document expired, please re-submit')"
            className="w-full text-xs px-2 py-1 border border-slate-200 rounded"
          />
          <button
            onClick={onFlag}
            className="w-full px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium transition"
          >
            Confirm Flag
          </button>
        </div>
      )}
    </div>
  );
}
