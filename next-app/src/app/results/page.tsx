"use client";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ArrowLeft, Award, CheckCircle, ExternalLink, Loader2, Search, Shield, XCircle } from "lucide-react";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useRouter } from "next/navigation";

function formatPeso(value: unknown) { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(value || 0)); }
function formatDate(value: unknown) { if (!value) return "—"; const d = new Date(value as string); if (isNaN(d.getTime())) return String(value); return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }); }
function safeStr(val: unknown) { return (val ?? "").toString().toLowerCase(); }

interface ResultRecord { project_id: string; project_title: string; procurement_type?: string; budget: number; awarded_at?: string; verificationHash?: string | null; winner?: { supplier_name: string; bid_amount: number; submitted_at?: string }; }
interface OpenProject { id: string; title: string; procurement_type?: string; budget: number; deadline?: string; }
interface VerifyResult { verified: boolean; message?: string; project_title?: string; winner_name?: string; winner_company?: string; bid_amount?: number; recorded_at?: string; project_ref_id?: string; }

export default function PublicResultsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<ResultRecord[]>([]);
  const [openProjects, setOpenProjects] = useState<OpenProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [hasBlockchainRecords, setHasBlockchainRecords] = useState(false);

  useEffect(() => { loadResults(); }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get('/api/blockchain/public');
        if (mounted) setHasBlockchainRecords(Array.isArray(res.data) && res.data.length > 0);
      } catch { if (mounted) setHasBlockchainRecords(false); }
    })();
    return () => { mounted = false; };
  }, []);

  async function loadResults() {
    setLoading(true); setError(null);
    try {
      const [resResults, resOpen] = await Promise.all([
        axios.get("/api/public/results"),
        axios.get("/api/public/projects?section=open"),
      ]);
      setRecords(Array.isArray(resResults.data) ? resResults.data : []);
      setOpenProjects(Array.isArray(resOpen.data) ? resOpen.data : []);
    } catch { setError("Failed to load procurement results. Please try again."); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    const q = safeStr(search);
    return records.filter((r) => !q || [r.project_title, r.winner?.supplier_name].some((v) => safeStr(v).includes(q)));
  }, [records, search]);

  const filteredOpen = useMemo(() => {
    const q = safeStr(search);
    return openProjects.filter((p) => !q || safeStr(p.title).includes(q));
  }, [openProjects, search]);

  async function handleVerify() {
    if (!verifyHash.trim()) return;
    setVerifyLoading(true); setVerifyResult(null);
    try { const res = await axios.get(`/api/blockchain/verify?hash=${encodeURIComponent(verifyHash.trim())}`); setVerifyResult({ ...res.data, verified: true }); }
    catch (err: unknown) { setVerifyResult({ verified: false, message: (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "No record found. This hash may be invalid or tampered." }); }
    finally { setVerifyLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 border-b bg-[#0f172a] border-[#1e293b]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500"><Shield className="h-3.5 w-3.5 text-white" /></div><p className="text-sm font-bold text-white">E-Procurement</p><span className="text-xs text-slate-500">/ Public Results</span></div>
          <button onClick={() => router.push("/")} className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to Home</button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Public Access</span>
          <h1 className="text-2xl font-bold text-slate-900">Procurement Results</h1>
          <p className="mt-1 text-sm text-slate-500">Awarded procurement results are permanently visible for public verification.</p>
        </div>

        {/* Verification Section */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5">
          <div className="mb-4 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50"><Shield className="h-5 w-5 text-emerald-500" /></div><div><h3 className="text-sm font-semibold text-slate-800">Verify Award Record</h3><p className="mt-0.5 text-xs text-slate-400">Paste a record hash to verify if a procurement result is authentic</p></div></div>
          {hasBlockchainRecords ? (
            <div className="flex gap-3">
              <input type="text" value={verifyHash} onChange={(e) => setVerifyHash(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleVerify()} placeholder="Paste record hash here" className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20" />
              <button onClick={handleVerify} disabled={verifyLoading || !verifyHash.trim()} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-600 disabled:bg-emerald-300">{verifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Verify</button>
            </div>
          ) : (
            <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm text-slate-500">No blockchain verification records available yet.</div>
          )}
          {verifyResult && (
            <div className={`mt-4 rounded-xl border p-4 ${verifyResult.verified ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"}`}>
              <div className="mb-2 flex items-center gap-2">{verifyResult.verified ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}<p className={`text-sm font-semibold ${verifyResult.verified ? "text-emerald-700" : "text-red-600"}`}>{verifyResult.verified ? "✓ Record Verified" : "✗ Record Not Found"}</p></div>
              {verifyResult.verified ? (
                <div className="grid grid-cols-2 gap-3 mt-3 sm:grid-cols-3">{[{ label: "Project", value: verifyResult.project_title }, { label: "Winner", value: verifyResult.winner_company || verifyResult.winner_name }, { label: "Bid Amount", value: `₱${Number(verifyResult.bid_amount || 0).toLocaleString()}` }, { label: "Recorded At", value: formatDate(verifyResult.recorded_at) }, { label: "Reference", value: verifyResult.project_ref_id || "—" }].map(({ label, value }) => (<div key={label}><p className="text-xs text-emerald-600 mb-0.5">{label}</p><p className="text-sm font-semibold text-emerald-800">{value}</p></div>))}</div>
              ) : <p className="text-sm text-red-600">{verifyResult.message}</p>}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6"><Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by project name or supplier..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20" /></div>

        {/* Loading */}
        {loading && <div className="rounded-2xl border border-slate-100 bg-white p-6"><SkeletonTable rows={5} cols={4} /></div>}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50"><XCircle className="h-8 w-8 text-red-300" /></div>
            <p className="mb-1 text-base font-semibold text-slate-700">Failed to load results</p>
            <p className="mb-4 text-sm text-slate-400">{error}</p>
            <button onClick={loadResults} className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50">Try again</button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Open Bidding Section */}
            {filteredOpen.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-slate-800 mb-3">Available Procurement Opportunities</h2>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-100 bg-slate-50/50">{["Project Title", "Type", "Budget (₱)", "Deadline", "Status"].map((h) => <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredOpen.map((p) => (
                        <tr key={p.id} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-6 py-4 text-sm font-medium text-slate-800">{p.title}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{p.procurement_type || "—"}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{formatPeso(p.budget)}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{formatDate(p.deadline)}</td>
                          <td className="px-6 py-4"><span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-600">Open</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Awarded Results Section */}
            {filtered.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-slate-800 mb-3">Awarded Projects</h2>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-100 bg-slate-50/50">{["Project Title", "Type", "Budget (₱)", "Winning Supplier", "Winning Bid (₱)", "Award Date", ""].map((h, i) => <th key={i} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {filtered.map((r) => (
                        <tr key={r.project_id} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-slate-800">{r.project_title}</p>
                            {r.verificationHash && (
                              <a
                                href={`https://sepolia.basescan.org/tx/${r.verificationHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 hover:text-emerald-700 hover:underline"
                                title="View on Basescan"
                              >
                                🔗 {r.verificationHash.slice(0, 16)}…
                              </a>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600">{r.procurement_type || "—"}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{formatPeso(r.budget)}</td>
                          <td className="px-5 py-4 text-sm font-medium text-slate-700">{r.winner?.supplier_name || "—"}</td>
                          <td className="px-5 py-4 text-sm text-emerald-600 font-semibold">{formatPeso(r.winner?.bid_amount)}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{formatDate(r.awarded_at)}</td>
                          <td className="px-5 py-4">
                            <button onClick={() => router.push(`/results/${r.project_id}`)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50">
                              View <ExternalLink className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty state */}
            {filtered.length === 0 && filteredOpen.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200"><Award className="h-10 w-10 text-slate-300" /></div>
                <p className="mb-2 text-base font-bold text-slate-700">No awarded procurement results yet.</p>
                <p className="text-sm text-slate-400">Check back later for published results.</p>
              </div>
            )}
          </>
        )}

        <div className="mt-10 pt-6 border-t border-slate-100 text-center"><p className="text-xs text-slate-400">&copy; 2026 E-Procurement System. All rights reserved.</p></div>
      </div>
    </div>
  );
}
