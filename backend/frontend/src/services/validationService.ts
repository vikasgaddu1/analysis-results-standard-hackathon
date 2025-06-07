/**
 * Validation service for API interactions
 */

import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export interface ValidationResult {
  id: string;
  rule_id: string;
  rule_name: string;
  category: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  field_path?: string;
  value?: any;
  expected_value?: any;
  suggestions: string[];
  metadata: Record<string, any>;
  timestamp: string;
  is_passing: boolean;
  is_failing: boolean;
}

export interface ValidationSummary {
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  warnings: number;
  errors: number;
  critical_issues: number;
  compliance_score: number;
  pass_rate: number;
  overall_status: string;
}

export interface ValidationSession {
  id: string;
  user_id?: string;
  profile_name: string;
  object_type: string;
  object_id?: string;
  status: string;
  started_at: string;
  completed_at?: string;
  execution_time_seconds?: number;
  summary: ValidationSummary;
  results: ValidationResult[];
  metadata: Record<string, any>;
}

export interface ValidationProfile {
  name: string;
  display_name?: string;
  description?: string;
  enabled_validators: string[];
  severity_threshold: string;
  fail_fast: boolean;
  parallel_execution: boolean;
  excluded_rules: string[];
  is_system_profile: boolean;
}

export interface ValidationRule {
  rule_id: string;
  validator_name: string;
  name: string;
  description?: string;
  category: string;
  severity: string;
  is_enabled: boolean;
  object_types: string[];
  documentation_url?: string;
}

export interface ValidationRequest {
  data: any;
  object_type: string;
  object_id?: string;
  profile?: string;
  include_warnings?: boolean;
  include_info?: boolean;
  custom_rules?: string[];
  excluded_rules?: string[];
}

export interface BatchValidationRequest {
  items: Array<{
    data: any;
    object_type: string;
    object_id?: string;
  }>;
  profile?: string;
}

export interface ValidationResponse {
  session_id: string;
  status: string;
  summary: ValidationSummary;
  results: ValidationResult[];
  execution_time_seconds: number;
  metadata: Record<string, any>;
}

export interface ValidationMetrics {
  period_days: number;
  total_validations: number;
  total_checks: number;
  total_failures: number;
  pass_rate: number;
  average_compliance_score: number;
  average_execution_time_seconds: number;
  top_failing_object_types: Array<[string, number]>;
}

export interface SuppressionRequest {
  rule_id: string;
  reason: string;
  object_type?: string;
  object_id?: string;
  field_path?: string;
  expires_at?: string;
}

class ValidationService {
  private axios = axios.create({
    baseURL: `${API_BASE_URL}/validation`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add auth interceptor
    this.axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Validation API error:', error);
        throw error;
      }
    );
  }

  /**
   * Validate data using specified profile
   */
  async validateData(request: ValidationRequest): Promise<ValidationResponse> {
    const response: AxiosResponse<ValidationResponse> = await this.axios.post('/validate', {
      data: request.data,
      object_type: request.object_type,
      object_id: request.object_id,
      profile: request.profile || 'default',
      include_warnings: request.include_warnings ?? true,
      include_info: request.include_info ?? false,
      custom_rules: request.custom_rules || [],
      excluded_rules: request.excluded_rules || [],
    });
    return response.data;
  }

  /**
   * Validate multiple items in batch
   */
  async validateBatch(request: BatchValidationRequest): Promise<any> {
    const response = await this.axios.post('/validate/batch', {
      items: request.items,
      profile: request.profile || 'default',
    });
    return response.data;
  }

  /**
   * Get validation session details
   */
  async getValidationSession(sessionId: string): Promise<ValidationSession> {
    const response: AxiosResponse<ValidationSession> = await this.axios.get(`/sessions/${sessionId}`);
    return response.data;
  }

  /**
   * List validation sessions
   */
  async listValidationSessions(params: {
    limit?: number;
    offset?: number;
    object_type?: string;
    status?: string;
  } = {}): Promise<ValidationSession[]> {
    const response: AxiosResponse<ValidationSession[]> = await this.axios.get('/sessions', {
      params: {
        limit: params.limit || 50,
        offset: params.offset || 0,
        ...(params.object_type && { object_type: params.object_type }),
        ...(params.status && { status: params.status }),
      },
    });
    return response.data;
  }

  /**
   * List available validation profiles
   */
  async listValidationProfiles(): Promise<ValidationProfile[]> {
    const response: AxiosResponse<ValidationProfile[]> = await this.axios.get('/profiles');
    return response.data;
  }

  /**
   * List validation rules
   */
  async listValidationRules(params: {
    validator?: string;
    category?: string;
  } = {}): Promise<ValidationRule[]> {
    const response: AxiosResponse<ValidationRule[]> = await this.axios.get('/rules', {
      params,
    });
    return response.data;
  }

  /**
   * Create validation result suppression
   */
  async createSuppression(request: SuppressionRequest): Promise<{ message: string; id: number }> {
    const response = await this.axios.post('/suppressions', request);
    return response.data;
  }

  /**
   * Get validation metrics
   */
  async getValidationMetrics(params: {
    days?: number;
    object_type?: string;
  } = {}): Promise<ValidationMetrics> {
    const response: AxiosResponse<ValidationMetrics> = await this.axios.get('/metrics/summary', {
      params: {
        days: params.days || 30,
        ...(params.object_type && { object_type: params.object_type }),
      },
    });
    return response.data;
  }

  /**
   * Get severity color for UI display
   */
  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#f56565'; // red
      case 'error':
        return '#ed8936'; // orange
      case 'warning':
        return '#ecc94b'; // yellow
      case 'info':
        return '#4299e1'; // blue
      default:
        return '#718096'; // gray
    }
  }

  /**
   * Get severity icon for UI display
   */
  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'error':
        return '🟠';
      case 'warning':
        return '🟡';
      case 'info':
        return '🔵';
      default:
        return '⚪';
    }
  }

  /**
   * Format compliance score for display
   */
  formatComplianceScore(score: number): string {
    return `${score.toFixed(1)}%`;
  }

  /**
   * Get status color for overall validation status
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'excellent':
        return '#48bb78'; // green
      case 'good':
        return '#68d391'; // light green
      case 'acceptable':
        return '#ecc94b'; // yellow
      case 'needs_improvement':
        return '#ed8936'; // orange
      case 'failed':
        return '#f56565'; // red
      case 'critical':
        return '#c53030'; // dark red
      default:
        return '#718096'; // gray
    }
  }

  /**
   * Group validation results by category
   */
  groupResultsByCategory(results: ValidationResult[]): Record<string, ValidationResult[]> {
    return results.reduce((acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = [];
      }
      acc[result.category].push(result);
      return acc;
    }, {} as Record<string, ValidationResult[]>);
  }

  /**
   * Group validation results by severity
   */
  groupResultsBySeverity(results: ValidationResult[]): Record<string, ValidationResult[]> {
    return results.reduce((acc, result) => {
      if (!acc[result.severity]) {
        acc[result.severity] = [];
      }
      acc[result.severity].push(result);
      return acc;
    }, {} as Record<string, ValidationResult[]>);
  }

  /**
   * Filter results by severity threshold
   */
  filterResultsBySeverity(results: ValidationResult[], threshold: string): ValidationResult[] {
    const severityOrder = ['info', 'warning', 'error', 'critical'];
    const thresholdIndex = severityOrder.indexOf(threshold);
    
    if (thresholdIndex === -1) return results;
    
    return results.filter(result => 
      severityOrder.indexOf(result.severity) >= thresholdIndex
    );
  }

  /**
   * Export validation results to CSV
   */
  exportResultsToCSV(results: ValidationResult[], filename = 'validation_results.csv'): void {
    const headers = [
      'Rule ID',
      'Rule Name',
      'Category',
      'Severity',
      'Message',
      'Field Path',
      'Value',
      'Expected Value',
      'Suggestions'
    ];

    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        result.rule_id,
        `"${result.rule_name}"`,
        result.category,
        result.severity,
        `"${result.message.replace(/"/g, '""')}"`,
        result.field_path || '',
        `"${String(result.value || '').replace(/"/g, '""')}"`,
        `"${String(result.expected_value || '').replace(/"/g, '""')}"`,
        `"${result.suggestions.join('; ').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export validation session to JSON
   */
  exportSessionToJSON(session: ValidationSession, filename?: string): void {
    const jsonContent = JSON.stringify(session, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `validation_session_${session.id}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const validationService = new ValidationService();
export default validationService;