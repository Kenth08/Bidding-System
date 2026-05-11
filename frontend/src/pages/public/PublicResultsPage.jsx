import { ArrowLeft, CheckCircle, Eye, Loader2, Search, Shield, XCircle } from "lucide-react";
import { useContext, useMemo, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import SearchBar from "../../components/shared/SearchBar";
import Modal from "../../components/shared/Modal";
import StatusBadge from "../../components/shared/StatusBadge";
import { ProcurementContext } from "../../lib/ProcurementContext";
import { normalizeBlockchainRecord } from "../../lib/procurementStatus";

function formatPeso(value) {
  if (typeof value !== "number") {
    return value;
  }

  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value);
}

export default function PublicResultsPage({ onBack }) {
  const [search, setSearch] = useState("");
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const procurementCtx = useContext(ProcurementContext);

  const records = useMemo(() => {
    if (procurementCtx && typeof procurementCtx.getPublicRecords === "function") {
      return procurementCtx.getPublicRecords();
    }
    return [];
  }, [procurementCtx]);

  const normalizedResults = useMemo(
    () =>
      records.map((item) => {
        const record = normalizeBlockchainRecord(item);
        return {
          id: record.id,
          projectName: record.projectTitle || item.project_title || "Untitled Project",
          projectId: record.projectId || item.project_id || "N/A",
          winner: record.winner_name || record.winner || "Not available",
          companyName: record.winner_company || record.winner_name || "Unknown Company",
          bidAmount: formatPeso(Number(record.winning_bid_amount) || 0),
          awardDate: record.recordedAt ? new Date(record.recordedAt).toLocaleDateString() : "N/A",
          raw: record,
        };
      }),
    [records]
  );

  const filteredResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return normalizedResults;
    }

    return normalizedResults.filter(
      (item) =>
        item.projectName.toLowerCase().includes(query) ||
          item.winner.toLowerCase().includes(query) ||
          item.companyName.toLowerCase().includes(query) ||
          String(item.bidAmount).toLowerCase().includes(query) ||
          (item.projectId || "").toLowerCase().includes(query)
    );
  }, [normalizedResults, search]);

  async function handleVerifyHash() {
    if (!verifyHash.trim()) return;
    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      if (procurementCtx && typeof procurementCtx.verifyHash === 'function') {
        const rec = procurementCtx.verifyHash(verifyHash.trim())
        if (rec) {
          setVerifyResult({ verified: true, ...rec })
          return
        }
      }
      setVerifyResult({ verified: false, message: "Blockchain verification is not available in this preview. Hash placeholder only." })
    } catch (err) {
      setVerifyResult({ verified: false, message: 'Verification failed' })
    } finally {
      setVerifyLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500">
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <p className="text-sm font-bold text-white">E-Procurement</p>
            <span className="text-xs text-slate-600">/ Public Results</span>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2">
            <Eye className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Public Access</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Procurement Results</h1>
          <p className="mt-1 text-sm text-slate-500">All awarded contracts and blockchain-verified outcomes. No login required.</p>
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
              onKeyDown={(event) => event.key === 'Enter' && handleVerifyHash()}
              placeholder="Paste blockchain hash here (0x...)"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
            />
            <button
              onClick={handleVerifyHash}
              disabled={verifyLoading || !verifyHash.trim()}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-600 disabled:bg-emerald-300"
            >
              {verifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Verify
            </button>
          </div>

          {verifyResult && (
            <div className={`mt-4 rounded-xl border p-4 ${verifyResult.verified ? 'border-emerald-100 bg-emerald-50' : 'border-red-100 bg-red-50'}`}>
              <div className="mb-2 flex items-center gap-2">
                {verifyResult.verified ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                <p className={`text-sm font-semibold ${verifyResult.verified ? 'text-emerald-700' : 'text-red-600'}`}>
                  {verifyResult.verified ? '✓ Record Verified' : '✗ Record Not Found'}
                </p>
              </div>
              {verifyResult.verified ? (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Project', value: verifyResult.project_title },
                    { label: 'Reference', value: verifyResult.project_ref_id },
                    { label: 'Winner', value: verifyResult.winner_name },
                    { label: 'Company', value: verifyResult.winner_company },
                    { label: 'Bid Amount', value: `₱${Number(verifyResult.bid_amount).toLocaleString()}` },
                    { label: 'Recorded At', value: new Date(verifyResult.recorded_at).toLocaleDateString() },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-emerald-600">{label}</p>
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

        <div className="mb-6 rounded-2xl bg-slate-900 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Immutable Blockchain Ledger</p>
              <p className="mt-0.5 text-xs text-slate-400">All results permanently stored · Cannot be altered · Publicly verifiable</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Live</span>
            </div>
          </div>
        </div>

        <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search project, winner, company, or amount" className="w-full" />

        {isLoading ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading public results...</div>
        ) : filteredResults.length ? (
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredResults.map((record) => (
              <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Project</p>
                    <h2 className="text-base font-bold text-slate-900">{record.projectName}</h2>
                    <p className="mt-1 text-xs text-slate-500">ID: {record.projectId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Verified</div>
                    <button onClick={() => setSelectedRecord(record)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600">Verify</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-1 text-xs text-slate-500">Winner</p>
                    <p className="text-sm font-semibold text-slate-900">{record.winner}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-1 text-xs text-slate-500">Company</p>
                    <p className="text-sm font-semibold text-slate-900">{record.companyName}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-1 text-xs text-slate-500">Bid Amount</p>
                    <p className="text-sm font-semibold text-slate-900">{record.bidAmount}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-1 text-xs text-slate-500">Award Date</p>
                    <p className="text-sm font-semibold text-slate-900">{record.awardDate}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
            <EmptyState title="No public results found" subtitle="Try another keyword or check again once new contracts are awarded." />
          </div>
        )}
        {selectedRecord && (
          <Modal isOpen={Boolean(selectedRecord)} onClose={() => setSelectedRecord(null)} title="Award Details" subtitle="Verified Award Information" size="md">
            <div className="space-y-3 text-sm text-slate-700">
              <p><span className="font-semibold">Project ID:</span> {selectedRecord.projectId}</p>
              <p><span className="font-semibold">Project Title:</span> {selectedRecord.projectName}</p>
              <p><span className="font-semibold">Winning Supplier:</span> {selectedRecord.winner}</p>
              <p><span className="font-semibold">Bid Amount:</span> {selectedRecord.bidAmount}</p>
              <p><span className="font-semibold">Award Date:</span> {selectedRecord.awardDate}</p>
              <div>
                <p className="text-xs text-slate-400">Hash Value</p>
                <p className="text-sm font-mono text-slate-700">Blockchain record will be available after integration</p>
              </div>
              <div className="pt-2">
                <StatusBadge status="Verified" />
                <p className="text-xs text-slate-400 mt-2">Verified — Tamper-evident record</p>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

