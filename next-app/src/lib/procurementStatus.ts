export const STATUS = {
  DRAFT: 0,
  PENDING_REVIEW: 1,
  APPROVED: 2,
  OPEN: 3,
  CLOSED: 4,
  AWARDED: 5,
  REJECTED: 6,
  REVISION_REQUIRED: 7,
  BID_SUBMITTED: 8,
  BID_UNDER_EVALUATION: 9,
  BID_WON: 10,
  BID_LOST: 11,
} as const;

export const STATUS_TEXT: Record<number, string> = {
  [STATUS.DRAFT]: "Draft",
  [STATUS.PENDING_REVIEW]: "Pending Review",
  [STATUS.APPROVED]: "Approved",
  [STATUS.OPEN]: "Open for Bidding",
  [STATUS.CLOSED]: "Closed",
  [STATUS.AWARDED]: "Awarded",
  [STATUS.REJECTED]: "Rejected",
  [STATUS.REVISION_REQUIRED]: "Revision Required",
  [STATUS.BID_SUBMITTED]: "Submitted",
  [STATUS.BID_UNDER_EVALUATION]: "Under Evaluation",
  [STATUS.BID_WON]: "Won",
  [STATUS.BID_LOST]: "Lost",
};

export function normalizeStatusCode(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value || "").trim().toLowerCase();
  if (!text) return STATUS.DRAFT;
  if (text === "draft") return STATUS.DRAFT;
  if (text === "pending" || text === "pending review" || text === "pending_review") return STATUS.PENDING_REVIEW;
  if (text === "approved") return STATUS.APPROVED;
  if (text === "open" || text === "active" || text === "open for bidding" || text === "open_for_bidding") return STATUS.OPEN;
  if (text === "closed" || text === "closed for evaluation" || text === "closed_for_evaluation") return STATUS.CLOSED;
  if (text === "awarded" || text === "selected") return STATUS.AWARDED;
  if (text === "rejected" || text === "reject") return STATUS.REJECTED;
  if (text === "revision required" || text === "revision_required" || text === "revise") return STATUS.REVISION_REQUIRED;
  if (text === "submitted") return STATUS.BID_SUBMITTED;
  if (text === "under evaluation" || text === "under_evaluation" || text === "under review") return STATUS.BID_UNDER_EVALUATION;
  if (text === "won") return STATUS.BID_WON;
  if (text === "lost") return STATUS.BID_LOST;
  return STATUS.DRAFT;
}

export function getStatusLabel(value: unknown): string {
  return STATUS_TEXT[normalizeStatusCode(value)] || "Draft";
}
