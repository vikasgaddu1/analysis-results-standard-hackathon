"""
Tests for analysis endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.ars import User, Analysis, ReportingEvent


class TestAnalyses:
    """Test analysis endpoints."""
    
    def test_create_analysis(
        self, 
        client: TestClient, 
        auth_headers: dict, 
        sample_analysis_data: dict,
        sample_reporting_event_data: dict
    ):
        """Test creating a new analysis."""
        # First create a reporting event
        re_response = client.post(
            "/api/v1/reporting-events", 
            json=sample_reporting_event_data, 
            headers=auth_headers
        )
        assert re_response.status_code == 201
        reporting_event_id = re_response.json()["id"]
        
        # Add reporting event ID to analysis data
        sample_analysis_data["reportingEventId"] = reporting_event_id
        
        response = client.post(
            "/api/v1/analyses", 
            json=sample_analysis_data, 
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == sample_analysis_data["id"]
        assert data["name"] == sample_analysis_data["name"]
        assert data["description"] == sample_analysis_data["description"]
        assert data["reason"] == sample_analysis_data["reason"]
        assert data["purpose"] == sample_analysis_data["purpose"]
    
    def test_create_analysis_unauthorized(self, client: TestClient, sample_analysis_data: dict):
        """Test creating analysis without authentication."""
        response = client.post("/api/v1/analyses", json=sample_analysis_data)
        
        assert response.status_code == 401
        assert response.json()["detail"] == "Not authenticated"
    
    def test_get_analysis(
        self, 
        client: TestClient, 
        auth_headers: dict, 
        sample_analysis_data: dict,
        sample_reporting_event_data: dict
    ):
        """Test getting a specific analysis."""
        # Create reporting event and analysis first
        re_response = client.post(
            "/api/v1/reporting-events", 
            json=sample_reporting_event_data, 
            headers=auth_headers
        )
        reporting_event_id = re_response.json()["id"]
        
        sample_analysis_data["reportingEventId"] = reporting_event_id
        create_response = client.post(
            "/api/v1/analyses", 
            json=sample_analysis_data, 
            headers=auth_headers
        )
        analysis_id = create_response.json()["id"]
        
        # Get the analysis
        response = client.get(f"/api/v1/analyses/{analysis_id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == analysis_id
        assert data["name"] == sample_analysis_data["name"]
    
    def test_get_nonexistent_analysis(self, client: TestClient, auth_headers: dict):
        """Test getting non-existent analysis."""
        response = client.get("/api/v1/analyses/nonexistent", headers=auth_headers)
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    def test_list_analyses(
        self, 
        client: TestClient, 
        auth_headers: dict, 
        sample_analysis_data: dict,
        sample_reporting_event_data: dict
    ):
        """Test listing analyses."""
        # Create reporting event
        re_response = client.post(
            "/api/v1/reporting-events", 
            json=sample_reporting_event_data, 
            headers=auth_headers
        )
        reporting_event_id = re_response.json()["id"]
        
        # Create multiple analyses
        for i in range(3):
            analysis_data = sample_analysis_data.copy()
            analysis_data["id"] = f"AN00{i+1}"
            analysis_data["name"] = f"Analysis {i+1}"
            analysis_data["reportingEventId"] = reporting_event_id
            client.post("/api/v1/analyses", json=analysis_data, headers=auth_headers)
        
        # List analyses
        response = client.get("/api/v1/analyses", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3
        assert all("id" in item for item in data)
        assert all("name" in item for item in data)
    
    def test_update_analysis(
        self, 
        client: TestClient, 
        auth_headers: dict, 
        sample_analysis_data: dict,
        sample_reporting_event_data: dict
    ):
        """Test updating an analysis."""
        # Create reporting event and analysis
        re_response = client.post(
            "/api/v1/reporting-events", 
            json=sample_reporting_event_data, 
            headers=auth_headers
        )
        reporting_event_id = re_response.json()["id"]
        
        sample_analysis_data["reportingEventId"] = reporting_event_id
        create_response = client.post(
            "/api/v1/analyses", 
            json=sample_analysis_data, 
            headers=auth_headers
        )
        analysis_id = create_response.json()["id"]
        
        # Update the analysis
        update_data = {
            "name": "Updated Analysis Name",
            "description": "Updated description"
        }
        response = client.patch(
            f"/api/v1/analyses/{analysis_id}", 
            json=update_data, 
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]
        assert data["id"] == analysis_id  # ID should not change
    
    def test_delete_analysis(
        self, 
        client: TestClient, 
        auth_headers: dict, 
        sample_analysis_data: dict,
        sample_reporting_event_data: dict
    ):
        """Test deleting an analysis."""
        # Create reporting event and analysis
        re_response = client.post(
            "/api/v1/reporting-events", 
            json=sample_reporting_event_data, 
            headers=auth_headers
        )
        reporting_event_id = re_response.json()["id"]
        
        sample_analysis_data["reportingEventId"] = reporting_event_id
        create_response = client.post(
            "/api/v1/analyses", 
            json=sample_analysis_data, 
            headers=auth_headers
        )
        analysis_id = create_response.json()["id"]
        
        # Delete the analysis
        response = client.delete(f"/api/v1/analyses/{analysis_id}", headers=auth_headers)
        
        assert response.status_code == 204
        
        # Verify it's deleted
        get_response = client.get(f"/api/v1/analyses/{analysis_id}", headers=auth_headers)
        assert get_response.status_code == 404
    
    def test_analysis_with_where_clause(
        self, 
        client: TestClient, 
        auth_headers: dict, 
        sample_analysis_data: dict,
        sample_reporting_event_data: dict,
        sample_where_clause_data: dict
    ):
        """Test creating analysis with where clause."""
        # Create reporting event
        re_response = client.post(
            "/api/v1/reporting-events", 
            json=sample_reporting_event_data, 
            headers=auth_headers
        )
        reporting_event_id = re_response.json()["id"]
        
        # Create where clause
        wc_response = client.post(
            "/api/v1/where-clauses", 
            json=sample_where_clause_data, 
            headers=auth_headers
        )
        where_clause_id = wc_response.json()["id"]
        
        # Create analysis with where clause
        sample_analysis_data["reportingEventId"] = reporting_event_id
        sample_analysis_data["whereClauseId"] = where_clause_id
        
        response = client.post(
            "/api/v1/analyses", 
            json=sample_analysis_data, 
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["whereClauseId"] == where_clause_id
    
    def test_analysis_validation(
        self, 
        client: TestClient, 
        auth_headers: dict,
        sample_reporting_event_data: dict
    ):
        """Test analysis validation."""
        # Create reporting event
        re_response = client.post(
            "/api/v1/reporting-events", 
            json=sample_reporting_event_data, 
            headers=auth_headers
        )
        reporting_event_id = re_response.json()["id"]
        
        # Test with invalid data
        invalid_data = {
            "id": "",  # Empty ID
            "name": "",  # Empty name
            "reportingEventId": reporting_event_id
        }
        
        response = client.post("/api/v1/analyses", json=invalid_data, headers=auth_headers)
        
        assert response.status_code == 422
        errors = response.json()["detail"]
        assert any("id" in str(error) for error in errors)
        assert any("name" in str(error) for error in errors)