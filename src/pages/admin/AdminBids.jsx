// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\admin\AdminBids.jsx
import { Shield } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EmptyState from "../../components/shared/EmptyState";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

export default function AdminBids({ bids, setBids, onRecordToBlockchain }) {
  const [expandedBid, setExpandedBid] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showWinnerConfirm, setShowWinnerConfirm] = useState(false);
  const [selectingBid, setSelectingBid] = useState(null);
  const [showBlockchainConfirm, setShowBlockchainConfirm] = useState(false);
  const [recordingBid, setRecordingBid] = useState(null);
  const [toast, setToast] = useState(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bids.filter((bid) => {
      const statusMatch = filter === "All" || bid.status === filter;
      const text = `${bid.supplierName} ${bid.projectTitle || bid.projectName}`.toLowerCase();
      return statusMatch && (!query || text.includes(query));
    });
  }, [bids, filter, search]);

  function setUnderReview(id) {
    setBids((prev) => prev.map((bid) => (bid.id === id ? { ...bid, status: "Under Review" } : bid)));
  }

  function confirmWinnerSelection() {
    if (!selectingBid) return;
    setBids((prev) => prev.map((bid) => {
      if (bid.projectId !== selectingBid.projectId) return bid;
      return bid.id === selectingBid.id ? { ...bid, status: "Selected" } : { ...bid, status: "Rejected" };
    }));
    setShowWinnerConfirm(false);
    setSelectingBid(null);
    setToast({ message: "Winner selected successfully", type: "success" });
  }

  function confirmBlockchainRecord() {
    if (!recordingBid) return;
    const record = {
      id: `bc-${Date.now()}`,
      projectId: `PRJ-${recordingBid.projectId}`,
      projectTitle: recordingBid.projectTitle || recordingBid.projectName,
      winner: recordingBid.supplierName,
      bidAmount: recordingBid.bidAmount,
      hash: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`.slice(0, 66),
      recordedAt: `${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`,
    };
    onRecordToBlockchain((prev) => [record, ...prev]);
    setBids((prev) => prev.map((bid) => (bid.id === recordingBid.id ? { ...bid, recorded: true } : bid)));
    setShowBlockchainConfirm(false);
    setRecordingBid(null);
    setToast({ message: "Successfully recorded to blockchain!", type: "success" });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-lg font-bold text-slate-900">Bids</h1><p className="text-sm text-slate-500 mt-0.5">Review supplier bids and select winners</p></div></div>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 pt-4 flex gap-4 border-b border-slate-50">{["All", "Submitted", "Under Review", "Selected", "Rejected"].map((tab) => <button key={tab} onClick={() => setFilter(tab)} className={`pb-3 text-sm font-medium border-b-2 ${filter === tab ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"}`}>{tab}</button>)}</div>
        <div className="px-6 py-3 border-b border-slate-50"><SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by supplier or project" /></div>
        <table className="w-full"><thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Supplier</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Company</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Amount</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Submitted</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Actions</th></tr></thead><tbody className="divide-y divide-slate-50">{filtered.length === 0 ? <tr><td colSpan={7}><EmptyState title="No bids found" subtitle="Try changing filters or search terms." /></td></tr> : filtered.map((bid) => (<Fragment key={bid.id}><tr onClick={() => setExpandedBid((prev) => prev === bid.id ? null : bid.id)} className="hover:bg-slate-50/50 transition-colors cursor-pointer"><td className="px-6 py-4 text-sm font-medium text-slate-800">{bid.supplierName}</td><td className="px-6 py-4 text-sm text-slate-600">{bid.company}</td><td className="px-6 py-4 text-sm text-slate-600">{bid.projectTitle || bid.projectName}</td><td className="px-6 py-4 text-sm text-slate-600">{formatPeso(bid.bidAmount)}</td><td className="px-6 py-4 text-sm text-slate-600">{bid.submittedAt}</td><td className="px-6 py-4"><StatusBadge status={bid.status} /></td><td className="px-6 py-4"><div className="flex gap-2">{bid.status === "Submitted" && <button onClick={(event) => { event.stopPropagation(); setUnderReview(bid.id); }} className="rounded-lg border border-blue-200 px-2 py-1 text-xs text-blue-600">Review</button>}{bid.status === "Under Review" && <button onClick={(event) => { event.stopPropagation(); setSelectingBid(bid); setShowWinnerConfirm(true); }} className="rounded-lg bg-emerald-500 px-2 py-1 text-xs text-white">Select Winner</button>}</div></td></tr>{expandedBid === bid.id && <tr><td colSpan={7} className="px-6 py-4 bg-slate-50/70"><p className="text-sm text-slate-700 mb-3">{bid.proposal}</p>{bid.status === "Selected" && !bid.recorded && <button onClick={() => { setRecordingBid(bid); setShowBlockchainConfirm(true); }} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs text-white">Record to Blockchain</button>}{bid.recorded && <span className="text-xs font-semibold text-emerald-600">Recorded ✓</span>}</td></tr>}</Fragment>))}</tbody></table>
      </div>

      <ConfirmDialog isOpen={showWinnerConfirm} onClose={() => setShowWinnerConfirm(false)} onConfirm={confirmWinnerSelection} title="Select this supplier as winner?" message="This will reject all other bids for the same project." confirmLabel="Select Winner" infoCard={selectingBid && <div className="text-sm text-slate-600"><p>Supplier: {selectingBid.supplierName}</p><p>Project: {selectingBid.projectTitle || selectingBid.projectName}</p><p>Amount: {formatPeso(selectingBid.bidAmount)}</p></div>} />
      <ConfirmDialog isOpen={showBlockchainConfirm} onClose={() => setShowBlockchainConfirm(false)} onConfirm={confirmBlockchainRecord} title="Record to Blockchain?" message="This is permanent and cannot be undone." confirmLabel="Record" icon={<Shield className="h-4 w-4" />} infoCard={recordingBid && <div className="text-sm text-slate-600"><p>Project: {recordingBid.projectTitle || recordingBid.projectName}</p><p>Winner: {recordingBid.supplierName}</p><p>Amount: {formatPeso(recordingBid.bidAmount)}</p></div>} />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
