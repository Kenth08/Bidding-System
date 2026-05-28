"use client";
import { ArrowLeft, Check, Eye, EyeOff, Lock, Shield } from "lucide-react";
import LoadingButton from "@/components/ui/LoadingButton";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI } from "@/services/api";
import { useAuthStore } from "@/stores/auth";

const isLocalMode = process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [incomingMessage, setIncomingMessage] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    const verified = searchParams.get("verified");
    const emailFromQuery = searchParams.get("email");
    const next = searchParams.get("next");
    const message = searchParams.get("message");
    if (next) setNextPath(next);
    if (message) setIncomingMessage(message);
    if (err === "pending") setError("Your account is pending admin approval. Please wait for verification.");
    else if (err === "rejected") setError("Your registration has been rejected. Please contact the administrator.");
    else if (err === "inactive") setError("Your account is inactive.");
    else if (err === "auth_failed") setError("Google authentication failed. Please try again.");
    else if (err === "missing_code") setError("Google sign-in was interrupted. Please try again.");
    else if (verified === "1") setError("Email verified successfully. You can now sign in.");

    if (emailFromQuery) setEmail(emailFromQuery);
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setIsLoading(true);
    setError("");
    try {
      const res = await authAPI.login(email, password);
      const { access, refresh, user } = res.data;
      if (user?.status === "incomplete_registration") {
        router.push(`/register?email=${encodeURIComponent(user.email)}&from=google`);
        return;
      }
      login(access, refresh, user);
      const role = user?.role;
      // If there's a nextPath provided (user clicked an open bid), prefer redirecting there.
      if (nextPath) {
        // If supplier but not approved, append account_status to let destination handle UI
        if (role === "supplier" && !["approved", "active"].includes(user?.status)) {
          const sep = nextPath.includes("?") ? "&" : "?";
          router.push(`${nextPath}${sep}account_status=pending`);
          return;
        }
        router.push(nextPath);
        return;
      }

      if (role === "admin") router.push("/admin");
      else if (role === "school_head") router.push("/school-head");
      else if (role === "supplier") router.push("/supplier");
      else router.push("/");
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { error?: string; incomplete?: boolean; user?: { email?: string } } } })?.response?.data;
      if (response?.incomplete && response?.user?.email) {
        router.push(`/register?email=${encodeURIComponent(response.user.email)}&from=google`);
        return;
      }
      if ((response as any)?.email_verification_required && (response as any)?.email) {
        router.push(`/verify-email?email=${encodeURIComponent((response as any).email)}`);
        return;
      }
      const msg = response?.error || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50 lg:flex">
      <button type="button" onClick={() => router.push("/")} className="absolute left-6 top-6 z-20 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-600">
        <ArrowLeft className="h-4 w-4" />Back to Home
      </button>

      <div className="relative hidden min-h-screen w-[480px] flex-col overflow-hidden bg-slate-900 px-12 py-10 lg:flex" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }}>
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500 opacity-[0.06] blur-3xl" />
        <div className="relative my-auto rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500"><Shield className="h-5 w-5 text-white" /></div>
            <p className="text-base font-bold text-white">Blockchain E-Procurement</p>
          </div>
          <h2 className="mb-3 text-3xl font-bold leading-tight text-white">Transparent.<br />Secure.<br />Immutable.</h2>
          <p className="mb-8 text-sm text-slate-400">A blockchain-powered procurement platform built for fairness and full auditability.</p>
          <div className="space-y-3">
            {["Immutable blockchain records", "Role-based access control", "Real-time bid monitoring"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10"><Check className="h-3 w-3 text-emerald-400" /></div>
                <span className="text-sm text-slate-300">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-white px-6 py-8 lg:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          </div>
          {incomingMessage ? (
            <div className="mb-4 rounded-xl border-l-4 border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {incomingMessage}
            </div>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email Address</span>
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</span>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-800 outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" />
                <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600" aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <LoadingButton type="submit" isLoading={isLoading} loadingText="Signing In..." className="mt-5 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-emerald-600 active:scale-[0.98]">Sign In</LoadingButton>
            {error ? <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div> : null}
            {isLocalMode ? <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-center text-xs text-slate-500">Local mode is enabled. Google sign-in is disabled.</p> : null}
            <div className="mt-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Want to Join Procurement Opportunities?</h3>
                <p className="mt-2 text-xs text-slate-500">Register as a supplier to submit proposals, participate in bidding, and access procurement opportunities.</p>
                <div className="mt-3 flex gap-3">
                  <button type="button" onClick={() => router.push("/register")} className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white">Register Supplier</button>
                  <button type="button" onClick={() => {/* stay on login */}} className="rounded-xl border px-3 py-2 text-sm font-semibold text-emerald-600">Login</button>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-300"><Lock className="h-3.5 w-3.5" /><span>Secured by blockchain technology</span></div>
        <p className="mt-2 text-center text-xs text-slate-300">&copy; 2026 Blockchain E-Procurement System</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <LoginPageContent />
    </Suspense>
  );
}
