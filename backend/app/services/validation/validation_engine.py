"""
Main validation orchestrator engine.
"""

from typing import Any, Dict, List, Optional, Set, Type
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
import logging
from datetime import datetime

from .base_validator import (
    BaseValidator, ValidationResult, ValidationSeverity, 
    ValidationCategory, ValidationContext, ValidationSummary
)
from .ars_validator import ARSValidator
from .cdisc_validator import CDISCValidator
from .regulatory_validator import RegulatoryValidator
from .data_integrity_validator import DataIntegrityValidator
from .business_rules_validator import BusinessRulesValidator


@dataclass
class ValidationProfile:
    """Configuration profile for validation."""
    name: str
    description: str = ""
    enabled_validators: List[str] = field(default_factory=list)
    severity_threshold: ValidationSeverity = ValidationSeverity.INFO
    fail_fast: bool = False
    parallel_execution: bool = True
    max_workers: int = 4
    custom_rules: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    excluded_rules: Set[str] = field(default_factory=set)
    metadata: Dict[str, Any] = field(default_factory=dict)


class ValidationEngine:
    """Main validation engine that orchestrates multiple validators."""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Initialize all validators
        self._validators: Dict[str, BaseValidator] = {
            "ars": ARSValidator(),
            "cdisc": CDISCValidator(),
            "regulatory": RegulatoryValidator(),
            "data_integrity": DataIntegrityValidator(),
            "business_rules": BusinessRulesValidator()
        }
        
        # Predefined validation profiles
        self._profiles: Dict[str, ValidationProfile] = {
            "default": ValidationProfile(
                name="default",
                description="Standard validation with all validators enabled",
                enabled_validators=list(self._validators.keys()),
                severity_threshold=ValidationSeverity.INFO
            ),
            "strict": ValidationProfile(
                name="strict",
                description="Comprehensive validation for regulatory submission",
                enabled_validators=list(self._validators.keys()),
                severity_threshold=ValidationSeverity.INFO,
                fail_fast=False
            ),
            "basic": ValidationProfile(
                name="basic",
                description="Basic data integrity and ARS compliance only",
                enabled_validators=["data_integrity", "ars"],
                severity_threshold=ValidationSeverity.WARNING
            ),
            "regulatory": ValidationProfile(
                name="regulatory",
                description="Regulatory compliance focus",
                enabled_validators=["regulatory", "ars", "data_integrity"],
                severity_threshold=ValidationSeverity.WARNING
            ),
            "development": ValidationProfile(
                name="development",
                description="Development-friendly validation",
                enabled_validators=["data_integrity"],
                severity_threshold=ValidationSeverity.ERROR,
                fail_fast=True
            )
        }
        
        self._validation_history: List[Dict[str, Any]] = []
    
    def validate(
        self,
        data: Any,
        context: ValidationContext,
        profile_name: str = "default"
    ) -> Dict[str, Any]:
        """
        Perform comprehensive validation using specified profile.
        
        Args:
            data: The data to validate
            context: Validation context
            profile_name: Name of validation profile to use
            
        Returns:
            Dictionary containing validation results and summary
        """
        start_time = datetime.utcnow()
        
        # Get validation profile
        profile = self._profiles.get(profile_name)
        if not profile:
            raise ValueError(f"Unknown validation profile: {profile_name}")
        
        self.logger.info(f"Starting validation with profile '{profile_name}' for {context.object_type}")
        
        # Prepare validators
        active_validators = []
        for validator_name in profile.enabled_validators:
            if validator_name in self._validators:
                validator = self._validators[validator_name]
                self._configure_validator(validator, profile)
                active_validators.append((validator_name, validator))
        
        # Execute validation
        all_results = []
        validation_errors = []
        
        if profile.parallel_execution and len(active_validators) > 1:
            all_results, validation_errors = self._validate_parallel(
                active_validators, data, context, profile
            )
        else:
            all_results, validation_errors = self._validate_sequential(
                active_validators, data, context, profile
            )
        
        # Filter results by severity threshold
        filtered_results = [
            result for result in all_results
            if self._severity_level(result.severity) >= self._severity_level(profile.severity_threshold)
        ]
        
        # Generate summary
        summary = self._generate_summary(filtered_results)
        
        # Calculate compliance score
        compliance_score = self._calculate_compliance_score(filtered_results)
        summary.compliance_score = compliance_score
        
        # Determine overall status
        summary.overall_status = self._determine_overall_status(filtered_results, compliance_score)
        
        end_time = datetime.utcnow()
        execution_time = (end_time - start_time).total_seconds()
        
        # Create validation report
        report = {
            "timestamp": start_time.isoformat(),
            "execution_time_seconds": execution_time,
            "profile": profile.name,
            "context": {
                "object_type": context.object_type,
                "object_id": context.object_id,
                "user_id": context.user_id,
                "validation_profile": context.validation_profile
            },
            "summary": {
                "total_checks": summary.total_checks,
                "passed_checks": summary.passed_checks,
                "failed_checks": summary.failed_checks,
                "warnings": summary.warnings,
                "critical_issues": summary.critical_issues,
                "errors": summary.errors,
                "compliance_score": summary.compliance_score,
                "pass_rate": summary.pass_rate,
                "overall_status": summary.overall_status
            },
            "results": [self._result_to_dict(result) for result in filtered_results],
            "validation_errors": validation_errors,
            "metadata": {
                "validators_used": [name for name, _ in active_validators],
                "rules_excluded": list(profile.excluded_rules),
                "severity_threshold": profile.severity_threshold.value
            }
        }
        
        # Store in history
        self._validation_history.append(report)
        
        self.logger.info(
            f"Validation completed in {execution_time:.2f}s: "
            f"{summary.total_checks} checks, "
            f"{summary.failed_checks} failures, "
            f"score: {compliance_score:.1f}%"
        )
        
        return report
    
    def validate_multiple(
        self,
        data_items: List[Dict[str, Any]],
        profile_name: str = "default"
    ) -> Dict[str, Any]:
        """
        Validate multiple data items in batch.
        
        Args:
            data_items: List of dictionaries with 'data' and 'context' keys
            profile_name: Name of validation profile to use
            
        Returns:
            Batch validation results
        """
        start_time = datetime.utcnow()
        
        results = []
        for i, item in enumerate(data_items):
            try:
                data = item["data"]
                context = item["context"]
                if isinstance(context, dict):
                    context = ValidationContext(**context)
                
                result = self.validate(data, context, profile_name)
                result["item_index"] = i
                results.append(result)
                
            except Exception as e:
                self.logger.error(f"Validation failed for item {i}: {str(e)}")
                results.append({
                    "item_index": i,
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        end_time = datetime.utcnow()
        
        # Aggregate summary
        total_checks = sum(r.get("summary", {}).get("total_checks", 0) for r in results)
        total_failures = sum(r.get("summary", {}).get("failed_checks", 0) for r in results)
        avg_compliance = sum(r.get("summary", {}).get("compliance_score", 0) for r in results) / len(results) if results else 0
        
        return {
            "timestamp": start_time.isoformat(),
            "execution_time_seconds": (end_time - start_time).total_seconds(),
            "profile": profile_name,
            "batch_summary": {
                "total_items": len(data_items),
                "successful_validations": len([r for r in results if "error" not in r]),
                "failed_validations": len([r for r in results if "error" in r]),
                "total_checks": total_checks,
                "total_failures": total_failures,
                "average_compliance_score": avg_compliance
            },
            "results": results
        }
    
    def get_validation_profiles(self) -> Dict[str, Dict[str, Any]]:
        """Get available validation profiles."""
        return {
            name: {
                "name": profile.name,
                "description": profile.description,
                "enabled_validators": profile.enabled_validators,
                "severity_threshold": profile.severity_threshold.value,
                "metadata": profile.metadata
            }
            for name, profile in self._profiles.items()
        }
    
    def create_custom_profile(
        self,
        name: str,
        description: str = "",
        enabled_validators: List[str] = None,
        severity_threshold: ValidationSeverity = ValidationSeverity.INFO,
        **kwargs
    ) -> None:
        """Create a custom validation profile."""
        if enabled_validators is None:
            enabled_validators = list(self._validators.keys())
        
        # Validate validator names
        invalid_validators = set(enabled_validators) - set(self._validators.keys())
        if invalid_validators:
            raise ValueError(f"Unknown validators: {invalid_validators}")
        
        profile = ValidationProfile(
            name=name,
            description=description,
            enabled_validators=enabled_validators,
            severity_threshold=severity_threshold,
            **kwargs
        )
        
        self._profiles[name] = profile
    
    def get_validator_rules(self, validator_name: str) -> List[str]:
        """Get supported rules for a specific validator."""
        if validator_name not in self._validators:
            raise ValueError(f"Unknown validator: {validator_name}")
        
        return self._validators[validator_name].get_supported_rules()
    
    def get_validation_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get validation history."""
        return self._validation_history[-limit:]
    
    def clear_validation_history(self) -> None:
        """Clear validation history."""
        self._validation_history.clear()
    
    def _configure_validator(self, validator: BaseValidator, profile: ValidationProfile) -> None:
        """Configure validator based on profile settings."""
        # Apply custom rule configurations
        if profile.custom_rules:
            for rule_id, config in profile.custom_rules.items():
                if rule_id in validator.get_supported_rules():
                    validator.configure_rule(rule_id, config)
        
        # Apply excluded rules
        for rule_id in profile.excluded_rules:
            if rule_id in validator.get_supported_rules():
                validator.disable_rule(rule_id)
    
    def _validate_parallel(
        self,
        validators: List[tuple],
        data: Any,
        context: ValidationContext,
        profile: ValidationProfile
    ) -> tuple:
        """Execute validation in parallel."""
        all_results = []
        validation_errors = []
        
        with ThreadPoolExecutor(max_workers=profile.max_workers) as executor:
            # Submit validation tasks
            future_to_validator = {
                executor.submit(self._safe_validate, validator, data, context): validator_name
                for validator_name, validator in validators
            }
            
            # Collect results
            for future in as_completed(future_to_validator):
                validator_name = future_to_validator[future]
                try:
                    results = future.result()
                    all_results.extend(results)
                    
                    # Check for fail-fast condition
                    if profile.fail_fast and any(r.severity == ValidationSeverity.CRITICAL for r in results):
                        # Cancel remaining tasks
                        for f in future_to_validator:
                            f.cancel()
                        break
                        
                except Exception as e:
                    error_msg = f"Validator '{validator_name}' failed: {str(e)}"
                    self.logger.error(error_msg)
                    validation_errors.append(error_msg)
        
        return all_results, validation_errors
    
    def _validate_sequential(
        self,
        validators: List[tuple],
        data: Any,
        context: ValidationContext,
        profile: ValidationProfile
    ) -> tuple:
        """Execute validation sequentially."""
        all_results = []
        validation_errors = []
        
        for validator_name, validator in validators:
            try:
                results = self._safe_validate(validator, data, context)
                all_results.extend(results)
                
                # Check for fail-fast condition
                if profile.fail_fast and any(r.severity == ValidationSeverity.CRITICAL for r in results):
                    break
                    
            except Exception as e:
                error_msg = f"Validator '{validator_name}' failed: {str(e)}"
                self.logger.error(error_msg)
                validation_errors.append(error_msg)
        
        return all_results, validation_errors
    
    def _safe_validate(self, validator: BaseValidator, data: Any, context: ValidationContext) -> List[ValidationResult]:
        """Safely execute validator with error handling."""
        try:
            return validator.validate(data, context)
        except Exception as e:
            self.logger.error(f"Validation error in {validator.name}: {str(e)}")
            # Return a critical error result
            return [ValidationResult(
                rule_id="system_error",
                rule_name="System Error",
                category=ValidationCategory.DATA_INTEGRITY,
                severity=ValidationSeverity.CRITICAL,
                message=f"Validation system error: {str(e)}",
                metadata={"validator": validator.name, "exception": str(e)}
            )]
    
    def _generate_summary(self, results: List[ValidationResult]) -> ValidationSummary:
        """Generate validation summary from results."""
        summary = ValidationSummary()
        summary.total_checks = len(results)
        
        for result in results:
            if result.is_passing:
                summary.passed_checks += 1
            elif result.is_failing:
                summary.failed_checks += 1
            
            if result.severity == ValidationSeverity.WARNING:
                summary.warnings += 1
            elif result.severity == ValidationSeverity.ERROR:
                summary.errors += 1
            elif result.severity == ValidationSeverity.CRITICAL:
                summary.critical_issues += 1
        
        return summary
    
    def _calculate_compliance_score(self, results: List[ValidationResult]) -> float:
        """Calculate compliance score based on validation results."""
        if not results:
            return 100.0
        
        # Weight different severity levels
        weights = {
            ValidationSeverity.INFO: 0,
            ValidationSeverity.WARNING: 1,
            ValidationSeverity.ERROR: 3,
            ValidationSeverity.CRITICAL: 5
        }
        
        total_weight = sum(weights[result.severity] for result in results)
        max_possible_weight = len(results) * weights[ValidationSeverity.CRITICAL]
        
        if max_possible_weight == 0:
            return 100.0
        
        compliance_score = max(0, 100 - (total_weight / max_possible_weight * 100))
        return round(compliance_score, 1)
    
    def _determine_overall_status(self, results: List[ValidationResult], compliance_score: float) -> str:
        """Determine overall validation status."""
        if not results:
            return "no_data"
        
        critical_count = sum(1 for r in results if r.severity == ValidationSeverity.CRITICAL)
        error_count = sum(1 for r in results if r.severity == ValidationSeverity.ERROR)
        
        if critical_count > 0:
            return "critical"
        elif error_count > 0:
            return "failed"
        elif compliance_score >= 90:
            return "excellent"
        elif compliance_score >= 75:
            return "good"
        elif compliance_score >= 60:
            return "acceptable"
        else:
            return "needs_improvement"
    
    def _severity_level(self, severity: ValidationSeverity) -> int:
        """Convert severity to numeric level for comparison."""
        levels = {
            ValidationSeverity.INFO: 1,
            ValidationSeverity.WARNING: 2,
            ValidationSeverity.ERROR: 3,
            ValidationSeverity.CRITICAL: 4
        }
        return levels.get(severity, 0)
    
    def _result_to_dict(self, result: ValidationResult) -> Dict[str, Any]:
        """Convert ValidationResult to dictionary."""
        return {
            "id": result.id,
            "rule_id": result.rule_id,
            "rule_name": result.rule_name,
            "category": result.category.value,
            "severity": result.severity.value,
            "message": result.message,
            "description": result.description,
            "field_path": result.field_path,
            "value": result.value,
            "expected_value": result.expected_value,
            "suggestions": result.suggestions,
            "metadata": result.metadata,
            "timestamp": result.timestamp.isoformat(),
            "is_passing": result.is_passing,
            "is_failing": result.is_failing
        }