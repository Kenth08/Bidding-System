"use client";
import { Calendar, Clock, DollarSign, FileText, MapPin, Tag, Timer } from "lucide-react";
import Modal from "@/components/shared/Modal";

function formatPeso(value: unknown) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(value || 0));
}
function formatDate(value: unknown) {
  if (!value) return "—";
  return new Date(value as string).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

interface ProjectDetailsModalProps {
  project: any | null;
  supplierBid?: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitBid?: () => void;
}

export default function ProjectDetailsModal({ project, supplierBid, isOpen, onClose, onSubmitBid }: ProjectDetailsModalProps) {
  if (!project) return null;

  const isClosed = project.deadline && new Date(project.deadline) < new Date();
  const hasBid = Boolean(supplierBid);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Details" subtitle={project.title} size="xl">
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Summary grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <DetailBox icon={DollarSign} label="Approved Budget" value={formatPeso(project.budget)} />
          <DetailBox icon={Calendar} label="Deadline" value={formatDate(project.deadline)} />
          <DetailBox icon={Tag} label="Procurement Mode" value={project.procurement_type || "—"} />
          <DetailBox icon={Timer} label="Delivery Period" value={project.delivery_period ? `${project.delivery_period} calendar days` : "—"} />
          <DetailBox icon={Clock} label="Date Posted" value={formatDate(project.published_at || project.created_at)} />
          <DetailBox icon={FileText} label="Status" value={project.status} />
        </div>

        {/* Description / Requirements */}
        {project.requirements && (
          <Section title="Project Description / Requirements">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{project.requirements}</p>
          </Section>
        )}

        {/* Technical Specifications */}
        {project.technical_specifications && (
          <Section title="Technical Specifications / Scope of Work">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{project.technical_specifications}</p>
          </Section>
        )}

        {/* Procurement Request info */}
        {project.procurement_request && (
          <Section title="Procurement Information">
            <div className="grid grid-cols-2 gap-3">
              {project.procurement_request.delivery_period && <DetailBox icon={Timer} label="Delivery Period" value={project.procurement_request.delivery_period} />}
              {project.procurement_request.procurement_schedule && <DetailBox icon={Calendar} label="Schedule" value={project.procurement_request.procurement_schedule} />}
            </div>
          </Section>
        )}

        {/* Contact person */}
        {project.created_by && (
          <Section title="Contact Person">
            <p className="text-sm text-slate-700">{project.created_by.full_name}</p>
            <p className="text-xs text-slate-500">{project.created_by.email}</p>
          </Section>
        )}

        {/* Supplier's bid info */}
        {hasBid && (
          <Section title="Your Submitted Bid">
            <div className="grid grid-cols-2 gap-3">
              <DetailBox icon={DollarSign} label="Bid Amount" value={formatPeso(supplierBid.bid_amount)} />
              <DetailBox icon={Clock} label="Submitted" value={formatDate(supplierBid.submitted_at)} />
            </div>
            <p className="mt-2 text-xs text-blue-600 font-medium">Status: {supplierBid.status}</p>
          </Section>
        )}

        {/* Action */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
          {!hasBid && !isClosed && onSubmitBid && (
            <button onClick={() => { onClose(); onSubmitBid(); }} className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">Submit Bid</button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{title}</p>
      <div className="rounded-xl bg-slate-50 p-3">{children}</div>
    </div>
  );
}

function DetailBox({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <p className="text-[11px] text-slate-400">{label}</p>
      </div>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
