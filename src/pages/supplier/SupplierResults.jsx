// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\supplier\SupplierResults.jsx
import { useEffect, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import SectionHeader from "../../components/shared/SectionHeader";
import StatusBadge from "../../components/shared/StatusBadge";
import TableWrapper from "../../components/shared/TableWrapper";

export default function SupplierResults({ supplierResults }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-5">
      <SectionHeader title="Contract Results" subtitle="View awarded and closed project outcomes" />

      <TableWrapper>
        {isLoading ? (
          <LoadingSkeleton rows={4} cols={4} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Awarded Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Result Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
              {supplierResults.length ? (
                supplierResults.map((result) => (
                  <tr key={result.id} className="transition-colors duration-100 hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{result.projectName}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{result.bidAmount}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{result.awardDate}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={result.won ? "Won" : "Not Awarded"} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
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
