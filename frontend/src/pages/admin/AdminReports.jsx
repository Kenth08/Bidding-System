import { Download, FolderOpen, Users, Award, FileText } from "lucide-react";
import { useContext, useMemo, useState } from "react";
import LoadingSkeleton from "../../components/shared/LoadingSkeleton";
import StatusBadge from "../../components/shared/StatusBadge";
import { ProcurementContext } from "../../lib/ProcurementContext";
import { normalizeBid, normalizeProject, normalizeSupplier } from "../../lib/procurementStatus";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

export default function AdminReports({ projects = [], suppliers = [], bids = [], blockchainRecords = [] }) {
  const procurement = useContext(ProcurementContext);
  const [activeTab, setActiveTab] = useState("procurement");

  const procurementProjects = useMemo(() => (projects.length ? projects : procurement.projects).map(normalizeProject), [projects, procurement.projects]);
  const procurementSuppliers = useMemo(() => (suppliers.length ? suppliers : procurement.suppliers).map(normalizeSupplier), [suppliers, procurement.suppliers]);
  const procurementBids = useMemo(() => (bids.length ? bids : procurement.bids).map(normalizeBid), [bids, procurement.bids]);
  const procurementRecords = useMemo(() => (blockchainRecords.length ? blockchainRecords : procurement.blockchainRecords), [blockchainRecords, procurement.blockchainRecords]);

  const procReport = useMemo(() => {
    const awardedProjects = procurementProjects.filter((project) => String(project.status).toLowerCase() === "awarded" || project.status === 5);
    const awardedAmount = procurementRecords.reduce((sum, record) => sum + Number(record.winning_bid_amount || record.bidAmount || 0), 0);
    return {
      summary: {
        total_projects: procurementProjects.length,
        active_projects: procurementProjects.filter((project) => String(project.status).toLowerCase() === "active" || project.status === 3).length,
        awarded_projects: awardedProjects.length,
        total_bids: procurementBids.length,
        total_awarded_amount: awardedAmount,
      },
      by_procurement_type: Object.entries(procurementProjects.reduce((acc, project) => {
        const type = project.category || project.procurement_method || "General";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})).map(([procurement_type, count]) => ({ procurement_type, count })),
      recent_awards: procurementRecords.slice(0, 5).map((record) => ({
        project__title: record.projectTitle || record.project_title,
        winner__full_name: record.winner_name || record.winner,
        winner__company_name: record.winner_company || record.winner,
        bid_amount: Number(record.winning_bid_amount || record.bidAmount || 0),
        recorded_at: record.recordedAt || record.recorded_at,
      })),
    };
  }, [procurementBids.length, procurementProjects, procurementRecords]);

  const suppReport = useMemo(() => ({
    summary: {
      total_suppliers: procurementSuppliers.length,
      approved: procurementSuppliers.filter((supplier) => supplier.status === "Verified" || supplier.isVerified).length,
      pending: procurementSuppliers.filter((supplier) => supplier.status === "Pending" || !supplier.isVerified).length,
      rejected: procurementSuppliers.filter((supplier) => supplier.status === "Rejected").length,
    },
    supplier_list: procurementSuppliers.map((supplier) => ({
      ...supplier,
      bid_count: procurementBids.filter((bid) => bid.supplierId === supplier.id).length,
      wins: procurementRecords.filter((record) => record.winner_company === supplier.company_name || record.winner_name === supplier.full_name).length,
    })),
  }), [procurementBids, procurementSuppliers, procurementRecords]);

  if (!procReport && !suppReport) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Reports</h1>
            <p className="text-sm text-slate-500 mt-0.5">Procurement and supplier summary reports</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <LoadingSkeleton rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Procurement and supplier summary reports</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <Download className="h-4 w-4" /> Export / Print
        </button>
      </div>

      <div className="flex gap-1 border-b border-slate-100">
        {[
          { key: "procurement", label: "Procurement Report", icon: FolderOpen },
          { key: "suppliers", label: "Supplier Report", icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === key
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === "procurement" && procReport ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              { label: "Total Projects", value: procReport.summary.total_projects },
              { label: "Active Projects", value: procReport.summary.active_projects },
              { label: "Awarded Projects", value: procReport.summary.awarded_projects },
              { label: "Total Bids", value: procReport.summary.total_bids },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">Total Awarded Amount</p>
            <p className="text-3xl font-bold text-emerald-700">{formatPeso(procReport.summary.total_awarded_amount)}</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-sm font-semibold text-slate-800">Projects by Procurement Type</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {procReport.by_procurement_type.map(({ procurement_type, count }) => (
                <div key={procurement_type} className="flex items-center justify-between px-6 py-3">
                  <span className="text-sm text-slate-700">{procurement_type}</span>
                  <span className="text-sm font-semibold text-slate-900">{count} projects</span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-sm font-semibold text-slate-800">Recent Awarded Contracts</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['Project', 'Winner', 'Company', 'Amount', 'Date'].map((heading) => (
                    <th key={heading} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {procReport.recent_awards.map((award, index) => (
                  <tr key={index} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-sm text-slate-700">{award.project__title}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{award.winner__full_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{award.winner__company_name}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatPeso(award.bid_amount)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(award.recorded_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : suppReport ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              { label: "Total Suppliers", value: suppReport.summary.total_suppliers },
              { label: "Approved", value: suppReport.summary.approved },
              { label: "Pending", value: suppReport.summary.pending },
              { label: "Rejected", value: suppReport.summary.rejected },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-sm font-semibold text-slate-800">All Suppliers</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {['Supplier', 'Company', 'Business Type', 'Status', 'Bids', 'Wins'].map((heading) => (
                    <th key={heading} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {suppReport.supplier_list.map((supplier) => (
                  <tr key={supplier.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">{supplier.full_name}</p>
                      <p className="text-xs text-slate-400">{supplier.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{supplier.company_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{supplier.business_type || '-'}</td>
                    <td className="px-6 py-4"><StatusBadge status={supplier.status} /></td>
                    <td className="px-6 py-4 text-sm text-slate-700">{supplier.bid_count}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{supplier.wins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
