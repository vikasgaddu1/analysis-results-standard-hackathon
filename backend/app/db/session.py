from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.core.config import settings


# Create engine with appropriate configuration for production
engine = create_engine(
    settings.DATABASE_URL,
    # Connection pool settings
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,  # Recycle connections after 1 hour
    # Use NullPool for serverless/lambda deployments
    # poolclass=NullPool,  # Uncomment for serverless
    echo=settings.DEBUG,  # Log SQL statements in debug mode
)

# Create SessionLocal class
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db() -> Session:
    """
    Dependency to get database session.
    Usage in FastAPI endpoints:
    
    @app.get("/items/")
    def read_items(db: Session = Depends(get_db)):
        return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()