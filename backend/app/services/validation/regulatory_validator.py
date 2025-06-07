"""
Regulatory compliance validator for FDA/EMA/ICH guidelines.
"""

from typing import Any, Dict, List, Optional, Set
from datetime import datetime, date
import re
from .base_validator import (
    BaseValidator, ValidationResult, ValidationSeverity, 
    ValidationCategory, ValidationContext
)


class RegulatoryValidator(BaseValidator):
    """Validator for regulatory compliance (FDA/EMA/ICH)."""
    
    def __init__(self):
        super().__init__("Regulatory Validator")
        self.regulatory_rules = {
            "reg_001": "FDA 21 CFR Part 11 compliance",
            "reg_002": "ICH E9 statistical principles compliance",
            "reg_003": "ICH E6 GCP compliance requirements",
            "reg_004": "EMA guideline compliance",
            "reg_005": "Audit trail requirements",
            "reg_006": "Electronic signature validation",
            "reg_007": "Data integrity requirements",
            "reg_008": "Study protocol compliance",
            "reg_009": "SAP (Statistical Analysis Plan) compliance",
            "reg_010": "Primary endpoint validation",
            "reg_011": "Secondary endpoint validation",
            "reg_012": "Safety analysis requirements",
            "reg_013": "Missing data handling validation",
            "reg_014": "Multiplicity adjustment requirements",
            "reg_015": "Interim analysis guidelines",
            "reg_016": "Sensitivity analysis requirements",
            "reg_017": "Population definition validation",
            "reg_018": "Estimand framework compliance",
            "reg_019": "Documentation completeness",
            "reg_020": "Traceability requirements"
        }
        
        # Regulatory-required analysis types
        self.required_safety_analyses = {
            "adverse_events_summary",
            "serious_adverse_events",
            "deaths",
            "discontinuations_due_to_ae",
            "laboratory_abnormalities",
            "vital_signs_summary"
        }
        
        self.required_efficacy_analyses = {
            "primary_endpoint",
            "secondary_endpoints",
            "population_demographics",
            "disposition_summary"
        }
        
        # ICH E9 statistical method validations
        self.ich_e9_methods = {
            "descriptive_statistics": "Standard descriptive analysis",
            "t_test": "Two-sample t-test",
            "chi_square": "Chi-square test",
            "anova": "Analysis of variance",
            "ancova": "Analysis of covariance",
            "logistic_regression": "Logistic regression",
            "survival_analysis": "Time-to-event analysis",
            "mixed_model": "Mixed-effects model"
        }
    
    def get_supported_rules(self) -> List[str]:
        """Get list of supported regulatory validation rules."""
        return list(self.regulatory_rules.keys())
    
    def validate(self, data: Any, context: ValidationContext) -> List[ValidationResult]:
        """Validate regulatory compliance."""
        results = []
        
        if not isinstance(data, dict):
            results.append(self.create_result(
                rule_id="reg_000",
                rule_name="Data Format",
                category=ValidationCategory.REGULATORY_COMPLIANCE,
                severity=ValidationSeverity.CRITICAL,
                message="Regulatory data must be provided as a dictionary/object",
                value=type(data).__name__,
                expected_value="dict"
            ))
            return results
        
        # Validate based on object type
        if context.object_type == "reporting_event":
            results.extend(self._validate_reporting_event_regulatory(data, context))
        elif context.object_type == "analysis":
            results.extend(self._validate_analysis_regulatory(data, context))
        elif context.object_type == "method":
            results.extend(self._validate_method_regulatory(data, context))
        elif context.object_type == "study":
            results.extend(self._validate_study_regulatory(data, context))
        
        return results
    
    def _validate_reporting_event_regulatory(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate reporting event for regulatory compliance."""
        results = []
        
        # Rule REG_019: Documentation completeness
        if self.is_rule_enabled("reg_019"):
            results.extend(self._validate_documentation_completeness(data))
        
        # Rule REG_005: Audit trail requirements
        if self.is_rule_enabled("reg_005"):
            results.extend(self._validate_audit_trail(data))
        
        # Rule REG_008: Study protocol compliance
        if self.is_rule_enabled("reg_008"):
            results.extend(self._validate_protocol_compliance(data))
        
        # Rule REG_012: Safety analysis requirements
        if self.is_rule_enabled("reg_012"):
            results.extend(self._validate_safety_analysis_requirements(data))
        
        # Rule REG_020: Traceability requirements
        if self.is_rule_enabled("reg_020"):
            results.extend(self._validate_traceability(data))
        
        return results
    
    def _validate_analysis_regulatory(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate analysis for regulatory compliance."""
        results = []
        
        # Rule REG_002: ICH E9 statistical principles compliance
        if self.is_rule_enabled("reg_002"):
            results.extend(self._validate_ich_e9_compliance(data))
        
        # Rule REG_010: Primary endpoint validation
        if self.is_rule_enabled("reg_010"):
            results.extend(self._validate_primary_endpoint(data))
        
        # Rule REG_011: Secondary endpoint validation
        if self.is_rule_enabled("reg_011"):
            results.extend(self._validate_secondary_endpoint(data))
        
        # Rule REG_013: Missing data handling validation
        if self.is_rule_enabled("reg_013"):
            results.extend(self._validate_missing_data_handling(data))
        
        # Rule REG_017: Population definition validation
        if self.is_rule_enabled("reg_017"):
            results.extend(self._validate_population_definition(data))
        
        # Rule REG_018: Estimand framework compliance
        if self.is_rule_enabled("reg_018"):
            results.extend(self._validate_estimand_framework(data))
        
        return results
    
    def _validate_method_regulatory(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate method for regulatory compliance."""
        results = []
        
        # Rule REG_014: Multiplicity adjustment requirements
        if self.is_rule_enabled("reg_014"):
            results.extend(self._validate_multiplicity_adjustment(data))
        
        # Rule REG_016: Sensitivity analysis requirements
        if self.is_rule_enabled("reg_016"):
            results.extend(self._validate_sensitivity_analysis(data))
        
        return results
    
    def _validate_study_regulatory(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate study for regulatory compliance."""
        results = []
        
        # Rule REG_003: ICH E6 GCP compliance requirements
        if self.is_rule_enabled("reg_003"):
            results.extend(self._validate_gcp_compliance(data))
        
        return results
    
    def _validate_documentation_completeness(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate documentation completeness for regulatory requirements."""
        results = []
        
        # Required documentation elements
        required_docs = {
            "protocol": "Study protocol reference",
            "sap": "Statistical Analysis Plan",
            "define": "Define-XML or data definition document"
        }
        
        reference_docs = data.get("referenceDocuments", [])
        doc_types = {doc.get("type", "").lower() for doc in reference_docs if isinstance(doc, dict)}
        
        for doc_type, description in required_docs.items():
            if doc_type not in doc_types:
                results.append(self.create_result(
                    rule_id="reg_019",
                    rule_name=self.regulatory_rules["reg_019"],
                    category=ValidationCategory.REGULATORY_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message=f"Missing required documentation: {description}",
                    field_path="referenceDocuments",
                    expected_value=doc_type,
                    suggestions=[f"Add reference to {description}"]
                ))
        
        # Check for version information in documents
        for i, doc in enumerate(reference_docs):
            if isinstance(doc, dict):
                if "version" not in doc:
                    results.append(self.create_result(
                        rule_id="reg_019",
                        rule_name=self.regulatory_rules["reg_019"],
                        category=ValidationCategory.REGULATORY_COMPLIANCE,
                        severity=ValidationSeverity.WARNING,
                        message="Reference document missing version information",
                        field_path=f"referenceDocuments[{i}].version",
                        suggestions=["Add version information to reference documents"]
                    ))
        
        return results
    
    def _validate_audit_trail(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate audit trail requirements."""
        results = []
        
        # Check for required audit fields
        audit_fields = ["created", "createdBy", "modified", "modifiedBy"]
        
        for field in audit_fields:
            if field not in data:
                results.append(self.create_result(
                    rule_id="reg_005",
                    rule_name=self.regulatory_rules["reg_005"],
                    category=ValidationCategory.REGULATORY_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message=f"Missing audit trail field: {field}",
                    field_path=field,
                    suggestions=[f"Add {field} for audit trail compliance"]
                ))
        
        # Validate timestamp formats
        for field in ["created", "modified"]:
            if field in data:
                if not self._is_valid_iso_timestamp(data[field]):
                    results.append(self.create_result(
                        rule_id="reg_005",
                        rule_name=self.regulatory_rules["reg_005"],
                        category=ValidationCategory.REGULATORY_COMPLIANCE,
                        severity=ValidationSeverity.ERROR,
                        message=f"Invalid timestamp format in {field}",
                        field_path=field,
                        value=data[field],
                        expected_value="ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)",
                        suggestions=["Use ISO 8601 timestamp format"]
                    ))
        
        return results
    
    def _validate_protocol_compliance(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate study protocol compliance."""
        results = []
        
        # Check for protocol reference
        if "referenceDocuments" in data:
            has_protocol = any(
                doc.get("type", "").lower() == "protocol" 
                for doc in data["referenceDocuments"] 
                if isinstance(doc, dict)
            )
            
            if not has_protocol:
                results.append(self.create_result(
                    rule_id="reg_008",
                    rule_name=self.regulatory_rules["reg_008"],
                    category=ValidationCategory.REGULATORY_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message="Missing reference to study protocol",
                    field_path="referenceDocuments",
                    suggestions=["Add reference to study protocol document"]
                ))
        
        # Validate analysis alignment with protocol
        if "analyses" in data:
            for i, analysis in enumerate(data["analyses"]):
                if isinstance(analysis, dict):
                    # Check if analysis purpose is documented
                    if "purpose" not in analysis:
                        results.append(self.create_result(
                            rule_id="reg_008",
                            rule_name=self.regulatory_rules["reg_008"],
                            category=ValidationCategory.REGULATORY_COMPLIANCE,
                            severity=ValidationSeverity.WARNING,
                            message=f"Analysis {analysis.get('id', i)} missing purpose documentation",
                            field_path=f"analyses[{i}].purpose",
                            suggestions=["Document analysis purpose for protocol compliance"]
                        ))
        
        return results
    
    def _validate_safety_analysis_requirements(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate safety analysis requirements."""
        results = []
        
        if "analyses" in data:
            analysis_purposes = set()
            for analysis in data["analyses"]:
                if isinstance(analysis, dict):
                    purpose = analysis.get("purpose", "")
                    if isinstance(purpose, str):
                        analysis_purposes.add(purpose.lower())
                    elif isinstance(purpose, dict):
                        # Handle controlled terminology
                        term = purpose.get("controlledTerm", "")
                        analysis_purposes.add(term.lower())
            
            # Check for required safety analyses
            safety_found = any("safety" in purpose for purpose in analysis_purposes)
            ae_found = any("adverse" in purpose or "ae" in purpose for purpose in analysis_purposes)
            
            if not safety_found:
                results.append(self.create_result(
                    rule_id="reg_012",
                    rule_name=self.regulatory_rules["reg_012"],
                    category=ValidationCategory.REGULATORY_COMPLIANCE,
                    severity=ValidationSeverity.WARNING,
                    message="No safety analyses identified",
                    field_path="analyses",
                    suggestions=["Include safety analyses as required by regulations"]
                ))
            
            if not ae_found:
                results.append(self.create_result(
                    rule_id="reg_012",
                    rule_name=self.regulatory_rules["reg_012"],
                    category=ValidationCategory.REGULATORY_COMPLIANCE,
                    severity=ValidationSeverity.WARNING,
                    message="No adverse event analyses identified",
                    field_path="analyses",
                    suggestions=["Include adverse event analyses for safety reporting"]
                ))
        
        return results
    
    def _validate_traceability(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate traceability requirements."""
        results = []
        
        # Check for unique identifiers
        if "id" not in data:
            results.append(self.create_result(
                rule_id="reg_020",
                rule_name=self.regulatory_rules["reg_020"],
                category=ValidationCategory.REGULATORY_COMPLIANCE,
                severity=ValidationSeverity.ERROR,
                message="Missing unique identifier for traceability",
                field_path="id",
                suggestions=["Add unique identifier for regulatory traceability"]
            ))
        
        # Check for version tracking
        if "version" not in data:
            results.append(self.create_result(
                rule_id="reg_020",
                rule_name=self.regulatory_rules["reg_020"],
                category=ValidationCategory.REGULATORY_COMPLIANCE,
                severity=ValidationSeverity.WARNING,
                message="Missing version information for traceability",
                field_path="version",
                suggestions=["Add version information for change tracking"]
            ))
        
        # Validate cross-references
        if "analyses" in data:
            for i, analysis in enumerate(data["analyses"]):
                if isinstance(analysis, dict):
                    if "methodId" in analysis:
                        # Check if method reference is valid
                        method_id = analysis["methodId"]
                        if not isinstance(method_id, str) or not method_id.strip():
                            results.append(self.create_result(
                                rule_id="reg_020",
                                rule_name=self.regulatory_rules["reg_020"],
                                category=ValidationCategory.REGULATORY_COMPLIANCE,
                                severity=ValidationSeverity.ERROR,
                                message=f"Invalid method reference in analysis {analysis.get('id', i)}",
                                field_path=f"analyses[{i}].methodId",
                                value=method_id,
                                suggestions=["Provide valid method identifier for traceability"]
                            ))
        
        return results
    
    def _validate_ich_e9_compliance(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate ICH E9 statistical principles compliance."""
        results = []
        
        # Check for statistical method documentation
        if "methodId" in data:
            # Validate that statistical method is appropriate
            method_id = data["methodId"]
            if not method_id:
                results.append(self.create_result(
                    rule_id="reg_002",
                    rule_name=self.regulatory_rules["reg_002"],
                    category=ValidationCategory.REGULATORY_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message="Analysis missing statistical method specification",
                    field_path="methodId",
                    suggestions=["Specify statistical method per ICH E9 guidelines"]
                ))
        
        # Check for appropriate population specification
        if "analysisSetId" in data:
            analysis_set = data["analysisSetId"]
            valid_sets = ["ITT", "PP", "FAS", "SAF", "mITT"]
            
            # Extract analysis set type from ID
            set_type_found = any(valid_set in analysis_set.upper() for valid_set in valid_sets)
            
            if not set_type_found:
                results.append(self.create_result(
                    rule_id="reg_002",
                    rule_name=self.regulatory_rules["reg_002"],
                    category=ValidationCategory.REGULATORY_COMPLIANCE,
                    severity=ValidationSeverity.WARNING,
                    message="Analysis set type not clearly identified",
                    field_path="analysisSetId",
                    value=analysis_set,
                    expected_value=f"Should reference one of: {', '.join(valid_sets)}",
                    suggestions=["Clearly specify analysis population per ICH E9"]
                ))
        
        return results
    
    def _validate_primary_endpoint(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate primary endpoint analysis."""
        results = []
        
        purpose = data.get("purpose", "")
        if isinstance(purpose, str) and "primary" in purpose.lower():
            # Primary endpoint specific validations
            
            # Must have pre-specified analysis method
            if "methodId" not in data:
                results.append(self.create_result(
                    rule_id="reg_010",
                    rule_name=self.regulatory_rules["reg_010"],
                    category=ValidationCategory.REGULATORY_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message="Primary endpoint analysis missing statistical method",
                    field_path="methodId",
                    suggestions=["Specify pre-planned statistical method for primary endpoint"]
                ))
            
            # Should use ITT population
            analysis_set = data.get("analysisSetId", "").upper()
            if "ITT" not in analysis_set and "FAS" not in analysis_set:
                results.append(self.create_result(
                    rule_id="reg_010",
                    rule_name=self.regulatory_rules["reg_010"],
                    category=ValidationCategory.REGULATORY_COMPLIANCE,
                    severity=ValidationSeverity.WARNING,
                    message="Primary endpoint should typically use ITT/FAS population",
                    field_path="analysisSetId",
                    value=analysis_set,
                    suggestions=["Consider using Intent-to-Treat population for primary endpoint"]
                ))
        
        return results
    
    def _validate_secondary_endpoint(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate secondary endpoint analysis."""
        results = []
        
        purpose = data.get("purpose", "")
        if isinstance(purpose, str) and "secondary" in purpose.lower():
            # Secondary endpoint validations
            
            # Check for multiplicity considerations
            # This would typically be validated at the study level
            if "reason" in data:
                reason = data["reason"]
                if "multiplicity" not in str(reason).lower():
                    results.append(self.create_result(
                        rule_id="reg_011",
                        rule_name=self.regulatory_rules["reg_011"],
                        category=ValidationCategory.REGULATORY_COMPLIANCE,
                        severity=ValidationSeverity.INFO,
                        message="Consider multiplicity adjustment for secondary endpoints",
                        field_path="reason",
                        suggestions=["Document multiplicity considerations for secondary endpoints"]
                    ))
        
        return results
    
    def _validate_missing_data_handling(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate missing data handling strategy."""
        results = []
        
        # Check if missing data strategy is documented
        methods = data.get("methods", [])
        operations = []
        
        for method in methods:
            if isinstance(method, dict) and "operations" in method:
                operations.extend(method["operations"])
        
        missing_data_documented = any(
            "missing" in str(op).lower() or "imputation" in str(op).lower()
            for op in operations
        )
        
        if not missing_data_documented:
            results.append(self.create_result(
                rule_id="reg_013",
                rule_name=self.regulatory_rules["reg_013"],
                category=ValidationCategory.REGULATORY_COMPLIANCE,
                severity=ValidationSeverity.WARNING,
                message="Missing data handling strategy not documented",
                field_path="methods",
                suggestions=[
                    "Document missing data handling approach",
                    "Consider sensitivity analyses for missing data assumptions"
                ]
            ))
        
        return results
    
    def _validate_population_definition(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate population definition clarity."""
        results = []
        
        if "analysisSetId" in data:
            analysis_set = data["analysisSetId"]
            
            # Population should be clearly defined
            if len(analysis_set) < 3:
                results.append(self.create_result(
                    rule_id="reg_017",
                    rule_name=self.regulatory_rules["reg_017"],
                    category=ValidationCategory.REGULATORY_COMPLIANCE,
                    severity=ValidationSeverity.WARNING,
                    message="Analysis population definition is unclear",
                    field_path="analysisSetId",
                    value=analysis_set,
                    suggestions=["Provide clear, descriptive analysis population identifier"]
                ))
        else:
            results.append(self.create_result(
                rule_id="reg_017",
                rule_name=self.regulatory_rules["reg_017"],
                category=ValidationCategory.REGULATORY_COMPLIANCE,
                severity=ValidationSeverity.ERROR,
                message="Analysis population not specified",
                field_path="analysisSetId",
                suggestions=["Specify target population for analysis"]
            ))
        
        return results
    
    def _validate_estimand_framework(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate estimand framework compliance (ICH E9 R1)."""
        results = []
        
        # Check for estimand components documentation
        estimand_components = ["population", "variable", "intercurrent_events", "summary_measure"]
        
        # This is a high-level check - detailed estimand validation would require more context
        purpose = data.get("purpose", "")
        if isinstance(purpose, str) and any(term in purpose.lower() for term in ["efficacy", "primary", "secondary"]):
            # For efficacy analyses, consider estimand framework
            if "description" not in data:
                results.append(self.create_result(
                    rule_id="reg_018",
                    rule_name=self.regulatory_rules["reg_018"],
                    category=ValidationCategory.REGULATORY_COMPLIANCE,
                    severity=ValidationSeverity.INFO,
                    message="Consider documenting estimand components for efficacy analysis",
                    field_path="description",
                    suggestions=[
                        "Document target population",
                        "Specify treatment strategy",
                        "Define intercurrent event handling",
                        "Clarify summary measure"
                    ]
                ))
        
        return results
    
    def _validate_multiplicity_adjustment(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate multiplicity adjustment considerations."""
        results = []
        
        # Check if multiple comparisons are being made
        operations = data.get("operations", [])
        
        comparison_operations = [
            op for op in operations 
            if isinstance(op, dict) and any(
                term in str(op).lower() 
                for term in ["test", "comparison", "pvalue", "p-value"]
            )
        ]
        
        if len(comparison_operations) > 1:
            # Multiple comparisons detected
            multiplicity_addressed = any(
                term in str(op).lower() 
                for op in operations 
                for term in ["bonferroni", "holm", "hochberg", "benjamini", "fdr", "multiplicity"]
            )
            
            if not multiplicity_addressed:
                results.append(self.create_result(
                    rule_id="reg_014",
                    rule_name=self.regulatory_rules["reg_014"],
                    category=ValidationCategory.REGULATORY_COMPLIANCE,
                    severity=ValidationSeverity.WARNING,
                    message="Multiple comparisons detected without multiplicity adjustment",
                    field_path="operations",
                    suggestions=[
                        "Consider multiplicity adjustment methods",
                        "Document multiple comparison strategy",
                        "Use appropriate correction methods (Bonferroni, Holm, etc.)"
                    ]
                ))
        
        return results
    
    def _validate_sensitivity_analysis(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate sensitivity analysis requirements."""
        results = []
        
        # Check if this is marked as a sensitivity analysis
        name = data.get("name", "").lower()
        description = data.get("description", "").lower()
        
        is_sensitivity = any(
            term in text 
            for text in [name, description] 
            for term in ["sensitivity", "robustness", "alternative"]
        )
        
        if is_sensitivity:
            # Validate sensitivity analysis characteristics
            if "description" not in data or len(data["description"]) < 50:
                results.append(self.create_result(
                    rule_id="reg_016",
                    rule_name=self.regulatory_rules["reg_016"],
                    category=ValidationCategory.REGULATORY_COMPLIANCE,
                    severity=ValidationSeverity.WARNING,
                    message="Sensitivity analysis needs detailed description",
                    field_path="description",
                    suggestions=[
                        "Explain rationale for sensitivity analysis",
                        "Describe assumptions being tested",
                        "Document differences from primary analysis"
                    ]
                ))
        
        return results
    
    def _validate_gcp_compliance(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate Good Clinical Practice compliance."""
        results = []
        
        # Check for required GCP elements
        if "quality" not in data:
            results.append(self.create_result(
                rule_id="reg_003",
                rule_name=self.regulatory_rules["reg_003"],
                category=ValidationCategory.REGULATORY_COMPLIANCE,
                severity=ValidationSeverity.INFO,
                message="Consider documenting quality assurance measures",
                field_path="quality",
                suggestions=["Document QA/QC procedures per GCP guidelines"]
            ))
        
        return results
    
    def _is_valid_iso_timestamp(self, timestamp: str) -> bool:
        """Check if timestamp is in valid ISO 8601 format."""
        try:
            # Try parsing common ISO formats
            formats = [
                "%Y-%m-%dT%H:%M:%SZ",
                "%Y-%m-%dT%H:%M:%S.%fZ", 
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%d"
            ]
            
            for fmt in formats:
                try:
                    datetime.strptime(timestamp, fmt)
                    return True
                except ValueError:
                    continue
            
            return False
        except (TypeError, AttributeError):
            return False