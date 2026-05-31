"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Award, CheckCircle, Clock, Loader2, Shield, XCircle, ExternalLink } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

function formatPeso(value: unknown) { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(value || 0)); }
function formatDate(value: unknown) { if (!value) return "—"; const d = new Date(value as string); if (isNaN(d.getTime())) return String(value); return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }); }
function formatDateTime(value: unknown) { if (!value) return "—"; const d = new Date(value as string); if (isNaN(d.getTime())) return String(value); return d.toLocaleString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }

interface ResultDetail {
  project_id: string;
  project_title: string;
  description?: string;
  procurement_type?: string;
  budget: number;
  deadline?: string;
  awarded_at?: string;
  status: string;
  winner: { supplier_name: string; bid_amount: number; submitted_at?: string };
  verificationHash?: string | null;
  timeline?: { action: string; description: string; created_at: string }[];
}

export default function ResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const [data, setData] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true); setError(null);
    axios.get(`/api/public/results/${projectId}`)
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load result details."))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <XCircle className="h-12 w-12 text-red-300 mb-4" />
      <p className="text-base font-semibold text-slate-700 mb-2">{error || "Result not found"}</p>
      <button onClick={() => router.push("/results")} className="text-sm text-emerald-600 hover:underline">← Back to Results</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 border-b bg-[#0f172a] border-[#1e293b]">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <div className="flex items-center gap-3"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500"><Shield className="h-3.5 w-3.5 text-white" /></div><p className="text-sm font-bold text-white">E-Procurement</p><span className="text-xs text-slate-500">/ Result Details</span></div>
          <button onClick={() => router.push("/results")} className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to Results</button>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Header */}
        <div className="mb-6">
          <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-600 mb-2"><Award className="h-3 w-3 mr-1" />Awarded</span>
          <h1 className="text-2xl font-bold text-slate-900">{data.project_title}</h1>
          {data.description && <p className="mt-2 text-sm text-slate-600">{data.description}</p>}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl border border-slate-100 bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Project Information</h3>
            <dl className="space-y-3">
              <div><dt className="text-xs text-slate-500">Type</dt><dd className="text-sm font-medium text-slate-800">{data.procurement_type || "—"}</dd></div>
              <div><dt className="text-xs text-slate-500">Approved Budget</dt><dd className="text-sm font-medium text-slate-800">{formatPeso(data.budget)}</dd></div>
              <div><dt className="text-xs text-slate-500">Deadline</dt><dd className="text-sm font-medium text-slate-800">{formatDate(data.deadline)}</dd></div>
              <div><dt className="text-xs text-slate-500">Award Date</dt><dd className="text-sm font-medium text-slate-800">{formatDate(data.awarded_at)}</dd></div>
            </dl>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-3">Winning Bid</h3>
            <dl className="space-y-3">
              <div><dt className="text-xs text-emerald-600">Winning Supplier</dt><dd className="text-sm font-bold text-emerald-800">{data.winner.supplier_name}</dd></div>
              <div><dt className="text-xs text-emerald-600">Winning Bid Amount</dt><dd className="text-lg font-bold text-emerald-700">{formatPeso(data.winner.bid_amount)}</dd></div>
              <div><dt className="text-xs text-emerald-600">Bid Submitted</dt><dd className="text-sm font-medium text-emerald-800">{formatDateTime(data.winner.submitted_at)}</dd></div>
            </dl>
          </div>
        </div>

        {/* Verification Hash */}
        {data.verificationHash && (
          <div className="mb-8 rounded-xl border border-slate-100 bg-white p-5">
            <div className="flex items-center gap-2 mb-2"><CheckCircle className="h-4 w-4 text-emerald-500" /><h3 className="text-sm font-semibold text-slate-800">Verification Record</h3></div>
            <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-lg p-3">
              <span className="font-mono text-xs text-slate-600 break-all select-all pr-2">
                {data.verificationHash}
              </span>
              <a
                href={`https://sepolia.basescan.org/tx/${data.verificationHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 shrink-0 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50 active:bg-slate-100"
                title="View on Basescan"
              >
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                <span>View on Basescan</span>
              </a>
            </div>
          </div>
        )}

        {/* Audit Timeline */}
        {data.timeline && data.timeline.length > 0 && (
          <div className="rounded-xl border border-slate-100 bg-white p-5">
            <div className="flex items-center gap-2 mb-4"><Clock className="h-4 w-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-800">Public Audit Timeline</h3></div>
            <div className="space-y-3">
              {data.timeline.map((entry, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{entry.action.replace(/_/g, " ")}</p>
                    {entry.description && <p className="text-xs text-slate-500">{entry.description}</p>}
                    <p className="text-xs text-slate-400">{formatDateTime(entry.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-slate-100 text-center"><p className="text-xs text-slate-400">&copy; 2026 E-Procurement System. All rights reserved.</p></div>
      </div>
    </div>
  );
}
