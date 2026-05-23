import { create } from "zustand";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (access: string, refresh: string, user: User) => void;
  logout: () => void;
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

  logout: () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    set({ user: null });
  },

  restoreSession: async () => {
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
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
