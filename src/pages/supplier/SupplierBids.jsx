// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\supplier\SupplierBids.jsx
import { useEffect, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import SectionHeader from "../../components/shared/SectionHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import TableWrapper from "../../components/shared/TableWrapper";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function truncate(text, max = 75) {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}...`;
}

export default function SupplierBids({ supplierBids }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-5">
      <SectionHeader title="My Bids" subtitle="Monitor your submitted bids and current status" />

      <TableWrapper>
        {isLoading ? (
          <LoadingSkeleton rows={5} cols={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Bid Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Proposal</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Submitted At</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
              {supplierBids.length ? (
                supplierBids.map((bid) => (
                  <tr key={bid.id} className="transition-colors duration-100 hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{bid.projectName}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatCurrency(bid.bidAmount)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500" title={bid.proposal}>
                      {truncate(bid.proposal)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{bid.submittedAt}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={bid.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        )}
      </TableWrapper>
    </div>
  );
}
