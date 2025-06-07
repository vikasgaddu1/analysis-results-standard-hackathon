"""Import/export validation utilities."""

from typing import Any, Dict, List, Optional, Tuple, Union
from datetime import datetime
from pydantic import BaseModel, validator
from sqlalchemy.orm import Session

from app.models.ars import (
    ReportingEvent, Analysis, AnalysisMethod, AnalysisSet, 
    DataSubset, Group, Operation, Output, WhereClause
)


class ValidationRule(BaseModel):
    """A validation rule for import/export data."""
    field_name: str
    rule_type: str  # required, type, format, range, unique, foreign_key
    parameters: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class ValidationResult(BaseModel):
    """Result of a validation check."""
    is_valid: bool
    field_name: str
    rule_type: str
    error_message: str
    value: Optional[Any] = None


class ImportValidator:
    """Validator for import data."""
    
    def __init__(self, db: Session):
        self.db = db
        self.validation_rules = self._get_validation_rules()
    
    def validate_data(self, data: Dict[str, Any], data_type: str) -> Tuple[bool, List[ValidationResult]]:
        """Validate data against defined rules."""
        results = []
        
        if data_type not in self.validation_rules:
            return False, [ValidationResult(
                is_valid=False,
                field_name="data_type",
                rule_type="unknown",
                error_message=f"Unknown data type: {data_type}"
            )]
        
        rules = self.validation_rules[data_type]
        
        for rule in rules:
            result = self._apply_validation_rule(data, rule)
            results.append(result)
        
        is_valid = all(result.is_valid for result in results)
        
        return is_valid, results
    
    def validate_batch(self, data_list: List[Dict[str, Any]], data_type: str) -> Tuple[bool, List[List[ValidationResult]]]:
        """Validate a batch of data items."""
        all_results = []
        all_valid = True
        
        for i, data in enumerate(data_list):
            is_valid, results = self.validate_data(data, data_type)
            all_results.append(results)
            if not is_valid:
                all_valid = False
        
        return all_valid, all_results
    
    def validate_foreign_keys(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate foreign key references."""
        results = []
        
        # Check reporting event reference
        if "reporting_event_id" in data and data["reporting_event_id"]:
            exists = self.db.query(ReportingEvent).filter(
                ReportingEvent.id == data["reporting_event_id"]
            ).first() is not None
            
            results.append(ValidationResult(
                is_valid=exists,
                field_name="reporting_event_id",
                rule_type="foreign_key",
                error_message=f"Reporting event {data['reporting_event_id']} does not exist" if not exists else "",
                value=data["reporting_event_id"]
            ))
        
        # Check method reference
        if "method_id" in data and data["method_id"]:
            exists = self.db.query(AnalysisMethod).filter(
                AnalysisMethod.id == data["method_id"]
            ).first() is not None
            
            results.append(ValidationResult(
                is_valid=exists,
                field_name="method_id", 
                rule_type="foreign_key",
                error_message=f"Analysis method {data['method_id']} does not exist" if not exists else "",
                value=data["method_id"]
            ))
        
        return results
    
    def validate_data_integrity(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate data integrity constraints."""
        results = []
        
        # Check for circular references
        if "id" in data and "parent_id" in data:
            if data["id"] == data["parent_id"]:
                results.append(ValidationResult(
                    is_valid=False,
                    field_name="parent_id",
                    rule_type="integrity",
                    error_message="Record cannot be its own parent",
                    value=data["parent_id"]
                ))
        
        # Check date ranges
        if "start_date" in data and "end_date" in data:
            if data["start_date"] and data["end_date"]:
                try:
                    start = datetime.fromisoformat(str(data["start_date"]))
                    end = datetime.fromisoformat(str(data["end_date"]))
                    
                    if start > end:
                        results.append(ValidationResult(
                            is_valid=False,
                            field_name="end_date",
                            rule_type="integrity",
                            error_message="End date must be after start date",
                            value=data["end_date"]
                        ))
                except (ValueError, TypeError):
                    results.append(ValidationResult(
                        is_valid=False,
                        field_name="date_range",
                        rule_type="integrity",
                        error_message="Invalid date format",
                        value=f"{data.get('start_date')} - {data.get('end_date')}"
                    ))
        
        return results
    
    def _apply_validation_rule(self, data: Dict[str, Any], rule: ValidationRule) -> ValidationResult:
        """Apply a single validation rule."""
        field_value = data.get(rule.field_name)
        
        if rule.rule_type == "required":
            is_valid = field_value is not None and field_value != ""
            error_msg = rule.error_message or f"Field '{rule.field_name}' is required"
            
        elif rule.rule_type == "type":
            expected_type = rule.parameters.get("type")
            is_valid = isinstance(field_value, expected_type) if field_value is not None else True
            error_msg = rule.error_message or f"Field '{rule.field_name}' must be of type {expected_type.__name__}"
            
        elif rule.rule_type == "format":
            import re
            pattern = rule.parameters.get("pattern")
            is_valid = bool(re.match(pattern, str(field_value))) if field_value is not None else True
            error_msg = rule.error_message or f"Field '{rule.field_name}' format is invalid"
            
        elif rule.rule_type == "range":
            min_val = rule.parameters.get("min")
            max_val = rule.parameters.get("max")
            is_valid = True
            error_msg = ""
            
            if field_value is not None:
                if min_val is not None and field_value < min_val:
                    is_valid = False
                    error_msg = f"Field '{rule.field_name}' must be >= {min_val}"
                elif max_val is not None and field_value > max_val:
                    is_valid = False
                    error_msg = f"Field '{rule.field_name}' must be <= {max_val}"
            
        elif rule.rule_type == "unique":
            # This would require checking against existing data
            is_valid = True  # Simplified for now
            error_msg = ""
            
        else:
            is_valid = True
            error_msg = ""
        
        return ValidationResult(
            is_valid=is_valid,
            field_name=rule.field_name,
            rule_type=rule.rule_type,
            error_message=error_msg if not is_valid else "",
            value=field_value
        )
    
    def _get_validation_rules(self) -> Dict[str, List[ValidationRule]]:
        """Get validation rules for different data types."""
        return {
            "reporting_event": [
                ValidationRule(
                    field_name="id",
                    rule_type="required",
                    error_message="Reporting event ID is required"
                ),
                ValidationRule(
                    field_name="name", 
                    rule_type="required",
                    error_message="Reporting event name is required"
                ),
                ValidationRule(
                    field_name="id",
                    rule_type="format",
                    parameters={"pattern": r"^[a-zA-Z0-9_-]+$"},
                    error_message="ID must contain only alphanumeric characters, underscores, and hyphens"
                )
            ],
            "analysis": [
                ValidationRule(
                    field_name="id",
                    rule_type="required",
                    error_message="Analysis ID is required"
                ),
                ValidationRule(
                    field_name="name",
                    rule_type="required", 
                    error_message="Analysis name is required"
                ),
                ValidationRule(
                    field_name="id",
                    rule_type="format",
                    parameters={"pattern": r"^[a-zA-Z0-9_-]+$"},
                    error_message="ID must contain only alphanumeric characters, underscores, and hyphens"
                )
            ],
            "method": [
                ValidationRule(
                    field_name="id",
                    rule_type="required",
                    error_message="Method ID is required"
                ),
                ValidationRule(
                    field_name="name",
                    rule_type="required",
                    error_message="Method name is required"
                )
            ]
        }


class ExportValidator:
    """Validator for export data."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def validate_export_request(self, export_params: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate export request parameters."""
        errors = []
        
        # Check required parameters
        if "format" not in export_params:
            errors.append("Export format is required")
        elif export_params["format"] not in ["yaml", "json", "excel"]:
            errors.append("Export format must be yaml, json, or excel")
        
        if "output_path" not in export_params:
            errors.append("Output path is required")
        
        # Validate export scope
        if "reporting_event_id" not in export_params and "analysis_ids" not in export_params:
            errors.append("Either reporting_event_id or analysis_ids must be specified")
        
        # Check if specified entities exist
        if "reporting_event_id" in export_params:
            re_id = export_params["reporting_event_id"]
            if not self.db.query(ReportingEvent).filter(ReportingEvent.id == re_id).first():
                errors.append(f"Reporting event {re_id} does not exist")
        
        if "analysis_ids" in export_params:
            for analysis_id in export_params["analysis_ids"]:
                if not self.db.query(Analysis).filter(Analysis.id == analysis_id).first():
                    errors.append(f"Analysis {analysis_id} does not exist")
        
        return len(errors) == 0, errors
    
    def validate_data_completeness(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate that export data is complete."""
        warnings = []
        
        # Check for empty sections
        if "analyses" in data and not data["analyses"]:
            warnings.append("No analyses found for export")
        
        if "reportingEvent" in data:
            re_data = data["reportingEvent"]
            if not re_data.get("name"):
                warnings.append("Reporting event name is missing")
        
        # Check for missing relationships
        for analysis in data.get("analyses", []):
            if analysis.get("method_id") and "methods" in data:
                method_found = any(m.get("id") == analysis["method_id"] for m in data["methods"])
                if not method_found:
                    warnings.append(f"Method {analysis['method_id']} referenced but not included in export")
        
        return True, warnings  # Warnings don't make export invalid
    
    def validate_export_permissions(self, user_id: str, export_params: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate user permissions for export."""
        errors = []
        
        # This would implement actual permission checking
        # For now, just basic validation
        
        if not user_id:
            errors.append("User authentication required for export")
        
        # Check if user has access to requested data
        # This would integrate with your authorization system
        
        return len(errors) == 0, errors