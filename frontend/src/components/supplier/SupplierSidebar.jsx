// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\supplier\SupplierSidebar.jsx
import { CheckCircle, ChevronRight, FileText, FolderOpen, LayoutDashboard, Shield, X } from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "available-projects", label: "Available Projects", icon: FolderOpen },
  { key: "my-bids", label: "My Bids", icon: FileText },
  { key: "results", label: "Results", icon: CheckCircle },
];

export default function SupplierSidebar({ currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, currentUser }) {
  const NavBlock = (
    <ul className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.key;
        return (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => {
                setCurrentPage(item.key);
                setSidebarOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-150 ${
                isActive
                  ? "bg-emerald-500/10 font-semibold text-emerald-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              {isActive ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" /> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-navy-900 px-4 py-5 shadow-[4px_0_24px_rgba(0,0,0,0.08)] lg:flex"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none text-white">E-Procurement</p>
            <p className="mt-0.5 text-xs text-slate-400">Supplier Workspace</p>
          </div>
        </div>

        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-slate-600">Menu</p>
        <nav className="flex-1">{NavBlock}</nav>

        <div className="mt-auto border-t border-slate-800 pt-4">
          <button type="button" className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-xs font-bold text-white">S</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{currentUser?.fullName || "Supplier User"}</p>
              <p className="truncate text-xs text-slate-500">{currentUser?.email || "supplier@eprocurement.gov"}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
          </button>
        </div>
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <aside
            className="absolute inset-y-0 left-0 flex w-[248px] flex-col bg-navy-900 px-4 py-5 shadow-[4px_0_24px_rgba(0,0,0,0.08)]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          >
            <div className="mb-8 flex items-start justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none text-white">E-Procurement</p>
                  <p className="mt-0.5 text-xs text-slate-400">Supplier Workspace</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-slate-600">Menu</p>
            <nav className="flex-1">{NavBlock}</nav>

            <div className="mt-auto border-t border-slate-800 pt-4">
              <button type="button" className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-xs font-bold text-white">S</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{currentUser?.fullName || "Supplier User"}</p>
                  <p className="truncate text-xs text-slate-500">{currentUser?.email || "supplier@eprocurement.gov"}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
