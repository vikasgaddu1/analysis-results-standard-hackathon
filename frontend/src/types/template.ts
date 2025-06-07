/**
 * Template Management Type Definitions
 */

// Enums
export enum TemplateType {
  ANALYSIS = 'analysis',
  METHOD = 'method',
  OUTPUT = 'output',
  DISPLAY = 'display',
  WHERE_CLAUSE = 'where_clause',
  TABLE_SHELL = 'table_shell',
  VISUALIZATION = 'visualization',
  REPORT_SECTION = 'report_section'
}

export enum TemplateStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived'
}

export enum TemplateAccessLevel {
  PRIVATE = 'private',
  TEAM = 'team',
  ORGANIZATION = 'organization',
  PUBLIC = 'public'
}

// Base interfaces
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  organizationId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Template Category
export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
  color?: string;
  orderNum: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  parent?: TemplateCategory;
  subcategories?: TemplateCategory[];
  templates?: Template[];
}

// Template
export interface Template {
  id: string;
  name: string;
  description?: string;
  type: TemplateType;
  categoryId?: string;
  
  // Content and configuration
  content: any;
  config?: any;
  parameters?: any;
  
  // Metadata
  version: string;
  status: TemplateStatus;
  accessLevel: TemplateAccessLevel;
  
  // Usage tracking
  usageCount: number;
  lastUsedAt?: string;
  
  // Creator and ownership
  createdBy: string;
  organizationId?: string;
  teamId?: string;
  
  // Search and discovery
  keywords?: string[];
  
  // Compliance and validation
  regulatoryCompliance?: string[];
  therapeuticAreas?: string[];
  
  // Computed properties
  averageRating: number;
  ratingCount: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  category?: TemplateCategory;
  creator?: User;
  versions?: TemplateVersion[];
  usages?: TemplateUsage[];
  ratings?: TemplateRating[];
}

// Template Version
export interface TemplateVersion {
  id: string;
  templateId: string;
  version: string;
  content: any;
  config?: any;
  parameters?: any;
  
  // Version metadata
  changeSummary?: string;
  releaseNotes?: string;
  isMajorVersion: boolean;
  
  // Tracking
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  template?: Template;
  creator?: User;
}

// Template Usage
export interface TemplateUsage {
  id: string;
  templateId: string;
  usedBy: string;
  
  // Usage context
  usageType?: string;
  context?: any;
  
  // What was created from this template
  targetType?: string;
  targetId?: string;
  
  // Performance metrics
  executionTimeMs?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  template?: Template;
  user?: User;
}

// Template Rating
export interface TemplateRating {
  id: string;
  templateId: string;
  userId: string;
  
  // Rating details
  rating: number;
  review?: string;
  
  // Rating categories
  easeOfUse?: number;
  documentationQuality?: number;
  flexibility?: number;
  performance?: number;
  
  // Helpfulness tracking
  helpfulCount: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Relationships
  template?: Template;
  user?: User;
}

// API Response Types
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
  usageTrend: Array<{
    date: string;
    count: number;
  }>;
  topUsers: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
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

// Form Types
export interface TemplateFormData {
  name: string;
  description?: string;
  type: TemplateType;
  categoryId?: string;
  content: any;
  config?: any;
  parameters?: any;
  version: string;
  status: TemplateStatus;
  accessLevel: TemplateAccessLevel;
  keywords: string[];
  regulatoryCompliance: string[];
  therapeuticAreas: string[];
  teamId?: string;
  organizationId?: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
  color?: string;
  orderNum?: number;
  isActive: boolean;
}

export interface VersionFormData {
  version: string;
  content: any;
  config?: any;
  parameters?: any;
  changeSummary?: string;
  releaseNotes?: string;
  isMajorVersion: boolean;
}

export interface RatingFormData {
  rating: number;
  review?: string;
  easeOfUse?: number;
  documentationQuality?: number;
  flexibility?: number;
  performance?: number;
}

// Filter Types
export interface TemplateFilters {
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
  dateRange?: {
    start: string;
    end: string;
  };
}

// Sort Options
export interface TemplateSortOptions {
  field: 'name' | 'createdAt' | 'updatedAt' | 'usageCount' | 'averageRating';
  direction: 'asc' | 'desc';
}

// Share Types
export interface ShareOptions {
  templateId: string;
  teamIds?: string[];
  userEmails?: string[];
  canEdit: boolean;
  message?: string;
}

// Export/Import Types
export interface TemplateExportData {
  template: Template;
  versions: TemplateVersion[];
  includeUsageStats?: boolean;
  includeRatings?: boolean;
}

export interface TemplateImportOptions {
  templateData: any;
  overrideExisting?: boolean;
  preserveIds?: boolean;
  targetCategoryId?: string;
}

// UI State Types
export interface TemplateUIState {
  selectedTemplate?: Template;
  selectedCategory?: TemplateCategory;
  viewMode: 'grid' | 'list';
  sortOptions: TemplateSortOptions;
  filters: TemplateFilters;
  searchQuery: string;
  loading: boolean;
  error?: string;
}

// Template Parameter Types
export interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface TemplateParameterConfig {
  [parameterName: string]: TemplateParameter;
}

// Template Content Types (specific to different template types)
export interface AnalysisTemplateContent {
  analysisDefinition: any;
  methods: any[];
  dataSources: any[];
  outputs: any[];
}

export interface MethodTemplateContent {
  operationType: string;
  parameters: any[];
  code: string;
  documentation: string;
}

export interface OutputTemplateContent {
  displayDefinition: any;
  formatting: any;
  fileSpecification: any;
}

export interface WhereClauseTemplateContent {
  conditions: any[];
  logicalOperators: string[];
  variables: string[];
}

// Validation Types
export interface TemplateValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
}

// Analytics Types
export interface TemplateAnalytics {
  usage: {
    totalUses: number;
    uniqueUsers: number;
    usageOverTime: Array<{
      date: string;
      count: number;
    }>;
  };
  ratings: {
    averageRating: number;
    totalRatings: number;
    distribution: Record<number, number>;
  };
  performance: {
    averageExecutionTime?: number;
    successRate: number;
  };
}

// Notification Types
export interface TemplateNotification {
  id: string;
  type: 'shared' | 'updated' | 'rated' | 'used';
  templateId: string;
  templateName: string;
  message: string;
  from?: User;
  createdAt: string;
  read: boolean;
}