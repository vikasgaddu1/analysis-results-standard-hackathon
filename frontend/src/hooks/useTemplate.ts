/**
 * Template Management Hook
 * 
 * Custom hook for template operations and state management.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Template,
  TemplateCategory,
  TemplateVersion,
  TemplateUsage,
  TemplateRating,
  TemplateType,
  TemplateStatus,
  TemplateAccessLevel
} from '../types/template';
import {
  templateService,
  TemplateFilter,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateVersionRequest,
  CreateUsageRequest,
  CreateRatingRequest,
  UpdateRatingRequest,
  TemplateShareRequest
} from '../services/templateService';

export interface UseTemplateOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialFilters?: TemplateFilter;
}

export interface UseTemplateReturn {
  // State
  templates: Template[];
  categories: TemplateCategory[];
  selectedTemplate: Template | null;
  loading: boolean;
  error: string | null;
  
  // Template operations
  createTemplate: (data: CreateTemplateRequest) => Promise<Template>;
  updateTemplate: (id: string, data: UpdateTemplateRequest) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
  cloneTemplate: (id: string, newName: string, newDescription?: string) => Promise<Template>;
  selectTemplate: (template: Template | null) => void;
  
  // Category operations
  createCategory: (data: CreateCategoryRequest) => Promise<TemplateCategory>;
  updateCategory: (id: string, data: UpdateCategoryRequest) => Promise<TemplateCategory>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Version operations
  createVersion: (templateId: string, data: CreateVersionRequest) => Promise<TemplateVersion>;
  getVersions: (templateId: string) => Promise<TemplateVersion[]>;
  
  // Usage tracking
  trackUsage: (data: CreateUsageRequest) => Promise<TemplateUsage>;
  getUsageStats: (templateId: string, days?: number) => Promise<any>;
  
  // Rating operations
  rateTemplate: (data: CreateRatingRequest) => Promise<TemplateRating>;
  updateRating: (ratingId: string, data: UpdateRatingRequest) => Promise<TemplateRating>;
  
  // Sharing operations
  shareTemplate: (data: TemplateShareRequest) => Promise<void>;
  
  // Utility operations
  refreshTemplates: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  searchTemplates: (query: string, filters?: TemplateFilter) => Promise<Template[]>;
  filterTemplates: (filters: TemplateFilter) => Template[];
  
  // Data getters
  getPopularTemplates: () => Promise<Template[]>;
  getRecentTemplates: () => Promise<Template[]>;
  getTopRatedTemplates: () => Promise<Template[]>;
  getTemplatesByType: (type: TemplateType) => Promise<Template[]>;
  getTemplatesByCategory: (categoryId: string) => Promise<Template[]>;
}

export const useTemplate = (options: UseTemplateOptions = {}): UseTemplateReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
    initialFilters = {}
  } = options;

  // State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Internal state for filtering
  const [currentFilters, setCurrentFilters] = useState<TemplateFilter>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered templates based on current filters
  const filteredTemplates = useMemo(() => {
    if (!templates.length) return [];
    
    return templates.filter(template => {
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = template.name.toLowerCase().includes(query);
        const matchesDescription = template.description?.toLowerCase().includes(query);
        const matchesKeywords = template.keywords?.some(k => k.toLowerCase().includes(query));
        
        if (!matchesName && !matchesDescription && !matchesKeywords) {
          return false;
        }
      }
      
      // Apply filters
      if (currentFilters.type && template.type !== currentFilters.type) return false;
      if (currentFilters.status && template.status !== currentFilters.status) return false;
      if (currentFilters.accessLevel && template.accessLevel !== currentFilters.accessLevel) return false;
      if (currentFilters.categoryId && template.categoryId !== currentFilters.categoryId) return false;
      if (currentFilters.createdBy && template.createdBy !== currentFilters.createdBy) return false;
      if (currentFilters.minRating && (template.averageRating || 0) < currentFilters.minRating) return false;
      
      // Array filters
      if (currentFilters.keywords?.length) {
        const hasMatchingKeyword = currentFilters.keywords.some(keyword =>
          template.keywords?.includes(keyword)
        );
        if (!hasMatchingKeyword) return false;
      }
      
      if (currentFilters.regulatoryCompliance?.length) {
        const hasMatchingCompliance = currentFilters.regulatoryCompliance.some(compliance =>
          template.regulatoryCompliance?.includes(compliance)
        );
        if (!hasMatchingCompliance) return false;
      }
      
      if (currentFilters.therapeuticAreas?.length) {
        const hasMatchingArea = currentFilters.therapeuticAreas.some(area =>
          template.therapeuticAreas?.includes(area)
        );
        if (!hasMatchingArea) return false;
      }
      
      return true;
    });
  }, [templates, currentFilters, searchQuery]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await templateService.getTemplates({
        limit: 1000, // Load all templates for client-side filtering
        ...currentFilters
      });
      setTemplates(response.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const categoryList = await templateService.getCategories();
      setCategories(categoryList);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, [loadTemplates, loadCategories]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadTemplates();
      loadCategories();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadTemplates, loadCategories]);

  // Template operations
  const createTemplate = useCallback(async (data: CreateTemplateRequest): Promise<Template> => {
    try {
      const template = await templateService.createTemplate(data);
      setTemplates(prev => [template, ...prev]);
      return template;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create template');
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, data: UpdateTemplateRequest): Promise<Template> => {
    try {
      const template = await templateService.updateTemplate(id, data);
      setTemplates(prev => prev.map(t => t.id === id ? template : t));
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(template);
      }
      return template;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update template');
    }
  }, [selectedTemplate]);

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    try {
      await templateService.deleteTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete template');
    }
  }, [selectedTemplate]);

  const cloneTemplate = useCallback(async (id: string, newName: string, newDescription?: string): Promise<Template> => {
    try {
      const template = await templateService.cloneTemplate(id, newName, newDescription);
      setTemplates(prev => [template, ...prev]);
      return template;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to clone template');
    }
  }, []);

  // Category operations
  const createCategory = useCallback(async (data: CreateCategoryRequest): Promise<TemplateCategory> => {
    try {
      const category = await templateService.createCategory(data);
      setCategories(prev => [...prev, category]);
      return category;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create category');
    }
  }, []);

  const updateCategory = useCallback(async (id: string, data: UpdateCategoryRequest): Promise<TemplateCategory> => {
    try {
      const category = await templateService.updateCategory(id, data);
      setCategories(prev => prev.map(c => c.id === id ? category : c));
      return category;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update category');
    }
  }, []);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    try {
      await templateService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete category');
    }
  }, []);

  // Version operations
  const createVersion = useCallback(async (templateId: string, data: CreateVersionRequest): Promise<TemplateVersion> => {
    try {
      const version = await templateService.createTemplateVersion(templateId, data);
      // Refresh the template to get updated version info
      const updatedTemplate = await templateService.getTemplate(templateId);
      setTemplates(prev => prev.map(t => t.id === templateId ? updatedTemplate : t));
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(updatedTemplate);
      }
      return version;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create version');
    }
  }, [selectedTemplate]);

  const getVersions = useCallback(async (templateId: string): Promise<TemplateVersion[]> => {
    try {
      const response = await templateService.getTemplateVersions(templateId);
      return response.versions;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to get versions');
    }
  }, []);

  // Usage tracking
  const trackUsage = useCallback(async (data: CreateUsageRequest): Promise<TemplateUsage> => {
    try {
      const usage = await templateService.trackUsage(data);
      // Update usage count in local state
      setTemplates(prev => prev.map(t => 
        t.id === data.templateId 
          ? { ...t, usageCount: (t.usageCount || 0) + 1, lastUsedAt: new Date().toISOString() }
          : t
      ));
      return usage;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to track usage');
    }
  }, []);

  const getUsageStats = useCallback(async (templateId: string, days = 30) => {
    try {
      return await templateService.getUsageStats(templateId, days);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to get usage stats');
    }
  }, []);

  // Rating operations
  const rateTemplate = useCallback(async (data: CreateRatingRequest): Promise<TemplateRating> => {
    try {
      const rating = await templateService.rateTemplate(data);
      // Refresh template to get updated rating stats
      const updatedTemplate = await templateService.getTemplate(data.templateId);
      setTemplates(prev => prev.map(t => t.id === data.templateId ? updatedTemplate : t));
      return rating;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to rate template');
    }
  }, []);

  const updateRating = useCallback(async (ratingId: string, data: UpdateRatingRequest): Promise<TemplateRating> => {
    try {
      return await templateService.updateRating(ratingId, data);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update rating');
    }
  }, []);

  // Sharing operations
  const shareTemplate = useCallback(async (data: TemplateShareRequest): Promise<void> => {
    try {
      await templateService.shareTemplate(data);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to share template');
    }
  }, []);

  // Utility operations
  const refreshTemplates = useCallback(async (): Promise<void> => {
    await loadTemplates();
  }, [loadTemplates]);

  const refreshCategories = useCallback(async (): Promise<void> => {
    await loadCategories();
  }, [loadCategories]);

  const searchTemplates = useCallback(async (query: string, filters?: TemplateFilter): Promise<Template[]> => {
    try {
      return await templateService.searchTemplates(query, filters);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to search templates');
    }
  }, []);

  const filterTemplates = useCallback((filters: TemplateFilter): Template[] => {
    setCurrentFilters(filters);
    return filteredTemplates;
  }, [filteredTemplates]);

  // Data getters
  const getPopularTemplates = useCallback(async (): Promise<Template[]> => {
    try {
      return await templateService.getPopularTemplates();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to get popular templates');
    }
  }, []);

  const getRecentTemplates = useCallback(async (): Promise<Template[]> => {
    try {
      return await templateService.getRecentTemplates();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to get recent templates');
    }
  }, []);

  const getTopRatedTemplates = useCallback(async (): Promise<Template[]> => {
    try {
      return await templateService.getTopRatedTemplates();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to get top rated templates');
    }
  }, []);

  const getTemplatesByType = useCallback(async (type: TemplateType): Promise<Template[]> => {
    try {
      return await templateService.getTemplatesByType(type);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to get templates by type');
    }
  }, []);

  const getTemplatesByCategory = useCallback(async (categoryId: string): Promise<Template[]> => {
    try {
      return await templateService.getTemplatesByCategory(categoryId);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to get templates by category');
    }
  }, []);

  const selectTemplate = useCallback((template: Template | null) => {
    setSelectedTemplate(template);
  }, []);

  return {
    // State
    templates: filteredTemplates,
    categories,
    selectedTemplate,
    loading,
    error,
    
    // Template operations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    cloneTemplate,
    selectTemplate,
    
    // Category operations
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Version operations
    createVersion,
    getVersions,
    
    // Usage tracking
    trackUsage,
    getUsageStats,
    
    // Rating operations
    rateTemplate,
    updateRating,
    
    // Sharing operations
    shareTemplate,
    
    // Utility operations
    refreshTemplates,
    refreshCategories,
    searchTemplates,
    filterTemplates,
    
    // Data getters
    getPopularTemplates,
    getRecentTemplates,
    getTopRatedTemplates,
    getTemplatesByType,
    getTemplatesByCategory
  };
};