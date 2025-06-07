/**
 * Custom hooks for validation operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import validationService, {
  ValidationRequest,
  ValidationResponse,
  ValidationSession,
  ValidationProfile,
  ValidationRule,
  ValidationMetrics,
  ValidationResult,
  SuppressionRequest,
  BatchValidationRequest
} from '../services/validationService';

// Query keys
export const validationKeys = {
  all: ['validation'] as const,
  sessions: () => [...validationKeys.all, 'sessions'] as const,
  sessionsList: (filters: Record<string, any>) => [...validationKeys.sessions(), 'list', filters] as const,
  sessionDetail: (id: string) => [...validationKeys.sessions(), 'detail', id] as const,
  profiles: () => [...validationKeys.all, 'profiles'] as const,
  rules: () => [...validationKeys.all, 'rules'] as const,
  rulesList: (filters: Record<string, any>) => [...validationKeys.rules(), 'list', filters] as const,
  metrics: () => [...validationKeys.all, 'metrics'] as const,
  metricsDetail: (filters: Record<string, any>) => [...validationKeys.metrics(), 'detail', filters] as const,
};

// Hook for validation execution
export function useValidation() {
  const queryClient = useQueryClient();
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const validateMutation = useMutation({
    mutationFn: async (request: ValidationRequest) => {
      setIsValidating(true);
      setValidationProgress(0);
      
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();
      
      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setValidationProgress(prev => Math.min(prev + 10, 90));
        }, 100);

        const response = await validationService.validateData(request);
        
        clearInterval(progressInterval);
        setValidationProgress(100);
        
        return response;
      } finally {
        setIsValidating(false);
        abortControllerRef.current = null;
      }
    },
    onSuccess: (data) => {
      toast.success('Validation completed successfully');
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: validationKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: validationKeys.metrics() });
    },
    onError: (error: any) => {
      toast.error(`Validation failed: ${error.message}`);
      setValidationProgress(0);
    },
  });

  const batchValidateMutation = useMutation({
    mutationFn: async (request: BatchValidationRequest) => {
      setIsValidating(true);
      setValidationProgress(0);
      
      try {
        const response = await validationService.validateBatch(request);
        setValidationProgress(100);
        return response;
      } finally {
        setIsValidating(false);
      }
    },
    onSuccess: () => {
      toast.success('Batch validation completed');
      queryClient.invalidateQueries({ queryKey: validationKeys.sessions() });
    },
    onError: (error: any) => {
      toast.error(`Batch validation failed: ${error.message}`);
    },
  });

  const cancelValidation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsValidating(false);
      setValidationProgress(0);
      toast.info('Validation cancelled');
    }
  }, []);

  return {
    validate: validateMutation.mutate,
    validateAsync: validateMutation.mutateAsync,
    batchValidate: batchValidateMutation.mutate,
    batchValidateAsync: batchValidateMutation.mutateAsync,
    cancelValidation,
    isValidating,
    validationProgress,
    isError: validateMutation.isError || batchValidateMutation.isError,
    error: validateMutation.error || batchValidateMutation.error,
    data: validateMutation.data,
    reset: () => {
      validateMutation.reset();
      batchValidateMutation.reset();
      setValidationProgress(0);
    }
  };
}

// Hook for validation sessions
export function useValidationSessions(filters: {
  limit?: number;
  offset?: number;
  object_type?: string;
  status?: string;
} = {}) {
  return useQuery({
    queryKey: validationKeys.sessionsList(filters),
    queryFn: () => validationService.listValidationSessions(filters),
    staleTime: 30000, // 30 seconds
  });
}

// Hook for single validation session
export function useValidationSession(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: validationKeys.sessionDetail(sessionId!),
    queryFn: () => validationService.getValidationSession(sessionId!),
    enabled: enabled && !!sessionId,
    staleTime: 60000, // 1 minute
  });
}

// Hook for validation profiles
export function useValidationProfiles() {
  return useQuery({
    queryKey: validationKeys.profiles(),
    queryFn: () => validationService.listValidationProfiles(),
    staleTime: 300000, // 5 minutes
  });
}

// Hook for validation rules
export function useValidationRules(filters: {
  validator?: string;
  category?: string;
} = {}) {
  return useQuery({
    queryKey: validationKeys.rulesList(filters),
    queryFn: () => validationService.listValidationRules(filters),
    staleTime: 300000, // 5 minutes
  });
}

// Hook for validation metrics
export function useValidationMetrics(filters: {
  days?: number;
  object_type?: string;
} = {}) {
  return useQuery({
    queryKey: validationKeys.metricsDetail(filters),
    queryFn: () => validationService.getValidationMetrics(filters),
    staleTime: 60000, // 1 minute
  });
}

// Hook for result suppression
export function useResultSuppression() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SuppressionRequest) => 
      validationService.createSuppression(request),
    onSuccess: () => {
      toast.success('Validation result suppressed');
      // Invalidate session queries to refresh results
      queryClient.invalidateQueries({ queryKey: validationKeys.sessions() });
    },
    onError: (error: any) => {
      toast.error(`Failed to suppress result: ${error.message}`);
    },
  });
}

// Hook for real-time validation
export function useRealtimeValidation(
  data: any,
  objectType: string,
  options: {
    enabled?: boolean;
    debounceMs?: number;
    profile?: string;
    autoValidate?: boolean;
  } = {}
) {
  const {
    enabled = true,
    debounceMs = 1000,
    profile = 'development',
    autoValidate = true
  } = options;

  const [debouncedData, setDebouncedData] = useState(data);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounce data changes
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedData(data);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs]);

  const { validate } = useValidation();

  // Auto-validate when data changes
  useEffect(() => {
    if (enabled && autoValidate && debouncedData && objectType) {
      validate({
        data: debouncedData,
        object_type: objectType,
        profile,
        include_warnings: true,
        include_info: false,
      });
    }
  }, [debouncedData, objectType, profile, enabled, autoValidate, validate]);

  const manualValidate = useCallback(() => {
    if (data && objectType) {
      validate({
        data,
        object_type: objectType,
        profile,
        include_warnings: true,
        include_info: true,
      });
    }
  }, [data, objectType, profile, validate]);

  return {
    validate: manualValidate,
    results: validationResults,
    isValidating: false, // Would come from validation hook
    hasErrors: validationResults.some(r => r.severity === 'error' || r.severity === 'critical'),
    hasWarnings: validationResults.some(r => r.severity === 'warning'),
  };
}

// Hook for validation result filtering and sorting
export function useValidationResultsFilter(results: ValidationResult[]) {
  const [filters, setFilters] = useState({
    severity: [] as string[],
    category: [] as string[],
    validator: [] as string[],
    searchTerm: '',
    showPassed: false,
  });

  const [sortConfig, setSortConfig] = useState({
    field: 'severity' as keyof ValidationResult,
    direction: 'desc' as 'asc' | 'desc',
  });

  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Apply filters
    if (filters.severity.length > 0) {
      filtered = filtered.filter(r => filters.severity.includes(r.severity));
    }

    if (filters.category.length > 0) {
      filtered = filtered.filter(r => filters.category.includes(r.category));
    }

    if (!filters.showPassed) {
      filtered = filtered.filter(r => !r.is_passing);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.message.toLowerCase().includes(term) ||
        r.rule_name.toLowerCase().includes(term) ||
        r.field_path?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];

      if (sortConfig.field === 'severity') {
        const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
        const aOrder = severityOrder[a.severity as keyof typeof severityOrder] || 0;
        const bOrder = severityOrder[b.severity as keyof typeof severityOrder] || 0;
        return sortConfig.direction === 'desc' ? bOrder - aOrder : aOrder - bOrder;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'desc' 
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'desc' ? 1 : -1;
      if (aValue > bValue) return sortConfig.direction === 'desc' ? -1 : 1;
      return 0;
    });

    return filtered;
  }, [results, filters, sortConfig]);

  const updateFilter = useCallback((key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateSort = useCallback((field: keyof ValidationResult) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      severity: [],
      category: [],
      validator: [],
      searchTerm: '',
      showPassed: false,
    });
  }, []);

  return {
    filteredResults,
    filters,
    sortConfig,
    updateFilter,
    updateSort,
    clearFilters,
    resultCount: {
      total: results.length,
      filtered: filteredResults.length,
      passed: results.filter(r => r.is_passing).length,
      failed: results.filter(r => r.is_failing).length,
    },
  };
}

// Hook for validation statistics
export function useValidationStats(results: ValidationResult[]) {
  return useMemo(() => {
    const stats = {
      total: results.length,
      passed: 0,
      failed: 0,
      critical: 0,
      errors: 0,
      warnings: 0,
      info: 0,
      categories: {} as Record<string, number>,
      validators: {} as Record<string, number>,
    };

    results.forEach(result => {
      if (result.is_passing) stats.passed++;
      if (result.is_failing) stats.failed++;

      switch (result.severity) {
        case 'critical':
          stats.critical++;
          break;
        case 'error':
          stats.errors++;
          break;
        case 'warning':
          stats.warnings++;
          break;
        case 'info':
          stats.info++;
          break;
      }

      // Count by category
      stats.categories[result.category] = (stats.categories[result.category] || 0) + 1;

      // Count by validator (if available in metadata)
      const validator = result.metadata?.validator || 'unknown';
      stats.validators[validator] = (stats.validators[validator] || 0) + 1;
    });

    return {
      ...stats,
      passRate: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0,
      failRate: stats.total > 0 ? (stats.failed / stats.total) * 100 : 0,
    };
  }, [results]);
}