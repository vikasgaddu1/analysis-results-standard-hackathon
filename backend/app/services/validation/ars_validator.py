"""
ARS (Analysis Results Standard) compliance validator.
"""

from typing import Any, Dict, List, Optional
from .base_validator import (
    BaseValidator, ValidationResult, ValidationSeverity, 
    ValidationCategory, ValidationContext
)


class ARSValidator(BaseValidator):
    """Validator for ARS standard compliance."""
    
    def __init__(self):
        super().__init__("ARS Validator")
        self.ars_rules = {
            "ars_001": "Required ARS metadata fields",
            "ars_002": "Analysis ID format validation",
            "ars_003": "Output ID format validation", 
            "ars_004": "Method ID format validation",
            "ars_005": "Analysis set references",
            "ars_006": "Where clause structure",
            "ars_007": "Programming code template validation",
            "ars_008": "Display section hierarchy",
            "ars_009": "Reference document links",
            "ars_010": "Terminology consistency",
            "ars_011": "Analysis purpose validation",
            "ars_012": "Analysis reason validation",
            "ars_013": "Operation role validation",
            "ars_014": "Result group structure",
            "ars_015": "Output file specifications"
        }
    
    def get_supported_rules(self) -> List[str]:
        """Get list of supported ARS validation rules."""
        return list(self.ars_rules.keys())
    
    def validate(self, data: Any, context: ValidationContext) -> List[ValidationResult]:
        """Validate ARS compliance."""
        results = []
        
        if not isinstance(data, dict):
            results.append(self.create_result(
                rule_id="ars_000",
                rule_name="Data Format",
                category=ValidationCategory.STANDARDS_COMPLIANCE,
                severity=ValidationSeverity.CRITICAL,
                message="ARS data must be provided as a dictionary/object",
                value=type(data).__name__,
                expected_value="dict"
            ))
            return results
        
        # Validate based on object type
        if context.object_type == "reporting_event":
            results.extend(self._validate_reporting_event(data, context))
        elif context.object_type == "analysis":
            results.extend(self._validate_analysis(data, context))
        elif context.object_type == "method":
            results.extend(self._validate_method(data, context))
        elif context.object_type == "output":
            results.extend(self._validate_output(data, context))
        elif context.object_type == "where_clause":
            results.extend(self._validate_where_clause(data, context))
        
        return results
    
    def _validate_reporting_event(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate reporting event ARS compliance."""
        results = []
        
        # Rule ARS_001: Required metadata fields
        if self.is_rule_enabled("ars_001"):
            required_fields = ["id", "name", "version", "analyses"]
            for field in required_fields:
                result = self.validate_required_field(
                    data, field, "ars_001", self.ars_rules["ars_001"],
                    ValidationCategory.STANDARDS_COMPLIANCE
                )
                if result:
                    results.append(result)
        
        # Rule ARS_008: Display section hierarchy
        if self.is_rule_enabled("ars_008") and "listOfContents" in data:
            results.extend(self._validate_display_sections(data["listOfContents"]))
        
        # Rule ARS_009: Reference document links
        if self.is_rule_enabled("ars_009") and "referenceDocuments" in data:
            results.extend(self._validate_reference_documents(data["referenceDocuments"]))
        
        return results
    
    def _validate_analysis(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate analysis ARS compliance."""
        results = []
        
        # Rule ARS_002: Analysis ID format validation
        if self.is_rule_enabled("ars_002"):
            if "id" in data:
                if not self._is_valid_analysis_id(data["id"]):
                    results.append(self.create_result(
                        rule_id="ars_002",
                        rule_name=self.ars_rules["ars_002"],
                        category=ValidationCategory.STANDARDS_COMPLIANCE,
                        severity=ValidationSeverity.ERROR,
                        message="Analysis ID does not follow ARS naming conventions",
                        field_path="id",
                        value=data["id"],
                        suggestions=[
                            "Use format: AN_[study]_[sequence]_[description]",
                            "Example: AN_STUDY01_01_DEMOG"
                        ]
                    ))
        
        # Rule ARS_005: Analysis set references
        if self.is_rule_enabled("ars_005") and "analysisSetId" in data:
            results.extend(self._validate_analysis_set_reference(data["analysisSetId"]))
        
        # Rule ARS_011: Analysis purpose validation
        if self.is_rule_enabled("ars_011") and "purpose" in data:
            results.extend(self._validate_analysis_purpose(data["purpose"]))
        
        # Rule ARS_012: Analysis reason validation
        if self.is_rule_enabled("ars_012") and "reason" in data:
            results.extend(self._validate_analysis_reason(data["reason"]))
        
        return results
    
    def _validate_method(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate method ARS compliance."""
        results = []
        
        # Rule ARS_004: Method ID format validation
        if self.is_rule_enabled("ars_004"):
            if "id" in data:
                if not self._is_valid_method_id(data["id"]):
                    results.append(self.create_result(
                        rule_id="ars_004",
                        rule_name=self.ars_rules["ars_004"],
                        category=ValidationCategory.STANDARDS_COMPLIANCE,
                        severity=ValidationSeverity.ERROR,
                        message="Method ID does not follow ARS naming conventions",
                        field_path="id",
                        value=data["id"],
                        suggestions=[
                            "Use format: MT_[study]_[sequence]_[description]",
                            "Example: MT_STUDY01_01_DESCRIPTIVE"
                        ]
                    ))
        
        # Rule ARS_007: Programming code template validation
        if self.is_rule_enabled("ars_007") and "operations" in data:
            for i, operation in enumerate(data["operations"]):
                if "programmingCode" in operation:
                    results.extend(self._validate_programming_code(
                        operation["programmingCode"], f"operations[{i}].programmingCode"
                    ))
        
        return results
    
    def _validate_output(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate output ARS compliance."""
        results = []
        
        # Rule ARS_003: Output ID format validation
        if self.is_rule_enabled("ars_003"):
            if "id" in data:
                if not self._is_valid_output_id(data["id"]):
                    results.append(self.create_result(
                        rule_id="ars_003",
                        rule_name=self.ars_rules["ars_003"],
                        category=ValidationCategory.STANDARDS_COMPLIANCE,
                        severity=ValidationSeverity.ERROR,
                        message="Output ID does not follow ARS naming conventions",
                        field_path="id",
                        value=data["id"],
                        suggestions=[
                            "Use format: OUT_[study]_[sequence]_[description]",
                            "Example: OUT_STUDY01_01_DEMO_TABLE"
                        ]
                    ))
        
        # Rule ARS_015: Output file specifications
        if self.is_rule_enabled("ars_015") and "fileSpecifications" in data:
            results.extend(self._validate_file_specifications(data["fileSpecifications"]))
        
        # Rule ARS_014: Result group structure
        if self.is_rule_enabled("ars_014") and "resultGroups" in data:
            results.extend(self._validate_result_groups(data["resultGroups"]))
        
        return results
    
    def _validate_where_clause(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate where clause ARS compliance."""
        results = []
        
        # Rule ARS_006: Where clause structure
        if self.is_rule_enabled("ars_006"):
            results.extend(self._validate_where_clause_structure(data))
        
        return results
    
    def _is_valid_analysis_id(self, analysis_id: str) -> bool:
        """Check if analysis ID follows ARS conventions."""
        if not isinstance(analysis_id, str):
            return False
        
        # ARS convention: AN_[study]_[sequence]_[description]
        parts = analysis_id.split("_")
        return len(parts) >= 4 and parts[0] == "AN"
    
    def _is_valid_method_id(self, method_id: str) -> bool:
        """Check if method ID follows ARS conventions."""
        if not isinstance(method_id, str):
            return False
        
        # ARS convention: MT_[study]_[sequence]_[description]
        parts = method_id.split("_")
        return len(parts) >= 4 and parts[0] == "MT"
    
    def _is_valid_output_id(self, output_id: str) -> bool:
        """Check if output ID follows ARS conventions."""
        if not isinstance(output_id, str):
            return False
        
        # ARS convention: OUT_[study]_[sequence]_[description]
        parts = output_id.split("_")
        return len(parts) >= 4 and parts[0] == "OUT"
    
    def _validate_analysis_set_reference(self, analysis_set_id: str) -> List[ValidationResult]:
        """Validate analysis set reference format."""
        results = []
        
        if not isinstance(analysis_set_id, str) or not analysis_set_id.strip():
            results.append(self.create_result(
                rule_id="ars_005",
                rule_name=self.ars_rules["ars_005"],
                category=ValidationCategory.STANDARDS_COMPLIANCE,
                severity=ValidationSeverity.ERROR,
                message="Analysis set ID must be a non-empty string",
                field_path="analysisSetId",
                value=analysis_set_id,
                suggestions=["Provide a valid analysis set identifier"]
            ))
        
        return results
    
    def _validate_analysis_purpose(self, purpose: Any) -> List[ValidationResult]:
        """Validate analysis purpose structure."""
        results = []
        
        valid_purposes = [
            "PRIMARY_EFFICACY", "SECONDARY_EFFICACY", "SAFETY", "EXPLORATORY",
            "PHARMACOKINETIC", "PHARMACODYNAMIC", "BIOMARKER", "OTHER"
        ]
        
        if isinstance(purpose, str):
            if purpose not in valid_purposes:
                results.append(self.create_result(
                    rule_id="ars_011",
                    rule_name=self.ars_rules["ars_011"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.WARNING,
                    message=f"Analysis purpose '{purpose}' is not a standard ARS value",
                    field_path="purpose",
                    value=purpose,
                    expected_value=f"One of: {', '.join(valid_purposes)}",
                    suggestions=["Use a standard ARS analysis purpose or document custom purpose"]
                ))
        elif isinstance(purpose, dict):
            # Custom purpose object
            if "controlledTerm" not in purpose and "sponsorTerm" not in purpose:
                results.append(self.create_result(
                    rule_id="ars_011",
                    rule_name=self.ars_rules["ars_011"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message="Custom analysis purpose must specify either controlledTerm or sponsorTerm",
                    field_path="purpose",
                    value=str(purpose),
                    suggestions=["Add controlledTerm or sponsorTerm to purpose object"]
                ))
        
        return results
    
    def _validate_analysis_reason(self, reason: Any) -> List[ValidationResult]:
        """Validate analysis reason structure."""
        results = []
        
        valid_reasons = [
            "REGULATORY_REQUIREMENT", "PROTOCOL_SPECIFIED", "SPONSOR_INTEREST",
            "INVESTIGATOR_REQUEST", "SAFETY_MONITORING", "OTHER"
        ]
        
        if isinstance(reason, str):
            if reason not in valid_reasons:
                results.append(self.create_result(
                    rule_id="ars_012",
                    rule_name=self.ars_rules["ars_012"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.WARNING,
                    message=f"Analysis reason '{reason}' is not a standard ARS value",
                    field_path="reason",
                    value=reason,
                    expected_value=f"One of: {', '.join(valid_reasons)}",
                    suggestions=["Use a standard ARS analysis reason or document custom reason"]
                ))
        
        return results
    
    def _validate_programming_code(self, prog_code: Dict[str, Any], field_path: str) -> List[ValidationResult]:
        """Validate programming code structure."""
        results = []
        
        required_fields = ["context", "code"]
        for field in required_fields:
            if field not in prog_code:
                results.append(self.create_result(
                    rule_id="ars_007",
                    rule_name=self.ars_rules["ars_007"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message=f"Programming code missing required field '{field}'",
                    field_path=f"{field_path}.{field}",
                    suggestions=[f"Add {field} to programming code specification"]
                ))
        
        # Validate context values
        if "context" in prog_code:
            valid_contexts = ["SAS", "R", "Python", "SQL", "Other"]
            if prog_code["context"] not in valid_contexts:
                results.append(self.create_result(
                    rule_id="ars_007",
                    rule_name=self.ars_rules["ars_007"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.WARNING,
                    message=f"Programming context '{prog_code['context']}' is not standard",
                    field_path=f"{field_path}.context",
                    value=prog_code["context"],
                    expected_value=f"One of: {', '.join(valid_contexts)}",
                    suggestions=["Use a standard programming context"]
                ))
        
        return results
    
    def _validate_display_sections(self, list_of_contents: Dict[str, Any]) -> List[ValidationResult]:
        """Validate display section hierarchy."""
        results = []
        
        if "contentsList" in list_of_contents:
            for i, content in enumerate(list_of_contents["contentsList"]):
                if "subSections" in content:
                    # Check for circular references and depth limits
                    results.extend(self._check_section_depth(content["subSections"], f"contentsList[{i}]", 0))
        
        return results
    
    def _check_section_depth(self, sections: List[Dict], path: str, depth: int) -> List[ValidationResult]:
        """Check section hierarchy depth and structure."""
        results = []
        max_depth = 5  # ARS recommendation
        
        if depth > max_depth:
            results.append(self.create_result(
                rule_id="ars_008",
                rule_name=self.ars_rules["ars_008"],
                category=ValidationCategory.STANDARDS_COMPLIANCE,
                severity=ValidationSeverity.WARNING,
                message=f"Display section hierarchy exceeds recommended depth of {max_depth}",
                field_path=path,
                value=depth,
                expected_value=f"<= {max_depth}",
                suggestions=["Consider flattening the section hierarchy"]
            ))
        
        for i, section in enumerate(sections):
            if "subSections" in section:
                results.extend(self._check_section_depth(
                    section["subSections"], f"{path}.subSections[{i}]", depth + 1
                ))
        
        return results
    
    def _validate_reference_documents(self, ref_docs: List[Dict[str, Any]]) -> List[ValidationResult]:
        """Validate reference document structure."""
        results = []
        
        for i, doc in enumerate(ref_docs):
            if "id" not in doc:
                results.append(self.create_result(
                    rule_id="ars_009",
                    rule_name=self.ars_rules["ars_009"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message="Reference document missing required ID",
                    field_path=f"referenceDocuments[{i}].id",
                    suggestions=["Add unique identifier to reference document"]
                ))
            
            if "location" not in doc:
                results.append(self.create_result(
                    rule_id="ars_009",
                    rule_name=self.ars_rules["ars_009"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.WARNING,
                    message="Reference document missing location information",
                    field_path=f"referenceDocuments[{i}].location",
                    suggestions=["Add location/URL to reference document"]
                ))
        
        return results
    
    def _validate_file_specifications(self, file_specs: List[Dict[str, Any]]) -> List[ValidationResult]:
        """Validate output file specifications."""
        results = []
        
        for i, spec in enumerate(file_specs):
            required_fields = ["name", "fileType"]
            for field in required_fields:
                if field not in spec:
                    results.append(self.create_result(
                        rule_id="ars_015",
                        rule_name=self.ars_rules["ars_015"],
                        category=ValidationCategory.STANDARDS_COMPLIANCE,
                        severity=ValidationSeverity.ERROR,
                        message=f"File specification missing required field '{field}'",
                        field_path=f"fileSpecifications[{i}].{field}",
                        suggestions=[f"Add {field} to file specification"]
                    ))
        
        return results
    
    def _validate_result_groups(self, result_groups: List[Dict[str, Any]]) -> List[ValidationResult]:
        """Validate result group structure."""
        results = []
        
        for i, group in enumerate(result_groups):
            if "groupingId" not in group:
                results.append(self.create_result(
                    rule_id="ars_014",
                    rule_name=self.ars_rules["ars_014"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message="Result group missing grouping ID",
                    field_path=f"resultGroups[{i}].groupingId",
                    suggestions=["Add groupingId to result group"]
                ))
        
        return results
    
    def _validate_where_clause_structure(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate where clause structure according to ARS standards."""
        results = []
        
        # Must have either condition or compoundExpression, but not both
        has_condition = "condition" in data
        has_compound = "compoundExpression" in data
        
        if not has_condition and not has_compound:
            results.append(self.create_result(
                rule_id="ars_006",
                rule_name=self.ars_rules["ars_006"],
                category=ValidationCategory.STANDARDS_COMPLIANCE,
                severity=ValidationSeverity.ERROR,
                message="Where clause must specify either condition or compoundExpression",
                suggestions=[
                    "Add a condition for simple criteria",
                    "Add a compoundExpression for complex logic"
                ]
            ))
        elif has_condition and has_compound:
            results.append(self.create_result(
                rule_id="ars_006",
                rule_name=self.ars_rules["ars_006"],
                category=ValidationCategory.STANDARDS_COMPLIANCE,
                severity=ValidationSeverity.ERROR,
                message="Where clause cannot have both condition and compoundExpression",
                suggestions=["Use either condition or compoundExpression, not both"]
            ))
        
        # Validate condition structure
        if has_condition:
            condition = data["condition"]
            required_fields = ["dataset", "variable", "comparator"]
            for field in required_fields:
                if field not in condition:
                    results.append(self.create_result(
                        rule_id="ars_006",
                        rule_name=self.ars_rules["ars_006"],
                        category=ValidationCategory.STANDARDS_COMPLIANCE,
                        severity=ValidationSeverity.ERROR,
                        message=f"Where clause condition missing required field '{field}'",
                        field_path=f"condition.{field}",
                        suggestions=[f"Add {field} to where clause condition"]
                    ))
        
        # Validate compound expression structure
        if has_compound:
            compound = data["compoundExpression"]
            if "logicalOperator" not in compound:
                results.append(self.create_result(
                    rule_id="ars_006",
                    rule_name=self.ars_rules["ars_006"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message="Compound expression missing logical operator",
                    field_path="compoundExpression.logicalOperator",
                    suggestions=["Add logicalOperator (AND, OR, NOT) to compound expression"]
                ))
            
            if "whereClauses" not in compound or not compound["whereClauses"]:
                results.append(self.create_result(
                    rule_id="ars_006",
                    rule_name=self.ars_rules["ars_006"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message="Compound expression must contain where clauses",
                    field_path="compoundExpression.whereClauses",
                    suggestions=["Add nested where clauses to compound expression"]
                ))
        
        return results