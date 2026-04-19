// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\EmptyState.jsx
import { ClipboardList } from "lucide-react";

export default function EmptyState({
  icon: Icon = ClipboardList,
  title = "No records found",
  subtitle = "Try adjusting your filters or check back later.",
  actionLabel,
  onAction,
  label,
}) {
  const resolvedTitle = label || title;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-600">{resolvedTitle}</p>
      <p className="mt-1 max-w-xs text-xs text-slate-400">{subtitle}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
        >
          {actionLabel} →
        </button>
      ) : null}
    </div>
  );
}
