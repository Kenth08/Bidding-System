import { Plus, Trash2, CheckCircle2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EmptyState from "../../components/shared/EmptyState";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";
import { procurementAPI } from "../../services/api";
import { useContext } from "react";
import { ProcurementContext } from "../../lib/ProcurementContext";
import { STATUS, getStatusLabel } from "../../lib/procurementStatus";

const PROCUREMENT_TYPES = ["Goods", "Services", "Infrastructure"];

const INITIAL_REQUEST = {
  projectTitle: "",
  budget: "",
  procurementType: "Goods",
  technicalSpecifications: "",
  procurementSchedule: "",
  deliveryPeriod: "",
};

export default function AdminProcurementPlanning() {
  const procurement = useContext(ProcurementContext);
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [form, setForm] = useState(INITIAL_REQUEST);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [deadlineDate, setDeadlineDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  useEffect(() => {
    async function loadRequests() {
      if (procurement?.projects?.length) {
        setRequests(
          procurement.projects.map((item) => ({
            id: item.id,
            projectTitle: item.project_title,
            budget: item.budget,
            procurementType: item.category,
            technicalSpecifications: item.technical_specifications || item.requirements || '',
            procurementSchedule: item.bid_opening_date || item.submission_deadline || '',
            deliveryPeriod: item.delivery,
            createdAt: item.created_at,
            status: item.status,
          }))
        );
        return;
      }

      try {
        const res = await procurementAPI.getAll();
        const items = res.data.results || res.data || [];
        setRequests(
          items.map((item) => ({
            id: item.id,
            projectTitle: item.project_title,
            budget: item.budget,
            procurementType: item.procurement_type,
            technicalSpecifications: item.technical_specifications,
            procurementSchedule: item.procurement_schedule,
            deliveryPeriod: item.delivery_period,
            createdAt: item.created_at,
            status: item.status,
          }))
        );
      } catch (error) {
        console.error("Failed to load procurement requests", error);
      }
    }

    loadRequests();
  }, [procurement?.projects]);

  function openCreate() {
    setEditingRequest(null);
    setForm(INITIAL_REQUEST);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(request) {
    setEditingRequest(request);
    setForm({ ...request });
    setErrors({});
    setShowModal(true);
  }

  function validateForm() {
    const nextErrors = {};
    if (!form.projectTitle.trim()) nextErrors.projectTitle = "Project title is required.";
    if (!form.budget || Number(form.budget) <= 0) nextErrors.budget = "Budget is required.";
    if (!form.procurementType) nextErrors.procurementType = "Procurement type is required.";
    if (!form.technicalSpecifications.trim()) nextErrors.technicalSpecifications = "Technical specifications are required.";
    if (!form.procurementSchedule.trim()) nextErrors.procurementSchedule = "Procurement schedule is required.";
    if (!form.deliveryPeriod.trim()) nextErrors.deliveryPeriod = "Delivery period is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function saveRequest() {
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const payload = {
        project_title: form.projectTitle,
        budget: Number(form.budget),
        procurement_type: form.procurementType,
        technical_specifications: form.technicalSpecifications,
        procurement_schedule: form.procurementSchedule,
        delivery_period: form.deliveryPeriod,
      };

      if (editingRequest) {
        const saved = procurement?.createRequest ? { ...editingRequest, ...payload } : (await procurementAPI.update(editingRequest.id, payload)).data;
        setRequests((prev) => prev.map((item) => (item.id === editingRequest.id ? {
          id: saved.id,
          projectTitle: saved.project_title || saved.projectTitle,
          budget: saved.budget,
          procurementType: saved.procurement_type || saved.category,
          technicalSpecifications: saved.technical_specifications || saved.technicalSpecifications,
          procurementSchedule: saved.procurement_schedule || saved.bid_opening_date || saved.submission_deadline,
          deliveryPeriod: saved.delivery_period || saved.delivery,
          createdAt: saved.created_at || saved.createdAt,
        } : item)));
        setToast({ message: "Procurement request updated successfully", type: "success" });
      } else {
        const saved = procurement?.createRequest ? procurement.createRequest(payload, "Admin") : (await procurementAPI.create(payload)).data;
        setRequests((prev) => [{
          id: saved.id,
          projectTitle: saved.project_title || saved.projectTitle,
          budget: saved.budget,
          procurementType: saved.procurement_type || saved.category,
          technicalSpecifications: saved.technical_specifications || saved.technicalSpecifications,
          procurementSchedule: saved.procurement_schedule || saved.bid_opening_date || saved.submission_deadline,
          deliveryPeriod: saved.delivery_period || saved.delivery,
          createdAt: saved.created_at || saved.createdAt,
        }, ...prev]);
        setToast({ message: "Procurement request created successfully", type: "success" });
      }
      setShowModal(false);
    } catch (error) {
      setToast({ message: "Failed to save procurement request.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete(id) {
    setDeletingId(id);
    setShowConfirm(true);
  }

  function handleDelete() {
    if (!deletingId) return;
    if (procurement?.pushAudit) {
      setRequests((prev) => prev.filter((item) => item.id !== deletingId));
      procurement.pushAudit("Admin", `Deleted procurement request ${deletingId}`);
      setToast({ message: "Procurement request deleted", type: "success" });
      setShowConfirm(false);
      setDeletingId(null);
      return;
    }

    procurementAPI.delete(deletingId)
      .then(() => {
        setRequests((prev) => prev.filter((item) => item.id !== deletingId));
        setToast({ message: "Procurement request deleted", type: "success" });
      })
      .catch((error) => {
        console.error("Failed to delete procurement request", error);
        setToast({ message: "Failed to delete procurement request.", type: "error" });
      })
      .finally(() => {
        setShowConfirm(false);
        setDeletingId(null);
      });
  }

  function handleApprove() {
    if (!approvingId || !procurement?.approveRequest) return;
    procurement.approveRequest(approvingId, "Admin", true);
    setRequests((prev) =>
      prev.map((item) =>
        item.id === approvingId ? { ...item, status: STATUS.APPROVED } : item
      )
    );
    setToast({ message: "Procurement request approved successfully", type: "success" });
    setShowApproveConfirm(false);
    setApprovingId(null);
  }

  function handlePublish() {
    if (!publishingId || !procurement?.publishProject) return;
    const deadlineDateTime = new Date(deadlineDate).toISOString();
    procurement.publishProject(publishingId, "Admin", deadlineDateTime);
    setRequests((prev) =>
      prev.map((item) =>
        item.id === publishingId ? { ...item, status: STATUS.OPEN } : item
      )
    );
    setToast({
      message: `Project published for bidding (Deadline: ${new Date(deadlineDate).toLocaleDateString()})`,
      type: "success",
    });
    setShowPublishModal(false);
    setPublishingId(null);
    setDeadlineDate(
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
  }

  const filtered = requests.filter((request) => {
    const query = search.toLowerCase();
    return request.projectTitle.toLowerCase().includes(query) || request.procurementType.toLowerCase().includes(query);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Procurement Planning</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage procurement requests</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" />
          New Procurement Request
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-3 border-b border-slate-50">
          <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title or type" />
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Created</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState title="No procurement requests yet" subtitle="Create a new procurement request to get started." />
                </td>
              </tr>
            ) : (
              filtered.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{request.projectTitle}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    ₱{new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(request.budget)}
                  </td>
                  <td className="px-6 py-4 text-sm"><StatusBadge status={request.procurementType} /></td>
                  <td className="px-6 py-4 text-sm">
                    <StatusBadge status={getStatusLabel(request.status)} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {request.status === STATUS.PENDING_REVIEW && (
                        <button
                          onClick={() => {
                            setApprovingId(request.id);
                            setShowApproveConfirm(true);
                          }}
                          className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </button>
                      )}
                      {request.status === STATUS.APPROVED && (
                        <button
                          onClick={() => {
                            setPublishingId(request.id);
                            setShowPublishModal(true);
                          }}
                          className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Publish for Bidding
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(request)}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(request.id)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRequest ? "Edit Procurement Request" : "New Procurement Request"} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); saveRequest(); }} className="space-y-4">
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Project Title</span>
            <input
              type="text"
              value={form.projectTitle}
              onChange={(e) => setForm({ ...form, projectTitle: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              placeholder="Enter project title"
            />
            {errors.projectTitle && <p className="text-xs text-red-600 mt-1">{errors.projectTitle}</p>}
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Budget (₱)</span>
            <input
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              placeholder="Enter budget"
              min="0"
              step="1000"
            />
            {errors.budget && <p className="text-xs text-red-600 mt-1">{errors.budget}</p>}
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Type</span>
            <select
              value={form.procurementType}
              onChange={(e) => setForm({ ...form, procurementType: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
            >
              {PROCUREMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.procurementType && <p className="text-xs text-red-600 mt-1">{errors.procurementType}</p>}
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Specifications</span>
            <textarea
              value={form.technicalSpecifications}
              onChange={(e) => setForm({ ...form, technicalSpecifications: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              placeholder="Describe technical specifications"
              rows="3"
            />
            {errors.technicalSpecifications && <p className="text-xs text-red-600 mt-1">{errors.technicalSpecifications}</p>}
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Schedule</span>
            <input
              type="text"
              value={form.procurementSchedule}
              onChange={(e) => setForm({ ...form, procurementSchedule: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              placeholder="e.g., Q1 2026, Immediate, etc."
            />
            {errors.procurementSchedule && <p className="text-xs text-red-600 mt-1">{errors.procurementSchedule}</p>}
          </label>

          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Period</span>
            <input
              type="text"
              value={form.deliveryPeriod}
              onChange={(e) => setForm({ ...form, deliveryPeriod: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              placeholder="e.g., 30 days, 6 months, etc."
            />
            {errors.deliveryPeriod && <p className="text-xs text-red-600 mt-1">{errors.deliveryPeriod}</p>}
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              {isSaving ? "Saving..." : editingRequest ? "Update Request" : "Create Request"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete this procurement request?"
        message="This action cannot be undone."
        confirmLabel="Delete"
      />

      <ConfirmDialog
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleApprove}
        title="Approve this procurement request?"
        message="This will move the project to 'Approved' status. You can then publish it for bidding."
        confirmLabel="Approve"
      />

      <Modal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        title="Publish Project for Bidding"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Bid Submission Deadline
            </label>
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
            />
            <p className="text-xs text-slate-500 mt-1.5">Suppliers will have until this date to submit their bids.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowPublishModal(false)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePublish}
              className="flex-1 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
            >
              Publish Now
            </button>
          </div>
        </div>
      </Modal>

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}
