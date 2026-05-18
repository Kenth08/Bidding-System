// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\admin\AdminProcurementPlanning.jsx
import { CheckCircle2, Info, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EmptyState from "../../components/shared/EmptyState";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import StatusBadge from "../../components/shared/StatusBadge";
import Toast from "../../components/shared/Toast";
import { getStatusLabel } from "../../lib/procurementStatus";
import { procurementAPI } from "../../services/api";
import { SkeletonTable } from "../../components/ui/Skeleton";
import LoadingButton from "../../components/ui/LoadingButton";

const PROCUREMENT_TYPES = ["Goods", "Services", "Infrastructure"];

const INITIAL_REQUEST = {
  projectTitle: "",
  budget: "",
  deadline: "",
  publicResultExpiryDate: "",
  procurementType: "Goods",
  technicalSpecifications: "",
  procurementSchedule: "",
  deliveryPeriod: "",
};

function safeStr(val) {
  return (val ?? "").toString().toLowerCase();
}

function formatDate(value) {
  if (!value) return "—";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) return value;
  return dateValue.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminProcurementPlanning({ onOpenProjects, isLoading }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [form, setForm] = useState(INITIAL_REQUEST);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  async function loadRequests() {
    setLoading(true);
    try {
      const response = await procurementAPI.getAll();
      const items = response.data.results || response.data || [];
      setRequests(items);
    } catch (error) {
      console.error("Failed to load procurement requests", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((request) => {
      return (
        safeStr(request.project_title || request.title).includes(safeStr(search)) ||
        safeStr(request.procurement_type || request.category).includes(safeStr(search)) ||
        safeStr(request.created_by_name).includes(safeStr(search))
      );
    });
  }, [requests, search]);

  if (isLoading || loading) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Procurement Planning</h1>
            <p className="mt-0.5 text-sm text-slate-500">Create and manage procurement requests</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-6">
          <SkeletonTable rows={5} cols={4} />
        </div>
      </div>
    );
  }

  function openCreate() {
    setEditingRequest(null);
    setForm({
      ...INITIAL_REQUEST,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      publicResultExpiryDate: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
    setErrors({});
    setShowModal(true);
  }

  function openEdit(request) {
    setEditingRequest(request);
    setForm({
      projectTitle: request.title || request.project_title || "",
      budget: String(request.budget || ""),
      deadline: String(request.deadline || request.submission_deadline || "").slice(0, 10),
      publicResultExpiryDate: String(request.public_result_expiry_date || "").slice(0, 10),
      procurementType: request.procurement_type || request.category || "Goods",
      technicalSpecifications: request.technical_specifications || request.requirements || "",
      procurementSchedule: request.procurement_schedule || "",
      deliveryPeriod: request.delivery_period || request.delivery || "",
    });
    setErrors({});
    setShowModal(true);
  }

  function validateForm() {
    const nextErrors = {};
    if (!form.projectTitle.trim()) nextErrors.projectTitle = "Project title is required.";
    if (!form.budget || Number(form.budget) <= 0) nextErrors.budget = "Budget is required.";
    if (!form.deadline) nextErrors.deadline = "Bidding deadline is required.";
    if (!form.publicResultExpiryDate) nextErrors.publicResultExpiryDate = "Public result expiry date is required.";
    // Validate dates: deadline must be in the future; expiry must be after deadline
    try {
      const dl = new Date(form.deadline);
      const pr = new Date(form.publicResultExpiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dl <= today) nextErrors.deadline = "Bidding deadline must be a future date.";
      if (pr <= dl) nextErrors.publicResultExpiryDate = "Public result expiry must be after the bidding deadline.";
    } catch (e) {}
    if (!form.procurementType) nextErrors.procurementType = "Procurement type is required.";
    if (!form.technicalSpecifications.trim()) nextErrors.technicalSpecifications = "Technical specifications are required.";
    if (!form.deliveryPeriod.trim()) nextErrors.deliveryPeriod = "Delivery period is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function saveRequest() {
    if (!validateForm()) return;

    setIsSaving(true);
    const payload = {
      title: form.projectTitle.trim(),
      budget: Number(form.budget),
      deadline: form.deadline,
      public_result_expiry_date: form.publicResultExpiryDate || null,
      procurement_type: form.procurementType,
      technical_specifications: form.technicalSpecifications.trim(),
      procurement_schedule: form.procurementSchedule.trim(),
      delivery_period: form.deliveryPeriod.trim(),
    };

    try {
      if (editingRequest) {
        await procurementAPI.update(editingRequest.id, payload);
        setToast({ message: "Procurement request updated successfully", type: "success" });
      } else {
        await procurementAPI.create(payload);
        setToast({ message: "Procurement request created successfully", type: "success" });
      }
      setShowModal(false);
      await loadRequests();
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to save procurement request.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete(id) {
    setDeletingId(id);
    setShowConfirm(true);
  }

  async function handleDelete() {
    if (!deletingId) return;

    try {
      await procurementAPI.delete(deletingId);
      setRequests((prev) => prev.filter((item) => item.id !== deletingId));
      setToast({ message: "Procurement request deleted", type: "success" });
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to delete procurement request.", type: "error" });
    } finally {
      setDeletingId(null);
      setShowConfirm(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Procurement Planning</h1>
          <p className="mt-0.5 text-sm text-slate-500">Create and manage procurement requests</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600"
        >
          <Plus className="h-4 w-4" />
          New Procurement Request
        </button>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
          <Info className="h-4 w-4 text-emerald-500" />
        </div>
        <p className="text-sm text-slate-600">Approved requests are automatically published as projects.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-50 px-6 py-3">
          <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title or type" />
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project Title</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Deadline</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Created</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">Loading procurement requests...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState title="No procurement requests yet" subtitle="Create a new procurement request to get started." />
                </td>
              </tr>
            ) : (
              filtered.map((request) => (
                <tr key={request.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{request.project_title || request.title}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">₱{new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 }).format(request.budget || 0)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(request.deadline || request.submission_deadline)}</td>
                  <td className="px-6 py-4 text-sm"><StatusBadge status={request.procurement_type || request.category || "Goods"} /></td>
                  <td className="px-6 py-4 text-sm"><StatusBadge status={request.status} /></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(request.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {(getStatusLabel(request.status) === "Pending Review" || getStatusLabel(request.status) === "Revision Required") ? (
                        <button onClick={() => openEdit(request)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">Edit</button>
                      ) : null}
                      {getStatusLabel(request.status) === "Approved" ? (
                        <button onClick={() => onOpenProjects?.()} className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50">View Project</button>
                      ) : null}
                      {getStatusLabel(request.status) !== "Approved" ? (
                        <button onClick={() => confirmDelete(request.id)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </div>
        <p className="text-sm text-slate-600">Requests move to School Head review after creation.</p>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRequest ? "Edit Procurement Request" : "New Procurement Request"} size="lg">
        <form onSubmit={(event) => { event.preventDefault(); saveRequest(); }} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Project Title</span>
            <input
              type="text"
              value={form.projectTitle}
              onChange={(event) => setForm((prev) => ({ ...prev, projectTitle: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              placeholder="Enter project title"
            />
            {errors.projectTitle && <p className="mt-1 text-xs text-red-600">{errors.projectTitle}</p>}
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Budget (₱)</span>
              <input
                type="number"
                value={form.budget}
                onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                placeholder="Enter budget"
                min="0"
                step="1000"
              />
              {errors.budget && <p className="mt-1 text-xs text-red-600">{errors.budget}</p>}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Bidding Closes On</span>
              <input
                type="date"
                value={form.deadline}
                onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              />
              {errors.deadline && <p className="mt-1 text-xs text-red-600">{errors.deadline}</p>}
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Public Result Visible Until</span>
              <input
                type="date"
                value={form.publicResultExpiryDate}
                onChange={(event) => setForm((prev) => ({ ...prev, publicResultExpiryDate: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              />
              <p className="mt-1 text-xs text-slate-400">Set how long the awarded result stays visible to the public</p>
              {errors.publicResultExpiryDate && <p className="mt-1 text-xs text-red-600">{errors.publicResultExpiryDate}</p>}
            </label>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm text-slate-700">Bidding closes on {form.deadline || "—"}.</p>
            <p className="text-sm text-slate-700">Public result will be visible until {form.publicResultExpiryDate || "—"}.</p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Type</span>
            <select
              value={form.procurementType}
              onChange={(event) => setForm((prev) => ({ ...prev, procurementType: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
            >
              {PROCUREMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.procurementType && <p className="mt-1 text-xs text-red-600">{errors.procurementType}</p>}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Specifications</span>
            <textarea
              value={form.technicalSpecifications}
              onChange={(event) => setForm((prev) => ({ ...prev, technicalSpecifications: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
              placeholder="Describe technical specifications"
              rows="3"
            />
            {errors.technicalSpecifications && <p className="mt-1 text-xs text-red-600">{errors.technicalSpecifications}</p>}
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Schedule</span>
              <input
                type="text"
                value={form.procurementSchedule}
                onChange={(event) => setForm((prev) => ({ ...prev, procurementSchedule: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                placeholder="e.g., Q1 2026, Immediate, etc."
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Period</span>
              <input
                type="text"
                value={form.deliveryPeriod}
                onChange={(event) => setForm((prev) => ({ ...prev, deliveryPeriod: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/20"
                placeholder="e.g., 30 days, 6 months, etc."
              />
              {errors.deliveryPeriod && <p className="mt-1 text-xs text-red-600">{errors.deliveryPeriod}</p>}
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              isLoading={isSaving}
              loadingText="Saving..."
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              {editingRequest ? "Update Request" : "Create Request"}
            </LoadingButton>
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

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}