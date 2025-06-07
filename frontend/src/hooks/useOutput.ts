import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { Output } from '../types'
import { 
  outputService, 
  OutputCreateRequest, 
  OutputUpdateRequest,
  ValidationResult,
  ExportOptions,
  TemplateMetadata,
  DuplicateOptions
} from '../services/outputService'

interface UseOutputOptions {
  autoSave?: boolean
  autoSaveDelay?: number
  onSave?: (output: Output) => void
  onError?: (error: Error) => void
}

interface UseOutputReturn {
  // State
  output: Output | null
  loading: boolean
  saving: boolean
  validating: boolean
  error: string | null
  
  // Validation
  validationResult: ValidationResult | null
  isValid: boolean
  
  // Actions
  loadOutput: (id: string) => Promise<Output | null>
  createOutput: (data: OutputCreateRequest) => Promise<Output | null>
  updateOutput: (updates: Partial<Output>) => void
  saveOutput: (outputData?: Output) => Promise<Output | null>
  deleteOutput: (id?: string) => Promise<boolean>
  
  // Validation
  validateOutput: (outputData?: Output) => Promise<ValidationResult>
  clearValidation: () => void
  
  // Templates
  loadTemplate: (templateId: string) => Promise<Output | null>
  saveAsTemplate: (metadata: TemplateMetadata) => Promise<boolean>
  
  // Export/Import
  exportOutput: (options: ExportOptions) => Promise<boolean>
  duplicateOutput: (options?: DuplicateOptions) => Promise<Output | null>
  
  // Preview
  generatePreview: (format: 'html' | 'pdf') => Promise<Blob | null>
  
  // Utility
  reset: () => void
  isDirty: boolean
}

export const useOutput = (
  initialOutputId?: string, 
  options: UseOutputOptions = {}
): UseOutputReturn => {
  const [output, setOutput] = useState<Output | null>(null)
  const [originalOutput, setOriginalOutput] = useState<Output | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  const { 
    autoSave = false, 
    autoSaveDelay = 2000,
    onSave,
    onError
  } = options

  // Computed properties
  const isValid = validationResult?.isValid ?? true
  const isDirty = JSON.stringify(output) !== JSON.stringify(originalOutput)

  // Load output by ID
  const loadOutput = useCallback(async (id: string): Promise<Output | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const loadedOutput = await outputService.get(id)
      setOutput(loadedOutput)
      setOriginalOutput(JSON.parse(JSON.stringify(loadedOutput)))
      return loadedOutput
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load output'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return null
    } finally {
      setLoading(false)
    }
  }, [onError])

  // Create new output
  const createOutput = useCallback(async (data: OutputCreateRequest): Promise<Output | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const newOutput = await outputService.create(data)
      setOutput(newOutput)
      setOriginalOutput(JSON.parse(JSON.stringify(newOutput)))
      message.success('Output created successfully')
      onSave?.(newOutput)
      return newOutput
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create output'
      setError(errorMessage)
      message.error(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return null
    } finally {
      setLoading(false)
    }
  }, [onSave, onError])

  // Update output in memory
  const updateOutput = useCallback((updates: Partial<Output>) => {
    setOutput(prev => {
      if (!prev) return null
      return { ...prev, ...updates }
    })
    
    // Clear previous auto-save timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
    
    // Set new auto-save timeout if enabled
    if (autoSave && output?.id) {
      const timeout = setTimeout(() => {
        saveOutput()
      }, autoSaveDelay)
      setAutoSaveTimeout(timeout)
    }
  }, [output?.id, autoSave, autoSaveDelay, autoSaveTimeout])

  // Save output to server
  const saveOutput = useCallback(async (outputData?: Output): Promise<Output | null> => {
    const dataToSave = outputData || output
    if (!dataToSave) return null

    setSaving(true)
    setError(null)

    try {
      let savedOutput: Output

      if (dataToSave.id) {
        // Update existing output
        savedOutput = await outputService.update(dataToSave.id, dataToSave)
      } else {
        // Create new output
        savedOutput = await outputService.create(dataToSave as OutputCreateRequest)
      }

      setOutput(savedOutput)
      setOriginalOutput(JSON.parse(JSON.stringify(savedOutput)))
      message.success('Output saved successfully')
      onSave?.(savedOutput)
      return savedOutput
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save output'
      setError(errorMessage)
      message.error(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return null
    } finally {
      setSaving(false)
    }
  }, [output, onSave, onError])

  // Delete output
  const deleteOutput = useCallback(async (id?: string): Promise<boolean> => {
    const outputId = id || output?.id
    if (!outputId) return false

    setLoading(true)
    setError(null)

    try {
      await outputService.delete(outputId)
      if (outputId === output?.id) {
        setOutput(null)
        setOriginalOutput(null)
      }
      message.success('Output deleted successfully')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete output'
      setError(errorMessage)
      message.error(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return false
    } finally {
      setLoading(false)
    }
  }, [output?.id, onError])

  // Validate output
  const validateOutput = useCallback(async (outputData?: Output): Promise<ValidationResult> => {
    const dataToValidate = outputData || output
    if (!dataToValidate) {
      return { isValid: false, errors: [], warnings: [] }
    }

    setValidating(true)
    setError(null)

    try {
      const result = await outputService.validate(dataToValidate)
      setValidationResult(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Validation failed'
      setError(errorMessage)
      const failedResult = { 
        isValid: false, 
        errors: [{ field: 'general', message: errorMessage, code: 'VALIDATION_ERROR', severity: 'error' as const }], 
        warnings: [] 
      }
      setValidationResult(failedResult)
      return failedResult
    } finally {
      setValidating(false)
    }
  }, [output])

  // Clear validation
  const clearValidation = useCallback(() => {
    setValidationResult(null)
  }, [])

  // Load from template
  const loadTemplate = useCallback(async (templateId: string): Promise<Output | null> => {
    setLoading(true)
    setError(null)

    try {
      const templateOutput = await outputService.loadFromTemplate(templateId)
      setOutput(templateOutput)
      setOriginalOutput(JSON.parse(JSON.stringify(templateOutput)))
      return templateOutput
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load template'
      setError(errorMessage)
      message.error(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return null
    } finally {
      setLoading(false)
    }
  }, [onError])

  // Save as template
  const saveAsTemplate = useCallback(async (metadata: TemplateMetadata): Promise<boolean> => {
    if (!output?.id) return false

    setLoading(true)
    setError(null)

    try {
      await outputService.saveAsTemplate(output.id, metadata)
      message.success('Template saved successfully')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template'
      setError(errorMessage)
      message.error(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return false
    } finally {
      setLoading(false)
    }
  }, [output?.id, onError])

  // Export output
  const exportOutput = useCallback(async (options: ExportOptions): Promise<boolean> => {
    if (!output?.id) return false

    setLoading(true)
    setError(null)

    try {
      const blob = await outputService.export(output.id, options)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${output.name || 'output'}.${options.format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      message.success('Export completed successfully')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed'
      setError(errorMessage)
      message.error(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return false
    } finally {
      setLoading(false)
    }
  }, [output, onError])

  // Duplicate output
  const duplicateOutput = useCallback(async (options?: DuplicateOptions): Promise<Output | null> => {
    if (!output?.id) return null

    setLoading(true)
    setError(null)

    try {
      const duplicated = await outputService.duplicate(output.id, options)
      message.success('Output duplicated successfully')
      return duplicated
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate output'
      setError(errorMessage)
      message.error(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return null
    } finally {
      setLoading(false)
    }
  }, [output?.id, onError])

  // Generate preview
  const generatePreview = useCallback(async (format: 'html' | 'pdf'): Promise<Blob | null> => {
    if (!output?.id) return null

    setLoading(true)
    setError(null)

    try {
      const blob = await outputService.generatePreview(output.id, format)
      return blob
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview'
      setError(errorMessage)
      message.error(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      return null
    } finally {
      setLoading(false)
    }
  }, [output?.id, onError])

  // Reset state
  const reset = useCallback(() => {
    setOutput(null)
    setOriginalOutput(null)
    setError(null)
    setValidationResult(null)
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
      setAutoSaveTimeout(null)
    }
  }, [autoSaveTimeout])

  // Load initial output
  useEffect(() => {
    if (initialOutputId) {
      loadOutput(initialOutputId)
    }
  }, [initialOutputId, loadOutput])

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
    }
  }, [autoSaveTimeout])

  return {
    // State
    output,
    loading,
    saving,
    validating,
    error,
    
    // Validation
    validationResult,
    isValid,
    
    // Actions
    loadOutput,
    createOutput,
    updateOutput,
    saveOutput,
    deleteOutput,
    
    // Validation
    validateOutput,
    clearValidation,
    
    // Templates
    loadTemplate,
    saveAsTemplate,
    
    // Export/Import
    exportOutput,
    duplicateOutput,
    
    // Preview
    generatePreview,
    
    // Utility
    reset,
    isDirty
  }
}

export default useOutput