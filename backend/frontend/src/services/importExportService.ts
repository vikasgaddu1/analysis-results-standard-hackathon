/**
 * Service for handling import/export operations with the ARS backend
 */

import axios, { AxiosProgressEvent } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

export interface ExportRequest {
  format: 'yaml' | 'json' | 'excel';
  reporting_event_id?: string;
  analysis_ids?: string[];
  include_metadata?: boolean;
  include_timestamps?: boolean;
  flatten_nested?: boolean;
}

export interface ImportConfig {
  validate_before_import?: boolean;
  skip_duplicates?: boolean;
  update_existing?: boolean;
  dry_run?: boolean;
  field_mappings?: FieldMapping[];
}

export interface FieldMapping {
  source_field: string;
  target_field: string;
  required?: boolean;
  default_value?: string;
  transform_function?: string;
}

export interface ExportResponse {
  success: boolean;
  message: string;
  file_path?: string;
  download_url?: string;
  records_exported: number;
  export_time: string;
}

export interface ImportResponse {
  success: boolean;
  message: string;
  records_imported: number;
  records_updated: number;
  records_skipped: number;
  errors: string[];
  warnings: string[];
  import_time: string;
  validation_results?: any;
}

export interface ImportPreviewResponse {
  file_type: string;
  structure: Record<string, any>;
  sample_data: Record<string, any>;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  metadata?: Record<string, any>;
}

export interface SupportedFormat {
  format: string;
  extensions: string[];
  description: string;
}

export interface BatchImportResponse {
  batch_id: string;
  status: string;
  message: string;
  check_status_url: string;
}

export interface BatchStatus {
  status: 'processing' | 'completed' | 'failed';
  total_files: number;
  completed_files: number;
  results: Array<{
    filename: string;
    status: string;
    records_imported?: number;
    errors?: string[];
  }>;
  started_at: string;
  completed_at?: string;
  error?: string;
}

class ImportExportService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/import-export`;
  }

  /**
   * Get authorization headers for API requests
   */
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  /**
   * Export data in specified format
   */
  async exportData(
    exportRequest: ExportRequest,
    onProgress?: (progress: number) => void
  ): Promise<ExportResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/export`,
        exportRequest,
        {
          headers: this.getAuthHeaders(),
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              onProgress(progress);
            }
          }
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Export failed'
      );
    }
  }

  /**
   * Preview import data before actual import
   */
  async previewImport(file: File): Promise<ImportPreviewResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${this.baseUrl}/import/preview`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(localStorage.getItem('auth_token') && {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            })
          }
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Preview failed'
      );
    }
  }

  /**
   * Import data from file
   */
  async importData(
    file: File,
    config: ImportConfig,
    onProgress?: (progress: number) => void
  ): Promise<ImportResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('import_config', JSON.stringify(config));

      const response = await axios.post(
        `${this.baseUrl}/import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(localStorage.getItem('auth_token') && {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            })
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              onProgress(progress);
            }
          }
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Import failed'
      );
    }
  }

  /**
   * Download exported file
   */
  async downloadFile(filename: string): Promise<Blob> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/download/${filename}`,
        {
          headers: {
            ...(localStorage.getItem('auth_token') && {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            })
          },
          responseType: 'blob'
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Download failed'
      );
    }
  }

  /**
   * Trigger download of exported file
   */
  async triggerDownload(filename: string, downloadFilename?: string): Promise<void> {
    try {
      const blob = await this.downloadFile(filename);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFilename || filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate data structure and content
   */
  async validateData(data: any, dataType: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/validate`,
        { data, data_type: dataType },
        {
          headers: this.getAuthHeaders()
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Validation failed'
      );
    }
  }

  /**
   * Get supported import/export formats
   */
  async getSupportedFormats(): Promise<{
    import_formats: SupportedFormat[];
    export_formats: SupportedFormat[];
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/formats`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to get supported formats'
      );
    }
  }

  /**
   * Get field mappings for a specific data type
   */
  async getFieldMappings(dataType: string): Promise<{
    data_type: string;
    field_mappings: Array<{
      source_field: string;
      target_field: string;
      required: boolean;
    }>;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/field-mappings/${dataType}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to get field mappings'
      );
    }
  }

  /**
   * Import multiple files in batch
   */
  async batchImport(
    files: File[],
    config: ImportConfig,
    onProgress?: (progress: number) => void
  ): Promise<BatchImportResponse> {
    try {
      const formData = new FormData();
      
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      formData.append('import_config', JSON.stringify(config));

      const response = await axios.post(
        `${this.baseUrl}/batch-import`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(localStorage.getItem('auth_token') && {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            })
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              onProgress(progress);
            }
          }
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Batch import failed'
      );
    }
  }

  /**
   * Get batch import status
   */
  async getBatchStatus(batchId: string): Promise<BatchStatus> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/batch-status/${batchId}`,
        {
          headers: {
            ...(localStorage.getItem('auth_token') && {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`
            })
          }
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.message || 
        'Failed to get batch status'
      );
    }
  }

  /**
   * Poll batch status until completion
   */
  async pollBatchStatus(
    batchId: string,
    onUpdate?: (status: BatchStatus) => void,
    intervalMs: number = 2000
  ): Promise<BatchStatus> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getBatchStatus(batchId);
          
          if (onUpdate) {
            onUpdate(status);
          }

          if (status.status === 'completed' || status.status === 'failed') {
            resolve(status);
          } else {
            setTimeout(poll, intervalMs);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

// Export singleton instance
export const importExportService = new ImportExportService();

// Export types and service class
export default ImportExportService;