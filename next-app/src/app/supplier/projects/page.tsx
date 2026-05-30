"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, DollarSign, FileCheck2, RefreshCw, ShieldCheck, Signature, TriangleAlert, Upload, X } from "lucide-react";
import { projectsAPI, bidsAPI } from "@/services/api";
import Modal from "@/components/shared/Modal";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Toast from "@/components/shared/Toast";
import SignaturePad from "@/components/shared/SignaturePad";
import EmptyState from "@/components/shared/EmptyState";
import LoadingButton from "@/components/ui/LoadingButton";
import SearchBar from "@/components/shared/SearchBar";
import StrictNumberInput from "@/components/shared/StrictNumberInput";
import ProjectCard, { getDeadlineStatus } from "@/components/supplier/ProjectCard";
import ProjectDetailsModal from "@/components/supplier/ProjectDetailsModal";
import { Project } from "@/types/project";

type BidDocumentState = {
  file: File | null;
  error: string;
  success: boolean;
};

const ALLOWED_BID_DOCUMENT_EXTENSIONS = ["pdf", "docx"];

function formatPeso(value: unknown) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function getFileExtension(file: File) {
  const parts = file.name.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
}

function createDocumentState(): BidDocumentState {
  return { file: null, error: "", success: false };
}

function DocumentUploadField({
  title,
  description,
  required,
  state,
  onChange,
  onClear,
}: {
  title: string;
  description: string;
  required?: boolean;
  state: BidDocumentState;
  onChange: (file: File | null) => void;
  onClear: () => void;
}) {
  const inputId = title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return (
    <div className={`rounded-2xl border p-4 transition ${state.error ? "border-red-200 bg-red-50/40" : state.success ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-slate-50/70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {title} {required ? <span className="text-red-500">*</span> : null}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        {state.success ? (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            Uploaded
          </span>
        ) : null}
      </div>

      <label htmlFor={inputId} className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50/40">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Upload className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-700">Click to upload</p>
          <p className="truncate text-xs text-slate-400">PDF or DOCX only</p>
        </div>
        {state.file ? <FileCheck2 className="h-4 w-4 text-emerald-600" /> : null}
      </label>

      <input
        id={inputId}
        type="file"
        accept=".pdf,.docx"
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className={`truncate text-xs ${state.file ? "text-emerald-700" : "text-slate-500"}`}>{state.file ? state.file.name : "No file selected"}</p>
        {state.file ? (
          <button type="button" onClick={onClear} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-white">
            <X className="h-3 w-3" /> Clear
          </button>
        ) : null}
      </div>

      {state.error ? <p className="mt-2 text-xs font-medium text-red-600">{state.error}</p> : null}
    </div>
  );
}

export default function SupplierProjects() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get("project");
  const [projects, setProjects] = useState<Project[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [userBusinessType, setUserBusinessType] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [detailsProject, setDetailsProject] = useState<Project | null>(null);
  const [selected, setSelected] = useState<Project | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [additionalRemarks, setAdditionalRemarks] = useState("");
  const [quotationDocument, setQuotationDocument] = useState<BidDocumentState>(createDocumentState());
  const [technicalProposalDocument, setTechnicalProposalDocument] = useState<BidDocumentState>(createDocumentState());
  const [supportingDocuments, setSupportingDocuments] = useState<BidDocumentState>(createDocumentState());
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureName, setSignatureName] = useState<string>("");
  const [signatureSaved, setSignatureSaved] = useState(false);
  const [conflictOfInterest, setConflictOfInterest] = useState<"" | "no" | "yes">("");
  const [supplierDeclaration, setSupplierDeclaration] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const approvedBudget = Number(selected?.budget || 0);
  const offeredPrice = Number(bidAmount || 0);
  const exceedsBudget = Boolean(bidAmount && selected && Number.isFinite(offeredPrice) && offeredPrice > approvedBudget);
  const requiredFilesReady = Boolean(quotationDocument.file && technicalProposalDocument.file);
  const hasSignature = Boolean(signatureBlob && signatureSaved && signatureName.trim());
  const canSubmitBid = Boolean(
    bidAmount &&
    Number.isFinite(offeredPrice) &&
    offeredPrice > 0 &&
    !exceedsBudget &&
    requiredFilesReady &&
    hasSignature &&
    conflictOfInterest !== "" &&
    supplierDeclaration
  );

  function resetBidForm() {
    setSelected(null);
    setBidAmount("");
    setAdditionalRemarks("");
    setQuotationDocument(createDocumentState());
    setTechnicalProposalDocument(createDocumentState());
    setSupportingDocuments(createDocumentState());
    setSignatureBlob(null);
    setSignaturePreview(null);
    setSignatureName("");
    setSignatureSaved(false);
    setConflictOfInterest("");
    setSupplierDeclaration(false);
    setFormError("");
  }

  function validateBidFile(file: File | null, required: boolean) {
    if (!file) return required ? "Upload a PDF or DOCX file." : "";
    const extension = getFileExtension(file);
    if (!ALLOWED_BID_DOCUMENT_EXTENSIONS.includes(extension)) return "Only PDF and DOCX files are allowed.";
    return "";
  }

  function updateDocument(setter: (state: BidDocumentState) => void, file: File | null, required: boolean) {
    const error = validateBidFile(file, required);
    setter({ file, error, success: Boolean(file && !error) });
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setFetchError(false);
    try {
      const [projectsRes, bidsRes, meRes] = await Promise.all([projectsAPI.getAll("active"), bidsAPI.getAll(), (await import("@/services/api")).authAPI.me()]);
      setProjects(projectsRes.data);
      setBids(bidsRes.data);
      const user = meRes.data;
      setUserBusinessType(user?.business_type || null);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedProjectId || !projects.length) return;
    const match = projects.find((project) => project.id === selectedProjectId);
    if (match) setSelected(match);
  }, [projects, selectedProjectId]);

  const submittedProjectIds = new Set(
    bids.map((bid) => {
      if (typeof bid.project === "string") return bid.project;
      return bid.project?.id || bid.project_id || "";
    }).filter(Boolean)
  );

  const bidByProject = useMemo(() => {
    const map = new Map<string, any>();
    for (const bid of bids) {
      const pid = typeof bid.project === "string" ? bid.project : bid.project?.id || bid.project_id || "";
      if (pid) map.set(pid, bid);
    }
    return map;
  }, [bids]);

  const filteredProjects = useMemo(() => {
    let list = [...projects];

    // Search
    const q = search.toLowerCase();
    if (q) list = list.filter((p) => p.title.toLowerCase().includes(q) || (p.procurement_type || "").toLowerCase().includes(q) || (p.requirements || "").toLowerCase().includes(q));

    // Status filter
    if (statusFilter === "open") list = list.filter((p) => getDeadlineStatus(p.deadline) === "open" && !submittedProjectIds.has(p.id));
    else if (statusFilter === "closing_soon") list = list.filter((p) => getDeadlineStatus(p.deadline) === "closing_soon");
    else if (statusFilter === "submitted") list = list.filter((p) => submittedProjectIds.has(p.id));
    else if (statusFilter === "closed") list = list.filter((p) => getDeadlineStatus(p.deadline) === "closed");

    // Sort
    if (sortBy === "newest") list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (sortBy === "deadline") list.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    else if (sortBy === "budget_high") list.sort((a, b) => Number(b.budget) - Number(a.budget));
    else if (sortBy === "budget_low") list.sort((a, b) => Number(a.budget) - Number(b.budget));

    return list;
  }, [projects, search, statusFilter, sortBy, submittedProjectIds]);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const quotationError = validateBidFile(quotationDocument.file, true);
    const technicalError = validateBidFile(technicalProposalDocument.file, true);
    const supportingError = validateBidFile(supportingDocuments.file, false);
    updateDocument(setQuotationDocument, quotationDocument.file, true);
    updateDocument(setTechnicalProposalDocument, technicalProposalDocument.file, true);
    updateDocument(setSupportingDocuments, supportingDocuments.file, false);

    const hasRequiredFields = Boolean(
      bidAmount &&
      Number.isFinite(offeredPrice) &&
      offeredPrice > 0 &&
      !exceedsBudget &&
      quotationDocument.file &&
      technicalProposalDocument.file &&
      signatureBlob &&
      signatureSaved &&
      signatureName.trim()
    );
    const hasDeclarationChoice = conflictOfInterest !== "";

    if (!hasRequiredFields) {
      if (exceedsBudget) {
        setFormError(`Offered price cannot exceed the approved budget of ${formatPeso(selected?.budget || 0)}.`);
      } else if (quotationError || technicalError || supportingError) {
        setFormError(quotationError || technicalError || supportingError || "Upload all required bid documents.");
      } else {
        setFormError("Complete the offered price, required documents, and signature before submitting.");
      }
      return;
    }

    if (!hasDeclarationChoice) {
      setFormError("Select a conflict of interest declaration before submitting.");
      return;
    }

    if (!supplierDeclaration) {
      setFormError("You must confirm the supplier declaration before submitting.");
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
      payload.append("additional_remarks", additionalRemarks.trim());
      if (quotationDocument.file) payload.append("quotation_document", quotationDocument.file);
      if (technicalProposalDocument.file) payload.append("technical_proposal_document", technicalProposalDocument.file);
      if (supportingDocuments.file) payload.append("supporting_documents", supportingDocuments.file);
      if (signatureBlob) {
        const sigFile = new File([signatureBlob], `signature-${Date.now()}.png`, { type: signatureBlob.type });
        payload.append("digital_signature", sigFile);
        payload.append("signature_name", signatureName.trim());
        payload.append("signature_signed_at", new Date().toISOString());
      }
      payload.append("no_conflict_of_interest", String(noConflict));
      payload.append("no_past_scm_issues", String(supplierDeclaration));
      payload.append("supplier_declaration", String(supplierDeclaration));
      await bidsAPI.create(payload);
      setToast({ message: "Your bid has been submitted successfully.", type: "success" });
      setBids((prev) => [...prev, { project: selected, project_id: selected.id }]);
      resetBidForm();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to submit bid";
      setToast({ message: msg, type: "error" });
    }
    finally { setIsConfirmLoading(false); setConfirmSubmit(false); }
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex justify-between"><div className="h-5 w-48 rounded bg-slate-200" /><div className="h-8 w-24 rounded bg-slate-200" /></div>
          <div className="mt-4 grid grid-cols-4 gap-4">{[1, 2, 3, 4].map((j) => <div key={j} className="h-4 rounded bg-slate-100" />)}</div>
        </div>
      ))}
    </div>
  );

  if (fetchError) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="mb-2 text-base font-semibold text-slate-700">Unable to load projects. Please try again.</p>
      <button onClick={loadData} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50">
        <RefreshCw className="h-4 w-4" /> Retry
      </button>
    </div>
  );

  if (!projects.length) {
    return <EmptyState title="No matching procurement opportunities" subtitle="There are currently no available projects that match your registered business type." actionLabel="Update profile" onAction={() => router.push("/supplier/profile")} />;
  }

  const FILTERS = [
    { value: "all", label: "All Projects" },
    { value: "open", label: "Open" },
    { value: "closing_soon", label: "Closing Soon" },
    { value: "submitted", label: "Bid Submitted" },
    { value: "closed", label: "Closed" },
  ];

  const submitButtonLabel = canSubmitBid ? "Submit Bid" : "Complete Required Fields";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Available Projects</h1>
        <p className="mt-1 text-sm text-slate-500">Browse procurement opportunities and submit your bids.</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="sm:max-w-xs" />
        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-300">
            <option value="newest">Newest first</option>
            <option value="deadline">Deadline nearest</option>
            <option value="budget_high">Budget highest</option>
            <option value="budget_low">Budget lowest</option>
          </select>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statusFilter === f.value ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{f.label}</button>
        ))}
      </div>

      {/* Project cards */}
      {filteredProjects.length === 0 ? (
        <EmptyState title="No projects match your filters" subtitle="Try adjusting your search or filter criteria." />
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              supplierBid={bidByProject.get(p.id) || ((p as any).bids?.length > 0 ? (p as any).bids[0] : null)}
              onSubmitBid={() => { setSelected(p); router.replace(`/supplier/projects?project=${p.id}`); }}
              onViewDetails={() => setDetailsProject(p)}
            />
          ))}
        </div>
      )}

      {/* View Details Modal */}
      <ProjectDetailsModal
        project={detailsProject}
        supplierBid={detailsProject ? (bidByProject.get(detailsProject.id) || ((detailsProject as any).bids?.length > 0 ? (detailsProject as any).bids[0] : null)) : null}
        isOpen={Boolean(detailsProject)}
        onClose={() => setDetailsProject(null)}
        onSubmitBid={detailsProject ? () => { setSelected(detailsProject); router.replace(`/supplier/projects?project=${detailsProject.id}`); } : undefined}
      />

      <Modal isOpen={!!selected} onClose={resetBidForm} title="Submit Bid" subtitle={selected?.title} size="xl">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError ? <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">{formError}</p> : null}

          <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Approved Budget</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatPeso(selected?.budget || 0)}</p>
              <p className="mt-1 text-xs text-slate-500">Your offered price must not exceed this approved budget.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submission Status</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{submittedProjectIds.has(selected?.id || "") ? "Submitted" : "Draft"}</p>
              <p className="mt-1 text-xs text-slate-500">Once submitted, the bid cannot be edited or changed.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-900">Bid Details</h4>
              <p className="mt-1 text-xs text-slate-500">Provide a formal offered price and optional remarks.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Offered Price (₱)</label>
                <StrictNumberInput value={bidAmount} onChange={setBidAmount} required min="0" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" helperText="Numbers only. Must be positive and not exceed the approved budget." />
                {exceedsBudget ? <p className="mt-1 text-xs font-medium text-red-600">Offered price cannot exceed {formatPeso(selected?.budget || 0)}.</p> : null}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Additional Remarks (Optional)</label>
                <textarea rows={4} value={additionalRemarks} onChange={(e) => setAdditionalRemarks(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" placeholder="Add warranty details, delivery timeline, product information, or additional remarks." />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Required Bid Documents</h4>
                <p className="mt-1 text-xs text-slate-500">Upload the formal bid documents in PDF or DOCX format.</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Required</span>
            </div>

            <div className="space-y-4">
              <DocumentUploadField
                title="Quotation / Price Proposal"
                description="Upload your official quotation or pricing proposal."
                required
                state={quotationDocument}
                onChange={(file) => updateDocument(setQuotationDocument, file, true)}
                onClear={() => setQuotationDocument(createDocumentState())}
              />
              <DocumentUploadField
                title="Technical Proposal / Specifications"
                description="Upload technical specifications or proposal for the requested procurement."
                required
                state={technicalProposalDocument}
                onChange={(file) => updateDocument(setTechnicalProposalDocument, file, true)}
                onClear={() => setTechnicalProposalDocument(createDocumentState())}
              />
              <DocumentUploadField
                title="Supporting Documents"
                description="Upload additional supporting documents if necessary."
                state={supportingDocuments}
                onChange={(file) => updateDocument(setSupportingDocuments, file, false)}
                onClear={() => setSupportingDocuments(createDocumentState())}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Signature className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Supplier Signature</h4>
                <p className="mt-1 text-xs text-slate-500">Sign to confirm that all submitted bid information is accurate and final.</p>
              </div>
            </div>
            <div className="space-y-3">
              <SignaturePad onSave={(blob, dataUrl) => { setSignatureBlob(blob); setSignaturePreview(dataUrl); setSignatureSaved(true); }} onClear={() => { setSignatureBlob(null); setSignaturePreview(null); setSignatureName(""); setSignatureSaved(false); }} />
              {signaturePreview ? (
                <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <img src={signaturePreview} alt="signature" className="h-14 rounded bg-white p-2 shadow-sm" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-700">Signature saved</p>
                      <p className="text-[11px] text-emerald-700/80">Please enter the signatory printed name.</p>
                    </div>
                  </div>
                  <input placeholder="Printed name" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100" />
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-900">Conflict of Interest Declaration</h4>
              <p className="mt-1 text-xs text-slate-500">Declare whether you have any relationship or conflict involving the procurement committee or school administration.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${conflictOfInterest === "no" ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50/50"}`}>
                <input type="radio" name="conflict" required checked={conflictOfInterest === "no"} onChange={() => setConflictOfInterest("no")} className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-200" />
                <span>
                  <span className="block font-semibold text-slate-900">No Conflict of Interest</span>
                  <span className="block text-xs text-slate-500">I declare that no conflict exists.</span>
                </span>
              </label>
              <label className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${conflictOfInterest === "yes" ? "border-amber-200 bg-amber-50/60" : "border-slate-200 bg-slate-50/50"}`}>
                <input type="radio" name="conflict" checked={conflictOfInterest === "yes"} onChange={() => setConflictOfInterest("yes")} className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-200" />
                <span>
                  <span className="block font-semibold text-slate-900">I Have a Conflict to Declare</span>
                  <span className="block text-xs text-slate-500">Use this option if a conflict exists.</span>
                </span>
              </label>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
            <input type="checkbox" required checked={supplierDeclaration} onChange={(e) => setSupplierDeclaration(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
            <span>
              <span className="block font-semibold">Supplier Declaration</span>
              <span className="block text-xs leading-5 text-slate-500">I confirm that our company is not blacklisted, restricted, or penalized in procurement activities.</span>
            </span>
          </label>

          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Once submitted, your bid cannot be edited or changed. Review all documents carefully before continuing.</p>
          </div>

          <div className="grid gap-3 pt-2 md:grid-cols-2">
            <button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <LoadingButton type="submit" isLoading={false} disabled={!canSubmitBid || isConfirmLoading} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">{submitButtonLabel}</LoadingButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmSubmit} onClose={() => setConfirmSubmit(false)} onConfirm={handleConfirmBid} title="Confirm Bid Submission" message="Once submitted, your bid cannot be edited or changed. Do you want to continue?" confirmLabel="Submit Final Bid" isConfirmLoading={isConfirmLoading} />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
