import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'
import { message } from 'antd'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('authToken')
          window.location.href = '/login'
          message.error('Session expired. Please login again.')
          break
        case 403:
          message.error('You do not have permission to perform this action.')
          break
        case 404:
          message.error('The requested resource was not found.')
          break
        case 422:
          // Validation error - handled by specific components
          break
        case 500:
          message.error('An internal server error occurred. Please try again later.')
          break
        default:
          message.error(
            (error.response.data as any)?.detail || 'An unexpected error occurred.'
          )
      }
    } else if (error.request) {
      message.error('Network error. Please check your connection.')
    } else {
      message.error('An unexpected error occurred.')
    }
    return Promise.reject(error)
  }
)

// Generic API methods
export const apiService = {
  // GET request
  get: <T = any>(url: string, config?: AxiosRequestConfig) =>
    api.get<T>(url, config).then((response) => response.data),

  // POST request
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.post<T>(url, data, config).then((response) => response.data),

  // PUT request
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.put<T>(url, data, config).then((response) => response.data),

  // PATCH request
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
    api.patch<T>(url, data, config).then((response) => response.data),

  // DELETE request
  delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
    api.delete<T>(url, config).then((response) => response.data),
}

// Specific API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: (credentials: { username: string; password: string }) =>
      apiService.post('/auth/login', credentials),
    logout: () => apiService.post('/auth/logout'),
    refresh: () => apiService.post('/auth/refresh'),
    me: () => apiService.get('/auth/me'),
  },

  // Reporting Events
  reportingEvents: {
    list: (params?: any) => apiService.get('/reporting-events', { params }),
    get: (id: string) => apiService.get(`/reporting-events/${id}`),
    create: (data: any) => apiService.post('/reporting-events', data),
    update: (id: string, data: any) => apiService.put(`/reporting-events/${id}`, data),
    delete: (id: string) => apiService.delete(`/reporting-events/${id}`),
  },

  // Analyses
  analyses: {
    list: (params?: any) => apiService.get('/v1/analyses', { params }),
    get: (id: string) => apiService.get(`/v1/analyses/${id}`),
    create: (data: any) => apiService.post('/v1/analyses', data),
    update: (id: string, data: any) => apiService.put(`/v1/analyses/${id}`, data),
    delete: (id: string) => apiService.delete(`/v1/analyses/${id}`),
    validate: (data: any) => apiService.post('/v1/analyses/validate', data),
    duplicate: (id: string, data?: any) => apiService.post(`/v1/analyses/${id}/duplicate`, data),
    execute: (id: string) => apiService.post(`/v1/analyses/${id}/execute`),
    executionStatus: (id: string, executionId: string) => 
      apiService.get(`/v1/analyses/${id}/executions/${executionId}/status`),
    results: (id: string) => apiService.get(`/v1/analyses/${id}/results`),
    export: (id: string, format: string) => 
      apiService.get(`/v1/analyses/${id}/export/${format}`, { responseType: 'blob' }),
    statistics: (params?: any) => apiService.get('/v1/analyses/statistics', { params }),
    compare: (analysisIds: string[]) => apiService.post('/v1/analyses/compare', { analysisIds }),
  },

  // Outputs
  outputs: {
    list: (params?: any) => apiService.get('/outputs', { params }),
    get: (id: string) => apiService.get(`/outputs/${id}`),
    create: (data: any) => apiService.post('/outputs', data),
    update: (id: string, data: any) => apiService.put(`/outputs/${id}`, data),
    delete: (id: string) => apiService.delete(`/outputs/${id}`),
  },

  // Methods
  methods: {
    list: (params?: any) => apiService.get('/v1/methods', { params }),
    get: (id: string) => apiService.get(`/v1/methods/${id}`),
    create: (data: any) => apiService.post('/v1/methods', data),
    update: (id: string, data: any) => apiService.put(`/v1/methods/${id}`, data),
    delete: (id: string) => apiService.delete(`/v1/methods/${id}`),
  },

  // Analysis Sets
  analysisSets: {
    list: (params?: any) => apiService.get('/v1/analysis-sets', { params }),
    get: (id: string) => apiService.get(`/v1/analysis-sets/${id}`),
    create: (data: any) => apiService.post('/v1/analysis-sets', data),
    update: (id: string, data: any) => apiService.put(`/v1/analysis-sets/${id}`, data),
    delete: (id: string) => apiService.delete(`/v1/analysis-sets/${id}`),
  },

  // Data Subsets
  dataSubsets: {
    list: (params?: any) => apiService.get('/v1/data-subsets', { params }),
    get: (id: string) => apiService.get(`/v1/data-subsets/${id}`),
    create: (data: any) => apiService.post('/v1/data-subsets', data),
    update: (id: string, data: any) => apiService.put(`/v1/data-subsets/${id}`, data),
    delete: (id: string) => apiService.delete(`/v1/data-subsets/${id}`),
  },

  // Grouping Factors
  groupingFactors: {
    list: (params?: any) => apiService.get('/v1/grouping-factors', { params }),
    get: (id: string) => apiService.get(`/v1/grouping-factors/${id}`),
    create: (data: any) => apiService.post('/v1/grouping-factors', data),
    update: (id: string, data: any) => apiService.put(`/v1/grouping-factors/${id}`, data),
    delete: (id: string) => apiService.delete(`/v1/grouping-factors/${id}`),
  },

  // Reference Documents
  referenceDocuments: {
    list: (params?: any) => apiService.get('/reference-documents', { params }),
    get: (id: string) => apiService.get(`/reference-documents/${id}`),
    create: (data: any) => apiService.post('/reference-documents', data),
    update: (id: string, data: any) => apiService.put(`/reference-documents/${id}`, data),
    delete: (id: string) => apiService.delete(`/reference-documents/${id}`),
  },

  // Import/Export
  importExport: {
    import: (file: File, format: 'json' | 'yaml' | 'excel') => {
      const formData = new FormData()
      formData.append('file', file)
      return apiService.post(`/import/${format}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    export: (id: string, format: 'json' | 'yaml' | 'excel') =>
      apiService.get(`/export/${id}/${format}`, { responseType: 'blob' }),
  },
}

export default api