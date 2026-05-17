// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\StatusBadge.jsx
import { getStatusLabel } from "../../lib/procurementStatus";

const STATUS_CLASS_MAP = {
  Draft: "border border-slate-200 bg-slate-100 text-slate-600",
  "Pending Review": "border border-amber-100 bg-amber-50 text-amber-700",
  Approved: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  Active: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  "Open for Bidding": "border border-emerald-100 bg-emerald-50 text-emerald-700",
  Closed: "border border-slate-200 bg-slate-100 text-slate-500",
  Awarded: "border border-blue-100 bg-blue-50 text-blue-600",
  Rejected: "border border-red-100 bg-red-50 text-red-500",
  "Revision Required": "border border-orange-100 bg-orange-50 text-orange-700",
  Submitted: "border border-slate-200 bg-slate-100 text-slate-600",
  "Under Evaluation": "border border-blue-100 bg-blue-50 text-blue-600",
  Won: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  Lost: "border border-red-100 bg-red-50 text-red-500",
  Recorded: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  "Recorded ✓": "border border-emerald-100 bg-emerald-50 text-emerald-700",
  Inactive: "border border-slate-200 bg-slate-100 text-slate-500",
  Verified: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  Pending: "border border-amber-100 bg-amber-50 text-amber-600",
  admin: "border border-blue-100 bg-blue-50 text-blue-600",
  supplier: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  viewer: "border border-slate-200 bg-slate-100 text-slate-500",
};

/**
 * @param {{ status: string, className?: string }} props
 */
export default function StatusBadge({ status, className = "" }) {
  const label = getStatusLabel(status);
  const tone = STATUS_CLASS_MAP[label] || STATUS_CLASS_MAP[String(label || "")] || "border border-slate-200 bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${tone} ${className}`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {label}
    </span>
  );
}
