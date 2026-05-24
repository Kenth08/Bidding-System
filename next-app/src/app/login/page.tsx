"use client";
import { ArrowLeft, Check, Eye, EyeOff, Lock, Shield } from "lucide-react";
import LoadingButton from "@/components/ui/LoadingButton";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "pending") setError("Your account is pending admin approval. Please wait for verification.");
    else if (err === "rejected") setError("Your registration has been rejected. Please contact the administrator.");
    else if (err === "inactive") setError("Your account is inactive.");
    else if (err === "auth_failed") setError("Google authentication failed. Please try again.");
    else if (err === "missing_code") setError("Google sign-in was interrupted. Please try again.");
  }, [searchParams]);

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

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
      if (role === "admin") window.location.href = "/admin";
      else if (role === "school_head") window.location.href = "/school-head";
      else if (role === "supplier") window.location.href = "/supplier";
      else window.location.href = "/";
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { error?: string; incomplete?: boolean; user?: { email?: string } } } })?.response?.data;
      if (response?.incomplete && response?.user?.email) {
        router.push(`/register?email=${encodeURIComponent(response.user.email)}&from=google`);
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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          </div>
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
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-slate-400">or</span></div>
            </div>
            <button type="button" onClick={handleGoogleLogin} disabled={googleLoading} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50">
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {googleLoading ? "Redirecting..." : "Continue with Google"}
            </button>
            <p className="mt-4 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => router.push("/register")} className="font-medium text-emerald-600 hover:text-emerald-700">Register as Supplier</button>
            </p>
          </form>
        </div>
        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-300"><Lock className="h-3.5 w-3.5" /><span>Secured by blockchain technology</span></div>
        <p className="mt-2 text-center text-xs text-slate-300">&copy; 2026 Blockchain E-Procurement System</p>
      </div>
    </div>
  );
}
