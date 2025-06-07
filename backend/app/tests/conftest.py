"""
Test configuration and fixtures for the ARS backend.
"""
import os
import pytest
from typing import Generator, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from datetime import datetime, timezone

from app.main import app
from app.db.base import Base
from app.api.deps import get_db
from app.core.security import get_password_hash
from app.models.ars import User
from app.core.config import settings

# Test database URL - using SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# Create test session
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def db_engine():
    """Create test database engine."""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine) -> Generator[Session, None, None]:
    """Create a fresh database session for each test."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Create a test client with database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session: Session) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        username="testuser",
        full_name="Test User",
        hashed_password=get_password_hash("testpassword"),
        is_active=True,
        is_superuser=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def superuser(db_session: Session) -> User:
    """Create a test superuser."""
    user = User(
        email="admin@example.com",
        username="admin",
        full_name="Admin User",
        hashed_password=get_password_hash("adminpassword"),
        is_active=True,
        is_superuser=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(client: TestClient, test_user: User) -> dict[str, str]:
    """Get authentication headers for test user."""
    login_data = {
        "username": "testuser",
        "password": "testpassword"
    }
    response = client.post("/api/v1/auth/login", data=login_data)
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def superuser_auth_headers(client: TestClient, superuser: User) -> dict[str, str]:
    """Get authentication headers for superuser."""
    login_data = {
        "username": "admin",
        "password": "adminpassword"
    }
    response = client.post("/api/v1/auth/login", data=login_data)
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# Sample data fixtures
@pytest.fixture
def sample_reporting_event_data() -> dict[str, Any]:
    """Sample reporting event data for testing."""
    return {
        "id": "RE001",
        "version": "1.0",
        "name": "Primary Efficacy Analysis",
        "description": "Primary efficacy endpoint analysis for the clinical trial",
        "analyses": []
    }


@pytest.fixture
def sample_analysis_data() -> dict[str, Any]:
    """Sample analysis data for testing."""
    return {
        "id": "AN001",
        "version": "1.0",
        "name": "Demographics Summary",
        "description": "Summary statistics of demographic characteristics",
        "reason": "SPECIFIED",
        "purpose": "PRIMARY_OUTCOME_MEASURE",
        "dataset": "ADSL",
        "variable": "AGE",
        "methodId": "MEAN_01"
    }


@pytest.fixture
def sample_method_data() -> dict[str, Any]:
    """Sample method data for testing."""
    return {
        "id": "MEAN_01",
        "name": "Descriptive Statistics - Mean",
        "description": "Calculate mean with standard deviation",
        "label": "Mean (SD)"
    }


@pytest.fixture
def sample_output_data() -> dict[str, Any]:
    """Sample output data for testing."""
    return {
        "id": "OUT001",
        "version": "1.0",
        "name": "Demographics Table",
        "fileType": "rtf",
        "display": {
            "order": 1,
            "outputId": "OUT001",
            "displayTitle": "Table 1: Demographics and Baseline Characteristics",
            "displaySections": []
        }
    }


@pytest.fixture
def sample_where_clause_data() -> dict[str, Any]:
    """Sample where clause data for testing."""
    return {
        "id": "WC001",
        "label": "Safety Population",
        "level": 1,
        "order": 1,
        "condition": {
            "dataset": "ADSL",
            "variable": "SAFFL",
            "comparator": "EQ",
            "value": ["Y"]
        }
    }