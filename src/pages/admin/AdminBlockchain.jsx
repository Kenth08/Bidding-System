// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\admin\AdminBlockchain.jsx
import { Copy, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import SectionHeader from "../../components/shared/SectionHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import TableWrapper from "../../components/shared/TableWrapper";
import Toast from "../../components/shared/Toast";

function truncate(text, max = 20) {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}...`;
}

export default function AdminBlockchain({ blockchainRecords, copyToast, setCopyToast }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  async function handleCopyHash(hash) {
    try {
      await navigator.clipboard.writeText(hash);
      setCopyToast("Hash copied to clipboard");
      setTimeout(() => setCopyToast(""), 1800);
    } catch {
      setCopyToast("Unable to copy hash");
      setTimeout(() => setCopyToast(""), 1800);
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Blockchain Records" subtitle="Immutable logs for awarded contracts" />

      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-slate-900 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Immutable Blockchain Ledger</p>
          <p className="mt-0.5 text-xs text-slate-400">All procurement results are permanently stored and cannot be altered</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">Live</span>
        </div>
      </div>

      <TableWrapper>
        {isLoading ? (
          <LoadingSkeleton rows={5} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Winner Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Awarded Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Recorded At</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Transaction Hash</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {blockchainRecords.length ? (
                  blockchainRecords.map((record) => (
                    <tr key={record.id} className="transition-colors duration-100 hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{record.projectId}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{record.winner}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{record.bidAmount}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{record.timestamp}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="block max-w-[160px] truncate rounded-lg border border-slate-100 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-400">
                            {truncate(record.hash, 22)}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyHash(record.hash)}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500"
                            title={record.hash}
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status="Recorded" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableWrapper>

      <Toast message={copyToast} isVisible={Boolean(copyToast)} />
    </div>
  );
}
