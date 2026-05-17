// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\layouts\SchoolHeadLayout.jsx
import { useMemo, useState } from "react";
import SchoolHeadHeader from "../components/school_head/SchoolHeadHeader";
import SchoolHeadSidebar from "../components/school_head/SchoolHeadSidebar";
import SchoolHeadDashboard from "../pages/school_head/SchoolHeadDashboard";
import SchoolHeadRequests from "../pages/school_head/SchoolHeadRequests";

export default function SchoolHeadLayout({ user, currentUser, onLogout }) {
  const activeUser = user || currentUser;
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  function triggerRefresh() {
    setRefreshToken((current) => current + 1);
  }

  function handleNotificationNavigate(link) {
    const path = String(link || "");
    if (path.startsWith("/school-head/requests")) setCurrentPage("requests");
  }

  const pageMeta = useMemo(() => {
    if (currentPage === "requests") return { title: "Procurement Requests", subtitle: "Review and decide on planning requests" };
    return { title: "School Head Dashboard", subtitle: "Review pending procurement requests" };
  }, [currentPage]);

  const page = useMemo(() => {
    if (currentPage === "requests") return <SchoolHeadRequests user={activeUser} refreshToken={refreshToken} onRefresh={triggerRefresh} />;
    return <SchoolHeadDashboard user={activeUser} setActivePage={setCurrentPage} refreshToken={refreshToken} />;
  }, [activeUser, currentPage, refreshToken]);

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