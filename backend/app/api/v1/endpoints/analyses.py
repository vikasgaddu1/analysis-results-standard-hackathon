"""
Analysis endpoints for Clinical Trial Table Metadata System
"""

from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import analysis as crud_analysis
from app.db.session import get_db
from app.models.ars import User
from app.schemas.ars import Analysis, AnalysisCreate, AnalysisUpdate

router = APIRouter()


@router.get("/", response_model=dict)
def read_analyses(
    db: Session = Depends(get_db),
    params: deps.AnalysisQueryParams = Depends(),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve analyses.
    """
    filters = params.to_filters()
    
    # If reporting_event_id is provided, check access
    if params.reporting_event_id:
        deps.check_reporting_event_access(
            params.reporting_event_id, current_user, db, "viewer"
        )
    
    analyses = crud_analysis.analysis.get_multi(
        db,
        skip=params.skip,
        limit=params.limit,
        filters=filters,
        search=params.search,
        sort_by=params.sort_by,
        sort_order=params.sort_order
    )
    
    total_count = crud_analysis.analysis.count(
        db, 
        filters=filters,
        search=params.search
    )
    
    return deps.create_response_with_pagination(
        data=analyses,
        total_count=total_count,
        skip=params.skip,
        limit=params.limit
    )


@router.post("/", response_model=Analysis)
def create_analysis(
    *,
    db: Session = Depends(get_db),
    analysis_in: AnalysisCreate,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Create new analysis.
    """
    # Check access to reporting event
    deps.check_reporting_event_access(
        analysis_in.reporting_event_id, current_user, db, "editor"
    )
    
    analysis = crud_analysis.analysis.create(db, obj_in=analysis_in)
    return analysis


@router.get("/{analysis_id}", response_model=Analysis)
def read_analysis(
    *,
    db: Session = Depends(get_db),
    analysis_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get analysis by ID.
    """
    analysis = crud_analysis.analysis.get_with_relationships(
        db, id=analysis_id
    )
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        analysis.reporting_event_id, current_user, db, "viewer"
    )
    
    return analysis


@router.put("/{analysis_id}", response_model=Analysis)
def update_analysis(
    *,
    db: Session = Depends(get_db),
    analysis_id: str,
    analysis_in: AnalysisUpdate,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Update an existing analysis.
    """
    analysis = crud_analysis.analysis.get(db, id=analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        analysis.reporting_event_id, current_user, db, "editor"
    )
    
    analysis = crud_analysis.analysis.update(
        db, db_obj=analysis, obj_in=analysis_in
    )
    return analysis


@router.delete("/{analysis_id}")
def delete_analysis(
    *,
    db: Session = Depends(get_db),
    analysis_id: str,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Delete an analysis.
    """
    analysis = crud_analysis.analysis.get(db, id=analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        analysis.reporting_event_id, current_user, db, "editor"
    )
    
    crud_analysis.analysis.remove(db, id=analysis_id)
    return {"message": "Analysis deleted successfully"}


@router.post("/{analysis_id}/clone")
def clone_analysis(
    *,
    db: Session = Depends(get_db),
    analysis_id: str,
    new_id: str,
    new_name: str,
    reporting_event_id: str,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Clone an analysis.
    """
    analysis = crud_analysis.analysis.get(db, id=analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Check access to source reporting event
    deps.check_reporting_event_access(
        analysis.reporting_event_id, current_user, db, "viewer"
    )
    
    # Check access to target reporting event
    deps.check_reporting_event_access(
        reporting_event_id, current_user, db, "editor"
    )
    
    # Check if new ID already exists
    existing = crud_analysis.analysis.get(db, id=new_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Analysis with this ID already exists"
        )
    
    try:
        cloned_analysis = crud_analysis.analysis.clone(
            db, 
            id=analysis_id,
            new_id=new_id,
            new_name=new_name,
            reporting_event_id=reporting_event_id
        )
        return {"message": "Analysis cloned successfully", "analysis": cloned_analysis}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/{analysis_id}/results")
def read_analysis_results(
    *,
    db: Session = Depends(get_db),
    analysis_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get results for an analysis.
    """
    analysis = crud_analysis.analysis.get(db, id=analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        analysis.reporting_event_id, current_user, db, "viewer"
    )
    
    results = crud_analysis.analysis.get_results(db, analysis_id=analysis_id)
    return {"results": results, "count": len(results)}


@router.post("/{analysis_id}/results")
def create_analysis_result(
    *,
    db: Session = Depends(get_db),
    analysis_id: str,
    operation_id: str,
    raw_value: str = None,
    formatted_value: str = None,
    result_groups: List[dict] = None,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Add a result to an analysis.
    """
    analysis = crud_analysis.analysis.get(db, id=analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        analysis.reporting_event_id, current_user, db, "editor"
    )
    
    result = crud_analysis.analysis.add_result(
        db,
        analysis_id=analysis_id,
        operation_id=operation_id,
        raw_value=raw_value,
        formatted_value=formatted_value,
        result_groups=result_groups
    )
    
    return {"message": "Result added successfully", "result": result}


@router.delete("/{analysis_id}/results/{result_id}")
def delete_analysis_result(
    *,
    db: Session = Depends(get_db),
    analysis_id: str,
    result_id: UUID,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Remove a result from an analysis.
    """
    analysis = crud_analysis.analysis.get(db, id=analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        analysis.reporting_event_id, current_user, db, "editor"
    )
    
    success = crud_analysis.analysis.remove_result(db, result_id=result_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Result not found"
        )
    
    return {"message": "Result deleted successfully"}


@router.delete("/{analysis_id}/results")
def clear_analysis_results(
    *,
    db: Session = Depends(get_db),
    analysis_id: str,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Clear all results for an analysis.
    """
    analysis = crud_analysis.analysis.get(db, id=analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        analysis.reporting_event_id, current_user, db, "editor"
    )
    
    deleted_count = crud_analysis.analysis.clear_results(db, analysis_id=analysis_id)
    return {"message": f"Cleared {deleted_count} results"}


@router.post("/{analysis_id}/groupings")
def add_analysis_grouping(
    *,
    db: Session = Depends(get_db),
    analysis_id: str,
    grouping_id: str,
    order_num: int,
    results_by_group: bool = False,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Add a grouping to an analysis.
    """
    analysis = crud_analysis.analysis.get(db, id=analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        analysis.reporting_event_id, current_user, db, "editor"
    )
    
    ordered_grouping = crud_analysis.analysis.add_grouping(
        db,
        analysis_id=analysis_id,
        grouping_id=grouping_id,
        order_num=order_num,
        results_by_group=results_by_group
    )
    
    return {"message": "Grouping added successfully", "ordered_grouping": ordered_grouping}


@router.delete("/{analysis_id}/groupings/{grouping_id}")
def remove_analysis_grouping(
    *,
    db: Session = Depends(get_db),
    analysis_id: str,
    grouping_id: str,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Remove a grouping from an analysis.
    """
    analysis = crud_analysis.analysis.get(db, id=analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        analysis.reporting_event_id, current_user, db, "editor"
    )
    
    success = crud_analysis.analysis.remove_grouping(
        db, analysis_id=analysis_id, grouping_id=grouping_id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grouping not found in analysis"
        )
    
    return {"message": "Grouping removed successfully"}


@router.put("/{analysis_id}/groupings/reorder")
def reorder_analysis_groupings(
    *,
    db: Session = Depends(get_db),
    analysis_id: str,
    grouping_orders: List[dict],
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Reorder groupings for an analysis.
    Expected format: [{"grouping_id": "id1", "order_num": 1}, ...]
    """
    analysis = crud_analysis.analysis.get(db, id=analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        analysis.reporting_event_id, current_user, db, "editor"
    )
    
    updated_groupings = crud_analysis.analysis.reorder_groupings(
        db, analysis_id=analysis_id, grouping_orders=grouping_orders
    )
    
    return {"message": "Groupings reordered successfully", "groupings": updated_groupings}


@router.get("/{analysis_id}/statistics")
def get_analysis_statistics(
    *,
    db: Session = Depends(get_db),
    analysis_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get statistics for an analysis.
    """
    analysis = crud_analysis.analysis.get(db, id=analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Check access to reporting event
    deps.check_reporting_event_access(
        analysis.reporting_event_id, current_user, db, "viewer"
    )
    
    stats = crud_analysis.analysis.get_statistics(db, id=analysis_id)
    return {"statistics": stats}


@router.get("/search/text")
def search_analyses(
    *,
    db: Session = Depends(get_db),
    query: str,
    reporting_event_id: str = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Search analyses by text.
    """
    # If reporting_event_id is provided, check access
    if reporting_event_id:
        deps.check_reporting_event_access(
            reporting_event_id, current_user, db, "viewer"
        )
    
    analyses = crud_analysis.analysis.search(
        db,
        query=query,
        reporting_event_id=reporting_event_id,
        skip=skip,
        limit=limit
    )
    
    return {"analyses": analyses, "count": len(analyses), "query": query}