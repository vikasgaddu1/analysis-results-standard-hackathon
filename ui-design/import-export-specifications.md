# Data Import/Export Specifications

## Overview

The Clinical Trial Table Metadata System must support flexible import and export of metadata in multiple formats to ensure interoperability with existing workflows and systems. This specification defines the supported formats, data mappings, validation rules, and processing workflows.

## Supported Formats

### 1. YAML Format (Primary)

**Advantages:**
- Human-readable and editable
- Native support for complex nested structures
- Comments support for documentation
- Maintains ARS model structure

**File Structure:**
```yaml
# ARS Clinical Trial Metadata
# Generated by Clinical Trial Table Metadata System
version: "1.0"
metadata:
  study_id: "ABC123"
  name: "Safety Analysis Study"
  description: "Comprehensive safety analysis for Phase III trial"
  created_by: "john.doe@company.com"
  created_at: "2024-01-15T10:30:00Z"
  last_modified: "2024-01-20T14:45:00Z"
  
reporting_event:
  id: "RE_ABC123_SAFETY"
  name: "ABC123 Safety Reporting Event"
  version: "1.0"
  
  # Analysis Sets (Populations)
  analysis_sets:
    - id: "SAFFL"
      name: "Safety Population"
      description: "All subjects who received at least one dose"
      condition:
        dataset: "ADSL"
        variable: "SAFFL"
        comparator: "EQ"
        value: ["Y"]
    
    - id: "ITTFL"
      name: "Intent-to-Treat Population"
      description: "All randomized subjects"
      condition:
        dataset: "ADSL"
        variable: "ITTFL"
        comparator: "EQ"
        value: ["Y"]
  
  # Data Subsets
  data_subsets:
    - id: "DS_TEAE"
      name: "Treatment Emergent AEs"
      dataset: "ADAE"
      where_clause:
        condition:
          dataset: "ADAE"
          variable: "TRTEMFL"
          comparator: "EQ"
          value: ["Y"]
  
  # Methods Library
  methods:
    - id: "METHOD_DESC_SUMMARY"
      name: "Descriptive Summary"
      description: "Count and percentage with 95% CI"
      operations:
        - id: "OP_COUNT"
          name: "Count"
          result_pattern: "n"
        - id: "OP_PERCENT"
          name: "Percentage"
          result_pattern: "x.x%"
  
  # Analyses
  analyses:
    - id: "AE_SUMMARY_01"
      name: "Adverse Events Summary Table"
      version: "1.0"
      purpose: 
        controlled_term: "PRIMARY OBJECTIVE"
      reason:
        controlled_term: "SPECIFIED IN SAP OR PROTOCOL"
      method_id: "METHOD_DESC_SUMMARY"
      dataset: "ADAE"
      variable: "AEDECOD"
      analysis_set_id: "SAFFL"
      data_subset_id: "DS_TEAE"
      
      # Groupings
      groupings:
        - id: "GRP_TRT"
          name: "Treatment Groups"
          dataset: "ADSL"
          variable: "TRT01A"
          data_driven: false
          groups:
            - id: "PLACEBO"
              name: "Placebo"
              value: "Placebo"
            - id: "DRUG_A"
              name: "Drug A 10mg"
              value: "Drug A 10mg"
      
      # Results (if included)
      results:
        - group_id: "PLACEBO"
          result_groups:
            - group_value: "Overall"
              results:
                - operation_id: "OP_COUNT"
                  raw_value: 25
                  formatted_value: "25"
                - operation_id: "OP_PERCENT"
                  raw_value: 0.50
                  formatted_value: "50.0%"
  
  # Outputs
  outputs:
    - id: "TABLE_AE_SUMMARY"
      name: "Table 14.2.1 - Summary of Adverse Events"
      version: "1.0"
      file_specifications:
        - name: "ae_summary_table.rtf"
          file_type:
            controlled_term: "RTF"
          location: "./outputs/"
      
      # Display Structure
      displays:
        - name: "Main Display"
          display_sections:
            - id: "TITLE_SECTION"
              section_type:
                controlled_term: "TITLE"
              sub_sections:
                - text: "Table 14.2.1"
                - text: "Summary of Adverse Events"
                - text: "Safety Population"
            
            - id: "HEADER_SECTION"
              section_type:
                controlled_term: "HEADER"
              sub_sections:
                - text: "System Organ Class"
                - text: "Preferred Term"
                - text: "Placebo (N=50)"
                - text: "Drug A 10mg (N=48)"
          
          # Link to analyses
          analysis_outputs:
            - analysis_id: "AE_SUMMARY_01"
              output_id: "TABLE_AE_SUMMARY"

  # List of Contents
  lists_of_contents:
    - id: "MAIN_LOC"
      name: "Main List of Contents"
      list_items:
        - name: "14.2 Safety Analysis"
          level: 1
          sub_list:
            - name: "14.2.1 Summary of Adverse Events"
              level: 2
              output_id: "TABLE_AE_SUMMARY"
```

### 2. JSON Format

**Advantages:**
- Wide programming language support
- Compact file size
- API-friendly format
- Easy validation with JSON Schema

**Structure:**
```json
{
  "version": "1.0",
  "metadata": {
    "study_id": "ABC123",
    "name": "Safety Analysis Study",
    "created_by": "john.doe@company.com",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "reporting_event": {
    "id": "RE_ABC123_SAFETY",
    "name": "ABC123 Safety Reporting Event",
    "analysis_sets": [
      {
        "id": "SAFFL",
        "name": "Safety Population",
        "condition": {
          "dataset": "ADSL",
          "variable": "SAFFL",
          "comparator": "EQ",
          "value": ["Y"]
        }
      }
    ],
    "analyses": [
      {
        "id": "AE_SUMMARY_01",
        "name": "Adverse Events Summary Table",
        "method_id": "METHOD_DESC_SUMMARY",
        "dataset": "ADAE",
        "variable": "AEDECOD"
      }
    ]
  }
}
```

### 3. Excel Format

**Advantages:**
- Familiar interface for statisticians
- Supports multiple worksheets for organization
- Built-in validation and formulas
- Easy review and collaboration

**Worksheet Structure:**

#### Sheet 1: Study Information
| Field | Value |
|-------|--------|
| Study ID | ABC123 |
| Study Name | Safety Analysis Study |
| Version | 1.0 |
| Created By | john.doe@company.com |
| Created Date | 2024-01-15 |

#### Sheet 2: Analysis Sets
| ID | Name | Description | Dataset | Variable | Comparator | Values |
|----|------|------------|---------|----------|------------|---------|
| SAFFL | Safety Population | All subjects who received at least one dose | ADSL | SAFFL | EQ | Y |
| ITTFL | Intent-to-Treat Population | All randomized subjects | ADSL | ITTFL | EQ | Y |

#### Sheet 3: Methods
| ID | Name | Description | Operations |
|----|------|------------|------------|
| METHOD_DESC_SUMMARY | Descriptive Summary | Count and percentage | COUNT, PERCENT |

#### Sheet 4: Analyses
| ID | Name | Method ID | Dataset | Variable | Analysis Set | Grouping | Where Clause |
|----|------|-----------|---------|----------|--------------|----------|--------------|
| AE_SUMMARY_01 | AE Summary Table | METHOD_DESC_SUMMARY | ADAE | AEDECOD | SAFFL | TRT01A | TRTEMFL EQ 'Y' |

#### Sheet 5: Outputs
| ID | Name | Type | Format | Location | Linked Analyses |
|----|------|------|--------|----------|-----------------|
| TABLE_AE_SUMMARY | Table 14.2.1 - Summary of AEs | Table | RTF | ./outputs/ | AE_SUMMARY_01 |

#### Sheet 6: Validation Rules
| Sheet | Field | Rule | Message |
|-------|-------|------|---------|
| Analyses | ID | Required, Unique | Analysis ID must be unique |
| Analyses | Method ID | Must exist in Methods sheet | Invalid method reference |

## Import Processing Workflow

### 1. File Upload and Validation

```python
class ImportProcessor:
    def process_import(self, file: UploadedFile, format: str) -> ImportResult:
        """
        Main import processing pipeline
        """
        # Step 1: File validation
        validation_result = self.validate_file(file, format)
        if not validation_result.is_valid:
            return ImportResult(success=False, errors=validation_result.errors)
        
        # Step 2: Parse content
        parsed_data = self.parse_content(file, format)
        
        # Step 3: Schema validation
        schema_validation = self.validate_schema(parsed_data)
        if not schema_validation.is_valid:
            return ImportResult(success=False, errors=schema_validation.errors)
        
        # Step 4: Business rule validation
        business_validation = self.validate_business_rules(parsed_data)
        
        # Step 5: Conflict detection
        conflicts = self.detect_conflicts(parsed_data)
        
        # Step 6: Generate preview
        preview = self.generate_preview(parsed_data, conflicts)
        
        return ImportResult(
            success=True,
            preview=preview,
            conflicts=conflicts,
            warnings=business_validation.warnings
        )
```

### 2. Format-Specific Parsers

#### YAML Parser
```python
class YAMLImportParser:
    def parse(self, content: str) -> ParsedData:
        try:
            data = yaml.safe_load(content)
            return self.transform_to_internal_format(data)
        except yaml.YAMLError as e:
            raise ImportValidationError(f"Invalid YAML: {e}")
    
    def transform_to_internal_format(self, yaml_data: dict) -> ParsedData:
        # Transform YAML structure to internal data model
        pass
```

#### Excel Parser
```python
class ExcelImportParser:
    def parse(self, file: BinaryIO) -> ParsedData:
        workbook = openpyxl.load_workbook(file)
        
        # Parse each worksheet
        study_info = self.parse_study_sheet(workbook['Study Information'])
        analysis_sets = self.parse_analysis_sets_sheet(workbook['Analysis Sets'])
        methods = self.parse_methods_sheet(workbook['Methods'])
        analyses = self.parse_analyses_sheet(workbook['Analyses'])
        outputs = self.parse_outputs_sheet(workbook['Outputs'])
        
        return ParsedData(
            study_info=study_info,
            analysis_sets=analysis_sets,
            methods=methods,
            analyses=analyses,
            outputs=outputs
        )
```

### 3. Validation Rules

#### Schema Validation
```yaml
# JSON Schema for validation
analysis_schema:
  type: object
  required: [id, name, method_id, dataset, variable]
  properties:
    id:
      type: string
      pattern: "^[A-Z0-9_-]+$"
      maxLength: 50
    name:
      type: string
      maxLength: 200
    method_id:
      type: string
      # Must reference existing method
    dataset:
      type: string
      enum: [ADSL, ADAE, ADCM, ADVS, ADLB]
    variable:
      type: string
      maxLength: 32
```

#### Business Rules
```python
BUSINESS_RULES = {
    "analyses": [
        {
            "rule": "method_exists",
            "message": "Referenced method must exist",
            "validator": lambda analysis: method_exists(analysis.method_id)
        },
        {
            "rule": "analysis_set_exists", 
            "message": "Referenced analysis set must exist",
            "validator": lambda analysis: analysis_set_exists(analysis.analysis_set_id)
        },
        {
            "rule": "unique_analysis_id",
            "message": "Analysis ID must be unique within study",
            "validator": lambda analysis: is_unique_within_study(analysis.id)
        }
    ],
    "outputs": [
        {
            "rule": "linked_analyses_exist",
            "message": "All linked analyses must exist",
            "validator": lambda output: all_analyses_exist(output.linked_analyses)
        }
    ]
}
```

### 4. Conflict Resolution

#### Conflict Types
```python
class ConflictType(Enum):
    DUPLICATE_ID = "duplicate_id"
    MODIFIED_EXISTING = "modified_existing"
    MISSING_DEPENDENCY = "missing_dependency"
    SCHEMA_MISMATCH = "schema_mismatch"
    PERMISSION_DENIED = "permission_denied"

class ImportConflict:
    type: ConflictType
    resource_type: str
    resource_id: str
    message: str
    resolution_options: List[str]
    auto_resolvable: bool
```

#### Resolution Strategies
```python
RESOLUTION_STRATEGIES = {
    ConflictType.DUPLICATE_ID: [
        "skip",           # Skip importing this item
        "overwrite",      # Replace existing item
        "rename",         # Auto-generate new ID
        "merge"           # Merge with existing item
    ],
    ConflictType.MODIFIED_EXISTING: [
        "keep_existing",  # Keep current version
        "use_imported",   # Use imported version
        "manual_review"   # Flag for manual review
    ],
    ConflictType.MISSING_DEPENDENCY: [
        "auto_create",    # Create missing dependency
        "skip_dependent", # Skip items that depend on missing resource
        "manual_link"     # Manually specify correct reference
    ]
}
```

## Export Processing Workflow

### 1. Export Configuration

```python
class ExportConfig:
    format: ExportFormat  # YAML, JSON, EXCEL
    scope: ExportScope    # FULL, PARTIAL, SELECTIVE
    include_results: bool = False
    include_metadata: bool = True
    include_documentation: bool = True
    
    # Selective export options
    selected_analyses: List[str] = None
    selected_outputs: List[str] = None
    date_range: DateRange = None
    
    # Format-specific options
    excel_options: ExcelExportOptions = None
    yaml_options: YAMLExportOptions = None
```

### 2. Export Data Pipeline

```python
class ExportProcessor:
    def export_study(self, study_id: str, config: ExportConfig) -> ExportResult:
        # Step 1: Gather data based on scope
        data = self.gather_export_data(study_id, config)
        
        # Step 2: Apply filters and transformations
        filtered_data = self.apply_filters(data, config)
        
        # Step 3: Generate format-specific output
        output = self.generate_output(filtered_data, config.format)
        
        # Step 4: Package for download
        package = self.create_download_package(output, config)
        
        return ExportResult(
            success=True,
            file_path=package.path,
            file_size=package.size,
            checksum=package.checksum
        )
```

### 3. Format-Specific Exporters

#### YAML Exporter
```python
class YAMLExporter:
    def export(self, data: StudyData, options: YAMLExportOptions) -> str:
        # Convert internal data model to YAML structure
        yaml_data = self.transform_to_yaml_format(data)
        
        # Apply formatting options
        if options.include_comments:
            yaml_data = self.add_comments(yaml_data)
        
        # Generate YAML with proper formatting
        return yaml.dump(
            yaml_data,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
            indent=2
        )
```

#### Excel Exporter
```python
class ExcelExporter:
    def export(self, data: StudyData, options: ExcelExportOptions) -> BytesIO:
        workbook = openpyxl.Workbook()
        
        # Create worksheets
        self.create_study_info_sheet(workbook, data.study_info)
        self.create_analysis_sets_sheet(workbook, data.analysis_sets)
        self.create_methods_sheet(workbook, data.methods)
        self.create_analyses_sheet(workbook, data.analyses)
        self.create_outputs_sheet(workbook, data.outputs)
        
        if options.include_validation:
            self.create_validation_sheet(workbook)
        
        # Apply formatting
        self.apply_formatting(workbook, options)
        
        # Save to BytesIO
        output = BytesIO()
        workbook.save(output)
        return output
```

## Template Support

### 1. Standard Templates

#### FDA Standard Tables and Figures Template
```yaml
template:
  id: "FDA_STF_TEMPLATE"
  name: "FDA Standard Tables and Figures"
  version: "2023.1"
  description: "Standard safety and efficacy tables for FDA submissions"
  
  predefined_analyses:
    - id: "DEMO_01"
      name: "Demographics and Baseline Characteristics"
      template: true
      method_id: "DESC_SUMMARY"
      
    - id: "AE_01"
      name: "Summary of Adverse Events"
      template: true
      method_id: "COUNT_PERCENT"
      
    - id: "LAB_01"
      name: "Laboratory Data Summary"
      template: true
      method_id: "CONTINUOUS_SUMMARY"
  
  predefined_outputs:
    - id: "TABLE_DEMO"
      name: "Table 14.1.1 Demographics and Baseline Characteristics"
      template: true
      linked_analyses: ["DEMO_01"]
```

#### PHUSE Common Safety Displays Template
```yaml
template:
  id: "PHUSE_SAFETY_TEMPLATE"
  name: "PHUSE Common Safety Displays"
  version: "1.0"
  description: "Standard safety displays recommended by PHUSE"
  
  # Template includes predefined structure but allows customization
```

### 2. Template Application

```python
class TemplateProcessor:
    def apply_template(self, template_id: str, study_data: StudyData) -> StudyData:
        template = self.load_template(template_id)
        
        # Apply template structure
        enhanced_data = study_data.copy()
        
        # Add predefined analyses (if not already present)
        for template_analysis in template.predefined_analyses:
            if not self.analysis_exists(enhanced_data, template_analysis.id):
                enhanced_data.analyses.append(
                    self.instantiate_template_analysis(template_analysis, study_data)
                )
        
        # Add predefined outputs
        for template_output in template.predefined_outputs:
            if not self.output_exists(enhanced_data, template_output.id):
                enhanced_data.outputs.append(
                    self.instantiate_template_output(template_output, study_data)
                )
        
        return enhanced_data
```

## API Endpoints

### Import Endpoints

```yaml
# Upload file for import
POST /api/import/upload
Content-Type: multipart/form-data
Body:
  file: [file]
  format: yaml|json|excel
  options: ImportOptions
Response:
  upload_id: string
  validation_status: string
  errors: ValidationError[]
  preview: ImportPreview

# Confirm import after review
POST /api/import/{upload_id}/confirm
Body:
  conflict_resolutions: ConflictResolution[]
  apply_immediately: boolean
Response:
  import_id: string
  status: string
  imported_items: ImportedItem[]

# Get import status
GET /api/import/{import_id}/status
Response:
  status: string
  progress: number
  errors: Error[]
  results: ImportResults
```

### Export Endpoints

```yaml
# Request export
POST /api/export/studies/{study_id}
Body:
  format: yaml|json|excel
  config: ExportConfig
Response:
  export_id: string
  estimated_completion: datetime

# Check export status
GET /api/export/{export_id}/status
Response:
  status: string
  progress: number
  download_url: string (when complete)

# Download export file
GET /api/export/{export_id}/download
Response:
  Content-Type: application/octet-stream
  Content-Disposition: attachment; filename="study_export.yaml"
  [file content]
```

## Error Handling

### Import Errors

```python
class ImportError(Exception):
    error_type: ImportErrorType
    line_number: Optional[int]
    field_name: Optional[str]
    message: str
    suggestion: Optional[str]

class ImportErrorType(Enum):
    INVALID_FORMAT = "invalid_format"
    SCHEMA_VALIDATION = "schema_validation"
    BUSINESS_RULE = "business_rule"
    PERMISSION_DENIED = "permission_denied"
    DEPENDENCY_MISSING = "dependency_missing"
    DUPLICATE_IDENTIFIER = "duplicate_identifier"
```

### Export Errors

```python
class ExportError(Exception):
    error_type: ExportErrorType
    resource_id: Optional[str]
    message: str

class ExportErrorType(Enum):
    INSUFFICIENT_PERMISSIONS = "insufficient_permissions"
    RESOURCE_NOT_FOUND = "resource_not_found"
    GENERATION_FAILED = "generation_failed"
    FORMAT_NOT_SUPPORTED = "format_not_supported"
```

## Performance Considerations

### Large File Handling

```python
# Streaming parser for large Excel files
class StreamingExcelParser:
    def parse_large_file(self, file_path: str) -> Iterator[ParsedRow]:
        for row in openpyxl.load_workbook(file_path, read_only=True).active.iter_rows():
            yield self.parse_row(row)

# Chunked processing for large imports
class ChunkedImportProcessor:
    CHUNK_SIZE = 1000
    
    def process_large_import(self, data: List[dict]) -> ImportResult:
        for chunk in self.chunk_data(data, self.CHUNK_SIZE):
            self.process_chunk(chunk)
```

### Caching Strategy

```python
# Cache parsed templates
@lru_cache(maxsize=50)
def get_template(template_id: str) -> Template:
    return load_template_from_storage(template_id)

# Cache validation schemas
@lru_cache(maxsize=20)
def get_validation_schema(format: str, version: str) -> dict:
    return load_schema_from_storage(format, version)
```

This comprehensive import/export specification ensures seamless data interchange while maintaining data integrity and ARS compliance throughout the process.