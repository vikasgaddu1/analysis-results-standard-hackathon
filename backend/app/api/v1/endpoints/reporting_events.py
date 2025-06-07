"""
ReportingEvent endpoints for Clinical Trial Table Metadata System
"""

from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import reporting_event as crud_reporting_event
from app.db.session import get_db
from app.models.ars import User
from app.schemas.ars import ReportingEvent, ReportingEventCreate, ReportingEventUpdate

router = APIRouter()


@router.get("/", response_model=dict)
def read_reporting_events(
    db: Session = Depends(get_db),
    params: deps.ReportingEventQueryParams = Depends(),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve reporting events.
    """
    filters = params.to_filters()
    
    # Non-admin users can only see their own reporting events by default
    if current_user.role != "admin" and not params.user_id:
        filters['created_by'] = current_user.id
    
    reporting_events = crud_reporting_event.reporting_event.get_multi(
        db,
        skip=params.skip,
        limit=params.limit,
        filters=filters,
        search=params.search,
        sort_by=params.sort_by,
        sort_order=params.sort_order
    )
    
    total_count = crud_reporting_event.reporting_event.count(
        db, 
        filters=filters,
        search=params.search
    )
    
    return deps.create_response_with_pagination(
        data=reporting_events,
        total_count=total_count,
        skip=params.skip,
        limit=params.limit
    )


@router.post("/", response_model=ReportingEvent)
def create_reporting_event(
    *,
    db: Session = Depends(get_db),
    reporting_event_in: ReportingEventCreate,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Create new reporting event.
    """
    # Set the creator
    reporting_event_in.created_by = current_user.id
    
    reporting_event = crud_reporting_event.reporting_event.create(
        db, obj_in=reporting_event_in
    )
    return reporting_event


@router.get("/{reporting_event_id}", response_model=ReportingEvent)
def read_reporting_event(
    *,
    db: Session = Depends(get_db),
    reporting_event_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get reporting event by ID.
    """
    deps.check_reporting_event_access(
        reporting_event_id, current_user, db, "viewer"
    )
    
    reporting_event = crud_reporting_event.reporting_event.get_with_relationships(
        db, id=reporting_event_id
    )
    if not reporting_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ReportingEvent not found"
        )
    
    return reporting_event


@router.put("/{reporting_event_id}", response_model=ReportingEvent)
def update_reporting_event(
    *,
    db: Session = Depends(get_db),
    reporting_event_id: str,
    reporting_event_in: ReportingEventUpdate,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Update an existing reporting event.
    """
    deps.check_reporting_event_access(
        reporting_event_id, current_user, db, "editor"
    )
    
    reporting_event = crud_reporting_event.reporting_event.get(
        db, id=reporting_event_id
    )
    if not reporting_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ReportingEvent not found"
        )
    
    reporting_event = crud_reporting_event.reporting_event.update(
        db, db_obj=reporting_event, obj_in=reporting_event_in
    )
    return reporting_event


@router.delete("/{reporting_event_id}")
def delete_reporting_event(
    *,
    db: Session = Depends(get_db),
    reporting_event_id: str,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Delete a reporting event.
    """
    deps.check_reporting_event_access(
        reporting_event_id, current_user, db, "editor"
    )
    
    reporting_event = crud_reporting_event.reporting_event.get(
        db, id=reporting_event_id
    )
    if not reporting_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ReportingEvent not found"
        )
    
    # Check if reporting event is locked
    if reporting_event.is_locked and current_user.role != "admin":
        if reporting_event.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot delete locked reporting event"
            )
    
    crud_reporting_event.reporting_event.remove(db, id=reporting_event_id)
    return {"message": "ReportingEvent deleted successfully"}


@router.post("/{reporting_event_id}/lock")
def lock_reporting_event(
    *,
    db: Session = Depends(get_db),
    reporting_event_id: str,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Lock a reporting event to prevent modifications.
    """
    deps.check_reporting_event_access(
        reporting_event_id, current_user, db, "editor"
    )
    
    reporting_event = crud_reporting_event.reporting_event.lock(
        db, id=reporting_event_id
    )
    if not reporting_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ReportingEvent not found"
        )
    
    return {"message": "ReportingEvent locked successfully", "reporting_event": reporting_event}


@router.post("/{reporting_event_id}/unlock")
def unlock_reporting_event(
    *,
    db: Session = Depends(get_db),
    reporting_event_id: str,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Unlock a reporting event (Admin only).
    """
    reporting_event = crud_reporting_event.reporting_event.unlock(
        db, id=reporting_event_id
    )
    if not reporting_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ReportingEvent not found"
        )
    
    return {"message": "ReportingEvent unlocked successfully", "reporting_event": reporting_event}


@router.post("/{reporting_event_id}/clone")
def clone_reporting_event(
    *,
    db: Session = Depends(get_db),
    reporting_event_id: str,
    new_id: str,
    new_name: str,
    current_user: User = Depends(deps.get_current_editor_user),
) -> Any:
    """
    Clone a reporting event.
    """
    deps.check_reporting_event_access(
        reporting_event_id, current_user, db, "viewer"
    )
    
    # Check if new ID already exists
    existing = crud_reporting_event.reporting_event.get(db, id=new_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ReportingEvent with this ID already exists"
        )
    
    try:
        cloned_event = crud_reporting_event.reporting_event.clone(
            db, 
            id=reporting_event_id,
            new_id=new_id,
            new_name=new_name,
            user_id=current_user.id
        )
        return {"message": "ReportingEvent cloned successfully", "reporting_event": cloned_event}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/{reporting_event_id}/versions")
def get_reporting_event_versions(
    *,
    db: Session = Depends(get_db),
    reporting_event_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all versions of a reporting event.
    """
    deps.check_reporting_event_access(
        reporting_event_id, current_user, db, "viewer"
    )
    
    versions = crud_reporting_event.reporting_event.get_versions(
        db, base_id=reporting_event_id
    )
    
    return {"versions": versions, "count": len(versions)}


@router.get("/{reporting_event_id}/children")
def get_reporting_event_children(
    *,
    db: Session = Depends(get_db),
    reporting_event_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get child reporting events.
    """
    deps.check_reporting_event_access(
        reporting_event_id, current_user, db, "viewer"
    )
    
    children = crud_reporting_event.reporting_event.get_children(
        db, parent_id=reporting_event_id
    )
    
    return {"children": children, "count": len(children)}


@router.get("/{reporting_event_id}/statistics")
def get_reporting_event_statistics(
    *,
    db: Session = Depends(get_db),
    reporting_event_id: str,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get statistics for a reporting event.
    """
    deps.check_reporting_event_access(
        reporting_event_id, current_user, db, "viewer"
    )
    
    stats = crud_reporting_event.reporting_event.get_statistics(
        db, id=reporting_event_id
    )
    
    return {"statistics": stats}


@router.get("/stats/summary")
def get_reporting_events_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get reporting events summary statistics.
    """
    from sqlalchemy import func
    from app.models.ars import ReportingEvent
    
    stats = {}
    
    # Base query - filter by user if not admin
    base_query = db.query(ReportingEvent)
    if current_user.role != "admin":
        base_query = base_query.filter(ReportingEvent.created_by == current_user.id)
    
    # Total count
    stats['total_count'] = base_query.count()
    
    # Locked vs unlocked
    stats['locked_count'] = base_query.filter(
        ReportingEvent.is_locked == True
    ).count()
    stats['unlocked_count'] = stats['total_count'] - stats['locked_count']
    
    # Recent activity (last 30 days)
    stats['recent_count'] = base_query.filter(
        ReportingEvent.created_at >= func.now() - func.interval('30 days')
    ).count()
    
    # With parent (versions)
    stats['versions_count'] = base_query.filter(
        ReportingEvent.parent_id.isnot(None)
    ).count()
    
    return {"summary": stats}