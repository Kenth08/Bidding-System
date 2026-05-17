import { Shield } from "lucide-react";
import { useMemo } from "react";
import EmptyState from "../../components/shared/EmptyState";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
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

export default function SupplierResults({ supplierResults = [], supplierBids = [] }) {
  const results = useMemo(() => {
    const bids = supplierBids.length ? supplierBids : supplierResults;
    return bids.map((bid) => ({
      id: bid.id,
      projectTitle: bid.projectTitle || bid.projectName,
      projectId: bid.projectId || bid.project,
      winnerName: bid.awardedWinnerName || bid.winner_name || bid.winner || "Not selected yet",
      winnerCompany: bid.awardedWinnerCompany || bid.winner_company || "Not selected yet",
      bidAmount: bid.bidAmount || bid.bid_amount,
      submittedAt: bid.submittedAt || bid.submitted_at,
      status: String(bid.status || "").toLowerCase(),
      isWinner: String(bid.status || "").toLowerCase() === "won",
    }));
  }, [supplierBids, supplierResults]);

  if (!results.length) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white">
        <EmptyState title="No results yet" subtitle="Results will appear after project awards are published." />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Results</h1>
          <p className="mt-0.5 text-sm text-slate-500">See who won each project you submitted bids for</p>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-2xl bg-slate-900 p-4 text-white">
        <Shield className="h-5 w-5 text-emerald-400" />
        <p className="text-sm">Results are blockchain-verified and cannot be altered</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {results.map((result) => (
          <div
            key={result.id}
            className={`rounded-2xl border p-4 ${result.isWinner ? "border-emerald-200 bg-emerald-50/60" : "border-slate-100 bg-white"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-800">{result.projectTitle || result.projectName}</h3>
              <span
                className={`rounded-md px-2 py-1 text-xs font-semibold ${result.isWinner ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
              >
                {result.isWinner ? "Won" : "Lost"}
              </span>
            </div>

            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p>Winner: {result.winnerName}</p>
              <p>Company: {result.winnerCompany || "—"}</p>
              <p>Your Bid Amount: {formatPeso(result.bidAmount)}</p>
              <p>Submitted At: {formatDateTime(result.submittedAt)}</p>
            </div>

            <div className={`mt-3 rounded-xl border p-3 ${result.isWinner ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"}`}>
              <p className={`text-sm font-semibold ${result.isWinner ? "text-emerald-700" : "text-red-600"}`}>
                {result.isWinner
                  ? "Congratulations! Your bid was selected as the winning bid."
                  : "Thank you for participating. Another supplier was selected for this project."}
              </p>
            </div>

            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-600">Blockchain Verified</span>
                </div>
                <span className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                  Verified ✓
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Result permanently recorded. Cannot be altered.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}