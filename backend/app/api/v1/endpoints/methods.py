"""
Analysis Method endpoints for Clinical Trial Table Metadata System
Comprehensive method library features for statistical analysis methods
"""

from typing import Any, List, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import method as crud_method
from app.db.session import get_db
from app.models.ars import User
from app.schemas.ars import (
    AnalysisMethod, AnalysisMethodCreate, AnalysisMethodUpdate,
    Operation, OperationCreate, OperationUpdate,
    OperationRelationship, OperationRelationshipCreate,
    PageRef, MessageResponse
)

router = APIRouter()


@router.get("/", response_model=dict)
def read_methods(
    db: Session = Depends(get_db),
    params: deps.MethodQueryParams = Depends(),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve analysis methods with comprehensive filtering and search.
    
    Supports filtering by:
    - reporting_event_id
    - method templates/categories
    - statistical technique types
    - programming contexts
    
    Search across method names, descriptions, and operation details.
    """
    filters = params.to_filters()
    
    # If reporting_event_id is provided, check access
    if params.reporting_event_id:
        deps.check_reporting_event_access(
            params.reporting_event_id, current_user, db, "viewer"
        )
    
    methods = crud_method.method.get_multi(
        db,
        skip=params.skip,
        limit=params.limit,
        filters=filters,
        search=params.search,
        sort_by=params.sort_by,
        sort_order=params.sort_order
    )
    
    total_count = crud_method.method.count(
        db, 
        filters=filters,
        search=params.search
    )
    
    return deps.create_response_with_pagination(
        data=methods,
        total_count=total_count,
        skip=params.skip,
        limit=params.limit
    )


@router.post("/", response_model=AnalysisMethod)
def create_method(
    *,
    db: Session = Depends(get_db),
    method_in: AnalysisMethodCreate,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Create a new analysis method.
    """
    # Check access to reporting event
    deps.check_reporting_event_access(
        method_in.reporting_event_id, current_user, db, "editor"
    )
    
    method = crud_method.method.create(db, obj_in=method_in)
    return method


@router.get("/templates", response_model=List[Dict[str, Any]])
def get_method_templates(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None, description="Filter by statistical category"),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get predefined method templates organized by statistical categories.
    
    Returns templates for common statistical methods like:
    - Descriptive statistics (mean, median, counts, percentages)
    - Inferential statistics (t-tests, chi-square, ANOVA)
    - Survival analysis (Kaplan-Meier, Cox regression)
    - Safety analysis (AE summaries, lab shift tables)
    """
    templates = crud_method.method.get_templates(db, category=category)
    return templates


@router.post("/from-template", response_model=AnalysisMethod)
def create_method_from_template(
    *,
    db: Session = Depends(get_db),
    template_id: str,
    method_data: Dict[str, Any],
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Create a new method from a predefined template.
    
    Templates provide pre-configured operations, code templates,
    and parameter definitions for common statistical methods.
    """
    # Check access to reporting event
    if "reporting_event_id" in method_data:
        deps.check_reporting_event_access(
            method_data["reporting_event_id"], current_user, db, "editor"
        )
    
    method = crud_method.method.create_from_template(
        db, template_id=template_id, method_data=method_data
    )
    return method


@router.get("/{method_id}", response_model=AnalysisMethod)
def read_method(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get method by ID with all related operations and relationships.
    """
    method = crud_method.method.get_with_relationships(
        db, id=method_id
    )
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "viewer"
    )
    
    return method


@router.put("/{method_id}", response_model=AnalysisMethod)
def update_method(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    method_in: AnalysisMethodUpdate,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Update an existing analysis method.
    """
    method = crud_method.method.get(db, id=method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "editor"
    )
    
    method = crud_method.method.update(
        db, db_obj=method, obj_in=method_in
    )
    return method


@router.delete("/{method_id}")
def delete_method(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Delete an analysis method.
    """
    method = crud_method.method.get(db, id=method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "editor"
    )
    
    # Check if method is used in any analyses
    if crud_method.method.is_used_in_analyses(db, method_id=method_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete method: it is used in existing analyses"
        )
    
    crud_method.method.remove(db, id=method_id)
    return {"message": "Analysis method deleted successfully"}


@router.post("/{method_id}/clone")
def clone_method(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    new_id: str,
    new_name: str,
    reporting_event_id: str,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Clone an analysis method to create a new version.
    """
    method = crud_method.method.get(db, id=method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to source reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "viewer"
    )
    
    # Check access to target reporting event
    deps.check_reporting_event_access(
        reporting_event_id, current_user, db, "editor"
    )
    
    # Check if new ID already exists
    existing = crud_method.method.get(db, id=new_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Method with this ID already exists"
        )
    
    try:
        cloned_method = crud_method.method.clone(
            db, 
            id=method_id,
            new_id=new_id,
            new_name=new_name,
            reporting_event_id=reporting_event_id
        )
        return {"message": "Method cloned successfully", "method": cloned_method}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/{method_id}/code-template", response_model=Dict[str, Any])
def get_method_code_template(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    programming_context: str = Query("SAS", description="Programming context (SAS, R, Python, etc.)"),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get the code template for a method in the specified programming context.
    
    Returns parameterized code templates with placeholders for:
    - Dataset names
    - Variable names
    - Analysis parameters
    - Output specifications
    """
    method = crud_method.method.get(db, id=method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "viewer"
    )
    
    code_template = crud_method.method.get_code_template(
        db, method_id=method_id, programming_context=programming_context
    )
    
    return {
        "method_id": method_id,
        "programming_context": programming_context,
        "template": code_template.get("template", ""),
        "parameters": code_template.get("parameters", []),
        "description": code_template.get("description", ""),
        "example_usage": code_template.get("example_usage", "")
    }


@router.put("/{method_id}/code-template")
def update_method_code_template(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    template_data: Dict[str, Any],
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Update the code template for a method.
    
    Allows customization of:
    - Template code with parameter placeholders
    - Parameter definitions and defaults
    - Documentation and examples
    """
    method = crud_method.method.get(db, id=method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "editor"
    )
    
    updated_template = crud_method.method.update_code_template(
        db, method_id=method_id, template_data=template_data
    )
    
    return {"message": "Code template updated successfully", "template": updated_template}


@router.get("/{method_id}/operations", response_model=List[Operation])
def read_method_operations(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all operations for a method with their relationships.
    """
    method = crud_method.method.get(db, id=method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "viewer"
    )
    
    operations = crud_method.method.get_operations(db, method_id=method_id)
    return operations


@router.post("/{method_id}/operations", response_model=Operation)
def create_method_operation(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    operation_in: OperationCreate,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Add a new operation to a method.
    """
    method = crud_method.method.get(db, id=method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "editor"
    )
    
    # Set method_id in operation data
    operation_in.method_id = method_id
    
    operation = crud_method.operation.create(db, obj_in=operation_in)
    return operation


@router.put("/{method_id}/operations/{operation_id}", response_model=Operation)
def update_method_operation(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    operation_id: str,
    operation_in: OperationUpdate,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Update an operation in a method.
    """
    method = crud_method.method.get(db, id=method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "editor"
    )
    
    operation = crud_method.operation.get(db, id=operation_id)
    if not operation or operation.method_id != method_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operation not found in this method"
        )
    
    operation = crud_method.operation.update(
        db, db_obj=operation, obj_in=operation_in
    )
    return operation


@router.delete("/{method_id}/operations/{operation_id}")
def delete_method_operation(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    operation_id: str,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Remove an operation from a method.
    """
    method = crud_method.method.get(db, id=method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "editor"
    )
    
    operation = crud_method.operation.get(db, id=operation_id)
    if not operation or operation.method_id != method_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operation not found in this method"
        )
    
    # Check if operation is referenced by other operations
    if crud_method.operation.is_referenced(db, operation_id=operation_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete operation: it is referenced by other operations"
        )
    
    crud_method.operation.remove(db, id=operation_id)
    return {"message": "Operation deleted successfully"}


@router.post("/{method_id}/operations/reorder")
def reorder_method_operations(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    operation_orders: List[Dict[str, Any]],
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Reorder operations within a method.
    Expected format: [{"operation_id": "id1", "order_num": 1}, ...]
    """
    method = crud_method.method.get(db, id=method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "editor"
    )
    
    updated_operations = crud_method.method.reorder_operations(
        db, method_id=method_id, operation_orders=operation_orders
    )
    
    return {"message": "Operations reordered successfully", "operations": updated_operations}


@router.get("/{method_id}/parameters", response_model=List[Dict[str, Any]])
def get_method_parameters(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all configurable parameters for a method.
    
    Returns parameter definitions including:
    - Parameter name and description
    - Data type and validation rules
    - Default values
    - Required/optional status
    """
    method = crud_method.method.get(db, id=method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "viewer"
    )
    
    parameters = crud_method.method.get_parameters(db, method_id=method_id)
    return parameters


@router.put("/{method_id}/parameters")
def update_method_parameters(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    parameters: List[Dict[str, Any]],
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Update the parameter definitions for a method.
    """
    method = crud_method.method.get(db, id=method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "editor"
    )
    
    updated_parameters = crud_method.method.update_parameters(
        db, method_id=method_id, parameters=parameters
    )
    
    return {"message": "Parameters updated successfully", "parameters": updated_parameters}


@router.post("/{method_id}/validate")
def validate_method(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    validation_options: Dict[str, Any] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Validate a method definition for completeness and correctness.
    
    Checks:
    - Operation dependencies and relationships
    - Parameter definitions and consistency
    - Code template syntax and parameter usage
    - Statistical method appropriateness
    """
    method = crud_method.method.get(db, id=method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "viewer"
    )
    
    validation_result = crud_method.method.validate(
        db, method_id=method_id, options=validation_options or {}
    )
    
    return {
        "method_id": method_id,
        "validation_status": validation_result.get("status", "unknown"),
        "issues": validation_result.get("issues", []),
        "warnings": validation_result.get("warnings", []),
        "suggestions": validation_result.get("suggestions", []),
        "score": validation_result.get("score", 0)
    }


@router.get("/{method_id}/usage-statistics")
def get_method_usage_statistics(
    *,
    db: Session = Depends(get_db),
    method_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get usage statistics for a method across analyses.
    """
    method = crud_method.method.get(db, id=method_id)
    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis method not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        method.reporting_event_id, current_user, db, "viewer"
    )
    
    usage_stats = crud_method.method.get_usage_statistics(db, method_id=method_id)
    return usage_stats


@router.get("/search/advanced")
def advanced_method_search(
    *,
    db: Session = Depends(get_db),
    query: str = Query(..., description="Search query"),
    statistical_category: Optional[str] = Query(None, description="Statistical method category"),
    programming_context: Optional[str] = Query(None, description="Programming language/context"),
    has_code_template: Optional[bool] = Query(None, description="Filter methods with code templates"),
    reporting_event_id: Optional[str] = Query(None, description="Reporting event scope"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Advanced search for analysis methods with multiple criteria.
    """
    # If reporting_event_id is provided, check access
    if reporting_event_id:
        deps.check_reporting_event_access(
            reporting_event_id, current_user, db, "viewer"
        )
    
    search_criteria = {
        "query": query,
        "statistical_category": statistical_category,
        "programming_context": programming_context,
        "has_code_template": has_code_template,
        "reporting_event_id": reporting_event_id
    }
    
    methods = crud_method.method.advanced_search(
        db,
        criteria=search_criteria,
        skip=skip,
        limit=limit
    )
    
    return {
        "methods": methods,
        "count": len(methods),
        "search_criteria": search_criteria
    }


@router.post("/bulk-operations")
def bulk_method_operations(
    *,
    db: Session = Depends(get_db),
    operations: List[Dict[str, Any]],
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Perform bulk operations on multiple methods.
    
    Supported operations:
    - bulk_update: Update multiple methods
    - bulk_delete: Delete multiple methods
    - bulk_clone: Clone multiple methods
    - bulk_validate: Validate multiple methods
    """
    if not operations:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No operations specified"
        )
    
    results = crud_method.method.bulk_operations(db, operations=operations)
    return {"results": results}