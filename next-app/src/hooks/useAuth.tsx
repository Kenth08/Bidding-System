"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    if (isLoading) restoreSession();
  }, [isLoading, restoreSession]);

  return { user, isLoading };
}

export default useAuth;
