// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\EmptyState.jsx
import { ClipboardList } from "lucide-react";

/**
 * @param {{
 * icon?: import('react').ComponentType<{ className?: string }>,
 * title?: string,
 * subtitle?: string,
 * actionLabel?: string,
 * onAction?: () => void,
 * label?: string
 * }} props
 */
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{resolvedTitle}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">{subtitle}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
        >
          {actionLabel} <span aria-hidden="true">→</span>
        </button>
      ) : null}
    </div>
  );
}
