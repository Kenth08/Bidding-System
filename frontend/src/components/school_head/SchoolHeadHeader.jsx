// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\school_head\SchoolHeadHeader.jsx
import { ChevronDown, LogOut, Menu } from "lucide-react";
import { useRef, useState } from "react";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import NotificationPanel from "../shared/NotificationPanel";

function SchoolHeadProfileDropdown({ currentUser, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useOutsideClick(dropdownRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-slate-50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-xs font-bold text-white">
          {currentUser?.full_name?.charAt(0) || "H"}
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold leading-none text-slate-700">{currentUser?.full_name || "School Head"}</p>
          <p className="mt-0.5 text-xs text-slate-400">School Head</p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-white">
                {currentUser?.full_name?.charAt(0) || "H"}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{currentUser?.full_name || "School Head"}</p>
                <p className="text-xs text-slate-400">{currentUser?.email || "head@gmail.com"}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 p-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function SchoolHeadHeader({ title, subtitle, currentUser, setSidebarOpen, onLogout, onNotificationNavigate }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-800">{title}</h1>
          <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
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