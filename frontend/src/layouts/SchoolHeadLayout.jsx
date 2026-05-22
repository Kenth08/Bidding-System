// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\layouts\SchoolHeadLayout.jsx
import { useContext, useMemo, useState } from "react";
import SchoolHeadHeader from "../components/school_head/SchoolHeadHeader";
import SchoolHeadSidebar from "../components/school_head/SchoolHeadSidebar";
import SchoolHeadDashboard from "../pages/school_head/SchoolHeadDashboard";
import SchoolHeadApprovedProjects from "../pages/school_head/SchoolHeadApprovedProjects";
import SchoolHeadRequests from "../pages/school_head/SchoolHeadRequests";
import { DataProvider, useData } from "../context/DataContext";

function SchoolHeadLayoutContent({ user, currentUser, onLogout }) {
  const activeUser = user || currentUser;
  const { cache, isInitialLoading } = useData();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleNotificationNavigate(link) {
    const path = String(link || "");
    if (path.startsWith("/school-head/requests")) setCurrentPage("requests");
  }

  const pageMeta = useMemo(() => {
    if (currentPage === "requests") return { title: "Procurement Requests", subtitle: "Review and decide on planning requests" };
    if (currentPage === "history") return { title: "Approved Records", subtitle: "View projects created from approved requests" };
    return { title: "School Head Dashboard", subtitle: "" };
  }, [currentPage]);

  const page = useMemo(() => {
    if (currentPage === "requests") return <SchoolHeadRequests user={activeUser} requests={cache.procurementRequests || []} />;
    if (currentPage === "history") return <SchoolHeadApprovedProjects projects={cache.projects || []} />;
    return <SchoolHeadDashboard user={activeUser} requests={cache.procurementRequests || []} setActivePage={setCurrentPage} />;
  }, [activeUser, cache.procurementRequests, currentPage]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SchoolHeadSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentUser={activeUser} />
      <div className="flex min-h-screen flex-col bg-slate-50 lg:pl-[248px]">
        <SchoolHeadHeader
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          currentUser={activeUser}
          setSidebarOpen={setSidebarOpen}
          onLogout={onLogout}
          onNotificationNavigate={handleNotificationNavigate}
        />
        <main className="flex-1 p-6">{page}</main>
      </div>
    </div>
  );
}

export default function SchoolHeadLayout({ user, currentUser, onLogout }) {
  return (
    <DataProvider>
      <SchoolHeadLayoutContent user={user} currentUser={currentUser} onLogout={onLogout} />
    </DataProvider>
  )
}