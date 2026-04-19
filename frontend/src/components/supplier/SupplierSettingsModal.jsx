// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\supplier\SupplierSettingsModal.jsx
import { Eye, EyeOff, X } from "lucide-react";
import { useState } from "react";

export default function SupplierSettingsModal({ isOpen, onClose }) {
  const [tab, setTab] = useState("password");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notifications, setNotifications] = useState({
    bidUpdates: true,
    projectDeadlines: true,
    bidResults: true,
    systemUpdates: false,
  });

  if (!isOpen) return null;

  function handlePasswordChange() {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    alert("Password changed successfully");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  function handleNotificationSave() {
    alert("Notification preferences saved");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200">
          <div className="flex gap-1 px-6">
            <button
              type="button"
              onClick={() => setTab("password")}
              className={`-mb-px border-b-2 px-3 py-3 text-sm font-medium transition-all ${
                tab === "password"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setTab("notifications")}
              className={`-mb-px border-b-2 px-3 py-3 text-sm font-medium transition-all ${
                tab === "notifications"
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Notifications
            </button>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {tab === "password" ? (
            <>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Current Password</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-9 text-sm text-slate-800 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">New Password</span>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-9 text-sm text-slate-800 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Confirm Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                />
              </label>
            </>
          ) : (
            <div className="space-y-3">
              {[
                { key: "bidUpdates", label: "Bid Updates", desc: "Get notified when your bids are reviewed" },
                { key: "projectDeadlines", label: "Project Deadlines", desc: "Reminders for upcoming bid deadlines" },
                { key: "bidResults", label: "Bid Results", desc: "Notifications when bids are awarded" },
                { key: "systemUpdates", label: "System Updates", desc: "General platform announcements" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                  <input
                    type="checkbox"
                    checked={notifications[key]}
                    onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                    className="mt-1 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-3">
          {tab === "password" ? (
            <button
              type="button"
              onClick={handlePasswordChange}
              className="w-full rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Change Password
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNotificationSave}
              className="w-full rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
            >
              Save Preferences
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
