import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', res.data.access)
        original.headers.Authorization = `Bearer ${res.data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (email, password) => api.post('/auth/login/', { email, password }),
  register: (data) => api.post('/auth/register/', data),
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
}

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats/'),
}

export const bidsAPI = {
  getAll: () => api.get('/bids/'),
  create: (data) => api.post('/bids/', data),
  markReview: (id) => api.patch(`/bids/${id}/review/`),
  selectWinner: (id) => api.patch(`/bids/${id}/select/`),
  recordBlockchain: (id) => api.post(`/bids/${id}/record/`),
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
  getAll: () => api.get('/blockchain/'),
  getOne: (id) => api.get(`/blockchain/${id}/`),
}

export default api
