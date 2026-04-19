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
          title="Admin Workspace"
          subtitle="Manage projects, suppliers, bids, and records"
          notifications={MOCK_NOTIFICATIONS.admin}
          currentUser={currentUser}
          setSidebarOpen={setSidebarOpen}
          onLogout={onLogout}
          projects={projects}
          suppliers={[]}
          bids={bids}
          blockchainRecords={blockchainRecords}
        />
        <main className="flex-1 p-6">{page}</main>
      </div>
    </div>
  );
}
