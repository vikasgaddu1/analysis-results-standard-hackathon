from typing import Any, Dict, Generator, List, Optional, Union
from uuid import UUID

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.crud import user as crud_user
from app.db.session import get_db
from app.models.ars import User

# OAuth2 scheme for token authentication
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    """
    Decode JWT token and return current user.
    
    Args:
        db: Database session
        token: JWT access token
        
    Returns:
        Current user object
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials",
            )
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    user = crud_user.user.get(db, id=UUID(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get current active user.
    
    Args:
        current_user: Current user from token
        
    Returns:
        Current user object
        
    Raises:
        HTTPException: If user is inactive
    """
    if not crud_user.user.is_active(current_user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Get current admin user.
    
    Args:
        current_user: Current user object
        
    Returns:
        Current admin user object
        
    Raises:
        HTTPException: If user is not an admin
    """
    if not crud_user.user.is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    
    return current_user


def get_current_editor_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Get current user with editor or admin privileges.
    
    Args:
        current_user: Current user object
        
    Returns:
        Current user object with edit privileges
        
    Raises:
        HTTPException: If user doesn't have edit privileges
    """
    if current_user.role not in ["admin", "editor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have edit privileges"
        )
    
    return current_user


class CommonQueryParams:
    """
    Common query parameters for filtering and pagination.
    """
    def __init__(
        self,
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
        search: Optional[str] = Query(None, description="Search term for text fields"),
        sort_by: Optional[str] = Query(None, description="Field to sort by"),
        sort_order: str = Query("asc", pattern="^(asc|desc)$", description="Sort order"),
    ):
        self.skip = skip
        self.limit = limit
        self.search = search
        self.sort_by = sort_by
        self.sort_order = sort_order


class ReportingEventQueryParams(CommonQueryParams):
    """
    Query parameters specific to ReportingEvent endpoints.
    """
    def __init__(
        self,
        user_id: Optional[str] = Query(None, description="Filter by user ID"),
        is_locked: Optional[bool] = Query(None, description="Filter by lock status"),
        version: Optional[str] = Query(None, description="Filter by version"),
        **kwargs
    ):
        super().__init__(**kwargs)
        self.user_id = UUID(user_id) if user_id else None
        self.is_locked = is_locked
        self.version = version
        
    def to_filters(self) -> Dict[str, Any]:
        """Convert to filters dictionary for CRUD operations."""
        filters = {}
        if self.user_id is not None:
            filters['created_by'] = self.user_id
        if self.is_locked is not None:
            filters['is_locked'] = self.is_locked
        if self.version is not None:
            filters['version'] = self.version
        return filters


class AnalysisQueryParams(CommonQueryParams):
    """
    Query parameters specific to Analysis endpoints.
    """
    def __init__(
        self,
        reporting_event_id: Optional[str] = Query(None, description="Filter by reporting event ID"),
        method_id: Optional[str] = Query(None, description="Filter by method ID"),
        analysis_set_id: Optional[str] = Query(None, description="Filter by analysis set ID"),
        purpose: Optional[str] = Query(None, description="Filter by purpose"),
        reason: Optional[str] = Query(None, description="Filter by reason"),
        category_ids: Optional[List[str]] = Query(None, description="Filter by category IDs"),
        **kwargs
    ):
        super().__init__(**kwargs)
        self.reporting_event_id = reporting_event_id
        self.method_id = method_id
        self.analysis_set_id = analysis_set_id
        self.purpose = purpose
        self.reason = reason
        self.category_ids = category_ids
        
    def to_filters(self) -> Dict[str, Any]:
        """Convert to filters dictionary for CRUD operations."""
        filters = {}
        if self.reporting_event_id:
            filters['reporting_event_id'] = self.reporting_event_id
        if self.method_id:
            filters['method_id'] = self.method_id
        if self.analysis_set_id:
            filters['analysis_set_id'] = self.analysis_set_id
        if self.purpose:
            filters['purpose'] = self.purpose
        if self.reason:
            filters['reason'] = self.reason
        if self.category_ids:
            # For array fields, we need special handling in CRUD
            filters['category_ids'] = self.category_ids
        return filters


class OutputQueryParams(CommonQueryParams):
    """
    Query parameters specific to Output endpoints.
    """
    def __init__(
        self,
        reporting_event_id: Optional[str] = Query(None, description="Filter by reporting event ID"),
        category_ids: Optional[List[str]] = Query(None, description="Filter by category IDs"),
        version: Optional[str] = Query(None, description="Filter by version"),
        **kwargs
    ):
        super().__init__(**kwargs)
        self.reporting_event_id = reporting_event_id
        self.category_ids = category_ids
        self.version = version
        
    def to_filters(self) -> Dict[str, Any]:
        """Convert to filters dictionary for CRUD operations."""
        filters = {}
        if self.reporting_event_id:
            filters['reporting_event_id'] = self.reporting_event_id
        if self.version:
            filters['version'] = self.version
        if self.category_ids:
            filters['category_ids'] = self.category_ids
        return filters


class MethodQueryParams(CommonQueryParams):
    """
    Query parameters specific to Method endpoints.
    """
    def __init__(
        self,
        reporting_event_id: Optional[str] = Query(None, description="Filter by reporting event ID"),
        statistical_category: Optional[str] = Query(None, description="Filter by statistical category"),
        programming_context: Optional[str] = Query(None, description="Filter by programming context"),
        has_code_template: Optional[bool] = Query(None, description="Filter methods with code templates"),
        **kwargs
    ):
        super().__init__(**kwargs)
        self.reporting_event_id = reporting_event_id
        self.statistical_category = statistical_category
        self.programming_context = programming_context
        self.has_code_template = has_code_template
        
    def to_filters(self) -> Dict[str, Any]:
        """Convert to filters dictionary for CRUD operations."""
        filters = {}
        if self.reporting_event_id:
            filters['reporting_event_id'] = self.reporting_event_id
        if self.statistical_category:
            filters['statistical_category'] = self.statistical_category
        if self.programming_context:
            filters['programming_context'] = self.programming_context
        if self.has_code_template is not None:
            filters['has_code_template'] = self.has_code_template
        return filters


class UserQueryParams(CommonQueryParams):
    """
    Query parameters specific to User endpoints.
    """
    def __init__(
        self,
        role: Optional[str] = Query(None, pattern="^(admin|editor|viewer)$", description="Filter by role"),
        is_active: Optional[bool] = Query(None, description="Filter by active status"),
        **kwargs
    ):
        super().__init__(**kwargs)
        self.role = role
        self.is_active = is_active
        
    def to_filters(self) -> Dict[str, Any]:
        """Convert to filters dictionary for CRUD operations."""
        filters = {}
        if self.role:
            filters['role'] = self.role
        if self.is_active is not None:
            filters['is_active'] = self.is_active
        return filters


def check_reporting_event_access(
    reporting_event_id: str,
    user: User,
    db: Session,
    required_role: str = "viewer"
) -> bool:
    """
    Check if user has access to a specific reporting event.
    
    Args:
        reporting_event_id: ReportingEvent ID
        user: Current user
        db: Database session
        required_role: Required role level (viewer, editor, admin)
        
    Returns:
        True if user has access
        
    Raises:
        HTTPException: If access is denied
    """
    from app.crud import reporting_event as crud_reporting_event
    
    # Admin users have access to everything
    if user.role == "admin":
        return True
    
    # Check if reporting event exists
    reporting_event = crud_reporting_event.reporting_event.get(db, id=reporting_event_id)
    if not reporting_event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ReportingEvent not found"
        )
    
    # Check role requirements
    role_hierarchy = {"viewer": 1, "editor": 2, "admin": 3}
    user_level = role_hierarchy.get(user.role, 0)
    required_level = role_hierarchy.get(required_role, 3)
    
    if user_level < required_level:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient privileges. {required_role} role required."
        )
    
    # Check if user is the creator or if it's a locked event
    if reporting_event.is_locked and user.role != "admin":
        if reporting_event.created_by != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify locked reporting event"
            )
    
    return True


def get_pagination_metadata(
    total_count: int,
    skip: int,
    limit: int
) -> Dict[str, Any]:
    """
    Generate pagination metadata for API responses.
    
    Args:
        total_count: Total number of records
        skip: Number of records skipped
        limit: Records per page
        
    Returns:
        Pagination metadata dictionary
    """
    total_pages = (total_count + limit - 1) // limit
    current_page = (skip // limit) + 1
    
    return {
        "total_count": total_count,
        "page_size": limit,
        "current_page": current_page,
        "total_pages": total_pages,
        "has_next": current_page < total_pages,
        "has_previous": current_page > 1
    }


def create_response_with_pagination(
    data: List[Any],
    total_count: int,
    skip: int,
    limit: int
) -> Dict[str, Any]:
    """
    Create a standardized paginated response.
    
    Args:
        data: List of data items
        total_count: Total number of records
        skip: Number of records skipped
        limit: Records per page
        
    Returns:
        Standardized response dictionary
    """
    return {
        "data": data,
        "pagination": get_pagination_metadata(total_count, skip, limit)
    }