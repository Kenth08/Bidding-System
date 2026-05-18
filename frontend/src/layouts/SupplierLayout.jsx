// c:\Users\Mico\Bidding-System\frontend\src\layouts\SupplierLayout.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import SupplierProfileModal from "../components/supplier/SupplierProfileModal";
import SupplierSettingsModal from "../components/supplier/SupplierSettingsModal";
import SupplierHeader from "../components/supplier/SupplierHeader";
import SupplierSidebar from "../components/supplier/SupplierSidebar";
import SupplierDashboard from "../pages/supplier/SupplierDashboard";
import SupplierMyBids from "../pages/supplier/SupplierMyBids";
import SupplierProjects from "../pages/supplier/SupplierProjects";
import SupplierResults from "../pages/supplier/SupplierResults";
import SupplierProfile from "../pages/supplier/SupplierProfile";
import { ProcurementContext } from "../lib/ProcurementContext";
import { getStatusLabel, normalizeBid, normalizeBlockchainRecord, normalizeProject, normalizeSupplier } from "../lib/procurementStatus";
import { bidsAPI, projectsAPI } from "../services/api";

export default function SupplierLayout({ user, currentUser, onLogout }) {
  const activeUser = user || currentUser;
  const procurement = useContext(ProcurementContext);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [supplierBids, setSupplierBids] = useState([]);
  const [supplierResults, setSupplierResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  function handleNotificationNavigate(link) {
    const path = String(link || "");
    if (path.startsWith("/supplier/projects")) setCurrentPage("available-projects");
    if (path.startsWith("/supplier/profile")) setCurrentPage("profile");
    if (path.startsWith("/supplier/bids")) setCurrentPage("my-bids");
  }

  useEffect(() => {
    async function loadSupplierData() {
      setIsLoading(true);
      try {
        const [projectResponse, bidResponse] = await Promise.all([
          projectsAPI.getAll(),
          bidsAPI.getAll({ supplier: "me" }),
        ]);
        const projectItems = projectResponse.data.results || projectResponse.data || [];
        const bidItems = bidResponse.data.results || bidResponse.data || [];

        setProjects(projectItems.map((project) => ({
          ...normalizeProject(project),
          status: getStatusLabel(project.status),
          deadline: project.deadline || project.submission_deadline || project.bid_opening_date || "",
          requirements: project.requirements || project.technical_specifications || "",
          bid_count: project.bid_count || 0,
        })));
        setSupplierBids(bidItems.map((bid) => ({
          ...normalizeBid(bid),
          submittedAt: bid.submittedAt || bid.submitted_at || "",
          bidAmount: bid.bidAmount || bid.bid_amount || bid.amount || 0,
        })));
      } catch (error) {
        console.error("Failed to load supplier data", error);
        setProjects([]);
        setSupplierBids([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadSupplierData();
  }, [activeUser?.id]);

  useEffect(() => {
    setSupplierResults(procurement.blockchainRecords.map((record) => normalizeBlockchainRecord(record)));
  }, [procurement.blockchainRecords]);

  const supplierProjects = useMemo(() => projects.filter((project) => getStatusLabel(project.status) === "Open for Bidding"), [projects]);

  const pageMeta = useMemo(() => {
    if (currentPage === "available-projects") return { title: "Available Projects", subtitle: "Browse active opportunities and submit proposals" };
    if (currentPage === "my-bids") return { title: "My Bids", subtitle: "Track submitted bids and evaluation status" };
    if (currentPage === "results") return { title: "Results", subtitle: "View blockchain-verified procurement outcomes" };
    if (currentPage === "profile") return { title: "My Profile", subtitle: "Manage your profile and uploaded documents" };
    return { title: "Supplier Dashboard", subtitle: "Overview of projects, bids, and latest updates" };
  }, [currentPage]);

  const page = useMemo(() => {
    if (currentPage === "available-projects") {
      return (
        <SupplierProjects
          supplierProjects={supplierProjects}
          supplierBids={supplierBids}
          setSupplierBids={setSupplierBids}
          activeUser={activeUser}
          setActivePage={setCurrentPage}
        />
      );
    }
    if (currentPage === "my-bids") return <SupplierMyBids supplierBids={supplierBids} onNavigate={setCurrentPage} isLoading={isLoading} />;
    if (currentPage === "results") return <SupplierResults supplierResults={supplierResults} supplierBids={supplierBids} user={activeUser} isLoading={isLoading} />;
    if (currentPage === "profile") return <SupplierProfile currentUser={activeUser} />;
    return <SupplierDashboard supplierProjects={supplierProjects} supplierBids={supplierBids} user={activeUser} setActivePage={setCurrentPage} isLoading={isLoading} />;
  }, [activeUser, currentPage, supplierBids, supplierProjects, supplierResults]);

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
