import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  methodService,
  AnalysisMethod,
  AnalysisMethodCreate,
  AnalysisMethodUpdate,
  MethodTemplate,
  MethodParameter,
  ValidationResult,
  UsageStatistics,
  MethodQueryParams,
  PaginatedResponse,
  Operation,
  OperationCreate,
  OperationUpdate
} from '../services/methodService';

// Hook for managing a list of methods with filtering and pagination
export const useMethods = (initialParams?: MethodQueryParams) => {
  const [methods, setMethods] = useState<AnalysisMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<AnalysisMethod>['pagination'] | null>(null);
  const [params, setParams] = useState<MethodQueryParams>(initialParams || {});

  const loadMethods = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await methodService.getMethods(params);
      setMethods(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load methods');
      setMethods([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [params]);

  const updateParams = useCallback((newParams: Partial<MethodQueryParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const resetParams = useCallback(() => {
    setParams(initialParams || {});
  }, [initialParams]);

  const refresh = useCallback(() => {
    loadMethods();
  }, [loadMethods]);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  return {
    methods,
    loading,
    error,
    pagination,
    params,
    updateParams,
    resetParams,
    refresh
  };
};

// Hook for managing a single method
export const useMethod = (methodId?: string) => {
  const [method, setMethod] = useState<AnalysisMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMethod = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const methodData = await methodService.getMethod(id);
      setMethod(methodData);
    } catch (err: any) {
      setError(err.message || 'Failed to load method');
      setMethod(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMethod = useCallback(async (methodData: AnalysisMethodCreate) => {
    setLoading(true);
    setError(null);
    
    try {
      const newMethod = await methodService.createMethod(methodData);
      setMethod(newMethod);
      return newMethod;
    } catch (err: any) {
      setError(err.message || 'Failed to create method');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMethod = useCallback(async (id: string, updates: AnalysisMethodUpdate) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedMethod = await methodService.updateMethod(id, updates);
      setMethod(updatedMethod);
      return updatedMethod;
    } catch (err: any) {
      setError(err.message || 'Failed to update method');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMethod = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await methodService.deleteMethod(id);
      setMethod(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete method');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cloneMethod = useCallback(async (
    id: string, 
    newId: string, 
    newName: string, 
    reportingEventId: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await methodService.cloneMethod(id, newId, newName, reportingEventId);
      return result.method;
    } catch (err: any) {
      setError(err.message || 'Failed to clone method');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (methodId) {
      loadMethod(methodId);
    }
  }, [methodId, loadMethod]);

  return {
    method,
    loading,
    error,
    loadMethod,
    createMethod,
    updateMethod,
    deleteMethod,
    cloneMethod
  };
};

// Hook for method templates
export const useMethodTemplates = (category?: string) => {
  const [templates, setTemplates] = useState<MethodTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const templatesData = await methodService.getTemplates(category);
      setTemplates(templatesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  const createFromTemplate = useCallback(async (
    templateId: string, 
    methodData: any
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const newMethod = await methodService.createFromTemplate(templateId, methodData);
      return newMethod;
    } catch (err: any) {
      setError(err.message || 'Failed to create method from template');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filteredTemplates = useMemo(() => {
    if (!category) return templates;
    return templates.filter(template => template.category === category);
  }, [templates, category]);

  return {
    templates: filteredTemplates,
    allTemplates: templates,
    loading,
    error,
    loadTemplates,
    createFromTemplate
  };
};

// Hook for method operations
export const useMethodOperations = (methodId?: string) => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOperations = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const operationsData = await methodService.getOperations(id);
      setOperations(operationsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load operations');
      setOperations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createOperation = useCallback(async (methodId: string, operation: OperationCreate) => {
    setLoading(true);
    setError(null);
    
    try {
      const newOperation = await methodService.createOperation(methodId, operation);
      setOperations(prev => [...prev, newOperation].sort((a, b) => a.order_num - b.order_num));
      return newOperation;
    } catch (err: any) {
      setError(err.message || 'Failed to create operation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOperation = useCallback(async (
    methodId: string, 
    operationId: string, 
    updates: OperationUpdate
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedOperation = await methodService.updateOperation(methodId, operationId, updates);
      setOperations(prev => 
        prev.map(op => op.id === operationId ? updatedOperation : op)
           .sort((a, b) => a.order_num - b.order_num)
      );
      return updatedOperation;
    } catch (err: any) {
      setError(err.message || 'Failed to update operation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteOperation = useCallback(async (methodId: string, operationId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await methodService.deleteOperation(methodId, operationId);
      setOperations(prev => prev.filter(op => op.id !== operationId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete operation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderOperations = useCallback(async (
    methodId: string, 
    operationOrders: { operation_id: string; order_num: number }[]
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await methodService.reorderOperations(methodId, operationOrders);
      setOperations(result.operations);
      return result.operations;
    } catch (err: any) {
      setError(err.message || 'Failed to reorder operations');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (methodId) {
      loadOperations(methodId);
    }
  }, [methodId, loadOperations]);

  return {
    operations,
    loading,
    error,
    loadOperations,
    createOperation,
    updateOperation,
    deleteOperation,
    reorderOperations
  };
};

// Hook for method parameters
export const useMethodParameters = (methodId?: string) => {
  const [parameters, setParameters] = useState<MethodParameter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadParameters = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const parametersData = await methodService.getParameters(id);
      setParameters(parametersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load parameters');
      setParameters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateParameters = useCallback(async (id: string, newParameters: MethodParameter[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await methodService.updateParameters(id, newParameters);
      setParameters(result.parameters);
      return result.parameters;
    } catch (err: any) {
      setError(err.message || 'Failed to update parameters');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (methodId) {
      loadParameters(methodId);
    }
  }, [methodId, loadParameters]);

  const groupedParameters = useMemo(() => {
    return parameters.reduce((groups, parameter) => {
      const category = parameter.category || 'general';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(parameter);
      return groups;
    }, {} as { [key: string]: MethodParameter[] });
  }, [parameters]);

  return {
    parameters,
    groupedParameters,
    loading,
    error,
    loadParameters,
    updateParameters
  };
};

// Hook for method validation
export const useMethodValidation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateMethod = useCallback(async (
    methodId: string, 
    options?: { [key: string]: any }
  ): Promise<ValidationResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const validationResult = await methodService.validateMethod(methodId, options);
      return validationResult;
    } catch (err: any) {
      setError(err.message || 'Failed to validate method');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    validateMethod,
    loading,
    error
  };
};

// Hook for method code templates
export const useCodeTemplate = (methodId?: string) => {
  const [codeTemplate, setCodeTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCodeTemplate = useCallback(async (id: string, programmingContext: string = 'SAS') => {
    setLoading(true);
    setError(null);
    
    try {
      const templateData = await methodService.getCodeTemplate(id, programmingContext);
      setCodeTemplate(templateData);
    } catch (err: any) {
      setError(err.message || 'Failed to load code template');
      setCodeTemplate(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCodeTemplate = useCallback(async (
    id: string, 
    templateData: any
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await methodService.updateCodeTemplate(id, templateData);
      setCodeTemplate(result.template);
      return result.template;
    } catch (err: any) {
      setError(err.message || 'Failed to update code template');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    codeTemplate,
    loading,
    error,
    loadCodeTemplate,
    updateCodeTemplate
  };
};

// Hook for method usage statistics
export const useMethodUsage = (methodId?: string) => {
  const [usage, setUsage] = useState<UsageStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsage = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const usageData = await methodService.getUsageStatistics(id);
      setUsage(usageData);
    } catch (err: any) {
      setError(err.message || 'Failed to load usage statistics');
      setUsage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (methodId) {
      loadUsage(methodId);
    }
  }, [methodId, loadUsage]);

  return {
    usage,
    loading,
    error,
    loadUsage
  };
};

// Hook for advanced method search
export const useMethodSearch = () => {
  const [results, setResults] = useState<AnalysisMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCriteria, setSearchCriteria] = useState<any>(null);

  const search = useCallback(async (
    query: string,
    options?: {
      statistical_category?: string;
      programming_context?: string;
      has_code_template?: boolean;
      reporting_event_id?: string;
      skip?: number;
      limit?: number;
    }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchResult = await methodService.advancedSearch(query, options);
      setResults(searchResult.methods);
      setSearchCriteria(searchResult.search_criteria);
      return searchResult;
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setResults([]);
      setSearchCriteria(null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setSearchCriteria(null);
    setError(null);
  }, []);

  return {
    results,
    searchCriteria,
    loading,
    error,
    search,
    clearResults
  };
};

// Hook for bulk method operations
export const useBulkMethodOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkOperations = useCallback(async (
    operations: Array<{
      type: string;
      method_ids: string[];
      [key: string]: any;
    }>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await methodService.bulkOperations(operations);
      return result.results;
    } catch (err: any) {
      setError(err.message || 'Bulk operations failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    bulkOperations,
    loading,
    error
  };
};