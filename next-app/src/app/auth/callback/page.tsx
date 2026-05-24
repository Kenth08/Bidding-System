"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, restoreSession } = useAuthStore();

  useEffect(() => {
    const access = searchParams.get("access");
    const refresh = searchParams.get("refresh");

    if (access && refresh) {
      sessionStorage.setItem("access_token", access);
      sessionStorage.setItem("refresh_token", refresh);
      restoreSession().then(() => {
        router.replace("/supplier");
      });
    } else {
      router.replace("/login");
    }
  }, [searchParams, restoreSession, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-slate-500">Signing you in...</p>
    </div>
  );
}
