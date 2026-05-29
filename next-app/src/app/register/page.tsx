"use client";
import { ArrowLeft, Check, CheckCircle2, Eye, EyeOff, Shield, Upload, AlertCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import LoadingButton from "@/components/ui/LoadingButton";
import { Suspense, useState, ChangeEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI } from "@/services/api";
import StrictNumberInput from "@/components/shared/StrictNumberInput";

const isLocalMode = process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

// initial fallback; will be replaced by server list
const FALLBACK_BUSINESS_TYPES = [
  "IT Equipment",
  "Office Supplies",
  "Construction Materials",
  "Medical Supplies",
  "ICT Services",
  "Electrical Supplies",
  "Agricultural Supplies",
  "Printing Services",
  "Transportation",
  "Consultancy",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const REQUIRED_DOCUMENTS_SECTIONS = {
  legal: [
    { key: "secDtiCertificate", label: "SEC or DTI Certificate" },
    { key: "mayorsPm", label: "Mayor's Permit / Business Permit" },
    { key: "philGepsRegistration", label: "PhilGEPS Registration" },
    { key: "validId", label: "Valid ID" },
  ],
  financial: [
    { key: "taxClearance", label: "Tax Clearance Certificate" },
    { key: "auditedFinancialStatements", label: "Audited Financial Statements (1-2 years)" },
    { key: "bankReferenceDocument", label: "Bank Reference Letter or Credit Report" },
  ],
  qualifications: [
    { key: "performanceCertificates", label: "Performance Certificates / ISO Certifications" },
    { key: "pastContractsDocument", label: "Similar Past Contracts or Purchase Orders" },
  ],
};

function FileUploadField({ label, file, error, onChange, onClear, optional = false, invalid = false }: { label: string; file: File | null; error?: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; onClear?: () => void; optional?: boolean; invalid?: boolean }) {
  const inputId = label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label} {optional && <span className="text-slate-400 font-normal">(Optional)</span>}
      </span>
      <div className={`rounded-xl border bg-slate-50 px-4 py-3 transition-colors hover:bg-white ${invalid ? 'border-red-300 hover:border-red-400' : 'border-slate-200 hover:border-emerald-300'}`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Upload className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-400">PDF, JPG, PNG &middot; Max 5MB</p>
            <div className="mt-1 flex items-center gap-3">
              <p className="truncate text-xs text-slate-600">{file?.name || "No file selected"}</p>
              {file ? (
                <button type="button" onClick={(e) => { e.preventDefault(); onClear?.(); }} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
              ) : null}
            </div>
          </div>
        </div>
        <input id={inputId} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} className="sr-only" />
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </label>
  );
}

function DateInputField({ label, value, onChange }: { label: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type="date"
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
      />
    </label>
  );
}

function CollapsibleSection({ title, description, defaultOpen = true, children }: { title: string; description?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {description ? <p className="text-xs text-slate-500">{description}</p> : null}
          </div>
        </div>
        <button type="button" onClick={() => setOpen((s) => !s)} className="text-slate-500">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="md:col-span-2 mb-4">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nextPath, setNextPath] = useState<string | null>(null);
  const googleEmail = searchParams.get("email") || "";
  const isFromGoogle = searchParams.get("from") === "google";
  const noAccountMessage = searchParams.get("message") === "no_account";

  const [form, setForm] = useState<Record<string, any>>({
    fullName: "",
    email: googleEmail,
    password: "",
    confirmPassword: "",
    companyName: "",
    companyAddress: "",
    phone: "",
    businessType: "",
    businessTypeIds: [] as unknown as string[],
    businessTypeCustom: "",
    representativeName: "",
    tin: "",
    companyProfile: "",
    
    // Legal documents
    secDtiCertificate: null,
    mayorsPm: null,
    mayorsPmExpiry: "",
    philGepsRegistration: null,
    validId: null,
    
    // Financial documents
    taxClearance: null,
    taxClearanceExpiry: "",
    auditedFinancialStatements: null,
    financialStatementYear: "",
    bankReferenceDocument: null,
    
    // Qualifications
    performanceCertificates: null,
    pastContractsDocument: null,
    trackRecordDescription: "",
    
    // Representative authorization
    representativeAuthorizationDocument: null,
    
    // Blacklisting declaration
    notBlacklistedDeclaration: false,
    blacklistingDeclarationDocument: null,
    
    // Legacy field for compatibility
    supportingDocuments: null,
  });

  const [availableBusinessTypes, setAvailableBusinessTypes] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/public/business-types");
        if (res.ok) {
          const json = await res.json();
          setAvailableBusinessTypes(json || []);
        } else {
          setAvailableBusinessTypes(FALLBACK_BUSINESS_TYPES.map((n) => ({ id: n, name: n })));
        }
      } catch (e) {
        setAvailableBusinessTypes(FALLBACK_BUSINESS_TYPES.map((n) => ({ id: n, name: n })));
      }
    })();
      const next = searchParams.get("next");
      if (next) setNextPath(next);
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  function updateForm(key: string, value: any) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function updateFile(key: string, file: File | undefined) {
    if (file && file.size > MAX_FILE_SIZE) {
      setFileErrors((p) => ({ ...p, [key]: "File must be 5MB or smaller." }));
      updateForm(key, null);
      return;
    }
    setFileErrors((p) => ({ ...p, [key]: "" }));
    updateForm(key, file || null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setValidationErrors({});

    const nextErrors: Record<string, string> = {};
    const nextFileErrors: Record<string, string> = {};

    const requireField = (key: string, message: string) => {
      if (!String(form[key] || "").trim()) nextErrors[key] = message;
    };

    const requireFile = (key: string, message: string) => {
      if (!form[key]) {
        nextErrors[key] = message;
        nextFileErrors[key] = message;
      }
    };

    // Validate basic fields
    requireField("fullName", "Please enter your full name.");
    requireField("email", "Please enter your email address.");
    requireField("companyName", "Please enter your company name.");
    requireField("companyAddress", "Please enter your company address.");
    requireField("phone", "Please enter your phone number.");
    requireField("representativeName", "Please enter your representative name.");
    requireField("tin", "Please enter your TIN.");
    requireField("companyProfile", "Please enter your company profile and capabilities.");
    if (!(form.businessTypeIds as unknown as string[]).length) nextErrors.businessTypeIds = "Please select at least one business type.";

    // Validate passwords
    if (!isFromGoogle) {
      if (!String(form.password || "").trim()) nextErrors.password = "Please enter a password.";
      if (!String(form.confirmPassword || "").trim()) nextErrors.confirmPassword = "Please confirm your password.";
    }

    // Validate required legal documents
    requireFile("secDtiCertificate", "Please upload your SEC or DTI Certificate.");
    requireFile("mayorsPm", "Please upload your Mayor's Permit / Business Permit.");
    requireFile("philgepsRegistration", "Please upload your PhilGEPS Registration.");
    requireFile("validId", "Please upload your valid ID.");

    // Validate required financial documents
    requireFile("taxClearance", "Please upload your Tax Clearance Certificate.");
    requireFile("auditedFinancialStatements", "Please upload your Audited Financial Statements.");
    requireFile("bankReferenceDocument", "Please upload your Bank Reference Letter or Credit Report.");

    // Validate blacklisting declaration
    if (!form.notBlacklistedDeclaration) {
      nextErrors.notBlacklistedDeclaration = "Please confirm the blacklisting declaration.";
    }

    // Validate representative authorization
    if (!form.representativeAuthorizationDocument) {
      nextErrors.representativeAuthorizationDocument = "Please upload your representative authorization document (SPA).";
      nextFileErrors.representativeAuthorizationDocument = "Please upload your representative authorization document (SPA).";
    }

    // Validate numeric fields
    if (form.phone && !/^[0-9]+$/.test(String(form.phone).trim())) {
      nextErrors.phone = "Phone number must contain digits only.";
    }
    if (form.tin && !/^[0-9]+$/.test(String(form.tin).trim())) {
      nextErrors.tin = "TIN must contain digits only.";
    }
    if (form.auditedFinancialStatements && !String(form.financialStatementYear).trim()) {
      nextErrors.financialStatementYear = "Please enter the financial statement year.";
    }
    if (String(form.financialStatementYear).trim()) {
      const year = Number(String(form.financialStatementYear).trim());
      const currentYear = new Date().getFullYear();
      if (!/^[0-9]{4}$/.test(String(form.financialStatementYear).trim()) || Number.isNaN(year) || year < 1900 || year > currentYear) {
        nextErrors.financialStatementYear = `Enter a valid year between 1900 and ${currentYear}.`;
      }
    }

    // Validate mayor's permit expiry
    if (form.mayorsPmExpiry && new Date(form.mayorsPmExpiry as string) < new Date()) {
      nextErrors.mayorsPmExpiry = "Mayor's Permit has expired. Please upload a valid permit.";
    }

    // Validate tax clearance expiry
    if (form.taxClearanceExpiry && new Date(form.taxClearanceExpiry as string) < new Date()) {
      nextErrors.taxClearanceExpiry = "Tax Clearance has expired. Please upload a valid certificate.";
    }

    if (!isFromGoogle) {
      if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
      if (String(form.password).length < 6) {
        nextErrors.password = "Password must be at least 6 characters.";
      }
    }

    if (Object.keys(nextErrors).length) {
      setValidationErrors(nextErrors);
      setFileErrors((current) => ({ ...current, ...nextFileErrors }));
      setError("Please fix the highlighted fields below.");
      return;
    }

    setFileErrors((current) => ({ ...current, ...nextFileErrors }));

    // No custom business types allowed during registration — only select from provided list

    setIsLoading(true);
    try {
      const payload = new FormData();
      payload.append("full_name", form.fullName as string);
      payload.append("email", form.email as string);
      if (!isFromGoogle) payload.append("password", form.password as string);
      payload.append("company_name", form.companyName as string);
      payload.append("company_address", form.companyAddress as string);
      payload.append("phone", form.phone as string);
      // Attach selected business type ids or names. The server accepts repeated `business_type_ids` fields.
      const selected = (form.businessTypeIds as unknown as string[]) || [];
      for (const v of selected) {
        payload.append("business_type_ids", v);
      }
      payload.append("representative_name", form.representativeName as string);
      payload.append("tin", form.tin as string);
      payload.append("company_profile", form.companyProfile as string);

      // Legal documents
      if (form.secDtiCertificate) payload.append("sec_dti_certificate", form.secDtiCertificate as File);
      if (form.mayorsPm) payload.append("mayors_permit", form.mayorsPm as File);
      if (form.mayorsPmExpiry) payload.append("mayors_permit_expiry", form.mayorsPmExpiry as string);
      if (form.philGepsRegistration) payload.append("philgeps_registration", form.philGepsRegistration as File);
      if (form.validId) payload.append("valid_id", form.validId as File);

      // Financial documents
      if (form.taxClearance) payload.append("tax_clearance", form.taxClearance as File);
      if (form.taxClearanceExpiry) payload.append("tax_clearance_expiry", form.taxClearanceExpiry as string);
      if (form.auditedFinancialStatements) payload.append("audited_financial_statements", form.auditedFinancialStatements as File);
      if (form.financialStatementYear) payload.append("financial_statement_year", form.financialStatementYear as string);
      if (form.bankReferenceDocument) payload.append("bank_reference_document", form.bankReferenceDocument as File);

      // Qualifications
      if (form.performanceCertificates) payload.append("performance_certificates", form.performanceCertificates as File);
      if (form.pastContractsDocument) payload.append("past_contracts_document", form.pastContractsDocument as File);
      if (form.trackRecordDescription) payload.append("track_record_description", form.trackRecordDescription as string);

      // Representative authorization
      if (form.representativeAuthorizationDocument) payload.append("representative_authorization_document", form.representativeAuthorizationDocument as File);

      // Blacklisting declaration
      payload.append("not_blacklisted_declaration", form.notBlacklistedDeclaration ? "true" : "false");
      if (form.blacklistingDeclarationDocument) payload.append("blacklisting_declaration_document", form.blacklistingDeclarationDocument as File);

      // Legacy support
      if (form.supportingDocuments) payload.append("supporting_documents", form.supportingDocuments as File);

      if (isFromGoogle) payload.append("from_google", "true");

      await authAPI.register(payload);
      // If user came from an open-bid click, forward them to login with next so they can sign in and continue
      if (nextPath) {
        router.push(`/login?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent("Registration successful. Please sign in to participate in bidding.")}`);
        return;
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      <div className="fixed left-0 top-0 hidden h-screen w-[480px] overflow-hidden bg-slate-900 lg:flex lg:flex-col px-12 py-10">
        <div className="absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-emerald-500/10" />
        <div className="absolute -right-16 top-14 h-72 w-72 rounded-full bg-emerald-500/10" />
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="relative z-10 mb-6 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </button>
        <div className="relative z-10 flex items-center gap-3 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
            <Shield className="h-5 w-5" />
          </div>
          <p className="text-base font-bold">Blockchain E-Procurement</p>
        </div>
        <div className="relative z-10 my-auto text-white">
          <h2 className="text-3xl font-bold leading-tight">Join as a Supplier</h2>
          <p className="mt-2 text-sm text-slate-300">Register your company and start bidding on procurement projects</p>
          <div className="mt-8 space-y-3 text-left text-sm">
            {["Fair evaluation process", "Blockchain-verified results", "Secure bid submission"].map((f) => (
              <p key={f} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                {f}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-1 items-center justify-center bg-white px-4 py-8 lg:ml-[480px] lg:px-12">
        <div className="w-full max-w-3xl rounded-2xl border border-slate-100 bg-white p-8">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mb-4 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-600 lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </button>

          {submitted ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-fit rounded-full border border-emerald-100 bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-emerald-700">Registration Submitted!</h1>
              <p className="mt-2 text-sm text-slate-500">
                {isLocalMode
                  ? "Your account is ready for local sign-in and is pending admin approval."
                  : "Your account is pending admin approval.\nVerify your email first using the code sent to your inbox."}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Registered Email: <span className="font-semibold text-slate-700">{form.email as string}</span>
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {!isLocalMode ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/verify-email?email=${encodeURIComponent(String(form.email || ""))}`)}
                    className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-emerald-600"
                  >
                    Verify Email Now
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="rounded-xl border border-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition-all duration-150 hover:bg-emerald-50"
                >
                  Back to Login
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900">Supplier Registration</h1>
              <p className="mt-1 text-sm text-slate-500">Complete all sections to register your company</p>

              {noAccountMessage && (
                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
                  No account found for this email. Please complete the registration below.
                </div>
              )}

              {Object.keys(validationErrors).length > 0 ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="font-semibold">Please fix these fields:</p>
                  <ul className="mt-2 space-y-1 text-xs">
                    {Object.entries(validationErrors).map(([key, message]) => (
                      <li key={key}>• {message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Basic Information */}
                <SectionTitle title="Basic Information" />

                {[
                  { key: "fullName", label: "Full Name", span: true },
                  { key: "email", label: "Email Address", span: true, type: "email", readOnly: isFromGoogle },
                ].map(({ key, label, span, type, readOnly }) => (
                  <label key={key} className={span ? "md:col-span-2" : ""}>
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {label}
                    </span>
                    <input
                      type={type || "text"}
                      value={form[key] as string}
                      onChange={(e) => updateForm(key, e.target.value)}
                      readOnly={readOnly}
                      className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 ${validationErrors[key] ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"} ${
                        readOnly ? "cursor-not-allowed opacity-60" : ""
                      }`}
                    />
                    {validationErrors[key] ? <p className="mt-1 text-xs text-red-600">{validationErrors[key]}</p> : null}
                  </label>
                ))}

                {!isFromGoogle && (
                  <>
                    <label>
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Password
                      </span>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={form.password as string}
                          onChange={(e) => updateForm("password", e.target.value)}
                          className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none transition-all duration-150 focus:bg-white focus:ring-2 ${validationErrors.password ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {validationErrors.password ? <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p> : null}
                    </label>
                    <label>
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Confirm Password
                      </span>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={form.confirmPassword as string}
                          onChange={(e) => updateForm("confirmPassword", e.target.value)}
                          className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none transition-all duration-150 focus:bg-white focus:ring-2 ${validationErrors.confirmPassword ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {validationErrors.confirmPassword ? <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p> : null}
                    </label>
                  </>
                )}

                {[
                  { key: "companyName", label: "Company Name", span: true },
                  { key: "companyAddress", label: "Company Address", span: true },
                  { key: "phone", label: "Phone Number", number: true },
                  {
                    key: "businessType",
                      label: "Business Type",
                      select: true,
                      options: FALLBACK_BUSINESS_TYPES,
                    },
                  { key: "representativeName", label: "Representative Name", span: true },
                  { key: "tin", label: "TIN (Tax Identification Number)", number: true },
                ].map(({ key, label, span, select, options, number }) => (
                  <label key={key} className={span ? "md:col-span-2" : ""}>
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {label}
                    </span>
                    {select ? (
                      // Multi-select checkboxes sourced from the server
                      <div className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm ${validationErrors.businessTypeIds ? 'border-red-300' : 'border-slate-200'}`}>
                        <div className="grid max-h-40 grid-cols-1 gap-2 overflow-y-auto">
                          {availableBusinessTypes.map((bt) => (
                            <label key={bt.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={(form.businessTypeIds as unknown as string[]).includes(bt.id)}
                                onChange={(e) => {
                                  const ids = new Set(form.businessTypeIds as unknown as string[]);
                                  if (e.target.checked) ids.add(bt.id); else ids.delete(bt.id);
                                  updateForm("businessTypeIds", Array.from(ids));
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                              />
                              <span className="text-sm text-slate-700">{bt.name}</span>
                            </label>
                          ))}
                        </div>
                        {validationErrors.businessTypeIds ? <p className="mt-2 text-xs text-red-600">{validationErrors.businessTypeIds}</p> : null}
                      </div>
                    ) : number ? (
                      <>
                        <StrictNumberInput
                          value={form[key] as string}
                          onChange={(value) => updateForm(key, value)}
                          className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:bg-white focus:ring-2 ${validationErrors[key] ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20'}`}
                          helperText="Numbers only."
                        />
                        {validationErrors[key] ? <p className="mt-1 text-xs text-red-600">{validationErrors[key]}</p> : null}
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={form[key] as string}
                          onChange={(e) => updateForm(key, e.target.value)}
                          className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:bg-white focus:ring-2 ${validationErrors[key] ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20'}`}
                        />
                        {validationErrors[key] ? <p className="mt-1 text-xs text-red-600">{validationErrors[key]}</p> : null}
                      </>
                    )}
                  </label>
                ))}

                <label className="md:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Company Profile & Capabilities
                  </span>
                  <textarea
                    rows={4}
                    value={form.companyProfile as string}
                    onChange={(e) => updateForm("companyProfile", e.target.value)}
                    className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:bg-white focus:ring-2 ${validationErrors.companyProfile ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20'}`}
                    placeholder="Brief company background and capability statement"
                  />
                  {validationErrors.companyProfile ? <p className="mt-1 text-xs text-red-600">{validationErrors.companyProfile}</p> : null}
                </label>

                {/* Legal Documents */}
                <CollapsibleSection title="Legal Documents" description="Required for company registration and compliance">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <FileUploadField label="SEC or DTI Certificate" file={form.secDtiCertificate as File | null} error={fileErrors["secDtiCertificate"]} invalid={Boolean(validationErrors.secDtiCertificate || fileErrors.secDtiCertificate)} onChange={(e) => updateFile("secDtiCertificate", e.target.files?.[0])} onClear={() => updateFile("secDtiCertificate", undefined)} />
                      <FileUploadField label="PhilGEPS Registration Certificate" file={form.philgepsRegistration as File | null} error={fileErrors["philgepsRegistration"]} invalid={Boolean(validationErrors.philgepsRegistration || fileErrors.philgepsRegistration)} onChange={(e) => updateFile("philgepsRegistration", e.target.files?.[0])} onClear={() => updateFile("philgepsRegistration", undefined)} />
                    </div>
                    <div className="space-y-4">
                      <FileUploadField label="Mayor's Permit / Business Permit" file={form.mayorsPm as File | null} error={fileErrors["mayorsPm"]} invalid={Boolean(validationErrors.mayorsPm || fileErrors.mayorsPm)} onChange={(e) => updateFile("mayorsPm", e.target.files?.[0])} onClear={() => updateFile("mayorsPm", undefined)} />
                      <DateInputField label="Mayor's Permit Expiry Date" value={form.mayorsPmExpiry as string} onChange={(e) => updateForm("mayorsPmExpiry", e.target.value)} />
                      {validationErrors.mayorsPmExpiry ? <p className="text-xs text-red-600">{validationErrors.mayorsPmExpiry}</p> : null}
                      <FileUploadField label="Valid ID (Government-Issued)" file={form.validId as File | null} error={fileErrors["validId"]} invalid={Boolean(validationErrors.validId || fileErrors.validId)} onChange={(e) => updateFile("validId", e.target.files?.[0])} onClear={() => updateFile("validId", undefined)} />
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Financial Documents */}
                <CollapsibleSection title="Financial Documents" description="Required to verify financial capacity and stability">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <FileUploadField label="Tax Clearance Certificate" file={form.taxClearance as File | null} error={fileErrors["taxClearance"]} invalid={Boolean(validationErrors.taxClearance || fileErrors.taxClearance)} onChange={(e) => updateFile("taxClearance", e.target.files?.[0])} onClear={() => updateFile("taxClearance", undefined)} />
                      <FileUploadField label="Audited Financial Statements (Latest 1-2 years)" file={form.auditedFinancialStatements as File | null} error={fileErrors["auditedFinancialStatements"]} invalid={Boolean(validationErrors.auditedFinancialStatements || fileErrors.auditedFinancialStatements)} onChange={(e) => updateFile("auditedFinancialStatements", e.target.files?.[0])} onClear={() => updateFile("auditedFinancialStatements", undefined)} />
                    </div>
                    <div className="space-y-4">
                      <DateInputField label="Tax Clearance Expiry" value={form.taxClearanceExpiry as string} onChange={(e) => updateForm("taxClearanceExpiry", e.target.value)} />
                      {validationErrors.taxClearanceExpiry ? <p className="text-xs text-red-600">{validationErrors.taxClearanceExpiry}</p> : null}
                      <label>
                        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Financial Statement Year</span>
                        <StrictNumberInput
                          min="2020"
                          max={new Date().getFullYear()}
                          value={form.financialStatementYear as string}
                          onChange={(value) => updateForm("financialStatementYear", value)}
                          placeholder={`e.g. ${new Date().getFullYear()}`}
                          className={`w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:bg-white focus:ring-2 ${validationErrors.financialStatementYear ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20'}`}
                          helperText="Numbers only. Enter the year as digits."
                        />
                        {validationErrors.financialStatementYear ? <p className="mt-1 text-xs text-red-600">{validationErrors.financialStatementYear}</p> : null}
                      </label>
                    </div>
                  </div>
                  <div className="mt-4">
                    <FileUploadField label="Bank Reference Letter or Credit Report" file={form.bankReferenceDocument as File | null} error={fileErrors["bankReferenceDocument"]} invalid={Boolean(validationErrors.bankReferenceDocument || fileErrors.bankReferenceDocument)} onChange={(e) => updateFile("bankReferenceDocument", e.target.files?.[0])} onClear={() => updateFile("bankReferenceDocument", undefined)} />
                  </div>
                </CollapsibleSection>

                {/* Qualifications & Track Record */}
                <CollapsibleSection title="Qualifications & Track Record" description="Demonstrate your company's experience and capabilities">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FileUploadField label="Performance Certificates / ISO Certifications" file={form.performanceCertificates as File | null} error={fileErrors["performanceCertificates"]} invalid={Boolean(validationErrors.performanceCertificates || fileErrors.performanceCertificates)} onChange={(e) => updateFile("performanceCertificates", e.target.files?.[0])} onClear={() => updateFile("performanceCertificates", undefined)} optional={true} />
                    <FileUploadField label="Similar Past Contracts or Purchase Orders" file={form.pastContractsDocument as File | null} error={fileErrors["pastContractsDocument"]} invalid={Boolean(validationErrors.pastContractsDocument || fileErrors.pastContractsDocument)} onChange={(e) => updateFile("pastContractsDocument", e.target.files?.[0])} onClear={() => updateFile("pastContractsDocument", undefined)} optional={true} />
                  </div>
                  <div className="mt-3">
                    <label>
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Track Record Description (Optional)</span>
                      <textarea rows={3} value={form.trackRecordDescription as string} onChange={(e) => updateForm("trackRecordDescription", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" placeholder="Brief description of similar projects completed in the last 5 years" />
                    </label>
                  </div>
                </CollapsibleSection>

                {/* Representative Authorization */}
                <CollapsibleSection title="Representative Authorization">
                  <FileUploadField label="Authorization Letter or Special Power of Attorney (SPA)" file={form.representativeAuthorizationDocument as File | null} error={fileErrors["representativeAuthorizationDocument"]} onChange={(e) => updateFile("representativeAuthorizationDocument", e.target.files?.[0])} onClear={() => updateFile("representativeAuthorizationDocument", undefined)} />
                </CollapsibleSection>

                {/* Good Standing Declaration */}
                <CollapsibleSection title="Good Standing Declaration">
                  <label>
                    
                  </label>
                </CollapsibleSection>

                <label className="md:col-span-2">
                  <div className={`flex items-start gap-3 rounded-xl bg-slate-50 p-4 ${validationErrors.notBlacklistedDeclaration ? 'border border-red-300' : 'border border-slate-200'}`}>
                    <input
                      type="checkbox"
                      checked={form.notBlacklistedDeclaration as boolean}
                      onChange={(e) => updateForm("notBlacklistedDeclaration", e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        I declare that our company is not blacklisted by any government agency or private corporation
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        By checking this, you certify that your company has no record of blacklisting or debarment
                      </p>
                      {validationErrors.notBlacklistedDeclaration ? <p className="mt-2 text-xs text-red-600">{validationErrors.notBlacklistedDeclaration}</p> : null}
                    </div>
                  </div>
                </label>

                <FileUploadField label="Sworn Statement / Affidavit (Optional)" file={form.blacklistingDeclarationDocument as File | null} error={fileErrors["blacklistingDeclarationDocument"]} invalid={Boolean(validationErrors.blacklistingDeclarationDocument || fileErrors.blacklistingDeclarationDocument)} onChange={(e) => updateFile("blacklistingDeclarationDocument", e.target.files?.[0])} onClear={() => updateFile("blacklistingDeclarationDocument", undefined)} optional={true} />

                {/* Other Documents */}
                <CollapsibleSection title="Additional Documents">
                  <FileUploadField label="Other Supporting Documents" file={form.supportingDocuments as File | null} error={fileErrors["supportingDocuments"]} onChange={(e) => updateFile("supportingDocuments", e.target.files?.[0])} onClear={() => updateFile("supportingDocuments", undefined)} optional={true} />
                </CollapsibleSection>

                {/* Info Box */}
                <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Document Requirements</p>
                    <ul className="mt-1 text-xs text-blue-700 space-y-1">
                      <li>• All files must be 5MB or smaller (PDF, JPG, PNG)</li>
                      <li>• After registration, your account will be pending admin verification</li>
                      <li>• You must complete all required documents to submit bids</li>
                      <li>• Expiry dates will be verified; please ensure documents are current</li>
                    </ul>
                  </div>
                </div>

                {/* Error Message */}
                {error ? (
                  <div className="md:col-span-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600 flex gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                ) : null}

                {/* Submit Button */}
                <LoadingButton
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Registering..."
                  className="md:col-span-2 mt-2 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-emerald-600"
                >
                  Submit Registration
                </LoadingButton>
              </form>

              <p className="mt-5 text-center text-sm text-slate-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Sign In
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <RegisterPageContent />
    </Suspense>
  );
}
