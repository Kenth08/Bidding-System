export type NotificationType =
  | "new_supplier"
  | "supplier_approved"
  | "supplier_rejected"
  | "new_bid"
  | "bid_won"
  | "bid_lost"
  | "project_published"
  | "project_awarded"
  | "procurement_request"
  | "request_approved"
  | "request_rejected"
  | "winner_selected";

export type ResourceType = "project" | "bid" | "request" | "supplier" | "user";

export interface Notification {
  id: string;
  recipient: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  related_id: string | null;
  resource_type: ResourceType | null;
  resource_id: string | null;
  created_at: string;
}
