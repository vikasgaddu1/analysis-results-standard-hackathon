"""Base import functionality for ARS data."""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.models.ars import (
    ReportingEvent, Analysis, AnalysisMethod, AnalysisSet, 
    DataSubset, Group, Operation, Output, WhereClause
)


class ImportConfig(BaseModel):
    """Configuration for import operations."""
    validate_before_import: bool = True
    batch_size: int = 100
    skip_duplicates: bool = True
    update_existing: bool = False
    dry_run: bool = False
    progress_callback: Optional[callable] = None


class FieldMapping(BaseModel):
    """Mapping configuration for import fields."""
    source_field: str
    target_field: str
    required: bool = False
    default_value: Optional[Any] = None
    transform_function: Optional[str] = None


class ImportResult(BaseModel):
    """Result of an import operation."""
    success: bool
    message: str
    records_imported: int = 0
    records_updated: int = 0
    records_skipped: int = 0
    errors: List[str] = []
    warnings: List[str] = []
    import_time: datetime
    validation_results: Optional[Dict[str, Any]] = None


class BaseImporter(ABC):
    """Base class for all data importers."""
    
    def __init__(self, db: Session, config: Optional[ImportConfig] = None):
        self.db = db
        self.config = config or ImportConfig()
        
    @abstractmethod
    def import_from_file(self, file_path: str, field_mapping: Optional[List[FieldMapping]] = None) -> ImportResult:
        """Import data from a file."""
        pass
        
    @abstractmethod
    def validate_import_data(self, data: Dict[str, Any]) -> Tuple[bool, List[str], List[str]]:
        """Validate import data structure and content."""
        pass
        
    @abstractmethod
    def preview_import(self, file_path: str, limit: int = 10) -> Dict[str, Any]:
        """Preview import data before actual import."""
        pass
        
    def _apply_field_mapping(self, data: Dict[str, Any], field_mappings: List[FieldMapping]) -> Dict[str, Any]:
        """Apply field mappings to transform import data."""
        if not field_mappings:
            return data
            
        mapped_data = {}
        
        for mapping in field_mappings:
            source_value = data.get(mapping.source_field)
            
            if source_value is None:
                if mapping.required:
                    raise ValueError(f"Required field {mapping.source_field} is missing")
                source_value = mapping.default_value
            
            # Apply transformation if specified
            if mapping.transform_function and source_value is not None:
                source_value = self._apply_transform(source_value, mapping.transform_function)
            
            mapped_data[mapping.target_field] = source_value
            
        return mapped_data
        
    def _apply_transform(self, value: Any, transform_function: str) -> Any:
        """Apply transformation function to a value."""
        transforms = {
            "upper": lambda x: str(x).upper(),
            "lower": lambda x: str(x).lower(),
            "strip": lambda x: str(x).strip(),
            "to_int": lambda x: int(x) if x else None,
            "to_float": lambda x: float(x) if x else None,
            "to_bool": lambda x: str(x).lower() in ['true', '1', 'yes', 'on'] if x else False,
            "to_datetime": lambda x: datetime.fromisoformat(str(x)) if x else None
        }
        
        if transform_function in transforms:
            return transforms[transform_function](value)
        
        return value
        
    def _update_progress(self, current: int, total: int, message: str = ""):
        """Update import progress if callback is provided."""
        if self.config.progress_callback:
            progress = (current / total) * 100 if total > 0 else 0
            self.config.progress_callback(progress, message)
            
    def _check_duplicate(self, model_class: Any, identifier: str) -> bool:
        """Check if a record with the given identifier already exists."""
        return self.db.query(model_class).filter(model_class.id == identifier).first() is not None
        
    def _create_or_update_record(self, model_class: Any, data: Dict[str, Any], identifier: str) -> Tuple[Any, bool]:
        """Create a new record or update existing one."""
        existing = self.db.query(model_class).filter(model_class.id == identifier).first()
        
        if existing:
            if self.config.update_existing:
                for key, value in data.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
                return existing, True  # Updated
            else:
                return existing, False  # Skipped
        else:
            new_record = model_class(**data)
            self.db.add(new_record)
            return new_record, True  # Created
            
    def _validate_required_fields(self, data: Dict[str, Any], required_fields: List[str]) -> List[str]:
        """Validate that required fields are present."""
        errors = []
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == "":
                errors.append(f"Required field '{field}' is missing or empty")
        return errors
        
    def _validate_data_types(self, data: Dict[str, Any], field_types: Dict[str, type]) -> List[str]:
        """Validate data types for fields."""
        errors = []
        for field, expected_type in field_types.items():
            if field in data and data[field] is not None:
                if not isinstance(data[field], expected_type):
                    try:
                        # Try to convert
                        if expected_type == datetime and isinstance(data[field], str):
                            datetime.fromisoformat(data[field])
                        elif expected_type in [int, float]:
                            expected_type(data[field])
                        else:
                            raise ValueError()
                    except (ValueError, TypeError):
                        errors.append(f"Field '{field}' must be of type {expected_type.__name__}")
        return errors
        
    def _validate_foreign_keys(self, data: Dict[str, Any]) -> List[str]:
        """Validate foreign key references."""
        errors = []
        
        # Check reporting event exists if specified
        if 'reporting_event_id' in data and data['reporting_event_id']:
            if not self.db.query(ReportingEvent).filter(
                ReportingEvent.id == data['reporting_event_id']
            ).first():
                errors.append(f"Reporting event {data['reporting_event_id']} does not exist")
        
        # Check method exists if specified
        if 'method_id' in data and data['method_id']:
            if not self.db.query(AnalysisMethod).filter(
                AnalysisMethod.id == data['method_id']
            ).first():
                errors.append(f"Analysis method {data['method_id']} does not exist")
        
        return errors