// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\layouts\SupplierLayout.jsx
import { useMemo, useState } from "react";
import SupplierProfileModal from "../components/supplier/SupplierProfileModal";
import SupplierSettingsModal from "../components/supplier/SupplierSettingsModal";
import SupplierHeader from "../components/supplier/SupplierHeader";
import SupplierSidebar from "../components/supplier/SupplierSidebar";
import { MOCK_BIDS, MOCK_NOTIFICATIONS, MOCK_PROJECTS, MOCK_RESULTS } from "../constants/mockData";
import SupplierDashboard from "../pages/supplier/SupplierDashboard";
import SupplierMyBids from "../pages/supplier/SupplierMyBids";
import SupplierProjects from "../pages/supplier/SupplierProjects";
import SupplierResults from "../pages/supplier/SupplierResults";

export default function SupplierLayout({ user, currentUser, onLogout }) {
  const activeUser = user || currentUser;
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [supplierBids, setSupplierBids] = useState(
    MOCK_BIDS.filter((bid) => bid.company === (activeUser?.company_name || "Blue Grid Works"))
  );
  const [supplierProjectFilter, setSupplierProjectFilter] = useState("All");
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [bidDraft, setBidDraft] = useState({ bidAmount: "", proposal: "" });

  const supplierProjects = MOCK_PROJECTS.filter((project) => project.status === "Active");
  const pageMeta = useMemo(() => {
    if (currentPage === "available-projects") return { title: "Available Projects", subtitle: "Browse active opportunities and submit proposals" };
    if (currentPage === "my-bids") return { title: "My Bids", subtitle: "Track submitted bids and evaluation status" };
    if (currentPage === "results") return { title: "Results", subtitle: "View blockchain-verified procurement outcomes" };
    return { title: "Supplier Dashboard", subtitle: "Overview of projects, bids, and latest updates" };
  }, [currentPage]);

  const page = useMemo(() => {
    if (currentPage === "available-projects") {
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
          activeUser={activeUser}
        />
      );
    }
    if (currentPage === "my-bids") return <SupplierMyBids supplierBids={supplierBids} onNavigate={setCurrentPage} />;
    if (currentPage === "results") return <SupplierResults supplierResults={MOCK_RESULTS} />;
    return <SupplierDashboard supplierProjects={supplierProjects} supplierBids={supplierBids} user={activeUser} setActivePage={setCurrentPage} />;
  }, [activeUser, bidDraft, currentPage, selectedProject, showBidModal, supplierBids, supplierProjectFilter, supplierProjects]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SupplierSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentUser={activeUser} />
      <div className="flex min-h-screen flex-col bg-slate-50 lg:pl-[248px]">
        <SupplierHeader
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
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
