"use client";
import { ArrowLeft, Check, CheckCircle2, Eye, EyeOff, Shield, Upload, AlertCircle, FileText, X } from "lucide-react";
import LoadingButton from "@/components/ui/LoadingButton";
import { Suspense, useState, ChangeEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI } from "@/services/api";
import StrictNumberInput from "@/components/shared/StrictNumberInput";

import { BUSINESS_TYPES } from "@/lib/business-types";

const isLocalMode = process.env.NEXT_PUBLIC_LOCAL_MODE === "true";
const FALLBACK_BUSINESS_TYPES = BUSINESS_TYPES as unknown as string[];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const STEPS = ["Basic Info", "Documents", "Declaration", "Submit"];

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${i < current ? "bg-emerald-500 text-white" : i === current ? "bg-emerald-500 text-white ring-4 ring-emerald-100" : "bg-slate-200 text-slate-500"}`}>
              {i < current ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`mt-1.5 text-[11px] font-medium ${i <= current ? "text-emerald-700" : "text-slate-400"}`}>{label}</span>
          </div>
          {i < steps.length - 1 && <div className={`h-0.5 w-full mx-1 mt-[-18px] ${i < current ? "bg-emerald-500" : "bg-slate-200"}`} />}
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 mb-5">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FileUploadBox({ label, file, error, onChange, onClear, optional = false, invalid = false, fieldKey }: { label: string; file: File | null; error?: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; onClear?: () => void; optional?: boolean; invalid?: boolean; fieldKey?: string }) {
  const inputId = `file-${(fieldKey || label).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  return (
    <div data-field={fieldKey}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        {optional ? <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Optional</span> : <span className="text-[10px] font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>}
      </div>
      <label htmlFor={inputId} className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed p-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 ${invalid ? "border-red-300 bg-red-50/30" : file ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200 bg-slate-50/50"}`}>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${file ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
          {file ? <FileText className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          {file ? (
            <p className="truncate text-sm font-medium text-slate-700">{file.name}</p>
          ) : (
            <p className="text-sm text-slate-500">Click to upload <span className="text-xs text-slate-400">· PDF, JPG, PNG · Max 5MB</span></p>
          )}
        </div>
        {file && <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClear?.(); }} className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>}
        <input id={inputId} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} className="sr-only" />
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function TextInput({ label, value, onChange, error, required = true, type = "text", readOnly = false, placeholder, fieldKey }: { label: string; value: string; onChange: (v: string) => void; error?: string; required?: boolean; type?: string; readOnly?: boolean; placeholder?: string; fieldKey?: string }) {
  return (
    <label data-field={fieldKey} className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label} {required && <span className="text-red-400">*</span>}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} readOnly={readOnly} placeholder={placeholder} className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 ${error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"} ${readOnly ? "cursor-not-allowed bg-slate-100 opacity-60" : "bg-white"}`} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}


function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nextPath, setNextPath] = useState<string | null>(null);
  const googleEmail = searchParams.get("email") || "";
  const isFromGoogle = searchParams.get("from") === "google";
  const noAccountMessage = searchParams.get("message") === "no_account";
  const [step, setStep] = useState(0);

  const [form, setForm] = useState<Record<string, any>>({
    fullName: "", email: googleEmail, password: "", confirmPassword: "",
    companyName: "", companyAddress: "", phone: "", businessTypeIds: [] as string[],
    representativeName: "", tin: "", companyProfile: "",
    secDtiCertificate: null, mayorsPm: null, mayorsPmExpiry: "",
    philgepsRegistration: null, validId: null,
    taxClearance: null, taxClearanceExpiry: "",
    auditedFinancialStatements: null, financialStatementYear: "",
    bankReferenceDocument: null,
    performanceCertificates: null, pastContractsDocument: null, trackRecordDescription: "",
    representativeAuthorizationDocument: null,
    notBlacklistedDeclaration: false, blacklistingDeclarationDocument: null,
    supportingDocuments: null,
  });

  const [availableBusinessTypes, setAvailableBusinessTypes] = useState<{ id: string; name: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/public/business-types");
        const json = res.ok ? await res.json() : [];
        const apiItems: { id: string; name: string }[] = Array.isArray(json) ? json : [];
        // Build map from API for IDs, but always show all BUSINESS_TYPES
        const apiMap = new Map(apiItems.map((b: any) => [b.name.toLowerCase(), b]));
        const merged = FALLBACK_BUSINESS_TYPES.map((name) => {
          const match = apiMap.get(name.toLowerCase());
          return match ? { id: match.id, name: match.name } : { id: name, name };
        });
        setAvailableBusinessTypes(merged);
      } catch { setAvailableBusinessTypes(FALLBACK_BUSINESS_TYPES.map((n) => ({ id: n, name: n }))); }
    })();
    const next = searchParams.get("next");
    if (next) setNextPath(next);
  }, []);

  function updateForm(key: string, value: any) { setForm((p) => ({ ...p, [key]: value })); }
  function updateFile(key: string, file: File | undefined) {
    if (file && file.size > MAX_FILE_SIZE) { setFileErrors((p) => ({ ...p, [key]: "File must be 5MB or smaller." })); updateForm(key, null); return; }
    setFileErrors((p) => ({ ...p, [key]: "" })); updateForm(key, file || null);
  }

  function validateStep(s: number): boolean {
    const errs: Record<string, string> = {};
    const req = (key: string, msg: string) => { if (!String(form[key] || "").trim()) errs[key] = msg; };
    const reqFile = (key: string, msg: string) => { if (!form[key]) errs[key] = msg; };

    if (s === 0) {
      req("fullName", "Full name is required."); req("email", "Email is required.");
      req("companyName", "Company name is required."); req("companyAddress", "Company address is required.");
      req("phone", "Phone number is required."); req("representativeName", "Representative name is required.");
      req("tin", "TIN is required."); req("companyProfile", "Company profile is required.");
      if (!(form.businessTypeIds as string[]).length) errs.businessTypeIds = "Select at least one business type.";
      if (!isFromGoogle) {
        if (!String(form.password || "").trim()) errs.password = "Password is required.";
        else if (String(form.password).length < 6) errs.password = "Password must be at least 6 characters.";
        if (!String(form.confirmPassword || "").trim()) errs.confirmPassword = "Confirm your password.";
        else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match.";
      }
      if (form.phone && !/^[0-9]+$/.test(String(form.phone).trim())) errs.phone = "Digits only.";
      if (form.tin && !/^[0-9]+$/.test(String(form.tin).trim())) errs.tin = "Digits only.";
    } else if (s === 1) {
      reqFile("secDtiCertificate", "SEC/DTI Certificate required."); reqFile("mayorsPm", "Mayor's Permit required.");
      reqFile("philgepsRegistration", "PhilGEPS Registration required."); reqFile("validId", "Valid ID required.");
      reqFile("taxClearance", "Tax Clearance required."); reqFile("auditedFinancialStatements", "Financial Statements required.");
      reqFile("bankReferenceDocument", "Bank Reference required."); reqFile("representativeAuthorizationDocument", "Authorization document required.");
      if (form.mayorsPmExpiry && new Date(form.mayorsPmExpiry as string) < new Date()) errs.mayorsPmExpiry = "Expired.";
      if (form.taxClearanceExpiry && new Date(form.taxClearanceExpiry as string) < new Date()) errs.taxClearanceExpiry = "Expired.";
      if (form.auditedFinancialStatements && !String(form.financialStatementYear).trim()) errs.financialStatementYear = "Year required.";
    } else if (s === 2) {
      if (!form.notBlacklistedDeclaration) errs.notBlacklistedDeclaration = "Declaration required.";
    }
    setValidationErrors(errs);
    if (Object.keys(errs).length) {
      setTimeout(() => { const el = document.querySelector(`[data-field="${Object.keys(errs)[0]}"]`); el?.scrollIntoView({ behavior: "smooth", block: "center" }); }, 100);
      return false;
    }
    return true;
  }

  function nextStep() { if (validateStep(step)) setStep((s) => Math.min(s + 1, 3)); }
  function prevStep() { setStep((s) => Math.max(s - 1, 0)); }


  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (!validateStep(2)) { setStep(2); return; }
    setIsLoading(true);
    try {
      const payload = new FormData();
      payload.append("full_name", form.fullName as string);
      payload.append("email", form.email as string);
      if (!isFromGoogle) payload.append("password", form.password as string);
      payload.append("company_name", form.companyName as string);
      payload.append("company_address", form.companyAddress as string);
      payload.append("phone", form.phone as string);
      for (const v of (form.businessTypeIds as string[])) payload.append("business_type_ids", v);
      payload.append("representative_name", form.representativeName as string);
      payload.append("tin", form.tin as string);
      payload.append("company_profile", form.companyProfile as string);
      if (form.secDtiCertificate) payload.append("sec_dti_certificate", form.secDtiCertificate as File);
      if (form.mayorsPm) payload.append("mayors_permit", form.mayorsPm as File);
      if (form.mayorsPmExpiry) payload.append("mayors_permit_expiry", form.mayorsPmExpiry as string);
      if (form.philgepsRegistration) payload.append("philgeps_registration", form.philgepsRegistration as File);
      if (form.validId) payload.append("valid_id", form.validId as File);
      if (form.taxClearance) payload.append("tax_clearance", form.taxClearance as File);
      if (form.taxClearanceExpiry) payload.append("tax_clearance_expiry", form.taxClearanceExpiry as string);
      if (form.auditedFinancialStatements) payload.append("audited_financial_statements", form.auditedFinancialStatements as File);
      if (form.financialStatementYear) payload.append("financial_statement_year", form.financialStatementYear as string);
      if (form.bankReferenceDocument) payload.append("bank_reference_document", form.bankReferenceDocument as File);
      if (form.performanceCertificates) payload.append("performance_certificates", form.performanceCertificates as File);
      if (form.pastContractsDocument) payload.append("past_contracts_document", form.pastContractsDocument as File);
      if (form.trackRecordDescription) payload.append("track_record_description", form.trackRecordDescription as string);
      if (form.representativeAuthorizationDocument) payload.append("representative_authorization_document", form.representativeAuthorizationDocument as File);
      payload.append("not_blacklisted_declaration", form.notBlacklistedDeclaration ? "true" : "false");
      if (form.blacklistingDeclarationDocument) payload.append("blacklisting_declaration_document", form.blacklistingDeclarationDocument as File);
      if (form.supportingDocuments) payload.append("supporting_documents", form.supportingDocuments as File);
      if (isFromGoogle) payload.append("from_google", "true");

      await authAPI.register(payload);
      if (nextPath) { router.push(`/login?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent("Registration successful. Please sign in to participate in bidding.")}`); return; }
      setSubmitted(true);
    } catch (err: unknown) { setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Registration failed."); }
    finally { setIsLoading(false); }
  }

  const requiredDocs = ["secDtiCertificate","mayorsPm","philgepsRegistration","validId","taxClearance","auditedFinancialStatements","bankReferenceDocument","representativeAuthorizationDocument"];
  const optionalDocs = ["performanceCertificates","pastContractsDocument","blacklistingDeclarationDocument","supportingDocuments"];
  const requiredDocsCount = requiredDocs.filter((k) => form[k]).length;
  const optionalDocsCount = optionalDocs.filter((k) => form[k]).length;


  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Left branding panel - desktop only */}
      <div className="fixed left-0 top-0 hidden h-screen w-[420px] bg-slate-900 lg:flex lg:flex-col px-10 py-10 overflow-hidden">
        <div className="absolute -left-16 bottom-10 h-56 w-56 rounded-full bg-emerald-500/10" />
        <div className="absolute -right-12 top-14 h-60 w-60 rounded-full bg-emerald-500/10" />
        <button type="button" onClick={() => router.push("/login")} className="relative z-10 mb-6 flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" />Back to Login</button>
        <div className="relative z-10 flex items-center gap-3 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500"><Shield className="h-5 w-5" /></div>
          <p className="text-base font-bold">Blockchain E-Procurement</p>
        </div>
        <div className="relative z-10 my-auto text-white">
          <h2 className="text-3xl font-bold leading-tight">Join as a<br/>Supplier</h2>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">Register your company and start bidding on procurement projects with full transparency.</p>
          <div className="mt-8 space-y-4">
            {["Fair evaluation process", "Blockchain-verified results", "Secure bid submission"].map((f) => (
              <div key={f} className="flex items-center gap-3"><div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20"><Check className="h-3.5 w-3.5 text-emerald-400" /></div><span className="text-sm text-slate-200">{f}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="min-h-screen lg:ml-[420px]">
        <div className="mx-auto max-w-3xl px-4 py-8 lg:px-10 lg:py-12">
          {/* Mobile header */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <button type="button" onClick={() => router.push("/login")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="h-4 w-4" />Login</button>
            <div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500"><Shield className="h-3.5 w-3.5 text-white" /></div><span className="text-sm font-bold text-slate-800">E-Procurement</span></div>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
              <div className="mx-auto w-fit rounded-full bg-emerald-50 p-4"><CheckCircle2 className="h-10 w-10 text-emerald-500" /></div>
              <h1 className="mt-5 text-2xl font-bold text-slate-900">Registration Submitted!</h1>
              <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">{isLocalMode ? "Your account is ready. Pending admin approval." : "Verify your email using the code sent to your inbox. Your account is pending admin approval."}</p>
              <p className="mt-3 text-sm text-slate-500">Email: <span className="font-semibold text-slate-700">{form.email as string}</span></p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {!isLocalMode && <button type="button" onClick={() => router.push(`/verify-email?email=${encodeURIComponent(String(form.email || ""))}`)} className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">Verify Email Now</button>}
                <button type="button" onClick={() => router.push("/login")} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back to Login</button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-slate-900">Supplier Registration</h1>
                <p className="mt-1 text-sm text-slate-500">Complete your company profile and upload required documents for admin verification.</p>
              </div>

              {noAccountMessage && <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">No account found. Please complete registration below.</div>}

              <StepIndicator current={step} steps={STEPS} />


              <form onSubmit={handleSubmit}>
                {/* Step 0: Basic Info */}
                {step === 0 && (
                  <div className="space-y-5">
                    <SectionCard title="Account Information" description="Your login credentials">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2"><TextInput label="Full Name" value={form.fullName as string} onChange={(v) => updateForm("fullName", v)} error={validationErrors.fullName} fieldKey="fullName" /></div>
                        <div className="md:col-span-2"><TextInput label="Email Address" value={form.email as string} onChange={(v) => updateForm("email", v)} error={validationErrors.email} type="email" readOnly={isFromGoogle} fieldKey="email" /></div>
                        {!isFromGoogle && (<>
                          <label data-field="password" className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Password <span className="text-red-400">*</span></span>
                            <div className="relative">
                              <input type={showPassword ? "text" : "password"} value={form.password as string} onChange={(e) => updateForm("password", e.target.value)} className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm outline-none transition-all focus:ring-2 ${validationErrors.password ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"} bg-white`} />
                              <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                            </div>
                            {validationErrors.password && <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>}
                          </label>
                          <label data-field="confirmPassword" className="block">
                            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Confirm Password <span className="text-red-400">*</span></span>
                            <div className="relative">
                              <input type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword as string} onChange={(e) => updateForm("confirmPassword", e.target.value)} className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm outline-none transition-all focus:ring-2 ${validationErrors.confirmPassword ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"} bg-white`} />
                              <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                            </div>
                            {validationErrors.confirmPassword && <p className="mt-1 text-xs text-red-600">{validationErrors.confirmPassword}</p>}
                          </label>
                        </>)}
                      </div>
                    </SectionCard>

                    <SectionCard title="Company Details" description="Your business information">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2"><TextInput label="Company Name" value={form.companyName as string} onChange={(v) => updateForm("companyName", v)} error={validationErrors.companyName} fieldKey="companyName" /></div>
                        <div className="md:col-span-2"><TextInput label="Company Address" value={form.companyAddress as string} onChange={(v) => updateForm("companyAddress", v)} error={validationErrors.companyAddress} fieldKey="companyAddress" /></div>
                        <label data-field="phone" className="block">
                          <span className="mb-1.5 block text-xs font-semibold text-slate-700">Phone Number <span className="text-red-400">*</span></span>
                          <StrictNumberInput value={form.phone as string} onChange={(v) => updateForm("phone", v)} className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 ${validationErrors.phone ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"} bg-white`} helperText="Numbers only." />
                          {validationErrors.phone && <p className="mt-1 text-xs text-red-600">{validationErrors.phone}</p>}
                        </label>
                        <label data-field="tin" className="block">
                          <span className="mb-1.5 block text-xs font-semibold text-slate-700">TIN <span className="text-red-400">*</span></span>
                          <StrictNumberInput value={form.tin as string} onChange={(v) => updateForm("tin", v)} className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 ${validationErrors.tin ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"} bg-white`} helperText="Numbers only." />
                          {validationErrors.tin && <p className="mt-1 text-xs text-red-600">{validationErrors.tin}</p>}
                        </label>
                        <div className="md:col-span-2"><TextInput label="Representative Name" value={form.representativeName as string} onChange={(v) => updateForm("representativeName", v)} error={validationErrors.representativeName} fieldKey="representativeName" /></div>
                        <div className="md:col-span-2" data-field="businessTypeIds">
                          <span className="mb-1 block text-xs font-semibold text-slate-700">Business Type <span className="text-red-400">*</span></span>
                          <p className="mb-2 text-xs text-slate-500">Select all business categories that apply to your company.</p>
                          <div className={`rounded-lg border p-3 ${validationErrors.businessTypeIds ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {availableBusinessTypes.map((bt) => (
                                <label key={bt.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer border transition-all ${(form.businessTypeIds as string[]).includes(bt.id) ? "border-emerald-400 bg-emerald-50" : "border-transparent hover:bg-slate-50"}`}>
                                  <input type="checkbox" checked={(form.businessTypeIds as string[]).includes(bt.id)} onChange={(e) => { const ids = new Set(form.businessTypeIds as string[]); if (e.target.checked) ids.add(bt.id); else ids.delete(bt.id); updateForm("businessTypeIds", Array.from(ids)); }} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                  <span className="text-sm text-slate-700">{bt.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          {validationErrors.businessTypeIds && <p className="mt-1 text-xs text-red-600">Please select at least one business type.</p>}
                        </div>
                        <div className="md:col-span-2">
                          <label data-field="companyProfile"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Company Profile & Capabilities <span className="text-red-400">*</span></span>
                            <textarea rows={3} value={form.companyProfile as string} onChange={(e) => updateForm("companyProfile", e.target.value)} placeholder="Brief company background and capability statement" className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 ${validationErrors.companyProfile ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"} bg-white`} />
                          </label>
                          {validationErrors.companyProfile && <p className="mt-1 text-xs text-red-600">{validationErrors.companyProfile}</p>}
                        </div>
                      </div>
                    </SectionCard>

                    <div className="flex justify-end"><button type="button" onClick={nextStep} className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">Next: Documents →</button></div>
                  </div>
                )}


                {/* Step 1: Documents */}
                {step === 1 && (
                  <div className="space-y-5">
                    <SectionCard title="Legal Documents" description="Required for company registration and compliance">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FileUploadBox label="SEC or DTI Certificate" file={form.secDtiCertificate as File | null} error={fileErrors.secDtiCertificate || validationErrors.secDtiCertificate} invalid={Boolean(validationErrors.secDtiCertificate)} onChange={(e) => updateFile("secDtiCertificate", e.target.files?.[0])} onClear={() => updateFile("secDtiCertificate", undefined)} fieldKey="secDtiCertificate" />
                        <FileUploadBox label="Mayor's Permit / Business Permit" file={form.mayorsPm as File | null} error={fileErrors.mayorsPm || validationErrors.mayorsPm} invalid={Boolean(validationErrors.mayorsPm)} onChange={(e) => updateFile("mayorsPm", e.target.files?.[0])} onClear={() => updateFile("mayorsPm", undefined)} fieldKey="mayorsPm" />
                        <FileUploadBox label="PhilGEPS Registration Certificate" file={form.philgepsRegistration as File | null} error={fileErrors.philgepsRegistration || validationErrors.philgepsRegistration} invalid={Boolean(validationErrors.philgepsRegistration)} onChange={(e) => updateFile("philgepsRegistration", e.target.files?.[0])} onClear={() => updateFile("philgepsRegistration", undefined)} fieldKey="philgepsRegistration" />
                        <FileUploadBox label="Valid ID (Government-Issued)" file={form.validId as File | null} error={fileErrors.validId || validationErrors.validId} invalid={Boolean(validationErrors.validId)} onChange={(e) => updateFile("validId", e.target.files?.[0])} onClear={() => updateFile("validId", undefined)} fieldKey="validId" />
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold text-slate-700">Mayor&apos;s Permit Expiry</span>
                          <input type="date" value={form.mayorsPmExpiry as string} onChange={(e) => updateForm("mayorsPmExpiry", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white" />
                          {validationErrors.mayorsPmExpiry && <p className="mt-1 text-xs text-red-600">{validationErrors.mayorsPmExpiry}</p>}
                        </label>
                      </div>
                    </SectionCard>

                    <SectionCard title="Financial Documents" description="Required to verify financial capacity">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FileUploadBox label="Tax Clearance Certificate" file={form.taxClearance as File | null} error={fileErrors.taxClearance || validationErrors.taxClearance} invalid={Boolean(validationErrors.taxClearance)} onChange={(e) => updateFile("taxClearance", e.target.files?.[0])} onClear={() => updateFile("taxClearance", undefined)} fieldKey="taxClearance" />
                        <FileUploadBox label="Audited Financial Statements" file={form.auditedFinancialStatements as File | null} error={fileErrors.auditedFinancialStatements || validationErrors.auditedFinancialStatements} invalid={Boolean(validationErrors.auditedFinancialStatements)} onChange={(e) => updateFile("auditedFinancialStatements", e.target.files?.[0])} onClear={() => updateFile("auditedFinancialStatements", undefined)} fieldKey="auditedFinancialStatements" />
                        <FileUploadBox label="Bank Reference Letter" file={form.bankReferenceDocument as File | null} error={fileErrors.bankReferenceDocument || validationErrors.bankReferenceDocument} invalid={Boolean(validationErrors.bankReferenceDocument)} onChange={(e) => updateFile("bankReferenceDocument", e.target.files?.[0])} onClear={() => updateFile("bankReferenceDocument", undefined)} fieldKey="bankReferenceDocument" />
                        <label className="block" data-field="taxClearanceExpiry">
                          <span className="mb-1.5 block text-xs font-semibold text-slate-700">Tax Clearance Expiry</span>
                          <input type="date" value={form.taxClearanceExpiry as string} onChange={(e) => updateForm("taxClearanceExpiry", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white" />
                          {validationErrors.taxClearanceExpiry && <p className="mt-1 text-xs text-red-600">{validationErrors.taxClearanceExpiry}</p>}
                        </label>
                        <label className="block" data-field="financialStatementYear">
                          <span className="mb-1.5 block text-xs font-semibold text-slate-700">Financial Statement Year</span>
                          <StrictNumberInput min="2020" max={new Date().getFullYear()} value={form.financialStatementYear as string} onChange={(v) => updateForm("financialStatementYear", v)} placeholder={`e.g. ${new Date().getFullYear()}`} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white" helperText="Year digits only." />
                          {validationErrors.financialStatementYear && <p className="mt-1 text-xs text-red-600">{validationErrors.financialStatementYear}</p>}
                        </label>
                      </div>
                    </SectionCard>

                    <SectionCard title="Qualifications & Track Record" description="Optional — demonstrate experience">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FileUploadBox label="Performance Certificates / ISO" file={form.performanceCertificates as File | null} error={fileErrors.performanceCertificates} onChange={(e) => updateFile("performanceCertificates", e.target.files?.[0])} onClear={() => updateFile("performanceCertificates", undefined)} optional />
                        <FileUploadBox label="Past Contracts / Purchase Orders" file={form.pastContractsDocument as File | null} error={fileErrors.pastContractsDocument} onChange={(e) => updateFile("pastContractsDocument", e.target.files?.[0])} onClear={() => updateFile("pastContractsDocument", undefined)} optional />
                      </div>
                      <div className="mt-4">
                        <label><span className="mb-1.5 block text-xs font-semibold text-slate-700">Track Record Description <span className="text-slate-400 font-normal">(Optional)</span></span>
                          <textarea rows={2} value={form.trackRecordDescription as string} onChange={(e) => updateForm("trackRecordDescription", e.target.value)} placeholder="Brief description of similar projects" className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white" />
                        </label>
                      </div>
                    </SectionCard>

                    <SectionCard title="Representative Authorization" description="Required authorization document">
                      <FileUploadBox label="Authorization Letter / SPA" file={form.representativeAuthorizationDocument as File | null} error={fileErrors.representativeAuthorizationDocument || validationErrors.representativeAuthorizationDocument} invalid={Boolean(validationErrors.representativeAuthorizationDocument)} onChange={(e) => updateFile("representativeAuthorizationDocument", e.target.files?.[0])} onClear={() => updateFile("representativeAuthorizationDocument", undefined)} fieldKey="representativeAuthorizationDocument" />
                    </SectionCard>

                    <div className="flex justify-between">
                      <button type="button" onClick={prevStep} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">← Back</button>
                      <button type="button" onClick={nextStep} className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">Next: Declaration →</button>
                    </div>
                  </div>
                )}


                {/* Step 2: Declaration */}
                {step === 2 && (
                  <div className="space-y-5">
                    <SectionCard title="Good Standing Declaration" description="Confirm your company's standing">
                      <div data-field="notBlacklistedDeclaration" className={`flex items-start gap-3 rounded-lg border p-4 ${validationErrors.notBlacklistedDeclaration ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-slate-50/50"}`}>
                        <input type="checkbox" checked={form.notBlacklistedDeclaration as boolean} onChange={(e) => updateForm("notBlacklistedDeclaration", e.target.checked)} className="mt-0.5 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">I declare that our company is not blacklisted by any government agency or private corporation.</p>
                          <p className="mt-1 text-xs text-slate-500">By checking this, you certify that your company has no record of blacklisting or debarment.</p>
                          {validationErrors.notBlacklistedDeclaration && <p className="mt-2 text-xs text-red-600">{validationErrors.notBlacklistedDeclaration}</p>}
                        </div>
                      </div>
                      <div className="mt-4">
                        <FileUploadBox label="Sworn Statement / Affidavit" file={form.blacklistingDeclarationDocument as File | null} error={fileErrors.blacklistingDeclarationDocument} onChange={(e) => updateFile("blacklistingDeclarationDocument", e.target.files?.[0])} onClear={() => updateFile("blacklistingDeclarationDocument", undefined)} optional />
                      </div>
                    </SectionCard>

                    <SectionCard title="Additional Documents" description="Any other supporting documents">
                      <FileUploadBox label="Other Supporting Documents" file={form.supportingDocuments as File | null} error={fileErrors.supportingDocuments} onChange={(e) => updateFile("supportingDocuments", e.target.files?.[0])} onClear={() => updateFile("supportingDocuments", undefined)} optional />
                    </SectionCard>

                    <div className="flex justify-between">
                      <button type="button" onClick={prevStep} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">← Back</button>
                      <button type="button" onClick={nextStep} className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">Next: Review →</button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Submit */}
                {step === 3 && (
                  <div className="space-y-5">
                    <SectionCard title="Review & Submit" description="Verify your information before submitting">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                          <p className="text-2xl font-bold text-emerald-600">{requiredDocsCount}/{requiredDocs.length}</p>
                          <p className="text-xs text-slate-500 mt-1">Required docs uploaded</p>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                          <p className="text-2xl font-bold text-slate-700">{optionalDocsCount}</p>
                          <p className="text-xs text-slate-500 mt-1">Optional docs uploaded</p>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                          <p className="text-sm font-semibold text-amber-600 mt-1">Pending Review</p>
                          <p className="text-xs text-slate-500 mt-1">Status after submission</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 flex gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
                        <div className="text-xs text-blue-700 space-y-1">
                          <p>• All files must be 5MB or smaller (PDF, JPG, PNG)</p>
                          <p>• Your account will be pending admin verification after submission</p>
                          <p>• You must complete all required documents to submit bids</p>
                        </div>
                      </div>
                    </SectionCard>

                    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex gap-2"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}

                    <div className="flex justify-between">
                      <button type="button" onClick={prevStep} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">← Back</button>
                      <LoadingButton type="submit" isLoading={isLoading} loadingText="Submitting..." className="rounded-xl bg-emerald-500 px-8 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">Submit Registration</LoadingButton>
                    </div>
                  </div>
                )}
              </form>

              <p className="mt-6 text-center text-sm text-slate-400">Already have an account? <button type="button" onClick={() => router.push("/login")} className="font-medium text-emerald-600 hover:text-emerald-700">Sign In</button></p>
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
