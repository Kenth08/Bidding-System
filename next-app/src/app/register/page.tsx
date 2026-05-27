"use client";
import { ArrowLeft, Check, CheckCircle2, Eye, EyeOff, Shield, Upload, AlertCircle } from "lucide-react";
import LoadingButton from "@/components/ui/LoadingButton";
import { Suspense, useState, ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI } from "@/services/api";

const BUSINESS_TYPES = ["Construction", "IT Services", "Healthcare", "Logistics", "Consulting", "Other"];
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

function FileUploadField({ label, file, error, onChange, optional = false }: { label: string; file: File | null; error?: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; optional?: boolean }) {
  const inputId = label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label} {optional && <span className="text-slate-400 font-normal">(Optional)</span>}
      </span>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors hover:border-emerald-300 hover:bg-white">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Upload className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-400">PDF, JPG, PNG &middot; Max 5MB</p>
            <p className="mt-1 truncate text-xs text-slate-600">{file?.name || "No file selected"}</p>
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
  const googleEmail = searchParams.get("email") || "";
  const isFromGoogle = searchParams.get("from") === "google";
  const noAccountMessage = searchParams.get("message") === "no_account";

  const [form, setForm] = useState<Record<string, string | File | null | boolean>>({
    fullName: "",
    email: googleEmail,
    password: "",
    confirmPassword: "",
    companyName: "",
    companyAddress: "",
    phone: "",
    businessType: "",
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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  function updateForm(key: string, value: string | File | null | boolean) {
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

    // Validate basic fields
    if (!form.fullName || !form.email || !form.companyName || !String(form.representativeName || "").trim() || !String(form.tin || "").trim() || !String(form.companyProfile || "").trim()) {
      setError("Please fill in all required basic information fields.");
      return;
    }

    // Validate passwords
    if (!isFromGoogle && (!form.password || !form.confirmPassword)) {
      setError("Please fill in all required fields.");
      return;
    }

    // Validate required legal documents
    const legalRequired = ["secDtiCertificate", "mayorsPm", "philGepsRegistration", "validId"];
    const missingLegal = legalRequired.find((key) => !form[key]);
    if (missingLegal) {
      const labels: Record<string, string> = {
        secDtiCertificate: "SEC or DTI Certificate",
        mayorsPm: "Mayor's Permit",
        philGepsRegistration: "PhilGEPS Registration",
        validId: "Valid ID",
      };
      setError(`Please upload ${labels[missingLegal] || "required legal documents"}.`);
      return;
    }

    // Validate required financial documents
    const financialRequired = ["taxClearance", "auditedFinancialStatements", "bankReferenceDocument"];
    const missingFinancial = financialRequired.find((key) => !form[key]);
    if (missingFinancial) {
      const labels: Record<string, string> = {
        taxClearance: "Tax Clearance",
        auditedFinancialStatements: "Audited Financial Statements",
        bankReferenceDocument: "Bank Reference",
      };
      setError(`Please upload ${labels[missingFinancial] || "required financial documents"}.`);
      return;
    }

    // Validate blacklisting declaration
    if (!form.notBlacklistedDeclaration) {
      setError("You must declare that your company is not blacklisted.");
      return;
    }

    // Validate representative authorization
    if (!form.representativeAuthorizationDocument) {
      setError("Please upload your representative authorization document (SPA).");
      return;
    }

    // Validate mayor's permit expiry
    if (form.mayorsPmExpiry && new Date(form.mayorsPmExpiry as string) < new Date()) {
      setError("Mayor's Permit has expired. Please upload a valid permit.");
      return;
    }

    // Validate tax clearance expiry
    if (form.taxClearanceExpiry && new Date(form.taxClearanceExpiry as string) < new Date()) {
      setError("Tax Clearance has expired. Please upload a valid certificate.");
      return;
    }

    if (!isFromGoogle) {
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (String(form.password).length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = new FormData();
      payload.append("full_name", form.fullName as string);
      payload.append("email", form.email as string);
      if (!isFromGoogle) payload.append("password", form.password as string);
      payload.append("company_name", form.companyName as string);
      payload.append("company_address", form.companyAddress as string);
      payload.append("phone", form.phone as string);
      payload.append("business_type", form.businessType as string);
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
                Your account is pending admin verification.
                <br />
                Once all documents are verified, you'll be able to submit bids.
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Registered Email: <span className="font-semibold text-slate-700">{form.email as string}</span>
              </p>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="mt-6 rounded-xl border border-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition-all duration-150 hover:bg-emerald-50"
              >
                Back to Login
              </button>
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
                      className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 ${
                        readOnly ? "cursor-not-allowed opacity-60" : ""
                      }`}
                    />
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
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
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
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </label>
                  </>
                )}

                {[
                  { key: "companyName", label: "Company Name", span: true },
                  { key: "companyAddress", label: "Company Address", span: true },
                  { key: "phone", label: "Phone Number" },
                  {
                    key: "businessType",
                    label: "Business Type",
                    select: true,
                    options: BUSINESS_TYPES,
                  },
                  { key: "representativeName", label: "Representative Name", span: true },
                  { key: "tin", label: "TIN (Tax Identification Number)" },
                ].map(({ key, label, span, select, options }) => (
                  <label key={key} className={span ? "md:col-span-2" : ""}>
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {label}
                    </span>
                    {select ? (
                      <select
                        value={form[key] as string}
                        onChange={(e) => updateForm(key, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                      >
                        <option value="">Select {label.toLowerCase()}</option>
                        {(options || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form[key] as string}
                        onChange={(e) => updateForm(key, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                      />
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                    placeholder="Brief company background and capability statement"
                  />
                </label>

                {/* Legal Documents */}
                <SectionTitle
                  title="Legal Documents"
                  description="Required for company registration and compliance"
                />

                <FileUploadField
                  label="SEC or DTI Certificate"
                  file={form.secDtiCertificate as File | null}
                  error={fileErrors["secDtiCertificate"]}
                  onChange={(e) => updateFile("secDtiCertificate", e.target.files?.[0])}
                />

                <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-3">
                  <FileUploadField
                    label="Mayor's Permit / Business Permit"
                    file={form.mayorsPm as File | null}
                    error={fileErrors["mayorsPm"]}
                    onChange={(e) => updateFile("mayorsPm", e.target.files?.[0])}
                  />
                  <DateInputField
                    label="Mayor's Permit Expiry Date"
                    value={form.mayorsPmExpiry as string}
                    onChange={(e) => updateForm("mayorsPmExpiry", e.target.value)}
                  />
                </div>

                <FileUploadField
                  label="PhilGEPS Registration Certificate"
                  file={form.philGepsRegistration as File | null}
                  error={fileErrors["philGepsRegistration"]}
                  onChange={(e) => updateFile("philGepsRegistration", e.target.files?.[0])}
                />

                <FileUploadField
                  label="Valid ID (Government-Issued)"
                  file={form.validId as File | null}
                  error={fileErrors["validId"]}
                  onChange={(e) => updateFile("validId", e.target.files?.[0])}
                />

                {/* Financial Documents */}
                <SectionTitle
                  title="Financial Documents"
                  description="Required to verify financial capacity and stability"
                />

                <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-3">
                  <FileUploadField
                    label="Tax Clearance Certificate"
                    file={form.taxClearance as File | null}
                    error={fileErrors["taxClearance"]}
                    onChange={(e) => updateFile("taxClearance", e.target.files?.[0])}
                  />
                  <DateInputField
                    label="Tax Clearance Expiry"
                    value={form.taxClearanceExpiry as string}
                    onChange={(e) => updateForm("taxClearanceExpiry", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-3">
                  <FileUploadField
                    label="Audited Financial Statements (Latest 1-2 years)"
                    file={form.auditedFinancialStatements as File | null}
                    error={fileErrors["auditedFinancialStatements"]}
                    onChange={(e) => updateFile("auditedFinancialStatements", e.target.files?.[0])}
                  />
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Financial Statement Year
                    </span>
                    <input
                      type="number"
                      min="2020"
                      max={new Date().getFullYear()}
                      value={form.financialStatementYear as string}
                      onChange={(e) => updateForm("financialStatementYear", e.target.value)}
                      placeholder={`e.g. ${new Date().getFullYear()}`}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                    />
                  </label>
                </div>

                <FileUploadField
                  label="Bank Reference Letter or Credit Report"
                  file={form.bankReferenceDocument as File | null}
                  error={fileErrors["bankReferenceDocument"]}
                  onChange={(e) => updateFile("bankReferenceDocument", e.target.files?.[0])}
                />

                {/* Qualifications & Track Record */}
                <SectionTitle
                  title="Qualifications & Track Record"
                  description="Demonstrate your company's experience and capabilities"
                />

                <FileUploadField
                  label="Performance Certificates / ISO Certifications"
                  file={form.performanceCertificates as File | null}
                  error={fileErrors["performanceCertificates"]}
                  onChange={(e) => updateFile("performanceCertificates", e.target.files?.[0])}
                  optional={true}
                />

                <FileUploadField
                  label="Similar Past Contracts or Purchase Orders"
                  file={form.pastContractsDocument as File | null}
                  error={fileErrors["pastContractsDocument"]}
                  onChange={(e) => updateFile("pastContractsDocument", e.target.files?.[0])}
                  optional={true}
                />

                <label className="md:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Track Record Description (Optional)
                  </span>
                  <textarea
                    rows={3}
                    value={form.trackRecordDescription as string}
                    onChange={(e) => updateForm("trackRecordDescription", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                    placeholder="Brief description of similar projects completed in the last 5 years"
                  />
                </label>

                {/* Representative Authorization */}
                <SectionTitle title="Representative Authorization" />

                <FileUploadField
                  label="Authorization Letter or Special Power of Attorney (SPA)"
                  file={form.representativeAuthorizationDocument as File | null}
                  error={fileErrors["representativeAuthorizationDocument"]}
                  onChange={(e) => updateFile("representativeAuthorizationDocument", e.target.files?.[0])}
                />

                {/* Good Standing Declaration */}
                <SectionTitle title="Good Standing Declaration" />

                <label className="md:col-span-2">
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                    </div>
                  </div>
                </label>

                <FileUploadField
                  label="Sworn Statement / Affidavit (Optional)"
                  file={form.blacklistingDeclarationDocument as File | null}
                  error={fileErrors["blacklistingDeclarationDocument"]}
                  onChange={(e) => updateFile("blacklistingDeclarationDocument", e.target.files?.[0])}
                  optional={true}
                />

                {/* Other Documents */}
                <SectionTitle title="Additional Documents" />

                <FileUploadField
                  label="Other Supporting Documents"
                  file={form.supportingDocuments as File | null}
                  error={fileErrors["supportingDocuments"]}
                  onChange={(e) => updateFile("supportingDocuments", e.target.files?.[0])}
                  optional={true}
                />

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
