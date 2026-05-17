import { Fragment, useContext, useMemo, useState } from "react";
import { Shield, Trophy } from "lucide-react";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EmptyState from "../../components/shared/EmptyState";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";
import { bidsAPI } from "../../services/api";
import { ProcurementContext } from "../../lib/ProcurementContext";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

function getProjectKey(bid) {
  return bid.projectId || bid.project || bid.projectTitle || bid.projectName;
}

function safeStr(val) {
  return (val ?? "").toString().toLowerCase();
}

export default function AdminBids({ bids = [], setBids, onRecordToBlockchain }) {
  const procurement = useContext(ProcurementContext);
  const [expandedBid, setExpandedBid] = useState(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showWinnerConfirm, setShowWinnerConfirm] = useState(false);
  const [selectingBid, setSelectingBid] = useState(null);
  const [showBlockchainConfirm, setShowBlockchainConfirm] = useState(false);
  const [recordingBid, setRecordingBid] = useState(null);
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewDrafts, setReviewDrafts] = useState({});

  const filtered = useMemo(() => {
    const listed = bids.filter((bid) => {
      const statusMatch = filter === "All" || safeStr(bid.status) === safeStr(filter);
      const searchMatch =
        safeStr(bid.supplierName).includes(safeStr(search)) ||
        safeStr(bid.projectTitle).includes(safeStr(search)) ||
        safeStr(bid.projectName).includes(safeStr(search)) ||
        safeStr(bid.company || bid.supplierCompany || bid.company_name).includes(safeStr(search));
      return statusMatch && searchMatch;
    });

    return listed
      .slice()
      .sort((a, b) => {
        if ((a.rank || 9999) !== (b.rank || 9999)) return (a.rank || 9999) - (b.rank || 9999);
        if (a.project !== b.project) return String(a.project).localeCompare(String(b.project));
        return Number(a.bidAmount || 0) - Number(b.bidAmount || 0);
      })
      .map((bid) => {
        const projectBids = listed.filter((item) => getProjectKey(item) === getProjectKey(bid)).slice().sort((x, y) => Number(x.bidAmount || 0) - Number(y.bidAmount || 0));
        const displayRank = bid.rank || projectBids.findIndex((item) => item.id === bid.id) + 1;
        return { ...bid, displayRank: displayRank > 0 ? displayRank : null, isLowest: displayRank === 1 };
      });
  }, [bids, filter, search]);

  function updateReviewDraft(id, patch) {
    setReviewDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        ...patch,
      },
    }));
  }

  async function setUnderReview(id) {
    setActionLoading(true);
    try {
      procurement?.pushAudit?.("Admin", `Marked bid ${id} under review`);
      if (procurement?.updateBid) {
        procurement.updateBid(id, { status: "Under Review" }, "Admin");
      } else {
        const res = await bidsAPI.markReview(id);
        setBids((prev) => prev.map((bid) => (bid.id === id ? res.data : bid)));
      }
      setToast({ message: "Bid marked under review", type: "success" });
    } catch (error) {
      console.error("Failed to mark bid under review", error);
      setToast({ message: "Could not update bid status.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function saveEvaluation(bid) {
    const draft = reviewDrafts[bid.id] || {};
    setActionLoading(true);
    try {
      procurement?.pushAudit?.("Admin", `Saved evaluation for bid ${bid.id}`);
      if (procurement?.updateBid) {
        procurement.updateBid(bid.id, {
          evaluation_remarks: draft.evaluation_remarks ?? bid.evaluation_remarks ?? "",
          technical_compliance: typeof draft.technical_compliance === "boolean" ? draft.technical_compliance : bid.technical_compliance,
        }, "Admin");
        setBids((prev) => prev.map((item) => (item.id === bid.id ? {
          ...item,
          evaluation_remarks: draft.evaluation_remarks ?? item.evaluation_remarks ?? "",
          technical_compliance: typeof draft.technical_compliance === "boolean" ? draft.technical_compliance : item.technical_compliance,
        } : item)));
      } else {
        const res = await bidsAPI.update(bid.id, {
          evaluation_remarks: draft.evaluation_remarks ?? bid.evaluation_remarks ?? "",
          technical_compliance: typeof draft.technical_compliance === "boolean" ? draft.technical_compliance : bid.technical_compliance,
        });
        setBids((prev) => prev.map((item) => (item.id === bid.id ? res.data : item)));
      }
      setToast({ message: "Evaluation saved successfully", type: "success" });
    } catch (error) {
      console.error("Failed to save evaluation", error);
      setToast({ message: "Could not save evaluation.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmWinnerSelection() {
    if (!selectingBid) return;
    setActionLoading(true);
    try {
      if (procurement?.selectWinner && selectingBid?.projectId) {
        const record = await procurement.selectWinner(selectingBid.projectId, selectingBid.id, "Admin");
        setBids((prev) => prev.map((bid) => {
          const sameProject = getProjectKey(bid) === getProjectKey(selectingBid);
          if (!sameProject) return bid;
          if (bid.id === selectingBid.id) return { ...bid, status: "Selected", blockchainHash: record.hash, recorded: true };
          return { ...bid, status: "Rejected" };
        }));
        setToast({ message: `Lowest calculated bid selected. Hash: ${record.hash.slice(0, 12)}...`, type: "success" });
      } else {
        const res = await bidsAPI.selectWinner(selectingBid.id);
        setBids((prev) => prev.map((bid) => {
          if (getProjectKey(bid) !== getProjectKey(selectingBid)) return bid;
          if (bid.id === selectingBid.id) return res.data;
          return { ...bid, status: "Rejected" };
        }));
        setToast({ message: "Winner selected successfully", type: "success" });
      }
    } catch (error) {
      console.error("Failed to select winner", error);
      setToast({ message: "Could not select winner.", type: "error" });
    } finally {
      setSelectingBid(null);
      setShowWinnerConfirm(false);
      setActionLoading(false);
    }
  }

  async function confirmBlockchainRecord() {
    if (!recordingBid) return;
    setActionLoading(true);
    try {
      procurement?.pushAudit?.("Admin", `Recorded bid ${recordingBid.id} to blockchain`);
      if (procurement?.selectWinner) {
        setBids((prev) => prev.map((bid) => (bid.id === recordingBid.id ? { ...bid, recorded: true } : bid)));
        const record = procurement.getProjectSupplierData(recordingBid.projectId || recordingBid.project)?.winnerBid || recordingBid;
        onRecordToBlockchain?.((prev) => [{ ...record, hash: recordingBid.blockchainHash || record.blockchainHash || "" }, ...prev]);
      } else {
        const res = await bidsAPI.recordBlockchain(recordingBid.id);
        setBids((prev) => prev.map((bid) => (bid.id === recordingBid.id ? { ...bid, recorded: true } : bid)));
        onRecordToBlockchain((prev) => [res.data, ...prev]);
      }
      setToast({ message: "Blockchain record created successfully", type: "success" });
    } catch (error) {
      console.error("Failed to record bid to blockchain", error);
      setToast({ message: "Could not record to blockchain.", type: "error" });
    } finally {
      setRecordingBid(null);
      setShowBlockchainConfirm(false);
      setActionLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-lg font-bold text-slate-900">Bids</h1><p className="text-sm text-slate-500 mt-0.5">Review supplier bids and select winners</p></div></div>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 pt-4 flex gap-4 border-b border-slate-50">{["All", "Submitted", "Under Review", "Selected", "Rejected"].map((tab) => <button key={tab} onClick={() => setFilter(tab)} className={`pb-3 text-sm font-medium border-b-2 ${filter === tab ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"}`}>{tab}</button>)}</div>
        <div className="px-6 py-3 border-b border-slate-50"><SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by supplier or project" /></div>
        <table className="w-full"><thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Rank</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Supplier</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Company</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Amount</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Submitted</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Compliance</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Remarks</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Actions</th></tr></thead><tbody className="divide-y divide-slate-50">{filtered.length === 0 ? <tr><td colSpan={10}><EmptyState title="No bids found" subtitle="Try changing filters or search terms." /></td></tr> : filtered.map((bid) => (<Fragment key={bid.id}><tr onClick={() => setExpandedBid((prev) => prev === bid.id ? null : bid.id)} className="hover:bg-slate-50/50 transition-colors cursor-pointer"><td className="px-6 py-4 text-sm font-semibold text-slate-800">{bid.isLowest ? <span className="inline-flex items-center gap-1"><Trophy className="h-4 w-4 text-amber-500" />Lowest</span> : bid.displayRank ? <span className="inline-flex items-center gap-1">Rank {bid.displayRank}</span> : "-"}</td><td className="px-6 py-4 text-sm font-medium text-slate-800">{bid.supplierName}</td><td className="px-6 py-4 text-sm text-slate-600">{bid.supplierCompany}</td><td className="px-6 py-4 text-sm text-slate-600">{bid.projectTitle || bid.projectName}</td><td className="px-6 py-4 text-sm text-slate-600">{formatPeso(bid.bidAmount)}</td><td className="px-6 py-4 text-sm text-slate-600">{bid.submittedAt}</td><td className="px-6 py-4 text-sm text-slate-600">{bid.technical_compliance === true ? "Compliant" : bid.technical_compliance === false ? "Non-Compliant" : "Pending"}</td><td className="px-6 py-4 text-sm text-slate-600 max-w-[220px] truncate">{bid.evaluation_remarks || "-"}</td><td className="px-6 py-4"><StatusBadge status={bid.status} /></td><td className="px-6 py-4"><div className="flex gap-2">{bid.status === "Submitted" && <button onClick={(event) => { event.stopPropagation(); setUnderReview(bid.id); }} className="rounded-lg border border-blue-200 px-2 py-1 text-xs text-blue-600">Review</button>}{bid.status === "Under Review" && <button onClick={(event) => { event.stopPropagation(); setSelectingBid(bid); setShowWinnerConfirm(true); }} className="rounded-lg bg-emerald-500 px-2 py-1 text-xs text-white">Select Winner</button>}</div></td></tr>{expandedBid === bid.id && <tr><td colSpan={10} className="px-6 py-4 bg-slate-50/70"><p className="text-sm text-slate-700 mb-3">{bid.proposal}</p><div className="grid gap-3 md:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Compliance</span><div className="flex gap-2"><button type="button" onClick={() => updateReviewDraft(bid.id, { technical_compliance: true })} className={`rounded-lg px-3 py-2 text-xs font-semibold ${ (reviewDrafts[bid.id]?.technical_compliance ?? bid.technical_compliance) === true ? "bg-emerald-500 text-white" : "border border-slate-200 text-slate-600"}`}>Compliant</button><button type="button" onClick={() => updateReviewDraft(bid.id, { technical_compliance: false })} className={`rounded-lg px-3 py-2 text-xs font-semibold ${ (reviewDrafts[bid.id]?.technical_compliance ?? bid.technical_compliance) === false ? "bg-red-500 text-white" : "border border-slate-200 text-slate-600"}`}>Non-Compliant</button></div></label><label className="block md:col-span-2"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Evaluation Remarks</span><textarea rows="3" value={reviewDrafts[bid.id]?.evaluation_remarks ?? bid.evaluation_remarks ?? ""} onChange={(e) => updateReviewDraft(bid.id, { evaluation_remarks: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none" placeholder="Add evaluation remarks" /></label></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => setUnderReview(bid.id)} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs text-blue-600">Mark Under Review</button><button onClick={() => saveEvaluation(bid)} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs text-white">Save Evaluation</button>{bid.status === "Selected" && !bid.recorded && <button onClick={() => { setRecordingBid(bid); setShowBlockchainConfirm(true); }} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs text-white">Record to Blockchain</button>}{bid.recorded && <span className="text-xs font-semibold text-emerald-600">Recorded ✓</span>}</div></td></tr>}</Fragment>))}</tbody></table>
      </div>

      <ConfirmDialog isOpen={showWinnerConfirm} onClose={() => setShowWinnerConfirm(false)} onConfirm={confirmWinnerSelection} title="Select this supplier as winner?" message="This will reject all other bids for the same project." confirmLabel="Select Winner" infoCard={selectingBid && <div className="text-sm text-slate-600"><p>Supplier: {selectingBid.supplierName}</p><p>Project: {selectingBid.projectTitle || selectingBid.projectName}</p><p>Amount: {formatPeso(selectingBid.bidAmount)}</p></div>} />
      <ConfirmDialog isOpen={showBlockchainConfirm} onClose={() => setShowBlockchainConfirm(false)} onConfirm={confirmBlockchainRecord} title="Record to Blockchain?" message="This is permanent and cannot be undone." confirmLabel="Record" icon={<Shield className="h-4 w-4" />} infoCard={recordingBid && <div className="text-sm text-slate-600"><p>Project: {recordingBid.projectTitle || recordingBid.projectName}</p><p>Winner: {recordingBid.supplierName}</p><p>Amount: {formatPeso(recordingBid.bidAmount)}</p></div>} />
      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
