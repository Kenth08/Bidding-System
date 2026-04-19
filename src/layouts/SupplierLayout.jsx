// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\layouts\SupplierLayout.jsx
import { useMemo, useState } from "react";
import SupplierSettingsModal from "../components/supplier/SupplierSettingsModal";
import SupplierProfileModal from "../components/supplier/SupplierProfileModal";
import SupplierHeader from "../components/supplier/SupplierHeader";
import SupplierSidebar from "../components/supplier/SupplierSidebar";
import {
  MOCK_NOTIFICATIONS,
  MOCK_RESULTS,
  MOCK_SUPPLIER_BIDS,
  MOCK_SUPPLIER_PROJECTS,
} from "../constants/mockData";
import SupplierBids from "../pages/supplier/SupplierBids";
import SupplierDashboard from "../pages/supplier/SupplierDashboard";
import SupplierProjects from "../pages/supplier/SupplierProjects";
import SupplierResults from "../pages/supplier/SupplierResults";

const PAGE_TITLES = {
  dashboard: { title: "Dashboard", subtitle: "Supplier command center" },
  "available-projects": { title: "Available Projects", subtitle: "Find and bid on active projects" },
  "my-bids": { title: "My Bids", subtitle: "Review submitted proposals and outcomes" },
  results: { title: "Results", subtitle: "Track contract awards" },
};

export default function SupplierLayout({ user, currentUser, onLogout }) {
  const activeUser = user || currentUser;
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [supplierProjects] = useState(MOCK_SUPPLIER_PROJECTS);
  const [supplierBids, setSupplierBids] = useState(MOCK_SUPPLIER_BIDS);
  const [supplierResults] = useState(MOCK_RESULTS);

  const [supplierProjectFilter, setSupplierProjectFilter] = useState("All");
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [bidDraft, setBidDraft] = useState({ bidAmount: "", proposal: "" });

  const page = useMemo(() => {
    switch (currentPage) {
      case "available-projects":
        return (
          <SupplierProjects
            supplierProjects={supplierProjects}
            supplierProjectFilter={supplierProjectFilter}
            setSupplierProjectFilter={setSupplierProjectFilter}
            showBidModal={showBidModal}
            setShowBidModal={setShowBidModal}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            bidDraft={bidDraft}
            setBidDraft={setBidDraft}
            setSupplierBids={setSupplierBids}
          />
        );
      case "my-bids":
        return <SupplierBids supplierBids={supplierBids} />;
      case "results":
        return <SupplierResults supplierResults={supplierResults} />;
      default:
        return <SupplierDashboard supplierProjects={supplierProjects} />;
    }
  }, [
    bidDraft,
    currentPage,
    selectedProject,
    showBidModal,
    supplierBids,
    supplierProjectFilter,
    supplierProjects,
    supplierResults,
  ]);

  const titleMeta = PAGE_TITLES[currentPage] || PAGE_TITLES.dashboard;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SupplierSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentUser={activeUser}
      />

      <div className="flex min-h-screen flex-col bg-slate-50 lg:pl-[248px]">
        <SupplierHeader
          title={titleMeta.title}
          subtitle={titleMeta.subtitle}
          notifications={MOCK_NOTIFICATIONS.supplier}
          user={activeUser}
          setSidebarOpen={setSidebarOpen}
          onLogout={onLogout}
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
