"use client";
import { ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import NotificationPanel from "../shared/NotificationPanel";
import AdminSearchDropdown from "./AdminSearchDropdown";

function AdminProfileDropdown({ currentUser, onLogout }: { currentUser?: { fullName?: string; email?: string } | null; onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useOutsideClick(dropdownRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      <button type="button" onClick={() => setIsOpen((p) => !p)} className="flex items-center gap-2.5 rounded-2xl px-2 py-1.5 transition-colors hover:bg-slate-50">
        <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-500 text-xs font-bold text-white">{(currentUser?.fullName || "A").charAt(0).toUpperCase()}</div>
        <div className="text-left"><p className="text-xs font-semibold leading-none text-slate-700">{currentUser?.fullName || "Admin"}</p><p className="mt-0.5 text-xs text-slate-400">{currentUser?.email || "admin@eprocurement.gov"}</p></div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-white">{(currentUser?.fullName || "A").charAt(0).toUpperCase()}</div>
              <div><p className="text-sm font-semibold text-slate-800">{currentUser?.fullName || "Administrator"}</p><p className="text-xs text-slate-400">{currentUser?.email || "admin@eprocurement.gov"}</p></div>
            </div>
          </div>
          <div className="border-t border-slate-100 p-1.5">
            <button type="button" onClick={() => { setIsOpen(false); onLogout(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"><LogOut className="h-4 w-4" />Sign Out</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  currentUser?: { fullName?: string; email?: string } | null;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
  projects?: Array<Record<string, unknown>>;
  suppliers?: Array<Record<string, unknown>>;
  bids?: Array<Record<string, unknown>>;
  blockchainRecords?: Array<Record<string, unknown>>;
  onNotificationNavigate?: (link: string, item: unknown) => void;
}

export default function AdminHeader({ title, subtitle, currentUser, setSidebarOpen, onLogout, projects = [], suppliers = [], bids = [], blockchainRecords = [], onNotificationNavigate }: AdminHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useOutsideClick(searchRef, () => { setShowSearch(false); setSearchQuery(""); });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) { if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 0); } }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSearchSelect() { setShowSearch(false); setSearchQuery(""); }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-colors hover:bg-emerald-50 hover:text-emerald-600 lg:hidden" aria-label="Open sidebar"><Menu className="h-5 w-5" /></button>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Admin Workspace</p>
          <h1 className="text-base font-semibold text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative hidden lg:block" ref={searchRef}>
          <button type="button" onClick={() => { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 0); }} className="flex w-52 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-emerald-50 hover:border-emerald-200 hover:text-slate-600">
            <Search className="h-3.5 w-3.5" /><span>Search...</span><span className="ml-auto font-mono text-xs text-slate-300">Ctrl+K</span>
          </button>
          {showSearch ? (
            <div className="absolute left-0 right-0 top-12 w-96">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-200 px-4 py-3">
                  <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search projects, suppliers, bids, records..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" />
                </div>
                <AdminSearchDropdown query={searchQuery} onQueryChange={setSearchQuery} projects={projects} suppliers={suppliers} bids={bids} blockchainRecords={blockchainRecords} onSelectResult={handleSearchSelect} />
              </div>
            </div>
          ) : null}
        </div>
        <NotificationPanel onNavigate={onNotificationNavigate} />
        <div className="h-5 w-px bg-slate-200" />
        <AdminProfileDropdown currentUser={currentUser} onLogout={onLogout} />
      </div>
    </header>
  );
}
