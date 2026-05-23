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
    if (currentPage === "projects") return { title: "Project Management", subtitle: "Create, update, and monitor procurement projects" };
    if (currentPage === "procurement") return { title: "Procurement Planning", subtitle: "Create and manage procurement requests" };
    if (currentPage === "suppliers") return { title: "Supplier Management", subtitle: "Review registrations and supplier status" };
    if (currentPage === "bids") return { title: "Bid Evaluation", subtitle: "Review proposals and rank suppliers by bid amount" };
    if (currentPage === "awarding") return { title: "Awarding", subtitle: "Generate award documents and manage winning bids" };
    if (currentPage === "users") return { title: "User Accounts", subtitle: "Manage access, roles, and account status" };
    if (currentPage === "records") return { title: "Blockchain Records", subtitle: "Inspect immutable procurement ledger entries" };
    if (currentPage === "reports") return { title: "Reports & Analytics", subtitle: "View procurement and supplier performance reports" };
    return { title: "Admin Dashboard", subtitle: "" };
  }, [currentPage]);

  function handleNotificationNavigate(link: string) {
    if (link.startsWith("/admin")) router.push(link);
  }

  const currentUser = user ? { fullName: user.full_name, email: user.email } : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentUser={currentUser} />
      <div className="flex min-h-screen flex-col bg-slate-50 lg:pl-[248px]">
        <AdminHeader title={pageMeta.title} subtitle={pageMeta.subtitle} currentUser={currentUser} setSidebarOpen={setSidebarOpen} onLogout={logout} onNotificationNavigate={handleNotificationNavigate} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
