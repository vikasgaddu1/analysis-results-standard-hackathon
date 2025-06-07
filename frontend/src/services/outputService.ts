import { apiService } from './api'
import { Output, PaginatedResponse } from '../types'

export interface OutputCreateRequest {
  name: string
  label?: string
  description?: string
  version?: string
  fileSpecifications?: any[]
  displays: any[]
}

export interface OutputUpdateRequest extends Partial<OutputCreateRequest> {
  id: string
}

export interface OutputListParams {
  page?: number
  size?: number
  search?: string
  category?: string
  author?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
  suggestion?: string
}

export interface ExportOptions {
  format: 'json' | 'yaml' | 'excel' | 'pdf' | 'rtf' | 'html'
  includeData?: boolean
  includeStyles?: boolean
  template?: string
}

export interface TemplateMetadata {
  name: string
  description: string
  category: string
  tags: string[]
  version: string
  author: string
  isPublic?: boolean
}

export interface DuplicateOptions {
  name?: string
  includeData?: boolean
  includeStyles?: boolean
}

class OutputService {
  private baseUrl = '/v1/outputs'

  // Basic CRUD operations
  async list(params?: OutputListParams): Promise<PaginatedResponse<Output>> {
    return apiService.get(this.baseUrl, { params })
  }

  async get(id: string): Promise<Output> {
    return apiService.get(`${this.baseUrl}/${id}`)
  }

  async create(data: OutputCreateRequest): Promise<Output> {
    return apiService.post(this.baseUrl, data)
  }

  async update(id: string, data: Partial<OutputUpdateRequest>): Promise<Output> {
    return apiService.put(`${this.baseUrl}/${id}`, data)
  }

  async delete(id: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/${id}`)
  }

  // Validation
  async validate(output: Partial<Output>): Promise<ValidationResult> {
    return apiService.post(`${this.baseUrl}/validate`, output)
  }

  async validateField(field: string, value: any, context?: any): Promise<ValidationResult> {
    return apiService.post(`${this.baseUrl}/validate-field`, {
      field,
      value,
      context
    })
  }

  // Export/Import operations
  async export(id: string, options: ExportOptions): Promise<Blob> {
    const params = new URLSearchParams({
      format: options.format,
      ...(options.includeData !== undefined && { includeData: String(options.includeData) }),
      ...(options.includeStyles !== undefined && { includeStyles: String(options.includeStyles) }),
      ...(options.template && { template: options.template })
    })

    return apiService.get(`${this.baseUrl}/${id}/export?${params}`, {
      responseType: 'blob'
    })
  }

  async import(file: File, format: 'json' | 'yaml' | 'excel'): Promise<Output> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('format', format)

    return apiService.post(`${this.baseUrl}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  // Template operations
  async saveAsTemplate(id: string, metadata: TemplateMetadata): Promise<any> {
    return apiService.post(`${this.baseUrl}/${id}/save-as-template`, metadata)
  }

  async loadFromTemplate(templateId: string): Promise<Output> {
    return apiService.post(`${this.baseUrl}/from-template/${templateId}`)
  }

  async listTemplates(params?: {
    category?: string
    author?: string
    isPublic?: boolean
    search?: string
  }): Promise<any[]> {
    return apiService.get(`${this.baseUrl}/templates`, { params })
  }

  async getTemplate(templateId: string): Promise<any> {
    return apiService.get(`${this.baseUrl}/templates/${templateId}`)
  }

  // Duplication
  async duplicate(id: string, options?: DuplicateOptions): Promise<Output> {
    return apiService.post(`${this.baseUrl}/${id}/duplicate`, options)
  }

  // Preview and generation
  async generatePreview(id: string, format: 'html' | 'pdf'): Promise<Blob> {
    return apiService.get(`${this.baseUrl}/${id}/preview/${format}`, {
      responseType: 'blob'
    })
  }

  async generateTable(id: string, options?: {
    includeData?: boolean
    format?: string
    style?: any
  }): Promise<Blob> {
    return apiService.post(`${this.baseUrl}/${id}/generate`, options, {
      responseType: 'blob'
    })
  }

  // Version management
  async getVersions(id: string): Promise<any[]> {
    return apiService.get(`${this.baseUrl}/${id}/versions`)
  }

  async getVersion(id: string, version: string): Promise<Output> {
    return apiService.get(`${this.baseUrl}/${id}/versions/${version}`)
  }

  async createVersion(id: string, versionData: {
    version: string
    description?: string
    changes?: string[]
  }): Promise<Output> {
    return apiService.post(`${this.baseUrl}/${id}/versions`, versionData)
  }

  // Collaboration
  async share(id: string, shareData: {
    users?: string[]
    groups?: string[]
    permissions: 'read' | 'write' | 'admin'
    expiresAt?: string
  }): Promise<any> {
    return apiService.post(`${this.baseUrl}/${id}/share`, shareData)
  }

  async getSharedWith(id: string): Promise<any[]> {
    return apiService.get(`${this.baseUrl}/${id}/shared-with`)
  }

  async unshare(id: string, userId: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/${id}/share/${userId}`)
  }

  // Comments and annotations
  async getComments(id: string): Promise<any[]> {
    return apiService.get(`${this.baseUrl}/${id}/comments`)
  }

  async addComment(id: string, comment: {
    text: string
    section?: string
    position?: { x: number; y: number }
  }): Promise<any> {
    return apiService.post(`${this.baseUrl}/${id}/comments`, comment)
  }

  async updateComment(id: string, commentId: string, updates: {
    text?: string
    resolved?: boolean
  }): Promise<any> {
    return apiService.put(`${this.baseUrl}/${id}/comments/${commentId}`, updates)
  }

  async deleteComment(id: string, commentId: string): Promise<void> {
    return apiService.delete(`${this.baseUrl}/${id}/comments/${commentId}`)
  }

  // Statistics and analytics
  async getUsageStats(id: string): Promise<{
    views: number
    exports: number
    lastAccessed: string
    popularFormats: string[]
    userActivity: any[]
  }> {
    return apiService.get(`${this.baseUrl}/${id}/stats`)
  }

  async getGlobalStats(): Promise<{
    totalOutputs: number
    totalTemplates: number
    popularCategories: string[]
    recentActivity: any[]
  }> {
    return apiService.get(`${this.baseUrl}/stats/global`)
  }

  // Search and discovery
  async search(query: string, filters?: {
    category?: string
    author?: string
    dateRange?: { start: string; end: string }
    tags?: string[]
  }): Promise<PaginatedResponse<Output>> {
    return apiService.post(`${this.baseUrl}/search`, {
      query,
      filters
    })
  }

  async getSuggestions(partialName: string): Promise<string[]> {
    return apiService.get(`${this.baseUrl}/suggestions`, {
      params: { q: partialName }
    })
  }

  async getRelated(id: string): Promise<Output[]> {
    return apiService.get(`${this.baseUrl}/${id}/related`)
  }

  // Bulk operations
  async bulkDelete(ids: string[]): Promise<void> {
    return apiService.post(`${this.baseUrl}/bulk-delete`, { ids })
  }

  async bulkExport(ids: string[], format: string): Promise<Blob> {
    return apiService.post(`${this.baseUrl}/bulk-export`, {
      ids,
      format
    }, {
      responseType: 'blob'
    })
  }

  async bulkUpdate(updates: Array<{
    id: string
    data: Partial<OutputUpdateRequest>
  }>): Promise<Output[]> {
    return apiService.post(`${this.baseUrl}/bulk-update`, { updates })
  }

  // Data integration
  async linkDataSource(id: string, dataSource: {
    type: 'sas' | 'r' | 'python' | 'sql'
    connection: any
    query?: string
    schedule?: string
  }): Promise<any> {
    return apiService.post(`${this.baseUrl}/${id}/data-source`, dataSource)
  }

  async refreshData(id: string): Promise<any> {
    return apiService.post(`${this.baseUrl}/${id}/refresh-data`)
  }

  async getDataSources(id: string): Promise<any[]> {
    return apiService.get(`${this.baseUrl}/${id}/data-sources`)
  }

  // Quality checks
  async runQualityChecks(id: string): Promise<{
    score: number
    checks: Array<{
      name: string
      status: 'pass' | 'fail' | 'warning'
      message: string
      suggestions?: string[]
    }>
  }> {
    return apiService.post(`${this.baseUrl}/${id}/quality-check`)
  }

  async getComplianceReport(id: string, standard: 'ICH-E3' | 'FDA' | 'EMA'): Promise<{
    compliant: boolean
    issues: any[]
    recommendations: string[]
  }> {
    return apiService.get(`${this.baseUrl}/${id}/compliance/${standard}`)
  }
}

export const outputService = new OutputService()
export default outputService