/**
 * Template Service
 * 
 * API service for template management operations.
 */

import { apiClient } from './api';
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

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  type: TemplateType;
  categoryId?: string;
  content: any;
  config?: any;
  parameters?: any;
  version?: string;
  status?: TemplateStatus;
  accessLevel?: TemplateAccessLevel;
  keywords?: string[];
  regulatoryCompliance?: string[];
  therapeuticAreas?: string[];
  teamId?: string;
  organizationId?: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  categoryId?: string;
  content?: any;
  config?: any;
  parameters?: any;
  status?: TemplateStatus;
  accessLevel?: TemplateAccessLevel;
  keywords?: string[];
  regulatoryCompliance?: string[];
  therapeuticAreas?: string[];
  teamId?: string;
}

export interface TemplateListResponse {
  templates: Template[];
  total: number;
  skip: number;
  limit: number;
}

export interface TemplateVersionListResponse {
  versions: TemplateVersion[];
  total: number;
}

export interface TemplateUsageStats {
  totalUses: number;
  uniqueUsers: number;
  averageExecutionTimeMs?: number;
  usageByType: Record<string, number>;
  usageTrend: Array<{ date: string; count: number }>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
}

export interface TemplateRatingSummary {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: Record<number, number>;
  averageEaseOfUse?: number;
  averageDocumentationQuality?: number;
  averageFlexibility?: number;
  averagePerformance?: number;
  recentReviews: TemplateRating[];
}

export interface TemplateFilter {
  type?: TemplateType;
  status?: TemplateStatus;
  accessLevel?: TemplateAccessLevel;
  categoryId?: string;
  createdBy?: string;
  organizationId?: string;
  teamId?: string;
  keywords?: string[];
  regulatoryCompliance?: string[];
  therapeuticAreas?: string[];
  minRating?: number;
  search?: string;
}

export interface TemplateShareRequest {
  templateId: string;
  teamIds?: string[];
  userEmails?: string[];
  canEdit?: boolean;
  message?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
  color?: string;
  orderNum?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  parentId?: string;
  icon?: string;
  color?: string;
  orderNum?: number;
  isActive?: boolean;
}

export interface CreateVersionRequest {
  version: string;
  content: any;
  config?: any;
  parameters?: any;
  changeSummary?: string;
  releaseNotes?: string;
  isMajorVersion?: boolean;
}

export interface CreateUsageRequest {
  templateId: string;
  usageType?: string;
  context?: any;
  targetType?: string;
  targetId?: string;
  executionTimeMs?: number;
}

export interface CreateRatingRequest {
  templateId: string;
  rating: number;
  review?: string;
  easeOfUse?: number;
  documentationQuality?: number;
  flexibility?: number;
  performance?: number;
}

export interface UpdateRatingRequest {
  rating?: number;
  review?: string;
  easeOfUse?: number;
  documentationQuality?: number;
  flexibility?: number;
  performance?: number;
}

class TemplateService {
  private basePath = '/api/v1/templates';

  // Template CRUD operations
  async getTemplates(params?: {
    skip?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } & TemplateFilter): Promise<TemplateListResponse> {
    const response = await apiClient.get(this.basePath, { params });
    return response.data;
  }

  async getTemplate(id: string): Promise<Template> {
    const response = await apiClient.get(`${this.basePath}/${id}`);
    return response.data;
  }

  async createTemplate(data: CreateTemplateRequest): Promise<Template> {
    const response = await apiClient.post(this.basePath, data);
    return response.data;
  }

  async updateTemplate(id: string, data: UpdateTemplateRequest): Promise<Template> {
    const response = await apiClient.put(`${this.basePath}/${id}`, data);
    return response.data;
  }

  async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  async cloneTemplate(id: string, newName: string, newDescription?: string): Promise<Template> {
    const response = await apiClient.post(`${this.basePath}/${id}/clone`, {
      newName,
      newDescription
    });
    return response.data;
  }

  // Category operations
  async getCategories(params?: {
    skip?: number;
    limit?: number;
    includeInactive?: boolean;
  }): Promise<TemplateCategory[]> {
    const response = await apiClient.get(`${this.basePath}/categories`, { params });
    return response.data;
  }

  async getCategoryTree(parentId?: string): Promise<TemplateCategory[]> {
    const response = await apiClient.get(`${this.basePath}/categories/tree`, {
      params: { parentId }
    });
    return response.data;
  }

  async getCategory(id: string): Promise<TemplateCategory> {
    const response = await apiClient.get(`${this.basePath}/categories/${id}`);
    return response.data;
  }

  async createCategory(data: CreateCategoryRequest): Promise<TemplateCategory> {
    const response = await apiClient.post(`${this.basePath}/categories`, data);
    return response.data;
  }

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<TemplateCategory> {
    const response = await apiClient.put(`${this.basePath}/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/categories/${id}`);
  }

  // Version operations
  async getTemplateVersions(templateId: string, params?: {
    skip?: number;
    limit?: number;
  }): Promise<TemplateVersionListResponse> {
    const response = await apiClient.get(`${this.basePath}/${templateId}/versions`, { params });
    return response.data;
  }

  async getVersion(versionId: string): Promise<TemplateVersion> {
    const response = await apiClient.get(`${this.basePath}/versions/${versionId}`);
    return response.data;
  }

  async createTemplateVersion(templateId: string, data: CreateVersionRequest): Promise<TemplateVersion> {
    const response = await apiClient.post(`${this.basePath}/${templateId}/versions`, data);
    return response.data;
  }

  // Usage tracking
  async trackUsage(data: CreateUsageRequest): Promise<TemplateUsage> {
    const response = await apiClient.post(`${this.basePath}/${data.templateId}/usage`, data);
    return response.data;
  }

  async getUsageStats(templateId: string, days = 30): Promise<TemplateUsageStats> {
    const response = await apiClient.get(`${this.basePath}/${templateId}/usage/stats`, {
      params: { days }
    });
    return response.data;
  }

  // Rating operations
  async getRatings(templateId: string, params?: {
    skip?: number;
    limit?: number;
  }): Promise<TemplateRating[]> {
    const response = await apiClient.get(`${this.basePath}/${templateId}/ratings`, { params });
    return response.data;
  }

  async getRatingSummary(templateId: string): Promise<TemplateRatingSummary> {
    const response = await apiClient.get(`${this.basePath}/${templateId}/ratings/summary`);
    return response.data;
  }

  async rateTemplate(data: CreateRatingRequest): Promise<TemplateRating> {
    const response = await apiClient.post(`${this.basePath}/${data.templateId}/ratings`, data);
    return response.data;
  }

  async updateRating(ratingId: string, data: UpdateRatingRequest): Promise<TemplateRating> {
    const response = await apiClient.put(`${this.basePath}/ratings/${ratingId}`, data);
    return response.data;
  }

  async markRatingHelpful(ratingId: string): Promise<void> {
    await apiClient.post(`${this.basePath}/ratings/${ratingId}/helpful`);
  }

  // Sharing operations
  async shareTemplate(data: TemplateShareRequest): Promise<{
    sharedWithTeams: string[];
    sharedWithUsers: string[];
    shareUrl?: string;
  }> {
    const response = await apiClient.post(`${this.basePath}/${data.templateId}/share`, data);
    return response.data;
  }

  // Export/Import operations
  async exportTemplate(templateId: string, options?: {
    includeUsageStats?: boolean;
    includeRatings?: boolean;
  }): Promise<{
    template: Template;
    versions: TemplateVersion[];
    includeUsageStats?: boolean;
    includeRatings?: boolean;
  }> {
    const response = await apiClient.get(`${this.basePath}/${templateId}/export`, {
      params: options
    });
    return response.data;
  }

  async importTemplate(data: {
    templateData: any;
    overrideExisting?: boolean;
    preserveIds?: boolean;
    targetCategoryId?: string;
  }): Promise<Template> {
    const response = await apiClient.post(`${this.basePath}/import`, data);
    return response.data;
  }

  // Search and filtering helpers
  async searchTemplates(query: string, filters?: TemplateFilter): Promise<Template[]> {
    const params = {
      search: query,
      ...filters,
      limit: 50 // Default limit for search
    };
    const response = await this.getTemplates(params);
    return response.templates;
  }

  async getPopularTemplates(limit = 10): Promise<Template[]> {
    const response = await this.getTemplates({
      limit,
      sortBy: 'usage',
      sortOrder: 'desc',
      status: TemplateStatus.PUBLISHED
    });
    return response.templates;
  }

  async getRecentTemplates(limit = 10): Promise<Template[]> {
    const response = await this.getTemplates({
      limit,
      sortBy: 'created',
      sortOrder: 'desc',
      status: TemplateStatus.PUBLISHED
    });
    return response.templates;
  }

  async getTopRatedTemplates(limit = 10): Promise<Template[]> {
    const response = await this.getTemplates({
      limit,
      sortBy: 'rating',
      sortOrder: 'desc',
      status: TemplateStatus.PUBLISHED,
      minRating: 4.0
    });
    return response.templates;
  }

  async getTemplatesByType(type: TemplateType, limit = 20): Promise<Template[]> {
    const response = await this.getTemplates({
      type,
      limit,
      sortBy: 'usage',
      sortOrder: 'desc',
      status: TemplateStatus.PUBLISHED
    });
    return response.templates;
  }

  async getTemplatesByCategory(categoryId: string, limit = 20): Promise<Template[]> {
    const response = await this.getTemplates({
      categoryId,
      limit,
      sortBy: 'created',
      sortOrder: 'desc'
    });
    return response.templates;
  }

  // User's personal templates
  async getMyTemplates(userId: string): Promise<Template[]> {
    const response = await this.getTemplates({
      createdBy: userId,
      sortBy: 'updated',
      sortOrder: 'desc'
    });
    return response.templates;
  }

  async getMyDrafts(userId: string): Promise<Template[]> {
    const response = await this.getTemplates({
      createdBy: userId,
      status: TemplateStatus.DRAFT,
      sortBy: 'updated',
      sortOrder: 'desc'
    });
    return response.templates;
  }
}

export const templateService = new TemplateService();