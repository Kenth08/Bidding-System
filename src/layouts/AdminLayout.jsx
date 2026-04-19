// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\layouts\AdminLayout.jsx
import { useMemo, useState } from "react";
import AdminHeader from "../components/admin/AdminHeader";
import AdminSidebar from "../components/admin/AdminSidebar";
import {
  MOCK_BIDS,
  MOCK_NOTIFICATIONS,
  MOCK_PROJECTS,
  MOCK_SUPPLIERS,
  MOCK_USERS,
} from "../constants/mockData";
import AdminBids from "../pages/admin/AdminBids";
import AdminBlockchain from "../pages/admin/AdminBlockchain";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProjects from "../pages/admin/AdminProjects";
import AdminSuppliers from "../pages/admin/AdminSuppliers";
import AdminUsers from "../pages/admin/AdminUsers";

const PAGE_TITLES = {
  dashboard: { title: "Dashboard", subtitle: "Admin command center" },
  users: { title: "User Management", subtitle: "Manage all system accounts and roles" },
  projects: { title: "Projects", subtitle: "Create and manage procurement projects" },
  suppliers: { title: "Suppliers", subtitle: "Manage and approve registered suppliers" },
  bids: { title: "Bids", subtitle: "Review submitted offers and select winners" },
  records: { title: "Blockchain Records", subtitle: "Immutable logs for awarded contracts" },
};

export default function AdminLayout({ currentUser, blockchainRecords, setBlockchainRecords, onLogout }) {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [suppliers, setSuppliers] = useState(MOCK_SUPPLIERS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [bids, setBids] = useState(MOCK_BIDS);

  const [projectFilter, setProjectFilter] = useState("All");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [expandedBidId, setExpandedBidId] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", budget: "", deadline: "", requirements: "" });
  const [copyToast, setCopyToast] = useState("");

  const page = useMemo(() => {
    switch (currentPage) {
      case "projects":
        return (
          <AdminProjects
            projects={projects}
            setProjects={setProjects}
            projectFilter={projectFilter}
            setProjectFilter={setProjectFilter}
            showProjectModal={showProjectModal}
            setShowProjectModal={setShowProjectModal}
            newProject={newProject}
            setNewProject={setNewProject}
          />
        );
      case "suppliers":
        return (
          <AdminSuppliers
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            supplierSearch={supplierSearch}
            setSupplierSearch={setSupplierSearch}
          />
        );
      case "bids":
        return (
          <AdminBids
            bids={bids}
            setBids={setBids}
            projects={projects}
            setProjects={setProjects}
            onRecordToBlockchain={setBlockchainRecords}
            expandedBidId={expandedBidId}
            setExpandedBidId={setExpandedBidId}
          />
        );
      case "users":
        return <AdminUsers users={users} setUsers={setUsers} />;
      case "records":
        return (
          <AdminBlockchain
            blockchainRecords={blockchainRecords}
            copyToast={copyToast}
            setCopyToast={setCopyToast}
          />
        );
      default:
        return <AdminDashboard projects={projects} />;
    }
  }, [
    bids,
    blockchainRecords,
    copyToast,
    currentPage,
    expandedBidId,
    newProject,
    projectFilter,
    projects,
    showProjectModal,
    supplierSearch,
    suppliers,
    users,
  ]);

  const titleMeta = PAGE_TITLES[currentPage] || PAGE_TITLES.dashboard;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AdminSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentUser={currentUser}
      />

      <div className="flex min-h-screen flex-col bg-slate-50 lg:pl-[248px]">
        <AdminHeader
          title={titleMeta.title}
          subtitle={titleMeta.subtitle}
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
