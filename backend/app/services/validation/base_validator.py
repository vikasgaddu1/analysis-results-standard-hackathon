"""
Base validation framework for all validation services.
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass, field
from datetime import datetime
import uuid


class ValidationSeverity(str, Enum):
    """Severity levels for validation issues."""
    CRITICAL = "critical"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class ValidationCategory(str, Enum):
    """Categories of validation checks."""
    STANDARDS_COMPLIANCE = "standards_compliance"
    DATA_INTEGRITY = "data_integrity"
    BUSINESS_RULES = "business_rules"
    REGULATORY_COMPLIANCE = "regulatory_compliance"
    PERFORMANCE = "performance"
    SECURITY = "security"


@dataclass
class ValidationResult:
    """Result of a validation check."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    rule_id: str = ""
    rule_name: str = ""
    category: ValidationCategory = ValidationCategory.DATA_INTEGRITY
    severity: ValidationSeverity = ValidationSeverity.INFO
    message: str = ""
    description: str = ""
    field_path: Optional[str] = None
    value: Optional[Any] = None
    expected_value: Optional[Any] = None
    suggestions: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    @property
    def is_passing(self) -> bool:
        """Check if this validation result indicates a passing check."""
        return self.severity in [ValidationSeverity.INFO]
    
    @property
    def is_failing(self) -> bool:
        """Check if this validation result indicates a failing check."""
        return self.severity in [ValidationSeverity.CRITICAL, ValidationSeverity.ERROR]


@dataclass
class ValidationSummary:
    """Summary of validation results."""
    total_checks: int = 0
    passed_checks: int = 0
    failed_checks: int = 0
    warnings: int = 0
    critical_issues: int = 0
    errors: int = 0
    compliance_score: float = 0.0
    overall_status: str = "unknown"
    
    @property
    def pass_rate(self) -> float:
        """Calculate the pass rate as a percentage."""
        if self.total_checks == 0:
            return 0.0
        return (self.passed_checks / self.total_checks) * 100


@dataclass
class ValidationContext:
    """Context information for validation."""
    object_type: str
    object_id: Optional[str] = None
    user_id: Optional[str] = None
    organization_id: Optional[str] = None
    validation_profile: str = "default"
    include_warnings: bool = True
    include_info: bool = False
    custom_rules: List[str] = field(default_factory=list)
    excluded_rules: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class BaseValidator(ABC):
    """Base class for all validators."""
    
    def __init__(self, name: str = None):
        self.name = name or self.__class__.__name__
        self.enabled_rules: Dict[str, bool] = {}
        self.rule_configurations: Dict[str, Dict[str, Any]] = {}
        
    @abstractmethod
    def validate(self, data: Any, context: ValidationContext) -> List[ValidationResult]:
        """
        Validate the given data.
        
        Args:
            data: The data to validate
            context: Validation context
            
        Returns:
            List of validation results
        """
        pass
    
    @abstractmethod
    def get_supported_rules(self) -> List[str]:
        """Get list of supported validation rules."""
        pass
    
    def configure_rule(self, rule_id: str, config: Dict[str, Any]) -> None:
        """Configure a specific validation rule."""
        self.rule_configurations[rule_id] = config
    
    def enable_rule(self, rule_id: str) -> None:
        """Enable a specific validation rule."""
        self.enabled_rules[rule_id] = True
    
    def disable_rule(self, rule_id: str) -> None:
        """Disable a specific validation rule."""
        self.enabled_rules[rule_id] = False
    
    def is_rule_enabled(self, rule_id: str) -> bool:
        """Check if a rule is enabled."""
        return self.enabled_rules.get(rule_id, True)
    
    def create_result(
        self,
        rule_id: str,
        rule_name: str,
        category: ValidationCategory,
        severity: ValidationSeverity,
        message: str,
        description: str = "",
        field_path: str = None,
        value: Any = None,
        expected_value: Any = None,
        suggestions: List[str] = None,
        metadata: Dict[str, Any] = None
    ) -> ValidationResult:
        """Helper method to create validation results."""
        return ValidationResult(
            rule_id=rule_id,
            rule_name=rule_name,
            category=category,
            severity=severity,
            message=message,
            description=description,
            field_path=field_path,
            value=value,
            expected_value=expected_value,
            suggestions=suggestions or [],
            metadata=metadata or {}
        )
    
    def validate_required_field(
        self,
        data: Dict[str, Any],
        field_name: str,
        rule_id: str,
        rule_name: str,
        category: ValidationCategory = ValidationCategory.DATA_INTEGRITY
    ) -> Optional[ValidationResult]:
        """Validate that a required field is present and not empty."""
        if field_name not in data or data[field_name] is None or data[field_name] == "":
            return self.create_result(
                rule_id=rule_id,
                rule_name=rule_name,
                category=category,
                severity=ValidationSeverity.ERROR,
                message=f"Required field '{field_name}' is missing or empty",
                field_path=field_name,
                value=data.get(field_name),
                suggestions=[f"Provide a value for {field_name}"]
            )
        return None
    
    def validate_field_type(
        self,
        data: Dict[str, Any],
        field_name: str,
        expected_type: type,
        rule_id: str,
        rule_name: str,
        category: ValidationCategory = ValidationCategory.DATA_INTEGRITY
    ) -> Optional[ValidationResult]:
        """Validate that a field has the expected type."""
        if field_name in data and data[field_name] is not None:
            if not isinstance(data[field_name], expected_type):
                return self.create_result(
                    rule_id=rule_id,
                    rule_name=rule_name,
                    category=category,
                    severity=ValidationSeverity.ERROR,
                    message=f"Field '{field_name}' has incorrect type",
                    description=f"Expected {expected_type.__name__}, got {type(data[field_name]).__name__}",
                    field_path=field_name,
                    value=data[field_name],
                    expected_value=f"Value of type {expected_type.__name__}",
                    suggestions=[f"Convert {field_name} to {expected_type.__name__}"]
                )
        return None
    
    def validate_field_range(
        self,
        data: Dict[str, Any],
        field_name: str,
        min_value: Union[int, float] = None,
        max_value: Union[int, float] = None,
        rule_id: str = "",
        rule_name: str = "",
        category: ValidationCategory = ValidationCategory.DATA_INTEGRITY
    ) -> Optional[ValidationResult]:
        """Validate that a numeric field is within the specified range."""
        if field_name in data and data[field_name] is not None:
            value = data[field_name]
            if isinstance(value, (int, float)):
                if min_value is not None and value < min_value:
                    return self.create_result(
                        rule_id=rule_id,
                        rule_name=rule_name,
                        category=category,
                        severity=ValidationSeverity.ERROR,
                        message=f"Field '{field_name}' value {value} is below minimum {min_value}",
                        field_path=field_name,
                        value=value,
                        expected_value=f"Value >= {min_value}",
                        suggestions=[f"Increase {field_name} to at least {min_value}"]
                    )
                if max_value is not None and value > max_value:
                    return self.create_result(
                        rule_id=rule_id,
                        rule_name=rule_name,
                        category=category,
                        severity=ValidationSeverity.ERROR,
                        message=f"Field '{field_name}' value {value} exceeds maximum {max_value}",
                        field_path=field_name,
                        value=value,
                        expected_value=f"Value <= {max_value}",
                        suggestions=[f"Reduce {field_name} to at most {max_value}"]
                    )
        return None