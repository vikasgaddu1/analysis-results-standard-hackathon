"""
API endpoints for Where Clause management
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api import deps
from app.crud.where_clause import crud_where_clause, crud_where_clause_library
from app.models.ars import User
from app.schemas.ars import (
    WhereClause, WhereClauseCreate, WhereClauseConditionBase, 
    WhereClauseCompoundExpressionBase, MessageResponse
)

router = APIRouter()


@router.post("/", response_model=WhereClause)
def create_where_clause(
    *,
    db: Session = Depends(deps.get_db),
    where_clause_in: WhereClauseCreate,
    current_user: User = Depends(deps.get_current_active_user)
) -> WhereClause:
    """Create a new where clause with condition or compound expression"""
    try:
        where_clause = crud_where_clause.create_with_details(db, obj_in=where_clause_in)
        return where_clause
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating where clause: {str(e)}"
        )


@router.get("/{where_clause_id}", response_model=WhereClause)
def get_where_clause(
    where_clause_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> WhereClause:
    """Get a specific where clause by ID"""
    where_clause = crud_where_clause.get(db, id=where_clause_id)
    if not where_clause:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Where clause not found"
        )
    return where_clause


@router.get("/", response_model=List[WhereClause])
def get_where_clauses_by_parent(
    parent_type: str = Query(..., description="Type of parent entity"),
    parent_id: str = Query(..., description="ID of parent entity"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> List[WhereClause]:
    """Get all where clauses for a specific parent entity"""
    where_clauses = crud_where_clause.get_by_parent(
        db, parent_type=parent_type, parent_id=parent_id
    )
    return where_clauses


@router.put("/{where_clause_id}/condition", response_model=WhereClause)
def update_where_clause_condition(
    where_clause_id: UUID,
    condition_data: WhereClauseConditionBase,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> WhereClause:
    """Update the condition of a where clause"""
    where_clause = crud_where_clause.update_condition(
        db, where_clause_id=where_clause_id, condition_data=condition_data
    )
    if not where_clause:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Where clause not found or not a condition type"
        )
    return where_clause


@router.put("/{where_clause_id}/compound-expression", response_model=WhereClause)
def update_where_clause_compound_expression(
    where_clause_id: UUID,
    expression_data: WhereClauseCompoundExpressionBase,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> WhereClause:
    """Update the compound expression of a where clause"""
    where_clause = crud_where_clause.update_compound_expression(
        db, where_clause_id=where_clause_id, expression_data=expression_data
    )
    if not where_clause:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Where clause not found or not a compound expression type"
        )
    return where_clause


@router.delete("/{where_clause_id}", response_model=MessageResponse)
def delete_where_clause(
    where_clause_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> MessageResponse:
    """Delete a where clause"""
    where_clause = crud_where_clause.get(db, id=where_clause_id)
    if not where_clause:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Where clause not found"
        )
    
    crud_where_clause.remove(db, id=where_clause_id)
    return MessageResponse(message="Where clause deleted successfully")


@router.post("/{where_clause_id}/clone", response_model=WhereClause)
def clone_where_clause(
    where_clause_id: UUID,
    new_parent_type: str = Query(..., description="Type of new parent entity"),
    new_parent_id: str = Query(..., description="ID of new parent entity"),
    new_level: int = Query(..., description="Level in new hierarchy"),
    new_order_num: int = Query(..., description="Order number in new hierarchy"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> WhereClause:
    """Clone a where clause to a new parent"""
    cloned_clause = crud_where_clause.clone_where_clause(
        db,
        source_id=where_clause_id,
        new_parent_type=new_parent_type,
        new_parent_id=new_parent_id,
        new_level=new_level,
        new_order_num=new_order_num
    )
    if not cloned_clause:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source where clause not found"
        )
    return cloned_clause


@router.post("/validate", response_model=Dict[str, Any])
def validate_where_clause_condition(
    condition: WhereClauseConditionBase,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Dict[str, Any]:
    """Validate a where clause condition"""
    validation_result = crud_where_clause.validate_condition(db, condition=condition)
    return validation_result


@router.get("/templates/", response_model=List[WhereClause])
def get_template_where_clauses(
    dataset: Optional[str] = Query(None, description="Filter by dataset"),
    variable: Optional[str] = Query(None, description="Filter by variable"),
    limit: int = Query(20, ge=1, le=100, description="Number of templates to return"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> List[WhereClause]:
    """Get template where clauses for reuse"""
    templates = crud_where_clause.get_template_clauses(
        db, dataset=dataset, variable=variable, limit=limit
    )
    return templates


@router.get("/search/", response_model=List[WhereClause])
def search_where_clauses(
    q: str = Query(..., min_length=2, description="Search term"),
    parent_type: Optional[str] = Query(None, description="Filter by parent type"),
    limit: int = Query(50, ge=1, le=100, description="Number of results to return"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> List[WhereClause]:
    """Search where clauses by various criteria"""
    results = crud_where_clause.search_clauses(
        db, search_term=q, parent_type=parent_type, limit=limit
    )
    return results


@router.get("/statistics/", response_model=Dict[str, Any])
def get_where_clause_statistics(
    parent_type: Optional[str] = Query(None, description="Filter by parent type"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Dict[str, Any]:
    """Get usage statistics for where clauses"""
    stats = crud_where_clause.get_statistics(db, parent_type=parent_type)
    return stats


# Library endpoints
@router.post("/library/templates/", response_model=Dict[str, Any])
def save_where_clause_template(
    where_clause_id: UUID,
    name: str = Query(..., description="Template name"),
    description: str = Query(..., description="Template description"),
    tags: List[str] = Query([], description="Template tags"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Dict[str, Any]:
    """Save a where clause as a reusable template"""
    result = crud_where_clause_library.save_template(
        db, name=name, description=description, where_clause_id=where_clause_id, tags=tags
    )
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    return result


@router.get("/library/templates/", response_model=List[Dict[str, Any]])
def get_where_clause_templates(
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    current_user: User = Depends(deps.get_current_active_user)
) -> List[Dict[str, Any]]:
    """Get saved where clause templates"""
    templates = crud_where_clause_library.get_templates(tags=tags, search=search)
    return templates


@router.delete("/library/templates/{template_id}", response_model=MessageResponse)
def delete_where_clause_template(
    template_id: str,
    current_user: User = Depends(deps.get_current_active_user)
) -> MessageResponse:
    """Delete a where clause template"""
    success = crud_where_clause_library.delete_template(template_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    return MessageResponse(message="Template deleted successfully")


@router.post("/library/templates/{template_id}/apply", response_model=WhereClause)
def apply_where_clause_template(
    template_id: str,
    parent_type: str = Query(..., description="Type of parent entity"),
    parent_id: str = Query(..., description="ID of parent entity"),
    level: int = Query(..., description="Level in hierarchy"),
    order_num: int = Query(..., description="Order number in hierarchy"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> WhereClause:
    """Apply a template to create a new where clause"""
    where_clause = crud_where_clause_library.apply_template(
        db,
        template_id=template_id,
        parent_type=parent_type,
        parent_id=parent_id,
        level=level,
        order_num=order_num
    )
    if not where_clause:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    return where_clause


# CDISC dataset and variable endpoints
@router.get("/datasets/", response_model=List[Dict[str, Any]])
def get_cdisc_datasets(
    domain: Optional[str] = Query(None, description="Filter by domain"),
    current_user: User = Depends(deps.get_current_active_user)
) -> List[Dict[str, Any]]:
    """Get available CDISC datasets"""
    # This would typically come from a CDISC metadata service or database
    # For now, return common SDTM domains
    datasets = [
        {"name": "DM", "label": "Demographics", "domain": "SPECIAL", "description": "Subject demographics data"},
        {"name": "AE", "label": "Adverse Events", "domain": "EVENTS", "description": "Adverse event data"},
        {"name": "CM", "label": "Concomitant Medications", "domain": "INTERVENTIONS", "description": "Concomitant medication data"},
        {"name": "EX", "label": "Exposure", "domain": "INTERVENTIONS", "description": "Exposure data"},
        {"name": "LB", "label": "Laboratory Test Results", "domain": "FINDINGS", "description": "Laboratory test results"},
        {"name": "VS", "label": "Vital Signs", "domain": "FINDINGS", "description": "Vital signs measurements"},
        {"name": "EG", "label": "ECG Test Results", "domain": "FINDINGS", "description": "Electrocardiogram results"},
        {"name": "PE", "label": "Physical Examinations", "domain": "FINDINGS", "description": "Physical examination findings"},
        {"name": "MH", "label": "Medical History", "domain": "EVENTS", "description": "Medical history data"},
        {"name": "SU", "label": "Substance Use", "domain": "EVENTS", "description": "Substance use data"}
    ]
    
    if domain:
        datasets = [d for d in datasets if d["domain"] == domain]
    
    return datasets


@router.get("/datasets/{dataset_name}/variables", response_model=List[Dict[str, Any]])
def get_dataset_variables(
    dataset_name: str,
    variable_type: Optional[str] = Query(None, description="Filter by variable type"),
    current_user: User = Depends(deps.get_current_active_user)
) -> List[Dict[str, Any]]:
    """Get variables for a specific dataset"""
    # This would typically come from a CDISC metadata service
    # For now, return common variables based on dataset
    
    common_vars = [
        {"name": "STUDYID", "label": "Study Identifier", "type": "IDENTIFIER", "data_type": "text"},
        {"name": "DOMAIN", "label": "Domain Abbreviation", "type": "IDENTIFIER", "data_type": "text"},
        {"name": "USUBJID", "label": "Unique Subject Identifier", "type": "IDENTIFIER", "data_type": "text"},
        {"name": "SUBJID", "label": "Subject Identifier for the Study", "type": "IDENTIFIER", "data_type": "text"}
    ]
    
    dataset_specific_vars = {
        "DM": [
            {"name": "RFSTDTC", "label": "Subject Reference Start Date/Time", "type": "TIMING", "data_type": "datetime"},
            {"name": "RFENDTC", "label": "Subject Reference End Date/Time", "type": "TIMING", "data_type": "datetime"},
            {"name": "SITEID", "label": "Study Site Identifier", "type": "IDENTIFIER", "data_type": "text"},
            {"name": "AGE", "label": "Age", "type": "FINDING", "data_type": "numeric"},
            {"name": "AGEU", "label": "Age Units", "type": "VARIABLE_QUALIFIER", "data_type": "text"},
            {"name": "SEX", "label": "Sex", "type": "FINDING", "data_type": "text"},
            {"name": "RACE", "label": "Race", "type": "FINDING", "data_type": "text"},
            {"name": "ETHNIC", "label": "Ethnicity", "type": "FINDING", "data_type": "text"}
        ],
        "AE": [
            {"name": "AETERM", "label": "Reported Term for the Adverse Event", "type": "TOPIC", "data_type": "text"},
            {"name": "AEDECOD", "label": "Dictionary-Derived Term", "type": "SYNONYM_QUALIFIER", "data_type": "text"},
            {"name": "AEBODSYS", "label": "Body System or Organ Class", "type": "GROUPING_QUALIFIER", "data_type": "text"},
            {"name": "AESEV", "label": "Severity/Intensity", "type": "FINDING", "data_type": "text"},
            {"name": "AESER", "label": "Serious Event", "type": "FINDING", "data_type": "text"},
            {"name": "AESTDTC", "label": "Start Date/Time of Adverse Event", "type": "TIMING", "data_type": "datetime"},
            {"name": "AEENDTC", "label": "End Date/Time of Adverse Event", "type": "TIMING", "data_type": "datetime"}
        ],
        "LB": [
            {"name": "LBTESTCD", "label": "Lab Test Short Name", "type": "TOPIC", "data_type": "text"},
            {"name": "LBTEST", "label": "Lab Test Name", "type": "SYNONYM_QUALIFIER", "data_type": "text"},
            {"name": "LBCAT", "label": "Category for Lab Test", "type": "GROUPING_QUALIFIER", "data_type": "text"},
            {"name": "LBORRES", "label": "Result or Finding in Original Units", "type": "FINDING", "data_type": "text"},
            {"name": "LBORRESU", "label": "Original Units", "type": "VARIABLE_QUALIFIER", "data_type": "text"},
            {"name": "LBSTRESC", "label": "Character Result/Finding in Std Format", "type": "FINDING", "data_type": "text"},
            {"name": "LBSTRESN", "label": "Numeric Result/Finding in Standard Units", "type": "FINDING", "data_type": "numeric"},
            {"name": "LBSTRESU", "label": "Standard Units", "type": "VARIABLE_QUALIFIER", "data_type": "text"}
        ],
        "VS": [
            {"name": "VSTESTCD", "label": "Vital Signs Test Short Name", "type": "TOPIC", "data_type": "text"},
            {"name": "VSTEST", "label": "Vital Signs Test Name", "type": "SYNONYM_QUALIFIER", "data_type": "text"},
            {"name": "VSPOS", "label": "Vital Signs Position of Subject", "type": "RECORD_QUALIFIER", "data_type": "text"},
            {"name": "VSORRES", "label": "Result or Finding in Original Units", "type": "FINDING", "data_type": "text"},
            {"name": "VSORRESU", "label": "Original Units", "type": "VARIABLE_QUALIFIER", "data_type": "text"},
            {"name": "VSSTRESC", "label": "Character Result/Finding in Std Format", "type": "FINDING", "data_type": "text"},
            {"name": "VSSTRESN", "label": "Numeric Result/Finding in Standard Units", "type": "FINDING", "data_type": "numeric"},
            {"name": "VSSTRESU", "label": "Standard Units", "type": "VARIABLE_QUALIFIER", "data_type": "text"}
        ]
    }
    
    variables = common_vars + dataset_specific_vars.get(dataset_name.upper(), [])
    
    if variable_type:
        variables = [v for v in variables if v["type"] == variable_type]
    
    return variables


@router.get("/datasets/{dataset_name}/variables/{variable_name}/values", response_model=List[str])
def get_variable_values(
    dataset_name: str,
    variable_name: str,
    limit: int = Query(100, ge=1, le=1000, description="Number of values to return"),
    current_user: User = Depends(deps.get_current_active_user)
) -> List[str]:
    """Get possible values for a specific variable"""
    # This would typically come from actual data or metadata
    # For now, return sample values based on common variables
    
    sample_values = {
        "SEX": ["M", "F"],
        "AESEV": ["MILD", "MODERATE", "SEVERE"],
        "AESER": ["Y", "N"],
        "RACE": ["WHITE", "BLACK OR AFRICAN AMERICAN", "ASIAN", "AMERICAN INDIAN OR ALASKA NATIVE", "OTHER"],
        "ETHNIC": ["HISPANIC OR LATINO", "NOT HISPANIC OR LATINO"],
        "VSTESTCD": ["SYSBP", "DIABP", "PULSE", "TEMP", "RESP", "HEIGHT", "WEIGHT"],
        "LBTESTCD": ["ALT", "AST", "BILI", "CREAT", "HGB", "HCT", "WBC", "PLAT"],
        "DOMAIN": [dataset_name.upper()],
        "AGEU": ["YEARS"],
        "VSORRESU": ["mmHg", "beats/min", "C", "/min", "cm", "kg"],
        "LBORRESU": ["U/L", "mg/dL", "g/dL", "%", "10^9/L", "10^3/uL"]
    }
    
    values = sample_values.get(variable_name.upper(), [])
    return values[:limit]