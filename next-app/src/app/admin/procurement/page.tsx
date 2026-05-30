'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { procurementAPI } from '@/services/api';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import Modal from '@/components/shared/Modal';
import Toast from '@/components/shared/Toast';
import SearchBar from '@/components/shared/SearchBar';
import LoadingButton from '@/components/ui/LoadingButton';
import { SkeletonTable } from '@/components/ui/Skeleton';
import StrictNumberInput from '@/components/shared/StrictNumberInput';
const FALLBACK_PROCUREMENT_TYPES = [
  "IT Equipment",
  "Office Supplies",
  "Construction Materials",
  "Medical Supplies",
  "ICT Services",
  "Electrical Supplies",
  "Agricultural Supplies",
  "Printing Services",
  "Transportation",
  "Consultancy",
];
const EMPTY_FORM = { projectTitle: '', budget: '', deadline: '', publicResultExpiryDate: '', procurementType: '', technicalSpecifications: '', procurementSchedule: '', deliveryPeriod: '' };

export default function AdminProcurement() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [procurementTypes, setProcurementTypes] = useState<string[]>(FALLBACK_PROCUREMENT_TYPES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [detailsRequest, setDetailsRequest] = useState<any>(null);
  const [publishedProcurementIds, setPublishedProcurementIds] = useState<Set<string>>(new Set());

  const fetchRequests = () => {
    setLoading(true);
    Promise.all([
      procurementAPI.getAll(),
      fetch('/api/projects').then((r) => r.ok ? r.json() : []),
    ]).then(([res, projects]) => {
      setRequests(Array.isArray(res.data) ? res.data : res.data.results || []);
      const projectList = Array.isArray(projects) ? projects : projects.results || [];
      const published = new Set<string>(
        projectList
          .filter((p: any) => ['active', 'awarded'].includes(p.status) && p.procurement_request_id)
          .map((p: any) => p.procurement_request_id)
      );
      setPublishedProcurementIds(published);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { 
    fetchRequests(); 
    fetch('/api/public/business-types')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const names = Array.isArray(data) ? data.map((item: any) => item.name).filter(Boolean) : [];
        if (names.length) setProcurementTypes(names);
      })
      .catch(() => setProcurementTypes(FALLBACK_PROCUREMENT_TYPES));
  }, []);

  const openCreate = () => { setEditingRequest(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (r: any) => {
    const procurementType = procurementTypes.includes(r.procurement_type) ? r.procurement_type : procurementTypes[0] || '';
    setEditingRequest(r);
    setForm({ projectTitle: r.project_title || '', budget: String(r.budget || ''), deadline: String(r.deadline || '').slice(0, 10), publicResultExpiryDate: String(r.public_result_expiry_date || '').slice(0, 10), procurementType, technicalSpecifications: r.technical_specifications || '', procurementSchedule: String(r.procurement_schedule || '').slice(0, 10), deliveryPeriod: String(r.delivery_period || '').slice(0, 10) });
    setShowModal(true);
  };

  const saveRequest = async () => {
    if (!form.projectTitle.trim() || !form.budget) return;
    if (!form.procurementType || !String(form.procurementType || '').trim()) {
      setToast({ message: 'Please choose a procurement type.', type: 'error' });
      return;
    }
    setIsSaving(true);
    try {
      const payload = { project_title: form.projectTitle.trim(), budget: form.budget, deadline: form.deadline || null, public_result_expiry_date: form.publicResultExpiryDate || null, procurement_type: form.procurementType, technical_specifications: form.technicalSpecifications.trim(), procurement_schedule: form.procurementSchedule, delivery_period: form.deliveryPeriod };
      if (editingRequest) await procurementAPI.update(editingRequest.id, payload);
      else await procurementAPI.create(payload);
      setToast({ message: editingRequest ? 'Request updated' : 'Draft saved', type: 'success' });
      setShowModal(false); fetchRequests();
    } catch { setToast({ message: 'Failed to save', type: 'error' }); }
    finally { setIsSaving(false); }
  };

  const submitForReview = async (request: any) => {
    setIsSaving(true);
    try {
      await procurementAPI.update(request.id, { action: 'submit_for_review' });
      setToast({ message: 'Request submitted for review', type: 'success' });
      fetchRequests();
    } catch {
      setToast({ message: 'Failed to submit for review', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const goToProjects = () => {
    router.push('/admin/projects');
  };

  const filtered = requests.filter((r: any) => r.project_title?.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <div className="p-6"><SkeletonTable /></div>;

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div />
        <button onClick={openCreate} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600">+ New Request</button>
      </div>
      <SearchBar value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or type" className="mb-4" />
      {filtered.length === 0 ? <EmptyState title="No procurement requests found" subtitle="Create a new procurement request to get started." actionLabel="Create Request" onAction={openCreate} /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <table className="min-w-full">
            <thead className="border-b border-slate-100 bg-slate-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((r: any) => (
                <tr key={r.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{r.project_title}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{'\u20B1'}{Number(r.budget).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.procurement_type || '\u2014'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{r.deadline ? new Date(r.deadline).toLocaleDateString() : '\u2014'}</td>
                  <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setDetailsRequest(r)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">View Details</button>
                      {['Draft', 'Revision Required'].includes(r.status) && (
                        <button onClick={() => openEdit(r)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">Edit</button>
                      )}
                      {['Draft', 'Revision Required'].includes(r.status) && (
                        <button onClick={() => submitForReview(r)} disabled={isSaving} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">Send for Approval</button>
                      )}
                      {r.status === 'Pending Review' && (
                        <button type="button" disabled className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">Waiting for Head Approval</button>
                      )}
                      {r.status === 'Approved' && !publishedProcurementIds.has(r.id) && (
                        <button type="button" onClick={goToProjects} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-sky-700">Go to Publish Project</button>
                      )}
                      {r.status === 'Approved' && publishedProcurementIds.has(r.id) && (
                        <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">Published</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRequest ? "Edit Procurement Request" : "New Procurement Request"} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); saveRequest(); }} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Project Title</span>
            <input type="text" value={form.projectTitle} onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} className={inputClass} placeholder="Enter project title" />
          </label>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Approved Budget ({'\u20B1'})</span>
              <StrictNumberInput value={form.budget} onChange={(value) => setForm({ ...form, budget: value })} className={inputClass} placeholder="Enter approved budget" min="0" required helperText="Numbers only. Enter the approved budget amount in pesos." />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Bidding Closes On</span>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={inputClass} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Public Result Visible Until</span>
            <input type="date" value={form.publicResultExpiryDate} onChange={(e) => setForm({ ...form, publicResultExpiryDate: e.target.value })} className={inputClass} />
            <p className="mt-1 text-xs text-slate-400">Set how long the awarded result stays visible to the public</p>
          </label>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm text-slate-700">Bidding closes on {form.deadline || '\u2014'}.</p>
            <p className="text-sm text-slate-700">Public result will be visible until {form.publicResultExpiryDate || '\u2014'}.</p>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Type</span>
            <select value={form.procurementType} onChange={(e) => setForm({ ...form, procurementType: e.target.value })} className={inputClass}>
              <option value="">Select category</option>
              {procurementTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <p className="mt-1 text-xs text-slate-400">Choose the exact category name used in supplier registration.</p>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Specifications</span>
            <textarea value={form.technicalSpecifications} onChange={(e) => setForm({ ...form, technicalSpecifications: e.target.value })} className={inputClass} placeholder="Describe technical specifications" rows={3} />
          </label>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Schedule</span>
              <input type="date" value={form.procurementSchedule} onChange={(e) => setForm({ ...form, procurementSchedule: e.target.value })} className={inputClass} min={new Date().toISOString().split("T")[0]} />
              <p className="mt-1 text-xs text-slate-400">Project will automatically go live on this date</p>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Expected Delivery Date</span>
              <input type="date" value={form.deliveryPeriod} onChange={(e) => setForm({ ...form, deliveryPeriod: e.target.value })} className={inputClass} min={form.deadline || new Date().toISOString().split("T")[0]} />
              <p className="mt-1 text-xs text-slate-400">The expected date for delivery of goods or services</p>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <LoadingButton type="submit" isLoading={isSaving} loadingText="Saving..." className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600">
              {editingRequest ? "Update Request" : "Create Request"}
            </LoadingButton>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(detailsRequest)} onClose={() => setDetailsRequest(null)} title="Procurement Request Details" size="lg">
        {detailsRequest && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">{detailsRequest.project_title}</h3>
              <StatusBadge status={detailsRequest.status} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Budget</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{'\u20B1'}{Number(detailsRequest.budget).toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Procurement Type</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{detailsRequest.procurement_type || '\u2014'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bidding Deadline</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{detailsRequest.deadline ? new Date(detailsRequest.deadline).toLocaleDateString() : '\u2014'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Public Result Expiry</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{detailsRequest.public_result_expiry_date ? new Date(detailsRequest.public_result_expiry_date).toLocaleDateString() : '\u2014'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Procurement Schedule</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{detailsRequest.procurement_schedule ? new Date(detailsRequest.procurement_schedule).toLocaleDateString() : '\u2014'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Expected Delivery</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{detailsRequest.delivery_period ? new Date(detailsRequest.delivery_period).toLocaleDateString() : '\u2014'}</p>
              </div>
            </div>
            {detailsRequest.technical_specifications && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Technical Specifications</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{detailsRequest.technical_specifications}</p>
              </div>
            )}
            {detailsRequest.remarks && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Reviewer Remarks</p>
                <p className="mt-2 text-sm text-amber-800">{detailsRequest.remarks}</p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs text-slate-400">
              <div>Created by: <span className="font-medium text-slate-600">{detailsRequest.created_by?.full_name || '\u2014'}</span></div>
              <div>Reviewed by: <span className="font-medium text-slate-600">{detailsRequest.reviewed_by?.full_name || '\u2014'}</span></div>
              <div>Created: <span className="font-medium text-slate-600">{detailsRequest.created_at ? new Date(detailsRequest.created_at).toLocaleString() : '\u2014'}</span></div>
              <div>Updated: <span className="font-medium text-slate-600">{detailsRequest.updated_at ? new Date(detailsRequest.updated_at).toLocaleString() : '\u2014'}</span></div>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast isVisible={true} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}