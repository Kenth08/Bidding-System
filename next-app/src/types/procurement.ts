export type ProcurementStatus = "Pending Review" | "Approved" | "Rejected" | "Revision Required";
export type ProcurementRequestType = "Goods" | "Services" | "Infrastructure";

export interface Procurement {
  id: string;
  project_title: string;
  budget: number;
  deadline: string | null;
  public_result_expiry_date: string | null;
  procurement_type: ProcurementRequestType;
  technical_specifications: string;
  procurement_schedule: string;
  delivery_period: string;
  status: ProcurementStatus;
  rejection_reason: string;
  revision_notes: string;
  review_remarks: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
