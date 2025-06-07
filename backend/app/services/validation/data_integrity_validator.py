"""
Data integrity and consistency validator.
"""

from typing import Any, Dict, List, Optional, Set, Union
from collections import defaultdict
import re
from .base_validator import (
    BaseValidator, ValidationResult, ValidationSeverity, 
    ValidationCategory, ValidationContext
)


class DataIntegrityValidator(BaseValidator):
    """Validator for data integrity and consistency checks."""
    
    def __init__(self):
        super().__init__("Data Integrity Validator")
        self.integrity_rules = {
            "di_001": "Required field validation",
            "di_002": "Data type consistency",
            "di_003": "Value range validation",
            "di_004": "Format validation",
            "di_005": "Referential integrity",
            "di_006": "Duplicate detection",
            "di_007": "Null value validation",
            "di_008": "Enumeration value validation",
            "di_009": "Cross-field validation",
            "di_010": "Hierarchical consistency",
            "di_011": "Temporal consistency",
            "di_012": "Completeness validation",
            "di_013": "Precision validation",
            "di_014": "Uniqueness constraints",
            "di_015": "Dependency validation",
            "di_016": "Encoding validation",
            "di_017": "Length constraints",
            "di_018": "Pattern matching validation",
            "di_019": "Logical consistency",
            "di_020": "Aggregate validation"
        }
        
        # Common data patterns
        self.id_pattern = re.compile(r'^[A-Z][A-Z0-9_]{2,}$')
        self.email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        self.phone_pattern = re.compile(r'^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$')
        self.version_pattern = re.compile(r'^\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9]+)?$')
        
        # Valid enumeration values for common fields
        self.valid_enums = {
            "severity": ["low", "medium", "high", "critical"],
            "status": ["draft", "active", "inactive", "deprecated"],
            "type": ["primary", "secondary", "exploratory", "safety"],
            "comparator": ["eq", "ne", "lt", "le", "gt", "ge", "in", "notin", "like"],
            "logical_operator": ["and", "or", "not"],
            "file_type": ["pdf", "rtf", "html", "txt", "xlsx", "csv"]
        }
    
    def get_supported_rules(self) -> List[str]:
        """Get list of supported data integrity validation rules."""
        return list(self.integrity_rules.keys())
    
    def validate(self, data: Any, context: ValidationContext) -> List[ValidationResult]:
        """Validate data integrity and consistency."""
        results = []
        
        if not isinstance(data, dict):
            results.append(self.create_result(
                rule_id="di_000",
                rule_name="Data Format",
                category=ValidationCategory.DATA_INTEGRITY,
                severity=ValidationSeverity.CRITICAL,
                message="Data must be provided as a dictionary/object",
                value=type(data).__name__,
                expected_value="dict"
            ))
            return results
        
        # General data integrity validations
        results.extend(self._validate_required_fields(data, context))
        results.extend(self._validate_data_types(data, context))
        results.extend(self._validate_value_ranges(data, context))
        results.extend(self._validate_formats(data, context))
        results.extend(self._validate_referential_integrity(data, context))
        results.extend(self._validate_duplicates(data, context))
        results.extend(self._validate_null_values(data, context))
        results.extend(self._validate_enumerations(data, context))
        results.extend(self._validate_cross_fields(data, context))
        results.extend(self._validate_hierarchical_consistency(data, context))
        
        return results
    
    def _validate_required_fields(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate required fields based on object type."""
        results = []
        
        if not self.is_rule_enabled("di_001"):
            return results
        
        # Define required fields by object type
        required_fields_map = {
            "reporting_event": ["id", "name", "version"],
            "analysis": ["id", "name", "methodId"],
            "method": ["id", "name"],
            "output": ["id", "name"],
            "where_clause": [],  # Conditional requirements handled separately
            "analysis_set": ["id", "name"],
            "group": ["id", "name"],
            "data_subset": ["id", "name"]
        }
        
        required_fields = required_fields_map.get(context.object_type, [])
        
        for field in required_fields:
            result = self.validate_required_field(
                data, field, "di_001", self.integrity_rules["di_001"]
            )
            if result:
                results.append(result)
        
        return results
    
    def _validate_data_types(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate data types for known fields."""
        results = []
        
        if not self.is_rule_enabled("di_002"):
            return results
        
        # Expected data types for common fields
        type_expectations = {
            "id": str,
            "name": str,
            "description": str,
            "version": str,
            "order": int,
            "level": int,
            "created": str,
            "modified": str,
            "analyses": list,
            "methods": list,
            "outputs": list,
            "dataSubsets": list,
            "resultGroups": list,
            "whereClauses": list,
            "operations": list,
            "parameters": list
        }
        
        for field, expected_type in type_expectations.items():
            if field in data:
                result = self.validate_field_type(
                    data, field, expected_type, "di_002", self.integrity_rules["di_002"]
                )
                if result:
                    results.append(result)
        
        return results
    
    def _validate_value_ranges(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate value ranges for numeric fields."""
        results = []
        
        if not self.is_rule_enabled("di_003"):
            return results
        
        # Define range constraints
        range_constraints = {
            "order": {"min": 0, "max": 99999},
            "level": {"min": 0, "max": 10},
            "firstPage": {"min": 1},
            "lastPage": {"min": 1}
        }
        
        for field, constraints in range_constraints.items():
            if field in data:
                result = self.validate_field_range(
                    data, field, 
                    constraints.get("min"), 
                    constraints.get("max"),
                    "di_003", 
                    self.integrity_rules["di_003"]
                )
                if result:
                    results.append(result)
        
        return results
    
    def _validate_formats(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate format patterns for string fields."""
        results = []
        
        if not self.is_rule_enabled("di_004"):
            return results
        
        # Format validations
        format_validations = [
            ("id", self.id_pattern, "ID format (starts with letter, alphanumeric + underscore)"),
            ("version", self.version_pattern, "Version format (x.y.z)"),
        ]
        
        for field, pattern, description in format_validations:
            if field in data and isinstance(data[field], str):
                if not pattern.match(data[field]):
                    results.append(self.create_result(
                        rule_id="di_004",
                        rule_name=self.integrity_rules["di_004"],
                        category=ValidationCategory.DATA_INTEGRITY,
                        severity=ValidationSeverity.ERROR,
                        message=f"Field '{field}' has invalid format",
                        description=f"Expected format: {description}",
                        field_path=field,
                        value=data[field],
                        suggestions=[f"Format {field} according to pattern: {description}"]
                    ))
        
        # Email format validation
        if "email" in data and isinstance(data["email"], str):
            if not self.email_pattern.match(data["email"]):
                results.append(self.create_result(
                    rule_id="di_004",
                    rule_name=self.integrity_rules["di_004"],
                    category=ValidationCategory.DATA_INTEGRITY,
                    severity=ValidationSeverity.ERROR,
                    message="Invalid email format",
                    field_path="email",
                    value=data["email"],
                    suggestions=["Provide a valid email address"]
                ))
        
        return results
    
    def _validate_referential_integrity(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate referential integrity between related objects."""
        results = []
        
        if not self.is_rule_enabled("di_005"):
            return results
        
        # Check method references in analyses
        if context.object_type == "reporting_event" and "analyses" in data:
            method_ids = set()
            if "methods" in data:
                method_ids = {method.get("id") for method in data["methods"] if isinstance(method, dict)}
            
            for i, analysis in enumerate(data["analyses"]):
                if isinstance(analysis, dict) and "methodId" in analysis:
                    method_id = analysis["methodId"]
                    if method_id not in method_ids:
                        results.append(self.create_result(
                            rule_id="di_005",
                            rule_name=self.integrity_rules["di_005"],
                            category=ValidationCategory.DATA_INTEGRITY,
                            severity=ValidationSeverity.ERROR,
                            message=f"Analysis references non-existent method '{method_id}'",
                            field_path=f"analyses[{i}].methodId",
                            value=method_id,
                            suggestions=[
                                f"Add method with ID '{method_id}' to methods collection",
                                "Update analysis to reference existing method"
                            ]
                        ))
        
        # Check analysis set references
        if "analysisSetId" in data:
            # This would require cross-referencing with analysis sets collection
            # For now, just check it's not empty
            if not data["analysisSetId"] or not isinstance(data["analysisSetId"], str):
                results.append(self.create_result(
                    rule_id="di_005",
                    rule_name=self.integrity_rules["di_005"],
                    category=ValidationCategory.DATA_INTEGRITY,
                    severity=ValidationSeverity.ERROR,
                    message="Invalid analysis set reference",
                    field_path="analysisSetId",
                    value=data["analysisSetId"],
                    suggestions=["Provide valid analysis set identifier"]
                ))
        
        return results
    
    def _validate_duplicates(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate for duplicate entries in collections."""
        results = []
        
        if not self.is_rule_enabled("di_006"):
            return results
        
        # Check for duplicate IDs in collections
        collections_to_check = [
            ("analyses", "id"),
            ("methods", "id"),
            ("outputs", "id"),
            ("dataSubsets", "id"),
            ("groups", "id"),
            ("whereClauses", "id"),
            ("operations", "id"),
            ("resultGroups", "id")
        ]
        
        for collection_name, id_field in collections_to_check:
            if collection_name in data and isinstance(data[collection_name], list):
                ids_seen = set()
                for i, item in enumerate(data[collection_name]):
                    if isinstance(item, dict) and id_field in item:
                        item_id = item[id_field]
                        if item_id in ids_seen:
                            results.append(self.create_result(
                                rule_id="di_006",
                                rule_name=self.integrity_rules["di_006"],
                                category=ValidationCategory.DATA_INTEGRITY,
                                severity=ValidationSeverity.ERROR,
                                message=f"Duplicate {id_field} '{item_id}' found in {collection_name}",
                                field_path=f"{collection_name}[{i}].{id_field}",
                                value=item_id,
                                suggestions=[f"Ensure all {id_field} values in {collection_name} are unique"]
                            ))
                        else:
                            ids_seen.add(item_id)
        
        return results
    
    def _validate_null_values(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate null value handling."""
        results = []
        
        if not self.is_rule_enabled("di_007"):
            return results
        
        # Fields that should not be null/empty when present
        non_nullable_fields = ["id", "name"]
        
        for field in non_nullable_fields:
            if field in data:
                value = data[field]
                if value is None or (isinstance(value, str) and not value.strip()):
                    results.append(self.create_result(
                        rule_id="di_007",
                        rule_name=self.integrity_rules["di_007"],
                        category=ValidationCategory.DATA_INTEGRITY,
                        severity=ValidationSeverity.ERROR,
                        message=f"Field '{field}' cannot be null or empty",
                        field_path=field,
                        value=value,
                        suggestions=[f"Provide a valid value for {field}"]
                    ))
        
        return results
    
    def _validate_enumerations(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate enumeration values."""
        results = []
        
        if not self.is_rule_enabled("di_008"):
            return results
        
        for field, valid_values in self.valid_enums.items():
            if field in data:
                value = data[field]
                if isinstance(value, str) and value.lower() not in [v.lower() for v in valid_values]:
                    results.append(self.create_result(
                        rule_id="di_008",
                        rule_name=self.integrity_rules["di_008"],
                        category=ValidationCategory.DATA_INTEGRITY,
                        severity=ValidationSeverity.ERROR,
                        message=f"Invalid value '{value}' for field '{field}'",
                        field_path=field,
                        value=value,
                        expected_value=f"One of: {', '.join(valid_values)}",
                        suggestions=[f"Use one of the valid values: {', '.join(valid_values)}"]
                    ))
        
        # Check nested enumerations
        if "condition" in data and isinstance(data["condition"], dict):
            condition = data["condition"]
            if "comparator" in condition:
                comparator = condition["comparator"]
                valid_comparators = self.valid_enums["comparator"]
                if comparator not in valid_comparators:
                    results.append(self.create_result(
                        rule_id="di_008",
                        rule_name=self.integrity_rules["di_008"],
                        category=ValidationCategory.DATA_INTEGRITY,
                        severity=ValidationSeverity.ERROR,
                        message=f"Invalid comparator '{comparator}'",
                        field_path="condition.comparator",
                        value=comparator,
                        expected_value=f"One of: {', '.join(valid_comparators)}",
                        suggestions=[f"Use valid comparator: {', '.join(valid_comparators)}"]
                    ))
        
        return results
    
    def _validate_cross_fields(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate cross-field dependencies and constraints."""
        results = []
        
        if not self.is_rule_enabled("di_009"):
            return results
        
        # Page range validation
        if "firstPage" in data and "lastPage" in data:
            try:
                first_page = int(data["firstPage"])
                last_page = int(data["lastPage"])
                
                if first_page > last_page:
                    results.append(self.create_result(
                        rule_id="di_009",
                        rule_name=self.integrity_rules["di_009"],
                        category=ValidationCategory.DATA_INTEGRITY,
                        severity=ValidationSeverity.ERROR,
                        message="First page cannot be greater than last page",
                        field_path="firstPage",
                        value=first_page,
                        expected_value=f"<= {last_page}",
                        suggestions=["Ensure firstPage <= lastPage"]
                    ))
            except (ValueError, TypeError):
                pass  # Type validation handled elsewhere
        
        # Where clause mutual exclusivity
        if context.object_type == "where_clause":
            has_condition = "condition" in data
            has_compound = "compoundExpression" in data
            
            if has_condition and has_compound:
                results.append(self.create_result(
                    rule_id="di_009",
                    rule_name=self.integrity_rules["di_009"],
                    category=ValidationCategory.DATA_INTEGRITY,
                    severity=ValidationSeverity.ERROR,
                    message="Where clause cannot have both condition and compoundExpression",
                    suggestions=["Use either condition or compoundExpression, not both"]
                ))
            elif not has_condition and not has_compound:
                results.append(self.create_result(
                    rule_id="di_009",
                    rule_name=self.integrity_rules["di_009"],
                    category=ValidationCategory.DATA_INTEGRITY,
                    severity=ValidationSeverity.ERROR,
                    message="Where clause must have either condition or compoundExpression",
                    suggestions=["Add either condition or compoundExpression"]
                ))
        
        return results
    
    def _validate_hierarchical_consistency(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate hierarchical data consistency."""
        results = []
        
        if not self.is_rule_enabled("di_010"):
            return results
        
        # Validate display section hierarchy
        if "listOfContents" in data and isinstance(data["listOfContents"], dict):
            loc = data["listOfContents"]
            if "contentsList" in loc:
                results.extend(self._validate_contents_hierarchy(loc["contentsList"], "listOfContents.contentsList"))
        
        # Validate nested lists
        if context.object_type == "nested_list" and "listItems" in data:
            results.extend(self._validate_list_hierarchy(data["listItems"], "listItems", 0))
        
        return results
    
    def _validate_contents_hierarchy(self, contents: List[Dict], path: str) -> List[ValidationResult]:
        """Validate contents list hierarchy."""
        results = []
        
        for i, content in enumerate(contents):
            if isinstance(content, dict):
                # Check order consistency
                if "order" in content:
                    try:
                        order = int(content["order"])
                        if order != i + 1:
                            results.append(self.create_result(
                                rule_id="di_010",
                                rule_name=self.integrity_rules["di_010"],
                                category=ValidationCategory.DATA_INTEGRITY,
                                severity=ValidationSeverity.WARNING,
                                message=f"Content order {order} doesn't match position {i + 1}",
                                field_path=f"{path}[{i}].order",
                                value=order,
                                expected_value=i + 1,
                                suggestions=["Ensure order values match list positions"]
                            ))
                    except (ValueError, TypeError):
                        pass
                
                # Recursively check sub-sections
                if "subSections" in content and isinstance(content["subSections"], list):
                    results.extend(self._validate_contents_hierarchy(
                        content["subSections"], f"{path}[{i}].subSections"
                    ))
        
        return results
    
    def _validate_list_hierarchy(self, items: List[Dict], path: str, depth: int) -> List[ValidationResult]:
        """Validate nested list hierarchy."""
        results = []
        
        max_depth = 5  # Reasonable maximum nesting depth
        
        if depth > max_depth:
            results.append(self.create_result(
                rule_id="di_010",
                rule_name=self.integrity_rules["di_010"],
                category=ValidationCategory.DATA_INTEGRITY,
                severity=ValidationSeverity.WARNING,
                message=f"List nesting depth {depth} exceeds recommended maximum {max_depth}",
                field_path=path,
                value=depth,
                expected_value=f"<= {max_depth}",
                suggestions=["Consider flattening deeply nested structures"]
            ))
        
        for i, item in enumerate(items):
            if isinstance(item, dict):
                # Check for circular references by tracking IDs
                if "id" in item:
                    # This would require maintaining state across validation calls
                    pass
                
                # Recursively check sub-items
                if "sublist" in item and isinstance(item["sublist"], dict):
                    sublist = item["sublist"]
                    if "listItems" in sublist:
                        results.extend(self._validate_list_hierarchy(
                            sublist["listItems"], f"{path}[{i}].sublist.listItems", depth + 1
                        ))
        
        return results