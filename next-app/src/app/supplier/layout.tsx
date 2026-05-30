"use client";
import { useState, useMemo, useCallback, useEffect, useRef, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import SupplierHeader from "@/components/supplier/SupplierHeader";
import SupplierSidebar from "@/components/supplier/SupplierSidebar";
import SupplierProfileModal from "@/components/supplier/SupplierProfileModal";
import SupplierSettingsModal from "@/components/supplier/SupplierSettingsModal";
import { useAuthStore } from "@/stores/auth";
import { notificationsAPI, suppliersAPI } from "@/services/api";

const PATH_TO_PAGE: Record<string, string> = { "": "dashboard", "projects": "available-projects", "bids": "my-bids", "results": "results", "profile": "profile", "verification-status": "verification-status" };
const PAGE_TO_PATH: Record<string, string> = { "dashboard": "", "available-projects": "projects", "my-bids": "bids", "results": "results", "profile": "profile", "verification-status": "verification-status" };

function isAllowedWhenRestricted(path: string) {
  return (
    path.startsWith("/supplier/profile") ||
    path.startsWith("/supplier/verification-status") ||
    path.startsWith("/supplier/documents/reupload") ||
    path.startsWith("/supplier/revision-required")
  );
}

export default function SupplierLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, restoreSession } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [accessState, setAccessState] = useState<"verified" | "restricted">("verified");
  const [verificationState, setVerificationState] = useState<string>("pending");
  const hasRestoredRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  // Restore session only once
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    restoreSession();
  }, [restoreSession]);

  // Redirect if user status is invalid (not document verification — account-level)
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

  // Check document verification access — once on mount, then every 60s
  useEffect(() => {
    if (!user || user.role !== "supplier") return;

    let timer: ReturnType<typeof setInterval> | undefined;
    let isMounted = true;

    const syncAccess = async () => {
      if (!isMounted) return;
      try {
        const response = await suppliersAPI.getMyDocumentWorkflow();
        if (!isMounted) return;
        const access = String(response.data?.accessState || "restricted");
        const vState = String(response.data?.verificationState || "pending");
        setAccessState(access === "verified" ? "verified" : "restricted");
        setVerificationState(vState);
      } catch {
        // ignore
      }
    };

    const initialTimeout = setTimeout(syncAccess, 300);
    timer = setInterval(syncAccess, 60000);
    return () => {
      isMounted = false;
      clearTimeout(initialTimeout);
      if (timer) clearInterval(timer);
    };
  }, [user]);

  // Handle redirect based on accessState + pathname (separate from the fetch)
  useEffect(() => {
    if (accessState === "verified") {
      hasRedirectedRef.current = false;
      return;
    }
    // accessState is "restricted"
    if (isAllowedWhenRestricted(pathname)) return;
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    const target = verificationState === "flagged" ? "/supplier/documents/reupload" : "/supplier/verification-status";
    router.replace(target);
  }, [accessState, pathname, verificationState, router]);

  // Auto-clear notifications — only once on mount
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await notificationsAPI.getAll();
        if (controller.signal.aborted) return;
        const items = res.data?.results || res.data || [];
        const currPath = window.location.pathname;
        const currProject = new URLSearchParams(window.location.search).get("project");
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
        if (toMark.length && !controller.signal.aborted) {
          await Promise.all(toMark.map((id) => notificationsAPI.markOneRead(id).catch(() => {})));
        }
      } catch {
        // ignore
      }
    })();
    return () => controller.abort();
  }, [user]);

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
