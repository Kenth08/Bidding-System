"use client";
import { useState, useMemo, useCallback, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import SchoolHeadHeader from "@/components/school_head/SchoolHeadHeader";
import SchoolHeadSidebar from "@/components/school_head/SchoolHeadSidebar";
import { useAuthStore } from "@/stores/auth";

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
    return { title: "School Head Dashboard" };
  }, [currentPage]);

  function handleNotificationNavigate(link: string) {
    if (link.startsWith("/school-head")) router.push(link);
  }

  const currentUser = user ? { full_name: user.full_name, email: user.email } : null;

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
