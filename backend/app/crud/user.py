"""
CRUD operations for User model
"""

from typing import Any, Dict, Optional, Union
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models.ars import User, UserSession
from app.schemas.ars import UserCreate, UserUpdate


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    """CRUD operations for User model"""
    
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        """
        Get user by email address.
        
        Args:
            db: Database session
            email: User email
            
        Returns:
            User instance or None if not found
        """
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        """
        Create new user with hashed password.
        
        Args:
            db: Database session
            obj_in: User creation data
            
        Returns:
            Created user instance
        """
        db_obj = User(
            email=obj_in.email,
            password_hash=get_password_hash(obj_in.password),
            full_name=obj_in.full_name,
            role=obj_in.role,
            is_active=obj_in.is_active,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, 
        db: Session, 
        *, 
        db_obj: User, 
        obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        """
        Update user with optional password hashing.
        
        Args:
            db: Database session
            db_obj: Existing user instance
            obj_in: Update data
            
        Returns:
            Updated user instance
        """
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        # Hash password if provided
        if "password" in update_data:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["password_hash"] = hashed_password
        
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[User]:
        """
        Authenticate user with email and password.
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            
        Returns:
            User instance if authentication successful, None otherwise
        """
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    def is_active(self, user: User) -> bool:
        """
        Check if user is active.
        
        Args:
            user: User instance
            
        Returns:
            True if user is active
        """
        return user.is_active

    def is_admin(self, user: User) -> bool:
        """
        Check if user has admin role.
        
        Args:
            user: User instance
            
        Returns:
            True if user is admin
        """
        return user.role == "admin"

    def get_user_sessions(self, db: Session, *, user_id: UUID) -> list[UserSession]:
        """
        Get all active sessions for a user.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            List of active user sessions
        """
        return db.query(UserSession).filter(
            and_(
                UserSession.user_id == user_id,
                UserSession.expires_at > db.execute("SELECT NOW()").scalar()
            )
        ).all()

    def create_session(
        self, 
        db: Session, 
        *, 
        user_id: UUID, 
        token_hash: str, 
        expires_at: Any
    ) -> UserSession:
        """
        Create a new user session.
        
        Args:
            db: Database session
            user_id: User ID
            token_hash: Hashed token
            expires_at: Session expiration datetime
            
        Returns:
            Created session instance
        """
        session = UserSession(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def delete_session(self, db: Session, *, session_id: UUID) -> bool:
        """
        Delete a user session.
        
        Args:
            db: Database session
            session_id: Session ID
            
        Returns:
            True if session was deleted
        """
        session = db.query(UserSession).filter(UserSession.id == session_id).first()
        if session:
            db.delete(session)
            db.commit()
            return True
        return False

    def delete_user_sessions(self, db: Session, *, user_id: UUID) -> int:
        """
        Delete all sessions for a user.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Number of deleted sessions
        """
        deleted_count = db.query(UserSession).filter(
            UserSession.user_id == user_id
        ).delete()
        db.commit()
        return deleted_count


user = CRUDUser(User)