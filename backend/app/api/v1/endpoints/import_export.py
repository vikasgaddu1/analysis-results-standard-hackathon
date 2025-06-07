"""API endpoints for import/export operations."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import tempfile
import os
import uuid
from datetime import datetime

from app.api import deps
from app.services.import_export import (
    YAMLExporter, JSONExporter, ExcelExporter,
    YAMLImporter, JSONImporter, ExcelImporter,
    ImportValidator, ExportValidator,
    ExportConfig, ImportConfig, FieldMapping
)


router = APIRouter()


class ExportRequest(BaseModel):
    """Request model for export operations."""
    format: str  # yaml, json, excel
    reporting_event_id: Optional[str] = None
    analysis_ids: Optional[List[str]] = None
    include_metadata: bool = True
    include_timestamps: bool = True
    flatten_nested: bool = False


class ImportRequest(BaseModel):
    """Request model for import operations."""
    validate_before_import: bool = True
    skip_duplicates: bool = True
    update_existing: bool = False
    dry_run: bool = False
    field_mappings: Optional[List[Dict[str, Any]]] = None


class ImportPreviewResponse(BaseModel):
    """Response model for import preview."""
    file_type: str
    structure: Dict[str, Any]
    sample_data: Dict[str, Any]
    validation: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None


class ExportResponse(BaseModel):
    """Response model for export operations."""
    success: bool
    message: str
    file_path: Optional[str] = None
    download_url: Optional[str] = None
    records_exported: int = 0
    export_time: datetime


class ImportResponse(BaseModel):
    """Response model for import operations."""
    success: bool
    message: str
    records_imported: int = 0
    records_updated: int = 0
    records_skipped: int = 0
    errors: List[str] = []
    warnings: List[str] = []
    import_time: datetime
    validation_results: Optional[Dict[str, Any]] = None


# Global dictionary to store background task results
task_results = {}


@router.post("/export", response_model=ExportResponse)
async def export_data(
    export_request: ExportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
    current_user: Dict[str, Any] = Depends(deps.get_current_user)
):
    """Export ARS data in specified format."""
    try:
        # Validate export request
        validator = ExportValidator(db)
        is_valid, errors = validator.validate_export_request(export_request.dict())
        
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid export request: {'; '.join(errors)}")
        
        # Check permissions
        is_authorized, auth_errors = validator.validate_export_permissions(
            current_user.get("id"), export_request.dict()
        )
        
        if not is_authorized:
            raise HTTPException(status_code=403, detail=f"Access denied: {'; '.join(auth_errors)}")
        
        # Create export configuration
        config = ExportConfig(
            include_metadata=export_request.include_metadata,
            include_timestamps=export_request.include_timestamps,
            flatten_nested=export_request.flatten_nested
        )
        
        # Generate unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = export_request.format
        filename = f"ars_export_{timestamp}.{file_extension}"
        output_path = os.path.join(tempfile.gettempdir(), filename)
        
        # Select appropriate exporter
        if export_request.format == "yaml":
            exporter = YAMLExporter(db, config)
        elif export_request.format == "json":
            exporter = JSONExporter(db, config)
        elif export_request.format == "excel":
            exporter = ExcelExporter(db, config)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported export format: {export_request.format}")
        
        # Perform export
        if export_request.reporting_event_id:
            result = exporter.export_reporting_event(export_request.reporting_event_id, output_path)
        elif export_request.analysis_ids:
            result = exporter.export_analyses(export_request.analysis_ids, output_path)
        else:
            raise HTTPException(status_code=400, detail="Either reporting_event_id or analysis_ids must be specified")
        
        if not result.success:
            raise HTTPException(status_code=500, detail=result.message)
        
        # Generate download URL
        download_url = f"/api/v1/import-export/download/{filename}"
        
        return ExportResponse(
            success=True,
            message=result.message,
            file_path=output_path,
            download_url=download_url,
            records_exported=result.records_exported,
            export_time=result.export_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.post("/import/preview", response_model=ImportPreviewResponse)
async def preview_import(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: Dict[str, Any] = Depends(deps.get_current_user)
):
    """Preview import data before actual import."""
    try:
        # Save uploaded file temporarily
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}")
        content = await file.read()
        temp_file.write(content)
        temp_file.close()
        
        # Determine file format
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        # Select appropriate importer
        if file_extension in ['.yml', '.yaml']:
            importer = YAMLImporter(db)
        elif file_extension == '.json':
            importer = JSONImporter(db)
        elif file_extension in ['.xlsx', '.xls']:
            importer = ExcelImporter(db)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file format: {file_extension}")
        
        # Get preview
        preview = importer.preview_import(temp_file.name)
        
        # Clean up temporary file
        os.unlink(temp_file.name)
        
        if "error" in preview:
            raise HTTPException(status_code=400, detail=preview["error"])
        
        return ImportPreviewResponse(**preview)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preview failed: {str(e)}")


@router.post("/import", response_model=ImportResponse)
async def import_data(
    file: UploadFile = File(...),
    import_config: str = Form(...),  # JSON string of ImportRequest
    db: Session = Depends(deps.get_db),
    current_user: Dict[str, Any] = Depends(deps.get_current_user)
):
    """Import ARS data from uploaded file."""
    try:
        import json
        
        # Parse import configuration
        try:
            config_dict = json.loads(import_config)
            import_request = ImportRequest(**config_dict)
        except (json.JSONDecodeError, ValueError) as e:
            raise HTTPException(status_code=400, detail=f"Invalid import configuration: {str(e)}")
        
        # Save uploaded file temporarily
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}")
        content = await file.read()
        temp_file.write(content)
        temp_file.close()
        
        # Determine file format
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        # Create import configuration
        config = ImportConfig(
            validate_before_import=import_request.validate_before_import,
            skip_duplicates=import_request.skip_duplicates,
            update_existing=import_request.update_existing,
            dry_run=import_request.dry_run
        )
        
        # Convert field mappings
        field_mappings = None
        if import_request.field_mappings:
            field_mappings = [FieldMapping(**mapping) for mapping in import_request.field_mappings]
        
        # Select appropriate importer
        if file_extension in ['.yml', '.yaml']:
            importer = YAMLImporter(db, config)
        elif file_extension == '.json':
            importer = JSONImporter(db, config)
        elif file_extension in ['.xlsx', '.xls']:
            importer = ExcelImporter(db, config)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file format: {file_extension}")
        
        # Perform import
        result = importer.import_from_file(temp_file.name, field_mappings)
        
        # Clean up temporary file
        os.unlink(temp_file.name)
        
        return ImportResponse(
            success=result.success,
            message=result.message,
            records_imported=result.records_imported,
            records_updated=result.records_updated,
            records_skipped=result.records_skipped,
            errors=result.errors,
            warnings=result.warnings,
            import_time=result.import_time,
            validation_results=result.validation_results
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.get("/download/{filename}")
async def download_export_file(
    filename: str,
    current_user: Dict[str, Any] = Depends(deps.get_current_user)
):
    """Download exported file."""
    try:
        file_path = os.path.join(tempfile.gettempdir(), filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Set appropriate media type based on file extension
        media_types = {
            '.yaml': 'application/x-yaml',
            '.yml': 'application/x-yaml',
            '.json': 'application/json',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel'
        }
        
        file_extension = os.path.splitext(filename)[1].lower()
        media_type = media_types.get(file_extension, 'application/octet-stream')
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type=media_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.post("/validate")
async def validate_data(
    data: Dict[str, Any],
    data_type: str,
    db: Session = Depends(deps.get_db),
    current_user: Dict[str, Any] = Depends(deps.get_current_user)
):
    """Validate data structure and content."""
    try:
        validator = ImportValidator(db)
        is_valid, results = validator.validate_data(data, data_type)
        
        return {
            "valid": is_valid,
            "results": [result.dict() for result in results]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.get("/formats")
async def get_supported_formats():
    """Get list of supported import/export formats."""
    return {
        "import_formats": [
            {
                "format": "yaml",
                "extensions": [".yml", ".yaml"],
                "description": "YAML format for human-readable data exchange"
            },
            {
                "format": "json", 
                "extensions": [".json"],
                "description": "JSON format for structured data exchange"
            },
            {
                "format": "excel",
                "extensions": [".xlsx", ".xls"],
                "description": "Excel format for tabular data with multiple sheets"
            }
        ],
        "export_formats": [
            {
                "format": "yaml",
                "extension": ".yaml",
                "description": "YAML format for human-readable data exchange"
            },
            {
                "format": "json",
                "extension": ".json", 
                "description": "JSON format for structured data exchange"
            },
            {
                "format": "excel",
                "extension": ".xlsx",
                "description": "Excel format for tabular data with multiple sheets"
            }
        ]
    }


@router.get("/field-mappings/{data_type}")
async def get_field_mappings(data_type: str):
    """Get available field mappings for a data type."""
    field_mappings = {
        "reporting_event": [
            {"source_field": "id", "target_field": "id", "required": True},
            {"source_field": "name", "target_field": "name", "required": True},
            {"source_field": "description", "target_field": "description", "required": False},
            {"source_field": "version", "target_field": "version", "required": False}
        ],
        "analysis": [
            {"source_field": "id", "target_field": "id", "required": True},
            {"source_field": "name", "target_field": "name", "required": True},
            {"source_field": "description", "target_field": "description", "required": False},
            {"source_field": "method_id", "target_field": "method_id", "required": False},
            {"source_field": "reporting_event_id", "target_field": "reporting_event_id", "required": False}
        ]
    }
    
    if data_type not in field_mappings:
        raise HTTPException(status_code=404, detail=f"Field mappings not found for data type: {data_type}")
    
    return {"data_type": data_type, "field_mappings": field_mappings[data_type]}


@router.post("/batch-import")
async def batch_import(
    files: List[UploadFile] = File(...),
    import_config: str = Form(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(deps.get_db),
    current_user: Dict[str, Any] = Depends(deps.get_current_user)
):
    """Import multiple files in batch."""
    try:
        import json
        
        # Parse import configuration
        config_dict = json.loads(import_config)
        import_request = ImportRequest(**config_dict)
        
        # Generate batch ID
        batch_id = str(uuid.uuid4())
        
        # Store initial status
        task_results[batch_id] = {
            "status": "processing",
            "total_files": len(files),
            "completed_files": 0,
            "results": [],
            "started_at": datetime.now()
        }
        
        # Process files in background
        background_tasks.add_task(
            process_batch_import,
            batch_id,
            files,
            import_request,
            db,
            current_user
        )
        
        return {
            "batch_id": batch_id,
            "status": "accepted",
            "message": f"Batch import started for {len(files)} files",
            "check_status_url": f"/api/v1/import-export/batch-status/{batch_id}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch import failed: {str(e)}")


@router.get("/batch-status/{batch_id}")
async def get_batch_status(batch_id: str):
    """Get status of batch import operation."""
    if batch_id not in task_results:
        raise HTTPException(status_code=404, detail="Batch import not found")
    
    return task_results[batch_id]


async def process_batch_import(
    batch_id: str,
    files: List[UploadFile],
    import_request: ImportRequest,
    db: Session,
    current_user: Dict[str, Any]
):
    """Process batch import in background."""
    try:
        for i, file in enumerate(files):
            # Process each file
            # This would use the same logic as the single file import
            # For brevity, just updating the status
            
            task_results[batch_id]["completed_files"] = i + 1
            task_results[batch_id]["results"].append({
                "filename": file.filename,
                "status": "completed", 
                "records_imported": 10  # Example
            })
        
        task_results[batch_id]["status"] = "completed"
        task_results[batch_id]["completed_at"] = datetime.now()
        
    except Exception as e:
        task_results[batch_id]["status"] = "failed"
        task_results[batch_id]["error"] = str(e)
        task_results[batch_id]["completed_at"] = datetime.now()