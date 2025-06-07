"""
CRUD operations for analysis methods
Comprehensive method library features for statistical analysis methods
"""

import json
from typing import Any, Dict, List, Optional, Union
from uuid import uuid4, UUID

from fastapi import HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy import and_, or_, func, text, desc, asc
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import IntegrityError

from app.crud.base import CRUDBase
from app.models.ars import (
    AnalysisMethod, Operation, OperationRelationship,
    Analysis, ReferenceDocument
)
from app.schemas.ars import (
    AnalysisMethodCreate, AnalysisMethodUpdate,
    OperationCreate, OperationUpdate,
    OperationRelationshipCreate, OperationRelationshipUpdate
)


class CRUDAnalysisMethod(CRUDBase[AnalysisMethod, AnalysisMethodCreate, AnalysisMethodUpdate]):
    """CRUD operations for Analysis Methods with comprehensive features"""
    
    def get_with_relationships(self, db: Session, *, id: str) -> Optional[AnalysisMethod]:
        """
        Get method with all related operations and relationships.
        """
        return db.query(self.model).options(
            selectinload(self.model.operations).selectinload(Operation.referenced_relationships),
            selectinload(self.model.operations).selectinload(Operation.referencing_relationships)
        ).filter(self.model.id == id).first()
    
    def get_templates(self, db: Session, *, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get predefined method templates organized by statistical categories.
        """
        templates = [
            # Descriptive Statistics Templates
            {
                "id": "descriptive_continuous",
                "name": "Descriptive Statistics - Continuous Variables",
                "category": "descriptive",
                "description": "Calculate mean, median, standard deviation, min/max for continuous variables",
                "operations": [
                    {"id": "calc_n", "name": "Calculate N", "order": 1, "result_pattern": "N"},
                    {"id": "calc_mean", "name": "Calculate Mean", "order": 2, "result_pattern": "Mean"},
                    {"id": "calc_std", "name": "Calculate Standard Deviation", "order": 3, "result_pattern": "SD"},
                    {"id": "calc_median", "name": "Calculate Median", "order": 4, "result_pattern": "Median"},
                    {"id": "calc_min", "name": "Calculate Minimum", "order": 5, "result_pattern": "Min"},
                    {"id": "calc_max", "name": "Calculate Maximum", "order": 6, "result_pattern": "Max"}
                ],
                "code_templates": {
                    "SAS": {
                        "template": """
PROC MEANS DATA={{dataset}} N MEAN STD MEDIAN MIN MAX;
    CLASS {{group_vars}};
    VAR {{analysis_var}};
    OUTPUT OUT={{output_dataset}}
        N={{analysis_var}}_N
        MEAN={{analysis_var}}_MEAN
        STD={{analysis_var}}_STD
        MEDIAN={{analysis_var}}_MEDIAN
        MIN={{analysis_var}}_MIN
        MAX={{analysis_var}}_MAX;
RUN;
                        """,
                        "parameters": [
                            {"name": "dataset", "type": "string", "required": True, "description": "Input dataset name"},
                            {"name": "analysis_var", "type": "string", "required": True, "description": "Analysis variable name"},
                            {"name": "group_vars", "type": "string", "required": False, "description": "Grouping variables"},
                            {"name": "output_dataset", "type": "string", "required": True, "description": "Output dataset name"}
                        ]
                    },
                    "R": {
                        "template": """
library(dplyr)

{{output_name}} <- {{dataset}} %>%
    {{#group_vars}}group_by({{group_vars}}) %>%{{/group_vars}}
    summarise(
        N = n(),
        Mean = mean({{analysis_var}}, na.rm = TRUE),
        SD = sd({{analysis_var}}, na.rm = TRUE),
        Median = median({{analysis_var}}, na.rm = TRUE),
        Min = min({{analysis_var}}, na.rm = TRUE),
        Max = max({{analysis_var}}, na.rm = TRUE),
        .groups = 'drop'
    )
                        """,
                        "parameters": [
                            {"name": "dataset", "type": "string", "required": True, "description": "Input data frame"},
                            {"name": "analysis_var", "type": "string", "required": True, "description": "Analysis variable name"},
                            {"name": "group_vars", "type": "string", "required": False, "description": "Grouping variables"},
                            {"name": "output_name", "type": "string", "required": True, "description": "Output object name"}
                        ]
                    }
                }
            },
            {
                "id": "descriptive_categorical",
                "name": "Descriptive Statistics - Categorical Variables",
                "category": "descriptive",
                "description": "Calculate frequencies and percentages for categorical variables",
                "operations": [
                    {"id": "calc_freq", "name": "Calculate Frequencies", "order": 1, "result_pattern": "N"},
                    {"id": "calc_pct", "name": "Calculate Percentages", "order": 2, "result_pattern": "Pct"}
                ],
                "code_templates": {
                    "SAS": {
                        "template": """
PROC FREQ DATA={{dataset}};
    TABLES {{analysis_var}} {{#group_vars}}* {{group_vars}}{{/group_vars}} / OUT={{output_dataset}} OUTPCT;
RUN;
                        """,
                        "parameters": [
                            {"name": "dataset", "type": "string", "required": True, "description": "Input dataset name"},
                            {"name": "analysis_var", "type": "string", "required": True, "description": "Analysis variable name"},
                            {"name": "group_vars", "type": "string", "required": False, "description": "Grouping variables"},
                            {"name": "output_dataset", "type": "string", "required": True, "description": "Output dataset name"}
                        ]
                    }
                }
            },
            # Inferential Statistics Templates
            {
                "id": "ttest_two_sample",
                "name": "Two-Sample t-Test",
                "category": "inferential",
                "description": "Compare means between two independent groups",
                "operations": [
                    {"id": "test_normality", "name": "Test Normality", "order": 1, "result_pattern": "p_norm"},
                    {"id": "test_equality", "name": "Test Equality of Variances", "order": 2, "result_pattern": "p_var"},
                    {"id": "calc_ttest", "name": "Calculate t-Test", "order": 3, "result_pattern": "p_value"}
                ],
                "code_templates": {
                    "SAS": {
                        "template": """
PROC TTEST DATA={{dataset}} ALPHA={{alpha}};
    CLASS {{group_var}};
    VAR {{analysis_var}};
    OUTPUT OUT={{output_dataset}} T=T_STAT P=P_VALUE LCLM=LCLM UCLM=UCLM;
RUN;
                        """,
                        "parameters": [
                            {"name": "dataset", "type": "string", "required": True, "description": "Input dataset name"},
                            {"name": "analysis_var", "type": "string", "required": True, "description": "Analysis variable name"},
                            {"name": "group_var", "type": "string", "required": True, "description": "Grouping variable"},
                            {"name": "alpha", "type": "number", "required": False, "default": 0.05, "description": "Significance level"},
                            {"name": "output_dataset", "type": "string", "required": True, "description": "Output dataset name"}
                        ]
                    }
                }
            },
            # Survival Analysis Templates
            {
                "id": "kaplan_meier",
                "name": "Kaplan-Meier Survival Analysis",
                "category": "survival",
                "description": "Estimate survival probabilities using Kaplan-Meier method",
                "operations": [
                    {"id": "estimate_survival", "name": "Estimate Survival Curve", "order": 1, "result_pattern": "survival"},
                    {"id": "calc_median_survival", "name": "Calculate Median Survival", "order": 2, "result_pattern": "median_surv"},
                    {"id": "test_logrank", "name": "Log-rank Test", "order": 3, "result_pattern": "p_logrank"}
                ],
                "code_templates": {
                    "SAS": {
                        "template": """
PROC LIFETEST DATA={{dataset}} PLOTS=SURVIVAL(ATRISK) ALPHA={{alpha}};
    TIME {{time_var}} * {{censor_var}}({{censor_values}});
    STRATA {{group_var}};
    OUTPUT OUT={{output_dataset}} SURVIVAL=SURVIVAL LOWER=LOWER UPPER=UPPER;
RUN;
                        """,
                        "parameters": [
                            {"name": "dataset", "type": "string", "required": True, "description": "Input dataset name"},
                            {"name": "time_var", "type": "string", "required": True, "description": "Time to event variable"},
                            {"name": "censor_var", "type": "string", "required": True, "description": "Censoring indicator variable"},
                            {"name": "censor_values", "type": "string", "required": True, "description": "Values indicating censoring"},
                            {"name": "group_var", "type": "string", "required": False, "description": "Stratification variable"},
                            {"name": "alpha", "type": "number", "required": False, "default": 0.05, "description": "Significance level"},
                            {"name": "output_dataset", "type": "string", "required": True, "description": "Output dataset name"}
                        ]
                    }
                }
            },
            # Safety Analysis Templates
            {
                "id": "ae_summary",
                "name": "Adverse Event Summary",
                "category": "safety",
                "description": "Summarize adverse events by system organ class and preferred term",
                "operations": [
                    {"id": "count_subjects", "name": "Count Subjects with AEs", "order": 1, "result_pattern": "subj_ae"},
                    {"id": "count_events", "name": "Count Total Events", "order": 2, "result_pattern": "total_ae"},
                    {"id": "calc_incidence", "name": "Calculate Incidence Rate", "order": 3, "result_pattern": "incidence"}
                ],
                "code_templates": {
                    "SAS": {
                        "template": """
/* Count subjects with any AE */
PROC SQL;
    CREATE TABLE ae_subjects AS
    SELECT {{treatment_var}}, {{soc_var}}, {{pt_var}},
           COUNT(DISTINCT {{subject_var}}) AS subjects_with_ae,
           COUNT(*) AS total_events
    FROM {{dataset}}
    WHERE {{ae_flag}} = 'Y'
    GROUP BY {{treatment_var}}, {{soc_var}}, {{pt_var}};
QUIT;

/* Calculate incidence rates */
PROC SQL;
    CREATE TABLE {{output_dataset}} AS
    SELECT a.*, 
           a.subjects_with_ae / b.total_subjects * 100 AS incidence_rate
    FROM ae_subjects a
    LEFT JOIN (SELECT {{treatment_var}}, COUNT(DISTINCT {{subject_var}}) AS total_subjects
               FROM {{safety_pop}} GROUP BY {{treatment_var}}) b
    ON a.{{treatment_var}} = b.{{treatment_var}};
QUIT;
                        """,
                        "parameters": [
                            {"name": "dataset", "type": "string", "required": True, "description": "AE dataset name"},
                            {"name": "safety_pop", "type": "string", "required": True, "description": "Safety population dataset"},
                            {"name": "subject_var", "type": "string", "required": True, "description": "Subject identifier"},
                            {"name": "treatment_var", "type": "string", "required": True, "description": "Treatment variable"},
                            {"name": "soc_var", "type": "string", "required": True, "description": "System organ class variable"},
                            {"name": "pt_var", "type": "string", "required": True, "description": "Preferred term variable"},
                            {"name": "ae_flag", "type": "string", "required": True, "description": "AE flag variable"},
                            {"name": "output_dataset", "type": "string", "required": True, "description": "Output dataset name"}
                        ]
                    }
                }
            }
        ]
        
        if category:
            templates = [t for t in templates if t.get("category") == category]
        
        return templates
    
    def create_from_template(
        self, 
        db: Session, 
        *, 
        template_id: str, 
        method_data: Dict[str, Any]
    ) -> AnalysisMethod:
        """
        Create a method from a predefined template.
        """
        templates = self.get_templates(db)
        template = next((t for t in templates if t["id"] == template_id), None)
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template {template_id} not found"
            )
        
        # Create method from template
        method_create_data = {
            "id": method_data.get("id", f"{template_id}_{uuid4().hex[:8]}"),
            "name": method_data.get("name", template["name"]),
            "description": method_data.get("description", template["description"]),
            "label": method_data.get("label"),
            "reporting_event_id": method_data["reporting_event_id"],
            "code_template": json.dumps(template.get("code_templates", {}))
        }
        
        method_create = AnalysisMethodCreate(**method_create_data)
        method = self.create(db, obj_in=method_create)
        
        # Create operations from template
        for op_template in template.get("operations", []):
            operation_data = {
                "id": f"{method.id}_{op_template['id']}",
                "method_id": method.id,
                "name": op_template["name"],
                "description": op_template.get("description"),
                "order_num": op_template["order"],
                "result_pattern": op_template.get("result_pattern")
            }
            operation_create = OperationCreate(**operation_data)
            operation.create(db, obj_in=operation_create)
        
        return method
    
    def clone(
        self, 
        db: Session, 
        *, 
        id: str, 
        new_id: str, 
        new_name: str, 
        reporting_event_id: str
    ) -> AnalysisMethod:
        """
        Clone a method with all its operations and relationships.
        """
        original_method = self.get_with_relationships(db, id=id)
        if not original_method:
            raise ValueError(f"Method {id} not found")
        
        # Clone the method
        method_data = {
            "id": new_id,
            "name": new_name,
            "description": original_method.description,
            "label": original_method.label,
            "code_template": original_method.code_template,
            "reporting_event_id": reporting_event_id
        }
        cloned_method = self.create(db, obj_in=AnalysisMethodCreate(**method_data))
        
        # Clone operations
        operation_id_mapping = {}
        for orig_operation in original_method.operations:
            new_operation_id = f"{new_id}_{orig_operation.id.split('_', 1)[-1]}"
            operation_data = {
                "id": new_operation_id,
                "method_id": new_id,
                "name": orig_operation.name,
                "description": orig_operation.description,
                "label": orig_operation.label,
                "order_num": orig_operation.order_num,
                "result_pattern": orig_operation.result_pattern
            }
            cloned_operation = operation.create(db, obj_in=OperationCreate(**operation_data))
            operation_id_mapping[orig_operation.id] = cloned_operation.id
        
        # Clone operation relationships
        for orig_operation in original_method.operations:
            for relationship in orig_operation.referenced_relationships:
                if relationship.referenced_operation_id in operation_id_mapping:
                    relationship_data = {
                        "id": f"{operation_id_mapping[orig_operation.id]}_{relationship.id.split('_', 1)[-1]}",
                        "operation_id": operation_id_mapping[orig_operation.id],
                        "referenced_operation_role": relationship.referenced_operation_role,
                        "referenced_operation_id": operation_id_mapping[relationship.referenced_operation_id],
                        "description": relationship.description
                    }
                    operation_relationship.create(db, obj_in=OperationRelationshipCreate(**relationship_data))
        
        return cloned_method
    
    def get_code_template(
        self, 
        db: Session, 
        *, 
        method_id: str, 
        programming_context: str = "SAS"
    ) -> Dict[str, Any]:
        """
        Get the code template for a method in the specified programming context.
        """
        method = self.get(db, id=method_id)
        if not method:
            return {}
        
        try:
            code_templates = json.loads(method.code_template or "{}")
            template_data = code_templates.get(programming_context, {})
            
            return {
                "template": template_data.get("template", ""),
                "parameters": template_data.get("parameters", []),
                "description": template_data.get("description", ""),
                "example_usage": template_data.get("example_usage", "")
            }
        except json.JSONDecodeError:
            return {"template": method.code_template or "", "parameters": []}
    
    def update_code_template(
        self, 
        db: Session, 
        *, 
        method_id: str, 
        template_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update the code template for a method.
        """
        method = self.get(db, id=method_id)
        if not method:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Method not found"
            )
        
        try:
            existing_templates = json.loads(method.code_template or "{}")
        except json.JSONDecodeError:
            existing_templates = {}
        
        # Update the template for the specified programming context
        programming_context = template_data.get("programming_context", "SAS")
        existing_templates[programming_context] = {
            "template": template_data.get("template", ""),
            "parameters": template_data.get("parameters", []),
            "description": template_data.get("description", ""),
            "example_usage": template_data.get("example_usage", "")
        }
        
        # Update the method
        self.update(db, db_obj=method, obj_in={"code_template": json.dumps(existing_templates)})
        
        return existing_templates[programming_context]
    
    def get_operations(self, db: Session, *, method_id: str) -> List[Operation]:
        """
        Get all operations for a method with their relationships.
        """
        return db.query(Operation).options(
            selectinload(Operation.referenced_relationships),
            selectinload(Operation.referencing_relationships)
        ).filter(Operation.method_id == method_id).order_by(Operation.order_num).all()
    
    def reorder_operations(
        self, 
        db: Session, 
        *, 
        method_id: str, 
        operation_orders: List[Dict[str, Any]]
    ) -> List[Operation]:
        """
        Reorder operations within a method.
        """
        operations = []
        for order_data in operation_orders:
            operation_obj = operation.get(db, id=order_data["operation_id"])
            if operation_obj and operation_obj.method_id == method_id:
                operation.update(
                    db, 
                    db_obj=operation_obj, 
                    obj_in={"order_num": order_data["order_num"]}
                )
                operations.append(operation_obj)
        
        db.commit()
        return sorted(operations, key=lambda x: x.order_num)
    
    def get_parameters(self, db: Session, *, method_id: str) -> List[Dict[str, Any]]:
        """
        Get all configurable parameters for a method.
        """
        method = self.get(db, id=method_id)
        if not method:
            return []
        
        try:
            code_templates = json.loads(method.code_template or "{}")
            all_parameters = []
            
            for context, template_data in code_templates.items():
                parameters = template_data.get("parameters", [])
                for param in parameters:
                    param_copy = param.copy()
                    param_copy["programming_context"] = context
                    all_parameters.append(param_copy)
            
            # Remove duplicates based on parameter name
            unique_parameters = {}
            for param in all_parameters:
                param_name = param.get("name")
                if param_name and param_name not in unique_parameters:
                    unique_parameters[param_name] = param
            
            return list(unique_parameters.values())
        
        except json.JSONDecodeError:
            return []
    
    def update_parameters(
        self, 
        db: Session, 
        *, 
        method_id: str, 
        parameters: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Update the parameter definitions for a method.
        """
        method = self.get(db, id=method_id)
        if not method:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Method not found"
            )
        
        try:
            code_templates = json.loads(method.code_template or "{}")
            
            # Update parameters for each programming context
            for context, template_data in code_templates.items():
                template_data["parameters"] = parameters
            
            # Update the method
            self.update(db, db_obj=method, obj_in={"code_template": json.dumps(code_templates)})
            
            return parameters
        
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid code template format"
            )
    
    def validate(
        self, 
        db: Session, 
        *, 
        method_id: str, 
        options: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Validate a method definition for completeness and correctness.
        """
        method = self.get_with_relationships(db, id=method_id)
        if not method:
            return {"status": "error", "issues": ["Method not found"]}
        
        issues = []
        warnings = []
        suggestions = []
        score = 100
        
        # Check basic method information
        if not method.name:
            issues.append("Method name is required")
            score -= 20
        
        if not method.description:
            warnings.append("Method description is recommended")
            score -= 5
        
        # Check operations
        if not method.operations:
            issues.append("Method must have at least one operation")
            score -= 30
        else:
            # Check operation order and completeness
            operation_orders = [op.order_num for op in method.operations]
            if len(set(operation_orders)) != len(operation_orders):
                issues.append("Operation order numbers must be unique")
                score -= 15
            
            for operation_obj in method.operations:
                if not operation_obj.name:
                    issues.append(f"Operation {operation_obj.id} missing name")
                    score -= 10
                
                if not operation_obj.result_pattern:
                    warnings.append(f"Operation {operation_obj.id} missing result pattern")
                    score -= 2
        
        # Check code template
        if method.code_template:
            try:
                code_templates = json.loads(method.code_template)
                if not code_templates:
                    warnings.append("Code template is empty")
                    score -= 10
                else:
                    for context, template_data in code_templates.items():
                        if not template_data.get("template"):
                            warnings.append(f"Code template for {context} is empty")
                            score -= 5
                        
                        parameters = template_data.get("parameters", [])
                        if not parameters:
                            suggestions.append(f"Consider adding parameters for {context} template")
            except json.JSONDecodeError:
                issues.append("Invalid code template JSON format")
                score -= 25
        else:
            suggestions.append("Consider adding code templates for automatic code generation")
        
        # Determine overall status
        if issues:
            status = "error"
        elif warnings:
            status = "warning"
        else:
            status = "valid"
        
        return {
            "status": status,
            "issues": issues,
            "warnings": warnings,
            "suggestions": suggestions,
            "score": max(0, score)
        }
    
    def get_usage_statistics(self, db: Session, *, method_id: str) -> Dict[str, Any]:
        """
        Get usage statistics for a method across analyses.
        """
        # Count analyses using this method
        analysis_count = db.query(func.count(Analysis.id)).filter(
            Analysis.method_id == method_id
        ).scalar()
        
        # Get reporting events using this method
        reporting_events = db.query(Analysis.reporting_event_id).filter(
            Analysis.method_id == method_id
        ).distinct().all()
        
        return {
            "method_id": method_id,
            "analyses_count": analysis_count,
            "reporting_events_count": len(reporting_events),
            "reporting_event_ids": [re[0] for re in reporting_events]
        }
    
    def is_used_in_analyses(self, db: Session, *, method_id: str) -> bool:
        """
        Check if a method is used in any analyses.
        """
        return db.query(Analysis).filter(Analysis.method_id == method_id).first() is not None
    
    def advanced_search(
        self, 
        db: Session, 
        *, 
        criteria: Dict[str, Any], 
        skip: int = 0, 
        limit: int = 100
    ) -> List[AnalysisMethod]:
        """
        Advanced search for analysis methods with multiple criteria.
        """
        query = db.query(self.model)
        
        # Text search
        if criteria.get("query"):
            search_term = f"%{criteria['query']}%"
            query = query.filter(
                or_(
                    self.model.name.ilike(search_term),
                    self.model.description.ilike(search_term),
                    self.model.label.ilike(search_term)
                )
            )
        
        # Statistical category filter (from code template)
        if criteria.get("statistical_category"):
            # This would require extracting category from code template metadata
            pass
        
        # Programming context filter
        if criteria.get("programming_context"):
            context = criteria["programming_context"]
            query = query.filter(
                self.model.code_template.like(f'%"{context}"%')
            )
        
        # Has code template filter
        if criteria.get("has_code_template") is not None:
            if criteria["has_code_template"]:
                query = query.filter(
                    and_(
                        self.model.code_template.isnot(None),
                        self.model.code_template != ""
                    )
                )
            else:
                query = query.filter(
                    or_(
                        self.model.code_template.is_(None),
                        self.model.code_template == ""
                    )
                )
        
        # Reporting event filter
        if criteria.get("reporting_event_id"):
            query = query.filter(
                self.model.reporting_event_id == criteria["reporting_event_id"]
            )
        
        return query.offset(skip).limit(limit).all()
    
    def bulk_operations(
        self, 
        db: Session, 
        *, 
        operations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Perform bulk operations on multiple methods.
        """
        results = []
        
        for operation_data in operations:
            operation_type = operation_data.get("type")
            method_ids = operation_data.get("method_ids", [])
            
            try:
                if operation_type == "bulk_validate":
                    for method_id in method_ids:
                        validation_result = self.validate(db, method_id=method_id)
                        results.append({
                            "method_id": method_id,
                            "operation": "validate",
                            "result": validation_result
                        })
                
                elif operation_type == "bulk_delete":
                    for method_id in method_ids:
                        if not self.is_used_in_analyses(db, method_id=method_id):
                            self.remove(db, id=method_id)
                            results.append({
                                "method_id": method_id,
                                "operation": "delete",
                                "result": {"status": "success"}
                            })
                        else:
                            results.append({
                                "method_id": method_id,
                                "operation": "delete",
                                "result": {"status": "error", "message": "Method is used in analyses"}
                            })
                
                # Add more bulk operations as needed
                
            except Exception as e:
                results.append({
                    "method_id": method_ids,
                    "operation": operation_type,
                    "result": {"status": "error", "message": str(e)}
                })
        
        return results


class CRUDOperation(CRUDBase[Operation, OperationCreate, OperationUpdate]):
    """CRUD operations for Operations"""
    
    def is_referenced(self, db: Session, *, operation_id: str) -> bool:
        """
        Check if an operation is referenced by other operations.
        """
        return db.query(OperationRelationship).filter(
            OperationRelationship.referenced_operation_id == operation_id
        ).first() is not None


class CRUDOperationRelationship(CRUDBase[OperationRelationship, OperationRelationshipCreate, OperationRelationshipUpdate]):
    """CRUD operations for Operation Relationships"""
    pass


# Create instances
method = CRUDAnalysisMethod(AnalysisMethod)
operation = CRUDOperation(Operation)
operation_relationship = CRUDOperationRelationship(OperationRelationship)