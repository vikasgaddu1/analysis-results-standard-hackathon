/**
 * Custom hooks for Where Clause management
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { message } from 'antd'
import { 
  whereClauseService, 
  WhereClauseCreateRequest, 
  ValidationResult,
  WhereClauseTemplate,
  WhereClauseStatistics,
  CDISCDataset,
  CDISCVariable
} from '../services/whereClauseService'
import { WhereClause, WhereClauseCondition, WhereClauseCompoundExpression } from '../types'

interface UseWhereClauseOptions {
  parentType?: string
  parentId?: string
  autoLoad?: boolean
}

interface UseWhereClauseReturn {
  whereClauses: WhereClause[]
  loading: boolean
  error: string | null
  createWhereClause: (data: WhereClauseCreateRequest) => Promise<WhereClause | null>
  updateCondition: (id: string, condition: WhereClauseCondition) => Promise<WhereClause | null>
  updateCompoundExpression: (id: string, expression: WhereClauseCompoundExpression) => Promise<WhereClause | null>
  deleteWhereClause: (id: string) => Promise<boolean>
  cloneWhereClause: (id: string, newParentType: string, newParentId: string, newLevel: number, newOrderNum: number) => Promise<WhereClause | null>
  refreshWhereClauses: () => Promise<void>
  clearError: () => void
}

/**
 * Hook for managing where clauses for a specific parent entity
 */
export const useWhereClause = ({ 
  parentType, 
  parentId, 
  autoLoad = true 
}: UseWhereClauseOptions = {}): UseWhereClauseReturn => {
  const [whereClauses, setWhereClauses] = useState<WhereClause[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadWhereClauses = useCallback(async () => {
    if (!parentType || !parentId) return

    setLoading(true)
    setError(null)
    
    try {
      const clauses = await whereClauseService.getWhereClausesByParent(parentType, parentId)
      setWhereClauses(clauses)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load where clauses'
      setError(errorMessage)
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [parentType, parentId])

  useEffect(() => {
    if (autoLoad && parentType && parentId) {
      loadWhereClauses()
    }
  }, [autoLoad, loadWhereClauses])

  const createWhereClause = useCallback(async (data: WhereClauseCreateRequest): Promise<WhereClause | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const newClause = await whereClauseService.createWhereClause(data)
      setWhereClauses(prev => [...prev, newClause])
      message.success('Where clause created successfully')
      return newClause
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create where clause'
      setError(errorMessage)
      message.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateCondition = useCallback(async (id: string, condition: WhereClauseCondition): Promise<WhereClause | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedClause = await whereClauseService.updateWhereClauseCondition(id, condition)
      setWhereClauses(prev => 
        prev.map(clause => clause.id === id ? updatedClause : clause)
      )
      message.success('Where clause condition updated successfully')
      return updatedClause
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update where clause condition'
      setError(errorMessage)
      message.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateCompoundExpression = useCallback(async (
    id: string, 
    expression: WhereClauseCompoundExpression
  ): Promise<WhereClause | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedClause = await whereClauseService.updateWhereClauseCompoundExpression(id, expression)
      setWhereClauses(prev => 
        prev.map(clause => clause.id === id ? updatedClause : clause)
      )
      message.success('Where clause expression updated successfully')
      return updatedClause
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update where clause expression'
      setError(errorMessage)
      message.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteWhereClause = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      await whereClauseService.deleteWhereClause(id)
      setWhereClauses(prev => prev.filter(clause => clause.id !== id))
      message.success('Where clause deleted successfully')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete where clause'
      setError(errorMessage)
      message.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const cloneWhereClause = useCallback(async (
    id: string,
    newParentType: string,
    newParentId: string,
    newLevel: number,
    newOrderNum: number
  ): Promise<WhereClause | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const clonedClause = await whereClauseService.cloneWhereClause(
        id, newParentType, newParentId, newLevel, newOrderNum
      )
      
      // If cloning to the same parent, add to current list
      if (newParentType === parentType && newParentId === parentId) {
        setWhereClauses(prev => [...prev, clonedClause])
      }
      
      message.success('Where clause cloned successfully')
      return clonedClause
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clone where clause'
      setError(errorMessage)
      message.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [parentType, parentId])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    whereClauses,
    loading,
    error,
    createWhereClause,
    updateCondition,
    updateCompoundExpression,
    deleteWhereClause,
    cloneWhereClause,
    refreshWhereClauses: loadWhereClauses,
    clearError
  }
}

/**
 * Hook for validating where clause conditions
 */
export const useWhereClauseValidation = () => {
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map())
  const [validating, setValidating] = useState(false)

  const validateCondition = useCallback(async (
    key: string, 
    condition: WhereClauseCondition
  ): Promise<ValidationResult | null> => {
    setValidating(true)
    
    try {
      const result = await whereClauseService.validateCondition(condition)
      setValidationResults(prev => new Map(prev).set(key, result))
      return result
    } catch (err) {
      console.error('Validation failed:', err)
      return null
    } finally {
      setValidating(false)
    }
  }, [])

  const getValidationResult = useCallback((key: string): ValidationResult | undefined => {
    return validationResults.get(key)
  }, [validationResults])

  const clearValidation = useCallback((key: string) => {
    setValidationResults(prev => {
      const newMap = new Map(prev)
      newMap.delete(key)
      return newMap
    })
  }, [])

  return {
    validateCondition,
    getValidationResult,
    clearValidation,
    validating
  }
}

/**
 * Hook for managing where clause templates
 */
export const useWhereClauseTemplates = () => {
  const [templates, setTemplates] = useState<WhereClauseTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTemplates = useCallback(async (tags?: string[], search?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const loadedTemplates = await whereClauseService.getTemplates(tags, search)
      setTemplates(loadedTemplates)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load templates'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveTemplate = useCallback(async (
    whereClauseId: string,
    name: string,
    description: string,
    tags: string[] = []
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await whereClauseService.saveAsTemplate(whereClauseId, name, description, tags)
      if (result.success) {
        message.success('Template saved successfully')
        await loadTemplates() // Refresh templates
        return true
      } else {
        throw new Error(result.error || 'Failed to save template')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template'
      setError(errorMessage)
      message.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [loadTemplates])

  const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      await whereClauseService.deleteTemplate(templateId)
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      message.success('Template deleted successfully')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template'
      setError(errorMessage)
      message.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const applyTemplate = useCallback(async (
    templateId: string,
    parentType: string,
    parentId: string,
    level: number,
    orderNum: number
  ): Promise<WhereClause | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const whereClause = await whereClauseService.applyTemplate(
        templateId, parentType, parentId, level, orderNum
      )
      message.success('Template applied successfully')
      return whereClause
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply template'
      setError(errorMessage)
      message.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    templates,
    loading,
    error,
    loadTemplates,
    saveTemplate,
    deleteTemplate,
    applyTemplate
  }
}

/**
 * Hook for CDISC dataset and variable metadata
 */
export const useCDISCMetadata = () => {
  const [datasets, setDatasets] = useState<CDISCDataset[]>([])
  const [variables, setVariables] = useState<Map<string, CDISCVariable[]>>(new Map())
  const [variableValues, setVariableValues] = useState<Map<string, string[]>>(new Map())
  const [loading, setLoading] = useState(false)

  const loadDatasets = useCallback(async (domain?: string) => {
    setLoading(true)
    try {
      const loadedDatasets = await whereClauseService.getCDISCDatasets(domain)
      setDatasets(loadedDatasets)
    } catch (err) {
      console.error('Failed to load datasets:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadVariables = useCallback(async (datasetName: string, variableType?: string) => {
    setLoading(true)
    try {
      const loadedVariables = await whereClauseService.getDatasetVariables(datasetName, variableType)
      setVariables(prev => new Map(prev).set(datasetName, loadedVariables))
    } catch (err) {
      console.error('Failed to load variables:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadVariableValues = useCallback(async (
    datasetName: string, 
    variableName: string, 
    limit: number = 100
  ) => {
    setLoading(true)
    try {
      const values = await whereClauseService.getVariableValues(datasetName, variableName, limit)
      const key = `${datasetName}.${variableName}`
      setVariableValues(prev => new Map(prev).set(key, values))
    } catch (err) {
      console.error('Failed to load variable values:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const getVariablesForDataset = useCallback((datasetName: string): CDISCVariable[] => {
    return variables.get(datasetName) || []
  }, [variables])

  const getValuesForVariable = useCallback((datasetName: string, variableName: string): string[] => {
    const key = `${datasetName}.${variableName}`
    return variableValues.get(key) || []
  }, [variableValues])

  // Auto-completion hook
  const useAutoComplete = useCallback((
    dataset: string,
    variable: string,
    query: string
  ) => {
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)

    useEffect(() => {
      if (!query || query.length < 2) {
        setSuggestions([])
        return
      }

      setLoadingSuggestions(true)
      whereClauseService.getAutoCompleteSuggestions(dataset, variable, query)
        .then(setSuggestions)
        .catch(err => console.error('Auto-complete failed:', err))
        .finally(() => setLoadingSuggestions(false))
    }, [dataset, variable, query])

    return { suggestions, loadingSuggestions }
  }, [])

  return {
    datasets,
    loading,
    loadDatasets,
    loadVariables,
    loadVariableValues,
    getVariablesForDataset,
    getValuesForVariable,
    useAutoComplete
  }
}

/**
 * Hook for where clause statistics and analytics
 */
export const useWhereClauseStatistics = (parentType?: string) => {
  const [statistics, setStatistics] = useState<WhereClauseStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStatistics = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const stats = await whereClauseService.getStatistics(parentType)
      setStatistics(stats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [parentType])

  useEffect(() => {
    loadStatistics()
  }, [loadStatistics])

  return {
    statistics,
    loading,
    error,
    refreshStatistics: loadStatistics
  }
}

/**
 * Hook for searching where clauses
 */
export const useWhereClauseSearch = () => {
  const [results, setResults] = useState<WhereClause[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (
    searchTerm: string,
    parentType?: string,
    limit: number = 50
  ) => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const searchResults = await whereClauseService.searchWhereClauses(searchTerm, parentType, limit)
      setResults(searchResults)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return {
    results,
    loading,
    error,
    search,
    clearResults
  }
}

/**
 * Hook for exporting where clauses
 */
export const useWhereClauseExport = () => {
  const [exporting, setExporting] = useState(false)

  const exportWhereClauses = useCallback(async (
    parentType: string,
    parentId: string,
    format: 'json' | 'yaml' | 'sas' | 'r' = 'json'
  ) => {
    setExporting(true)
    
    try {
      const { content, filename } = await whereClauseService.exportWhereClauses(
        parentType, parentId, format
      )
      
      // Create and trigger download
      const blob = new Blob([content], { 
        type: format === 'json' ? 'application/json' : 'text/plain' 
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      message.success(`Where clauses exported as ${format.toUpperCase()}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed'
      message.error(errorMessage)
    } finally {
      setExporting(false)
    }
  }, [])

  return {
    exportWhereClauses,
    exporting
  }
}

/**
 * Memoized computed values for where clause analysis
 */
export const useWhereClauseAnalysis = (whereClauses: WhereClause[]) => {
  return useMemo(() => {
    const totalClauses = whereClauses.length
    const conditionClauses = whereClauses.filter(c => c.condition).length
    const compoundClauses = whereClauses.filter(c => c.compoundExpression).length
    
    const datasetUsage = new Map<string, number>()
    const variableUsage = new Map<string, number>()
    const comparatorUsage = new Map<string, number>()
    
    whereClauses.forEach(clause => {
      if (clause.condition) {
        const { dataset, variable, comparator } = clause.condition
        datasetUsage.set(dataset, (datasetUsage.get(dataset) || 0) + 1)
        variableUsage.set(variable, (variableUsage.get(variable) || 0) + 1)
        comparatorUsage.set(comparator, (comparatorUsage.get(comparator) || 0) + 1)
      }
    })
    
    return {
      totalClauses,
      conditionClauses,
      compoundClauses,
      datasetUsage: Array.from(datasetUsage.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      variableUsage: Array.from(variableUsage.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      comparatorUsage: Array.from(comparatorUsage.entries())
        .sort((a, b) => b[1] - a[1])
    }
  }, [whereClauses])
}