"""
Authentication endpoints for Clinical Trial Table Metadata System
"""

from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.config import settings
from app.crud import user as crud_user
from app.db.session import get_db
from app.schemas.ars import User, UserCreate, UserUpdate

router = APIRouter()


@router.post("/login", response_model=dict)
def login_access_token(
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = crud_user.user.authenticate(
        db, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    elif not crud_user.user.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    # Update last login
    user.last_login = db.execute("SELECT NOW()").scalar()
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }


@router.post("/register", response_model=User)
def register_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Register a new user.
    """
    user = crud_user.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system."
        )
    
    user = crud_user.user.create(db, obj_in=user_in)
    return user


@router.post("/test-token", response_model=User)
def test_token(current_user: User = Depends(deps.get_current_user)) -> Any:
    """
    Test access token validity.
    """
    return current_user


@router.post("/logout")
def logout(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Logout current user (invalidate all sessions).
    """
    # Delete all user sessions
    crud_user.user.delete_user_sessions(db, user_id=current_user.id)
    
    return {"message": "Successfully logged out"}


@router.post("/change-password")
def change_password(
    *,
    db: Session = Depends(get_db),
    current_password: str,
    new_password: str,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Change user password.
    """
    if not security.verify_password(current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Update password
    update_data = {"password": new_password}
    crud_user.user.update(db, db_obj=current_user, obj_in=update_data)
    
    # Invalidate all existing sessions for security
    crud_user.user.delete_user_sessions(db, user_id=current_user.id)
    
    return {"message": "Password changed successfully. Please log in again."}


@router.get("/me", response_model=User)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user


@router.put("/me", response_model=User)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update own user.
    """
    # Users can't change their own role
    if hasattr(user_in, 'role') and user_in.role:
        if current_user.role != "admin":
            delattr(user_in, 'role')
    
    user = crud_user.user.update(db, db_obj=current_user, obj_in=user_in)
    return user