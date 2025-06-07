"""
Generic CRUD operations base class for Clinical Trial Table Metadata System
"""

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from uuid import UUID

from fastapi import HTTPException, status
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy import and_, or_, func, desc, asc, text
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.base import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """
    Generic CRUD operations base class
    
    Provides common database operations:
    - Create, Read, Update, Delete
    - List with pagination, filtering, and sorting
    - Bulk operations
    """
    
    def __init__(self, model: Type[ModelType]):
        """
        Initialize CRUD object with model.
        
        Args:
            model: SQLAlchemy model class
        """
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """
        Get a single record by ID.
        
        Args:
            db: Database session
            id: Record ID
            
        Returns:
            Model instance or None if not found
        """
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(
        self, 
        db: Session, 
        *,
        skip: int = 0, 
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
        search: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "asc"
    ) -> List[ModelType]:
        """
        Get multiple records with pagination, filtering, and sorting.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records to return
            filters: Dictionary of field filters
            search: Search term for text fields
            sort_by: Field to sort by
            sort_order: Sort order ("asc" or "desc")
            
        Returns:
            List of model instances
        """
        query = db.query(self.model)
        
        # Apply filters
        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field) and value is not None:
                    if isinstance(value, list):
                        # Handle list filters (IN operator)
                        query = query.filter(getattr(self.model, field).in_(value))
                    elif isinstance(value, str) and value.startswith('%') and value.endswith('%'):
                        # Handle LIKE operator for string fields
                        query = query.filter(getattr(self.model, field).ilike(value))
                    else:
                        # Handle equality
                        query = query.filter(getattr(self.model, field) == value)
        
        # Apply search
        if search:
            search_filters = []
            searchable_fields = ['name', 'description', 'label', 'id']
            for field in searchable_fields:
                if hasattr(self.model, field):
                    search_filters.append(
                        getattr(self.model, field).ilike(f"%{search}%")
                    )
            if search_filters:
                query = query.filter(or_(*search_filters))
        
        # Apply sorting
        if sort_by and hasattr(self.model, sort_by):
            sort_column = getattr(self.model, sort_by)
            if sort_order.lower() == "desc":
                query = query.order_by(desc(sort_column))
            else:
                query = query.order_by(asc(sort_column))
        elif hasattr(self.model, 'created_at'):
            # Default sort by created_at desc
            query = query.order_by(desc(self.model.created_at))
        elif hasattr(self.model, 'order_num'):
            # Sort by order_num for ordered entities
            query = query.order_by(asc(self.model.order_num))
        
        return query.offset(skip).limit(limit).all()

    def count(
        self, 
        db: Session, 
        *,
        filters: Optional[Dict[str, Any]] = None,
        search: Optional[str] = None
    ) -> int:
        """
        Count records with filtering.
        
        Args:
            db: Database session
            filters: Dictionary of field filters
            search: Search term for text fields
            
        Returns:
            Total count of matching records
        """
        query = db.query(func.count(self.model.id))
        
        # Apply filters (same logic as get_multi)
        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field) and value is not None:
                    if isinstance(value, list):
                        query = query.filter(getattr(self.model, field).in_(value))
                    elif isinstance(value, str) and value.startswith('%') and value.endswith('%'):
                        query = query.filter(getattr(self.model, field).ilike(value))
                    else:
                        query = query.filter(getattr(self.model, field) == value)
        
        # Apply search (same logic as get_multi)
        if search:
            search_filters = []
            searchable_fields = ['name', 'description', 'label', 'id']
            for field in searchable_fields:
                if hasattr(self.model, field):
                    search_filters.append(
                        getattr(self.model, field).ilike(f"%{search}%")
                    )
            if search_filters:
                query = query.filter(or_(*search_filters))
        
        return query.scalar()

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """
        Create a new record.
        
        Args:
            db: Database session
            obj_in: Pydantic model with creation data
            
        Returns:
            Created model instance
            
        Raises:
            HTTPException: If creation fails due to constraint violations
        """
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)
        
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            db.rollback()
            if "duplicate key" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"A record with this ID already exists"
                )
            elif "foreign key" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Referenced record does not exist"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Database constraint violation: {str(e)}"
                )

    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """
        Update an existing record.
        
        Args:
            db: Database session
            db_obj: Existing model instance
            obj_in: Pydantic model with update data or dict
            
        Returns:
            Updated model instance
        """
        obj_data = jsonable_encoder(db_obj)
        
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            db.rollback()
            if "duplicate key" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A record with this ID already exists"
                )
            elif "foreign key" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Referenced record does not exist"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Database constraint violation: {str(e)}"
                )

    def remove(self, db: Session, *, id: Any) -> ModelType:
        """
        Remove a record by ID.
        
        Args:
            db: Database session
            id: Record ID
            
        Returns:
            Removed model instance
            
        Raises:
            HTTPException: If record not found
        """
        obj = db.query(self.model).get(id)
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Record with id {id} not found"
            )
        
        try:
            db.delete(obj)
            db.commit()
            return obj
        except IntegrityError as e:
            db.rollback()
            if "foreign key" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete record: it is referenced by other records"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Database constraint violation: {str(e)}"
                )

    def exists(self, db: Session, *, id: Any) -> bool:
        """
        Check if a record exists by ID.
        
        Args:
            db: Database session
            id: Record ID
            
        Returns:
            True if record exists, False otherwise
        """
        return db.query(self.model).filter(self.model.id == id).first() is not None

    def bulk_create(self, db: Session, *, objs_in: List[CreateSchemaType]) -> List[ModelType]:
        """
        Create multiple records in bulk.
        
        Args:
            db: Database session
            objs_in: List of Pydantic models with creation data
            
        Returns:
            List of created model instances
        """
        db_objs = []
        for obj_in in objs_in:
            obj_in_data = jsonable_encoder(obj_in)
            db_obj = self.model(**obj_in_data)
            db_objs.append(db_obj)
        
        try:
            db.add_all(db_objs)
            db.commit()
            for db_obj in db_objs:
                db.refresh(db_obj)
            return db_objs
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bulk creation failed: {str(e)}"
            )

    def bulk_update(
        self, 
        db: Session, 
        *, 
        updates: List[Dict[str, Any]]
    ) -> List[ModelType]:
        """
        Update multiple records in bulk.
        
        Args:
            db: Database session
            updates: List of dicts with 'id' and update fields
            
        Returns:
            List of updated model instances
        """
        updated_objs = []
        
        for update_data in updates:
            if 'id' not in update_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="ID is required for bulk updates"
                )
            
            obj_id = update_data.pop('id')
            db_obj = self.get(db, id=obj_id)
            
            if not db_obj:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Record with id {obj_id} not found"
                )
            
            for field, value in update_data.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)
            
            updated_objs.append(db_obj)
        
        try:
            db.commit()
            for db_obj in updated_objs:
                db.refresh(db_obj)
            return updated_objs
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bulk update failed: {str(e)}"
            )

    def bulk_delete(self, db: Session, *, ids: List[Any]) -> int:
        """
        Delete multiple records by IDs.
        
        Args:
            db: Database session
            ids: List of record IDs
            
        Returns:
            Number of deleted records
        """
        try:
            deleted_count = db.query(self.model).filter(
                self.model.id.in_(ids)
            ).delete(synchronize_session=False)
            db.commit()
            return deleted_count
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Bulk deletion failed: {str(e)}"
            )