/**
 * Custom hooks for import/export operations
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  importExportService,
  ExportRequest,
  ImportConfig,
  ExportResponse,
  ImportResponse,
  ImportPreviewResponse,
  SupportedFormat,
  BatchImportResponse,
  BatchStatus,
  FieldMapping
} from '../services/importExportService';

export interface UseImportExportOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  autoDownload?: boolean;
}

export interface ImportExportState {
  isLoading: boolean;
  error: string | null;
  progress: number;
  lastOperation: 'import' | 'export' | 'preview' | null;
}

export const useImportExport = (options: UseImportExportOptions = {}) => {
  const [state, setState] = useState<ImportExportState>({
    isLoading: false,
    error: null,
    progress: 0,
    lastOperation: null
  });

  const [supportedFormats, setSupportedFormats] = useState<{
    import_formats: SupportedFormat[];
    export_formats: SupportedFormat[];
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const updateState = useCallback((updates: Partial<ImportExportState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      progress: 0,
      lastOperation: null
    });
  }, []);

  const handleProgress = useCallback((progress: number) => {
    updateState({ progress });
  }, [updateState]);

  const handleError = useCallback((error: string) => {
    updateState({ error, isLoading: false });
    if (options.onError) {
      options.onError(error);
    }
  }, [updateState, options]);

  const handleSuccess = useCallback((message: string) => {
    updateState({ isLoading: false, error: null });
    if (options.onSuccess) {
      options.onSuccess(message);
    }
  }, [updateState, options]);

  /**
   * Export data
   */
  const exportData = useCallback(async (
    exportRequest: ExportRequest
  ): Promise<ExportResponse | null> => {
    try {
      updateState({ 
        isLoading: true, 
        error: null, 
        progress: 0, 
        lastOperation: 'export' 
      });

      const response = await importExportService.exportData(
        exportRequest,
        handleProgress
      );

      handleSuccess(response.message);

      // Auto-download if enabled and download URL is available
      if (options.autoDownload && response.download_url) {
        const filename = response.download_url.split('/').pop();
        if (filename) {
          await importExportService.triggerDownload(filename);
        }
      }

      return response;
    } catch (error: any) {
      handleError(error.message);
      return null;
    }
  }, [updateState, handleProgress, handleSuccess, handleError, options.autoDownload]);

  /**
   * Preview import data
   */
  const previewImport = useCallback(async (
    file: File
  ): Promise<ImportPreviewResponse | null> => {
    try {
      updateState({ 
        isLoading: true, 
        error: null, 
        progress: 0, 
        lastOperation: 'preview' 
      });

      const response = await importExportService.previewImport(file);

      updateState({ isLoading: false, progress: 100 });
      return response;
    } catch (error: any) {
      handleError(error.message);
      return null;
    }
  }, [updateState, handleError]);

  /**
   * Import data
   */
  const importData = useCallback(async (
    file: File,
    config: ImportConfig
  ): Promise<ImportResponse | null> => {
    try {
      updateState({ 
        isLoading: true, 
        error: null, 
        progress: 0, 
        lastOperation: 'import' 
      });

      const response = await importExportService.importData(
        file,
        config,
        handleProgress
      );

      if (response.success) {
        handleSuccess(response.message);
      } else {
        handleError(response.message);
      }

      return response;
    } catch (error: any) {
      handleError(error.message);
      return null;
    }
  }, [updateState, handleProgress, handleSuccess, handleError]);

  /**
   * Validate data
   */
  const validateData = useCallback(async (
    data: any,
    dataType: string
  ): Promise<any> => {
    try {
      updateState({ isLoading: true, error: null });
      const response = await importExportService.validateData(data, dataType);
      updateState({ isLoading: false });
      return response;
    } catch (error: any) {
      handleError(error.message);
      return null;
    }
  }, [updateState, handleError]);

  /**
   * Download file
   */
  const downloadFile = useCallback(async (
    filename: string,
    downloadFilename?: string
  ): Promise<boolean> => {
    try {
      updateState({ isLoading: true, error: null });
      await importExportService.triggerDownload(filename, downloadFilename);
      updateState({ isLoading: false });
      return true;
    } catch (error: any) {
      handleError(error.message);
      return false;
    }
  }, [updateState, handleError]);

  /**
   * Get supported formats
   */
  const getSupportedFormats = useCallback(async () => {
    try {
      if (supportedFormats) {
        return supportedFormats;
      }

      const formats = await importExportService.getSupportedFormats();
      setSupportedFormats(formats);
      return formats;
    } catch (error: any) {
      handleError(error.message);
      return null;
    }
  }, [supportedFormats, handleError]);

  /**
   * Get field mappings for data type
   */
  const getFieldMappings = useCallback(async (dataType: string) => {
    try {
      return await importExportService.getFieldMappings(dataType);
    } catch (error: any) {
      handleError(error.message);
      return null;
    }
  }, [handleError]);

  /**
   * Cancel current operation
   */
  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    resetState();
  }, [resetState]);

  // Load supported formats on mount
  useEffect(() => {
    getSupportedFormats();
  }, [getSupportedFormats]);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    progress: state.progress,
    lastOperation: state.lastOperation,
    supportedFormats,

    // Actions
    exportData,
    previewImport,
    importData,
    validateData,
    downloadFile,
    getSupportedFormats,
    getFieldMappings,
    cancelOperation,
    resetState
  };
};

/**
 * Hook for batch import operations
 */
export const useBatchImport = () => {
  const [batchState, setBatchState] = useState<{
    isRunning: boolean;
    batchId: string | null;
    status: BatchStatus | null;
    error: string | null;
  }>({
    isRunning: false,
    batchId: null,
    status: null,
    error: null
  });

  const startBatchImport = useCallback(async (
    files: File[],
    config: ImportConfig,
    onProgress?: (progress: number) => void
  ): Promise<boolean> => {
    try {
      setBatchState({
        isRunning: true,
        batchId: null,
        status: null,
        error: null
      });

      const response = await importExportService.batchImport(
        files,
        config,
        onProgress
      );

      setBatchState(prev => ({
        ...prev,
        batchId: response.batch_id
      }));

      // Start polling for status
      const finalStatus = await importExportService.pollBatchStatus(
        response.batch_id,
        (status) => {
          setBatchState(prev => ({
            ...prev,
            status
          }));
        }
      );

      setBatchState(prev => ({
        ...prev,
        isRunning: false,
        status: finalStatus
      }));

      return finalStatus.status === 'completed';
    } catch (error: any) {
      setBatchState(prev => ({
        ...prev,
        isRunning: false,
        error: error.message
      }));
      return false;
    }
  }, []);

  const resetBatchState = useCallback(() => {
    setBatchState({
      isRunning: false,
      batchId: null,
      status: null,
      error: null
    });
  }, []);

  return {
    isRunning: batchState.isRunning,
    batchId: batchState.batchId,
    status: batchState.status,
    error: batchState.error,
    startBatchImport,
    resetBatchState
  };
};

/**
 * Hook for field mapping operations
 */
export const useFieldMapping = (initialMappings: FieldMapping[] = []) => {
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>(initialMappings);

  const addMapping = useCallback((mapping: FieldMapping) => {
    setFieldMappings(prev => [...prev, mapping]);
  }, []);

  const updateMapping = useCallback((index: number, updates: Partial<FieldMapping>) => {
    setFieldMappings(prev => prev.map((mapping, i) => 
      i === index ? { ...mapping, ...updates } : mapping
    ));
  }, []);

  const removeMapping = useCallback((index: number) => {
    setFieldMappings(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearMappings = useCallback(() => {
    setFieldMappings([]);
  }, []);

  const autoMapFields = useCallback((
    sourceFields: string[],
    targetFields: string[]
  ) => {
    const autoMappings: FieldMapping[] = [];
    
    sourceFields.forEach(sourceField => {
      const lowerSource = sourceField.toLowerCase();
      
      // Find exact matches first
      const exactMatch = targetFields.find(target => 
        target.toLowerCase() === lowerSource
      );
      
      if (exactMatch) {
        autoMappings.push({
          source_field: sourceField,
          target_field: exactMatch,
          required: ['id', 'name'].includes(exactMatch),
          transform_function: 'none'
        });
        return;
      }
      
      // Find partial matches
      const partialMatch = targetFields.find(target => {
        const lowerTarget = target.toLowerCase();
        return lowerSource.includes(lowerTarget) || lowerTarget.includes(lowerSource);
      });
      
      if (partialMatch) {
        autoMappings.push({
          source_field: sourceField,
          target_field: partialMatch,
          required: ['id', 'name'].includes(partialMatch),
          transform_function: 'none'
        });
      }
    });
    
    setFieldMappings(autoMappings);
  }, []);

  return {
    fieldMappings,
    setFieldMappings,
    addMapping,
    updateMapping,
    removeMapping,
    clearMappings,
    autoMapFields
  };
};

export default useImportExport;