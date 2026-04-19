// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\auth\LoginPage.jsx
import { ArrowLeft, Building2, Check, Eye, EyeOff, Loader2, Lock, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { loginUser } from "../../services/authService";

export default function LoginPage({ defaultRole = "admin", onLogin, onBack, onGoToRegister }) {
  const [activeRole, setActiveRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (defaultRole === "admin" || defaultRole === "supplier") {
      setActiveRole(defaultRole);
    }
  }, [defaultRole]);

  const roleConfig = {
    admin: {
      title: "Admin Portal",
      subtitle: "Sign in to your workspace",
      hint: "Use: admin@gmail.com / admin123",
      email: "admin@gmail.com",
    },
    supplier: {
      title: "Supplier Portal",
      subtitle: "Sign in to your workspace",
      hint: "Use your registered supplier email and password",
      email: "supplier@example.com",
    },
  }[activeRole];

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    setError("");

    const { user, error } = await loginUser(email, password);

    setIsLoading(false);

    if (error) {
      setError(error);
      return;
    }

    onLogin(user.role, user);
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
          <div className="mb-8 flex gap-1 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setActiveRole("admin")}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                activeRole === "admin"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("supplier")}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                activeRole === "supplier"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Supplier
            </button>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to your {activeRole === "admin" ? "Admin" : "Supplier"} workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email Address</span>
              <input
                type="email"
                placeholder={roleConfig.email}
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

            <p className="mt-4 text-center text-xs text-slate-300">{roleConfig.hint}</p>

            {activeRole === "supplier" ? (
              <p className="text-center text-sm text-slate-400">
                Don&apos;t have an account?{" "}
                <button type="button" onClick={onGoToRegister} className="font-medium text-emerald-600 hover:text-emerald-700">
                  Register as Supplier
                </button>
              </p>
            ) : null}

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
