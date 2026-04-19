// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\public\PublicResultsPage.jsx
import { ArrowLeft, Eye, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import SearchBar from "../../components/shared/SearchBar";

function shortHash(hash) {
  if (!hash) {
    return "N/A";
  }

  if (hash.length <= 20) {
    return hash;
  }

  return `${hash.slice(0, 18)}...`;
}

export default function PublicResultsPage({ records = [], onBack }) {
  const [search, setSearch] = useState("");

  const normalizedResults = useMemo(
    () =>
      records.map((item) => ({
        id: item.id,
        projectName: item.projectName || item.projectId || "Untitled Project",
        winner: item.winner || "Not available",
        bidAmount: item.bidAmount || "N/A",
        awardDate: item.awardDate || item.timestamp || "N/A",
        hash: item.hash || "",
      })),
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
        item.bidAmount.toLowerCase().includes(query) ||
        item.hash.toLowerCase().includes(query)
    );
  }, [normalizedResults, search]);

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
          <p className="mt-1 text-sm text-slate-500">
            All awarded contracts and blockchain-verified outcomes. No login required.
          </p>
        </div>

        <div className="mb-6 flex items-center gap-4 rounded-2xl bg-slate-900 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Immutable Blockchain Ledger</p>
            <p className="mt-0.5 text-xs text-slate-400">
              All results permanently stored · Cannot be altered · Publicly verifiable
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Live</span>
          </div>
        </div>

        <SearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search project, winner, amount, or blockchain hash"
          className="w-full"
        />

        {filteredResults.length ? (
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {filteredResults.map((record) => (
              <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Project</p>
                    <h2 className="text-base font-bold text-slate-900">{record.projectName}</h2>
                  </div>
                  <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Recorded
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-1 text-xs text-slate-500">Winner</p>
                    <p className="text-sm font-semibold text-slate-900">{record.winner}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-1 text-xs text-slate-500">Bid Amount</p>
                    <p className="text-sm font-semibold text-slate-900">{record.bidAmount}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-1 text-xs text-slate-500">Award Date</p>
                    <p className="text-sm font-semibold text-slate-900">{record.awardDate}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="mb-1 text-xs text-slate-500">Blockchain Hash</p>
                    <p className="break-all font-mono text-xs text-emerald-600" title={record.hash}>
                      {shortHash(record.hash)}
                    </p>
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
      </div>
    </div>
  );
}
