// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\NotificationPanel.jsx
import {
  Award,
  CheckCircle,
  Clock,
  FileText,
  FolderOpen,
  Shield,
  Users,
} from "lucide-react";

const ICON_MAP = {
  Award,
  CheckCircle,
  Clock,
  FileText,
  FolderOpen,
  Shield,
  Users,
};

/**
 * @param {{
 * notifications?: Array<{id: string|number, icon: string, title: string, subtitle: string, time: string, read: boolean}>,
 * onMarkAllRead?: () => void
 * }} props
 */
export default function NotificationPanel({ notifications = [], onMarkAllRead }) {
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800">Notifications</p>
          {unreadCount ? <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-500">{unreadCount}</span> : null}
        </div>
        <button type="button" onClick={onMarkAllRead} className="text-xs font-medium text-emerald-500 transition-colors hover:text-emerald-600">
          Mark all read
        </button>
      </div>

      <div className="max-h-72 divide-y divide-slate-50 overflow-y-auto">
        {notifications.map((item) => {
          const Icon = ICON_MAP[item.icon] || Clock;

          return (
            <div
              key={item.id}
              className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${
                item.read ? "" : "border-l-2 border-l-emerald-400"
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-700">{item.title}</p>
                <p className="mt-0.5 truncate text-xs text-slate-400">{item.subtitle}</p>
              </div>
              <p className="ml-auto mt-0.5 shrink-0 text-xs text-slate-300">{item.time}</p>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="w-full border-t border-slate-100 px-4 py-3 text-center text-xs font-medium text-emerald-500 transition-colors hover:bg-slate-50"
      >
        View all notifications
      </button>
    </div>
  );
}
