from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import get_password_hash
from app.db import base  # noqa: F401
from app.models.user import User
from app.db.session import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db(db: Session) -> None:
    """
    Initialize database with essential data.
    Creates the first superuser if configured.
    """
    # Tables should be created by Alembic migrations
    # This function is for creating initial data
    
    # Create first superuser if configured
    if settings.FIRST_SUPERUSER_EMAIL and settings.FIRST_SUPERUSER_PASSWORD:
        user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
        if not user:
            user = User(
                email=settings.FIRST_SUPERUSER_EMAIL,
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                is_superuser=True,
                is_active=True,
            )
            db.add(user)
            db.commit()
            logger.info(f"Created superuser: {settings.FIRST_SUPERUSER_EMAIL}")
        else:
            logger.info(f"Superuser already exists: {settings.FIRST_SUPERUSER_EMAIL}")


def create_db_and_tables():
    """
    Create database tables using SQLAlchemy models.
    This is mainly for development/testing. Production should use Alembic.
    """
    from app.db.base import Base
    Base.metadata.create_all(bind=engine)
    logger.info("Created database tables")


if __name__ == "__main__":
    # This script can be run directly to initialize the database
    from app.db.session import SessionLocal
    
    logger.info("Creating initial data")
    db = SessionLocal()
    try:
        init_db(db)
        logger.info("Initial data created")
    except Exception as e:
        logger.error(f"Error creating initial data: {e}")
        raise
    finally:
        db.close()