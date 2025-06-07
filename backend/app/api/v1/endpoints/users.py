"""
User management endpoints for Clinical Trial Table Metadata System
"""

from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import user as crud_user
from app.db.session import get_db
from app.models.ars import User
from app.schemas.ars import UserCreate, UserUpdate

router = APIRouter()


@router.get("/", response_model=dict)
def read_users(
    db: Session = Depends(get_db),
    params: deps.UserQueryParams = Depends(),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Retrieve users (Admin only).
    """
    filters = params.to_filters()
    
    users = crud_user.user.get_multi(
        db,
        skip=params.skip,
        limit=params.limit,
        filters=filters,
        search=params.search,
        sort_by=params.sort_by,
        sort_order=params.sort_order
    )
    
    total_count = crud_user.user.count(
        db, 
        filters=filters,
        search=params.search
    )
    
    return deps.create_response_with_pagination(
        data=users,
        total_count=total_count,
        skip=params.skip,
        limit=params.limit
    )


@router.post("/", response_model=User)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Create new user (Admin only).
    """
    user = crud_user.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system."
        )
    
    user = crud_user.user.create(db, obj_in=user_in)
    return user


@router.put("/{user_id}", response_model=User)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Update a user (Admin only).
    """
    user = crud_user.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user = crud_user.user.update(db, db_obj=user, obj_in=user_in)
    return user


@router.get("/{user_id}", response_model=User)
def read_user_by_id(
    user_id: UUID,
    current_user: User = Depends(deps.get_current_admin_user),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get a specific user by ID (Admin only).
    """
    user = crud_user.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.delete("/{user_id}")
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Delete a user (Admin only).
    """
    user = crud_user.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    crud_user.user.remove(db, id=user_id)
    return {"message": "User deleted successfully"}


@router.post("/{user_id}/activate")
def activate_user(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Activate a user (Admin only).
    """
    user = crud_user.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user = crud_user.user.update(db, db_obj=user, obj_in={"is_active": True})
    return {"message": "User activated successfully", "user": user}


@router.post("/{user_id}/deactivate")
def deactivate_user(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Deactivate a user (Admin only).
    """
    user = crud_user.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    user = crud_user.user.update(db, db_obj=user, obj_in={"is_active": False})
    
    # Invalidate all user sessions
    crud_user.user.delete_user_sessions(db, user_id=user.id)
    
    return {"message": "User deactivated successfully", "user": user}


@router.get("/{user_id}/sessions")
def get_user_sessions(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Get active sessions for a user (Admin only).
    """
    user = crud_user.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    sessions = crud_user.user.get_user_sessions(db, user_id=user_id)
    return {"sessions": sessions, "count": len(sessions)}


@router.delete("/{user_id}/sessions")
def invalidate_user_sessions(
    *,
    db: Session = Depends(get_db),
    user_id: UUID,
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Invalidate all sessions for a user (Admin only).
    """
    user = crud_user.user.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    deleted_count = crud_user.user.delete_user_sessions(db, user_id=user_id)
    return {"message": f"Invalidated {deleted_count} sessions"}


@router.get("/stats/summary")
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_admin_user),
) -> Any:
    """
    Get user statistics summary (Admin only).
    """
    from sqlalchemy import func
    from app.models.ars import User, ReportingEvent
    
    stats = {}
    
    # Total user count
    stats['total_users'] = db.query(func.count(User.id)).scalar()
    
    # Active user count
    stats['active_users'] = db.query(func.count(User.id)).filter(
        User.is_active == True
    ).scalar()
    
    # Users by role
    role_stats = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    stats['users_by_role'] = {role: count for role, count in role_stats}
    
    # Recent registrations (last 30 days)
    stats['recent_registrations'] = db.query(func.count(User.id)).filter(
        User.created_at >= func.now() - func.interval('30 days')
    ).scalar()
    
    # Users with reporting events
    stats['users_with_content'] = db.query(func.count(func.distinct(ReportingEvent.created_by))).scalar()
    
    return stats