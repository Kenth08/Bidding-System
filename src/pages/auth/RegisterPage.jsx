// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\auth\RegisterPage.jsx
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { registerSupplier } from "../../services/authService";

const BUSINESS_TYPES = [
  "Construction",
  "IT Services",
  "Healthcare",
  "Logistics",
  "Consulting",
  "Other",
];

const INITIAL_FORM = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  companyName: "",
  companyAddress: "",
  phone: "",
  businessType: "",
};

export default function RegisterPage({ onBack, onSuccess, onGoToLogin }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.fullName || !form.email || !form.password || !form.companyName) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    const { success, error: registerError } = await registerSupplier({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      companyName: form.companyName,
      companyAddress: form.companyAddress,
      phone: form.phone,
      businessType: form.businessType,
    });

    setIsLoading(false);

    if (!success) {
      setError(registerError);
      return;
    }

    setSubmitted(true);
  }

  function handleGoToLogin() {
    if (onSuccess) {
      onSuccess();
      return;
    }

    if (onGoToLogin) {
      onGoToLogin();
    }
  }

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }

    if (onGoToLogin) {
      onGoToLogin();
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50 lg:flex">
      <button
        type="button"
        onClick={handleBack}
        className="absolute left-6 top-6 z-20 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </button>

      <div className="relative hidden w-[480px] overflow-hidden bg-slate-900 px-12 py-10 lg:flex lg:flex-col">
        <div className="absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-emerald-500/10" />
        <div className="absolute -right-16 top-14 h-72 w-72 rounded-full bg-emerald-500/10" />

        <div className="relative mb-auto flex items-center gap-3 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
            <Shield className="h-5 w-5" />
          </div>
          <p className="text-base font-bold">Blockchain E-Procurement</p>
        </div>

        <div className="relative z-10 my-auto text-white">
          <h2 className="text-3xl font-bold leading-tight">Join as a Supplier</h2>
          <p className="mt-2 text-sm text-slate-300">
            Register your company and start bidding on procurement projects
          </p>

          <div className="mt-8 space-y-3 text-left text-sm">
            <p className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              Fair evaluation process
            </p>
            <p className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              Blockchain-verified results
            </p>
            <p className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" />
              Secure bid submission
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-1 items-center justify-center bg-white px-4 py-8 lg:px-12">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-100 bg-white p-8">
          {submitted ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-fit rounded-full border border-emerald-100 bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="mt-4 text-2xl font-bold text-emerald-700">Registration Submitted!</h1>
              <p className="mt-2 text-sm text-slate-500">
                Your account is pending admin approval.
                <br />
                Once approved, you can login with your email and password.
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Registered Email: <span className="font-semibold text-slate-700">{form.email}</span>
              </p>
              <button
                type="button"
                onClick={handleGoToLogin}
                className="mt-6 rounded-xl border border-emerald-100 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition-all duration-150 hover:bg-emerald-50"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900">Supplier Registration</h1>
              <p className="mt-1 text-sm text-slate-500">Create your supplier account</p>

              <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="md:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</span>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(event) => updateForm("fullName", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                  />
                </label>

                <label className="md:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email Address</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateForm("email", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => updateForm("password", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Confirm Password</span>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(event) => updateForm("confirmPassword", event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                <label className="md:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Company Name</span>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(event) => updateForm("companyName", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                  />
                </label>

                <label className="md:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Company Address</span>
                  <input
                    type="text"
                    value={form.companyAddress}
                    onChange={(event) => updateForm("companyAddress", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone Number</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateForm("phone", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Business Type</span>
                  <select
                    value={form.businessType}
                    onChange={(event) => updateForm("businessType", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="">Select business type</option>
                    {BUSINESS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                {error ? (
                  <div className="md:col-span-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="md:col-span-2 mt-2 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-emerald-600"
                >
                  Submit Registration
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-400">
                Already have an account?{" "}
                <button type="button" onClick={handleGoToLogin} className="font-medium text-emerald-600 hover:text-emerald-700">
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
