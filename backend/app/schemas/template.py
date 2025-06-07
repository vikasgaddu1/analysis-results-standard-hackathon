"""
Pydantic schemas for Template Management System

Provides validation and serialization for template-related operations including:
- Template CRUD operations
- Version management
- Usage tracking
- Rating and review system
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict, validator
from pydantic.types import Json

from app.models.template import TemplateType, TemplateStatus, TemplateAccessLevel


# ============================================
# BASE SCHEMAS
# ============================================

class TemplateBase(BaseModel):
    """Base schema for templates"""
    model_config = ConfigDict(from_attributes=True)


# ============================================
# TEMPLATE CATEGORY SCHEMAS
# ============================================

class TemplateCategoryBase(TemplateBase):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    order_num: int = Field(0, ge=0)
    is_active: bool = True


class TemplateCategoryCreate(TemplateCategoryBase):
    pass


class TemplateCategoryUpdate(TemplateBase):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    parent_id: Optional[UUID] = None
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    order_num: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class TemplateCategoryInDB(TemplateCategoryBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    
    # Include subcategories when needed
    subcategories: Optional[List['TemplateCategoryInDB']] = None


class TemplateCategoryTree(TemplateCategoryInDB):
    """Category with full tree structure"""
    subcategories: List['TemplateCategoryTree'] = []
    template_count: int = 0


# ============================================
# TEMPLATE SCHEMAS
# ============================================

class TemplateBase(BaseModel):
    """Base template schema"""
    model_config = ConfigDict(from_attributes=True)
    
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    type: TemplateType
    category_id: Optional[UUID] = None
    content: Dict[str, Any]
    config: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None
    version: str = Field("1.0.0", max_length=20)
    status: TemplateStatus = TemplateStatus.DRAFT
    access_level: TemplateAccessLevel = TemplateAccessLevel.PRIVATE
    keywords: Optional[List[str]] = None
    regulatory_compliance: Optional[List[str]] = None
    therapeutic_areas: Optional[List[str]] = None
    team_id: Optional[UUID] = None
    organization_id: Optional[UUID] = None


class TemplateCreate(TemplateBase):
    """Schema for creating templates"""
    pass


class TemplateUpdate(BaseModel):
    """Schema for updating templates"""
    model_config = ConfigDict(from_attributes=True)
    
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    content: Optional[Dict[str, Any]] = None
    config: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None
    status: Optional[TemplateStatus] = None
    access_level: Optional[TemplateAccessLevel] = None
    keywords: Optional[List[str]] = None
    regulatory_compliance: Optional[List[str]] = None
    therapeutic_areas: Optional[List[str]] = None
    team_id: Optional[UUID] = None


class TemplateInDB(TemplateBase):
    """Template as stored in database"""
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    usage_count: int = 0
    last_used_at: Optional[datetime] = None
    average_rating: float = 0.0
    rating_count: int = 0
    
    # Related objects
    category: Optional[TemplateCategoryInDB] = None
    creator: Optional[Dict[str, Any]] = None  # User info
    latest_version: Optional['TemplateVersionInDB'] = None


class TemplateList(BaseModel):
    """List response for templates"""
    model_config = ConfigDict(from_attributes=True)
    
    templates: List[TemplateInDB]
    total: int
    skip: int
    limit: int


class TemplateFilter(BaseModel):
    """Filter options for template queries"""
    type: Optional[TemplateType] = None
    status: Optional[TemplateStatus] = None
    access_level: Optional[TemplateAccessLevel] = None
    category_id: Optional[UUID] = None
    created_by: Optional[UUID] = None
    organization_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    keywords: Optional[List[str]] = None
    regulatory_compliance: Optional[List[str]] = None
    therapeutic_areas: Optional[List[str]] = None
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    search: Optional[str] = None


# ============================================
# TEMPLATE VERSION SCHEMAS
# ============================================

class TemplateVersionBase(BaseModel):
    """Base schema for template versions"""
    model_config = ConfigDict(from_attributes=True)
    
    version: str = Field(..., max_length=20)
    content: Dict[str, Any]
    config: Optional[Dict[str, Any]] = None
    parameters: Optional[Dict[str, Any]] = None
    change_summary: Optional[str] = None
    release_notes: Optional[str] = None
    is_major_version: bool = False


class TemplateVersionCreate(TemplateVersionBase):
    """Schema for creating template versions"""
    template_id: UUID


class TemplateVersionInDB(TemplateVersionBase):
    """Template version as stored in database"""
    id: UUID
    template_id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    creator: Optional[Dict[str, Any]] = None


class TemplateVersionList(BaseModel):
    """List of template versions"""
    versions: List[TemplateVersionInDB]
    total: int


# ============================================
# TEMPLATE USAGE SCHEMAS
# ============================================

class TemplateUsageBase(BaseModel):
    """Base schema for template usage"""
    model_config = ConfigDict(from_attributes=True)
    
    template_id: UUID
    usage_type: Optional[str] = Field(None, max_length=50)
    context: Optional[Dict[str, Any]] = None
    target_type: Optional[str] = Field(None, max_length=50)
    target_id: Optional[UUID] = None
    execution_time_ms: Optional[int] = Field(None, ge=0)


class TemplateUsageCreate(TemplateUsageBase):
    """Schema for creating usage records"""
    pass


class TemplateUsageInDB(TemplateUsageBase):
    """Usage record as stored in database"""
    id: UUID
    used_by: UUID
    created_at: datetime
    template: Optional[Dict[str, Any]] = None
    user: Optional[Dict[str, Any]] = None


class TemplateUsageStats(BaseModel):
    """Usage statistics for a template"""
    total_uses: int
    unique_users: int
    average_execution_time_ms: Optional[float] = None
    usage_by_type: Dict[str, int]
    usage_trend: List[Dict[str, Any]]  # Daily/weekly/monthly counts
    top_users: List[Dict[str, Any]]


# ============================================
# TEMPLATE RATING SCHEMAS
# ============================================

class TemplateRatingBase(BaseModel):
    """Base schema for template ratings"""
    model_config = ConfigDict(from_attributes=True)
    
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None
    ease_of_use: Optional[int] = Field(None, ge=1, le=5)
    documentation_quality: Optional[int] = Field(None, ge=1, le=5)
    flexibility: Optional[int] = Field(None, ge=1, le=5)
    performance: Optional[int] = Field(None, ge=1, le=5)


class TemplateRatingCreate(TemplateRatingBase):
    """Schema for creating ratings"""
    template_id: UUID


class TemplateRatingUpdate(BaseModel):
    """Schema for updating ratings"""
    rating: Optional[int] = Field(None, ge=1, le=5)
    review: Optional[str] = None
    ease_of_use: Optional[int] = Field(None, ge=1, le=5)
    documentation_quality: Optional[int] = Field(None, ge=1, le=5)
    flexibility: Optional[int] = Field(None, ge=1, le=5)
    performance: Optional[int] = Field(None, ge=1, le=5)


class TemplateRatingInDB(TemplateRatingBase):
    """Rating as stored in database"""
    id: UUID
    template_id: UUID
    user_id: UUID
    helpful_count: int = 0
    created_at: datetime
    updated_at: datetime
    user: Optional[Dict[str, Any]] = None


class TemplateRatingSummary(BaseModel):
    """Summary of ratings for a template"""
    average_rating: float
    total_ratings: int
    rating_distribution: Dict[int, int]  # {1: count, 2: count, ..., 5: count}
    average_ease_of_use: Optional[float] = None
    average_documentation_quality: Optional[float] = None
    average_flexibility: Optional[float] = None
    average_performance: Optional[float] = None
    recent_reviews: List[TemplateRatingInDB]


# ============================================
# TEMPLATE SHARING SCHEMAS
# ============================================

class TemplateShareRequest(BaseModel):
    """Request to share a template"""
    template_id: UUID
    team_ids: Optional[List[UUID]] = None
    user_emails: Optional[List[str]] = None
    can_edit: bool = False
    message: Optional[str] = None


class TemplateShareResponse(BaseModel):
    """Response after sharing a template"""
    shared_with_teams: List[UUID]
    shared_with_users: List[str]
    share_url: Optional[str] = None


# ============================================
# TEMPLATE EXPORT/IMPORT SCHEMAS
# ============================================

class TemplateExport(BaseModel):
    """Schema for exporting templates"""
    template: TemplateInDB
    versions: List[TemplateVersionInDB]
    include_usage_stats: bool = False
    include_ratings: bool = False


class TemplateImport(BaseModel):
    """Schema for importing templates"""
    template_data: Dict[str, Any]
    override_existing: bool = False
    preserve_ids: bool = False
    target_category_id: Optional[UUID] = None


# ============================================
# TEAM AND ORGANIZATION SCHEMAS
# ============================================

class TeamBase(BaseModel):
    """Base schema for teams"""
    model_config = ConfigDict(from_attributes=True)
    
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    organization_id: Optional[UUID] = None
    is_active: bool = True


class TeamCreate(TeamBase):
    pass


class TeamInDB(TeamBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


class OrganizationBase(BaseModel):
    """Base schema for organizations"""
    model_config = ConfigDict(from_attributes=True)
    
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    is_active: bool = True


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationInDB(OrganizationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


# Update forward references
TemplateCategoryInDB.model_rebuild()
TemplateCategoryTree.model_rebuild()