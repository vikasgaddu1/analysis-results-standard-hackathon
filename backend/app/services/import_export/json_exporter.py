"""JSON export service for ARS data."""

import json
from typing import Any, Dict, List
from datetime import datetime
import os

from .base_exporter import BaseExporter, ExportResult


class JSONExporter(BaseExporter):
    """JSON format exporter for ARS data."""
    
    def export_reporting_event(self, reporting_event_id: str, output_path: str) -> ExportResult:
        """Export a complete reporting event to JSON format."""
        try:
            self._update_progress(0, 100, "Starting JSON export...")
            
            # Get the data
            data = self._get_reporting_event_data(reporting_event_id)
            self._update_progress(30, 100, "Data retrieved, validating...")
            
            # Validate data
            errors = self._validate_export_data(data)
            if errors:
                return ExportResult(
                    success=False,
                    message=f"Validation failed: {'; '.join(errors)}",
                    records_exported=0,
                    errors=errors,
                    export_time=datetime.now()
                )
            
            self._update_progress(50, 100, "Writing JSON file...")
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Write JSON file
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(
                    data, 
                    f, 
                    indent=2,
                    ensure_ascii=False,
                    default=self._json_serializer
                )
            
            self._update_progress(100, 100, "Export completed")
            
            return ExportResult(
                success=True,
                message="JSON export completed successfully",
                file_path=output_path,
                records_exported=len(data.get("analyses", [])),
                export_time=datetime.now()
            )
            
        except Exception as e:
            return ExportResult(
                success=False,
                message=f"JSON export failed: {str(e)}",
                records_exported=0,
                errors=[str(e)],
                export_time=datetime.now()
            )
    
    def export_analyses(self, analysis_ids: List[str], output_path: str) -> ExportResult:
        """Export specific analyses to JSON format."""
        try:
            self._update_progress(0, 100, "Starting analyses export...")
            
            data = {
                "analyses": [],
                "methods": [],
                "analysisSets": [],
                "dataSubsets": [],
                "groups": [],
                "operations": [],
                "outputs": [],
                "whereClauses": [],
                "metadata": {
                    "exportedAt": datetime.now().isoformat(),
                    "exportFormat": "JSON",
                    "recordCount": 0
                }
            }
            
            from app.models.ars import Analysis
            
            for i, analysis_id in enumerate(analysis_ids):
                analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
                if analysis:
                    data["analyses"].append(self._serialize_model(analysis))
                    
                progress = ((i + 1) / len(analysis_ids)) * 80
                self._update_progress(progress, 100, f"Processing analysis {i + 1}/{len(analysis_ids)}")
            
            data["metadata"]["recordCount"] = len(data["analyses"])
            
            # Write JSON file
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=self._json_serializer)
            
            self._update_progress(100, 100, "Export completed")
            
            return ExportResult(
                success=True,
                message="Analyses JSON export completed successfully",
                file_path=output_path,
                records_exported=len(data["analyses"]),
                export_time=datetime.now()
            )
            
        except Exception as e:
            return ExportResult(
                success=False,
                message=f"Analyses JSON export failed: {str(e)}",
                records_exported=0,
                errors=[str(e)],
                export_time=datetime.now()
            )
    
    def export_custom_query(self, query_params: Dict[str, Any], output_path: str) -> ExportResult:
        """Export data based on custom query parameters to JSON format."""
        try:
            self._update_progress(0, 100, "Processing custom query...")
            
            # This would implement custom query logic based on query_params
            data = {
                "queryParameters": query_params,
                "results": [],
                "metadata": {
                    "exportedAt": datetime.now().isoformat(),
                    "exportFormat": "JSON",
                    "queryExecutedAt": datetime.now().isoformat()
                }
            }
            
            # Write JSON file
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=self._json_serializer)
            
            self._update_progress(100, 100, "Custom query export completed")
            
            return ExportResult(
                success=True,
                message="Custom query JSON export completed successfully",
                file_path=output_path,
                records_exported=len(data["results"]),
                export_time=datetime.now()
            )
            
        except Exception as e:
            return ExportResult(
                success=False,
                message=f"Custom query JSON export failed: {str(e)}",
                records_exported=0,
                errors=[str(e)],
                export_time=datetime.now()
            )
    
    def _json_serializer(self, obj):
        """Custom JSON serializer for datetime and other objects."""
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")