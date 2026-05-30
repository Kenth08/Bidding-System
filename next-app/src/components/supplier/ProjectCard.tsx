"use client";
import { Calendar, Clock, DollarSign, Eye, FileText, MapPin, Tag, Timer } from "lucide-react";

function formatPeso(value: unknown) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatDate(value: unknown) {
  if (!value) return "—";
  return new Date(value as string).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export type DeadlineStatus = "open" | "closing_soon" | "closed";

export function getDeadlineStatus(deadline: string): DeadlineStatus {
  const now = new Date();
  const dl = new Date(deadline);
  if (dl < now) return "closed";
  const diff = (dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 3 ? "closing_soon" : "open";
}

const DEADLINE_BADGE: Record<DeadlineStatus, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closing_soon: { label: "Closing Soon", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  closed: { label: "Closed", cls: "bg-red-50 text-red-700 border-red-200" },
};

interface SupplierBid {
  id: string;
  status: string;
  submitted_at: string;
  bid_amount: number;
}

interface ProjectCardProps {
  project: any;
  supplierBid?: SupplierBid | null;
  onSubmitBid: () => void;
  onViewDetails: () => void;
}

export default function ProjectCard({ project, supplierBid, onSubmitBid, onViewDetails }: ProjectCardProps) {
  const deadlineStatus = getDeadlineStatus(project.deadline);
  const badge = DEADLINE_BADGE[deadlineStatus];
  const hasBid = Boolean(supplierBid);
  const isClosed = deadlineStatus === "closed";

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}>{badge.label}</span>
            {hasBid && <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">Bid Submitted</span>}
            {project.procurement_type && <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">{project.procurement_type}</span>}
            {project.open_to_all && <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">Open to All</span>}
            {!project.open_to_all && project.project_business_types?.length > 0 && <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">Matched with your business type</span>}
          </div>
          {project.project_business_types?.length ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {project.project_business_types.map((pbt: any) => (
                <span key={pbt.business_type?.id || pbt.business_type?.name} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">{pbt.business_type?.name}</span>
              ))}
            </div>
          ) : project.open_to_all ? null : null}
          <h3 className="text-base font-semibold text-slate-900 leading-snug">{project.title}</h3>
          {project.requirements && <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{project.requirements}</p>}
        </div>

        {/* Right side: budget + actions */}
        <div className="flex shrink-0 flex-col items-end gap-2 md:min-w-[180px]">
          <p className="text-lg font-bold text-slate-900">{formatPeso(project.budget)}</p>
          <p className="text-[11px] text-slate-400">Approved Budget</p>
        </div>
      </div>

      {/* Info grid */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
        <InfoItem icon={Calendar} label="Deadline" value={formatDate(project.deadline)} />
        <InfoItem icon={Tag} label="Category" value={project.procurement_type || "—"} />
        <InfoItem icon={Timer} label="Delivery" value={project.delivery_period ? `${project.delivery_period} days` : "—"} />
        <InfoItem icon={Clock} label="Posted" value={formatDate(project.published_at || project.created_at)} />
      </div>

      {/* Footer: status text + actions */}
      <div className="mt-4 flex flex-col gap-3 border-t border-slate-50 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500">
          {hasBid ? (
            <span className="text-blue-600 font-medium">You submitted a bid on {formatDate(supplierBid!.submitted_at)}.</span>
          ) : isClosed ? (
            <span className="text-red-600 font-medium">Submission is closed for this project.</span>
          ) : (
            <span className="text-slate-500">You can still submit a bid before the deadline.</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onViewDetails} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
            <Eye className="h-3.5 w-3.5" /> View Details
          </button>
          {hasBid ? (
            <button onClick={onViewDetails} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-100">
              <FileText className="h-3.5 w-3.5" /> View Submitted Bid
            </button>
          ) : (
            <button onClick={onSubmitBid} disabled={isClosed} className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${isClosed ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
              <DollarSign className="h-3.5 w-3.5" /> Submit Bid
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      <span className="text-slate-400">{label}:</span>
      <span className="font-medium text-slate-700 truncate">{value}</span>
    </div>
  );
}
