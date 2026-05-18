import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const requestUrl = String(original?.url || '')
    const isAuthFormRequest = [
      '/auth/login/',
      '/auth/register/',
      '/auth/token/refresh/',
    ].some((path) => requestUrl.includes(path))

    // Let login/register failures bubble up to the UI so users see the correct warning.
    if (error.response?.status === 401 && original && !original._retry && !isAuthFormRequest) {
      original._retry = true
      try {
        const refresh = sessionStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
        sessionStorage.setItem('access_token', res.data.access)
        original.headers.Authorization = `Bearer ${res.data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('current_supplier')
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('refresh_token')
        sessionStorage.removeItem('current_supplier')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (email, password) => api.post('/auth/login/', { email, password }),
  register: (data) => api.post('/auth/register/', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  me: () => api.get('/auth/me/'),
  refreshToken: (refresh) => api.post('/auth/token/refresh/', { refresh }),
}

export const projectsAPI = {
  getAll: (statusFilter) => api.get('/projects/', {
    params: statusFilter && statusFilter !== 'All' ? { status: statusFilter } : {},
  }),
  getOne: (id) => api.get(`/projects/${id}/`),
  create: (data) => api.post('/projects/', data),
  update: (id, data) => api.patch(`/projects/${id}/`, data),
  delete: (id) => api.delete(`/projects/${id}/`),
  publish: (id) => api.patch(`/projects/${id}/publish/`),
  archive: (id, reason) => api.patch(`/projects/${id}/archive/`, { reason }),
  unarchive: (id) => api.patch(`/projects/${id}/unarchive/`),
  getHistory: () => api.get('/projects/history/'),
}

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats/'),
}

export const bidsAPI = {
  getAll: (params = {}) => api.get('/bids/', { params }),
  create: (data) => api.post('/bids/', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
  update: (id, data) => api.patch(`/bids/${id}/`, data),
  markReview: (id) => api.patch(`/bids/${id}/review/`),
  selectWinner: (id) => api.patch(`/bids/${id}/select/`),
  recordBlockchain: (id) => api.post(`/bids/${id}/record/`),
}

export const notificationsAPI = {
  getAll: () => api.get('/notifications/'),
  getUnreadCount: () => api.get('/notifications/unread-count/'),
  markAllRead: () => api.patch('/notifications/read-all/'),
  markOneRead: (id) => api.patch(`/notifications/${id}/read/`),
}

export const suppliersAPI = {
  getAll: () => api.get('/auth/suppliers/'),
  updateStatus: (id, status) => api.patch(`/auth/suppliers/${id}/status/`, { status }),
}

export const usersAPI = {
  getAll: () => api.get('/auth/users/'),
  create: (data) => api.post('/auth/users/', data),
  update: (id, data) => api.patch(`/auth/users/${id}/`, data),
  delete: (id) => api.delete(`/auth/users/${id}/`),
}

export const blockchainAPI = {
  // Admin only — includes hash and technical blockchain details
  getAll: () => api.get('/blockchain/admin/'),
  getOne: (id) => api.get(`/blockchain/admin/${id}/`),

  // Public — no hash exposed
  getPublic: () => axios.get(`${BASE_URL}/blockchain/public/`),

  // Public hash verification — no auth needed
  verifyHash: (hash) => axios.get(`${BASE_URL}/blockchain/verify/?hash=${encodeURIComponent(hash)}`),

  // Supplier — their own results only, no hash exposed
  getMyResults: () => api.get('/blockchain/supplier/'),
}

export const awardsAPI = {
  generateNOA: (bidId) => api.get(`/bids/${bidId}/documents/noa/`),
  generateNTP: (bidId) => api.get(`/bids/${bidId}/documents/ntp/`),
  generateResolution: (bidId) => api.get(`/bids/${bidId}/documents/resolution/`),
}

export const procurementAPI = {
  getAll: () => api.get('/procurement-requests/'),
  getOne: (id) => api.get(`/procurement-requests/${id}/`),
  create: (data) => api.post('/procurement-requests/', data),
  update: (id, data) => api.patch(`/procurement-requests/${id}/`, data),
  delete: (id) => api.delete(`/procurement-requests/${id}/`),
  review: (id, action, remarks = '') => api.patch(`/procurement-requests/${id}/review/`, { action, remarks }),
  approve: (id, remarks = '') => api.patch(`/procurement-requests/${id}/review/`, { action: 'approved', remarks }),
  reject: (id, reason) => api.patch(`/procurement-requests/${id}/review/`, { action: 'rejected', remarks: reason }),
  returnForRevision: (id, notes) => api.patch(`/procurement-requests/${id}/review/`, { action: 'revision_required', remarks: notes }),
}

export const auditLogAPI = {
  getAll: () => api.get('/projects/audit-logs/'),
}

export const reportsAPI = {
  getProcurement: () => api.get('/reports/procurement/'),
  getSuppliers: () => api.get('/reports/suppliers/'),
}

export const documentAPI = {
  getAll: () => api.get('/projects/documents/'),
  upload: (data) => api.post('/projects/documents/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

export default api
