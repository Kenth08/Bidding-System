"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth";

const isLocalMode = process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuthStore();

  useEffect(() => {
    async function handleCallback() {
      if (isLocalMode) {
        router.replace("/login?error=local_mode");
        return;
      }

      // PKCE: if there's a code in the URL, exchange it first
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace("/login?error=auth_failed");
          return;
        }
      }

      // Now get the session (either from exchange above or existing)
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session?.user?.email) {
        router.replace("/login?error=auth_failed");
        return;
      }

      // Send email to our API to get app JWT tokens
      try {
        const res = await fetch("/api/auth/google/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.session.user.email }),
        });
        const result = await res.json();

        if (!res.ok) {
          router.replace(result.redirect || "/login?error=auth_failed");
          return;
        }

        login(result.access, result.refresh, result.user);
        const role = result.user?.role;
        if (role === "admin") window.location.href = "/admin";
        else if (role === "school_head") window.location.href = "/school-head";
        else window.location.href = "/supplier";
      } catch {
        router.replace("/login?error=auth_failed");
      }
    }

    handleCallback();
  }, [router, login]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-sm text-slate-600">Signing you in...</p>
      </div>
    </div>
  );
}
