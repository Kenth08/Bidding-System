import { Archive, CheckCircle, Clock, Eye, History, Lock, Megaphone, Pencil, Trash2, CircleAlert, FolderOpen, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import EmptyState from "../../components/shared/EmptyState";
import Modal from "../../components/shared/Modal";
import SearchBar from "../../components/shared/SearchBar";
import { auditLogAPI, bidsAPI, blockchainAPI, projectsAPI } from "../../services/api";
import LoadingButton from "../../components/ui/LoadingButton";
import Toast from "../../components/shared/Toast";
import { useData } from "../../context/DataContext";

const INITIAL_FORM = { title: "", budget: "", deadline: "", requirements: "" };
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PUBLISHED_STATUSES = new Set(["active", "closed", "awarded"]);

function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "—";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) return value;
  return dateValue.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "—";
  const dateValue = new Date(value);
  if (Number.isNaN(dateValue.getTime())) return value;
  return dateValue.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatScheduleLabel(project) {
  const statusKey = getProjectStatusKey(project);
  const scheduleDate = project?.procurement_schedule ? new Date(project.procurement_schedule) : null;
  if (statusKey === "active") {
    return `Published on: ${formatDate(project.published_at || project.updated_at)}`;
  }
  if (scheduleDate && !Number.isNaN(scheduleDate.getTime())) {
    const today = startOfToday();
    if (scheduleDate.toDateString() === today.toDateString()) {
      return "Going live today";
    }
    return `Goes live: ${formatDate(project.procurement_schedule)}`;
  }
  return "Goes live: —";
}

function getProjectStatusKey(project) {
  return String(project?.status || "draft").toLowerCase();
}

function isPosted(project) {
  return ["active", "awarded"].includes(getProjectStatusKey(project));
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getTiming(project) {
  const deadline = project?.deadline ? new Date(project.deadline) : null;
  if (!deadline || Number.isNaN(deadline.getTime())) {
    return { isOpen: false, isClosed: true, daysRemaining: null, label: "Closed", closesLabel: "Bidding closes: —" };
  }

  const diffDays = Math.ceil((deadline.getTime() - startOfToday().getTime()) / MS_PER_DAY);
  const closesLabel = `Bidding closes: ${formatDate(project.deadline)}`;

  if (diffDays < 0) {
    return { isOpen: false, isClosed: true, daysRemaining: diffDays, label: "Closed", closesLabel };
  }
  if (diffDays === 0) {
    return { isOpen: true, isClosed: false, daysRemaining: 0, label: "Closes Today", closesLabel };
  }
  return { isOpen: true, isClosed: false, daysRemaining: diffDays, label: `${diffDays} days left`, closesLabel };
}

function ProjectStatusPill({ status }) {
  const statusKey = String(status || "draft").toLowerCase();
  const config = {
    draft: { label: "Draft", className: "border-slate-200 bg-slate-100 text-slate-600", icon: FolderOpen },
    active: { label: "Open for Bidding", className: "border-emerald-100 bg-emerald-50 text-emerald-700", icon: Megaphone },
    closed: { label: "Closed", className: "border-red-100 bg-red-50 text-red-500", icon: CircleAlert },
    awarded: { label: "Awarded", className: "border-blue-100 bg-blue-50 text-blue-600", icon: CheckCircle },
  }[statusKey] || { label: statusKey || "Draft", className: "border-slate-200 bg-slate-100 text-slate-600", icon: FolderOpen };

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${config.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
      {PUBLISHED_STATUSES.has(statusKey) ? <span className="ml-1" title="Published project">🔒</span> : null}
    </span>
  );
}

function safeStr(val) {
  return (val ?? "").toString().toLowerCase();
}

export default function AdminProjects({ onViewBids, isLoading }) {
  const { cache, loadProjects, updateItem, removeItem, refresh } = useData();
  const [projects, setProjects] = useState(() => cache.projects || []);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [archiveModal, setArchiveModal] = useState({ open: false, project: null });
  const [archiveReason, setArchiveReason] = useState("");
  const [archiving, setArchiving] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [publishingProject, setPublishingProject] = useState(null);
  const [historyDrawer, setHistoryDrawer] = useState({ open: false, project: null });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyViewProjects, setHistoryViewProjects] = useState([]);
  const [historyViewLoading, setHistoryViewLoading] = useState(false);
  const [historyViewSearch, setHistoryViewSearch] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!Array.isArray(cache.projects)) {
      loadProjects();
    }
  }, [cache.projects, loadProjects]);

  useEffect(() => {
    if (Array.isArray(cache.projects)) {
      setProjects(cache.projects);
    }
  }, [cache.projects]);

  async function fetchHistory() {
    setHistoryViewLoading(true);
    try {
      const response = await projectsAPI.getHistory();
      setHistoryViewProjects(response.data.results || response.data || []);
    } catch (error) {
      console.error("Failed to load history", error);
      setHistoryViewProjects([]);
      setToast({ message: "Failed to load project history.", type: "error" });
    } finally {
      setHistoryViewLoading(false);
    }
  }

  function handleToggleHistory() {
    if (!showHistory) fetchHistory();
    setShowHistory((previous) => !previous);
  }

  async function openGlobalHistory() {
    setShowGlobalHistory(true);
    setGlobalHistoryLoading(true);
    setGlobalHistoryItems([]);

    try {
      const [auditResponse, bidsResponse, blockchainResponse, projectsResponse] = await Promise.all([
        auditLogAPI.getAll(),
        bidsAPI.getAll(),
        blockchainAPI.getAll(),
        projectsAPI.getAll(),
      ]);

      const auditLogs = auditResponse.data.results || auditResponse.data || [];
      const allBids = bidsResponse.data.results || bidsResponse.data || [];
      const allBlockchain = blockchainResponse.data.results || blockchainResponse.data || [];
      const allProjects = projectsResponse.data.results || projectsResponse.data || [];

      const projectsById = {};
      allProjects.forEach((p) => {
        projectsById[String(p.id)] = p;
      });

      const items = [];

      // Audit logs
      auditLogs.forEach((entry) => {
        const projectId = String(entry.resource_type) === "project" ? String(entry.resource_id) : null;
        const projectName = projectId ? projectsById[projectId]?.title || "Unknown Project" : (entry.resource_meta?.project_name || "Unknown Project");
        items.push({
          action: entry.action || "Action",
          projectName,
          performedBy: entry.user_name || entry.user_email || "System",
          timestamp: entry.created_at,
          detail: entry.description || "",
          type: entry.action || "AUDIT",
        });
      });

      // Bids
      allBids.forEach((bid) => {
        const projectId = String(bid.project || bid.projectId || bid.project_id || "");
        const projectName = projectsById[projectId]?.title || bid.projectTitle || bid.project_name || "Unknown Project";
        items.push({
          action: "Bid received",
          projectName,
          performedBy: bid.supplierName || bid.supplier_name || bid.company_name || "Supplier",
          timestamp: bid.submitted_at || bid.submittedAt || bid.created_at,
          detail: `${formatPeso(bid.bidAmount || bid.bid_amount || bid.amount || 0)} submitted`,
          type: "BID",
        });
      });

      // Blockchain records
      allBlockchain.forEach((rec) => {
        const projectId = String(rec.project || rec.projectId || rec.project_id || "");
        const projectName = projectsById[projectId]?.title || rec.project_title || "Unknown Project";
        items.push({
          action: "Blockchain recorded",
          projectName,
          performedBy: rec.winner_name || rec.winner || "System",
          timestamp: rec.recordedAt || rec.recorded_at || rec.created_at,
          detail: `Recorded blockchain entry`,
          type: "BLOCKCHAIN",
        });
      });

      items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      setGlobalHistoryItems(items);
    } catch (error) {
      console.error("Failed to load global history", error);
      setGlobalHistoryItems([]);
      setToast({ message: "Failed to load project history.", type: "error" });
    } finally {
      setGlobalHistoryLoading(false);
    }
  }

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const projectStatus = safeStr(project.status || "draft");
      const timing = getTiming(project);
      const effectiveStatus = projectStatus === "active" && timing.isClosed ? "closed" : projectStatus;
      const filterKey = filter === "Open for Bidding" ? "active" : safeStr(filter).replace(/\s+/g, "_");
      const matchesFilter = filter === "All" ? true : safeStr(effectiveStatus) === filterKey;
      const matchesSearch =
        safeStr(project.title).includes(safeStr(search)) ||
        safeStr(project.procurement_type).includes(safeStr(search));
      return matchesFilter && matchesSearch;
    });
  }, [filter, projects, search, now]);

  if (false) {
    return <div className="text-sm text-slate-500">Loading projects...</div>;
  }

  

  function openEdit(project) {
    setEditingProject(project);
    setForm({
      title: project.title || "",
      budget: String(project.budget || ""),
      deadline: project.deadline || "",
      requirements: project.requirements || "",
    });
    setErrors({});
    setShowModal(true);
  }

  function openDetails(project) {
    setSelectedProject(project);
  }

  function validateForm() {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Project title is required.";
    if (!form.budget || Number(form.budget) <= 0) nextErrors.budget = "Budget is required.";
    if (!form.deadline) nextErrors.deadline = "Deadline is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function saveProject() {
    if (!editingProject || !validateForm()) return;

    setIsSaving(true);
    try {
      const response = await projectsAPI.update(editingProject.id, {
        title: form.title.trim(),
        budget: Number(form.budget),
        deadline: form.deadline,
        requirements: form.requirements.trim(),
      });
      const updatedProject = response.data;
      setProjects((prev) => prev.map((project) => (project.id === editingProject.id ? { ...project, ...updatedProject } : project)));
      updateItem("projects", editingProject.id, updatedProject);
      setShowModal(false);
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to save project. Please try again.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingId) return;
    try {
      await projectsAPI.delete(deletingId);
      removeItem("projects", deletingId);
      await loadProjects();
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to delete project.", type: "error" });
    } finally {
      setDeletingId(null);
      setShowConfirm(false);
    }
  }

  async function handleArchive() {
    if (!archiveModal.project) return;

    setArchiving(archiveModal.project.id);
    try {
      const response = await projectsAPI.archive(archiveModal.project.id, archiveReason || "Archived by admin");
      const archivedProject = response.data;
      updateItem("projects", archiveModal.project.id, archivedProject || { status: "archived", archived_reason: archiveReason || "Archived by admin" });
      await loadProjects();
      setArchiveModal({ open: false, project: null });
      setArchiveReason("");
      setToast({ message: `"${archiveModal.project.title}" moved to history.`, type: "success" });
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to archive project.", type: "error" });
    } finally {
      setArchiving(null);
    }
  }

  async function handlePublish() {
    if (!publishingProject) return;

    try {
      const response = await projectsAPI.publish(publishingProject.id);
      updateItem("projects", publishingProject.id, response.data || { status: "active" });
      await loadProjects();
      setToast({ message: `"${publishingProject.title}" is now active.`, type: "success" });
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to publish project.", type: "error" });
    } finally {
      setPublishingProject(null);
      setShowPublishConfirm(false);
    }
  }

  async function openHistory(project) {
    setHistoryDrawer({ open: true, project });
    setHistoryLoading(true);
    setHistoryItems([]);

    try {
      const [auditResponse, bidsResponse, blockchainResponse] = await Promise.all([
        auditLogAPI.getAll(),
        bidsAPI.getAll(),
        blockchainAPI.getAll(),
      ]);

      const auditLogs = auditResponse.data.results || auditResponse.data || [];
      const allBids = bidsResponse.data.results || bidsResponse.data || [];
      const allBlockchainRecords = blockchainResponse.data.results || blockchainResponse.data || [];
      const projectId = String(project.id);
      const procurementId = String(project.procurement_request || project.procurement_request_details?.id || "");
      const bidsForProject = allBids.filter((bid) => String(bid.project || bid.projectId || bid.project_id || "") === projectId);
      const blockchainForProject = allBlockchainRecords.filter((record) => String(record.project || record.projectId || record.project_id || "") === projectId);
      const createdLog = auditLogs.find((entry) => entry.resource_type === "project" && String(entry.resource_id) === projectId && entry.action === "CREATE");
      const procurementLog = procurementId
        ? auditLogs.find((entry) => entry.resource_type === "procurement" && String(entry.resource_id) === procurementId && entry.action === "APPROVE")
        : null;
      const publishedLog = auditLogs.find((entry) => entry.resource_type === "project" && String(entry.resource_id) === projectId && entry.action === "UPDATE" && String(entry.description || "").toLowerCase().includes("published project"));
      const winningBid = bidsForProject.find((bid) => String(bid.status || "").toLowerCase() === "won");
      const winnerLog = winningBid
        ? auditLogs.find((entry) => entry.resource_type === "bid" && String(entry.resource_id) === String(winningBid.id) && entry.action === "SELECT_WINNER")
        : null;
      const blockchainRecord = blockchainForProject[0] || null;
      const blockchainLog = blockchainRecord
        ? auditLogs.find((entry) => entry.resource_type === "blockchain" && String(entry.resource_id) === String(blockchainRecord.id) && entry.action === "RECORD_BLOCKCHAIN")
        : null;

      const items = [];

      if (createdLog) {
        items.push({
          action: "Project created",
          performedBy: createdLog.user_name || createdLog.user_email || "System",
          timestamp: createdLog.created_at,
          detail: `Draft project created for ${project.title}`,
        });
      }

      if (procurementLog) {
        items.push({
          action: "Procurement request approved",
          performedBy: procurementLog.user_name || procurementLog.user_email || "System",
          timestamp: procurementLog.created_at,
          detail: procurementLog.description || "Approved by School Head",
        });
      }

      if (publishedLog) {
        items.push({
          action: "Project published / went live",
          performedBy: publishedLog.user_name || publishedLog.user_email || "System",
          timestamp: publishedLog.created_at,
          detail: publishedLog.description || "Published by admin",
        });
      }

      bidsForProject
        .slice()
        .sort((left, right) => new Date(left.submitted_at || left.submittedAt || 0) - new Date(right.submitted_at || right.submittedAt || 0))
        .forEach((bid) => {
          items.push({
            action: "Bid received",
            performedBy: bid.supplierName || bid.supplier_name || bid.company_name || "Supplier",
            timestamp: bid.submitted_at || bid.submittedAt,
            detail: `${formatPeso(bid.bidAmount || bid.bid_amount || bid.amount || 0)} submitted`,
          });
        });

      if (winnerLog && winningBid) {
        items.push({
          action: "Winner selected",
          performedBy: winnerLog.user_name || winnerLog.user_email || "Admin",
          timestamp: winnerLog.created_at,
          detail: `${winningBid.supplierName || winningBid.supplier_name || winningBid.company_name || "Supplier"} won with ${formatPeso(winningBid.bidAmount || winningBid.bid_amount || winningBid.amount || 0)}`,
        });
      } else if (winningBid) {
        items.push({
          action: "Winner selected",
          performedBy: winningBid.supplierName || winningBid.supplier_name || winningBid.company_name || "Supplier",
          timestamp: winningBid.updated_at || winningBid.submitted_at || winningBid.submittedAt,
          detail: `${formatPeso(winningBid.bidAmount || winningBid.bid_amount || winningBid.amount || 0)} selected as winner`,
        });
      }

      if (blockchainLog && blockchainRecord) {
        items.push({
          action: "Blockchain recorded",
          performedBy: blockchainLog.user_name || blockchainLog.user_email || "Admin",
          timestamp: blockchainLog.created_at,
          detail: `Recorded at ${formatDateTime(blockchainRecord.recordedAt || blockchainRecord.recorded_at)}`,
        });
      } else if (blockchainRecord) {
        items.push({
          action: "Blockchain recorded",
          performedBy: blockchainRecord.winner_name || blockchainRecord.winner || "System",
          timestamp: blockchainRecord.recordedAt || blockchainRecord.recorded_at,
          detail: `Recorded blockchain entry for ${project.title}`,
        });
      }

      items.sort((left, right) => new Date(right.timestamp || 0) - new Date(left.timestamp || 0));
      setHistoryItems(items);
    } catch (error) {
      console.error("Failed to load project history", error);
      setHistoryItems([]);
      setToast({ message: "Failed to load project history.", type: "error" });
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Project Management</h1>
          <p className="mt-0.5 text-sm text-slate-500">Approved procurement projects published for bidding</p>
        </div>
        <div>
          <button
            onClick={handleToggleHistory}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
              showHistory
                ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <Clock className="w-4 h-4" />
            {showHistory ? "Back to Active Projects" : "View History"}
          </button>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
          <Megaphone className="h-4 w-4 text-emerald-500" />
        </div>
        <p className="text-sm text-slate-600">
          Projects are created as drafts when the School Head approves a procurement request. Publish a draft project when it is ready for suppliers.
        </p>
      </div>

      {showHistory ? (
        <HistoryTable projects={historyViewProjects} loading={historyViewLoading} search={historyViewSearch} setSearch={setHistoryViewSearch} onRestore={async (project) => {
          try {
            await projectsAPI.unarchive(project.id);
            setHistoryViewProjects((previous) => previous.filter((item) => item.id !== project.id));
            await refresh("projects");
            await loadProjects();
            setToast({ message: `"${project.title}" restored to active projects.`, type: "success" });
          } catch (error) {
            console.error(error);
            setToast({ message: "Failed to restore project.", type: "error" });
          }
        }} />
      ) : (
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="flex gap-4 border-b border-slate-50 px-6 pt-4">
          {["All", "Draft", "Open for Bidding", "Closed", "Awarded"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`border-b-2 pb-3 text-sm font-medium ${filter === tab ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="border-b border-slate-50 px-6 py-3">
          <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by project title" />
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Deadline</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Requirements</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {false ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">Loading projects...</td>
              </tr>
            ) : filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={FolderOpen} title="No projects found" subtitle="Try a different filter or search keyword." />
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => {
                const timing = getTiming(project);
                const projectStatus = String(project.status || "draft").toLowerCase();
                const effectiveStatus = projectStatus === "active" && timing.isClosed ? "closed" : projectStatus;
                const posted = ["active", "awarded"].includes(effectiveStatus);
                return (
                  <tr key={project.id} className="group transition-colors hover:bg-slate-50/50" title={posted ? "Posted projects cannot be edited or deleted" : undefined}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{project.title}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatPeso(project.budget)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div>
                        <p>{formatScheduleLabel(project)}</p>
                        <p>{timing.closesLabel}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{timing.label}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{project.requirements?.length > 40 ? `${project.requirements.slice(0, 40)}...` : project.requirements}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <ProjectStatusPill status={effectiveStatus} />
                        <p className="text-xs text-slate-400">{project.bid_count || 0} Bids Received</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openDetails(project)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="View details">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => onViewBids?.(project.id)} className="rounded-lg p-2 text-emerald-600 hover:bg-slate-100" title="View bids">
                          <Megaphone className="h-4 w-4" />
                        </button>
                        <button onClick={() => setArchiveModal({ open: true, project })} className="rounded-lg p-2 text-amber-500 hover:bg-slate-100" title="Archive project" disabled={archiving === project.id}>
                          <Archive className="h-4 w-4" />
                        </button>
                        {posted ? (
                          <>
                            <div title="Cannot edit — project is posted" className="rounded-lg p-2 text-slate-300">
                              <Lock className="h-4 w-4" />
                            </div>
                            <div title="Cannot delete — project is posted" className="rounded-lg p-2 text-slate-300">
                              <Trash2 className="h-4 w-4" />
                            </div>
                          </>
                        ) : (
                          <>
                            <button onClick={() => openEdit(project)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Edit project">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => { setDeletingId(project.id); setShowConfirm(true); }} className="rounded-lg p-2 text-red-500 hover:bg-slate-100" title="Delete project">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      {historyDrawer.open ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setHistoryDrawer({ open: false, project: null })} aria-hidden="true" />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-slate-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Project History</h3>
                <p className="mt-0.5 text-xs text-slate-400">{historyDrawer.project?.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryDrawer({ open: false, project: null })}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100"
                aria-label="Close project history"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-800">{historyDrawer.project?.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">Read-only project activity timeline</p>
              </div>

              {historyLoading ? (
                <div className="rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-500">Loading history...</div>
              ) : historyItems.length === 0 ? (
                <EmptyState icon={Clock} title="No history available" subtitle="Activity will appear here after the project is approved, published, awarded, or recorded." />
              ) : (
                <div className="space-y-3">
                  {historyItems.map((item, index) => (
                    <div key={`${item.action}-${index}`} className="rounded-xl border border-slate-100 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-800">{item.action}</p>
                            <p className="text-xs text-slate-400">{formatDateTime(item.timestamp)}</p>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">Performed by {item.performedBy || "System"}</p>
                          {item.detail ? <p className="mt-2 text-sm text-slate-600">{item.detail}</p> : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Edit Project" subtitle="Manage project details" size="lg">
          <div className="grid gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Project Title <span className="text-red-400">*</span></label>
            <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm" />
            {errors.title ? <p className="mt-1 text-xs text-red-500">{errors.title}</p> : null}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Budget P <span className="text-red-400">*</span></label>
              <input type="number" value={form.budget} onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm" />
              {errors.budget ? <p className="mt-1 text-xs text-red-500">{errors.budget}</p> : null}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Deadline <span className="text-red-400">*</span></label>
              <input type="date" value={form.deadline} onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm" />
              {errors.deadline ? <p className="mt-1 text-xs text-red-500">{errors.deadline}</p> : null}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Requirements</label>
            <textarea rows={4} value={form.requirements} onChange={(event) => setForm((prev) => ({ ...prev, requirements: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600">Cancel</button>
            <LoadingButton
              onClick={saveProject}
              isLoading={isSaving}
              loadingText="Saving..."
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Save
            </LoadingButton>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(selectedProject)} onClose={() => setSelectedProject(null)} title={selectedProject?.title || "Project Details"} subtitle="Project and procurement request details" size="lg">
        {selectedProject ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project Title</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Status</p>
                <div className="mt-1"><ProjectStatusPill status={String(selectedProject.status || "draft").toLowerCase() === "active" && getTiming(selectedProject).isClosed ? "closed" : selectedProject.status} /></div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bidding Deadline</p>
                <p className="mt-1 text-sm text-slate-800">{getTiming(selectedProject).closesLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bids Received</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.bid_count || 0} bids received</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</p>
                <p className="mt-1 text-sm text-slate-800">{formatPeso(selectedProject.budget)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Type</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.procurement_type || selectedProject.procurement_request_details?.procurement_type || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Delivery Period</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.delivery_period || selectedProject.procurement_request_details?.delivery_period || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Schedule</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.procurement_request_details?.procurement_schedule || "—"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Specifications</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{selectedProject.technical_specifications || selectedProject.procurement_request_details?.technical_specifications || "—"}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requirements</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{selectedProject.requirements || selectedProject.procurement_request_details?.technical_specifications || "—"}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reviewed By</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.procurement_request_details?.reviewed_by_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reviewed At</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.procurement_request_details?.reviewed_at ? formatDate(selectedProject.procurement_request_details.reviewed_at) : "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review Remarks</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.procurement_request_details?.review_remarks || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revision Notes</p>
                <p className="mt-1 text-sm text-slate-800">{selectedProject.procurement_request_details?.revision_notes || "—"}</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Procurement Request Details</p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Request Title</p>
                  <p className="text-sm text-slate-800">{selectedProject.procurement_request_details?.title || selectedProject.title}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Request Status</p>
                  <p className="text-sm text-slate-800">{selectedProject.procurement_request_details?.status || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created By</p>
                  <p className="text-sm text-slate-800">{selectedProject.procurement_request_details?.created_by_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created At</p>
                  <p className="text-sm text-slate-800">{selectedProject.procurement_request_details?.created_at ? formatDate(selectedProject.procurement_request_details.created_at) : "—"}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setSelectedProject(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
                Close
              </button>
              <button onClick={() => onViewBids?.(selectedProject.id)} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
                View Bids
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={archiveModal.open}
        onClose={() => { setArchiveModal({ open: false, project: null }); setArchiveReason(""); }}
        title="Archive Project"
        subtitle="Move this project to history"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <Archive className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-sm text-amber-700">
              This will hide <strong>"{archiveModal.project?.title}"</strong> from active projects and supplier browsing. You can restore it later from Project History.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Archive Reason (optional)</label>
            <input
              type="text"
              value={archiveReason}
              onChange={(event) => setArchiveReason(event.target.value)}
              placeholder="e.g. Project completed, outdated, replaced by a newer request"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={() => { setArchiveModal({ open: false, project: null }); setArchiveReason(""); }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleArchive}
              disabled={Boolean(archiving)}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:bg-amber-300"
            >
              <Archive className="h-4 w-4" />
              Move to History
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Project?"
        message="This action cannot be undone. All associated bids will also be removed."
        confirmLabel="Delete"
        confirmVariant="danger"
        isConfirmLoading={Boolean(deletingId)}
        confirmLoadingText="Deleting..."
      />

      <Toast message={toast?.message || ""} type={toast?.type || "success"} isVisible={Boolean(toast)} onClose={() => setToast(null)} />
    </div>
  );
}

function HistoryTable({ projects, loading, search, setSearch, onRestore }) {
  const filtered = projects.filter((project) => {
    const query = safeStr(search);
    return [project.title, project.status, project.procurement_type, project.archived_reason].some((value) => safeStr(value).includes(query));
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-3.5">
        <Archive className="h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-sm text-amber-700">Archived projects are hidden from suppliers. Restore a project to make it visible again.</p>
        <span className="ml-auto shrink-0 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-600">{projects.length} archived</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="border-b border-slate-50 px-6 py-3">
          <SearchBar value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search archived projects..." />
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Final Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Archived On</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-sm text-slate-500">Loading archived projects...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState icon={Archive} title="No archived projects" subtitle="Projects you archive will appear here." />
                </td>
              </tr>
            ) : (
              filtered.map((project) => (
                <tr key={project.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-800">{project.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{project.bid_count || 0} bids</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{formatPeso(project.budget)}</td>
                  <td className="px-6 py-4">
                    <ProjectStatusPill status={project.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(project.archived_at)}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-[140px] truncate">{project.archived_reason || "—"}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => onRestore(project)} className="flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50">
                      <RotateCcw className="h-3.5 w-3.5" /> Restore
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
