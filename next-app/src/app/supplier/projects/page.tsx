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
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [proposal, setProposal] = useState("");
  const [quotationDocument, setQuotationDocument] = useState<File | null>(null);
  const [conflictOfInterest, setConflictOfInterest] = useState<"" | "no" | "yes">("");
  const [conflictOfInterestPerson, setConflictOfInterestPerson] = useState("");
  const [noPastScmIssues, setNoPastScmIssues] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [projectsRes, bidsRes] = await Promise.all([projectsAPI.getAll("active"), bidsAPI.getAll()]);
        setProjects(projectsRes.data);
        setBids(bidsRes.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const submittedProjectIds = new Set(
    bids.map((bid) => {
      if (typeof bid.project === "string") return bid.project;
      return bid.project?.id || "";
    }).filter(Boolean)
  );

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedProposal = proposal.trim();
    const hasRequiredFields = Boolean(bidAmount && trimmedProposal && quotationDocument);
    const hasDeclarationChoice = conflictOfInterest !== "";

    if (!hasRequiredFields) {
      setFormError("Complete the bid amount, quotation, and proposal before submitting.");
      return;
    }

    if (!hasDeclarationChoice) {
      setFormError("Select a Declaration of Interest option before submitting.");
      return;
    }

    if (!noPastScmIssues) {
      setFormError("You must confirm your Past SCM Practices declaration before submitting.");
      return;
    }

    if (conflictOfInterest === "yes" && !conflictOfInterestPerson.trim()) {
      setFormError("Name the person if you know anyone in the committee or school administration.");
      return;
    }

    setFormError("");
    setConfirmSubmit(true);
  }

  async function handleConfirmBid() {
    if (!selected) return;
    setIsConfirmLoading(true);
    try {
      const noConflict = conflictOfInterest === "no";
      const payload = new FormData();
      payload.append("project_id", selected.id);
      payload.append("bid_amount", bidAmount);
      payload.append("proposal", proposal.trim());
      payload.append("quotation_document", quotationDocument as File);
      payload.append("no_conflict_of_interest", String(noConflict));
      payload.append("conflict_of_interest_person", noConflict ? "" : conflictOfInterestPerson.trim());
      payload.append("no_past_scm_issues", String(noPastScmIssues));
      await bidsAPI.create(payload);
      setToast({ message: "Bid submitted successfully!", type: "success" });
      setSelected(null); setBidAmount(""); setProposal(""); setQuotationDocument(null); setConflictOfInterest(""); setConflictOfInterestPerson(""); setNoPastScmIssues(false); setFormError("");
    } catch { setToast({ message: "Failed to submit bid", type: "error" }); }
    finally { setIsConfirmLoading(false); setConfirmSubmit(false); }
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-24 rounded-2xl bg-slate-100" /><div className="h-24 rounded-2xl bg-slate-100" /></div>;
  if (!projects.length) return <EmptyState title="No active projects" subtitle="Check back later for new procurement opportunities." />;

  const canSubmitBid = Boolean(
    bidAmount &&
    proposal.trim() &&
    quotationDocument &&
    conflictOfInterest !== "" &&
    noPastScmIssues &&
    (conflictOfInterest === "no" || conflictOfInterestPerson.trim())
  );

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
            <button
              onClick={() => {
                if (submittedProjectIds.has(p.id)) return;
                setSelected(p);
              }}
              disabled={submittedProjectIds.has(p.id)}
              aria-disabled={submittedProjectIds.has(p.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${submittedProjectIds.has(p.id) ? "bg-slate-100 text-slate-400" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
            >
              {submittedProjectIds.has(p.id) ? "Bid Submitted" : "Submit Bid"}
            </button>
          </div>
          {submittedProjectIds.has(p.id) ? <p className="mt-3 text-xs font-medium text-emerald-600">You already submitted a bid for this project.</p> : null}
        </div>
      ))}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Submit Bid" subtitle={selected?.title}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">{formError}</p> : null}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Bid Amount (₱)</label>
            <input type="number" step="0.01" required value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Proposal</label>
            <textarea required rows={4} value={proposal} onChange={(e) => setProposal(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Quotation Document (SBD 3)</label>
            <input type="file" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => setQuotationDocument(e.target.files?.[0] || null)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
          </div>
          <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div>
              <p className="text-xs font-semibold text-slate-700">Declaration of Interest (SBD 4)</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">Disclose whether you know anyone in the committee or school administration.</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-700">
              <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <input type="radio" name="conflict" required checked={conflictOfInterest === "no"} onChange={() => setConflictOfInterest("no")} />
                I do not know anyone involved
              </label>
              <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <input type="radio" name="conflict" checked={conflictOfInterest === "yes"} onChange={() => setConflictOfInterest("yes")} />
                I know someone involved
              </label>
            </div>
            {conflictOfInterest === "" ? <p className="text-[11px] text-amber-700">Required: choose one Declaration of Interest option before you can submit.</p> : null}
            {conflictOfInterest === "yes" ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Name the person</label>
                <input value={conflictOfInterestPerson} onChange={(e) => setConflictOfInterestPerson(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" placeholder="Committee or school staff name" />
              </div>
            ) : null}
            {conflictOfInterest === "yes" ? <p className="text-[11px] text-amber-700">This declaration will be recorded for review when you submit the bid.</p> : null}
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-700">
            <input type="checkbox" required checked={noPastScmIssues} onChange={(e) => setNoPastScmIssues(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
            <span>
              <span className="block font-semibold">Past SCM Practices (SBD 8)</span>
              <span className="block text-[11px] leading-5 text-slate-500">I declare that I have never been blacklisted, restricted, or penalized in any government procurement process.</span>
            </span>
          </label>
          {!noPastScmIssues ? <p className="text-[11px] text-amber-700">Required: confirm the Past SCM Practices declaration before submitting.</p> : null}
          <LoadingButton type="submit" isLoading={false} disabled={!canSubmitBid || isConfirmLoading} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">Submit Bid</LoadingButton>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmSubmit} onClose={() => setConfirmSubmit(false)} onConfirm={handleConfirmBid} title="Confirm Bid Submission" message={`Submit a bid of ₱${Number(bidAmount || 0).toLocaleString()} for "${selected?.title}"? This cannot be changed after submission.`} confirmLabel="Submit Bid" isConfirmLoading={isConfirmLoading} />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
