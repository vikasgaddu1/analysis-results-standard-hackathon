import { useState, useCallback } from 'react'
import { message } from 'antd'
import { 
  Analysis, 
  ReportingEvent, 
  AnalysisSet, 
  DataSubset, 
  GroupingFactor, 
  AnalysisMethod,
  PaginatedResponse 
} from '../types'
import { 
  analysisService, 
  AnalysisFilters, 
  AnalysisCreateRequest, 
  AnalysisUpdateRequest 
} from '../services/analysisService'

export interface UseAnalysisReturn {
  // State
  analysis: Analysis | null
  analyses: Analysis[]
  reportingEvent: ReportingEvent | null
  analysisSets: AnalysisSet[]
  dataSubsets: DataSubset[]
  groupingFactors: GroupingFactor[]
  methods: AnalysisMethod[]
  loading: boolean
  saving: boolean
  error: string | null
  pagination: {
    page: number
    size: number
    total: number
    pages: number
  }

  // Actions
  fetchAnalysis: (id: string) => Promise<void>
  fetchAnalyses: (filters?: AnalysisFilters) => Promise<void>
  fetchReportingEvent: (id: string) => Promise<void>
  createAnalysis: (analysis: AnalysisCreateRequest) => Promise<Analysis>
  updateAnalysis: (id: string, analysis: AnalysisUpdateRequest) => Promise<Analysis>
  deleteAnalysis: (id: string) => Promise<void>
  duplicateAnalysis: (id: string, name?: string) => Promise<Analysis>
  validateAnalysis: (analysis: Partial<Analysis>) => Promise<{ isValid: boolean; errors: string[] }>
  clearError: () => void
  refresh: () => Promise<void>
}

export const useAnalysis = (reportingEventId?: string): UseAnalysisReturn => {
  // State
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [reportingEvent, setReportingEvent] = useState<ReportingEvent | null>(null)
  const [analysisSets, setAnalysisSets] = useState<AnalysisSet[]>([])
  const [dataSubsets, setDataSubsets] = useState<DataSubset[]>([])
  const [groupingFactors, setGroupingFactors] = useState<GroupingFactor[]>([])
  const [methods, setMethods] = useState<AnalysisMethod[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    size: 20,
    total: 0,
    pages: 0
  })

  // Actions
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const fetchAnalysis = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await analysisService.getAnalysis(id)
      setAnalysis(data)
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch analysis'
      setError(errorMessage)
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAnalyses = useCallback(async (filters: AnalysisFilters = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        ...filters,
        reportingEventId: filters.reportingEventId || reportingEventId
      }
      
      const response: PaginatedResponse<Analysis> = await analysisService.getAnalyses(params)
      setAnalyses(response.items)
      setPagination({
        page: response.page,
        size: response.size,
        total: response.total,
        pages: response.pages
      })
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch analyses'
      setError(errorMessage)
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [reportingEventId])

  const fetchReportingEvent = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch reporting event and related data in parallel
      const [
        reportingEventData,
        analysisSetData,
        dataSubsetData,
        groupingFactorData,
        methodData
      ] = await Promise.all([
        analysisService.getReportingEvent(id),
        analysisService.getAnalysisSets(id),
        analysisService.getDataSubsets(id),
        analysisService.getGroupingFactors(id),
        analysisService.getAnalysisMethods(id)
      ])
      
      setReportingEvent(reportingEventData)
      setAnalysisSets(analysisSetData)
      setDataSubsets(dataSubsetData)
      setGroupingFactors(groupingFactorData)
      setMethods(methodData)
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch reporting event'
      setError(errorMessage)
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const createAnalysis = useCallback(async (analysisData: AnalysisCreateRequest): Promise<Analysis> => {
    try {
      setSaving(true)
      setError(null)
      const newAnalysis = await analysisService.createAnalysis(analysisData)
      
      // Update analyses list if we have it
      setAnalyses(prev => [newAnalysis, ...prev])
      
      return newAnalysis
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create analysis'
      setError(errorMessage)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  const updateAnalysis = useCallback(async (id: string, analysisData: AnalysisUpdateRequest): Promise<Analysis> => {
    try {
      setSaving(true)
      setError(null)
      const updatedAnalysis = await analysisService.updateAnalysis(id, analysisData)
      
      // Update current analysis if it matches
      if (analysis?.id === id) {
        setAnalysis(updatedAnalysis)
      }
      
      // Update analyses list
      setAnalyses(prev => 
        prev.map(a => a.id === id ? updatedAnalysis : a)
      )
      
      return updatedAnalysis
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update analysis'
      setError(errorMessage)
      throw err
    } finally {
      setSaving(false)
    }
  }, [analysis])

  const deleteAnalysis = useCallback(async (id: string): Promise<void> => {
    try {
      setSaving(true)
      setError(null)
      await analysisService.deleteAnalysis(id)
      
      // Remove from analyses list
      setAnalyses(prev => prev.filter(a => a.id !== id))
      
      // Clear current analysis if it matches
      if (analysis?.id === id) {
        setAnalysis(null)
      }
      
      message.success('Analysis deleted successfully')
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete analysis'
      setError(errorMessage)
      message.error(errorMessage)
      throw err
    } finally {
      setSaving(false)
    }
  }, [analysis])

  const duplicateAnalysis = useCallback(async (id: string, name?: string): Promise<Analysis> => {
    try {
      setSaving(true)
      setError(null)
      const duplicatedAnalysis = await analysisService.duplicateAnalysis(id, name)
      
      // Add to analyses list
      setAnalyses(prev => [duplicatedAnalysis, ...prev])
      
      message.success('Analysis duplicated successfully')
      return duplicatedAnalysis
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to duplicate analysis'
      setError(errorMessage)
      message.error(errorMessage)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  const validateAnalysis = useCallback(async (analysisData: Partial<Analysis>): Promise<{ isValid: boolean; errors: string[] }> => {
    try {
      setError(null)
      return await analysisService.validateAnalysis(analysisData)
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to validate analysis'
      setError(errorMessage)
      return { isValid: false, errors: [errorMessage] }
    }
  }, [])

  const refresh = useCallback(async () => {
    if (reportingEventId) {
      await fetchReportingEvent(reportingEventId)
      await fetchAnalyses({ reportingEventId })
    }
  }, [reportingEventId, fetchReportingEvent, fetchAnalyses])

  return {
    // State
    analysis,
    analyses,
    reportingEvent,
    analysisSets,
    dataSubsets,
    groupingFactors,
    methods,
    loading,
    saving,
    error,
    pagination,

    // Actions
    fetchAnalysis,
    fetchAnalyses,
    fetchReportingEvent,
    createAnalysis,
    updateAnalysis,
    deleteAnalysis,
    duplicateAnalysis,
    validateAnalysis,
    clearError,
    refresh
  }
}

// Additional hook for analysis execution
export const useAnalysisExecution = (analysisId: string) => {
  const [executing, setExecuting] = useState(false)
  const [executionStatus, setExecutionStatus] = useState<{
    status: string
    progress: number
    results?: any[]
    error?: string
  } | null>(null)

  const executeAnalysis = useCallback(async () => {
    try {
      setExecuting(true)
      const { executionId } = await analysisService.executeAnalysis(analysisId)
      
      // Poll for status updates
      const pollStatus = async () => {
        try {
          const status = await analysisService.getAnalysisExecutionStatus(analysisId, executionId)
          setExecutionStatus(status)
          
          if (status.status === 'completed' || status.status === 'failed') {
            setExecuting(false)
            return
          }
          
          // Continue polling
          setTimeout(pollStatus, 2000)
        } catch (err) {
          setExecuting(false)
          message.error('Failed to get execution status')
        }
      }
      
      pollStatus()
    } catch (err: any) {
      setExecuting(false)
      message.error(err.response?.data?.detail || 'Failed to execute analysis')
    }
  }, [analysisId])

  const getResults = useCallback(async () => {
    try {
      return await analysisService.getAnalysisResults(analysisId)
    } catch (err: any) {
      message.error(err.response?.data?.detail || 'Failed to get analysis results')
      return []
    }
  }, [analysisId])

  return {
    executing,
    executionStatus,
    executeAnalysis,
    getResults
  }
}

export default useAnalysis