import { apiService } from './api'
import { 
  Analysis, 
  ReportingEvent, 
  AnalysisSet, 
  DataSubset, 
  GroupingFactor, 
  AnalysisMethod,
  PaginatedResponse,
  Operation,
  OperationResult
} from '../types'

export interface AnalysisFilters {
  search?: string
  reportingEventId?: string
  purpose?: string
  reason?: string
  methodId?: string
  page?: number
  size?: number
}

export interface AnalysisCreateRequest extends Omit<Analysis, 'id'> {
  reportingEventId: string
}

export interface AnalysisUpdateRequest extends Partial<Omit<Analysis, 'id'>> {}

export const analysisService = {
  // Analysis CRUD operations
  getAnalyses: async (filters: AnalysisFilters = {}): Promise<PaginatedResponse<Analysis>> => {
    return apiService.get('/v1/analyses', { params: filters })
  },

  getAnalysis: async (id: string): Promise<Analysis> => {
    return apiService.get(`/v1/analyses/${id}`)
  },

  createAnalysis: async (analysis: AnalysisCreateRequest): Promise<Analysis> => {
    return apiService.post('/v1/analyses', analysis)
  },

  updateAnalysis: async (id: string, analysis: AnalysisUpdateRequest): Promise<Analysis> => {
    return apiService.put(`/v1/analyses/${id}`, analysis)
  },

  deleteAnalysis: async (id: string): Promise<void> => {
    return apiService.delete(`/v1/analyses/${id}`)
  },

  // Analysis validation
  validateAnalysis: async (analysis: Partial<Analysis>): Promise<{ isValid: boolean; errors: string[] }> => {
    return apiService.post('/v1/analyses/validate', analysis)
  },

  // Analysis duplication
  duplicateAnalysis: async (id: string, name?: string): Promise<Analysis> => {
    return apiService.post(`/v1/analyses/${id}/duplicate`, { name })
  },

  // Reporting Event operations
  getReportingEvent: async (id: string): Promise<ReportingEvent> => {
    return apiService.get(`/v1/reporting-events/${id}`)
  },

  getReportingEvents: async (filters: { search?: string; page?: number; size?: number } = {}): Promise<PaginatedResponse<ReportingEvent>> => {
    return apiService.get('/v1/reporting-events', { params: filters })
  },

  // Analysis Sets
  getAnalysisSets: async (reportingEventId?: string): Promise<AnalysisSet[]> => {
    const params = reportingEventId ? { reportingEventId } : {}
    const response = await apiService.get('/v1/analysis-sets', { params })
    return Array.isArray(response) ? response : response.items || []
  },

  createAnalysisSet: async (analysisSet: Omit<AnalysisSet, 'id'>): Promise<AnalysisSet> => {
    return apiService.post('/v1/analysis-sets', analysisSet)
  },

  updateAnalysisSet: async (id: string, analysisSet: Partial<AnalysisSet>): Promise<AnalysisSet> => {
    return apiService.put(`/v1/analysis-sets/${id}`, analysisSet)
  },

  deleteAnalysisSet: async (id: string): Promise<void> => {
    return apiService.delete(`/v1/analysis-sets/${id}`)
  },

  // Data Subsets
  getDataSubsets: async (reportingEventId?: string): Promise<DataSubset[]> => {
    const params = reportingEventId ? { reportingEventId } : {}
    const response = await apiService.get('/v1/data-subsets', { params })
    return Array.isArray(response) ? response : response.items || []
  },

  createDataSubset: async (dataSubset: Omit<DataSubset, 'id'>): Promise<DataSubset> => {
    return apiService.post('/v1/data-subsets', dataSubset)
  },

  updateDataSubset: async (id: string, dataSubset: Partial<DataSubset>): Promise<DataSubset> => {
    return apiService.put(`/v1/data-subsets/${id}`, dataSubset)
  },

  deleteDataSubset: async (id: string): Promise<void> => {
    return apiService.delete(`/v1/data-subsets/${id}`)
  },

  // Grouping Factors
  getGroupingFactors: async (reportingEventId?: string): Promise<GroupingFactor[]> => {
    const params = reportingEventId ? { reportingEventId } : {}
    const response = await apiService.get('/v1/grouping-factors', { params })
    return Array.isArray(response) ? response : response.items || []
  },

  createGroupingFactor: async (groupingFactor: Omit<GroupingFactor, 'id'>): Promise<GroupingFactor> => {
    return apiService.post('/v1/grouping-factors', groupingFactor)
  },

  updateGroupingFactor: async (id: string, groupingFactor: Partial<GroupingFactor>): Promise<GroupingFactor> => {
    return apiService.put(`/v1/grouping-factors/${id}`, groupingFactor)
  },

  deleteGroupingFactor: async (id: string): Promise<void> => {
    return apiService.delete(`/v1/grouping-factors/${id}`)
  },

  // Analysis Methods
  getAnalysisMethods: async (reportingEventId?: string): Promise<AnalysisMethod[]> => {
    const params = reportingEventId ? { reportingEventId } : {}
    const response = await apiService.get('/v1/methods', { params })
    return Array.isArray(response) ? response : response.items || []
  },

  getAnalysisMethod: async (id: string): Promise<AnalysisMethod> => {
    return apiService.get(`/v1/methods/${id}`)
  },

  createAnalysisMethod: async (method: Omit<AnalysisMethod, 'id'>): Promise<AnalysisMethod> => {
    return apiService.post('/v1/methods', method)
  },

  updateAnalysisMethod: async (id: string, method: Partial<AnalysisMethod>): Promise<AnalysisMethod> => {
    return apiService.put(`/v1/methods/${id}`, method)
  },

  deleteAnalysisMethod: async (id: string): Promise<void> => {
    return apiService.delete(`/v1/methods/${id}`)
  },

  // Operations
  getOperations: async (methodId?: string): Promise<Operation[]> => {
    const params = methodId ? { methodId } : {}
    const response = await apiService.get('/v1/operations', { params })
    return Array.isArray(response) ? response : response.items || []
  },

  createOperation: async (operation: Omit<Operation, 'id'>): Promise<Operation> => {
    return apiService.post('/v1/operations', operation)
  },

  updateOperation: async (id: string, operation: Partial<Operation>): Promise<Operation> => {
    return apiService.put(`/v1/operations/${id}`, operation)
  },

  deleteOperation: async (id: string): Promise<void> => {
    return apiService.delete(`/v1/operations/${id}`)
  },

  // Analysis execution and results
  executeAnalysis: async (id: string): Promise<{ executionId: string; status: string }> => {
    return apiService.post(`/v1/analyses/${id}/execute`)
  },

  getAnalysisExecutionStatus: async (id: string, executionId: string): Promise<{ 
    status: string; 
    progress: number; 
    results?: OperationResult[];
    error?: string 
  }> => {
    return apiService.get(`/v1/analyses/${id}/executions/${executionId}/status`)
  },

  getAnalysisResults: async (id: string): Promise<OperationResult[]> => {
    return apiService.get(`/v1/analyses/${id}/results`)
  },

  // Utilities
  getDatasetMetadata: async (reportingEventId: string): Promise<{
    datasets: string[];
    variables: Record<string, string[]>;
  }> => {
    return apiService.get(`/v1/reporting-events/${reportingEventId}/metadata/datasets`)
  },

  getAnalysisStatistics: async (reportingEventId?: string): Promise<{
    totalAnalyses: number;
    byPurpose: Record<string, number>;
    byReason: Record<string, number>;
    byMethod: Record<string, number>;
  }> => {
    const params = reportingEventId ? { reportingEventId } : {}
    return apiService.get('/v1/analyses/statistics', { params })
  },

  // Import/Export
  exportAnalysis: async (id: string, format: 'json' | 'yaml' | 'excel' = 'json'): Promise<Blob> => {
    return apiService.get(`/v1/analyses/${id}/export/${format}`, { 
      responseType: 'blob' 
    })
  },

  importAnalysis: async (reportingEventId: string, file: File, format: 'json' | 'yaml' | 'excel'): Promise<Analysis> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('reportingEventId', reportingEventId)
    
    return apiService.post(`/v1/analyses/import/${format}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Analysis comparison
  compareAnalyses: async (analysisIds: string[]): Promise<{
    similarities: Array<{ field: string; similarity: number }>;
    differences: Array<{ field: string; values: Record<string, any> }>;
  }> => {
    return apiService.post('/v1/analyses/compare', { analysisIds })
  }
}

export default analysisService