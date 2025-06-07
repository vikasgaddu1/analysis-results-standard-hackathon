"""
CDISC standards compliance validator.
"""

from typing import Any, Dict, List, Optional, Set
from .base_validator import (
    BaseValidator, ValidationResult, ValidationSeverity, 
    ValidationCategory, ValidationContext
)


class CDISCValidator(BaseValidator):
    """Validator for CDISC standards compliance."""
    
    def __init__(self):
        super().__init__("CDISC Validator")
        self.cdisc_rules = {
            "cdisc_001": "SDTM domain validation",
            "cdisc_002": "SDTM variable naming conventions",
            "cdisc_003": "ADaM dataset structure validation",
            "cdisc_004": "Controlled terminology usage",
            "cdisc_005": "Study data tabulation model compliance",
            "cdisc_006": "Analysis data model compliance",
            "cdisc_007": "Define-XML compatibility",
            "cdisc_008": "SEND domain validation",
            "cdisc_009": "Dataset naming conventions",
            "cdisc_010": "Variable length validation",
            "cdisc_011": "ISO 8601 date format validation",
            "cdisc_012": "Missing value representation",
            "cdisc_013": "Duplicate record validation",
            "cdisc_014": "Referential integrity checks",
            "cdisc_015": "Character encoding validation"
        }
        
        # CDISC standard domains and their core variables
        self.sdtm_domains = {
            "DM": ["STUDYID", "DOMAIN", "USUBJID", "SUBJID", "RFSTDTC", "RFENDTC"],
            "AE": ["STUDYID", "DOMAIN", "USUBJID", "AESEQ", "AETERM", "AESTDTC"],
            "CM": ["STUDYID", "DOMAIN", "USUBJID", "CMSEQ", "CMTRT", "CMSTDTC"],
            "EX": ["STUDYID", "DOMAIN", "USUBJID", "EXSEQ", "EXTRT", "EXSTDTC"],
            "LB": ["STUDYID", "DOMAIN", "USUBJID", "LBSEQ", "LBTESTCD", "LBDTC"],
            "VS": ["STUDYID", "DOMAIN", "USUBJID", "VSSEQ", "VSTESTCD", "VSDTC"],
            "MH": ["STUDYID", "DOMAIN", "USUBJID", "MHSEQ", "MHTERM", "MHSTDTC"],
            "SU": ["STUDYID", "DOMAIN", "USUBJID", "SUSEQ", "SUTRT", "SUSTDTC"],
            "DS": ["STUDYID", "DOMAIN", "USUBJID", "DSSEQ", "DSTERM", "DSSTDTC"]
        }
        
        self.adam_datasets = {
            "ADSL": ["STUDYID", "USUBJID", "SUBJID", "SITEID", "ARM", "TRT01P"],
            "ADAE": ["STUDYID", "USUBJID", "AESEQ", "AEDECOD", "AEBODSYS", "TRTEMFL"],
            "ADLB": ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "AVAL", "CHG"],
            "ADVS": ["STUDYID", "USUBJID", "PARAMCD", "PARAM", "AVAL", "CHG"],
            "ADCM": ["STUDYID", "USUBJID", "CMDECOD", "CMCAT", "TRTEMFL"]
        }
        
        # Controlled terminology codelists
        self.controlled_terms = {
            "SEX": ["M", "F", "U", "UNDIFFERENTIATED"],
            "RACE": ["AMERICAN INDIAN OR ALASKA NATIVE", "ASIAN", "BLACK OR AFRICAN AMERICAN", 
                    "NATIVE HAWAIIAN OR OTHER PACIFIC ISLANDER", "WHITE", "MULTIPLE", "OTHER", "UNKNOWN"],
            "ETHNIC": ["HISPANIC OR LATINO", "NOT HISPANIC OR LATINO", "NOT REPORTED", "UNKNOWN"],
            "COMP": ["COMPLETED", "DISCONTINUED", "ONGOING"],
            "NY": ["N", "Y"],
            "SEVERITY": ["MILD", "MODERATE", "SEVERE"],
            "OUTCOME": ["RECOVERED/RESOLVED", "RECOVERING/RESOLVING", "NOT RECOVERED/NOT RESOLVED", 
                       "RECOVERED/RESOLVED WITH SEQUELAE", "FATAL", "UNKNOWN"]
        }
    
    def get_supported_rules(self) -> List[str]:
        """Get list of supported CDISC validation rules."""
        return list(self.cdisc_rules.keys())
    
    def validate(self, data: Any, context: ValidationContext) -> List[ValidationResult]:
        """Validate CDISC compliance."""
        results = []
        
        if not isinstance(data, dict):
            results.append(self.create_result(
                rule_id="cdisc_000",
                rule_name="Data Format",
                category=ValidationCategory.STANDARDS_COMPLIANCE,
                severity=ValidationSeverity.CRITICAL,
                message="CDISC data must be provided as a dictionary/object",
                value=type(data).__name__,
                expected_value="dict"
            ))
            return results
        
        # Validate based on object type
        if context.object_type == "dataset":
            results.extend(self._validate_dataset(data, context))
        elif context.object_type == "where_clause":
            results.extend(self._validate_where_clause_cdisc(data, context))
        elif context.object_type == "analysis":
            results.extend(self._validate_analysis_cdisc(data, context))
        
        return results
    
    def _validate_dataset(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate dataset against CDISC standards."""
        results = []
        
        dataset_name = data.get("name", "").upper()
        
        # Rule CDISC_001: SDTM domain validation
        if self.is_rule_enabled("cdisc_001"):
            results.extend(self._validate_sdtm_domain(data, dataset_name))
        
        # Rule CDISC_003: ADaM dataset structure validation
        if self.is_rule_enabled("cdisc_003"):
            results.extend(self._validate_adam_dataset(data, dataset_name))
        
        # Rule CDISC_009: Dataset naming conventions
        if self.is_rule_enabled("cdisc_009"):
            results.extend(self._validate_dataset_naming(dataset_name))
        
        # Rule CDISC_002: Variable naming conventions
        if self.is_rule_enabled("cdisc_002") and "variables" in data:
            results.extend(self._validate_variable_names(data["variables"]))
        
        # Rule CDISC_010: Variable length validation
        if self.is_rule_enabled("cdisc_010") and "variables" in data:
            results.extend(self._validate_variable_lengths(data["variables"]))
        
        return results
    
    def _validate_sdtm_domain(self, data: Dict[str, Any], dataset_name: str) -> List[ValidationResult]:
        """Validate SDTM domain structure."""
        results = []
        
        if dataset_name in self.sdtm_domains:
            required_vars = self.sdtm_domains[dataset_name]
            variables = data.get("variables", [])
            var_names = {var.get("name", "").upper() for var in variables if isinstance(var, dict)}
            
            for required_var in required_vars:
                if required_var not in var_names:
                    results.append(self.create_result(
                        rule_id="cdisc_001",
                        rule_name=self.cdisc_rules["cdisc_001"],
                        category=ValidationCategory.STANDARDS_COMPLIANCE,
                        severity=ValidationSeverity.ERROR,
                        message=f"SDTM domain {dataset_name} missing required variable {required_var}",
                        field_path="variables",
                        expected_value=required_var,
                        suggestions=[f"Add required variable {required_var} to {dataset_name} domain"]
                    ))
            
            # Validate domain variable naming pattern
            domain_var_present = "DOMAIN" in var_names
            if not domain_var_present:
                results.append(self.create_result(
                    rule_id="cdisc_001",
                    rule_name=self.cdisc_rules["cdisc_001"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message=f"SDTM domain {dataset_name} must include DOMAIN variable",
                    field_path="variables",
                    suggestions=["Add DOMAIN variable with dataset name as value"]
                ))
        
        return results
    
    def _validate_adam_dataset(self, data: Dict[str, Any], dataset_name: str) -> List[ValidationResult]:
        """Validate ADaM dataset structure."""
        results = []
        
        if dataset_name in self.adam_datasets:
            required_vars = self.adam_datasets[dataset_name]
            variables = data.get("variables", [])
            var_names = {var.get("name", "").upper() for var in variables if isinstance(var, dict)}
            
            for required_var in required_vars:
                if required_var not in var_names:
                    results.append(self.create_result(
                        rule_id="cdisc_003",
                        rule_name=self.cdisc_rules["cdisc_003"],
                        category=ValidationCategory.STANDARDS_COMPLIANCE,
                        severity=ValidationSeverity.ERROR,
                        message=f"ADaM dataset {dataset_name} missing required variable {required_var}",
                        field_path="variables",
                        expected_value=required_var,
                        suggestions=[f"Add required variable {required_var} to {dataset_name} dataset"]
                    ))
            
            # ADaM-specific validations
            if dataset_name == "ADSL":
                # ADSL should have treatment variables
                treatment_vars = {"TRT01P", "TRT01A", "ARM", "ACTARM"}
                found_treatment = any(var in var_names for var in treatment_vars)
                if not found_treatment:
                    results.append(self.create_result(
                        rule_id="cdisc_003",
                        rule_name=self.cdisc_rules["cdisc_003"],
                        category=ValidationCategory.STANDARDS_COMPLIANCE,
                        severity=ValidationSeverity.WARNING,
                        message="ADSL dataset should include treatment variables",
                        field_path="variables",
                        suggestions=["Add treatment variables like TRT01P, TRT01A, ARM, or ACTARM"]
                    ))
            
            elif dataset_name.startswith("AD") and dataset_name != "ADSL":
                # Other ADaM datasets should have parameter-related variables
                param_vars = {"PARAMCD", "PARAM", "AVAL"}
                found_params = param_vars.intersection(var_names)
                if len(found_params) < 2:
                    results.append(self.create_result(
                        rule_id="cdisc_003",
                        rule_name=self.cdisc_rules["cdisc_003"],
                        category=ValidationCategory.STANDARDS_COMPLIANCE,
                        severity=ValidationSeverity.WARNING,
                        message=f"ADaM dataset {dataset_name} should include parameter variables",
                        field_path="variables",
                        suggestions=["Add parameter variables like PARAMCD, PARAM, and AVAL"]
                    ))
        
        return results
    
    def _validate_dataset_naming(self, dataset_name: str) -> List[ValidationResult]:
        """Validate dataset naming conventions."""
        results = []
        
        if not dataset_name:
            results.append(self.create_result(
                rule_id="cdisc_009",
                rule_name=self.cdisc_rules["cdisc_009"],
                category=ValidationCategory.STANDARDS_COMPLIANCE,
                severity=ValidationSeverity.ERROR,
                message="Dataset name cannot be empty",
                field_path="name",
                suggestions=["Provide a valid CDISC dataset name"]
            ))
            return results
        
        # Check length (max 8 characters for CDISC)
        if len(dataset_name) > 8:
            results.append(self.create_result(
                rule_id="cdisc_009",
                rule_name=self.cdisc_rules["cdisc_009"],
                category=ValidationCategory.STANDARDS_COMPLIANCE,
                severity=ValidationSeverity.ERROR,
                message=f"Dataset name '{dataset_name}' exceeds 8 character limit",
                field_path="name",
                value=dataset_name,
                expected_value="<= 8 characters",
                suggestions=["Shorten dataset name to 8 characters or less"]
            ))
        
        # Check for valid characters (alphanumeric only)
        if not dataset_name.isalnum():
            results.append(self.create_result(
                rule_id="cdisc_009",
                rule_name=self.cdisc_rules["cdisc_009"],
                category=ValidationCategory.STANDARDS_COMPLIANCE,
                severity=ValidationSeverity.ERROR,
                message=f"Dataset name '{dataset_name}' contains invalid characters",
                field_path="name",
                value=dataset_name,
                expected_value="Alphanumeric characters only",
                suggestions=["Use only letters and numbers in dataset name"]
            ))
        
        # Check if it starts with a letter
        if not dataset_name[0].isalpha():
            results.append(self.create_result(
                rule_id="cdisc_009",
                rule_name=self.cdisc_rules["cdisc_009"],
                category=ValidationCategory.STANDARDS_COMPLIANCE,
                severity=ValidationSeverity.ERROR,
                message=f"Dataset name '{dataset_name}' must start with a letter",
                field_path="name",
                value=dataset_name,
                suggestions=["Start dataset name with a letter"]
            ))
        
        return results
    
    def _validate_variable_names(self, variables: List[Dict[str, Any]]) -> List[ValidationResult]:
        """Validate variable naming conventions."""
        results = []
        
        for i, variable in enumerate(variables):
            if not isinstance(variable, dict):
                continue
                
            var_name = variable.get("name", "")
            
            # Rule CDISC_002: Variable naming conventions
            if not var_name:
                results.append(self.create_result(
                    rule_id="cdisc_002",
                    rule_name=self.cdisc_rules["cdisc_002"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message=f"Variable at index {i} has no name",
                    field_path=f"variables[{i}].name",
                    suggestions=["Provide a valid variable name"]
                ))
                continue
            
            # Check length (max 8 characters for SDTM, 32 for ADaM)
            max_length = 32  # Assume ADaM unless specifically SDTM
            if len(var_name) > max_length:
                results.append(self.create_result(
                    rule_id="cdisc_002",
                    rule_name=self.cdisc_rules["cdisc_002"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.WARNING,
                    message=f"Variable name '{var_name}' exceeds recommended length",
                    field_path=f"variables[{i}].name",
                    value=var_name,
                    expected_value=f"<= {max_length} characters",
                    suggestions=[f"Shorten variable name to {max_length} characters or less"]
                ))
            
            # Check for valid characters
            if not all(c.isalnum() or c in "_" for c in var_name):
                results.append(self.create_result(
                    rule_id="cdisc_002",
                    rule_name=self.cdisc_rules["cdisc_002"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message=f"Variable name '{var_name}' contains invalid characters",
                    field_path=f"variables[{i}].name",
                    value=var_name,
                    expected_value="Letters, numbers, and underscores only",
                    suggestions=["Use only letters, numbers, and underscores in variable names"]
                ))
            
            # Check if it starts with a letter
            if not var_name[0].isalpha():
                results.append(self.create_result(
                    rule_id="cdisc_002",
                    rule_name=self.cdisc_rules["cdisc_002"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.ERROR,
                    message=f"Variable name '{var_name}' must start with a letter",
                    field_path=f"variables[{i}].name",
                    value=var_name,
                    suggestions=["Start variable name with a letter"]
                ))
        
        return results
    
    def _validate_variable_lengths(self, variables: List[Dict[str, Any]]) -> List[ValidationResult]:
        """Validate variable length specifications."""
        results = []
        
        for i, variable in enumerate(variables):
            if not isinstance(variable, dict):
                continue
                
            var_name = variable.get("name", "")
            var_type = variable.get("type", "").upper()
            var_length = variable.get("length")
            
            # Rule CDISC_010: Variable length validation
            if var_type == "CHAR" and var_length:
                try:
                    length = int(var_length)
                    if length > 200:  # CDISC recommendation
                        results.append(self.create_result(
                            rule_id="cdisc_010",
                            rule_name=self.cdisc_rules["cdisc_010"],
                            category=ValidationCategory.STANDARDS_COMPLIANCE,
                            severity=ValidationSeverity.WARNING,
                            message=f"Character variable '{var_name}' has unusually long length {length}",
                            field_path=f"variables[{i}].length",
                            value=length,
                            expected_value="<= 200 (recommended)",
                            suggestions=["Consider if such a long character field is necessary"]
                        ))
                except (ValueError, TypeError):
                    results.append(self.create_result(
                        rule_id="cdisc_010",
                        rule_name=self.cdisc_rules["cdisc_010"],
                        category=ValidationCategory.STANDARDS_COMPLIANCE,
                        severity=ValidationSeverity.ERROR,
                        message=f"Invalid length specification for variable '{var_name}'",
                        field_path=f"variables[{i}].length",
                        value=var_length,
                        expected_value="Numeric value",
                        suggestions=["Specify length as a numeric value"]
                    ))
        
        return results
    
    def _validate_where_clause_cdisc(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate where clause for CDISC compliance."""
        results = []
        
        # Check if dataset references are valid CDISC domains
        if "condition" in data:
            condition = data["condition"]
            dataset = condition.get("dataset", "").upper()
            
            if dataset and dataset not in self.sdtm_domains and dataset not in self.adam_datasets:
                results.append(self.create_result(
                    rule_id="cdisc_001",
                    rule_name=self.cdisc_rules["cdisc_001"],
                    category=ValidationCategory.STANDARDS_COMPLIANCE,
                    severity=ValidationSeverity.WARNING,
                    message=f"Dataset '{dataset}' is not a standard CDISC domain",
                    field_path="condition.dataset",
                    value=dataset,
                    suggestions=["Verify dataset name against CDISC standards"]
                ))
            
            # Validate variable naming for known domains
            variable = condition.get("variable", "").upper()
            if dataset in self.sdtm_domains and variable:
                domain_vars = self.sdtm_domains[dataset]
                if variable not in domain_vars:
                    # Check if it follows domain naming pattern
                    if not variable.startswith(dataset[:2]):
                        results.append(self.create_result(
                            rule_id="cdisc_002",
                            rule_name=self.cdisc_rules["cdisc_002"],
                            category=ValidationCategory.STANDARDS_COMPLIANCE,
                            severity=ValidationSeverity.WARNING,
                            message=f"Variable '{variable}' doesn't follow {dataset} domain naming convention",
                            field_path="condition.variable",
                            value=variable,
                            expected_value=f"Should start with '{dataset[:2]}'",
                            suggestions=[f"Use domain prefix '{dataset[:2]}' for {dataset} variables"]
                        ))
        
        # Validate controlled terminology usage
        if "condition" in data:
            condition = data["condition"]
            if "value" in condition and "variable" in condition:
                variable = condition["variable"].upper()
                value = condition["value"]
                
                # Check against known controlled terminology
                if variable.endswith("SEX") and value not in self.controlled_terms.get("SEX", []):
                    results.append(self.create_result(
                        rule_id="cdisc_004",
                        rule_name=self.cdisc_rules["cdisc_004"],
                        category=ValidationCategory.STANDARDS_COMPLIANCE,
                        severity=ValidationSeverity.WARNING,
                        message=f"Value '{value}' for SEX variable not in CDISC controlled terminology",
                        field_path="condition.value",
                        value=value,
                        expected_value=f"One of: {', '.join(self.controlled_terms['SEX'])}",
                        suggestions=["Use CDISC controlled terminology for SEX"]
                    ))
                
                elif variable.endswith("RACE") and value not in self.controlled_terms.get("RACE", []):
                    results.append(self.create_result(
                        rule_id="cdisc_004",
                        rule_name=self.cdisc_rules["cdisc_004"],
                        category=ValidationCategory.STANDARDS_COMPLIANCE,
                        severity=ValidationSeverity.WARNING,
                        message=f"Value '{value}' for RACE variable not in CDISC controlled terminology",
                        field_path="condition.value",
                        value=value,
                        expected_value=f"One of: {', '.join(self.controlled_terms['RACE'])}",
                        suggestions=["Use CDISC controlled terminology for RACE"]
                    ))
        
        return results
    
    def _validate_analysis_cdisc(self, data: Dict[str, Any], context: ValidationContext) -> List[ValidationResult]:
        """Validate analysis for CDISC compliance."""
        results = []
        
        # Check if analysis uses standard CDISC datasets
        if "dataSubsets" in data:
            for i, subset in enumerate(data["dataSubsets"]):
                if isinstance(subset, dict) and "dataset" in subset:
                    dataset = subset["dataset"].upper()
                    if dataset not in self.sdtm_domains and dataset not in self.adam_datasets:
                        results.append(self.create_result(
                            rule_id="cdisc_001",
                            rule_name=self.cdisc_rules["cdisc_001"],
                            category=ValidationCategory.STANDARDS_COMPLIANCE,
                            severity=ValidationSeverity.INFO,
                            message=f"Analysis references non-standard dataset '{dataset}'",
                            field_path=f"dataSubsets[{i}].dataset",
                            value=dataset,
                            suggestions=["Consider using standard CDISC domains where applicable"]
                        ))
        
        return results