import { api } from './api';

// Types for method management
export interface AnalysisMethod {
  id: string;
  name: string;
  description: string;
  label?: string;
  reporting_event_id: string;
  code_template?: string;
  operations: Operation[];
  created_at: string;
  updated_at: string;
}

export interface AnalysisMethodCreate {
  id: string;
  name: string;
  description: string;
  label?: string;
  reporting_event_id: string;
  code_template?: string;
  operations?: OperationCreate[];
  document_refs?: { [key: string]: PageRef[] };
}

export interface AnalysisMethodUpdate {
  name?: string;
  description?: string;
  label?: string;
  code_template?: string;
}

export interface Operation {
  id: string;
  name: string;
  description?: string;
  order_num: number;
  result_pattern?: string;
  referenced_relationships?: OperationRelationship[];
}

export interface OperationCreate {
  id: string;
  name: string;
  description?: string;
  order_num: number;
  result_pattern?: string;
  method_id: string;
  referenced_relationships?: OperationRelationshipCreate[];
}

export interface OperationUpdate {
  name?: string;
  description?: string;
  order_num?: number;
  result_pattern?: string;
}

export interface OperationRelationship {
  id: string;
  referenced_operation_role: string;
  referenced_operation_id: string;
  description?: string;
}

export interface OperationRelationshipCreate {
  id: string;
  operation_id: string;
  referenced_operation_role: string;
  referenced_operation_id: string;
  description?: string;
}

export interface PageRef {
  ref_type: string;
  page_names?: string[];
  page_numbers?: number[];
  first_page?: number;
  last_page?: number;
}

export interface MethodTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  operations: TemplateOperation[];
  code_templates: { [key: string]: CodeTemplate };
}

export interface TemplateOperation {
  id: string;
  name: string;
  description?: string;
  order: number;
  result_pattern?: string;
}

export interface CodeTemplate {
  template: string;
  parameters: TemplateParameter[];
  description?: string;
  example_usage?: string;
}

export interface TemplateParameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description: string;
  validation?: string;
}

export interface MethodParameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description: string;
  validation?: string;
  programming_context?: string;
  category?: string;
}

export interface ValidationResult {
  method_id: string;
  validation_status: 'valid' | 'warning' | 'error' | 'unknown';
  issues: string[];
  warnings: string[];
  suggestions: string[];
  score: number;
}

export interface UsageStatistics {
  method_id: string;
  analyses_count: number;
  reporting_events_count: number;
  reporting_event_ids: string[];
}

export interface MethodQueryParams {
  skip?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  reporting_event_id?: string;
  statistical_category?: string;
  programming_context?: string;
  has_code_template?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total_count: number;
    page_size: number;
    current_page: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

/**
 * Service for managing analysis methods
 */
export class MethodService {
  private baseUrl = '/api/v1/methods';

  /**
   * Get a list of analysis methods with filtering and pagination
   */
  async getMethods(params?: MethodQueryParams): Promise<PaginatedResponse<AnalysisMethod>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseUrl}?${queryParams.toString()}`;
    const response = await api.get(url);
    return response.data;
  }

  /**
   * Get method templates organized by category
   */
  async getTemplates(category?: string): Promise<MethodTemplate[]> {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    const response = await api.get(`${this.baseUrl}/templates${params}`);
    return response.data;
  }

  /**
   * Create a new method from a template
   */
  async createFromTemplate(
    templateId: string, 
    methodData: any
  ): Promise<AnalysisMethod> {
    const response = await api.post(`${this.baseUrl}/from-template`, {
      template_id: templateId,
      method_data: methodData
    });
    return response.data;
  }

  /**
   * Get a specific method by ID with all relationships
   */
  async getMethod(id: string): Promise<AnalysisMethod> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Create a new analysis method
   */
  async createMethod(method: AnalysisMethodCreate): Promise<AnalysisMethod> {
    const response = await api.post(this.baseUrl, method);
    return response.data;
  }

  /**
   * Update an existing analysis method
   */
  async updateMethod(id: string, method: AnalysisMethodUpdate): Promise<AnalysisMethod> {
    const response = await api.put(`${this.baseUrl}/${id}`, method);
    return response.data;
  }

  /**
   * Delete an analysis method
   */
  async deleteMethod(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${this.baseUrl}/${id}`);
    return response.data;
  }

  /**
   * Clone an analysis method
   */
  async cloneMethod(
    id: string, 
    newId: string, 
    newName: string, 
    reportingEventId: string
  ): Promise<{ message: string; method: AnalysisMethod }> {
    const response = await api.post(`${this.baseUrl}/${id}/clone`, {
      new_id: newId,
      new_name: newName,
      reporting_event_id: reportingEventId
    });
    return response.data;
  }

  /**
   * Get code template for a method in specific programming context
   */
  async getCodeTemplate(
    id: string, 
    programmingContext: string = 'SAS'
  ): Promise<{
    method_id: string;
    programming_context: string;
    template: string;
    parameters: TemplateParameter[];
    description: string;
    example_usage: string;
  }> {
    const response = await api.get(
      `${this.baseUrl}/${id}/code-template?programming_context=${programmingContext}`
    );
    return response.data;
  }

  /**
   * Update code template for a method
   */
  async updateCodeTemplate(
    id: string, 
    templateData: {
      programming_context?: string;
      template?: string;
      parameters?: TemplateParameter[];
      description?: string;
      example_usage?: string;
    }
  ): Promise<{ message: string; template: any }> {
    const response = await api.put(`${this.baseUrl}/${id}/code-template`, templateData);
    return response.data;
  }

  /**
   * Get all operations for a method
   */
  async getOperations(id: string): Promise<Operation[]> {
    const response = await api.get(`${this.baseUrl}/${id}/operations`);
    return response.data;
  }

  /**
   * Add a new operation to a method
   */
  async createOperation(methodId: string, operation: OperationCreate): Promise<Operation> {
    const response = await api.post(`${this.baseUrl}/${methodId}/operations`, operation);
    return response.data;
  }

  /**
   * Update an operation in a method
   */
  async updateOperation(
    methodId: string, 
    operationId: string, 
    operation: OperationUpdate
  ): Promise<Operation> {
    const response = await api.put(
      `${this.baseUrl}/${methodId}/operations/${operationId}`, 
      operation
    );
    return response.data;
  }

  /**
   * Delete an operation from a method
   */
  async deleteOperation(
    methodId: string, 
    operationId: string
  ): Promise<{ message: string }> {
    const response = await api.delete(`${this.baseUrl}/${methodId}/operations/${operationId}`);
    return response.data;
  }

  /**
   * Reorder operations within a method
   */
  async reorderOperations(
    methodId: string, 
    operationOrders: { operation_id: string; order_num: number }[]
  ): Promise<{ message: string; operations: Operation[] }> {
    const response = await api.post(
      `${this.baseUrl}/${methodId}/operations/reorder`, 
      operationOrders
    );
    return response.data;
  }

  /**
   * Get configurable parameters for a method
   */
  async getParameters(id: string): Promise<MethodParameter[]> {
    const response = await api.get(`${this.baseUrl}/${id}/parameters`);
    return response.data;
  }

  /**
   * Update parameter definitions for a method
   */
  async updateParameters(
    id: string, 
    parameters: MethodParameter[]
  ): Promise<{ message: string; parameters: MethodParameter[] }> {
    const response = await api.put(`${this.baseUrl}/${id}/parameters`, parameters);
    return response.data;
  }

  /**
   * Validate a method definition
   */
  async validateMethod(
    id: string, 
    options?: { [key: string]: any }
  ): Promise<ValidationResult> {
    const response = await api.post(`${this.baseUrl}/${id}/validate`, options || {});
    return response.data;
  }

  /**
   * Get usage statistics for a method
   */
  async getUsageStatistics(id: string): Promise<UsageStatistics> {
    const response = await api.get(`${this.baseUrl}/${id}/usage-statistics`);
    return response.data;
  }

  /**
   * Advanced search for methods with multiple criteria
   */
  async advancedSearch(
    query: string,
    options?: {
      statistical_category?: string;
      programming_context?: string;
      has_code_template?: boolean;
      reporting_event_id?: string;
      skip?: number;
      limit?: number;
    }
  ): Promise<{ methods: AnalysisMethod[]; count: number; search_criteria: any }> {
    const params = new URLSearchParams({ query });
    
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await api.get(`${this.baseUrl}/search/advanced?${params.toString()}`);
    return response.data;
  }

  /**
   * Perform bulk operations on multiple methods
   */
  async bulkOperations(
    operations: Array<{
      type: string;
      method_ids: string[];
      [key: string]: any;
    }>
  ): Promise<{ results: any[] }> {
    const response = await api.post(`${this.baseUrl}/bulk-operations`, operations);
    return response.data;
  }

  /**
   * Export method data
   */
  async exportMethod(id: string, format: 'json' | 'yaml' = 'json'): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/${id}`, {
      responseType: 'blob',
      headers: {
        'Accept': format === 'json' ? 'application/json' : 'application/yaml'
      }
    });
    return response.data;
  }

  /**
   * Import method from file
   */
  async importMethod(file: File, reportingEventId: string): Promise<AnalysisMethod> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('reporting_event_id', reportingEventId);

    const response = await api.post(`${this.baseUrl}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  /**
   * Get method statistics summary
   */
  async getMethodStatistics(): Promise<{
    total_methods: number;
    methods_by_category: { [key: string]: number };
    methods_with_templates: number;
    most_used_methods: AnalysisMethod[];
  }> {
    const response = await api.get(`${this.baseUrl}/statistics`);
    return response.data;
  }
}

// Create and export a singleton instance
export const methodService = new MethodService();