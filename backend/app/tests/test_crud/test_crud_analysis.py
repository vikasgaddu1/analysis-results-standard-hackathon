"""
Tests for analysis CRUD operations.
"""
import pytest
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.crud.analysis import CRUDAnalysis
from app.models.ars import Analysis, ReportingEvent, User
from app.schemas.ars import AnalysisCreate, AnalysisUpdate


class TestCRUDAnalysis:
    """Test CRUD operations for Analysis."""
    
    @pytest.fixture
    def crud_analysis(self):
        """Get CRUD analysis instance."""
        return CRUDAnalysis(Analysis)
    
    @pytest.fixture
    def reporting_event(self, db_session: Session, test_user: User) -> ReportingEvent:
        """Create a test reporting event."""
        re = ReportingEvent(
            id="RE001",
            version="1.0",
            name="Test Reporting Event",
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add(re)
        db_session.commit()
        db_session.refresh(re)
        return re
    
    def test_create_analysis(
        self, 
        db_session: Session, 
        crud_analysis: CRUDAnalysis,
        reporting_event: ReportingEvent,
        test_user: User
    ):
        """Test creating an analysis."""
        analysis_data = AnalysisCreate(
            id="AN001",
            version="1.0",
            name="Test Analysis",
            description="Test description",
            reason="SPECIFIED",
            purpose="PRIMARY_OUTCOME_MEASURE",
            reportingEventId=reporting_event.id
        )
        
        analysis = crud_analysis.create_with_owner(
            db=db_session,
            obj_in=analysis_data,
            owner_id=test_user.id
        )
        
        assert analysis.id == "AN001"
        assert analysis.name == "Test Analysis"
        assert analysis.reporting_event_id == reporting_event.id
        assert analysis.created_by_id == test_user.id
    
    def test_get_analysis(
        self, 
        db_session: Session, 
        crud_analysis: CRUDAnalysis,
        reporting_event: ReportingEvent,
        test_user: User
    ):
        """Test getting an analysis by ID."""
        # Create analysis
        analysis = Analysis(
            id="AN001",
            version="1.0",
            name="Test Analysis",
            reporting_event_id=reporting_event.id,
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add(analysis)
        db_session.commit()
        
        # Get analysis
        retrieved = crud_analysis.get(db=db_session, id=analysis.id)
        
        assert retrieved is not None
        assert retrieved.id == analysis.id
        assert retrieved.name == analysis.name
    
    def test_get_multi_analyses(
        self, 
        db_session: Session, 
        crud_analysis: CRUDAnalysis,
        reporting_event: ReportingEvent,
        test_user: User
    ):
        """Test getting multiple analyses."""
        # Create multiple analyses
        for i in range(5):
            analysis = Analysis(
                id=f"AN00{i+1}",
                version="1.0",
                name=f"Analysis {i+1}",
                reporting_event_id=reporting_event.id,
                created_by_id=test_user.id,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db_session.add(analysis)
        db_session.commit()
        
        # Get analyses
        analyses = crud_analysis.get_multi(db=db_session, limit=3)
        
        assert len(analyses) == 3
        assert all(isinstance(a, Analysis) for a in analyses)
    
    def test_update_analysis(
        self, 
        db_session: Session, 
        crud_analysis: CRUDAnalysis,
        reporting_event: ReportingEvent,
        test_user: User
    ):
        """Test updating an analysis."""
        # Create analysis
        analysis = Analysis(
            id="AN001",
            version="1.0",
            name="Original Name",
            description="Original description",
            reporting_event_id=reporting_event.id,
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add(analysis)
        db_session.commit()
        db_session.refresh(analysis)
        
        # Update analysis
        update_data = AnalysisUpdate(
            name="Updated Name",
            description="Updated description"
        )
        
        updated = crud_analysis.update(
            db=db_session,
            db_obj=analysis,
            obj_in=update_data
        )
        
        assert updated.name == "Updated Name"
        assert updated.description == "Updated description"
        assert updated.id == "AN001"  # ID should not change
    
    def test_delete_analysis(
        self, 
        db_session: Session, 
        crud_analysis: CRUDAnalysis,
        reporting_event: ReportingEvent,
        test_user: User
    ):
        """Test deleting an analysis."""
        # Create analysis
        analysis = Analysis(
            id="AN001",
            version="1.0",
            name="Test Analysis",
            reporting_event_id=reporting_event.id,
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add(analysis)
        db_session.commit()
        
        # Delete analysis
        deleted = crud_analysis.remove(db=db_session, id=analysis.id)
        
        assert deleted.id == "AN001"
        
        # Verify it's deleted
        retrieved = crud_analysis.get(db=db_session, id="AN001")
        assert retrieved is None
    
    def test_get_analyses_by_reporting_event(
        self, 
        db_session: Session, 
        crud_analysis: CRUDAnalysis,
        test_user: User
    ):
        """Test getting analyses by reporting event."""
        # Create two reporting events
        re1 = ReportingEvent(
            id="RE001",
            version="1.0",
            name="Reporting Event 1",
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        re2 = ReportingEvent(
            id="RE002",
            version="1.0",
            name="Reporting Event 2",
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add_all([re1, re2])
        db_session.commit()
        
        # Create analyses for each reporting event
        for i in range(3):
            analysis1 = Analysis(
                id=f"AN1{i+1}",
                version="1.0",
                name=f"RE1 Analysis {i+1}",
                reporting_event_id=re1.id,
                created_by_id=test_user.id,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            analysis2 = Analysis(
                id=f"AN2{i+1}",
                version="1.0",
                name=f"RE2 Analysis {i+1}",
                reporting_event_id=re2.id,
                created_by_id=test_user.id,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db_session.add_all([analysis1, analysis2])
        db_session.commit()
        
        # Get analyses for RE1
        analyses = crud_analysis.get_by_reporting_event(
            db=db_session,
            reporting_event_id=re1.id
        )
        
        assert len(analyses) == 3
        assert all(a.reporting_event_id == re1.id for a in analyses)
        assert all("RE1" in a.name for a in analyses)