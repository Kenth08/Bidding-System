import { useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SupplierProfileModal from "../components/supplier/SupplierProfileModal";
import SupplierSettingsModal from "../components/supplier/SupplierSettingsModal";
import SupplierHeader from "../components/supplier/SupplierHeader";
import SupplierSidebar from "../components/supplier/SupplierSidebar";
import SupplierDashboard from "../pages/supplier/SupplierDashboard";
import SupplierMyBids from "../pages/supplier/SupplierMyBids";
import SupplierProjects from "../pages/supplier/SupplierProjects";
import SupplierResults from "../pages/supplier/SupplierResults";
import SupplierProfile from "../pages/supplier/SupplierProfile";
import { DataProvider, useData } from "../context/DataContext";
import { getStatusLabel } from "../lib/procurementStatus";

const PATH_TO_PAGE = {
  "": "dashboard",
  "projects": "available-projects",
  "bids": "my-bids",
  "results": "results",
  "profile": "profile",
};

const PAGE_TO_PATH = {
  "dashboard": "",
  "available-projects": "projects",
  "my-bids": "bids",
  "results": "results",
  "profile": "profile",
};

function SupplierLayoutContent({ user, currentUser, onLogout }) {
  const activeUser = user || currentUser;
  const { cache, isInitialLoading, refresh } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = useMemo(() => {
    const segment = location.pathname.replace(/^\/supplier\/?/, "").split("/")[0] || "";
    return PATH_TO_PAGE[segment] || "dashboard";
  }, [location.pathname]);

  const setCurrentPage = useCallback((page) => {
    const path = PAGE_TO_PATH[page] || "";
    navigate(`/supplier${path ? `/${path}` : ""}`, { replace: false });
  }, [navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  function handleNotificationNavigate(link) {
    const path = String(link || "");
    if (path.startsWith("/supplier/projects")) setCurrentPage("available-projects");
    if (path.startsWith("/supplier/profile")) setCurrentPage("profile");
    if (path.startsWith("/supplier/bids")) setCurrentPage("my-bids");
  }

  const projects = cache.projects || [];
  const supplierBids = cache.bids || [];
  const supplierResults = cache.blockchainRecords || [];

  const supplierProjects = useMemo(() => projects.filter((project) => getStatusLabel(project.status) === "Open for Bidding"), [projects]);

  const pageMeta = useMemo(() => {
    if (currentPage === "available-projects") return { title: "Available Projects", subtitle: "Browse active opportunities and submit proposals" };
    if (currentPage === "my-bids") return { title: "My Bids", subtitle: "Track submitted bids and evaluation status" };
    if (currentPage === "results") return { title: "Results", subtitle: "View blockchain-verified procurement outcomes" };
    if (currentPage === "profile") return { title: "My Profile", subtitle: "Manage your profile and uploaded documents" };
    return { title: "Supplier Dashboard", subtitle: "" };
  }, [currentPage]);

  const page = useMemo(() => {
    if (currentPage === "available-projects") {
      return (
        <SupplierProjects
          supplierProjects={supplierProjects}
          supplierBids={supplierBids}
          activeUser={activeUser}
          setActivePage={setCurrentPage}
          onBidSubmitted={refresh}
        />
      );
    }
    if (currentPage === "my-bids") return <SupplierMyBids supplierBids={supplierBids} onNavigate={setCurrentPage} isLoading={isInitialLoading} />;
    if (currentPage === "results") return <SupplierResults supplierResults={supplierResults} supplierBids={supplierBids} user={activeUser} />;
    if (currentPage === "profile") return <SupplierProfile currentUser={activeUser} />;
    return <SupplierDashboard supplierProjects={supplierProjects} supplierBids={supplierBids} user={activeUser} setActivePage={setCurrentPage} isLoading={isInitialLoading} />;
  }, [activeUser, currentPage, isInitialLoading, refresh, setCurrentPage, supplierBids, supplierProjects, supplierResults]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SupplierSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentUser={activeUser} />
      <div className="flex min-h-screen flex-col bg-slate-50 lg:pl-[248px]">
        <SupplierHeader
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          notifications={[]}
          user={activeUser}
          setSidebarOpen={setSidebarOpen}
          onLogout={onLogout}
          onNotificationNavigate={handleNotificationNavigate}
          projects={supplierProjects}
          bids={supplierBids}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
        <main className="flex-1 p-6">{page}</main>
      </div>
      <SupplierProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} currentUser={activeUser} />
      <SupplierSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </div>
  );
}

export default function SupplierLayout({ user, currentUser, onLogout }) {
  return (
    <DataProvider>
      <SupplierLayoutContent user={user} currentUser={currentUser} onLogout={onLogout} />
    </DataProvider>
  );
}
