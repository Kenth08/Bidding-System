"use client";
import { ArrowLeft, Check, CheckCircle2, Eye, EyeOff, Shield, Upload } from "lucide-react";
import LoadingButton from "@/components/ui/LoadingButton";
import { useState, ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI } from "@/services/api";

const BUSINESS_TYPES = ["Construction", "IT Services", "Healthcare", "Logistics", "Consulting", "Other"];
const REQUIRED_DOCUMENTS = [
  { key: "businessPermitDocument", label: "Business Permit Document" },
  { key: "philGepsRegistration", label: "PhilGEPS Registration" },
  { key: "taxClearance", label: "Tax Clearance" },
  { key: "validId", label: "Valid ID" },
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function FileUploadField({ label, file, error, onChange }: { label: string; file: File | null; error?: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void }) {
  const inputId = label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
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

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleEmail = searchParams.get("email") || "";
  const isFromGoogle = searchParams.get("from") === "google";
  const noAccountMessage = searchParams.get("message") === "no_account";
  const [form, setForm] = useState<Record<string, string | File | null>>({ fullName: "", email: googleEmail, password: "", confirmPassword: "", companyName: "", companyAddress: "", phone: "", businessType: "", businessPermitDocument: null, philGepsRegistration: null, taxClearance: null, validId: null });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  function updateForm(key: string, value: string | File | null) { setForm((p) => ({ ...p, [key]: value })); }
  function updateFile(key: string, file: File | undefined) {
    if (file && file.size > MAX_FILE_SIZE) { setFileErrors((p) => ({ ...p, [key]: "File must be 5MB or smaller." })); updateForm(key, null); return; }
    setFileErrors((p) => ({ ...p, [key]: "" })); updateForm(key, file || null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (!form.fullName || !form.email || !form.companyName) { setError("Please fill in all required fields."); return; }
    if (!isFromGoogle && (!form.password || !form.confirmPassword)) { setError("Please fill in all required fields."); return; }
    const missing = REQUIRED_DOCUMENTS.find(({ key }) => !form[key]);
    if (missing) { setError(`Please upload ${missing.label}.`); return; }
    if (!isFromGoogle) {
      if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
      if (String(form.password).length < 6) { setError("Password must be at least 6 characters."); return; }
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
      payload.append("business_permit_document", form.businessPermitDocument as File);
      if (form.philGepsRegistration) payload.append("philgeps_registration", form.philGepsRegistration as File);
      if (form.taxClearance) payload.append("tax_clearance", form.taxClearance as File);
      if (form.validId) payload.append("valid_id", form.validId as File);
      if (isFromGoogle) payload.append("from_google", "true");
      await authAPI.register(payload);
      setSubmitted(true);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Registration failed.");
    } finally { setIsLoading(false); }
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      <div className="fixed left-0 top-0 hidden h-screen w-[480px] overflow-hidden bg-slate-900 lg:flex lg:flex-col px-12 py-10">
        <div className="absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-emerald-500/10" />
        <div className="absolute -right-16 top-14 h-72 w-72 rounded-full bg-emerald-500/10" />
        <button type="button" onClick={() => router.push("/login")} className="relative z-10 mb-6 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" />Back to Login</button>
        <div className="relative z-10 flex items-center gap-3 text-white"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500"><Shield className="h-5 w-5" /></div><p className="text-base font-bold">Blockchain E-Procurement</p></div>
        <div className="relative z-10 my-auto text-white">
          <h2 className="text-3xl font-bold leading-tight">Join as a Supplier</h2>
          <p className="mt-2 text-sm text-slate-300">Register your company and start bidding on procurement projects</p>
          <div className="mt-8 space-y-3 text-left text-sm">
            {["Fair evaluation process", "Blockchain-verified results", "Secure bid submission"].map((f) => (<p key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" />{f}</p>))}
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-1 items-center justify-center bg-white px-4 py-8 lg:ml-[480px] lg:px-12">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-100 bg-white p-8">
          <button type="button" onClick={() => router.push("/login")} className="mb-4 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-600 lg:hidden"><ArrowLeft className="h-4 w-4" />Back to Login</button>
          {submitted ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-fit rounded-full border border-emerald-100 bg-emerald-50 p-3 text-emerald-600"><CheckCircle2 className="h-8 w-8" /></div>
              <h1 className="mt-4 text-2xl font-bold text-emerald-700">Registration Submitted!</h1>
              <p className="mt-2 text-sm text-slate-500">Your account is pending admin approval.<br />Once approved, you can login with your email and password.</p>
              <p className="mt-3 text-sm text-slate-500">Registered Email: <span className="font-semibold text-slate-700">{form.email as string}</span></p>
              <button type="button" onClick={() => router.push("/login")} className="mt-6 rounded-xl border border-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition-all duration-150 hover:bg-emerald-50">Back to Login</button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900">Supplier Registration</h1>
              {noAccountMessage && <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">No account found for this email. Please complete the registration below.</div>}
              <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {[{ key: "fullName", label: "Full Name", span: true }, { key: "email", label: "Email Address", span: true, type: "email", readOnly: isFromGoogle }].map(({ key, label, span, type, readOnly }) => (
                  <label key={key} className={span ? "md:col-span-2" : ""}>
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
                    <input type={type || "text"} value={form[key] as string} onChange={(e) => updateForm(key, e.target.value)} readOnly={readOnly} className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20 ${readOnly ? "cursor-not-allowed opacity-60" : ""}`} />
                  </label>
                ))}
                {!isFromGoogle && (
                  <>
                    <label>
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</span>
                      <div className="relative"><input type={showPassword ? "text" : "password"} value={form.password as string} onChange={(e) => updateForm("password", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" /><button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
                    </label>
                    <label>
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Confirm Password</span>
                      <div className="relative"><input type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword as string} onChange={(e) => updateForm("confirmPassword", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" /><button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
                    </label>
                  </>
                )}
                {[{ key: "companyName", label: "Company Name", span: true }, { key: "companyAddress", label: "Company Address", span: true }].map(({ key, label, span }) => (
                  <label key={key} className={span ? "md:col-span-2" : ""}>
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
                    <input type="text" value={form[key] as string} onChange={(e) => updateForm(key, e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" />
                  </label>
                ))}
                <label>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone Number</span>
                  <input type="tel" value={form.phone as string} onChange={(e) => updateForm("phone", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" />
                </label>
                <label>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Business Type</span>
                  <select value={form.businessType as string} onChange={(e) => updateForm("businessType", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20">
                    <option value="">Select business type</option>
                    {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <div className="md:col-span-2 grid grid-cols-1 gap-4">
                  {REQUIRED_DOCUMENTS.map(({ key, label }) => (
                    <FileUploadField key={key} label={label} file={form[key] as File | null} error={fileErrors[key]} onChange={(e) => updateFile(key, e.target.files?.[0])} />
                  ))}
                </div>
                <div className="md:col-span-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"><p className="text-xs text-slate-400">Files must be 5MB or smaller. After registration, your account will be pending admin approval.</p></div>
                {error ? <div className="md:col-span-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div> : null}
                <LoadingButton type="submit" isLoading={isLoading} loadingText="Registering..." className="md:col-span-2 mt-2 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-emerald-600">Submit Registration</LoadingButton>
              </form>
              <p className="mt-5 text-center text-sm text-slate-400">Already have an account?{" "}<button type="button" onClick={() => router.push("/login")} className="font-medium text-emerald-600 hover:text-emerald-700">Sign In</button></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
