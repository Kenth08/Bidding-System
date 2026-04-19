// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\supplier\SupplierResults.jsx
import { Copy, Shield } from "lucide-react";
import { useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import Toast from "../../components/shared/Toast";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

export default function SupplierResults({ supplierResults }) {
  const [toast, setToast] = useState(null);

  async function copyHash(hash) {
    await navigator.clipboard.writeText(hash);
    setToast({ message: "Hash copied!", type: "success" });
  }

  if (!supplierResults.length) {
    return <div className="bg-white rounded-2xl border border-slate-100"><EmptyState title="No results yet" subtitle="Results will appear after project awards are published." /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-lg font-bold text-slate-900">Results</h1><p className="text-sm text-slate-500 mt-0.5">Blockchain-verified outcomes</p></div></div>
      <div className="mb-5 rounded-2xl bg-slate-900 text-white p-4 flex items-center gap-3"><Shield className="h-5 w-5 text-emerald-400" /><p className="text-sm">Results are blockchain-verified and cannot be altered</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {supplierResults.map((result) => (
          <div key={result.id} className={`rounded-2xl border p-4 ${result.isWinner ? "border-emerald-200 bg-emerald-50/60" : "border-slate-100 bg-white"}`}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-800">{result.projectTitle || result.projectName}</h3>
              <span className={`text-xs font-semibold px-2 py-1 rounded-md ${result.isWinner ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{result.isWinner ? "You Won" : "Not Selected"}</span>
            </div>
            <div className="mt-3 text-sm text-slate-600">
              <p>Winner: {result.winner}</p>
              <p>Bid Amount: {formatPeso(result.bidAmount)}</p>
              <p>Award Date: {result.awardDate}</p>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between gap-2">
              <code className="text-xs text-slate-500 truncate">{result.hash.slice(0, 26)}...</code>
              <div className="flex items-center gap-2"><button onClick={() => copyHash(result.hash)} className="p-1.5 rounded-md hover:bg-white text-slate-500"><Copy className="h-4 w-4" /></button><span className="text-xs text-emerald-600 font-semibold">Verified</span></div>
            </div>
          </div>
        ))}
      </div>
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
