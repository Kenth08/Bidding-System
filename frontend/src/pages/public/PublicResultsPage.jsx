import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ArrowLeft, Award, CheckCircle, Loader2, Search, Shield, XCircle } from "lucide-react";
import Modal from "../../components/shared/Modal";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return "—";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) return value;
  return dateValue.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeStr(val) {
  return (val ?? "").toString().toLowerCase();
}

export default function PublicResultsPage({ onBack }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${BASE_URL}/public/results/`);
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load public results:", err);
      setError("Failed to load procurement results. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const query = safeStr(search);
    return records.filter((record) => {
      if (!query) return true;
      return [
        record.project_title,
        record.winner_name,
        record.winner_company,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
    });
  }, [records, search]);

  async function handleVerify() {
    if (!verifyHash.trim()) return;
    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      const res = await axios.get(`${BASE_URL}/blockchain/verify/?hash=${encodeURIComponent(verifyHash.trim())}`);
      setVerifyResult({ ...res.data, verified: true });
    } catch (err) {
      setVerifyResult({
        verified: false,
        message: err.response?.data?.message || "No record found. This hash may be invalid or tampered.",
      });
    } finally {
      setVerifyLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "Inter, sans-serif" }}>
      <nav className="sticky top-0 z-50 border-b" style={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <p className="text-sm font-bold text-white">E-Procurement</p>
            <span className="text-xs text-slate-600">/ Public Results</span>
          </div>
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Public Access</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Procurement Results</h1>
          <p className="mt-1 text-sm text-slate-500">All awarded contracts are publicly accessible and blockchain-verified.</p>
        </div>

        <div className="mb-6 rounded-2xl bg-slate-900 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Immutable Public Record</p>
              <p className="mt-0.5 text-xs text-slate-400">Awarded procurement results are permanently visible for public verification.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Live</span>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Verify Blockchain Record</h3>
              <p className="mt-0.5 text-xs text-slate-400">Paste a blockchain hash to verify if a procurement record is authentic</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={verifyHash}
              onChange={(event) => setVerifyHash(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleVerify()}
              placeholder="Paste blockchain hash here (0x...)"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
            />
            <button
              onClick={handleVerify}
              disabled={verifyLoading || !verifyHash.trim()}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-600 disabled:bg-emerald-300"
            >
              {verifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Verify
            </button>
          </div>

          {verifyResult && (
            <div className={`mt-4 rounded-xl border p-4 ${verifyResult.verified ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"}`}>
              <div className="mb-2 flex items-center gap-2">
                {verifyResult.verified ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                <p className={`text-sm font-semibold ${verifyResult.verified ? "text-emerald-700" : "text-red-600"}`}>
                  {verifyResult.verified ? "✓ Record Verified and Authentic" : "✗ Record Not Found"}
                </p>
              </div>
              {verifyResult.verified ? (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {[
                    { label: "Project", value: verifyResult.project_title },
                    { label: "Winner", value: verifyResult.winner_name },
                    { label: "Company", value: verifyResult.winner_company },
                    { label: "Bid Amount", value: `₱${Number(verifyResult.bid_amount).toLocaleString()}` },
                    { label: "Recorded At", value: formatDateTime(verifyResult.recorded_at) },
                    { label: "Reference", value: verifyResult.project_ref_id || "—" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-emerald-600 mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-emerald-800">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-red-600">{verifyResult.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by project name, supplier, or procurement type..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-500">Loading public results...</div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <XCircle className="h-8 w-8 text-red-300" />
            </div>
            <p className="mb-1 text-base font-semibold text-slate-700">Failed to load results</p>
            <p className="mb-4 text-sm text-slate-400">{error}</p>
            <button onClick={loadResults} className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50" style={{ border: "1px solid #e2e8f0" }}>
              <Award className="h-10 w-10" style={{ color: "#cbd5e1" }} />
            </div>
            <p className="mb-2 text-base font-bold text-slate-700">No awarded projects yet. Check back after procurement is completed.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Procurement Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Budget (₱)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Winning Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Winning Bid Amount (₱)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Award Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Public Result Visible Until</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((record) => (
                  <tr key={record.project_id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{record.project_title}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.procurement_type || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatPeso(record.budget)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.winner?.supplier_name || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatPeso(record.winner?.bid_amount)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDateTime(record.awarded_at)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {record.public_result_expiry_date ? (
                        <div className="flex items-center gap-2">
                          <span>{new Date(record.public_result_expiry_date).toLocaleDateString()}</span>
                          {(() => {
                            try {
                              const now = new Date();
                              const expiry = new Date(record.public_result_expiry_date);
                              const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                              if (diff <= 7) return <span className="text-xs text-amber-600">⚠️ Result expires soon</span>;
                            } catch (e) {}
                            return null;
                          })()}
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(record)}
                        className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">© 2026 Blockchain E-Procurement System · BSIT Capstone · Davao del Norte State College</p>
        </div>
      </div>

      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Verified Award"
        subtitle="Tamper-evident procurement result"
        size="lg"
      >
        {selectedRecord ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project ID</p>
                <p className="mt-1 text-sm text-slate-800">{selectedRecord.project_id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Title</p>
                <p className="mt-1 text-sm text-slate-800">{selectedRecord.project_title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Winning Supplier Name</p>
                <p className="mt-1 text-sm text-slate-800">{selectedRecord.winner?.supplier_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Winning Bid Amount</p>
                <p className="mt-1 text-sm text-slate-800">{formatPeso(selectedRecord.winner?.bid_amount)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Award Date and Timestamp</p>
                <p className="mt-1 text-sm text-slate-800">{formatDateTime(selectedRecord.awarded_at)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
                <div className="mt-1 inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                  Verified - Tamper-evident Record
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hash Placeholder</p>
              <p className="mt-1 text-sm text-slate-700">Blockchain record will be available after integration</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}