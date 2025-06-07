"""
Validation result models for database storage and API responses.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, JSON, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from typing import Optional, Dict, Any, List

from ..db.base import Base


class ValidationSeverityEnum(str, enum.Enum):
    """Validation severity levels."""
    CRITICAL = "critical"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ValidationCategoryEnum(str, enum.Enum):
    """Validation category types."""
    STANDARDS_COMPLIANCE = "standards_compliance"
    DATA_INTEGRITY = "data_integrity"
    BUSINESS_RULES = "business_rules"
    REGULATORY_COMPLIANCE = "regulatory_compliance"
    PERFORMANCE = "performance"
    SECURITY = "security"


class ValidationStatusEnum(str, enum.Enum):
    """Validation status types."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ValidationSession(Base):
    """Validation session tracking."""
    __tablename__ = "validation_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), unique=True, index=True, nullable=False)
    user_id = Column(String(255), index=True)
    organization_id = Column(String(255), index=True)
    
    # Validation configuration
    profile_name = Column(String(100), nullable=False, default="default")
    object_type = Column(String(100), nullable=False)
    object_id = Column(String(255), index=True)
    
    # Session status and timing
    status = Column(SQLEnum(ValidationStatusEnum), default=ValidationStatusEnum.PENDING)
    started_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)
    execution_time_seconds = Column(Float)
    
    # Results summary
    total_checks = Column(Integer, default=0)
    passed_checks = Column(Integer, default=0)
    failed_checks = Column(Integer, default=0)
    warnings = Column(Integer, default=0)
    errors = Column(Integer, default=0)
    critical_issues = Column(Integer, default=0)
    compliance_score = Column(Float)
    overall_status = Column(String(50))
    
    # Configuration and metadata
    validators_used = Column(JSON)
    rules_excluded = Column(JSON)
    severity_threshold = Column(String(20))
    metadata = Column(JSON)
    
    # Audit fields
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    results = relationship("ValidationResult", back_populates="session", cascade="all, delete-orphan")


class ValidationResult(Base):
    """Individual validation result."""
    __tablename__ = "validation_results"
    
    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(String(255), unique=True, index=True, nullable=False)
    session_id = Column(String(255), index=True, nullable=False)
    
    # Rule information
    rule_id = Column(String(100), nullable=False, index=True)
    rule_name = Column(String(255), nullable=False)
    validator_name = Column(String(100), index=True)
    
    # Result details
    category = Column(SQLEnum(ValidationCategoryEnum), nullable=False, index=True)
    severity = Column(SQLEnum(ValidationSeverityEnum), nullable=False, index=True)
    message = Column(Text, nullable=False)
    description = Column(Text)
    
    # Data context
    field_path = Column(String(500))
    actual_value = Column(Text)
    expected_value = Column(Text)
    
    # Recommendations
    suggestions = Column(JSON)  # List of suggestion strings
    
    # Status flags
    is_passing = Column(Boolean, default=False, index=True)
    is_failing = Column(Boolean, default=False, index=True)
    is_suppressed = Column(Boolean, default=False, index=True)
    suppression_reason = Column(Text)
    
    # Additional data
    metadata = Column(JSON)
    
    # Audit fields
    created_at = Column(DateTime, default=func.now())
    
    # Foreign key
    session = relationship("ValidationSession", back_populates="results")


class ValidationRule(Base):
    """Validation rule configuration."""
    __tablename__ = "validation_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(String(100), unique=True, index=True, nullable=False)
    validator_name = Column(String(100), nullable=False, index=True)
    
    # Rule details
    name = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(SQLEnum(ValidationCategoryEnum), nullable=False, index=True)
    severity = Column(SQLEnum(ValidationSeverityEnum), nullable=False)
    
    # Configuration
    is_enabled = Column(Boolean, default=True, index=True)
    is_system_rule = Column(Boolean, default=True)  # System rules vs custom rules
    configuration = Column(JSON)  # Rule-specific configuration
    
    # Applicability
    object_types = Column(JSON)  # List of object types this rule applies to
    conditions = Column(JSON)  # Conditions for when rule is applicable
    
    # Documentation
    documentation_url = Column(String(500))
    examples = Column(JSON)
    
    # Organization context
    organization_id = Column(String(255), index=True)  # Null for system rules
    
    # Audit fields
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    created_by = Column(String(255))
    updated_by = Column(String(255))


class ValidationProfile(Base):
    """Validation profile configuration."""
    __tablename__ = "validation_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    
    # Profile details
    display_name = Column(String(255))
    description = Column(Text)
    
    # Configuration
    enabled_validators = Column(JSON)  # List of validator names
    severity_threshold = Column(String(20), default="info")
    fail_fast = Column(Boolean, default=False)
    parallel_execution = Column(Boolean, default=True)
    max_workers = Column(Integer, default=4)
    
    # Rule customization
    custom_rules = Column(JSON)  # Custom rule configurations
    excluded_rules = Column(JSON)  # List of excluded rule IDs
    
    # Scope
    is_system_profile = Column(Boolean, default=False)
    organization_id = Column(String(255), index=True)  # Null for system profiles
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime)
    
    # Additional metadata
    metadata = Column(JSON)
    
    # Audit fields
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    created_by = Column(String(255))
    updated_by = Column(String(255))


class ValidationSuppression(Base):
    """Validation result suppressions."""
    __tablename__ = "validation_suppressions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Suppression scope
    rule_id = Column(String(100), nullable=False, index=True)
    object_type = Column(String(100), index=True)
    object_id = Column(String(255), index=True)
    field_path = Column(String(500), index=True)
    
    # Suppression details
    reason = Column(Text, nullable=False)
    suppressed_by = Column(String(255), nullable=False)
    approved_by = Column(String(255))  # For approval workflow
    
    # Timing
    suppressed_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime)  # Optional expiration
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    
    # Organization context
    organization_id = Column(String(255), index=True)
    
    # Audit fields
    created_at = Column(DateTime, default=func.now())


class ValidationMetrics(Base):
    """Aggregated validation metrics for reporting."""
    __tablename__ = "validation_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Scope
    organization_id = Column(String(255), index=True)
    object_type = Column(String(100), index=True)
    validator_name = Column(String(100), index=True)
    
    # Time period
    period_start = Column(DateTime, nullable=False, index=True)
    period_end = Column(DateTime, nullable=False, index=True)
    period_type = Column(String(20), index=True)  # daily, weekly, monthly
    
    # Metrics
    total_validations = Column(Integer, default=0)
    total_checks = Column(Integer, default=0)
    passed_checks = Column(Integer, default=0)
    failed_checks = Column(Integer, default=0)
    warnings = Column(Integer, default=0)
    errors = Column(Integer, default=0)
    critical_issues = Column(Integer, default=0)
    
    # Calculated metrics
    pass_rate = Column(Float)
    average_compliance_score = Column(Float)
    average_execution_time = Column(Float)
    
    # Top issues
    top_failing_rules = Column(JSON)  # List of rule IDs with failure counts
    
    # Audit
    calculated_at = Column(DateTime, default=func.now())


# Pydantic schemas for API responses
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any


class ValidationResultSchema(BaseModel):
    """Validation result API schema."""
    id: str
    rule_id: str
    rule_name: str
    category: str
    severity: str
    message: str
    description: Optional[str] = None
    field_path: Optional[str] = None
    value: Optional[Any] = None
    expected_value: Optional[Any] = None
    suggestions: List[str] = []
    metadata: Dict[str, Any] = {}
    timestamp: datetime
    is_passing: bool
    is_failing: bool
    
    class Config:
        from_attributes = True


class ValidationSummarySchema(BaseModel):
    """Validation summary API schema."""
    total_checks: int
    passed_checks: int
    failed_checks: int
    warnings: int
    errors: int
    critical_issues: int
    compliance_score: float
    pass_rate: float
    overall_status: str
    
    class Config:
        from_attributes = True


class ValidationSessionSchema(BaseModel):
    """Validation session API schema."""
    id: str
    user_id: Optional[str] = None
    profile_name: str
    object_type: str
    object_id: Optional[str] = None
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    execution_time_seconds: Optional[float] = None
    summary: ValidationSummarySchema
    results: List[ValidationResultSchema] = []
    metadata: Dict[str, Any] = {}
    
    class Config:
        from_attributes = True


class ValidationProfileSchema(BaseModel):
    """Validation profile API schema."""
    name: str
    display_name: Optional[str] = None
    description: Optional[str] = None
    enabled_validators: List[str]
    severity_threshold: str
    fail_fast: bool = False
    parallel_execution: bool = True
    excluded_rules: List[str] = []
    is_system_profile: bool = False
    
    class Config:
        from_attributes = True


class ValidationRuleSchema(BaseModel):
    """Validation rule API schema."""
    rule_id: str
    validator_name: str
    name: str
    description: Optional[str] = None
    category: str
    severity: str
    is_enabled: bool = True
    object_types: List[str] = []
    documentation_url: Optional[str] = None
    
    class Config:
        from_attributes = True