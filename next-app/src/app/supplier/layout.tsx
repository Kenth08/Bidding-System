"use client";
import { useState, useMemo, useCallback, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import SupplierHeader from "@/components/supplier/SupplierHeader";
import SupplierSidebar from "@/components/supplier/SupplierSidebar";
import SupplierProfileModal from "@/components/supplier/SupplierProfileModal";
import SupplierSettingsModal from "@/components/supplier/SupplierSettingsModal";
import { useAuthStore } from "@/stores/auth";

const PATH_TO_PAGE: Record<string, string> = { "": "dashboard", "projects": "available-projects", "bids": "my-bids", "results": "results", "profile": "profile" };
const PAGE_TO_PATH: Record<string, string> = { "dashboard": "", "available-projects": "projects", "my-bids": "bids", "results": "results", "profile": "profile" };

export default function SupplierLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, restoreSession } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => { restoreSession(); }, [restoreSession]);

  useEffect(() => {
    if (!user) return;
    if (user.status === "incomplete_registration") {
      router.replace(`/register?email=${encodeURIComponent(user.email)}&from=google`);
    } else if (user.status === "pending") {
      router.replace("/login?error=pending");
    } else if (user.status === "rejected") {
      router.replace("/login?error=rejected");
    }
  }, [user, router]);

  const currentPage = useMemo(() => {
    const segment = pathname.replace(/^\/supplier\/?/, "").split("/")[0] || "";
    return PATH_TO_PAGE[segment] || "dashboard";
  }, [pathname]);

  const setCurrentPage = useCallback((page: string) => {
    const path = PAGE_TO_PATH[page] || "";
    router.push(`/supplier${path ? `/${path}` : ""}`);
  }, [router]);

  const pageMeta = useMemo(() => {
    if (currentPage === "available-projects") return { title: "Available Projects" };
    if (currentPage === "my-bids") return { title: "My Bids" };
    if (currentPage === "results") return { title: "Results" };
    if (currentPage === "profile") return { title: "My Profile" };
    return { title: "Supplier Dashboard" };
  }, [currentPage]);

  function handleNotificationNavigate(link: string) {
    if (link.startsWith("/supplier")) router.push(link);
  }

  const currentUser = user ? {
    fullName: user.full_name,
    email: user.email,
    full_name: user.full_name,
    company_name: user.company_name,
    company_address: user.company_address,
    phone: user.phone,
    business_type: user.business_type,
    representative_name: user.representative_name,
    tin: user.tin,
    status: user.status,
  } : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SupplierSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentUser={currentUser} />
      <div className="flex min-h-screen flex-col bg-slate-50 lg:pl-[248px]">
        <SupplierHeader title={pageMeta.title} user={currentUser} setSidebarOpen={setSidebarOpen} onLogout={logout} onNotificationNavigate={handleNotificationNavigate} onOpenProfile={() => setShowProfileModal(true)} onOpenSettings={() => setShowSettingsModal(true)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <SupplierProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} currentUser={currentUser} />
      <SupplierSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </div>
  );
}
