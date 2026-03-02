import axios, { type AxiosInstance } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refreshToken')
      if (refresh) {
        try {
          const { data } = await axios.post(baseURL + '/auth/token/refresh/', { refresh })
          localStorage.setItem('accessToken', data.access)
          if (data.refresh) localStorage.setItem('refreshToken', data.refresh)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          import('react-hot-toast').then(({ default: toast }) =>
            toast.error('Session expired. Please sign in again.')
          )
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ access: string; refresh: string; user: import('../types').User }>('/auth/token/', { username, password }),
  me: () => api.get<import('../types').User>('/auth/me/'),
  refresh: (refresh: string) => api.post<{ access: string; refresh?: string }>('/auth/token/refresh/', { refresh }),
}

// Organizations (superadmin)
export const organizationsApi = {
  list: (params?: { page?: number }) => api.get<import('../types').PaginatedResponse<import('../types').Organization>>('/organizations/', { params }),
  create: (data: { name: string; subscription_plan?: string; br_number?: string; admin_username: string; admin_email: string; admin_password: string; admin_telephone?: string }) =>
    api.post<import('../types').Organization>('/organizations/', data),
  get: (id: number) => api.get<import('../types').Organization>(`/organizations/${id}/`),
  update: (id: number, data: Partial<import('../types').Organization>) => api.patch<import('../types').Organization>(`/organizations/${id}/`, data),
  delete: (id: number) => api.delete(`/organizations/${id}/`),
}

// Users
export const usersApi = {
  list: (params?: { page?: number }) => api.get<import('../types').PaginatedResponse<import('../types').User>>('/users/', { params }),
  create: (data: { username: string; email: string; password: string; first_name?: string; last_name?: string; telephone?: string; role: string; organization?: number }) =>
    api.post<import('../types').User>('/users/', data),
  get: (id: number) => api.get<import('../types').User>(`/users/${id}/`),
  update: (id: number, data: Partial<import('../types').User>) => api.patch<import('../types').User>(`/users/${id}/`, data),
  delete: (id: number) => api.delete(`/users/${id}/`),
}

// Companies
export const companiesApi = {
  list: (params?: { page?: number; search?: string; ordering?: string; organization?: number }) =>
    api.get<import('../types').PaginatedResponse<import('../types').Company>>('/companies/', { params }),
  create: (data: { name: string; industry?: string; country?: string; logo?: File; organization?: number }) => {
    const form = new FormData()
    form.append('name', data.name)
    if (data.industry) form.append('industry', data.industry)
    if (data.country) form.append('country', data.country)
    if (data.logo) form.append('logo', data.logo)
    if (data.organization) form.append('organization', String(data.organization))
    return api.post<import('../types').Company>('/companies/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  get: (id: number) => api.get<import('../types').Company>(`/companies/${id}/`),
  update: (id: number, data: Partial<{ name: string; industry: string; country: string; logo: File }>) => {
    const form = new FormData()
    if (data.name !== undefined) form.append('name', data.name)
    if (data.industry !== undefined) form.append('industry', data.industry)
    if (data.country !== undefined) form.append('country', data.country)
    if (data.logo) form.append('logo', data.logo)
    return api.patch<import('../types').Company>(`/companies/${id}/`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  delete: (id: number) => api.delete(`/companies/${id}/`),
}

// Contacts (top-level and nested under company)
export const contactsApi = {
  list: (params?: { page?: number; search?: string }) =>
    api.get<import('../types').PaginatedResponse<import('../types').Contact>>('/contacts/', { params }),
  listByCompany: (companyId: number, params?: { page?: number }) =>
    api.get<import('../types').PaginatedResponse<import('../types').Contact>>(`/companies/${companyId}/contacts/`, { params }),
  create: (data: { full_name: string; email: string; phone?: string; role?: string; company: number }) =>
    api.post<import('../types').Contact>('/contacts/', data),
  createForCompany: (companyId: number, data: { full_name: string; email: string; phone?: string; role?: string }) =>
    api.post<import('../types').Contact>(`/companies/${companyId}/contacts/`, data),
  get: (id: number) => api.get<import('../types').Contact>(`/contacts/${id}/`),
  update: (id: number, data: Partial<import('../types').Contact>) => api.patch<import('../types').Contact>(`/contacts/${id}/`, data),
  delete: (id: number) => api.delete(`/contacts/${id}/`),
}

// Activity log
export const activityLogApi = {
  list: (params?: { page?: number }) =>
    api.get<import('../types').PaginatedResponse<import('../types').ActivityLog>>('/activity-log/', { params }),
}
