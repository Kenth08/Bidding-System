import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const url = String(original?.url || "");
    const isAuthRequest = ["/auth/login", "/auth/register", "/auth/token/refresh"].some((p) => url.includes(p));

    if (error.response?.status === 401 && original && !original._retry && !isAuthRequest) {
      original._retry = true;
      try {
        const refresh = sessionStorage.getItem("refresh_token");
        if (!refresh) throw new Error("No refresh token");
        const res = await axios.post("/api/auth/token/refresh", { refresh });
        sessionStorage.setItem("access_token", res.data.access);
        original.headers.Authorization = `Bearer ${res.data.access}`;
        return api(original);
      } catch {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  register: (data: FormData | object) => api.post("/auth/register", data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined),
  me: () => api.get("/auth/me"),
  updateProfile: (data: object) => api.patch("/auth/me", data),
  refreshToken: (refresh: string) => api.post("/auth/token/refresh", { refresh }),
};

export const projectsAPI = {
  getAll: (statusFilter?: string) => api.get("/projects", { params: statusFilter && statusFilter !== "All" ? { status: statusFilter } : {} }),
  getApprovedRecords: () => api.get("/projects/approved-records"),
  getOne: (id: string) => api.get(`/projects/${id}`),
  create: (data: object) => api.post("/projects", data),
  update: (id: string, data: object) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  publish: (id: string) => api.patch(`/projects/${id}/publish`),
  archive: (id: string, reason: string) => api.patch(`/projects/${id}/archive`, { reason }),
  unarchive: (id: string) => api.patch(`/projects/${id}/unarchive`),
  getHistory: () => api.get("/projects/history"),
};

export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
};

export const bidsAPI = {
  getAll: (params?: object) => api.get("/bids", { params }),
  create: (data: FormData | object) => api.post("/bids", data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined),
  markReview: (id: string) => api.patch(`/bids/${id}/review`),
  saveRemarks: (id: string, data: object) => api.patch(`/bids/${id}/remarks`, data),
  selectWinner: (id: string) => api.patch(`/bids/${id}/select`),
  recordBlockchain: (id: string) => api.post(`/bids/${id}/record`),
};

export const notificationsAPI = {
  getAll: () => api.get("/notifications"),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAllRead: () => api.patch("/notifications/read-all"),
  markOneRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

export const suppliersAPI = {
  getAll: () => api.get("/auth/suppliers"),
  updateStatus: (id: string, status: string) => api.patch(`/auth/suppliers/${id}/status`, { status }),
};

export const usersAPI = {
  getAll: () => api.get("/auth/users"),
  create: (data: object) => api.post("/auth/users", data),
  update: (id: string, data: object) => api.patch(`/auth/users/${id}`, data),
  delete: (id: string) => api.delete(`/auth/users/${id}`),
};

export const blockchainAPI = {
  getAll: () => api.get("/blockchain/admin"),
  getOne: (id: string) => api.get(`/blockchain/admin/${id}`),
  getPublic: () => axios.get("/api/blockchain/public"),
  verifyHash: (hash: string) => axios.get(`/api/blockchain/verify?hash=${encodeURIComponent(hash)}`),
  getMyResults: () => api.get("/blockchain/supplier"),
};

export const awardsAPI = {
  generateNOA: (bidId: string) => api.get(`/bids/${bidId}/documents/noa`),
  generateNTP: (bidId: string) => api.get(`/bids/${bidId}/documents/ntp`),
  generateResolution: (bidId: string) => api.get(`/bids/${bidId}/documents/resolution`),
};

export const procurementAPI = {
  getAll: () => api.get("/procurement-requests"),
  getOne: (id: string) => api.get(`/procurement-requests/${id}`),
  create: (data: object) => api.post("/procurement-requests", data),
  update: (id: string, data: object) => api.patch(`/procurement-requests/${id}`, data),
  delete: (id: string) => api.delete(`/procurement-requests/${id}`),
  review: (id: string, action: string, remarks = "") => api.patch(`/procurement-requests/${id}/review`, { action, remarks }),
};

export const auditLogAPI = {
  getAll: () => api.get("/projects/audit-logs"),
};

export const reportsAPI = {
  getProcurement: () => api.get("/reports/procurement"),
  getSuppliers: () => api.get("/reports/suppliers"),
};

export const documentAPI = {
  getAll: () => api.get("/projects/documents"),
  upload: (data: FormData) => api.post("/projects/documents", data, { headers: { "Content-Type": "multipart/form-data" } }),
};

export default api;
