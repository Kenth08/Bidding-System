export type SupplierDocumentCategory = "legal" | "financial" | "technical";

export type SupplierDocumentState = "missing" | "uploaded" | "flagged" | "revised" | "approved";

const AUTO_FLAG_TRIGGER_STATUSES = new Set(["not_uploaded", "missing", "rejected", "invalid"]);

export const DEFAULT_REQUIRED_DOCUMENT_FLAG_REASON =
  "Required document is missing or invalid. Please upload a valid file.";

export interface SupplierDocumentDefinition {
  id: string;
  name: string;
  category: SupplierDocumentCategory;
  required: boolean;
  userField: string;
  declarationOnly?: boolean;
  expiryField?: string;
}

export interface SupplierWorkflowMeta {
  accountLocked: boolean;
  notifSent: boolean;
  flaggedReasons: Record<string, string>;
}

const META_PREFIX = "DOC_WORKFLOW::";

export const SUPPLIER_DOCUMENT_DEFINITIONS: SupplierDocumentDefinition[] = [
  {
    id: "sec_dti_certificate",
    name: "SEC or DTI Certificate",
    category: "legal",
    required: true,
    userField: "sec_dti_certificate",
  },
  {
    id: "mayors_permit",
    name: "Mayor's Permit / Business Permit",
    category: "legal",
    required: true,
    userField: "mayors_permit",
    expiryField: "mayors_permit_expiry",
  },
  {
    id: "philgeps_registration",
    name: "PhilGEPS Registration",
    category: "legal",
    required: true,
    userField: "philgeps_registration",
  },
  {
    id: "valid_id",
    name: "Valid ID (Government-Issued)",
    category: "legal",
    required: true,
    userField: "valid_id",
  },
  {
    id: "tax_clearance",
    name: "Tax Clearance Certificate",
    category: "financial",
    required: true,
    userField: "tax_clearance",
    expiryField: "tax_clearance_expiry",
  },
  {
    id: "audited_financial_statements",
    name: "Audited Financial Statements",
    category: "financial",
    required: true,
    userField: "audited_financial_statements",
  },
  {
    id: "bank_reference_document",
    name: "Bank Reference Letter or Credit Report",
    category: "financial",
    required: true,
    userField: "bank_reference_document",
  },
  {
    id: "performance_certificates",
    name: "Performance Certificates / ISO Certifications",
    category: "technical",
    required: false,
    userField: "performance_certificates",
  },
  {
    id: "past_contracts_document",
    name: "Similar Past Contracts or Purchase Orders",
    category: "technical",
    required: false,
    userField: "past_contracts_document",
  },
  {
    id: "representative_authorization_document",
    name: "Representative Authorization / SPA",
    category: "legal",
    required: true,
    userField: "representative_authorization_document",
  },
  {
    id: "business_permit_document",
    name: "Business Permit Document",
    category: "legal",
    required: false,
    userField: "business_permit_document",
  },
  {
    id: "bir_form_2303",
    name: "BIR Form 2303",
    category: "legal",
    required: false,
    userField: "bir_form_2303",
  },
  {
    id: "supporting_documents",
    name: "Supporting Documents",
    category: "technical",
    required: false,
    userField: "supporting_documents",
  },
  {
    id: "iso_certificate",
    name: "ISO Certificate",
    category: "technical",
    required: false,
    userField: "iso_certificate",
    expiryField: "iso_certificate_expiry",
  },
  {
    id: "blacklisting_declaration_document",
    name: "Blacklisting Declaration Document",
    category: "legal",
    required: false,
    userField: "blacklisting_declaration_document",
  },
  {
    id: "not_blacklisted_declaration",
    name: "Good Standing Declaration (Not Blacklisted)",
    category: "legal",
    required: true,
    userField: "not_blacklisted_declaration",
    declarationOnly: true,
  },
];

export const SUPPLIER_DOCUMENT_LOOKUP = new Map(
  SUPPLIER_DOCUMENT_DEFINITIONS.map((doc) => [doc.id, doc])
);

export function getDefaultWorkflowMeta(): SupplierWorkflowMeta {
  return {
    accountLocked: false,
    notifSent: false,
    flaggedReasons: {},
  };
}

export function parseSupplierWorkflowMeta(raw: unknown): SupplierWorkflowMeta {
  if (!raw || typeof raw !== "string") return getDefaultWorkflowMeta();
  if (!raw.startsWith(META_PREFIX)) return getDefaultWorkflowMeta();

  try {
    const parsed = JSON.parse(raw.slice(META_PREFIX.length));
    return {
      accountLocked: Boolean(parsed?.accountLocked),
      notifSent: Boolean(parsed?.notifSent),
      flaggedReasons: typeof parsed?.flaggedReasons === "object" && parsed?.flaggedReasons
        ? parsed.flaggedReasons
        : {},
    };
  } catch {
    return getDefaultWorkflowMeta();
  }
}

export function serializeSupplierWorkflowMeta(meta: SupplierWorkflowMeta): string {
  return `${META_PREFIX}${JSON.stringify(meta)}`;
}

export function mapVerificationStatusToState(
  verificationStatus: unknown,
  hasFile: boolean
): SupplierDocumentState {
  const status = String(verificationStatus || "").toLowerCase();
  if (status === "needs revision" || status === "rejected" || status === "flagged" || status === "invalid") return "flagged";
  if (!hasFile) return "missing";
  if (status === "approved") return "approved";
  if (status === "revised" || status === "pending" || status === "pending_review") return "revised";
  return "uploaded";
}

export function isDocumentUploaded(supplier: Record<string, unknown>, definition: SupplierDocumentDefinition): boolean {
  const value = supplier?.[definition.userField];
  if (definition.declarationOnly) return Boolean(value);
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

export function shouldAutoFlagRequiredDocument(params: {
  required: boolean;
  hasFile: boolean;
  verificationStatus?: unknown;
}) {
  if (!params.required) return false;
  if (!params.hasFile) return true;
  const status = String(params.verificationStatus || "").trim().toLowerCase();
  return AUTO_FLAG_TRIGGER_STATUSES.has(status);
}
