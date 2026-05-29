"use client";
import { useState, useMemo, useCallback, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import SupplierHeader from "@/components/supplier/SupplierHeader";
import SupplierSidebar from "@/components/supplier/SupplierSidebar";
import SupplierProfileModal from "@/components/supplier/SupplierProfileModal";
import SupplierSettingsModal from "@/components/supplier/SupplierSettingsModal";
import { useAuthStore } from "@/stores/auth";
import { notificationsAPI, suppliersAPI } from "@/services/api";

const PATH_TO_PAGE: Record<string, string> = { "": "dashboard", "projects": "available-projects", "bids": "my-bids", "results": "results", "profile": "profile", "verification-status": "verification-status" };
const PAGE_TO_PATH: Record<string, string> = { "dashboard": "", "available-projects": "projects", "my-bids": "bids", "results": "results", "profile": "profile", "verification-status": "verification-status" };

export default function SupplierLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, restoreSession } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [accessState, setAccessState] = useState<"verified" | "restricted">("restricted");

  useEffect(() => { restoreSession(); }, [restoreSession]);

  // auto-clear notifications when user navigates to a page matching a notification
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
              // if project query present, require match (if notification has project)
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

  useEffect(() => {
    if (!user) return;
    if (user.status === "incomplete_registration") {
      router.replace(`/register?email=${encodeURIComponent(user.email)}&from=google`);
    } else if (user.status === "pending") {
      router.replace("/login?error=pending");
    } else if (user.status === "rejected") {
      router.replace("/login?error=rejected");
    }
  }, [user, router, pathname]);

  useEffect(() => {
    if (!user || user.role !== "supplier") return;

    let timer: ReturnType<typeof setInterval> | undefined;

    const syncAccess = async () => {
      try {
        const response = await suppliersAPI.getMyDocumentWorkflow();
        const accessState = String(response.data?.accessState || "restricted");
        const verificationState = String(response.data?.verificationState || "pending");
        setAccessState(accessState === "verified" ? "verified" : "restricted");
        const currentPath = pathname || "";
        const isAllowedPath =
          currentPath.startsWith("/supplier/profile") ||
          currentPath.startsWith("/supplier/verification-status") ||
          currentPath.startsWith("/supplier/documents/reupload");

        if (accessState !== "verified" && !isAllowedPath) {
          router.replace(verificationState === "flagged" ? "/supplier/documents/reupload" : "/supplier/verification-status");
          return;
        }

        if (accessState === "verified" && (currentPath.startsWith("/supplier/verification-status") || currentPath.startsWith("/supplier/documents/reupload"))) {
          router.replace("/supplier");
        }
      } catch {
        // ignore workflow fetch errors in layout guard
      }
    };

    syncAccess();
    timer = setInterval(syncAccess, 15000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [user, pathname, router]);

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
    if (currentPage === "verification-status") return { title: "Verification Status" };
    return { title: "Supplier Dashboard" };
  }, [currentPage]);

  function handleNotificationNavigate(link: string) {
    if (link.startsWith("/supplier")) router.push(link);
  }

  function titleCase(value = "") {
    return value
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")
      .trim();
  }

  const currentUser = user
    ? (() => {
        const raw = user.full_name || user.company_name || (user.email || "").split("@")[0] || "Supplier User";
        const fullName = titleCase(String(raw));
        return {
          fullName,
          email: user.email,
          full_name: user.full_name,
          company_name: user.company_name,
          company_address: user.company_address,
          phone: user.phone,
          business_type: user.business_type,
          representative_name: user.representative_name ?? undefined,
          tin: user.tin ?? undefined,
          status: user.status,
        };
      })()
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SupplierSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentUser={currentUser} restrictedAccess={accessState !== "verified"} />
      <div className="flex min-h-screen flex-col bg-slate-50 lg:pl-62">
        <SupplierHeader title={pageMeta.title} user={currentUser} setSidebarOpen={setSidebarOpen} onLogout={logout} onNotificationNavigate={handleNotificationNavigate} onOpenProfile={() => setShowProfileModal(true)} onOpenSettings={() => setShowSettingsModal(true)} />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <SupplierProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} currentUser={currentUser} />
      <SupplierSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </div>
  );
}
