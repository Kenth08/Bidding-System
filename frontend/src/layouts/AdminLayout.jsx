// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\layouts\AdminLayout.jsx
import { useMemo, useState } from "react";
import AdminHeader from "../components/admin/AdminHeader";
import AdminSidebar from "../components/admin/AdminSidebar";
import { MOCK_BIDS, MOCK_BLOCKCHAIN_RECORDS, MOCK_NOTIFICATIONS, MOCK_PROJECTS, MOCK_USERS } from "../constants/mockData";
import AdminBids from "../pages/admin/AdminBids";
import AdminBlockchain from "../pages/admin/AdminBlockchain";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProjects from "../pages/admin/AdminProjects";
import AdminSuppliers from "../pages/admin/AdminSuppliers";
import AdminUsers from "../pages/admin/AdminUsers";

export default function AdminLayout({ currentUser, onLogout }) {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [bids, setBids] = useState(MOCK_BIDS);
  const [blockchainRecords, setBlockchainRecords] = useState(MOCK_BLOCKCHAIN_RECORDS);
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
    if (currentPage === "bids") return <AdminBids bids={bids} setBids={setBids} projects={projects} setProjects={setProjects} onRecordToBlockchain={setBlockchainRecords} />;
    if (currentPage === "users") return <AdminUsers users={users} setUsers={setUsers} currentUser={currentUser} />;
    if (currentPage === "records") return <AdminBlockchain blockchainRecords={blockchainRecords} />;
    return <AdminDashboard projects={projects} bids={bids} blockchainRecords={blockchainRecords} setActivePage={setCurrentPage} />;
  }, [bids, blockchainRecords, currentPage, currentUser, projects, users]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentUser={currentUser} />
      <div className="flex min-h-screen flex-col bg-slate-50 lg:pl-[248px]">
        <AdminHeader
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          notifications={MOCK_NOTIFICATIONS.admin}
          currentUser={currentUser}
          setSidebarOpen={setSidebarOpen}
          onLogout={onLogout}
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
