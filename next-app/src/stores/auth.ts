import { create } from "zustand";
import { User } from "@/types";import { authAPI } from "@/services/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (access: string, refresh: string, user: User) => void;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),

  login: (access, refresh, user) => {
    sessionStorage.setItem("access_token", access);
    sessionStorage.setItem("refresh_token", refresh);
    set({ user });
  },

  logout: async () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    set({ user: null });
    window.location.href = "/login";
  },

  restoreSession: async () => {
    try {
      const res = await authAPI.me();
      if (res.data) {
        const user = res.data;
        set({ user, isLoading: false });
      } else {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
