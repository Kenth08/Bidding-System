"use client";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { authAPI, projectsAPI, bidsAPI, dashboardAPI, notificationsAPI, suppliersAPI } from "@/services/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaginatedResponse<T> {
  results: T[];
  total: number;
  page: number;
  page_size: number;
}

interface PaginationParams {
  page?: number;
  page_size?: number;
}

// ─── Auth / Session ──────────────────────────────────────────────────────────

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await authAPI.me();
      return res.data;
    },
    staleTime: 60 * 1000, // user data fresh for 1 min
    retry: false,
  });
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const res = await dashboardAPI.getStats();
      return res.data;
    },
  });
}

export function useExpiringDocs() {
  return useQuery({
    queryKey: ["dashboard", "expiring-docs"],
    queryFn: async () => {
      const res = await dashboardAPI.getExpiringDocs();
      return res.data?.items || [];
    },
  });
}

// ─── Projects ────────────────────────────────────────────────────────────────

export function useProjects(params?: PaginationParams & { status?: string }) {
  const { page = 1, page_size = 20, status } = params || {};
  return useQuery({
    queryKey: ["projects", { page, page_size, status }],
    queryFn: async () => {
      const res = await projectsAPI.getAll(status, { page, page_size });
      // Handle both paginated and legacy array responses
      if (Array.isArray(res.data)) return { results: res.data, total: res.data.length, page: 1, page_size: res.data.length } as PaginatedResponse<any>;
      return res.data as PaginatedResponse<any>;
    },
    placeholderData: keepPreviousData,
  });
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const res = await projectsAPI.getOne(id!);
      return res.data;
    },
    enabled: !!id,
  });
}

// ─── Bids ────────────────────────────────────────────────────────────────────

export function useBids(params?: PaginationParams & { project?: string }) {
  const { page = 1, page_size = 20, project } = params || {};
  return useQuery({
    queryKey: ["bids", { page, page_size, project }],
    queryFn: async () => {
      const res = await bidsAPI.getAll({ page, page_size, project });
      if (Array.isArray(res.data)) return { results: res.data, total: res.data.length, page: 1, page_size: res.data.length } as PaginatedResponse<any>;
      return res.data as PaginatedResponse<any>;
    },
    placeholderData: keepPreviousData,
  });
}

// ─── Suppliers ───────────────────────────────────────────────────────────────

export function useSuppliers(params?: PaginationParams) {
  const { page = 1, page_size = 50 } = params || {};
  return useQuery({
    queryKey: ["suppliers", { page, page_size }],
    queryFn: async () => {
      const res = await suppliersAPI.getAll();
      // Handle both paginated {data, total} and legacy array
      if (Array.isArray(res.data)) return { data: res.data, total: res.data.length, page: 1, page_size: res.data.length };
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
}

// ─── Notifications ───────────────────────────────────────────────────────────

export function useNotifications(params?: PaginationParams) {
  const { page = 1, page_size = 20 } = params || {};
  return useQuery({
    queryKey: ["notifications", { page, page_size }],
    queryFn: async () => {
      const res = await notificationsAPI.getAll();
      if (Array.isArray(res.data)) return { results: res.data, total: res.data.length, page: 1, page_size: res.data.length } as PaginatedResponse<any>;
      return res.data as PaginatedResponse<any>;
    },
    placeholderData: keepPreviousData,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await notificationsAPI.getUnreadCount();
      return Number(res.data.count || 0);
    },
    refetchInterval: 30 * 1000, // poll every 30s
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsAPI.markOneRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUpdateSupplierStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => suppliersAPI.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => projectsAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => projectsAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function usePublishProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsAPI.publish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useArchiveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => projectsAPI.archive(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useSelectWinner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bidsAPI.selectWinner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bids"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useSaveBidRemarks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => bidsAPI.saveRemarks(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bids"] });
    },
  });
}

export function useMarkBidReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => bidsAPI.markReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bids"] });
    },
  });
}

export function useSubmitBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData | object) => bidsAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bids"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
