"use client";
import { useState, useMemo, useCallback, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import SchoolHeadHeader from "@/components/school_head/SchoolHeadHeader";
import SchoolHeadSidebar from "@/components/school_head/SchoolHeadSidebar";
import { useAuthStore } from "@/stores/auth";
import { notificationsAPI } from "@/services/api";

const PATH_TO_PAGE: Record<string, string> = { "": "dashboard", "requests": "requests", "history": "history" };
const PAGE_TO_PATH: Record<string, string> = { "dashboard": "", "requests": "requests", "history": "history" };

export default function SchoolHeadLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, restoreSession } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { restoreSession(); }, [restoreSession]);

  const currentPage = useMemo(() => {
    const segment = pathname.replace(/^\/school-head\/?/, "").split("/")[0] || "";
    return PATH_TO_PAGE[segment] || "dashboard";
  }, [pathname]);

  const setCurrentPage = useCallback((page: string) => {
    const path = PAGE_TO_PATH[page] || "";
    router.push(`/school-head${path ? `/${path}` : ""}`);
  }, [router]);

  const pageMeta = useMemo(() => {
    if (currentPage === "requests") return { title: "Procurement Requests" };
    if (currentPage === "history") return { title: "Approved Records" };
    return { title: "Head Dashboard" };
  }, [currentPage]);

  function handleNotificationNavigate(link: string) {
    if (link.startsWith("/school-head")) router.push(link);
  }

  const currentUser = user ? { full_name: user.full_name, email: user.email } : null;

  // auto-clear notifications when navigating to a matching school-head page
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
      <SchoolHeadSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentUser={currentUser} />
      <div className="flex min-h-screen flex-col bg-slate-50 lg:pl-[248px]">
        <SchoolHeadHeader title={pageMeta.title} currentUser={currentUser} setSidebarOpen={setSidebarOpen} onLogout={logout} onNotificationNavigate={handleNotificationNavigate} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
