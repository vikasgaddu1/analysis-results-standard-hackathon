"""
Business rules and logic validator.
"""

from typing import Any, Dict, List, Optional, Set, Union
from datetime import datetime, date
from collections import defaultdict
import re
from .base_validator import (
    BaseValidator, ValidationResult, ValidationSeverity, 
    ValidationCategory, ValidationContext
)


class BusinessRulesValidator(BaseValidator):
    """Validator for business logic and domain-specific rules."""
    
    def __init__(self):
        super().__init__("Business Rules Validator")
        self.business_rules = {
            "br_001": "Analysis workflow sequence validation",
            "br_002": "Statistical method appropriateness",
            "br_003": "Population subset consistency",
            "br_004": "Output type compatibility",
            "br_005": "Timeline and milestone validation",
            "br_006": "Resource allocation validation",
            "br_007": "Dependency resolution",
            "br_008": "Authorization and permissions",
            "br_009": "Version compatibility",
            "br_010": "Study phase appropriateness",
            "br_011": "Endpoint type validation",
            "br_012": "Sample size considerations",
            "br_013": "Protocol deviation handling",
            "br_014": "Quality control thresholds",
            "br_015": "Regulatory submission readiness",
            "br_016": "Data lock validation",
            "br_017": "Blinding integrity",
            "br_018": "Interim analysis timing",
            "br_019": "Safety signal detection",
            "br_020": "Efficacy boundary validation"
        }
        
        # Business domain knowledge
        self.study_phases = ["Phase I", "Phase II", "Phase III", "Phase IV", "Pre-Clinical"]
        self.endpoint_types = ["Primary", "Secondary", "Exploratory", "Safety", "Pharmacokinetic"]
        self.analysis_timing = ["Pre-specified", "Ad-hoc", "Post-hoc", "Interim"]
        
        # Statistical method compatibility matrix
        self.method_data_type_compatibility = {
            "descriptive": ["continuous", "categorical", "ordinal", "binary"],
            "t_test": ["continuous"],
            "chi_square": ["categorical", "binary"],
            "anova": ["continuous"],
            "logistic_regression": ["binary", "categorical"],
            "survival_analysis": ["time_to_event"],
            "mixed_model": ["continuous", "longitudinal"]
        }
        
        # Population subset rules
        self.valid_population_subsets = {
            "ITT": "Intent-to-treat population",
            "PP": "Per-protocol population", 
            "FAS": "Full analysis set",
            "SAF": "Safety analysis set",
            "mITT": "Modified intent-to-treat",
            "MITT": "Modified intent-to-treat"
        }
    
    def get_supported_rules(self) -> List[str]:
        """Get list of supported business rules."""
        return list(self.business_rules.keys())
    
    def validate(self, data: Any, context: ValidationContext) -> List[ValidationResult]:
        """Validate business rules and logic."""
        results = []
        
        if not isinstance(data, dict):
            results.append(self.create_result(
                rule_id="br_000",
                rule_name="Data Format",
                category=ValidationCategory.BUSINESS_RULES,
                severity=ValidationSeverity.CRITICAL,
                message="Business rules validation requires dictionary/object data",
                value=type(data).__name__,
                expected_value="dict"
            ))
            return results
        
        # Apply business rules based on object type
        if context.object_type == "reporting_event":
            results.extend(self._validate_reporting_event_business_rules(data, context))
        elif context.object_type == "analysis":
            results.extend(self._validate_analysis_business_rules(data, context))
        elif context.object_type == "method":
            results.extend(self._validate_method_business_rules(data, context))
        elif context.object_type == "study":
            results.extend(self._validate_study_business_rules(data, context))
        
        return results
    
    def _validate_reporting_event_business_rules(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate business rules for reporting events."""
        results = []
        
        # Rule BR_001: Analysis workflow sequence validation
        if self.is_rule_enabled("br_001"):
            results.extend(self._validate_analysis_workflow(data))
        
        # Rule BR_015: Regulatory submission readiness
        if self.is_rule_enabled("br_015"):
            results.extend(self._validate_submission_readiness(data))
        
        # Rule BR_016: Data lock validation
        if self.is_rule_enabled("br_016"):
            results.extend(self._validate_data_lock_status(data))
        
        # Rule BR_009: Version compatibility
        if self.is_rule_enabled("br_009"):
            results.extend(self._validate_version_compatibility(data))
        
        return results
    
    def _validate_analysis_business_rules(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate business rules for analyses."""
        results = []
        
        # Rule BR_002: Statistical method appropriateness
        if self.is_rule_enabled("br_002"):
            results.extend(self._validate_statistical_method_appropriateness(data))
        
        # Rule BR_003: Population subset consistency
        if self.is_rule_enabled("br_003"):
            results.extend(self._validate_population_subset_consistency(data))
        
        # Rule BR_011: Endpoint type validation
        if self.is_rule_enabled("br_011"):
            results.extend(self._validate_endpoint_type(data))
        
        # Rule BR_012: Sample size considerations
        if self.is_rule_enabled("br_012"):
            results.extend(self._validate_sample_size_considerations(data))
        
        # Rule BR_018: Interim analysis timing
        if self.is_rule_enabled("br_018"):
            results.extend(self._validate_interim_analysis_timing(data))
        
        return results
    
    def _validate_method_business_rules(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate business rules for methods."""
        results = []
        
        # Rule BR_007: Dependency resolution
        if self.is_rule_enabled("br_007"):
            results.extend(self._validate_method_dependencies(data))
        
        # Rule BR_014: Quality control thresholds
        if self.is_rule_enabled("br_014"):
            results.extend(self._validate_quality_control_thresholds(data))
        
        return results
    
    def _validate_study_business_rules(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate business rules for studies."""
        results = []
        
        # Rule BR_010: Study phase appropriateness
        if self.is_rule_enabled("br_010"):
            results.extend(self._validate_study_phase_appropriateness(data))
        
        # Rule BR_017: Blinding integrity
        if self.is_rule_enabled("br_017"):
            results.extend(self._validate_blinding_integrity(data))
        
        return results
    
    def _validate_analysis_workflow(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate analysis workflow sequence."""
        results = []
        
        if "analyses" in data:
            analyses = data["analyses"]
            
            # Check for logical sequence
            primary_found = False
            secondary_before_primary = False
            
            for i, analysis in enumerate(analyses):
                if isinstance(analysis, dict):
                    purpose = self._extract_purpose(analysis)
                    
                    if "primary" in purpose.lower():
                        primary_found = True
                    elif "secondary" in purpose.lower() and not primary_found:
                        secondary_before_primary = True
            
            if secondary_before_primary:
                results.append(self.create_result(
                    rule_id="br_001",
                    rule_name=self.business_rules["br_001"],
                    category=ValidationCategory.BUSINESS_RULES,
                    severity=ValidationSeverity.WARNING,
                    message="Secondary analyses should typically follow primary analyses",
                    field_path="analyses",
                    suggestions=[
                        "Consider reordering analyses",
                        "Ensure primary endpoints are analyzed first"
                    ]
                ))
            
            # Check for prerequisite analyses
            safety_analyses = []
            efficacy_analyses = []
            
            for analysis in analyses:
                if isinstance(analysis, dict):
                    purpose = self._extract_purpose(analysis)
                    if "safety" in purpose.lower():
                        safety_analyses.append(analysis)
                    elif any(term in purpose.lower() for term in ["efficacy", "primary", "secondary"]):
                        efficacy_analyses.append(analysis)
            
            # For efficacy studies, safety analyses should be present
            if efficacy_analyses and not safety_analyses:
                results.append(self.create_result(
                    rule_id="br_001",
                    rule_name=self.business_rules["br_001"],
                    category=ValidationCategory.BUSINESS_RULES,
                    severity=ValidationSeverity.WARNING,
                    message="Efficacy analyses present without corresponding safety analyses",
                    field_path="analyses",
                    suggestions=["Consider including safety analyses for comprehensive evaluation"]
                ))
        
        return results
    
    def _validate_statistical_method_appropriateness(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate statistical method appropriateness."""
        results = []
        
        # Get method details
        method_id = data.get("methodId", "")
        
        # Infer data type from analysis context
        data_type = self._infer_data_type(data)
        
        # Check method compatibility
        if method_id and data_type:
            method_name = self._extract_method_name(method_id)
            compatible_types = self.method_data_type_compatibility.get(method_name, [])
            
            if compatible_types and data_type not in compatible_types:
                results.append(self.create_result(
                    rule_id="br_002",
                    rule_name=self.business_rules["br_002"],
                    category=ValidationCategory.BUSINESS_RULES,
                    severity=ValidationSeverity.WARNING,
                    message=f"Statistical method '{method_name}' may not be appropriate for {data_type} data",
                    field_path="methodId",
                    value=method_id,
                    expected_value=f"Method suitable for {data_type} data",
                    suggestions=[
                        f"Consider methods appropriate for {data_type} data",
                        "Verify data type and method compatibility"
                    ]
                ))
        
        # Check sample size requirements for specific methods
        if "t_test" in method_id.lower() or "anova" in method_id.lower():
            # These methods have sample size assumptions
            if not self._has_adequate_sample_size_documentation(data):
                results.append(self.create_result(
                    rule_id="br_002",
                    rule_name=self.business_rules["br_002"],
                    category=ValidationCategory.BUSINESS_RULES,
                    severity=ValidationSeverity.INFO,
                    message="Parametric statistical method requires sample size justification",
                    field_path="methodId",
                    suggestions=[
                        "Document sample size adequacy",
                        "Consider normality assumptions",
                        "Evaluate non-parametric alternatives if needed"
                    ]
                ))
        
        return results
    
    def _validate_population_subset_consistency(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate population subset consistency."""
        results = []
        
        analysis_set_id = data.get("analysisSetId", "")
        purpose = self._extract_purpose(data)
        
        if analysis_set_id and purpose:
            # Business rules for population selection
            if "primary" in purpose.lower():
                # Primary efficacy should use ITT/FAS
                if not any(pop in analysis_set_id.upper() for pop in ["ITT", "FAS"]):
                    results.append(self.create_result(
                        rule_id="br_003",
                        rule_name=self.business_rules["br_003"],
                        category=ValidationCategory.BUSINESS_RULES,
                        severity=ValidationSeverity.WARNING,
                        message="Primary efficacy analysis should typically use ITT or FAS population",
                        field_path="analysisSetId",
                        value=analysis_set_id,
                        expected_value="ITT or FAS population",
                        suggestions=[
                            "Consider using Intent-to-Treat population",
                            "Justify alternative population choice"
                        ]
                    ))
            
            elif "safety" in purpose.lower():
                # Safety analyses should use safety population
                if not any(pop in analysis_set_id.upper() for pop in ["SAF", "SAFETY"]):
                    results.append(self.create_result(
                        rule_id="br_003",
                        rule_name=self.business_rules["br_003"],
                        category=ValidationCategory.BUSINESS_RULES,
                        severity=ValidationSeverity.WARNING,
                        message="Safety analysis should typically use safety analysis set",
                        field_path="analysisSetId",
                        value=analysis_set_id,
                        expected_value="Safety analysis set (SAF)",
                        suggestions=[
                            "Consider using Safety Analysis Set",
                            "Document rationale for population choice"
                        ]
                    ))
            
            elif "per.protocol" in purpose.lower() or "pp" in purpose.lower():
                # Per-protocol analyses
                if "PP" not in analysis_set_id.upper():
                    results.append(self.create_result(
                        rule_id="br_003",
                        rule_name=self.business_rules["br_003"],
                        category=ValidationCategory.BUSINESS_RULES,
                        severity=ValidationSeverity.ERROR,
                        message="Per-protocol analysis must use per-protocol population",
                        field_path="analysisSetId",
                        value=analysis_set_id,
                        expected_value="Per-protocol population (PP)",
                        suggestions=["Use per-protocol analysis set for PP analyses"]
                    ))
        
        return results
    
    def _validate_endpoint_type(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate endpoint type appropriateness."""
        results = []
        
        purpose = self._extract_purpose(data)
        
        # Check endpoint type consistency
        if "primary" in purpose.lower():
            # Primary endpoints should have specific characteristics
            if "description" in data:
                description = data["description"].lower()
                
                # Primary endpoints should be well-defined
                if len(description) < 50:
                    results.append(self.create_result(
                        rule_id="br_011",
                        rule_name=self.business_rules["br_011"],
                        category=ValidationCategory.BUSINESS_RULES,
                        severity=ValidationSeverity.WARNING,
                        message="Primary endpoint requires detailed description",
                        field_path="description",
                        value=len(description),
                        expected_value=">= 50 characters",
                        suggestions=[
                            "Provide comprehensive endpoint definition",
                            "Include measurement method and timing"
                        ]
                    ))
                
                # Should mention measurement timing
                timing_keywords = ["week", "day", "month", "baseline", "endpoint", "time"]
                if not any(keyword in description for keyword in timing_keywords):
                    results.append(self.create_result(
                        rule_id="br_011",
                        rule_name=self.business_rules["br_011"],
                        category=ValidationCategory.BUSINESS_RULES,
                        severity=ValidationSeverity.INFO,
                        message="Primary endpoint should specify measurement timing",
                        field_path="description",
                        suggestions=["Include timing information in endpoint description"]
                    ))
        
        return results
    
    def _validate_sample_size_considerations(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate sample size considerations."""
        results = []
        
        purpose = self._extract_purpose(data)
        
        # Primary efficacy analyses need power considerations
        if "primary" in purpose.lower() and "efficacy" in purpose.lower():
            
            # Look for power/sample size documentation
            has_power_docs = False
            if "description" in data:
                desc = data["description"].lower()
                power_keywords = ["power", "sample size", "alpha", "beta", "effect size"]
                has_power_docs = any(keyword in desc for keyword in power_keywords)
            
            if not has_power_docs:
                results.append(self.create_result(
                    rule_id="br_012",
                    rule_name=self.business_rules["br_012"],
                    category=ValidationCategory.BUSINESS_RULES,
                    severity=ValidationSeverity.INFO,
                    message="Primary efficacy analysis should document power considerations",
                    field_path="description",
                    suggestions=[
                        "Document statistical power assumptions",
                        "Include sample size justification",
                        "Specify effect size and significance level"
                    ]
                ))
        
        return results
    
    def _validate_interim_analysis_timing(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate interim analysis timing."""
        results = []
        
        analysis_name = data.get("name", "").lower()
        description = data.get("description", "").lower()
        
        # Check if this is an interim analysis
        is_interim = any(term in text for text in [analysis_name, description] 
                        for term in ["interim", "futility", "early stopping"])
        
        if is_interim:
            # Interim analyses need special considerations
            if "reason" not in data:
                results.append(self.create_result(
                    rule_id="br_018",
                    rule_name=self.business_rules["br_018"],
                    category=ValidationCategory.BUSINESS_RULES,
                    severity=ValidationSeverity.WARNING,
                    message="Interim analysis should document rationale",
                    field_path="reason",
                    suggestions=[
                        "Document reason for interim analysis",
                        "Specify stopping criteria",
                        "Address alpha spending considerations"
                    ]
                ))
            
            # Should have timing specification
            timing_specified = any(term in description for term in 
                                 ["week", "month", "patient", "event", "interim"])
            if not timing_specified:
                results.append(self.create_result(
                    rule_id="br_018",
                    rule_name=self.business_rules["br_018"],
                    category=ValidationCategory.BUSINESS_RULES,
                    severity=ValidationSeverity.INFO,
                    message="Interim analysis should specify timing criteria",
                    field_path="description",
                    suggestions=["Specify when interim analysis will be conducted"]
                ))
        
        return results
    
    def _validate_submission_readiness(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate regulatory submission readiness."""
        results = []
        
        # Check for required documentation
        required_elements = [
            ("protocol", "Study protocol"),
            ("sap", "Statistical Analysis Plan"),
            ("csr", "Clinical Study Report sections")
        ]
        
        ref_docs = data.get("referenceDocuments", [])
        doc_types = {doc.get("type", "").lower() for doc in ref_docs if isinstance(doc, dict)}
        
        missing_docs = []
        for doc_type, description in required_elements:
            if doc_type not in doc_types:
                missing_docs.append(description)
        
        if missing_docs:
            results.append(self.create_result(
                rule_id="br_015",
                rule_name=self.business_rules["br_015"],
                category=ValidationCategory.BUSINESS_RULES,
                severity=ValidationSeverity.WARNING,
                message=f"Missing documentation for submission: {', '.join(missing_docs)}",
                field_path="referenceDocuments",
                suggestions=[f"Add {doc}" for doc in missing_docs]
            ))
        
        return results
    
    def _validate_data_lock_status(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate data lock status."""
        results = []
        
        # Check if data lock status is documented
        if "dataLock" not in data and "status" in data:
            status = data["status"].lower()
            if status in ["final", "locked", "submitted"]:
                results.append(self.create_result(
                    rule_id="br_016",
                    rule_name=self.business_rules["br_016"],
                    category=ValidationCategory.BUSINESS_RULES,
                    severity=ValidationSeverity.INFO,
                    message="Final status should document data lock information",
                    field_path="dataLock",
                    suggestions=["Add data lock timestamp and authority"]
                ))
        
        return results
    
    def _validate_version_compatibility(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate version compatibility."""
        results = []
        
        version = data.get("version", "")
        if version:
            # Check for breaking changes in major versions
            try:
                major_version = int(version.split(".")[0])
                if major_version > 1:
                    results.append(self.create_result(
                        rule_id="br_009",
                        rule_name=self.business_rules["br_009"],
                        category=ValidationCategory.BUSINESS_RULES,
                        severity=ValidationSeverity.INFO,
                        message=f"Major version {major_version} may have compatibility implications",
                        field_path="version",
                        value=version,
                        suggestions=["Review compatibility with dependent systems"]
                    ))
            except (ValueError, IndexError):
                pass
        
        return results
    
    def _validate_method_dependencies(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate method dependencies."""
        results = []
        
        if "operations" in data:
            operations = data["operations"]
            
            # Check for logical operation sequence
            for i, operation in enumerate(operations):
                if isinstance(operation, dict):
                    # Check if operation has prerequisites
                    if "resultPattern" in operation:
                        result_pattern = operation["resultPattern"]
                        
                        # Operations that reference previous results
                        if "previous" in str(result_pattern).lower() or "prior" in str(result_pattern).lower():
                            if i == 0:
                                results.append(self.create_result(
                                    rule_id="br_007",
                                    rule_name=self.business_rules["br_007"],
                                    category=ValidationCategory.BUSINESS_RULES,
                                    severity=ValidationSeverity.ERROR,
                                    message="First operation cannot reference previous results",
                                    field_path=f"operations[{i}].resultPattern",
                                    suggestions=["Reorder operations or remove reference to previous results"]
                                ))
        
        return results
    
    def _validate_quality_control_thresholds(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate quality control thresholds."""
        results = []
        
        # Check for QC parameters in operations
        if "operations" in data:
            for i, operation in enumerate(data["operations"]):
                if isinstance(operation, dict) and "name" in operation:
                    op_name = operation["name"].lower()
                    
                    # Statistical tests should have significance levels
                    if any(term in op_name for term in ["test", "pvalue", "significance"]):
                        if "parameters" not in operation:
                            results.append(self.create_result(
                                rule_id="br_014",
                                rule_name=self.business_rules["br_014"],
                                category=ValidationCategory.BUSINESS_RULES,
                                severity=ValidationSeverity.INFO,
                                message=f"Statistical operation '{operation['name']}' should specify parameters",
                                field_path=f"operations[{i}].parameters",
                                suggestions=["Add significance level and other test parameters"]
                            ))
        
        return results
    
    def _validate_study_phase_appropriateness(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate study phase appropriateness."""
        results = []
        
        phase = data.get("phase", "")
        
        if phase in self.study_phases:
            # Phase-specific validations
            if phase == "Phase I":
                # Phase I focuses on safety and dose-finding
                if "analyses" in data:
                    safety_analyses = [a for a in data["analyses"] 
                                     if isinstance(a, dict) and "safety" in self._extract_purpose(a).lower()]
                    efficacy_analyses = [a for a in data["analyses"] 
                                       if isinstance(a, dict) and "efficacy" in self._extract_purpose(a).lower()]
                    
                    if len(efficacy_analyses) > len(safety_analyses):
                        results.append(self.create_result(
                            rule_id="br_010",
                            rule_name=self.business_rules["br_010"],
                            category=ValidationCategory.BUSINESS_RULES,
                            severity=ValidationSeverity.WARNING,
                            message="Phase I studies should emphasize safety over efficacy",
                            field_path="analyses",
                            suggestions=["Ensure adequate safety analyses for Phase I study"]
                        ))
            
            elif phase == "Phase III":
                # Phase III should have primary efficacy endpoints
                if "analyses" in data:
                    primary_efficacy = any(
                        "primary" in self._extract_purpose(a).lower() and "efficacy" in self._extract_purpose(a).lower()
                        for a in data["analyses"] if isinstance(a, dict)
                    )
                    
                    if not primary_efficacy:
                        results.append(self.create_result(
                            rule_id="br_010",
                            rule_name=self.business_rules["br_010"],
                            category=ValidationCategory.BUSINESS_RULES,
                            severity=ValidationSeverity.ERROR,
                            message="Phase III studies must include primary efficacy analyses",
                            field_path="analyses",
                            suggestions=["Add primary efficacy endpoint analysis"]
                        ))
        
        return results
    
    def _validate_blinding_integrity(self, data: Dict[str, Any]) -> List[ValidationResult]:
        """Validate blinding integrity considerations."""
        results = []
        
        # Check if study involves blinding
        study_design = data.get("design", "").lower()
        is_blinded = any(term in study_design for term in ["blind", "masked", "placebo"])
        
        if is_blinded:
            # Blinded studies need special handling
            if "analyses" in data:
                for i, analysis in enumerate(data["analyses"]):
                    if isinstance(analysis, dict):
                        # Interim analyses in blinded studies
                        analysis_name = analysis.get("name", "").lower()
                        if "interim" in analysis_name:
                            if "blindingIntegrity" not in analysis:
                                results.append(self.create_result(
                                    rule_id="br_017",
                                    rule_name=self.business_rules["br_017"],
                                    category=ValidationCategory.BUSINESS_RULES,
                                    severity=ValidationSeverity.WARNING,
                                    message="Interim analysis in blinded study should address blinding integrity",
                                    field_path=f"analyses[{i}].blindingIntegrity",
                                    suggestions=[
                                        "Document blinding maintenance procedures",
                                        "Specify who has access to interim results"
                                    ]
                                ))
        
        return results
    
    # Helper methods
    def _extract_purpose(self, analysis: Dict[str, Any]) -> str:
        """Extract purpose string from analysis."""
        purpose = analysis.get("purpose", "")
        if isinstance(purpose, dict):
            return purpose.get("controlledTerm", "") or purpose.get("sponsorTerm", "")
        return str(purpose)
    
    def _extract_method_name(self, method_id: str) -> str:
        """Extract method name from method ID."""
        # Simple heuristic to extract method type from ID
        method_id_lower = method_id.lower()
        for method_type in self.method_data_type_compatibility.keys():
            if method_type in method_id_lower:
                return method_type
        return "unknown"
    
    def _infer_data_type(self, analysis: Dict[str, Any]) -> str:
        """Infer data type from analysis context."""
        # This is a simplified inference - real implementation would be more sophisticated
        name = analysis.get("name", "").lower()
        description = analysis.get("description", "").lower()
        
        if any(term in name + description for term in ["time", "survival", "tte"]):
            return "time_to_event"
        elif any(term in name + description for term in ["continuous", "mean", "change"]):
            return "continuous"
        elif any(term in name + description for term in ["proportion", "rate", "binary"]):
            return "binary"
        elif any(term in name + description for term in ["categorical", "category"]):
            return "categorical"
        
        return "unknown"
    
    def _has_adequate_sample_size_documentation(self, analysis: Dict[str, Any]) -> bool:
        """Check if sample size is adequately documented."""
        description = analysis.get("description", "").lower()
        power_terms = ["power", "sample size", "n=", "subjects", "patients"]
        return any(term in description for term in power_terms)