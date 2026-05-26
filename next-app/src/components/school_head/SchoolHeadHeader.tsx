"use client";
import { ChevronDown, LogOut, Menu } from "lucide-react";
import { useRef, useState } from "react";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import NotificationPanel from "../shared/NotificationPanel";

interface SchoolHeadUser { full_name?: string; email?: string; }

function SchoolHeadProfileDropdown({ currentUser, onLogout }: { currentUser?: SchoolHeadUser | null; onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useOutsideClick(dropdownRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      <button type="button" onClick={() => setIsOpen((p) => !p)} className="flex items-center gap-2.5 rounded-2xl px-2 py-1.5 transition-colors hover:bg-slate-50">
        <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-500 text-xs font-bold text-white">S</div>
        <div className="text-left"><p className="text-xs font-semibold leading-none text-slate-700">School Head</p></div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-white">S</div>
              <div><p className="text-sm font-semibold text-slate-800">School Head</p><p className="text-xs text-slate-400">{currentUser?.email || "head@gmail.com"}</p></div>
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

interface SchoolHeadHeaderProps {
  title: string;
  subtitle?: string;
  currentUser?: SchoolHeadUser | null;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
  onNotificationNavigate?: (link: string, item: unknown) => void;
}

export default function SchoolHeadHeader({ title, subtitle, currentUser, setSidebarOpen, onLogout, onNotificationNavigate }: SchoolHeadHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 lg:hidden" aria-label="Open sidebar"><Menu className="h-5 w-5" /></button>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">School Head Workspace</p>
          <h1 className="text-base font-semibold text-slate-900">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NotificationPanel onNavigate={onNotificationNavigate} />
        <div className="h-5 w-px bg-slate-200" />
        <SchoolHeadProfileDropdown currentUser={currentUser} onLogout={onLogout} />
      </div>
    </header>
  );
}
