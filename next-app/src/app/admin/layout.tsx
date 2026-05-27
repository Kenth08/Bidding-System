"use client";
import { useState, useMemo, useCallback, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuthStore } from "@/stores/auth";
import { notificationsAPI } from "@/services/api";

const PATH_TO_PAGE: Record<string, string> = {
  "": "dashboard", "projects": "projects", "procurement": "procurement", "suppliers": "suppliers",
  "bid-evaluation": "bids", "awarding": "awarding", "users": "users", "blockchain": "records", "reports": "reports",
};
const PAGE_TO_PATH: Record<string, string> = {
  "dashboard": "", "projects": "projects", "procurement": "procurement", "suppliers": "suppliers",
  "bids": "bid-evaluation", "awarding": "awarding", "users": "users", "records": "blockchain", "reports": "reports",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, restoreSession } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { restoreSession(); }, [restoreSession]);

  const currentPage = useMemo(() => {
    const segment = pathname.replace(/^\/admin\/?/, "").split("/")[0] || "";
    return PATH_TO_PAGE[segment] || "dashboard";
  }, [pathname]);

  const setCurrentPage = useCallback((page: string) => {
    const path = PAGE_TO_PATH[page] || "";
    router.push(`/admin${path ? `/${path}` : ""}`);
  }, [router]);

  const pageMeta = useMemo(() => {
    if (currentPage === "projects") return { title: "Project Management" };
    if (currentPage === "procurement") return { title: "Procurement Planning" };
    if (currentPage === "suppliers") return { title: "Supplier Management" };
    if (currentPage === "bids") return { title: "Bid Evaluation" };
    if (currentPage === "awarding") return { title: "Awarding" };
    if (currentPage === "users") return { title: "User Accounts" };
    if (currentPage === "records") return { title: "Blockchain Records" };
    if (currentPage === "reports") return { title: "Reports & Analytics" };
    return { title: "Admin Dashboard" };
  }, [currentPage]);

  function handleNotificationNavigate(link: string) {
    if (link.startsWith("/admin")) router.push(link);
  }

  const currentUser = user ? { fullName: user.full_name, email: user.email } : null;

  // auto-clear notifications when navigating to a matching admin page
  useEffect(() => {
    if (typeof window === "undefined") return;
    (async () => {
      try {
        const res = await notificationsAPI.getAll();
        const items = res.data.results || res.data || [];
        const currUrl = new URL(window.location.href);
        const currPath = currUrl.pathname;
        const currProject = currUrl.searchParams.get("project");
        const toMark: string[] = [];
        for (const it of items) {
          if (it.is_read) continue;
          const link = String(it.link || "").trim();
          if (!link) continue;
          try {
            const parsed = new URL(link, window.location.origin);
            if (parsed.pathname === currPath) {
              const p = parsed.searchParams.get("project");
              if (!p || p === currProject) toMark.push(it.id);
            }
          } catch {
            const [path] = link.split("?");
            if (path === currPath) toMark.push(it.id);
          }
        }
        if (toMark.length) await Promise.all(toMark.map((id) => notificationsAPI.markOneRead(id).catch(() => {})));
      } catch (e) {
        // ignore
      }
    })();
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentUser={currentUser} />
      <div className="flex min-h-screen flex-col bg-slate-50 lg:pl-[248px]">
        <AdminHeader title={pageMeta.title} currentUser={currentUser} setSidebarOpen={setSidebarOpen} onLogout={logout} onNotificationNavigate={handleNotificationNavigate} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
