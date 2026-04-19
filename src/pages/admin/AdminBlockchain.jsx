// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\admin\AdminBlockchain.jsx
import { Check, Copy, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import EmptyState from "../../components/shared/EmptyState";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import Toast from "../../components/shared/Toast";

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

export default function AdminBlockchain({ blockchainRecords }) {
  const [search, setSearch] = useState("");
  const [viewingRecord, setViewingRecord] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);

  const records = useMemo(() => {
    const query = search.trim().toLowerCase();
    return blockchainRecords.filter((record) => {
      const text = `${record.projectTitle} ${record.winner}`.toLowerCase();
      return !query || text.includes(query);
    });
  }, [blockchainRecords, search]);

  async function copyHash(hash, id) {
    await navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setToast({ message: "Hash copied!", type: "success" });
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-lg font-bold text-slate-900">Blockchain Records</h1><p className="text-sm text-slate-500 mt-0.5">Immutable procurement logs</p></div></div>
      <div className="mb-5 rounded-2xl bg-slate-900 text-white p-4 flex items-center gap-3"><Shield className="h-5 w-5 text-emerald-400" /><p className="text-sm">All entries are immutable and blockchain-verified</p></div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-50"><SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by project or winner" /></div>
        <table className="w-full"><thead><tr className="bg-slate-50/50 border-b border-slate-100"><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">#</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Winner</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Amount</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Recorded At</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Hash</th><th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Actions</th></tr></thead><tbody className="divide-y divide-slate-50">{records.length === 0 ? <tr><td colSpan={7}><EmptyState title="No records found" subtitle="No blockchain entries match your search." /></td></tr> : records.map((record, index) => (<tr key={record.id} className="hover:bg-slate-50/50"><td className="px-6 py-4 text-sm text-slate-600">{index + 1}</td><td className="px-6 py-4 text-sm font-medium text-slate-800">{record.projectTitle}</td><td className="px-6 py-4 text-sm text-slate-600">{record.winner}</td><td className="px-6 py-4 text-sm text-slate-600">{formatPeso(record.bidAmount)}</td><td className="px-6 py-4 text-sm text-slate-600">{record.recordedAt}</td><td className="px-6 py-4"><code className="text-xs font-mono text-slate-500">{record.hash.slice(0, 18)}...</code></td><td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => setViewingRecord(record)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600">View</button><button onClick={() => copyHash(record.hash, record.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">{copiedId === record.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button></div></td></tr>))}</tbody></table>
      </div>

      <Modal isOpen={Boolean(viewingRecord)} onClose={() => setViewingRecord(null)} title="Blockchain Record Details" size="lg">
        {viewingRecord && <div className="space-y-3 text-sm text-slate-700"><p><span className="font-semibold">Project:</span> {viewingRecord.projectTitle}</p><p><span className="font-semibold">Winner:</span> {viewingRecord.winner}</p><p><span className="font-semibold">Bid Amount:</span> {formatPeso(viewingRecord.bidAmount)}</p><p><span className="font-semibold">Recorded At:</span> {viewingRecord.recordedAt}</p><div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><code className="text-xs font-mono break-all text-slate-600">{viewingRecord.hash}</code></div><button onClick={() => copyHash(viewingRecord.hash, viewingRecord.id)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Copy Full Hash</button></div>}
      </Modal>

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
