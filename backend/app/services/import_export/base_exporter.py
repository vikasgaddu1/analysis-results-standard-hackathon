"""Base export functionality for ARS data."""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.models.ars import (
    ReportingEvent, Analysis, AnalysisMethod, AnalysisSet, 
    DataSubset, Group, Operation, Output, WhereClause
)


class ExportConfig(BaseModel):
    """Configuration for export operations."""
    include_metadata: bool = True
    include_timestamps: bool = True
    flatten_nested: bool = False
    batch_size: int = 1000
    progress_callback: Optional[callable] = None


class ExportResult(BaseModel):
    """Result of an export operation."""
    success: bool
    message: str
    file_path: Optional[str] = None
    records_exported: int = 0
    errors: List[str] = []
    warnings: List[str] = []
    export_time: datetime


class BaseExporter(ABC):
    """Base class for all data exporters."""
    
    def __init__(self, db: Session, config: Optional[ExportConfig] = None):
        self.db = db
        self.config = config or ExportConfig()
        
    @abstractmethod
    def export_reporting_event(self, reporting_event_id: str, output_path: str) -> ExportResult:
        """Export a complete reporting event with all related data."""
        pass
        
    @abstractmethod 
    def export_analyses(self, analysis_ids: List[str], output_path: str) -> ExportResult:
        """Export specific analyses with their related data."""
        pass
        
    @abstractmethod
    def export_custom_query(self, query_params: Dict[str, Any], output_path: str) -> ExportResult:
        """Export data based on custom query parameters."""
        pass
        
    def _get_reporting_event_data(self, reporting_event_id: str) -> Dict[str, Any]:
        """Get complete reporting event data structure."""
        reporting_event = self.db.query(ReportingEvent).filter(
            ReportingEvent.id == reporting_event_id
        ).first()
        
        if not reporting_event:
            raise ValueError(f"Reporting event {reporting_event_id} not found")
            
        data = {
            "reportingEvent": self._serialize_model(reporting_event),
            "analyses": [],
            "methods": [],
            "analysisSets": [],
            "dataSubsets": [],
            "groups": [],
            "operations": [],
            "outputs": [],
            "whereClauses": []
        }
        
        # Get all related analyses
        analyses = self.db.query(Analysis).filter(
            Analysis.reporting_event_id == reporting_event_id
        ).all()
        
        for analysis in analyses:
            data["analyses"].append(self._serialize_model(analysis))
            
            # Get related data for each analysis
            if analysis.method_id:
                method = self.db.query(AnalysisMethod).filter(
                    AnalysisMethod.id == analysis.method_id
                ).first()
                if method:
                    data["methods"].append(self._serialize_model(method))
                    
            # Add other related entities...
            
        return data
        
    def _serialize_model(self, model: Any) -> Dict[str, Any]:
        """Serialize SQLAlchemy model to dictionary."""
        result = {}
        for column in model.__table__.columns:
            value = getattr(model, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.isoformat()
            else:
                result[column.name] = value
        return result
        
    def _update_progress(self, current: int, total: int, message: str = ""):
        """Update export progress if callback is provided."""
        if self.config.progress_callback:
            progress = (current / total) * 100 if total > 0 else 0
            self.config.progress_callback(progress, message)
            
    def _validate_export_data(self, data: Dict[str, Any]) -> List[str]:
        """Validate data before export."""
        errors = []
        
        if not data.get("reportingEvent"):
            errors.append("No reporting event data found")
            
        if not data.get("analyses"):
            errors.append("No analyses found for export")
            
        return errors