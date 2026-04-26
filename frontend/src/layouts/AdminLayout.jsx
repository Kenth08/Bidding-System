// c:\Users\Mico\Bidding-System\frontend\src\layouts\AdminLayout.jsx
import { useEffect, useMemo, useState } from "react";
import AdminHeader from "../components/admin/AdminHeader";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminBids from "../pages/admin/AdminBids";
import AdminBlockchain from "../pages/admin/AdminBlockchain";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProjects from "../pages/admin/AdminProjects";
import AdminSuppliers from "../pages/admin/AdminSuppliers";
import AdminUsers from "../pages/admin/AdminUsers";
import { dashboardAPI, projectsAPI, bidsAPI, usersAPI, blockchainAPI } from "../services/api";

export default function AdminLayout({ currentUser, onLogout }) {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [bids, setBids] = useState([]);
  const [blockchainRecords, setBlockchainRecords] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [statsRes, projectsRes, bidsRes, usersRes, blockchainRes] = await Promise.allSettled([
          dashboardAPI.getStats(),
          projectsAPI.getAll(),
          bidsAPI.getAll(),
          usersAPI.getAll(),
          blockchainAPI.getAll(),
        ]);

        if (statsRes.status === "fulfilled") {
          setDashboardStats(statsRes.value.data);
        }

        if (projectsRes.status === "fulfilled") {
          setProjects(projectsRes.value.data.results || projectsRes.value.data || []);
        }

        if (bidsRes.status === "fulfilled") {
          setBids(bidsRes.value.data.results || bidsRes.value.data || []);
        }

        if (usersRes.status === "fulfilled") {
          setUsers(usersRes.value.data.results || usersRes.value.data || []);
        }

        if (blockchainRes.status === "fulfilled") {
          setBlockchainRecords(blockchainRes.value.data.results || blockchainRes.value.data || []);
        }
      } catch (error) {
        console.error("Failed to load admin data", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const suppliers = useMemo(() => users.filter((user) => user.role === "supplier"), [users]);

  const pageMeta = useMemo(() => {
    if (currentPage === "projects") return { title: "Project Management", subtitle: "Create, update, and monitor procurement projects" };
    if (currentPage === "suppliers") return { title: "Supplier Management", subtitle: "Review registrations and supplier status" };
    if (currentPage === "bids") return { title: "Bid Evaluation", subtitle: "Review proposals and select project winners" };
    if (currentPage === "users") return { title: "User Accounts", subtitle: "Manage access, roles, and account status" };
    if (currentPage === "records") return { title: "Blockchain Records", subtitle: "Inspect immutable procurement ledger entries" };
    return { title: "Admin Dashboard", subtitle: "Overview of projects, bids, and blockchain activity" };
  }, [currentPage]);

  const page = useMemo(() => {
    if (currentPage === "projects") return <AdminProjects projects={projects} setProjects={setProjects} />;
    if (currentPage === "suppliers") return <AdminSuppliers />;
    if (currentPage === "bids") return <AdminBids bids={bids} setBids={setBids} projects={projects} setProjects={setProjects} onRecordToBlockchain={(fn) => setBlockchainRecords((prev) => fn(prev))} />;
    if (currentPage === "users") return <AdminUsers users={users} setUsers={setUsers} currentUser={currentUser} />;
    if (currentPage === "records") return <AdminBlockchain blockchainRecords={blockchainRecords} />;
    return <AdminDashboard stats={dashboardStats} projects={projects} bids={bids} blockchainRecords={blockchainRecords} setActivePage={setCurrentPage} />;
  }, [bids, blockchainRecords, currentPage, currentUser, projects, users]);

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
