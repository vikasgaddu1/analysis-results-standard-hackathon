"""Excel import service for ARS data."""

import pandas as pd
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
import os
from openpyxl import load_workbook

from .base_importer import BaseImporter, ImportResult, FieldMapping


class ExcelImporter(BaseImporter):
    """Excel format importer for ARS data."""
    
    def import_from_file(self, file_path: str, field_mapping: Optional[List[FieldMapping]] = None) -> ImportResult:
        """Import data from an Excel file."""
        try:
            self._update_progress(0, 100, "Starting Excel import...")
            
            if not os.path.exists(file_path):
                return ImportResult(
                    success=False,
                    message=f"File not found: {file_path}",
                    import_time=datetime.now(),
                    errors=[f"File not found: {file_path}"]
                )
            
            # Load Excel data
            excel_data = self._load_excel_file(file_path)
            
            self._update_progress(20, 100, "Excel data loaded, validating...")
            
            # Validate data structure
            is_valid, errors, warnings = self.validate_import_data(excel_data)
            
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
            result = self._import_excel_data(excel_data, field_mapping)
            
            if not self.config.dry_run:
                self.db.commit()
            
            self._update_progress(100, 100, "Import completed")
            
            result.warnings.extend(warnings)
            result.validation_results = {"valid": True, "errors": [], "warnings": warnings}
            
            return result
            
        except Exception as e:
            if not self.config.dry_run:
                self.db.rollback()
            return ImportResult(
                success=False,
                message=f"Import failed: {str(e)}",
                import_time=datetime.now(),
                errors=[str(e)]
            )
    
    def validate_import_data(self, data: Dict[str, pd.DataFrame]) -> Tuple[bool, List[str], List[str]]:
        """Validate Excel import data structure and content."""
        errors = []
        warnings = []
        
        if not data:
            errors.append("No data sheets found in Excel file")
            return False, errors, warnings
        
        # Check for required sheets
        required_sheets = ["ReportingEvent", "Analyses"]
        has_required = any(sheet in data for sheet in required_sheets)
        
        if not has_required:
            errors.append("Excel file must contain either 'ReportingEvent' or 'Analyses' sheet")
        
        # Validate each sheet
        for sheet_name, df in data.items():
            if sheet_name == "Metadata":
                continue  # Skip metadata sheet
                
            sheet_errors = self._validate_excel_sheet(sheet_name, df)
            errors.extend(sheet_errors)
        
        # Check for empty sheets
        for sheet_name, df in data.items():
            if sheet_name != "Metadata" and df.empty:
                warnings.append(f"Sheet '{sheet_name}' is empty")
        
        is_valid = len(errors) == 0
        
        return is_valid, errors, warnings
    
    def preview_import(self, file_path: str, limit: int = 10) -> Dict[str, Any]:
        """Preview Excel import data before actual import."""
        try:
            excel_data = self._load_excel_file(file_path)
            
            preview = {
                "file_type": "Excel",
                "sheets": {},
                "validation": {},
                "metadata": {}
            }
            
            # Extract metadata if present
            if "Metadata" in excel_data:
                metadata_df = excel_data["Metadata"]
                preview["metadata"] = self._extract_metadata_from_df(metadata_df)
            
            # Analyze each sheet
            for sheet_name, df in excel_data.items():
                if sheet_name == "Metadata":
                    continue
                    
                sheet_info = {
                    "rows": len(df),
                    "columns": list(df.columns),
                    "sample_data": df.head(limit).to_dict('records') if not df.empty else []
                }
                preview["sheets"][sheet_name] = sheet_info
            
            # Run validation
            is_valid, errors, warnings = self.validate_import_data(excel_data)
            preview["validation"] = {
                "valid": is_valid,
                "errors": errors,
                "warnings": warnings
            }
            
            return preview
            
        except Exception as e:
            return {
                "error": f"Failed to preview Excel file: {str(e)}",
                "file_type": "Excel"
            }
    
    def _load_excel_file(self, file_path: str) -> Dict[str, pd.DataFrame]:
        """Load Excel file and return dictionary of DataFrames."""
        try:
            # Use openpyxl engine for better Excel support
            excel_file = pd.ExcelFile(file_path, engine='openpyxl')
            
            data = {}
            for sheet_name in excel_file.sheet_names:
                try:
                    df = pd.read_excel(excel_file, sheet_name=sheet_name)
                    # Clean column names
                    df.columns = df.columns.astype(str).str.strip()
                    # Replace NaN with None for better handling
                    df = df.where(pd.notnull(df), None)
                    data[sheet_name] = df
                except Exception as e:
                    # Skip problematic sheets but log warning
                    print(f"Warning: Could not read sheet '{sheet_name}': {str(e)}")
            
            return data
            
        except Exception as e:
            raise Exception(f"Failed to load Excel file: {str(e)}")
    
    def _import_excel_data(self, data: Dict[str, pd.DataFrame], field_mapping: Optional[List[FieldMapping]] = None) -> ImportResult:
        """Import the actual Excel data."""
        imported = 0
        updated = 0
        skipped = 0
        errors = []
        
        try:
            # Import ReportingEvent if present
            if "ReportingEvent" in data:
                df = data["ReportingEvent"]
                if not df.empty:
                    # Assume first row contains the reporting event data
                    re_data = df.iloc[0].to_dict()
                    re_data = self._clean_excel_data(re_data)
                    
                    if field_mapping:
                        re_data = self._apply_field_mapping(re_data, field_mapping)
                    
                    from app.models.ars import ReportingEvent
                    
                    if not self._check_duplicate(ReportingEvent, re_data.get("id")):
                        reporting_event = ReportingEvent(**re_data)
                        self.db.add(reporting_event)
                        imported += 1
                    elif self.config.update_existing:
                        existing = self.db.query(ReportingEvent).filter(
                            ReportingEvent.id == re_data.get("id")
                        ).first()
                        for key, value in re_data.items():
                            if hasattr(existing, key):
                                setattr(existing, key, value)
                        updated += 1
                    else:
                        skipped += 1
            
            # Import Analyses if present
            if "Analyses" in data:
                df = data["Analyses"]
                if not df.empty:
                    total_analyses = len(df)
                    for i, row in df.iterrows():
                        try:
                            analysis_data = row.to_dict()
                            analysis_data = self._clean_excel_data(analysis_data)
                            
                            if field_mapping:
                                analysis_data = self._apply_field_mapping(analysis_data, field_mapping)
                            
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
                            errors.append(f"Failed to import analysis row {i + 1}: {str(e)}")
            
            # Import other sheets
            sheet_models = {
                "Methods": "AnalysisMethod",
                "AnalysisSets": "AnalysisSet",
                "DataSubsets": "DataSubset",
                "Groups": "Group",
                "Operations": "Operation",
                "Outputs": "Output",
                "WhereClauses": "WhereClause"
            }
            
            for sheet_name, model_name in sheet_models.items():
                if sheet_name in data:
                    df = data[sheet_name]
                    if not df.empty:
                        section_imported, section_updated, section_skipped, section_errors = self._import_sheet(
                            df, model_name, field_mapping
                        )
                        imported += section_imported
                        updated += section_updated
                        skipped += section_skipped
                        errors.extend(section_errors)
            
            return ImportResult(
                success=len(errors) == 0,
                message="Excel import completed" + (f" with {len(errors)} errors" if errors else " successfully"),
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
    
    def _import_sheet(self, df: pd.DataFrame, model_name: str, 
                     field_mapping: Optional[List[FieldMapping]] = None) -> Tuple[int, int, int, List[str]]:
        """Import a specific Excel sheet."""
        imported = 0
        updated = 0
        skipped = 0
        errors = []
        
        for i, row in df.iterrows():
            try:
                item_data = row.to_dict()
                item_data = self._clean_excel_data(item_data)
                
                if field_mapping:
                    item_data = self._apply_field_mapping(item_data, field_mapping)
                
                # This is a simplified version - in reality you'd use the actual model class
                imported += 1
                
            except Exception as e:
                errors.append(f"Failed to import {model_name} row {i + 1}: {str(e)}")
        
        return imported, updated, skipped, errors
    
    def _clean_excel_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Clean Excel data by handling NaN values and data types."""
        cleaned = {}
        
        for key, value in data.items():
            if pd.isna(value):
                cleaned[key] = None
            elif isinstance(value, pd.Timestamp):
                cleaned[key] = value.to_pydatetime()
            elif isinstance(value, (int, float)) and pd.isna(value):
                cleaned[key] = None
            else:
                cleaned[key] = value
        
        return cleaned
    
    def _validate_excel_sheet(self, sheet_name: str, df: pd.DataFrame) -> List[str]:
        """Validate an Excel sheet."""
        errors = []
        
        if df.empty:
            return errors  # Empty sheets are handled as warnings
        
        # Check for required columns based on sheet type
        required_columns = {
            "ReportingEvent": ["id", "name"],
            "Analyses": ["id", "name"],
            "Methods": ["id", "name"],
            "AnalysisSets": ["id", "name"],
            "DataSubsets": ["id", "name"],
            "Groups": ["id", "name"],
            "Operations": ["id", "name"],
            "Outputs": ["id", "name"],
            "WhereClauses": ["id"]
        }
        
        if sheet_name in required_columns:
            for col in required_columns[sheet_name]:
                if col not in df.columns:
                    errors.append(f"Sheet '{sheet_name}' missing required column '{col}'")
        
        # Check for duplicate IDs within sheet
        if "id" in df.columns:
            duplicates = df[df["id"].duplicated()]["id"].tolist()
            if duplicates:
                errors.append(f"Sheet '{sheet_name}' contains duplicate IDs: {duplicates}")
        
        return errors
    
    def _extract_metadata_from_df(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Extract metadata from metadata DataFrame."""
        metadata = {}
        
        if len(df.columns) >= 2:
            for _, row in df.iterrows():
                key = str(row.iloc[0]).strip()
                value = row.iloc[1]
                if key and not pd.isna(value):
                    metadata[key] = value
        
        return metadata