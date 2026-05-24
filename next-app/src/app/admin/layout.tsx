"use client";
import { useState, useMemo, useCallback, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuthStore } from "@/stores/auth";

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
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
