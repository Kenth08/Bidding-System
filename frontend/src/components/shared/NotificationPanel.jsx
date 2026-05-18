// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\NotificationPanel.jsx
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Award,
  Bell,
  Briefcase,
  CheckCircle,
  FileText,
  FolderOpen,
  Handshake,
  RotateCcw,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { notificationsAPI } from "../../services/api";

const ICON_MAP = {
  new_supplier: { icon: Users, bg: "bg-amber-50", color: "text-amber-500" },
  supplier_approved: { icon: CheckCircle, bg: "bg-emerald-50", color: "text-emerald-500" },
  supplier_rejected: { icon: X, bg: "bg-red-50", color: "text-red-500" },
  new_bid: { icon: FileText, bg: "bg-blue-50", color: "text-blue-500" },
  bid_won: { icon: Award, bg: "bg-emerald-50", color: "text-emerald-500" },
  bid_lost: { icon: AlertCircle, bg: "bg-red-50", color: "text-red-500" },
  project_published: { icon: FolderOpen, bg: "bg-emerald-50", color: "text-emerald-500" },
  project_awarded: { icon: Handshake, bg: "bg-blue-50", color: "text-blue-500" },
  procurement_request: { icon: Briefcase, bg: "bg-amber-50", color: "text-amber-500" },
  request_approved: { icon: CheckCircle, bg: "bg-emerald-50", color: "text-emerald-500" },
  request_rejected: { icon: X, bg: "bg-red-50", color: "text-red-500" },
  winner_selected: { icon: Award, bg: "bg-emerald-50", color: "text-emerald-500" },
  blockchain_recorded: { icon: Shield, bg: "bg-slate-100", color: "text-slate-500" },
  revision_required: { icon: RotateCcw, bg: "bg-blue-50", color: "text-blue-500" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function NotificationPanel({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  useOutsideClick(panelRef, () => setOpen(false));

  useEffect(() => {
    fetchUnreadCount();
    const interval = window.setInterval(fetchUnreadCount, 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  async function fetchUnreadCount() {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(Number(response.data.count || 0));
    } catch {
      // Silently ignore notification polling errors.
    }
  }

  async function fetchNotifications() {
    setLoading(true);
    try {
      const response = await notificationsAPI.getAll();
      setNotifications(response.data.results || response.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Silently ignore.
    }
  }

  async function handleMarkRead(id, wasUnread = true) {
    try {
      await notificationsAPI.markOneRead(id);
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Silently ignore.
    }
  }

  function resolveNavigationTarget(item) {
    const link = String(item?.link || "").trim();
    if (!link) return { link: "", projectId: null };

    try {
      const parsed = new URL(link, window.location.origin);
      const projectId = parsed.searchParams.get("project");
      return { link: parsed.pathname, projectId };
    } catch {
      const [path, query = ""] = link.split("?");
      const params = new URLSearchParams(query);
      return { link: path, projectId: params.get("project") };
    }
  }

  async function handleNotificationClick(item) {
    await handleMarkRead(item.id, !item.is_read);
    const target = resolveNavigationTarget(item);
    setOpen(false);
    onNavigate?.(target.link, { ...item, projectId: target.projectId });
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">Notifications</p>
              {unreadCount ? <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-500">{unreadCount}</span> : null}
            </div>
            {unreadCount > 0 ? (
              <button type="button" onClick={handleMarkAllRead} className="text-xs font-medium text-emerald-500 transition-colors hover:text-emerald-600">
                Mark all as read
              </button>
            ) : null}
          </div>

          <div className="max-h-72 divide-y divide-slate-50 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Bell className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-xs font-semibold text-slate-500">No notifications yet</p>
                <p className="mt-0.5 text-xs text-slate-400">Activity will appear here</p>
              </div>
            ) : (
              notifications.map((item) => {
                const config = ICON_MAP[item.type] || { icon: Bell, bg: "bg-slate-100", color: "text-slate-400" };
                const Icon = config.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${item.is_read ? "hover:bg-slate-50" : "border-l-2 border-l-emerald-400 bg-emerald-50/30 hover:bg-emerald-50/50"}`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs ${item.is_read ? "font-medium text-slate-700" : "font-semibold text-slate-800"}`}>{item.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{item.message}</p>
                    </div>
                    <p className="ml-auto mt-0.5 shrink-0 text-xs text-slate-300">{timeAgo(item.created_at)}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
