"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isLoading, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    const roleRoute = user.role === "admin" ? "/admin" : user.role === "school_head" ? "/school-head" : "/supplier";
    router.replace(roleRoute);
  }, [isLoading, router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 text-center text-slate-700 shadow-sm">
        <p className="text-sm font-medium">Loading dashboard...</p>
      </div>
    </div>
  );
}
