export type BidStatus = "submitted" | "under_evaluation" | "won" | "lost";

export interface Bid {
  id: string;
  project: string;
  supplier: string;
  company_name: string;
  bid_amount: number;
  proposal: string;
  quotation_file: string | null;
  technical_proposal: string | null;
  supporting_documents: string | null;
  quotation_document: string | null;
  technical_document: string | null;
  status: BidStatus;
  technical_compliance: boolean | null;
  evaluation_remarks: string;
  rank: number | null;
  recorded: boolean;
  submitted_at: string;
  updated_at: string;
}
