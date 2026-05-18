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
import AdminAuditLogs from "../pages/admin/AdminAuditLogs";
import AdminBidEvaluation from "../pages/admin/AdminBidEvaluation";
import AdminAwarding from "../pages/admin/AdminAwarding";
import AdminProjectHistory from "../pages/admin/AdminProjectHistory";
import { bidsAPI, projectsAPI, usersAPI } from "../services/api";
import { ProcurementContext } from "../lib/ProcurementContext";
import { getStatusLabel, normalizeBid, normalizeBlockchainRecord, normalizeProject, normalizeSupplier } from "../lib/procurementStatus";

export default function AdminLayout({ currentUser, onLogout }) {
  const procurement = useContext(ProcurementContext);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [bids, setBids] = useState([]);
  const [blockchainRecords, setBlockchainRecords] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [notificationTargetSupplierId, setNotificationTargetSupplierId] = useState(null);
  const [notificationTargetVersion, setNotificationTargetVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWorkspaceData() {
      setIsLoading(true);
      try {
        const [projectResponse, bidResponse] = await Promise.all([projectsAPI.getAll(), bidsAPI.getAll()]);
        const projectItems = projectResponse.data.results || projectResponse.data || [];
        const bidItems = bidResponse.data.results || bidResponse.data || [];

        setProjects(projectItems.map((project) => ({
          ...normalizeProject(project),
          status: getStatusLabel(project.status),
          deadline: project.deadline || project.submission_deadline || project.bid_opening_date || "",
          requirements: project.requirements || project.technical_specifications || "",
        })));
        setBids(bidItems.map((bid, index) => ({
          ...normalizeBid(bid),
          status: bid.status || "submitted",
          submittedAt: bid.submittedAt || bid.submitted_at || "",
          bidAmount: bid.bidAmount || bid.bid_amount || bid.amount || 0,
          rank: bid.rank || index + 1,
        })));
      } catch (error) {
        console.error("Failed to load admin workspace data", error);
        setProjects([]);
        setBids([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkspaceData();
  }, []);

  useEffect(() => {
    setBlockchainRecords(procurement.blockchainRecords.map((record) => ({
      ...normalizeBlockchainRecord(record),
      recordedAt: record.recordedAt || record.recorded_at || record.timestamp,
      winner: record.winner_name || record.winner || record.winning_supplier,
      projectTitle: record.projectTitle || record.project_title,
    })));
  }, [procurement.blockchainRecords]);

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

  const suppliers = useMemo(() => procurement.suppliers.map((supplier) => normalizeSupplier(supplier)), [procurement.suppliers]);

  const dashboardStats = procurement.stats;

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
    if (currentPage === "audit") return { title: "Audit Logs", subtitle: "Track all system activities and changes" };
    if (currentPage === "project-history") return { title: "Project History", subtitle: "Archived procurement projects and restore actions" };
    return { title: "Admin Dashboard", subtitle: "Overview of projects, bids, and blockchain activity" };
  }, [currentPage]);

  const page = useMemo(() => {
    if (currentPage === "projects") return <AdminProjects projects={projects} setProjects={setProjects} onViewBids={(projectId) => { setSelectedProjectId(projectId); setCurrentPage("bids"); }} isLoading={isLoading} />;
    if (currentPage === "procurement") return <AdminProcurementPlanning onOpenProjects={() => setCurrentPage("projects")} isLoading={isLoading} />;
    if (currentPage === "suppliers") return <AdminSuppliers notificationTargetSupplierId={notificationTargetSupplierId} notificationTargetVersion={notificationTargetVersion} isLoading={isLoading} />;
    if (currentPage === "bids") return <AdminBidEvaluation bids={bids} setBids={setBids} projects={projects} selectedProjectId={selectedProjectId} onBackToProjects={() => setCurrentPage("projects")} onClearSelection={() => setSelectedProjectId(null)} onOpenProject={(projectId) => { setSelectedProjectId(projectId); setCurrentPage("bids"); }} onOpenAwarding={(projectId) => { setSelectedProjectId(projectId); setCurrentPage("awarding"); }} onAwardProject={(projectId) => { setSelectedProjectId(projectId); setCurrentPage("awarding"); }} setProjects={setProjects} onRecordToBlockchain={(fn) => setBlockchainRecords((prev) => fn(prev))} isLoading={isLoading} />;
    if (currentPage === "awarding") return <AdminAwarding bids={bids} projects={projects} selectedProjectId={selectedProjectId} />;
    if (currentPage === "users") return <AdminUsers users={users} setUsers={setUsers} currentUser={currentUser} />;
    if (currentPage === "records") return <AdminBlockchain blockchainRecords={blockchainRecords} />;
    if (currentPage === "reports") return <AdminReports projects={projects} suppliers={suppliers} bids={bids} />;
    if (currentPage === "audit") return <AdminAuditLogs />;
    if (currentPage === "project-history") return <AdminProjectHistory />;
    return <AdminDashboard stats={dashboardStats} projects={projects} bids={bids} blockchainRecords={blockchainRecords} setActivePage={setCurrentPage} isLoading={isLoading} />;
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
          isLoading={isLoading}
        />
        <main className="flex-1 p-6">{page}</main>
      </div>
    </div>
  );
}
