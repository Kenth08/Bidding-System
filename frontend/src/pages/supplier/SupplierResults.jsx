// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\supplier\SupplierResults.jsx
import { Shield } from "lucide-react";
import EmptyState from "../../components/shared/EmptyState";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

export default function SupplierResults({ supplierResults }) {
  if (!supplierResults.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100">
        <EmptyState title="No results yet" subtitle="Results will appear after project awards are published." />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Results</h1>
          <p className="text-sm text-slate-500 mt-0.5">Blockchain-verified outcomes</p>
        </div>
      </div>
      <div className="mb-5 rounded-2xl bg-slate-900 text-white p-4 flex items-center gap-3">
        <Shield className="h-5 w-5 text-emerald-400" />
        <p className="text-sm">Results are blockchain-verified and cannot be altered</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {supplierResults.map((result) => (
          <div
            key={result.id}
            className={`rounded-2xl border p-4 ${
              result.isWinner ? "border-emerald-200 bg-emerald-50/60" : "border-slate-100 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-800">{result.projectTitle || result.projectName}</h3>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-md ${
                  result.isWinner ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {result.isWinner ? "You Won" : "Not Selected"}
              </span>
            </div>
            <div className="mt-3 text-sm text-slate-600 space-y-1">
              <p>Winner: {result.winner}</p>
              <p>Bid Amount: {formatPeso(result.bidAmount)}</p>
              <p>Award Date: {result.awardDate}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 mt-3 border border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-600">Blockchain Verified</span>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                  Verified ✓
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Result permanently recorded. Cannot be altered.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
