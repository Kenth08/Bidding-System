// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\auth\LoginPage.jsx
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Lock, Shield } from "lucide-react";
import { useState } from "react";
import { authAPI } from "../../services/api";

export default function LoginPage({ onLogin, onBack, onGoToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await authAPI.login(email, password);
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      onLogin(res.data.user.role, res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50 lg:flex">
      <button
        type="button"
        onClick={onBack}
        className="absolute left-6 top-6 z-20 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </button>

      <div
        className="relative hidden min-h-screen w-[480px] flex-col overflow-hidden bg-slate-900 px-12 py-10 lg:flex"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500 opacity-[0.06] blur-3xl" />

        <div className="relative my-auto rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <p className="text-base font-bold text-white">Blockchain E-Procurement</p>
          </div>

          <h2 className="mb-3 text-3xl font-bold leading-tight text-white">
            Transparent.
            <br />
            Secure.
            <br />
            Immutable.
          </h2>
          <p className="mb-8 text-sm text-slate-400">
            A blockchain-powered procurement platform built for fairness and full auditability.
          </p>

          <div className="space-y-3">
            {["Immutable blockchain records", "Role-based access control", "Real-time bid monitoring"].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                  <Check className="h-3 w-3 text-emerald-400" />
                </div>
                <span className="text-sm text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-white px-6 py-8 lg:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email Address</span>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-800 outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isLoading ? "Signing In..." : "Sign In"}
            </button>

            {error ? (
              <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
            ) : null}
            <p className="mt-4 text-center text-sm text-slate-500">
              Don’t have an account?{' '}
              <button type="button" onClick={onGoToRegister} className="font-medium text-emerald-600 hover:text-emerald-700">
                Register as Supplier
              </button>
            </p>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-300">
          <Lock className="h-3.5 w-3.5" />
          <span>Secured by blockchain technology</span>
        </div>
        <p className="mt-2 text-center text-xs text-slate-300">© 2026 Blockchain E-Procurement System</p>
      </div>
    </div>
  );
}
