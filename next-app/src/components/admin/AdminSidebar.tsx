"use client";
import { Award, Briefcase, ChevronRight, FileText, FolderKanban, Gavel, LayoutDashboard, Shield, Users, X } from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "procurement", label: "Planning", icon: Briefcase },
  { key: "suppliers", label: "Suppliers", icon: Users },
  { key: "bids", label: "Bids", icon: Gavel },
  { key: "awarding", label: "Awards", icon: Award },
  { key: "reports", label: "Reports", icon: FileText },
];

interface AdminSidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentUser?: { fullName?: string; email?: string } | null;
}

export default function AdminSidebar({ currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, currentUser }: AdminSidebarProps) {
  const navItemClass = (isActive: boolean) =>
    `group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition-all duration-150 ${isActive
      ? "bg-white/10 font-semibold text-white shadow-[0_8px_20px_rgba(16,185,129,0.12)] ring-1 ring-emerald-400/20"
      : "text-slate-400 hover:bg-white/5 hover:text-white"}`;

  const NavBlock = (
    <ul className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.key;
        return (
          <li key={item.key}>
            <button type="button" onClick={() => { setCurrentPage(item.key); setSidebarOpen(false); }} className={navItemClass(isActive)}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
              {isActive ? <span className="ml-auto h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" /> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const bgStyle = { backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-navy-900 px-4 py-5 shadow-[4px_0_24px_rgba(0,0,0,0.08)] lg:flex" style={bgStyle}>
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20"><Shield className="h-4 w-4 text-white" /></div>
          <div><p className="text-sm font-bold leading-none text-white">E-Procurement</p><p className="mt-0.5 text-xs text-slate-400">Admin Workspace</p></div>
        </div>
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">Menu</p>
        <nav className="flex-1">{NavBlock}</nav>
        <div className="mt-auto border-t border-slate-800 pt-4">
          <button type="button" className="flex w-full items-center gap-3 rounded-2xl border border-white/0 px-2 py-2 text-left transition-all hover:border-white/5 hover:bg-white/5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-xs font-bold text-white">{(currentUser?.fullName || "A").charAt(0).toUpperCase()}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{currentUser?.fullName || "Administrator"}</p><p className="truncate text-xs text-slate-500">{currentUser?.email || "admin@eprocurement.gov"}</p></div>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
          </button>
        </div>
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 flex w-[248px] flex-col bg-navy-900 px-4 py-5 shadow-[4px_0_24px_rgba(0,0,0,0.08)]" style={bgStyle}>
            <div className="mb-8 flex items-start justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500"><Shield className="h-4 w-4 text-white" /></div>
                <div><p className="text-sm font-bold leading-none text-white">E-Procurement</p><p className="mt-0.5 text-xs text-slate-400">Admin Workspace</p></div>
              </div>
              <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white" aria-label="Close sidebar"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">Menu</p>
            <nav className="flex-1">{NavBlock}</nav>
            <div className="mt-auto border-t border-slate-800 pt-4">
              <button type="button" className="flex w-full items-center gap-3 rounded-2xl border border-white/0 px-2 py-2 text-left transition-all hover:border-white/5 hover:bg-white/5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-xs font-bold text-white">{(currentUser?.fullName || "A").charAt(0).toUpperCase()}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{currentUser?.fullName || "Administrator"}</p><p className="truncate text-xs text-slate-500">{currentUser?.email || "admin@eprocurement.gov"}</p></div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
