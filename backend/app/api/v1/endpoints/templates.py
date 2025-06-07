"""
API endpoints for Template Management System

Provides RESTful endpoints for:
- Template CRUD operations
- Template search and filtering
- Version management
- Usage tracking
- Rating and reviews
- Sharing and collaboration
"""

from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.models.user import User
from app.schemas.template import (
    TemplateCreate, TemplateUpdate, TemplateInDB, TemplateList, TemplateFilter,
    TemplateCategoryCreate, TemplateCategoryUpdate, TemplateCategoryInDB, TemplateCategoryTree,
    TemplateVersionCreate, TemplateVersionInDB, TemplateVersionList,
    TemplateUsageCreate, TemplateUsageInDB, TemplateUsageStats,
    TemplateRatingCreate, TemplateRatingUpdate, TemplateRatingInDB, TemplateRatingSummary,
    TemplateShareRequest, TemplateShareResponse,
    TemplateExport, TemplateImport,
    TemplateType, TemplateStatus, TemplateAccessLevel
)

router = APIRouter()


# ============================================
# TEMPLATE ENDPOINTS
# ============================================

@router.post("/", response_model=TemplateInDB)
def create_template(
    *,
    db: Session = Depends(deps.get_db),
    template_in: TemplateCreate,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create a new template.
    """
    template = crud.crud_template.create_with_owner(
        db=db, obj_in=template_in, user_id=current_user.id
    )
    return template


@router.get("/", response_model=TemplateList)
def list_templates(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    type: Optional[TemplateType] = None,
    status: Optional[TemplateStatus] = None,
    access_level: Optional[TemplateAccessLevel] = None,
    category_id: Optional[UUID] = None,
    created_by: Optional[UUID] = None,
    organization_id: Optional[UUID] = None,
    team_id: Optional[UUID] = None,
    keywords: Optional[List[str]] = Query(None),
    regulatory_compliance: Optional[List[str]] = Query(None),
    therapeutic_areas: Optional[List[str]] = Query(None),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    search: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|updated_at|name|usage_count|average_rating)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: Optional[User] = Depends(deps.get_current_user)
) -> Any:
    """
    Retrieve templates with filtering and pagination.
    """
    filters = TemplateFilter(
        type=type,
        status=status,
        access_level=access_level,
        category_id=category_id,
        created_by=created_by,
        organization_id=organization_id,
        team_id=team_id,
        keywords=keywords,
        regulatory_compliance=regulatory_compliance,
        therapeutic_areas=therapeutic_areas,
        min_rating=min_rating,
        search=search
    )
    
    templates = crud.crud_template.get_multi_with_filters(
        db=db,
        skip=skip,
        limit=limit,
        filters=filters,
        user_id=current_user.id if current_user else None,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    total = crud.crud_template.count(db=db, filters=filters.dict(exclude_none=True))
    
    return TemplateList(
        templates=templates,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/{template_id}", response_model=TemplateInDB)
def get_template(
    *,
    db: Session = Depends(deps.get_db),
    template_id: UUID,
    current_user: Optional[User] = Depends(deps.get_current_user)
) -> Any:
    """
    Get template by ID.
    """
    template = crud.crud_template.get(db=db, id=template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Check access permissions
    if template.access_level == TemplateAccessLevel.PRIVATE:
        if not current_user or template.created_by != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    
    return template


@router.put("/{template_id}", response_model=TemplateInDB)
def update_template(
    *,
    db: Session = Depends(deps.get_db),
    template_id: UUID,
    template_in: TemplateUpdate,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update a template.
    """
    template = crud.crud_template.get(db=db, id=template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Check permissions
    if template.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    template = crud.crud_template.update(db=db, db_obj=template, obj_in=template_in)
    return template


@router.delete("/{template_id}")
def delete_template(
    *,
    db: Session = Depends(deps.get_db),
    template_id: UUID,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Delete a template.
    """
    template = crud.crud_template.get(db=db, id=template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Check permissions
    if template.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    crud.crud_template.remove(db=db, id=template_id)
    return {"success": True}


@router.post("/{template_id}/clone", response_model=TemplateInDB)
def clone_template(
    *,
    db: Session = Depends(deps.get_db),
    template_id: UUID,
    new_name: str = Body(...),
    new_description: Optional[str] = Body(None),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Clone an existing template.
    """
    new_template = crud.crud_template.clone_template(
        db=db,
        template_id=template_id,
        user_id=current_user.id,
        new_name=new_name,
        new_description=new_description
    )
    return new_template


# ============================================
# TEMPLATE CATEGORY ENDPOINTS
# ============================================

@router.post("/categories/", response_model=TemplateCategoryInDB)
def create_category(
    *,
    db: Session = Depends(deps.get_db),
    category_in: TemplateCategoryCreate,
    current_user: User = Depends(deps.get_current_admin)
) -> Any:
    """
    Create a new template category (admin only).
    """
    category = crud.crud_template_category.create(db=db, obj_in=category_in)
    return category


@router.get("/categories/", response_model=List[TemplateCategoryInDB])
def list_categories(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    include_inactive: bool = False
) -> Any:
    """
    List all template categories.
    """
    filters = {} if include_inactive else {"is_active": True}
    categories = crud.crud_template_category.get_multi(
        db=db, skip=skip, limit=limit, filters=filters
    )
    return categories


@router.get("/categories/tree", response_model=List[TemplateCategoryTree])
def get_category_tree(
    db: Session = Depends(deps.get_db),
    parent_id: Optional[UUID] = None
) -> Any:
    """
    Get category tree structure.
    """
    categories = crud.crud_template_category.get_tree(db=db, parent_id=parent_id)
    return categories


@router.get("/categories/{category_id}", response_model=TemplateCategoryInDB)
def get_category(
    *,
    db: Session = Depends(deps.get_db),
    category_id: UUID
) -> Any:
    """
    Get template category by ID.
    """
    category = crud.crud_template_category.get(db=db, id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category


@router.put("/categories/{category_id}", response_model=TemplateCategoryInDB)
def update_category(
    *,
    db: Session = Depends(deps.get_db),
    category_id: UUID,
    category_in: TemplateCategoryUpdate,
    current_user: User = Depends(deps.get_current_admin)
) -> Any:
    """
    Update a template category (admin only).
    """
    category = crud.crud_template_category.get(db=db, id=category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    category = crud.crud_template_category.update(db=db, db_obj=category, obj_in=category_in)
    return category


# ============================================
# TEMPLATE VERSION ENDPOINTS
# ============================================

@router.post("/{template_id}/versions", response_model=TemplateVersionInDB)
def create_version(
    *,
    db: Session = Depends(deps.get_db),
    template_id: UUID,
    version_in: TemplateVersionCreate,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create a new version of a template.
    """
    template = crud.crud_template.get(db=db, id=template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Check permissions
    if template.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    version = crud.crud_template_version.create_version(
        db=db,
        template_id=template_id,
        obj_in=version_in,
        user_id=current_user.id
    )
    return version


@router.get("/{template_id}/versions", response_model=TemplateVersionList)
def list_versions(
    *,
    db: Session = Depends(deps.get_db),
    template_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    List all versions of a template.
    """
    versions = crud.crud_template_version.get_by_template(
        db=db,
        template_id=template_id,
        skip=skip,
        limit=limit
    )
    
    total = crud.crud_template_version.count(
        db=db,
        filters={"template_id": template_id}
    )
    
    return TemplateVersionList(
        versions=versions,
        total=total
    )


@router.get("/versions/{version_id}", response_model=TemplateVersionInDB)
def get_version(
    *,
    db: Session = Depends(deps.get_db),
    version_id: UUID
) -> Any:
    """
    Get a specific template version.
    """
    version = crud.crud_template_version.get(db=db, id=version_id)
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Version not found"
        )
    return version


# ============================================
# TEMPLATE USAGE ENDPOINTS
# ============================================

@router.post("/{template_id}/usage", response_model=TemplateUsageInDB)
def track_usage(
    *,
    db: Session = Depends(deps.get_db),
    template_id: UUID,
    usage_in: TemplateUsageCreate,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Track template usage.
    """
    usage = crud.crud_template_usage.track_usage(
        db=db,
        obj_in=usage_in,
        user_id=current_user.id
    )
    return usage


@router.get("/{template_id}/usage/stats", response_model=TemplateUsageStats)
def get_usage_stats(
    *,
    db: Session = Depends(deps.get_db),
    template_id: UUID,
    days: int = Query(30, ge=1, le=365)
) -> Any:
    """
    Get usage statistics for a template.
    """
    stats = crud.crud_template_usage.get_usage_stats(
        db=db,
        template_id=template_id,
        days=days
    )
    return TemplateUsageStats(**stats)


# ============================================
# TEMPLATE RATING ENDPOINTS
# ============================================

@router.post("/{template_id}/ratings", response_model=TemplateRatingInDB)
def rate_template(
    *,
    db: Session = Depends(deps.get_db),
    template_id: UUID,
    rating_in: TemplateRatingCreate,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Rate a template.
    """
    rating = crud.crud_template_rating.create_or_update(
        db=db,
        obj_in=rating_in,
        user_id=current_user.id
    )
    return rating


@router.get("/{template_id}/ratings", response_model=List[TemplateRatingInDB])
def list_ratings(
    *,
    db: Session = Depends(deps.get_db),
    template_id: UUID,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    List ratings for a template.
    """
    ratings = crud.crud_template_rating.get_multi(
        db=db,
        skip=skip,
        limit=limit,
        filters={"template_id": template_id}
    )
    return ratings


@router.get("/{template_id}/ratings/summary", response_model=TemplateRatingSummary)
def get_rating_summary(
    *,
    db: Session = Depends(deps.get_db),
    template_id: UUID
) -> Any:
    """
    Get rating summary for a template.
    """
    summary = crud.crud_template_rating.get_summary(
        db=db,
        template_id=template_id
    )
    return TemplateRatingSummary(**summary)


@router.put("/ratings/{rating_id}", response_model=TemplateRatingInDB)
def update_rating(
    *,
    db: Session = Depends(deps.get_db),
    rating_id: UUID,
    rating_in: TemplateRatingUpdate,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update your rating.
    """
    rating = crud.crud_template_rating.get(db=db, id=rating_id)
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found"
        )
    
    # Check permissions
    if rating.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    rating = crud.crud_template_rating.update(db=db, db_obj=rating, obj_in=rating_in)
    return rating


@router.post("/ratings/{rating_id}/helpful")
def mark_rating_helpful(
    *,
    db: Session = Depends(deps.get_db),
    rating_id: UUID,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Mark a rating as helpful.
    """
    success = crud.crud_template_rating.mark_helpful(
        db=db,
        rating_id=rating_id,
        user_id=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found"
        )
    
    return {"success": True}


# ============================================
# TEMPLATE SHARING ENDPOINTS
# ============================================

@router.post("/{template_id}/share", response_model=TemplateShareResponse)
def share_template(
    *,
    db: Session = Depends(deps.get_db),
    template_id: UUID,
    share_request: TemplateShareRequest,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Share a template with teams or users.
    """
    template = crud.crud_template.get(db=db, id=template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Check permissions
    if template.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Implementation would handle sharing logic
    # For now, return a placeholder response
    return TemplateShareResponse(
        shared_with_teams=share_request.team_ids or [],
        shared_with_users=share_request.user_emails or [],
        share_url=f"/templates/{template_id}"
    )


# ============================================
# TEMPLATE EXPORT/IMPORT ENDPOINTS
# ============================================

@router.get("/{template_id}/export", response_model=TemplateExport)
def export_template(
    *,
    db: Session = Depends(deps.get_db),
    template_id: UUID,
    include_usage_stats: bool = False,
    include_ratings: bool = False,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Export a template.
    """
    template = crud.crud_template.get(db=db, id=template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    # Get versions
    versions = crud.crud_template_version.get_by_template(
        db=db,
        template_id=template_id
    )
    
    return TemplateExport(
        template=template,
        versions=versions,
        include_usage_stats=include_usage_stats,
        include_ratings=include_ratings
    )


@router.post("/import", response_model=TemplateInDB)
def import_template(
    *,
    db: Session = Depends(deps.get_db),
    import_data: TemplateImport,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Import a template.
    """
    # Implementation would handle import logic
    # For now, return a placeholder response
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Template import not yet implemented"
    )