export type BidStatus = "submitted" | "under_evaluation" | "won" | "lost";

export interface BidProjectRef {
  id?: string;
  title?: string;
  project_title?: string;
  status?: string;
}

export interface BidSupplierRef {
  id?: string;
  full_name?: string;
  company_name?: string;
  verification_status?: string;
}

export interface Bid {
  id: string;
  project: string | BidProjectRef;
  supplier: string | BidSupplierRef;
  company_name: string;
  bid_amount: number;
  proposal: string;
  quotation_file: string | null;
  technical_proposal: string | null;
  supporting_documents: string | null;
  quotation_document: string | null;
  no_conflict_of_interest: boolean;
  conflict_of_interest_person: string | null;
  no_past_scm_issues: boolean;
  technical_document: string | null;
  status: BidStatus;
  technical_compliance: boolean | null;
  evaluation_remarks: string;
  rank: number | null;
  recorded: boolean;
  submitted_at: string;
  updated_at: string;
}
