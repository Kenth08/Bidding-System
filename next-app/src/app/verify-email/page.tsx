"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authAPI } from "@/services/api";
import LoadingButton from "@/components/ui/LoadingButton";

const isLocalMode = process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const queryEmail = searchParams.get("email") || "";
    if (queryEmail) setEmail(queryEmail);
  }, [searchParams]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !code.trim()) {
      setError("Enter your email and verification code.");
      return;
    }

    setIsVerifying(true);
    try {
      await authAPI.verifyEmail(email.trim().toLowerCase(), code.trim());
      setMessage("Email verified successfully. You can now sign in.");
      setTimeout(() => router.push(`/login?verified=1&email=${encodeURIComponent(email.trim().toLowerCase())}`), 900);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to verify email.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    setIsResending(true);
    try {
      const res = await authAPI.resendVerificationCode(email.trim().toLowerCase());
      setMessage(res.data?.message || "Verification code sent.");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to resend code.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Verify Your Email</h1>
        <p className="mt-2 text-sm text-slate-500">{isLocalMode ? "Email verification is disabled in local mode." : "Enter the 6-digit verification code sent to your email address."}</p>

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email Address</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Verification Code</span>
            <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm tracking-[0.35em] outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" placeholder="123456" />
          </label>

          {error ? <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p> : null}
          {message ? <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p> : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LoadingButton type="button" isLoading={isResending} onClick={handleResend} loadingText="Sending..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Resend Code</LoadingButton>
            <LoadingButton type="submit" isLoading={isVerifying} loadingText="Verifying..." className="w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">Verify Email</LoadingButton>
          </div>
        </form>

        <button type="button" onClick={() => router.push("/login")} className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700">Back to Login</button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}