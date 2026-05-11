import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { STATUS, getStatusLabel, isProjectOpen, normalizeBid, normalizeBlockchainRecord, normalizeProject, normalizeStatusCode, normalizeSupplier } from "./procurementStatus";

function hex(buffer) {
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(message) {
  const encoded = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return hex(hash);
}

const StorageKey = "ep_procurement_state_v1";

function hydrateState(rawState) {
  const source = rawState && typeof rawState === "object" ? rawState : {};
  return {
    projects: Array.isArray(source.projects) ? source.projects.map(normalizeProject) : [],
    suppliers: Array.isArray(source.suppliers) ? source.suppliers.map(normalizeSupplier) : [],
    bids: Array.isArray(source.bids) ? source.bids.map(normalizeBid) : [],
    auditLogs: Array.isArray(source.auditLogs) ? source.auditLogs : [],
    blockchainRecords: Array.isArray(source.blockchainRecords) ? source.blockchainRecords.map(normalizeBlockchainRecord) : [],
  };
}

const demoState = hydrateState({
  projects: [
    {
      id: "PRJ-DEMO-001",
      project_title: "Procurement of 20 Desktop Computers",
      category: "Goods",
      quantity: 20,
      budget: 500000,
      delivery: "30 Days",
      procurement_method: "Public Bidding",
      status: STATUS.OPEN,
      created_at: "2026-05-10T08:00:00.000Z",
      bid_opening_date: "2026-05-11T08:00:00.000Z",
      submission_deadline: "2026-05-20T17:00:00.000Z",
    },
  ],
  suppliers: [
    {
      id: "SUP-DEMO-001",
      company_name: "Apex InfraTech",
      isVerified: true,
      status: "Verified",
      created_at: "2026-05-09T08:00:00.000Z",
      docs: ["business_permit.pdf", "philgeps.pdf"],
    },
    {
      id: "SUP-DEMO-002",
      company_name: "Blue Grid Works",
      isVerified: false,
      status: "Pending",
      created_at: "2026-05-10T09:00:00.000Z",
      docs: ["mayors_permit.pdf"],
    },
  ],
  bids: [
    {
      id: "BID-DEMO-001",
      projectId: "PRJ-DEMO-001",
      supplierId: "SUP-DEMO-001",
      amount: 480000,
      submitted_at: "2026-05-11T09:30:00.000Z",
      status: "Submitted",
      projectTitle: "Procurement of 20 Desktop Computers",
      supplierName: "Apex InfraTech",
      supplierCompany: "Apex InfraTech",
      proposal: "Deliver enterprise desktop units with warranty and deployment support.",
      technical_compliance: true,
      evaluation_remarks: "",
      rank: 1,
    },
    {
      id: "BID-DEMO-002",
      projectId: "PRJ-DEMO-001",
      supplierId: "SUP-DEMO-002",
      amount: 490000,
      submitted_at: "2026-05-11T10:15:00.000Z",
      status: "Submitted",
      projectTitle: "Procurement of 20 Desktop Computers",
      supplierName: "Blue Grid Works",
      supplierCompany: "Blue Grid Works",
      proposal: "Provide desktops with on-site setup and technical support.",
      technical_compliance: true,
      evaluation_remarks: "",
      rank: 2,
    },
  ],
  auditLogs: [
    {
      id: "audit-demo-001",
      user: "Admin",
      action: "Approved procurement request PRJ-DEMO-001",
      timestamp: "2026-05-10T10:00:00.000Z",
    },
    {
      id: "audit-demo-002",
      user: "Apex InfraTech",
      action: "Submitted bid BID-DEMO-001 for PRJ-DEMO-001",
      timestamp: "2026-05-11T09:30:00.000Z",
    },
  ],
  blockchainRecords: [],
});

function loadInitialState() {
  try {
    const raw = localStorage.getItem(StorageKey);
    return raw ? hydrateState(JSON.parse(raw)) : demoState;
  } catch {
    return demoState;
  }
}

function ensureProjectStatus(project, fallback = STATUS.DRAFT) {
  return normalizeStatusCode(project?.status ?? fallback);
}

export const ProcurementContext = createContext(null);

export function ProcurementProvider({ children }) {
  const [state, setState] = useState(() => loadInitialState());

  useEffect(() => {
    try {
      localStorage.setItem(StorageKey, JSON.stringify(state));
    } catch {
      // Ignore persistence failures in restricted browser modes.
    }
  }, [state]);

  const pushAudit = useCallback((user, action) => {
    const entry = {
      id: `audit-${Date.now()}`,
      user: user || "system",
      action,
      timestamp: new Date().toISOString(),
    };
    setState((current) => ({ ...current, auditLogs: [entry, ...current.auditLogs] }));
    return entry;
  }, []);

  const createRequest = useCallback((payload, createdBy) => {
    const deadline = payload.submission_deadline || payload.deadline || payload.procurement_schedule || null;
    const project = normalizeProject({
      id: `PRJ-${Date.now()}`,
      project_title: payload.project_title || payload.title || "Untitled Project",
      category: payload.category || payload.procurement_type || "General",
      quantity: payload.quantity || 1,
      budget: Number(payload.budget) || 0,
      delivery: payload.delivery || payload.delivery_period || "",
      procurement_method: payload.procurement_method || payload.procurementType || "",
      technical_specifications: payload.technical_specifications || payload.requirements || "",
      status: STATUS.PENDING_REVIEW,
      created_at: new Date().toISOString(),
      submission_deadline: deadline,
      bid_opening_date: payload.bid_opening_date || null,
    });
    setState((current) => ({ ...current, projects: [project, ...current.projects] }));
    pushAudit(createdBy, `Created procurement request ${project.id}`);
    return project;
  }, [pushAudit]);

  const updateProject = useCallback((projectId, patch = {}, actor = "Admin") => {
    let updatedProject = null;
    setState((current) => {
      const projects = current.projects.map((project) => {
        if (project.id !== projectId) return project;
        updatedProject = normalizeProject({
          ...project,
          ...patch,
          status: normalizeStatusCode(patch.status ?? project.status),
          project_title: patch.project_title || patch.title || project.project_title,
          technical_specifications: patch.technical_specifications || patch.requirements || project.technical_specifications,
          submission_deadline: patch.submission_deadline || patch.deadline || project.submission_deadline,
        });
        return updatedProject;
      });
      return { ...current, projects };
    });
    if (updatedProject) pushAudit(actor, `Updated procurement project ${projectId}`);
    return updatedProject;
  }, [pushAudit]);

  const deleteProject = useCallback((projectId, actor = "Admin") => {
    setState((current) => ({ ...current, projects: current.projects.filter((project) => project.id !== projectId) }));
    pushAudit(actor, `Deleted procurement project ${projectId}`);
  }, [pushAudit]);

  const approveRequest = useCallback((projectId, approver, approved = true) => {
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) => (
        project.id === projectId
          ? { ...project, status: approved ? STATUS.APPROVED : STATUS.REJECTED, approved_at: new Date().toISOString(), approved_by: approver }
          : project
      )),
    }));
    pushAudit(approver, `${approved ? "Approved" : "Rejected"} procurement request ${projectId}`);
  }, [pushAudit]);

  const publishProject = useCallback((projectId, actor, deadline) => {
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) => (
        project.id === projectId
          ? { ...project, status: STATUS.OPEN, published_at: new Date().toISOString(), submission_deadline: deadline || project.submission_deadline }
          : project
      )),
    }));
    pushAudit(actor, `Published project ${projectId} for bidding`);
  }, [pushAudit]);

  const registerSupplier = useCallback((supplier) => {
    const nextSupplier = normalizeSupplier({
      id: `SUP-${Date.now()}`,
      company_name: supplier.company_name || supplier.full_name || "Unnamed Supplier",
      full_name: supplier.full_name || supplier.company_name || "Unnamed Supplier",
      email: supplier.email || "",
      phone: supplier.phone || "",
      business_type: supplier.business_type || "",
      business_permit_number: supplier.business_permit_number || "",
      docs: supplier.docs || [],
      isVerified: false,
      status: "Pending",
      created_at: new Date().toISOString(),
    });
    setState((current) => ({ ...current, suppliers: [nextSupplier, ...current.suppliers] }));
    pushAudit(nextSupplier.company_name, `Registered supplier ${nextSupplier.id}`);
    return nextSupplier;
  }, [pushAudit]);

  const updateSupplierStatus = useCallback((supplierId, status, admin) => {
    const isVerified = String(status).toLowerCase() === "verified" || status === true;
    setState((current) => ({
      ...current,
      suppliers: current.suppliers.map((supplier) => (
        supplier.id === supplierId ? { ...supplier, isVerified, status: isVerified ? "Verified" : "Rejected", status_display: isVerified ? "Verified" : "Rejected" } : supplier
      )),
    }));
    pushAudit(admin, `${isVerified ? "Verified" : "Rejected"} supplier ${supplierId}`);
  }, [pushAudit]);

  const updateBid = useCallback((bidId, patch = {}, actor = "Admin") => {
    setState((current) => ({
      ...current,
      bids: current.bids.map((bid) => {
        if (bid.id !== bidId) return bid;
        return normalizeBid({
          ...bid,
          status: patch.status || bid.status,
          technical_compliance: typeof patch.technical_compliance === "boolean" ? patch.technical_compliance : bid.technical_compliance,
          evaluation_remarks: typeof patch.evaluation_remarks === "string" ? patch.evaluation_remarks : bid.evaluation_remarks,
          rank: typeof patch.rank === "number" ? patch.rank : bid.rank,
          recorded: typeof patch.recorded === "boolean" ? patch.recorded : bid.recorded,
          blockchainHash: patch.blockchainHash || bid.blockchainHash,
        });
      }),
    }));
    pushAudit(actor, `Updated bid ${bidId}`);
  }, [pushAudit]);

  const submitBid = useCallback((projectId, supplierId, amount, payload = {}) => {
    const supplier = state.suppliers.find((item) => item.id === supplierId);
    const project = state.projects.find((item) => item.id === projectId);

    if (!supplier || !supplier.isVerified) throw new Error("Supplier not verified");
    if (!project || !isProjectOpen(project)) throw new Error("Project not open for bidding");
    if (project.submission_deadline && new Date() > new Date(project.submission_deadline)) throw new Error("Bidding period has ended for this project");

    const duplicate = state.bids.find((bid) => bid.projectId === projectId && bid.supplierId === supplierId);
    if (duplicate) throw new Error("Duplicate bid is not allowed for the same project");

    const bid = normalizeBid({
      id: `BID-${Date.now()}`,
      projectId,
      supplierId,
      amount: Number(amount),
      submitted_at: new Date().toISOString(),
      status: "Submitted",
      encrypted: true,
      proposal: payload.proposal || "",
      quotation_document: payload.quotationDocument || payload.quotation_document || "",
      technical_document: payload.technicalDocument || payload.technical_document || "",
      supplierName: supplier.company_name,
      supplierCompany: supplier.company_name,
      projectTitle: project.project_title,
      projectName: project.project_title,
      technical_compliance: true,
      evaluation_remarks: "",
    });

    setState((current) => ({ ...current, bids: [bid, ...current.bids] }));
    pushAudit(supplier.company_name, `Submitted bid ${bid.id} for ${projectId}`);
    return bid;
  }, [pushAudit, state.bids, state.projects, state.suppliers]);

  const closeBidding = useCallback((projectId, actor) => {
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) => (project.id === projectId ? { ...project, status: STATUS.CLOSED, closed_at: new Date().toISOString() } : project)),
    }));
    pushAudit(actor, `Closed bidding for ${projectId}`);
  }, [pushAudit]);

  const evaluateAndRank = useCallback((projectId) => {
    const ranked = state.bids.filter((bid) => bid.projectId === projectId).slice().sort((left, right) => left.amount - right.amount);
    return ranked.map((bid, index) => ({ ...normalizeBid(bid), rank: index + 1 }));
  }, [state.bids]);

  const selectWinner = useCallback(async (projectId, bidId, actor) => {
    const bid = state.bids.find((item) => item.id === bidId);
    const project = state.projects.find((item) => item.id === projectId);
    if (!bid) throw new Error("Bid not found");
    if (!project) throw new Error("Project not found");

    const payload = {
      projectId,
      project_title: project.project_title,
      project_ref_id: project.id,
      winner_name: bid.supplierName,
      winner_company: bid.supplierCompany,
      bid_amount: bid.amount,
      timestamp: new Date().toISOString(),
    };
    const hash = await sha256Hex(JSON.stringify(payload));
    const record = normalizeBlockchainRecord({ ...payload, hash, recorded_at: payload.timestamp });

    setState((current) => ({
      ...current,
      blockchainRecords: [record, ...current.blockchainRecords],
      projects: current.projects.map((item) => (
        item.id === projectId
          ? {
              ...item,
              status: STATUS.AWARDED,
              awarded_bid: bidId,
              awarded_at: new Date().toISOString(),
              award_documents: {
                resolution: `RES-${projectId}`,
                noa: `NOA-${projectId}`,
                ntp: `NTP-${projectId}`,
              },
            }
          : item
      )),
      bids: current.bids.map((item) => {
        if (item.projectId !== projectId) return item;
        if (item.id === bidId) return { ...item, status: "Selected", recorded: true, blockchainHash: hash, rank: 1 };
        return { ...item, status: "Rejected" };
      }),
    }));

    pushAudit(actor, `Selected winner ${bid.supplierId} for ${projectId}`);
    return record;
  }, [pushAudit, state.bids, state.projects]);

  const verifyHash = useCallback((hash) => state.blockchainRecords.find((record) => record.hash === hash) || null, [state.blockchainRecords]);

  const getProjectSupplierData = useCallback((projectId) => {
    const project = state.projects.find((item) => item.id === projectId) || null;
    const bids = state.bids.filter((bid) => bid.projectId === projectId).slice().sort((left, right) => left.amount - right.amount).map((bid, index) => ({ ...normalizeBid(bid), rank: index + 1 }));
    const winnerBid = bids[0] || null;
    const supplier = winnerBid ? state.suppliers.find((item) => item.id === winnerBid.supplierId) || null : null;
    return { project, bids, winnerBid, supplier };
  }, [state.projects, state.bids, state.suppliers]);

  const getPublicRecords = useCallback(() => {
    return state.blockchainRecords.map((record) => ({
      project_id: record.projectId,
      project_title: record.projectTitle,
      winning_bid_amount: record.winning_bid_amount,
      award_date: record.recordedAt || record.recorded_at || record.timestamp,
      winning_supplier: record.winner_name,
      winning_company: record.winner_company,
      hash: record.hash,
    }));
  }, [state.blockchainRecords]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = new Date();
      const overdue = state.projects.filter((project) => ensureProjectStatus(project) === STATUS.OPEN && project.submission_deadline && now > new Date(project.submission_deadline));
      if (!overdue.length) return;

      setState((current) => ({
        ...current,
        projects: current.projects.map((project) => {
          if (ensureProjectStatus(project) !== STATUS.OPEN || !project.submission_deadline) return project;
          if (now <= new Date(project.submission_deadline)) return project;
          return { ...project, status: STATUS.CLOSED, closed_at: new Date().toISOString() };
        }),
      }));

      overdue.forEach((project) => pushAudit("System", `Auto-closed bidding for ${project.id}`));
    }, 60000);

    return () => window.clearInterval(interval);
  }, [pushAudit, state.projects]);

  const value = useMemo(() => ({
    ...state,
    createRequest,
    updateProject,
    deleteProject,
    approveRequest,
    publishProject,
    registerSupplier,
    updateSupplierStatus,
    updateBid,
    submitBid,
    closeBidding,
    evaluateAndRank,
    selectWinner,
    verifyHash,
    getProjectSupplierData,
    getPublicRecords,
    pushAudit,
    stats: {
      totalProjects: state.projects.length,
      totalBids: state.bids.length,
      activeBidding: state.projects.filter((project) => ensureProjectStatus(project) === STATUS.OPEN).length,
      awardedContracts: state.projects.filter((project) => ensureProjectStatus(project) === STATUS.AWARDED).length,
      totalAwardedAmount: state.blockchainRecords.reduce((sum, record) => sum + Number(record.winning_bid_amount || 0), 0),
    },
  }), [approveRequest, closeBidding, createRequest, deleteProject, evaluateAndRank, getProjectSupplierData, getPublicRecords, publishProject, pushAudit, registerSupplier, selectWinner, state.blockchainRecords, state.bids.length, state.projects, submitBid, updateBid, updateProject, updateSupplierStatus, verifyHash]);

  return <ProcurementContext.Provider value={value}>{children}</ProcurementContext.Provider>;
}

export default ProcurementProvider;
