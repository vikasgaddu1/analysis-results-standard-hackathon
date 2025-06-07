"""JSON import service for ARS data."""

import json
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
import os

from .base_importer import BaseImporter, ImportResult, FieldMapping


class JSONImporter(BaseImporter):
    """JSON format importer for ARS data."""
    
    def import_from_file(self, file_path: str, field_mapping: Optional[List[FieldMapping]] = None) -> ImportResult:
        """Import data from a JSON file."""
        try:
            self._update_progress(0, 100, "Starting JSON import...")
            
            if not os.path.exists(file_path):
                return ImportResult(
                    success=False,
                    message=f"File not found: {file_path}",
                    import_time=datetime.now(),
                    errors=[f"File not found: {file_path}"]
                )
            
            # Load JSON data
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self._update_progress(20, 100, "JSON data loaded, validating...")
            
            # Validate data structure
            is_valid, errors, warnings = self.validate_import_data(data)
            
            if not is_valid:
                return ImportResult(
                    success=False,
                    message=f"Validation failed: {'; '.join(errors)}",
                    import_time=datetime.now(),
                    errors=errors,
                    warnings=warnings,
                    validation_results={"valid": False, "errors": errors, "warnings": warnings}
                )
            
            if self.config.dry_run:
                return ImportResult(
                    success=True,
                    message="Dry run completed successfully - no data imported",
                    import_time=datetime.now(),
                    warnings=warnings,
                    validation_results={"valid": True, "errors": [], "warnings": warnings}
                )
            
            self._update_progress(40, 100, "Starting data import...")
            
            # Import data
            result = self._import_json_data(data, field_mapping)
            
            if not self.config.dry_run:
                self.db.commit()
            
            self._update_progress(100, 100, "Import completed")
            
            result.warnings.extend(warnings)
            result.validation_results = {"valid": True, "errors": [], "warnings": warnings}
            
            return result
            
        except json.JSONDecodeError as e:
            return ImportResult(
                success=False,
                message=f"JSON parsing error: {str(e)}",
                import_time=datetime.now(),
                errors=[f"JSON parsing error: {str(e)}"]
            )
        except Exception as e:
            if not self.config.dry_run:
                self.db.rollback()
            return ImportResult(
                success=False,
                message=f"Import failed: {str(e)}",
                import_time=datetime.now(),
                errors=[str(e)]
            )
    
    def validate_import_data(self, data: Dict[str, Any]) -> Tuple[bool, List[str], List[str]]:
        """Validate JSON import data structure and content."""
        errors = []
        warnings = []
        
        if not isinstance(data, dict):
            errors.append("Root element must be a JSON object")
            return False, errors, warnings
        
        # Check for metadata section (common in JSON exports)
        if "metadata" in data:
            metadata = data["metadata"]
            if "exportFormat" in metadata and metadata["exportFormat"] != "JSON":
                warnings.append(f"File was exported as {metadata['exportFormat']}, importing as JSON")
        
        # Check for required top-level keys
        if "reportingEvent" not in data and "analyses" not in data:
            errors.append("Data must contain either 'reportingEvent' or 'analyses'")
        
        # Validate reporting event if present
        if "reportingEvent" in data:
            re_errors = self._validate_reporting_event(data["reportingEvent"])
            errors.extend(re_errors)
        
        # Validate analyses if present
        if "analyses" in data:
            if not isinstance(data["analyses"], list):
                errors.append("'analyses' must be an array")
            else:
                for i, analysis in enumerate(data["analyses"]):
                    analysis_errors = self._validate_analysis(analysis, f"analyses[{i}]")
                    errors.extend(analysis_errors)
        
        # Check for optional sections
        optional_sections = ["methods", "analysisSets", "dataSubsets", "groups", "operations", "outputs", "whereClauses"]
        for section in optional_sections:
            if section in data:
                if not isinstance(data[section], list):
                    errors.append(f"'{section}' must be an array")
                else:
                    # Validate each item in the section
                    for i, item in enumerate(data[section]):
                        if not isinstance(item, dict):
                            errors.append(f"'{section}[{i}]' must be an object")
        
        # Validate JSON-specific data types
        self._validate_json_types(data, errors)
        
        is_valid = len(errors) == 0
        
        return is_valid, errors, warnings
    
    def preview_import(self, file_path: str, limit: int = 10) -> Dict[str, Any]:
        """Preview JSON import data before actual import."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            preview = {
                "file_type": "JSON",
                "structure": {},
                "sample_data": {},
                "validation": {},
                "metadata": {}
            }
            
            # Extract metadata if present
            if "metadata" in data:
                preview["metadata"] = data["metadata"]
            
            # Analyze structure
            for key, value in data.items():
                if key == "metadata":
                    continue
                    
                if isinstance(value, list):
                    preview["structure"][key] = f"Array with {len(value)} items"
                    if value and limit > 0:
                        preview["sample_data"][key] = value[:limit]
                elif isinstance(value, dict):
                    preview["structure"][key] = f"Object with {len(value)} properties"
                    preview["sample_data"][key] = value
                else:
                    preview["structure"][key] = type(value).__name__
                    preview["sample_data"][key] = value
            
            # Run validation
            is_valid, errors, warnings = self.validate_import_data(data)
            preview["validation"] = {
                "valid": is_valid,
                "errors": errors,
                "warnings": warnings
            }
            
            return preview
            
        except json.JSONDecodeError as e:
            return {
                "error": f"Invalid JSON format: {str(e)}",
                "file_type": "JSON"
            }
        except Exception as e:
            return {
                "error": f"Failed to preview file: {str(e)}",
                "file_type": "JSON"
            }
    
    def _import_json_data(self, data: Dict[str, Any], field_mapping: Optional[List[FieldMapping]] = None) -> ImportResult:
        """Import the actual JSON data."""
        imported = 0
        updated = 0
        skipped = 0
        errors = []
        
        try:
            # Import reporting event if present
            if "reportingEvent" in data:
                re_data = data["reportingEvent"]
                if field_mapping:
                    re_data = self._apply_field_mapping(re_data, field_mapping)
                
                from app.models.ars import ReportingEvent
                
                if not self._check_duplicate(ReportingEvent, re_data.get("id")):
                    # Convert datetime strings back to datetime objects
                    re_data = self._convert_datetime_fields(re_data)
                    reporting_event = ReportingEvent(**re_data)
                    self.db.add(reporting_event)
                    imported += 1
                elif self.config.update_existing:
                    existing = self.db.query(ReportingEvent).filter(
                        ReportingEvent.id == re_data.get("id")
                    ).first()
                    re_data = self._convert_datetime_fields(re_data)
                    for key, value in re_data.items():
                        if hasattr(existing, key):
                            setattr(existing, key, value)
                    updated += 1
                else:
                    skipped += 1
            
            # Import analyses if present
            if "analyses" in data:
                total_analyses = len(data["analyses"])
                for i, analysis_data in enumerate(data["analyses"]):
                    try:
                        if field_mapping:
                            analysis_data = self._apply_field_mapping(analysis_data, field_mapping)
                        
                        # Convert datetime fields
                        analysis_data = self._convert_datetime_fields(analysis_data)
                        
                        from app.models.ars import Analysis
                        
                        record, was_modified = self._create_or_update_record(
                            Analysis, analysis_data, analysis_data.get("id")
                        )
                        
                        if was_modified:
                            if self._check_duplicate(Analysis, analysis_data.get("id")):
                                updated += 1
                            else:
                                imported += 1
                        else:
                            skipped += 1
                            
                        # Update progress
                        progress = 40 + ((i + 1) / total_analyses) * 50
                        self._update_progress(progress, 100, f"Imported analysis {i + 1}/{total_analyses}")
                        
                    except Exception as e:
                        errors.append(f"Failed to import analysis {i}: {str(e)}")
            
            # Import other sections
            section_models = {
                "methods": "AnalysisMethod",
                "analysisSets": "AnalysisSet", 
                "dataSubsets": "DataSubset",
                "groups": "Group",
                "operations": "Operation",
                "outputs": "Output",
                "whereClauses": "WhereClause"
            }
            
            for section, model_name in section_models.items():
                if section in data:
                    section_imported, section_updated, section_skipped, section_errors = self._import_section(
                        data[section], model_name, field_mapping
                    )
                    imported += section_imported
                    updated += section_updated
                    skipped += section_skipped
                    errors.extend(section_errors)
            
            return ImportResult(
                success=len(errors) == 0,
                message="JSON import completed" + (f" with {len(errors)} errors" if errors else " successfully"),
                records_imported=imported,
                records_updated=updated,
                records_skipped=skipped,
                errors=errors,
                import_time=datetime.now()
            )
            
        except Exception as e:
            return ImportResult(
                success=False,
                message=f"Import failed: {str(e)}",
                records_imported=imported,
                records_updated=updated,
                records_skipped=skipped,
                errors=errors + [str(e)],
                import_time=datetime.now()
            )
    
    def _import_section(self, section_data: List[Dict[str, Any]], model_name: str, 
                       field_mapping: Optional[List[FieldMapping]] = None) -> Tuple[int, int, int, List[str]]:
        """Import a specific section of data."""
        imported = 0
        updated = 0
        skipped = 0
        errors = []
        
        for item_data in section_data:
            try:
                if field_mapping:
                    item_data = self._apply_field_mapping(item_data, field_mapping)
                
                # Convert datetime fields
                item_data = self._convert_datetime_fields(item_data)
                
                # This is a simplified version - in reality you'd use the actual model class
                imported += 1
                
            except Exception as e:
                errors.append(f"Failed to import {model_name}: {str(e)}")
        
        return imported, updated, skipped, errors
    
    def _convert_datetime_fields(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert ISO datetime strings back to datetime objects."""
        datetime_fields = ["created_at", "updated_at", "date", "timestamp"]
        
        for field in datetime_fields:
            if field in data and isinstance(data[field], str):
                try:
                    data[field] = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
                except (ValueError, TypeError):
                    # Keep as string if conversion fails
                    pass
        
        return data
    
    def _validate_json_types(self, data: Dict[str, Any], errors: List[str]):
        """Validate JSON-specific data types and constraints."""
        # Check for null values in required fields
        if "reportingEvent" in data and data["reportingEvent"]:
            re_data = data["reportingEvent"]
            if re_data.get("id") is None:
                errors.append("Reporting event ID cannot be null")
        
        # Check arrays are properly formatted
        array_fields = ["analyses", "methods", "analysisSets", "dataSubsets", "groups", "operations", "outputs", "whereClauses"]
        for field in array_fields:
            if field in data and data[field] is not None and not isinstance(data[field], list):
                errors.append(f"Field '{field}' must be an array or null")
    
    def _validate_reporting_event(self, re_data: Any) -> List[str]:
        """Validate reporting event data."""
        errors = []
        
        if not isinstance(re_data, dict):
            errors.append("Reporting event must be an object")
            return errors
        
        required_fields = ["id", "name"]
        errors.extend(self._validate_required_fields(re_data, required_fields))
        
        # JSON-specific validations
        if "id" in re_data and not isinstance(re_data["id"], str):
            errors.append("Reporting event ID must be a string")
        
        return errors
    
    def _validate_analysis(self, analysis_data: Any, context: str) -> List[str]:
        """Validate analysis data."""
        errors = []
        
        if not isinstance(analysis_data, dict):
            errors.append(f"{context}: Analysis must be an object")
            return errors
        
        required_fields = ["id", "name"]
        for field in required_fields:
            if field not in analysis_data or analysis_data[field] is None:
                errors.append(f"{context}: Missing required field '{field}'")
        
        # JSON-specific validations
        if "id" in analysis_data and not isinstance(analysis_data["id"], str):
            errors.append(f"{context}: Analysis ID must be a string")
        
        return errors