export type UserRole = "admin" | "school_head" | "supplier" | "viewer";
export type UserStatus = "active" | "inactive" | "pending" | "approved" | "rejected";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  company_name: string;
  company_address: string;
  phone: string;
  business_type: string;
  business_permit_document: string | null;
  is_staff: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  company_name: string;
  company_address?: string;
  phone?: string;
  business_type?: string;
}
