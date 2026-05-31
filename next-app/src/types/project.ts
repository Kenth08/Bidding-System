export type ProjectStatus = "draft" | "active" | "closed" | "awarded";
export type ProcurementType = "Goods" | "Infrastructure" | "Consulting" | "Services";

export interface ProjectBusinessType {
  business_type: {
    id: string;
    name: string;
  };
}

export interface Project {
  id: string;
  procurement_request: string | null;
  title: string;
  budget: number;
  deadline: string;
  procurement_schedule: string | null;
  public_result_expiry_date: string | null;
  requirements: string;
  procurement_type: ProcurementType;
  delivery_period: number;
  technical_specifications: string;
  status: ProjectStatus;
  is_archived: boolean;
  archived_at: string | null;
  archived_reason: string | null;
  published_at: string | null;
  awarded_at: string | null;
  open_to_all?: boolean;
  project_business_types?: ProjectBusinessType[];
  created_by?: { id: string; full_name: string; email: string } | null;
  created_at: string;
  updated_at: string;
}
