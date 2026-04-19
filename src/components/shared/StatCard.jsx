// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\StatCard.jsx
// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\StatCard.jsx
import { BarChart3 } from "lucide-react";

export default function StatCard({ title, value, icon: Icon, accentLine = false }) {
  const ResolvedIcon = Icon || BarChart3;

  return (
    <article className={`relative overflow-hidden rounded-2xl bg-white p-5 ${accentLine ? "border border-emerald-100" : "border border-slate-100 hover:border-slate-200"}`}>
      {accentLine ? <div className="absolute left-0 right-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-emerald-400 to-emerald-300" /> : null}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
          <ResolvedIcon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 border-t border-slate-50 pt-3">
        <p className="text-xs text-slate-400">Updated just now</p>
      </div>
    </article>
  );
}
