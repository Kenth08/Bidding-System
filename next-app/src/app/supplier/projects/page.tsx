"use client";
import { useState, useEffect } from "react";
import { Calendar, DollarSign } from "lucide-react";
import { projectsAPI, bidsAPI } from "@/services/api";
import Modal from "@/components/shared/Modal";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Toast from "@/components/shared/Toast";
import EmptyState from "@/components/shared/EmptyState";
import LoadingButton from "@/components/ui/LoadingButton";
import { Project } from "@/types/project";

export default function SupplierProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [proposal, setProposal] = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    projectsAPI.getAll("active").then((r) => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bidAmount || !proposal) return;
    setConfirmSubmit(true);
  }

  async function handleConfirmBid() {
    if (!selected) return;
    setIsConfirmLoading(true);
    try {
      await bidsAPI.create({ project: selected.id, bid_amount: parseFloat(bidAmount), proposal });
      setToast({ message: "Bid submitted successfully!", type: "success" });
      setSelected(null); setBidAmount(""); setProposal("");
    } catch { setToast({ message: "Failed to submit bid", type: "error" }); }
    finally { setIsConfirmLoading(false); setConfirmSubmit(false); }
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-24 rounded-2xl bg-slate-100" /><div className="h-24 rounded-2xl bg-slate-100" /></div>;
  if (!projects.length) return <EmptyState title="No active projects" subtitle="Check back later for new procurement opportunities." />;

  return (
    <div className="space-y-4">
      {projects.map((p) => (
        <div key={p.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{p.title}</h3>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />₱{Number(p.budget).toLocaleString()}</span>
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(p.deadline).toLocaleDateString()}</span>
              </div>
            </div>
            <button onClick={() => setSelected(p)} className="shrink-0 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100">Submit Bid</button>
          </div>
        </div>
      ))}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Submit Bid" subtitle={selected?.title}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Bid Amount (₱)</label>
            <input type="number" step="0.01" required value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Proposal</label>
            <textarea required rows={4} value={proposal} onChange={(e) => setProposal(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <LoadingButton type="submit" isLoading={false} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">Submit Bid</LoadingButton>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmSubmit} onClose={() => setConfirmSubmit(false)} onConfirm={handleConfirmBid} title="Confirm Bid Submission" message={`Submit a bid of ₱${Number(bidAmount || 0).toLocaleString()} for "${selected?.title}"? This cannot be changed after submission.`} confirmLabel="Submit Bid" isConfirmLoading={isConfirmLoading} />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
