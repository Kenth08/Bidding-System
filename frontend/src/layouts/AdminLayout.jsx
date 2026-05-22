// c:\Users\Mico\Bidding-System\frontend\src\layouts\AdminLayout.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import AdminHeader from "../components/admin/AdminHeader";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminBlockchain from "../pages/admin/AdminBlockchain";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProjects from "../pages/admin/AdminProjects";
import AdminSuppliers from "../pages/admin/AdminSuppliers";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminProcurementPlanning from "../pages/admin/AdminProcurementPlanning";
import AdminReports from "../pages/admin/AdminReports";
import AdminBidEvaluation from "../pages/admin/AdminBidEvaluation";
import AdminAwarding from "../pages/admin/AdminAwarding";
import { usersAPI } from "../services/api";
import { DataProvider, useData } from "../context/DataContext";
import { ProcurementContext } from "../lib/ProcurementContext";

function AdminLayoutContent({ currentUser, onLogout }) {
  const { cache, isInitialLoading } = useData();
  const procurement = useContext(ProcurementContext);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [notificationTargetSupplierId, setNotificationTargetSupplierId] = useState(null);
  const [notificationTargetVersion, setNotificationTargetVersion] = useState(0);

  function handleNotificationNavigate(link, notification) {
    const path = String(link || "");
    if (path.startsWith("/admin/suppliers")) {
      setNotificationTargetSupplierId(notification?.related_id ? String(notification.related_id) : null);
      setNotificationTargetVersion((current) => current + 1);
      setCurrentPage("suppliers");
      return;
    }

    if (path.startsWith("/admin/bid-evaluation")) {
      const projectId = notification?.projectId || new URLSearchParams(path.split("?")[1] || "").get("project");
      setSelectedProjectId(projectId ? String(projectId) : null);
      setCurrentPage("bids");
      return;
    }

    if (path.startsWith("/admin/projects")) {
      setCurrentPage("projects");
    }
  }

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await usersAPI.getAll();
        const items = res.data.results || res.data || [];
        setUsers(items);
      } catch (error) {
        console.error("Failed to load users", error);
        setUsers([]);
      }
    }

    loadUsers();
  }, []);

  const projects = cache.projects || [];
  const bids = cache.bids || [];
  const blockchainRecords = cache.blockchainRecords || [];
  const suppliers = cache.suppliers || procurement.suppliers || [];
  const dashboardStats = cache.stats || procurement.stats;

  const pageMeta = useMemo(() => {
    if (currentPage === "projects") return { title: "Project Management", subtitle: "Create, update, and monitor procurement projects" };
    if (currentPage === "procurement") return { title: "Procurement Planning", subtitle: "Create and manage procurement requests" };
    if (currentPage === "suppliers") return { title: "Supplier Management", subtitle: "Review registrations and supplier status" };
    if (currentPage === "bids") {
      const selectedProject = projects.find((project) => project.id === selectedProjectId);
      return {
        title: "Bid Evaluation",
        subtitle: selectedProject ? `Review bids for ${selectedProject.title}` : "Review proposals and rank suppliers by bid amount",
      };
    }
    if (currentPage === "awarding") {
      const selectedProject = projects.find((project) => project.id === selectedProjectId);
      return {
        title: "Awarding",
        subtitle: selectedProject ? `Generate award documents for ${selectedProject.title}` : "Generate award documents and manage winning bids",
      };
    }
    if (currentPage === "users") return { title: "User Accounts", subtitle: "Manage access, roles, and account status" };
    if (currentPage === "records") return { title: "Blockchain Records", subtitle: "Inspect immutable procurement ledger entries" };
    if (currentPage === "reports") return { title: "Reports & Analytics", subtitle: "View procurement and supplier performance reports" };
    // Audit Logs intentionally removed from UI
    return { title: "Admin Dashboard", subtitle: "" };
  }, [currentPage]);

  const page = useMemo(() => {
    if (currentPage === "projects") return <AdminProjects projects={projects} onViewBids={(projectId) => { setSelectedProjectId(projectId); setCurrentPage("bids"); }} />;
    if (currentPage === "procurement") return <AdminProcurementPlanning onOpenProjects={() => setCurrentPage("projects")} />;
    if (currentPage === "suppliers") return <AdminSuppliers notificationTargetSupplierId={notificationTargetSupplierId} notificationTargetVersion={notificationTargetVersion} />;
    if (currentPage === "bids") return <AdminBidEvaluation bids={bids} projects={projects} selectedProjectId={selectedProjectId} onBackToProjects={() => setCurrentPage("projects")} onClearSelection={() => setSelectedProjectId(null)} onOpenProject={(projectId) => { setSelectedProjectId(projectId); setCurrentPage("bids"); }} onOpenAwarding={(projectId) => { setSelectedProjectId(projectId); setCurrentPage("awarding"); }} onAwardProject={(projectId) => { setSelectedProjectId(projectId); setCurrentPage("awarding"); }} />;
    if (currentPage === "awarding") return <AdminAwarding bids={bids} projects={projects} selectedProjectId={selectedProjectId} />;
    if (currentPage === "users") return <AdminUsers users={users} setUsers={setUsers} currentUser={currentUser} />;
    if (currentPage === "records") return <AdminBlockchain blockchainRecords={blockchainRecords} />;
    if (currentPage === "reports") return <AdminReports projects={projects} suppliers={suppliers} bids={bids} />;
    return <AdminDashboard stats={dashboardStats} projects={projects} bids={bids} blockchainRecords={blockchainRecords} setActivePage={setCurrentPage} />;
  }, [bids, blockchainRecords, currentPage, currentUser, dashboardStats, projects, selectedProjectId, suppliers, users]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentUser={currentUser} />
      <div className="flex min-h-screen flex-col bg-slate-50 lg:pl-[248px]">
        <AdminHeader
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          notifications={[]}
          currentUser={currentUser}
          setSidebarOpen={setSidebarOpen}
          onLogout={onLogout}
          onNotificationNavigate={handleNotificationNavigate}
          projects={projects}
          suppliers={suppliers}
          bids={bids}
          blockchainRecords={blockchainRecords}
        />
        <main className="flex-1 p-6">{page}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ currentUser, onLogout }) {
  return (
    <DataProvider>
      <AdminLayoutContent currentUser={currentUser} onLogout={onLogout} />
    </DataProvider>
  );
}
