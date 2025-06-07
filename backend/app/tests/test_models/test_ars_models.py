"""
Tests for ARS database models.
"""
import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.ars import (
    User, ReportingEvent, Analysis, Method, Output,
    WhereClause, WhereClauseCondition, AnalysisSet,
    DataSubset, Group, GroupingFactor
)


class TestARSModels:
    """Test ARS database models."""
    
    def test_user_model(self, db_session: Session):
        """Test User model."""
        user = User(
            email="model@test.com",
            username="modeltest",
            full_name="Model Test User",
            hashed_password="hashedpassword",
            is_active=True,
            is_superuser=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        assert user.id is not None
        assert user.email == "model@test.com"
        assert user.username == "modeltest"
        assert user.is_active is True
        assert user.is_superuser is False
    
    def test_reporting_event_model(self, db_session: Session, test_user: User):
        """Test ReportingEvent model."""
        re = ReportingEvent(
            id="RE001",
            version="1.0",
            name="Clinical Study Report",
            description="Primary analysis reporting event",
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        db_session.add(re)
        db_session.commit()
        db_session.refresh(re)
        
        assert re.id == "RE001"
        assert re.name == "Clinical Study Report"
        assert re.created_by_id == test_user.id
        assert re.created_by.username == test_user.username
    
    def test_analysis_model_relationships(self, db_session: Session, test_user: User):
        """Test Analysis model with relationships."""
        # Create reporting event
        re = ReportingEvent(
            id="RE001",
            version="1.0",
            name="Test RE",
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add(re)
        
        # Create method
        method = Method(
            id="METHOD001",
            name="Mean Calculation",
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add(method)
        
        # Create analysis
        analysis = Analysis(
            id="AN001",
            version="1.0",
            name="Demographics Analysis",
            reason="SPECIFIED",
            purpose="PRIMARY_OUTCOME_MEASURE",
            reporting_event_id=re.id,
            method_id=method.id,
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add(analysis)
        db_session.commit()
        db_session.refresh(analysis)
        
        assert analysis.reporting_event.id == re.id
        assert analysis.method.id == method.id
        assert analysis.created_by.id == test_user.id
    
    def test_where_clause_model(self, db_session: Session, test_user: User):
        """Test WhereClause model with condition."""
        # Create where clause
        wc = WhereClause(
            id="WC001",
            label="ITT Population",
            level=1,
            order=1,
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add(wc)
        db_session.flush()
        
        # Create condition
        condition = WhereClauseCondition(
            dataset="ADSL",
            variable="ITTFL",
            comparator="EQ",
            value=["Y"],
            where_clause_id=wc.id
        )
        db_session.add(condition)
        db_session.commit()
        db_session.refresh(wc)
        
        assert wc.condition is not None
        assert wc.condition.dataset == "ADSL"
        assert wc.condition.variable == "ITTFL"
        assert wc.condition.comparator == "EQ"
        assert wc.condition.value == ["Y"]
    
    def test_output_model_with_display(self, db_session: Session, test_user: User):
        """Test Output model with display sections."""
        # Create output
        output = Output(
            id="OUT001",
            version="1.0",
            name="Demographics Table",
            file_type="rtf",
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add(output)
        db_session.commit()
        db_session.refresh(output)
        
        assert output.id == "OUT001"
        assert output.file_type == "rtf"
        assert output.created_by.id == test_user.id
    
    def test_analysis_set_model(self, db_session: Session, test_user: User):
        """Test AnalysisSet model."""
        # Create analysis set
        analysis_set = AnalysisSet(
            id="AS001",
            label="Full Analysis Set",
            level=1,
            order=1,
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add(analysis_set)
        
        # Create where clause for the analysis set
        wc = WhereClause(
            id="WC_AS001",
            label="FAS Criteria",
            level=1,
            order=1,
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add(wc)
        db_session.flush()
        
        # Add condition
        condition = WhereClauseCondition(
            dataset="ADSL",
            variable="FASFL",
            comparator="EQ",
            value=["Y"],
            where_clause_id=wc.id
        )
        db_session.add(condition)
        
        # Link where clause to analysis set
        analysis_set.where_clause_id = wc.id
        db_session.commit()
        db_session.refresh(analysis_set)
        
        assert analysis_set.where_clause is not None
        assert analysis_set.where_clause.condition.variable == "FASFL"
    
    def test_grouping_factor_model(self, db_session: Session, test_user: User):
        """Test GroupingFactor and Group models."""
        # Create grouping factor
        grouping = GroupingFactor(
            id="GF001",
            label="Treatment Group",
            grouping_variable="TRT01P",
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add(grouping)
        db_session.flush()
        
        # Create groups
        groups = [
            Group(
                id="GRP001",
                label="Placebo",
                order=1,
                grouping_id=grouping.id,
                created_by_id=test_user.id,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            ),
            Group(
                id="GRP002",
                label="Active Treatment",
                order=2,
                grouping_id=grouping.id,
                created_by_id=test_user.id,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
        ]
        db_session.add_all(groups)
        db_session.commit()
        db_session.refresh(grouping)
        
        assert len(grouping.groups) == 2
        assert grouping.groups[0].label == "Placebo"
        assert grouping.groups[1].label == "Active Treatment"
    
    def test_model_constraints(self, db_session: Session, test_user: User):
        """Test model constraints and validations."""
        # Test unique constraint on User email
        user1 = User(
            email="unique@test.com",
            username="user1",
            hashed_password="hash",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        user2 = User(
            email="unique@test.com",  # Same email
            username="user2",
            hashed_password="hash",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        db_session.add(user1)
        db_session.commit()
        
        db_session.add(user2)
        with pytest.raises(IntegrityError):
            db_session.commit()
        db_session.rollback()
        
        # Test foreign key constraint
        analysis = Analysis(
            id="AN_INVALID",
            version="1.0",
            name="Invalid Analysis",
            reporting_event_id="NONEXISTENT",  # Non-existent RE
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        db_session.add(analysis)
        with pytest.raises(IntegrityError):
            db_session.commit()
        db_session.rollback()
    
    def test_cascade_delete(self, db_session: Session, test_user: User):
        """Test cascade delete behavior."""
        # Create where clause with condition
        wc = WhereClause(
            id="WC_CASCADE",
            label="Test Cascade",
            level=1,
            order=1,
            created_by_id=test_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db_session.add(wc)
        db_session.flush()
        
        condition = WhereClauseCondition(
            dataset="ADSL",
            variable="TEST",
            comparator="EQ",
            value=["Y"],
            where_clause_id=wc.id
        )
        db_session.add(condition)
        db_session.commit()
        
        # Delete where clause
        db_session.delete(wc)
        db_session.commit()
        
        # Condition should be deleted too
        remaining = db_session.query(WhereClauseCondition).filter_by(
            where_clause_id="WC_CASCADE"
        ).first()
        assert remaining is None