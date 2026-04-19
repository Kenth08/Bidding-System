// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\StatusBadge.jsx
const STATUS_CLASS_MAP = {
  Active: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  Closed: "border border-slate-200 bg-slate-100 text-slate-500",
  Awarded: "border border-blue-100 bg-blue-50 text-blue-600",
  Pending: "border border-amber-100 bg-amber-50 text-amber-600",
  Approved: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  Rejected: "border border-red-100 bg-red-50 text-red-500",
  Submitted: "border border-slate-200 bg-slate-100 text-slate-600",
  "Under Review": "border border-blue-100 bg-blue-50 text-blue-600",
  Selected: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  Recorded: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  "Recorded ✓": "border border-emerald-100 bg-emerald-50 text-emerald-700",
  Inactive: "border border-slate-200 bg-slate-100 text-slate-500",
  Won: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  Verified: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  "Not Selected": "border border-slate-200 bg-slate-100 text-slate-500",
  "Not Awarded": "border border-slate-200 bg-slate-100 text-slate-500",
  admin: "border border-blue-100 bg-blue-50 text-blue-600",
  supplier: "border border-emerald-100 bg-emerald-50 text-emerald-700",
  viewer: "border border-slate-200 bg-slate-100 text-slate-500",
};

export default function StatusBadge({ status, className = "" }) {
  const tone = STATUS_CLASS_MAP[status] || "border border-slate-200 bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${tone} ${className}`}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {status}
    </span>
  );
}
