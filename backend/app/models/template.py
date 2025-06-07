"""
Template Management Models for Clinical Trial Table Metadata System

Provides models for managing reusable templates across the system including:
- Template storage and versioning
- Template categorization and organization
- Usage tracking and analytics
- Rating and review system
- Sharing and permissions
"""

from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, Text, 
    Table, UniqueConstraint, CheckConstraint, ARRAY, JSON, Float,
    Index, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
import enum

from app.db.base import Base, TimestampMixin


class TemplateType(str, enum.Enum):
    """Types of templates available in the system"""
    ANALYSIS = "analysis"
    METHOD = "method"
    OUTPUT = "output"
    DISPLAY = "display"
    WHERE_CLAUSE = "where_clause"
    TABLE_SHELL = "table_shell"
    VISUALIZATION = "visualization"
    REPORT_SECTION = "report_section"


class TemplateStatus(str, enum.Enum):
    """Status of a template"""
    DRAFT = "draft"
    PUBLISHED = "published"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"


class TemplateAccessLevel(str, enum.Enum):
    """Access levels for templates"""
    PRIVATE = "private"          # Only creator can access
    TEAM = "team"               # Team members can access
    ORGANIZATION = "organization" # Organization members can access
    PUBLIC = "public"           # Everyone can access


# Association table for template tags
template_tags = Table(
    'template_tags',
    Base.metadata,
    Column('template_id', UUID(as_uuid=True), ForeignKey('templates.id', ondelete='CASCADE')),
    Column('tag', String(50), nullable=False),
    UniqueConstraint('template_id', 'tag', name='uix_template_tags')
)


# Association table for template sharing with teams
template_team_access = Table(
    'template_team_access',
    Base.metadata,
    Column('template_id', UUID(as_uuid=True), ForeignKey('templates.id', ondelete='CASCADE')),
    Column('team_id', UUID(as_uuid=True), ForeignKey('teams.id', ondelete='CASCADE')),
    Column('can_edit', Boolean, default=False),
    Column('granted_at', DateTime, default=func.current_timestamp()),
    Column('granted_by', UUID(as_uuid=True), ForeignKey('users.id')),
    UniqueConstraint('template_id', 'team_id', name='uix_template_team_access')
)


class TemplateCategory(Base, TimestampMixin):
    """Categories for organizing templates"""
    __tablename__ = 'template_categories'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    parent_id = Column(UUID(as_uuid=True), ForeignKey('template_categories.id', ondelete='CASCADE'))
    icon = Column(String(50))  # Icon identifier for UI
    color = Column(String(7))  # Hex color code
    order_num = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    parent = relationship('TemplateCategory', remote_side=[id], backref='subcategories')
    templates = relationship('Template', back_populates='category')
    
    __table_args__ = (
        Index('ix_template_categories_parent_id', 'parent_id'),
        CheckConstraint("color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'", name='check_color_hex'),
    )


class Template(Base, TimestampMixin):
    """Main template model for storing reusable components"""
    __tablename__ = 'templates'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    type = Column(Enum(TemplateType), nullable=False, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey('template_categories.id', ondelete='SET NULL'))
    
    # Template content and configuration
    content = Column(JSON, nullable=False)  # The actual template data
    config = Column(JSON)  # Additional configuration options
    parameters = Column(JSON)  # Parameterizable fields with metadata
    
    # Metadata
    version = Column(String(20), nullable=False, default='1.0.0')
    status = Column(Enum(TemplateStatus), nullable=False, default=TemplateStatus.DRAFT)
    access_level = Column(Enum(TemplateAccessLevel), nullable=False, default=TemplateAccessLevel.PRIVATE)
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime)
    
    # Creator and ownership
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'))
    team_id = Column(UUID(as_uuid=True), ForeignKey('teams.id'))
    
    # Search and discovery
    keywords = Column(ARRAY(String))  # Array of keywords for search
    
    # Compliance and validation
    regulatory_compliance = Column(ARRAY(String))  # e.g., ['FDA', 'EMA', 'ICH']
    therapeutic_areas = Column(ARRAY(String))  # e.g., ['Oncology', 'Cardiology']
    
    # Relationships
    category = relationship('TemplateCategory', back_populates='templates')
    creator = relationship('User', foreign_keys=[created_by], backref='created_templates')
    versions = relationship('TemplateVersion', back_populates='template', cascade='all, delete-orphan')
    usages = relationship('TemplateUsage', back_populates='template', cascade='all, delete-orphan')
    ratings = relationship('TemplateRating', back_populates='template', cascade='all, delete-orphan')
    
    # Computed properties stored for performance
    average_rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    
    __table_args__ = (
        Index('ix_templates_name', 'name'),
        Index('ix_templates_type_status', 'type', 'status'),
        Index('ix_templates_created_by', 'created_by'),
        Index('ix_templates_keywords', 'keywords', postgresql_using='gin'),
        UniqueConstraint('name', 'created_by', 'version', name='uix_template_name_creator_version'),
    )


class TemplateVersion(Base, TimestampMixin):
    """Version history for templates"""
    __tablename__ = 'template_versions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey('templates.id', ondelete='CASCADE'), nullable=False)
    version = Column(String(20), nullable=False)
    content = Column(JSON, nullable=False)
    config = Column(JSON)
    parameters = Column(JSON)
    
    # Version metadata
    change_summary = Column(Text)
    release_notes = Column(Text)
    is_major_version = Column(Boolean, default=False)
    
    # Tracking
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    # Relationships
    template = relationship('Template', back_populates='versions')
    creator = relationship('User', backref='template_versions')
    
    __table_args__ = (
        UniqueConstraint('template_id', 'version', name='uix_template_version'),
        Index('ix_template_versions_template_id', 'template_id'),
    )


class TemplateUsage(Base, TimestampMixin):
    """Track template usage for analytics"""
    __tablename__ = 'template_usages'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey('templates.id', ondelete='CASCADE'), nullable=False)
    used_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    # Usage context
    usage_type = Column(String(50))  # e.g., 'direct', 'derived', 'reference'
    context = Column(JSON)  # Additional context about how it was used
    
    # What was created from this template
    target_type = Column(String(50))  # Type of entity created
    target_id = Column(UUID(as_uuid=True))  # ID of created entity
    
    # Performance metrics
    execution_time_ms = Column(Integer)  # Time taken to apply template
    
    # Relationships
    template = relationship('Template', back_populates='usages')
    user = relationship('User', backref='template_usages')
    
    __table_args__ = (
        Index('ix_template_usages_template_id', 'template_id'),
        Index('ix_template_usages_used_by', 'used_by'),
        Index('ix_template_usages_created_at', 'created_at'),
    )


class TemplateRating(Base, TimestampMixin):
    """Ratings and reviews for templates"""
    __tablename__ = 'template_ratings'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey('templates.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    # Rating details
    rating = Column(Integer, nullable=False)
    review = Column(Text)
    
    # Rating categories
    ease_of_use = Column(Integer)
    documentation_quality = Column(Integer)
    flexibility = Column(Integer)
    performance = Column(Integer)
    
    # Helpfulness tracking
    helpful_count = Column(Integer, default=0)
    
    # Relationships
    template = relationship('Template', back_populates='ratings')
    user = relationship('User', backref='template_ratings')
    
    __table_args__ = (
        UniqueConstraint('template_id', 'user_id', name='uix_template_rating_user'),
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
        CheckConstraint('ease_of_use IS NULL OR (ease_of_use >= 1 AND ease_of_use <= 5)', 
                       name='check_ease_of_use_range'),
        CheckConstraint('documentation_quality IS NULL OR (documentation_quality >= 1 AND documentation_quality <= 5)', 
                       name='check_documentation_quality_range'),
        CheckConstraint('flexibility IS NULL OR (flexibility >= 1 AND flexibility <= 5)', 
                       name='check_flexibility_range'),
        CheckConstraint('performance IS NULL OR (performance >= 1 AND performance <= 5)', 
                       name='check_performance_range'),
        Index('ix_template_ratings_template_id', 'template_id'),
    )


# Supporting models that might be referenced

class Team(Base, TimestampMixin):
    """Team model for team-based access control"""
    __tablename__ = 'teams'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    organization = relationship('Organization', backref='teams')


class Organization(Base, TimestampMixin):
    """Organization model for multi-tenant support"""
    __tablename__ = 'organizations'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(200), nullable=False, unique=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)