export const STATUS = {
  DRAFT: 0,
  PENDING_REVIEW: 1,
  APPROVED: 2,
  OPEN: 3,
  CLOSED: 4,
  AWARDED: 5,
  REJECTED: 6,
};

export const STATUS_TEXT = {
  [STATUS.DRAFT]: "Draft",
  [STATUS.PENDING_REVIEW]: "Pending Review",
  [STATUS.APPROVED]: "Approved",
  [STATUS.OPEN]: "Active",
  [STATUS.CLOSED]: "Closed",
  [STATUS.AWARDED]: "Awarded",
  [STATUS.REJECTED]: "Rejected",
};

export function normalizeStatusCode(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value || "").trim().toLowerCase();
  if (!text) return STATUS.DRAFT;
  if (text === "draft") return STATUS.DRAFT;
  if (text === "pending" || text === "pending review" || text === "pending_review") return STATUS.PENDING_REVIEW;
  if (text === "approved") return STATUS.APPROVED;
  if (text === "open" || text === "active" || text === "open for bidding" || text === "open_for_bidding") return STATUS.OPEN;
  if (text === "closed" || text === "closed for evaluation" || text === "closed_for_evaluation") return STATUS.CLOSED;
  if (text === "awarded" || text === "selected" || text === "won") return STATUS.AWARDED;
  if (text === "rejected" || text === "reject") return STATUS.REJECTED;
  return STATUS.DRAFT;
}

export function getStatusLabel(value) {
  return STATUS_TEXT[normalizeStatusCode(value)] || "Draft";
}

export function normalizeProject(project = {}) {
  const status = normalizeStatusCode(project.status);
  const deadline = project.submission_deadline || project.deadline || project.bid_opening_date || null;
  return {
    ...project,
    id: project.id || `PRJ-${Date.now()}`,
    title: project.project_title || project.title || "Untitled Project",
    project_title: project.project_title || project.title || "Untitled Project",
    category: project.category || project.procurement_type || "General",
    quantity: Number(project.quantity || 1),
    budget: Number(project.budget || 0),
    delivery: project.delivery || project.delivery_period || "",
    procurement_method: project.procurement_method || project.procurementType || "",
    technical_specifications: project.technical_specifications || project.requirements || "",
    requirements: project.requirements || project.technical_specifications || "",
    deadline,
    submission_deadline: deadline,
    bid_opening_date: project.bid_opening_date || null,
    status,
    status_label: getStatusLabel(status),
    created_at: project.created_at || new Date().toISOString(),
  };
}

export function normalizeSupplier(supplier = {}) {
  const isVerified = Boolean(supplier.isVerified ?? supplier.verified ?? supplier.status === "Verified");
  return {
    ...supplier,
    id: supplier.id || `SUP-${Date.now()}`,
    full_name: supplier.full_name || supplier.company_name || supplier.name || "Supplier",
    company_name: supplier.company_name || supplier.full_name || supplier.name || "Supplier",
    email: supplier.email || "",
    phone: supplier.phone || "",
    business_type: supplier.business_type || "",
    business_permit_number: supplier.business_permit_number || "",
    docs: supplier.docs || [],
    isVerified,
    status: supplier.status || (isVerified ? "Verified" : "Pending"),
    status_display: supplier.status_display || (isVerified ? "Verified" : "Pending"),
    created_at: supplier.created_at || new Date().toISOString(),
  };
}

export function normalizeBid(bid = {}) {
  const amount = Number(bid.amount ?? bid.bidAmount ?? 0);
  return {
    ...bid,
    id: bid.id || `BID-${Date.now()}`,
    projectId: bid.projectId || bid.project || "",
    project: bid.project || bid.projectId || "",
    projectTitle: bid.projectTitle || bid.project_title || bid.projectName || "Untitled Project",
    projectName: bid.projectName || bid.projectTitle || bid.project_title || "Untitled Project",
    supplierId: bid.supplierId || bid.supplier || "",
    supplierName: bid.supplierName || bid.supplier_name || bid.company_name || "Supplier",
    supplierCompany: bid.supplierCompany || bid.company_name || bid.supplierName || "",
    amount,
    bidAmount: Number(bid.bidAmount ?? amount),
    submitted_at: bid.submitted_at || bid.submittedAt || new Date().toISOString(),
    submittedAt: bid.submittedAt || bid.submitted_at || new Date().toISOString(),
    status: bid.status || "Submitted",
    technical_compliance: Boolean(bid.technical_compliance ?? true),
    evaluation_remarks: bid.evaluation_remarks || "",
    rank: bid.rank || null,
    recorded: Boolean(bid.recorded),
    blockchainHash: bid.blockchainHash || bid.hash || "",
  };
}

export function normalizeBlockchainRecord(record = {}) {
  return {
    ...record,
    id: record.id || `BC-${Date.now()}`,
    projectId: record.projectId || record.project_id || "",
    projectTitle: record.projectTitle || record.project_title || "Untitled Project",
    project_ref_id: record.project_ref_id || record.projectId || record.project_id || "",
    winner: record.winner || record.winner_name || record.winning_supplier || "",
    winner_name: record.winner_name || record.winner || record.winning_supplier || "",
    winner_company: record.winner_company || record.winner || record.winning_company || record.winning_supplier || "",
    winning_supplier: record.winning_supplier || record.winner_company || record.winner_name || "",
    bidAmount: Number(record.bidAmount ?? record.bid_amount ?? record.winning_bid_amount ?? 0),
    bid_amount: Number(record.bid_amount ?? record.bidAmount ?? record.winning_bid_amount ?? 0),
    winning_bid_amount: Number(record.winning_bid_amount ?? record.bid_amount ?? record.bidAmount ?? 0),
    recordedAt: record.recordedAt || record.timestamp || record.recorded_at || new Date().toISOString(),
    recorded_at: record.recorded_at || record.recordedAt || record.timestamp || new Date().toISOString(),
    hash: record.hash || "",
  };
}

export function isProjectOpen(project) {
  return normalizeStatusCode(project?.status) === STATUS.OPEN;
}

export function isProjectAwarded(project) {
  return normalizeStatusCode(project?.status) === STATUS.AWARDED;
}