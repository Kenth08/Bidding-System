// c:\Users\Mico\Bidding-System\frontend\src\layouts\AdminLayout.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import AdminHeader from "../components/admin/AdminHeader";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminBids from "../pages/admin/AdminBids";
import AdminBlockchain from "../pages/admin/AdminBlockchain";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProjects from "../pages/admin/AdminProjects";
import AdminSuppliers from "../pages/admin/AdminSuppliers";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminProcurementPlanning from "../pages/admin/AdminProcurementPlanning";
import AdminReports from "../pages/admin/AdminReports";
import AdminAuditLogs from "../pages/admin/AdminAuditLogs";
import AdminAwarding from "../pages/admin/AdminAwarding";
import { usersAPI } from "../services/api";
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setProjects(procurement.projects.map((project) => ({
      ...normalizeProject(project),
      status: getStatusLabel(project.status),
      deadline: project.submission_deadline || project.deadline || project.bid_opening_date || "",
      requirements: project.requirements || project.technical_specifications || "",
    })));
    setBids(procurement.bids.map((bid, index) => ({
      ...normalizeBid(bid),
      status: bid.status || "Submitted",
      submittedAt: bid.submittedAt || bid.submitted_at || "",
      bidAmount: bid.amount,
      rank: bid.rank || index + 1,
    })));
    setBlockchainRecords(procurement.blockchainRecords.map((record) => ({
      ...normalizeBlockchainRecord(record),
      recordedAt: record.recordedAt || record.recorded_at || record.timestamp,
      winner: record.winner_name || record.winner || record.winning_supplier,
      projectTitle: record.projectTitle || record.project_title,
    })));
    setIsLoading(false);
  }, [procurement.projects, procurement.bids, procurement.blockchainRecords]);

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
    if (currentPage === "bids") return { title: "Bid Evaluation", subtitle: "Review proposals and rank suppliers by bid amount" };
    if (currentPage === "awarding") return { title: "Awarding", subtitle: "Generate award documents and manage winning bids" };
    if (currentPage === "users") return { title: "User Accounts", subtitle: "Manage access, roles, and account status" };
    if (currentPage === "records") return { title: "Blockchain Records", subtitle: "Inspect immutable procurement ledger entries" };
    if (currentPage === "reports") return { title: "Reports & Analytics", subtitle: "View procurement and supplier performance reports" };
    if (currentPage === "audit") return { title: "Audit Logs", subtitle: "Track all system activities and changes" };
    return { title: "Admin Dashboard", subtitle: "Overview of projects, bids, and blockchain activity" };
  }, [currentPage]);

  const page = useMemo(() => {
    if (currentPage === "projects") return <AdminProjects projects={projects} setProjects={setProjects} />;
    if (currentPage === "procurement") return <AdminProcurementPlanning />;
    if (currentPage === "suppliers") return <AdminSuppliers />;
    if (currentPage === "bids") return <AdminBids bids={bids} setBids={setBids} projects={projects} setProjects={setProjects} onRecordToBlockchain={(fn) => setBlockchainRecords((prev) => fn(prev))} />;
    if (currentPage === "awarding") return <AdminAwarding bids={bids} projects={projects} />;
    if (currentPage === "users") return <AdminUsers users={users} setUsers={setUsers} currentUser={currentUser} />;
    if (currentPage === "records") return <AdminBlockchain blockchainRecords={blockchainRecords} />;
    if (currentPage === "reports") return <AdminReports projects={projects} suppliers={suppliers} bids={bids} />;
    if (currentPage === "audit") return <AdminAuditLogs />;
    return <AdminDashboard stats={dashboardStats} projects={projects} bids={bids} blockchainRecords={blockchainRecords} setActivePage={setCurrentPage} />;
  }, [bids, blockchainRecords, currentPage, currentUser, dashboardStats, projects, suppliers, users]);

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
