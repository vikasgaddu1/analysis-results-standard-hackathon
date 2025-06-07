"""
CRUD operations for Template Management System

Provides database operations for templates including:
- Template CRUD with advanced filtering
- Version management and history
- Usage tracking and analytics
- Rating and review management
- Sharing and access control
"""

from typing import Any, Dict, List, Optional, Union
from uuid import UUID
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import and_, or_, func, desc, asc, select
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy.exc import IntegrityError

from app.crud.base import CRUDBase
from app.models.template import (
    Template, TemplateCategory, TemplateVersion, TemplateUsage, TemplateRating,
    Team, Organization, template_tags, template_team_access,
    TemplateType, TemplateStatus, TemplateAccessLevel
)
from app.schemas.template import (
    TemplateCreate, TemplateUpdate, TemplateFilter,
    TemplateCategoryCreate, TemplateCategoryUpdate,
    TemplateVersionCreate,
    TemplateUsageCreate,
    TemplateRatingCreate, TemplateRatingUpdate,
    TemplateShareRequest
)


class CRUDTemplate(CRUDBase[Template, TemplateCreate, TemplateUpdate]):
    """CRUD operations for templates"""
    
    def create_with_owner(
        self, 
        db: Session, 
        *, 
        obj_in: TemplateCreate, 
        user_id: UUID
    ) -> Template:
        """Create a new template with owner"""
        obj_in_data = obj_in.dict()
        db_obj = Template(**obj_in_data, created_by=user_id)
        
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            
            # Create initial version
            version = TemplateVersion(
                template_id=db_obj.id,
                version=db_obj.version,
                content=db_obj.content,
                config=db_obj.config,
                parameters=db_obj.parameters,
                created_by=user_id,
                is_major_version=True
            )
            db.add(version)
            db.commit()
            
            return db_obj
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template creation failed: {str(e)}"
            )
    
    def get_multi_with_filters(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[TemplateFilter] = None,
        user_id: Optional[UUID] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> List[Template]:
        """Get templates with advanced filtering"""
        query = db.query(Template).options(
            selectinload(Template.category),
            selectinload(Template.creator),
            selectinload(Template.ratings)
        )
        
        if filters:
            # Type filter
            if filters.type:
                query = query.filter(Template.type == filters.type)
            
            # Status filter
            if filters.status:
                query = query.filter(Template.status == filters.status)
            
            # Access level filter
            if filters.access_level:
                query = query.filter(Template.access_level == filters.access_level)
            
            # Category filter
            if filters.category_id:
                query = query.filter(Template.category_id == filters.category_id)
            
            # Creator filter
            if filters.created_by:
                query = query.filter(Template.created_by == filters.created_by)
            
            # Organization filter
            if filters.organization_id:
                query = query.filter(Template.organization_id == filters.organization_id)
            
            # Team filter
            if filters.team_id:
                query = query.filter(Template.team_id == filters.team_id)
            
            # Keywords filter
            if filters.keywords:
                keyword_filters = []
                for keyword in filters.keywords:
                    keyword_filters.append(Template.keywords.contains([keyword]))
                query = query.filter(or_(*keyword_filters))
            
            # Regulatory compliance filter
            if filters.regulatory_compliance:
                compliance_filters = []
                for compliance in filters.regulatory_compliance:
                    compliance_filters.append(Template.regulatory_compliance.contains([compliance]))
                query = query.filter(or_(*compliance_filters))
            
            # Therapeutic areas filter
            if filters.therapeutic_areas:
                area_filters = []
                for area in filters.therapeutic_areas:
                    area_filters.append(Template.therapeutic_areas.contains([area]))
                query = query.filter(or_(*area_filters))
            
            # Minimum rating filter
            if filters.min_rating:
                query = query.filter(Template.average_rating >= filters.min_rating)
            
            # Search filter
            if filters.search:
                search_filters = []
                search_term = f"%{filters.search}%"
                search_filters.extend([
                    Template.name.ilike(search_term),
                    Template.description.ilike(search_term)
                ])
                query = query.filter(or_(*search_filters))
        
        # Access control - filter based on user permissions
        if user_id:
            access_filters = [
                Template.access_level == TemplateAccessLevel.PUBLIC,
                Template.created_by == user_id
            ]
            
            # Add team access
            team_access_subquery = (
                db.query(template_team_access.c.template_id)
                .join(Team, Team.id == template_team_access.c.team_id)
                .filter(Team.id.in_(
                    db.query(Team.id).filter(Team.members.any(id=user_id))
                ))
            )
            access_filters.append(Template.id.in_(team_access_subquery))
            
            query = query.filter(or_(*access_filters))
        else:
            # Non-authenticated users can only see public templates
            query = query.filter(Template.access_level == TemplateAccessLevel.PUBLIC)
        
        # Apply sorting
        sort_column = getattr(Template, sort_by, Template.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))
        
        return query.offset(skip).limit(limit).all()
    
    def update_usage_count(self, db: Session, *, template_id: UUID) -> None:
        """Update template usage count and last used timestamp"""
        db.query(Template).filter(Template.id == template_id).update({
            "usage_count": Template.usage_count + 1,
            "last_used_at": datetime.utcnow()
        })
        db.commit()
    
    def update_rating_stats(self, db: Session, *, template_id: UUID) -> None:
        """Update template rating statistics"""
        rating_stats = db.query(
            func.avg(TemplateRating.rating).label('avg_rating'),
            func.count(TemplateRating.id).label('count')
        ).filter(TemplateRating.template_id == template_id).first()
        
        if rating_stats:
            db.query(Template).filter(Template.id == template_id).update({
                "average_rating": rating_stats.avg_rating or 0.0,
                "rating_count": rating_stats.count or 0
            })
            db.commit()
    
    def clone_template(
        self,
        db: Session,
        *,
        template_id: UUID,
        user_id: UUID,
        new_name: str,
        new_description: Optional[str] = None
    ) -> Template:
        """Clone an existing template"""
        # Get original template
        original = db.query(Template).filter(Template.id == template_id).first()
        if not original:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Create new template based on original
        new_template = Template(
            name=new_name,
            description=new_description or f"Cloned from {original.name}",
            type=original.type,
            category_id=original.category_id,
            content=original.content,
            config=original.config,
            parameters=original.parameters,
            version="1.0.0",
            status=TemplateStatus.DRAFT,
            access_level=TemplateAccessLevel.PRIVATE,
            keywords=original.keywords,
            regulatory_compliance=original.regulatory_compliance,
            therapeutic_areas=original.therapeutic_areas,
            created_by=user_id
        )
        
        try:
            db.add(new_template)
            db.commit()
            db.refresh(new_template)
            
            # Create initial version
            version = TemplateVersion(
                template_id=new_template.id,
                version="1.0.0",
                content=new_template.content,
                config=new_template.config,
                parameters=new_template.parameters,
                created_by=user_id,
                change_summary=f"Cloned from template {original.name}",
                is_major_version=True
            )
            db.add(version)
            
            # Track usage
            usage = TemplateUsage(
                template_id=original.id,
                used_by=user_id,
                usage_type="cloned",
                target_type="template",
                target_id=new_template.id
            )
            db.add(usage)
            
            db.commit()
            return new_template
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template clone failed: {str(e)}"
            )


class CRUDTemplateCategory(CRUDBase[TemplateCategory, TemplateCategoryCreate, TemplateCategoryUpdate]):
    """CRUD operations for template categories"""
    
    def get_tree(self, db: Session, *, parent_id: Optional[UUID] = None) -> List[TemplateCategory]:
        """Get category tree structure"""
        query = db.query(TemplateCategory).options(
            selectinload(TemplateCategory.subcategories)
        )
        
        if parent_id:
            query = query.filter(TemplateCategory.parent_id == parent_id)
        else:
            query = query.filter(TemplateCategory.parent_id.is_(None))
        
        return query.filter(TemplateCategory.is_active == True).order_by(TemplateCategory.order_num).all()
    
    def get_with_template_count(self, db: Session, *, category_id: UUID) -> Dict[str, Any]:
        """Get category with template count"""
        category = db.query(TemplateCategory).filter(TemplateCategory.id == category_id).first()
        if not category:
            return None
        
        template_count = db.query(func.count(Template.id)).filter(
            Template.category_id == category_id,
            Template.status == TemplateStatus.PUBLISHED
        ).scalar()
        
        return {
            "category": category,
            "template_count": template_count
        }


class CRUDTemplateVersion(CRUDBase[TemplateVersion, TemplateVersionCreate, Dict[str, Any]]):
    """CRUD operations for template versions"""
    
    def create_version(
        self,
        db: Session,
        *,
        template_id: UUID,
        obj_in: TemplateVersionCreate,
        user_id: UUID
    ) -> TemplateVersion:
        """Create a new template version"""
        # Get template
        template = db.query(Template).filter(Template.id == template_id).first()
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Create version
        db_obj = TemplateVersion(
            template_id=template_id,
            version=obj_in.version,
            content=obj_in.content,
            config=obj_in.config,
            parameters=obj_in.parameters,
            change_summary=obj_in.change_summary,
            release_notes=obj_in.release_notes,
            is_major_version=obj_in.is_major_version,
            created_by=user_id
        )
        
        try:
            db.add(db_obj)
            
            # Update template with latest version info
            template.version = obj_in.version
            template.content = obj_in.content
            template.config = obj_in.config
            template.parameters = obj_in.parameters
            
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Version creation failed: {str(e)}"
            )
    
    def get_by_template(
        self,
        db: Session,
        *,
        template_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[TemplateVersion]:
        """Get all versions for a template"""
        return (
            db.query(TemplateVersion)
            .filter(TemplateVersion.template_id == template_id)
            .order_by(desc(TemplateVersion.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )


class CRUDTemplateUsage(CRUDBase[TemplateUsage, TemplateUsageCreate, Dict[str, Any]]):
    """CRUD operations for template usage tracking"""
    
    def track_usage(
        self,
        db: Session,
        *,
        obj_in: TemplateUsageCreate,
        user_id: UUID
    ) -> TemplateUsage:
        """Track template usage"""
        db_obj = TemplateUsage(
            template_id=obj_in.template_id,
            used_by=user_id,
            usage_type=obj_in.usage_type,
            context=obj_in.context,
            target_type=obj_in.target_type,
            target_id=obj_in.target_id,
            execution_time_ms=obj_in.execution_time_ms
        )
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        
        # Update template usage count
        crud_template.update_usage_count(db, template_id=obj_in.template_id)
        
        return db_obj
    
    def get_usage_stats(
        self,
        db: Session,
        *,
        template_id: UUID,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get usage statistics for a template"""
        from datetime import timedelta
        
        since_date = datetime.utcnow() - timedelta(days=days)
        
        # Basic stats
        total_uses = db.query(func.count(TemplateUsage.id)).filter(
            TemplateUsage.template_id == template_id
        ).scalar()
        
        unique_users = db.query(func.count(func.distinct(TemplateUsage.used_by))).filter(
            TemplateUsage.template_id == template_id
        ).scalar()
        
        avg_execution_time = db.query(func.avg(TemplateUsage.execution_time_ms)).filter(
            TemplateUsage.template_id == template_id,
            TemplateUsage.execution_time_ms.isnot(None)
        ).scalar()
        
        # Usage by type
        usage_by_type = dict(
            db.query(
                TemplateUsage.usage_type,
                func.count(TemplateUsage.id)
            ).filter(
                TemplateUsage.template_id == template_id
            ).group_by(TemplateUsage.usage_type).all()
        )
        
        # Usage trend (daily counts for the period)
        usage_trend = db.query(
            func.date(TemplateUsage.created_at).label('date'),
            func.count(TemplateUsage.id).label('count')
        ).filter(
            TemplateUsage.template_id == template_id,
            TemplateUsage.created_at >= since_date
        ).group_by(
            func.date(TemplateUsage.created_at)
        ).order_by('date').all()
        
        return {
            "total_uses": total_uses,
            "unique_users": unique_users,
            "average_execution_time_ms": avg_execution_time,
            "usage_by_type": usage_by_type,
            "usage_trend": [{"date": str(item.date), "count": item.count} for item in usage_trend]
        }


class CRUDTemplateRating(CRUDBase[TemplateRating, TemplateRatingCreate, TemplateRatingUpdate]):
    """CRUD operations for template ratings"""
    
    def create_or_update(
        self,
        db: Session,
        *,
        obj_in: TemplateRatingCreate,
        user_id: UUID
    ) -> TemplateRating:
        """Create or update a rating"""
        # Check if user already rated this template
        existing = db.query(TemplateRating).filter(
            TemplateRating.template_id == obj_in.template_id,
            TemplateRating.user_id == user_id
        ).first()
        
        if existing:
            # Update existing rating
            for field, value in obj_in.dict(exclude_unset=True).items():
                if field != 'template_id':
                    setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            rating_obj = existing
        else:
            # Create new rating
            db_obj = TemplateRating(
                template_id=obj_in.template_id,
                user_id=user_id,
                rating=obj_in.rating,
                review=obj_in.review,
                ease_of_use=obj_in.ease_of_use,
                documentation_quality=obj_in.documentation_quality,
                flexibility=obj_in.flexibility,
                performance=obj_in.performance
            )
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            rating_obj = db_obj
        
        # Update template rating stats
        crud_template.update_rating_stats(db, template_id=obj_in.template_id)
        
        return rating_obj
    
    def mark_helpful(
        self,
        db: Session,
        *,
        rating_id: UUID,
        user_id: UUID
    ) -> bool:
        """Mark a rating as helpful"""
        rating = db.query(TemplateRating).filter(TemplateRating.id == rating_id).first()
        if not rating:
            return False
        
        rating.helpful_count += 1
        db.commit()
        return True
    
    def get_summary(
        self,
        db: Session,
        *,
        template_id: UUID
    ) -> Dict[str, Any]:
        """Get rating summary for a template"""
        # Basic stats
        stats = db.query(
            func.avg(TemplateRating.rating).label('average_rating'),
            func.count(TemplateRating.id).label('total_ratings'),
            func.avg(TemplateRating.ease_of_use).label('avg_ease_of_use'),
            func.avg(TemplateRating.documentation_quality).label('avg_documentation_quality'),
            func.avg(TemplateRating.flexibility).label('avg_flexibility'),
            func.avg(TemplateRating.performance).label('avg_performance')
        ).filter(TemplateRating.template_id == template_id).first()
        
        # Rating distribution
        distribution = dict(
            db.query(
                TemplateRating.rating,
                func.count(TemplateRating.id)
            ).filter(
                TemplateRating.template_id == template_id
            ).group_by(TemplateRating.rating).all()
        )
        
        # Fill missing ratings with 0
        rating_distribution = {i: distribution.get(i, 0) for i in range(1, 6)}
        
        # Recent reviews
        recent_reviews = (
            db.query(TemplateRating)
            .filter(
                TemplateRating.template_id == template_id,
                TemplateRating.review.isnot(None)
            )
            .order_by(desc(TemplateRating.created_at))
            .limit(5)
            .all()
        )
        
        return {
            "average_rating": float(stats.average_rating or 0),
            "total_ratings": stats.total_ratings or 0,
            "rating_distribution": rating_distribution,
            "average_ease_of_use": float(stats.avg_ease_of_use or 0) if stats.avg_ease_of_use else None,
            "average_documentation_quality": float(stats.avg_documentation_quality or 0) if stats.avg_documentation_quality else None,
            "average_flexibility": float(stats.avg_flexibility or 0) if stats.avg_flexibility else None,
            "average_performance": float(stats.avg_performance or 0) if stats.avg_performance else None,
            "recent_reviews": recent_reviews
        }


# Create instances
crud_template = CRUDTemplate(Template)
crud_template_category = CRUDTemplateCategory(TemplateCategory)
crud_template_version = CRUDTemplateVersion(TemplateVersion)
crud_template_usage = CRUDTemplateUsage(TemplateUsage)
crud_template_rating = CRUDTemplateRating(TemplateRating)