// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\Toast.jsx
// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\Toast.jsx
import { useEffect } from "react";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const TOAST_STYLE = {
  success: {
    icon: CheckCircle,
    classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  error: {
    icon: XCircle,
    classes: "border-red-200 bg-red-50 text-red-600",
  },
  warning: {
    icon: AlertTriangle,
    classes: "border-amber-200 bg-amber-50 text-amber-700",
  },
};

export default function Toast({ message, type = "success", isVisible, onClose }) {
  useEffect(() => {
    if (!isVisible || !onClose) return undefined;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [isVisible, onClose]);

  const tone = TOAST_STYLE[type] || TOAST_STYLE.success;
  const Icon = tone.icon;

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-lg transition-all duration-300 ${tone.classes} ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0 pointer-events-none"
      }`}
      role="status"
      aria-live="polite"
    >
      <Icon className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}
