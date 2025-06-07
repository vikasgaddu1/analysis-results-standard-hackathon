# Clinical Trial Table Metadata System - API Documentation

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL and Versioning](#base-url-and-versioning)
- [Request/Response Format](#requestresponse-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
- [SDKs and Libraries](#sdks-and-libraries)
- [Examples](#examples)

## Overview

The Clinical Trial Table Metadata System provides a comprehensive RESTful API for programmatic access to all system functionality. The API follows REST principles and returns JSON responses.

### API Features
- Full CRUD operations for all resources
- Advanced search and filtering
- Bulk operations for efficiency
- Real-time validation
- Export/import capabilities
- Webhook support for integrations

### Base URL
```
Production: https://api.yourdomain.com
Staging: https://staging-api.yourdomain.com
Development: http://localhost:8000
```

## Authentication

The API uses Bearer token authentication with JSON Web Tokens (JWT).

### Obtaining a Token

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Using the Token

Include the token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh

**Endpoint:** `POST /api/v1/auth/refresh`

**Headers:** `Authorization: Bearer <your_token>`

**Response:**
```json
{
  "access_token": "new_token_here",
  "token_type": "bearer",
  "expires_in": 1800
}
```

## Base URL and Versioning

All API endpoints are versioned and follow this pattern:
```
{base_url}/api/v1/{endpoint}
```

Current API version: `v1`

## Request/Response Format

### Content Type
- Request: `application/json`
- Response: `application/json`

### Standard Response Structure
```json
{
  "data": {}, // Response data
  "meta": {   // Metadata (for lists)
    "total": 100,
    "page": 1,
    "per_page": 20,
    "has_next": true,
    "has_prev": false
  },
  "links": {  // HATEOAS links
    "self": "/api/v1/analyses?page=1",
    "next": "/api/v1/analyses?page=2",
    "prev": null
  }
}
```

### Pagination
List endpoints support pagination with these parameters:
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)
- `sort`: Sort field
- `order`: Sort order (`asc` or `desc`)

### Filtering
List endpoints support filtering:
- `search`: Full-text search
- `filter[field]`: Filter by field value
- `date_from`, `date_to`: Date range filtering

## Error Handling

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `204`: No Content (successful deletion)
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request data is invalid",
    "details": [
      {
        "field": "name",
        "message": "This field is required"
      }
    ]
  }
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- **Standard Users**: 1000 requests/hour
- **Premium Users**: 5000 requests/hour
- **API Keys**: 10000 requests/hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Endpoints

### Authentication

#### POST /api/v1/auth/login
Authenticate user and obtain access token.

#### POST /api/v1/auth/register
Register a new user account.

#### POST /api/v1/auth/refresh
Refresh an existing token.

#### GET /api/v1/auth/me
Get current user information.

#### POST /api/v1/auth/logout
Invalidate current token.

### Reporting Events

#### GET /api/v1/reporting-events
List all reporting events.

**Parameters:**
- `search`: Search in name and description
- `created_by`: Filter by creator
- `sort`: Sort by field (name, created_at, updated_at)

**Response:**
```json
{
  "data": [
    {
      "id": "RE001",
      "version": "1.0",
      "name": "Primary Efficacy Analysis",
      "description": "Primary efficacy endpoint analysis",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "created_by": {
        "id": "user123",
        "name": "John Doe"
      },
      "analyses_count": 5
    }
  ]
}
```

#### POST /api/v1/reporting-events
Create a new reporting event.

**Request:**
```json
{
  "id": "RE002",
  "version": "1.0",
  "name": "Safety Analysis",
  "description": "Comprehensive safety analysis"
}
```

#### GET /api/v1/reporting-events/{id}
Get a specific reporting event.

#### PATCH /api/v1/reporting-events/{id}
Update a reporting event.

#### DELETE /api/v1/reporting-events/{id}
Delete a reporting event.

### Analyses

#### GET /api/v1/analyses
List all analyses.

**Parameters:**
- `reporting_event_id`: Filter by reporting event
- `method_id`: Filter by method
- `search`: Search in name and description

#### POST /api/v1/analyses
Create a new analysis.

**Request:**
```json
{
  "id": "AN001",
  "version": "1.0",
  "name": "Demographics Summary",
  "description": "Summary of demographic characteristics",
  "reason": "SPECIFIED",
  "purpose": "PRIMARY_OUTCOME_MEASURE",
  "dataset": "ADSL",
  "variable": "AGE",
  "reporting_event_id": "RE001",
  "method_id": "METHOD001"
}
```

#### GET /api/v1/analyses/{id}
Get a specific analysis.

#### PATCH /api/v1/analyses/{id}
Update an analysis.

#### DELETE /api/v1/analyses/{id}
Delete an analysis.

#### POST /api/v1/analyses/{id}/duplicate
Create a copy of an analysis.

**Request:**
```json
{
  "id": "AN001_COPY",
  "name": "Demographics Summary - Copy"
}
```

### Methods

#### GET /api/v1/methods
List all statistical methods.

#### POST /api/v1/methods
Create a new method.

**Request:**
```json
{
  "id": "METHOD002",
  "name": "Descriptive Statistics - Median",
  "description": "Calculate median with IQR",
  "label": "Median (Q1, Q3)",
  "code_template": "proc means data=&input median q1 q3;"
}
```

#### GET /api/v1/methods/{id}
Get a specific method.

#### PATCH /api/v1/methods/{id}
Update a method.

#### DELETE /api/v1/methods/{id}
Delete a method.

### Outputs

#### GET /api/v1/outputs
List all outputs.

#### POST /api/v1/outputs
Create a new output.

**Request:**
```json
{
  "id": "OUT001",
  "version": "1.0",
  "name": "Demographics Table",
  "file_type": "rtf",
  "display": {
    "order": 1,
    "display_title": "Table 1: Demographics and Baseline Characteristics",
    "display_sections": []
  }
}
```

#### GET /api/v1/outputs/{id}
Get a specific output.

#### PATCH /api/v1/outputs/{id}
Update an output.

#### DELETE /api/v1/outputs/{id}
Delete an output.

### Where Clauses

#### GET /api/v1/where-clauses
List all where clauses.

#### POST /api/v1/where-clauses
Create a new where clause.

**Request:**
```json
{
  "id": "WC001",
  "label": "Safety Population",
  "level": 1,
  "order": 1,
  "condition": {
    "dataset": "ADSL",
    "variable": "SAFFL",
    "comparator": "EQ",
    "value": ["Y"]
  }
}
```

#### GET /api/v1/where-clauses/{id}
Get a specific where clause.

#### PATCH /api/v1/where-clauses/{id}
Update a where clause.

#### DELETE /api/v1/where-clauses/{id}
Delete a where clause.

#### POST /api/v1/where-clauses/{id}/test
Test a where clause against sample data.

**Request:**
```json
{
  "sample_data": [
    {"USUBJID": "001", "SAFFL": "Y"},
    {"USUBJID": "002", "SAFFL": "N"}
  ]
}
```

### Templates

#### GET /api/v1/templates
List all templates.

**Parameters:**
- `category`: Filter by category
- `type`: Filter by template type
- `rating_min`: Minimum rating filter

#### POST /api/v1/templates
Create a new template.

#### GET /api/v1/templates/{id}
Get a specific template.

#### PATCH /api/v1/templates/{id}
Update a template.

#### DELETE /api/v1/templates/{id}
Delete a template.

#### POST /api/v1/templates/{id}/rate
Rate a template.

**Request:**
```json
{
  "rating": 5,
  "comment": "Excellent template, very useful"
}
```

### Validation

#### POST /api/v1/validation/validate
Validate analysis specifications.

**Request:**
```json
{
  "type": "analysis",
  "data": {
    "id": "AN001",
    "name": "Test Analysis",
    // ... analysis data
  }
}
```

**Response:**
```json
{
  "is_valid": true,
  "errors": [],
  "warnings": [
    {
      "field": "description",
      "message": "Description is recommended for better documentation"
    }
  ],
  "info": [
    "Validation completed successfully"
  ]
}
```

### Import/Export

#### POST /api/v1/import-export/import
Import data from external files.

**Request:** Multipart form data
- `file`: File to import
- `format`: File format (yaml, json, excel)
- `options`: Import options

#### POST /api/v1/import-export/export
Export data to external formats.

**Request:**
```json
{
  "items": ["RE001", "AN001", "AN002"],
  "format": "yaml",
  "include_dependencies": true
}
```

### Version Control

#### GET /api/v1/version-control/branches
List all branches.

#### POST /api/v1/version-control/branches
Create a new branch.

#### GET /api/v1/version-control/commits
List commits.

#### POST /api/v1/version-control/commits
Create a new commit.

#### POST /api/v1/version-control/merge
Merge branches.

### Users

#### GET /api/v1/users
List users (admin only).

#### GET /api/v1/users/{id}
Get user details.

#### PATCH /api/v1/users/{id}
Update user information.

## SDKs and Libraries

### Python SDK

```python
from ars_client import ARSClient

# Initialize client
client = ARSClient(
    base_url="https://api.yourdomain.com",
    username="your_username",
    password="your_password"
)

# Create an analysis
analysis = client.analyses.create({
    "id": "AN001",
    "name": "Demographics Analysis",
    "reporting_event_id": "RE001"
})

# List analyses
analyses = client.analyses.list(reporting_event_id="RE001")

# Get specific analysis
analysis = client.analyses.get("AN001")
```

### R Package

```r
library(arsAPI)

# Connect to API
conn <- ars_connect(
  base_url = "https://api.yourdomain.com",
  username = "your_username",
  password = "your_password"
)

# Create analysis
analysis <- ars_create_analysis(conn, list(
  id = "AN001",
  name = "Demographics Analysis",
  reporting_event_id = "RE001"
))

# List analyses
analyses <- ars_list_analyses(conn, reporting_event_id = "RE001")
```

### JavaScript/Node.js

```javascript
const { ARSClient } = require('ars-api-client');

// Initialize client
const client = new ARSClient({
  baseURL: 'https://api.yourdomain.com',
  username: 'your_username',
  password: 'your_password'
});

// Create analysis
const analysis = await client.analyses.create({
  id: 'AN001',
  name: 'Demographics Analysis',
  reporting_event_id: 'RE001'
});

// List analyses
const analyses = await client.analyses.list({
  reporting_event_id: 'RE001'
});
```

## Examples

### Complete Workflow Example

```python
from ars_client import ARSClient

# Initialize client
client = ARSClient(
    base_url="https://api.yourdomain.com",
    username="statistician@company.com",
    password="secure_password"
)

# 1. Create a reporting event
reporting_event = client.reporting_events.create({
    "id": "CSR_MAIN",
    "version": "1.0",
    "name": "Clinical Study Report - Main Analysis",
    "description": "Primary and secondary efficacy analyses"
})

# 2. Create a where clause for ITT population
where_clause = client.where_clauses.create({
    "id": "ITT_POP",
    "label": "Intent-to-Treat Population",
    "level": 1,
    "order": 1,
    "condition": {
        "dataset": "ADSL",
        "variable": "ITTFL",
        "comparator": "EQ",
        "value": ["Y"]
    }
})

# 3. Create a statistical method
method = client.methods.create({
    "id": "MEAN_SD",
    "name": "Mean and Standard Deviation",
    "description": "Calculate mean with standard deviation",
    "label": "Mean (SD)",
    "code_template": """
    proc means data=&input mean std;
        var &variable;
        output out=stats mean=mean std=std;
    run;
    """
})

# 4. Create an analysis
analysis = client.analyses.create({
    "id": "DEMO_01",
    "version": "1.0",
    "name": "Demographics - Age",
    "description": "Summary of age by treatment group",
    "reason": "SPECIFIED",
    "purpose": "PRIMARY_OUTCOME_MEASURE",
    "dataset": "ADSL",
    "variable": "AGE",
    "reporting_event_id": "CSR_MAIN",
    "where_clause_id": "ITT_POP",
    "method_id": "MEAN_SD"
})

# 5. Create an output table
output = client.outputs.create({
    "id": "TBL_DEMO",
    "version": "1.0",
    "name": "Demographics Table",
    "file_type": "rtf",
    "display": {
        "order": 1,
        "display_title": "Table 1: Demographics and Baseline Characteristics",
        "display_sections": [
            {
                "section_type": "HEADER",
                "content": "Demographics"
            }
        ]
    }
})

# 6. Validate the complete specification
validation = client.validation.validate({
    "type": "reporting_event",
    "data": reporting_event
})

if validation["is_valid"]:
    print("Specification is valid!")
else:
    print("Validation errors:", validation["errors"])

# 7. Export for use in statistical programming
export_data = client.import_export.export({
    "items": ["CSR_MAIN"],
    "format": "yaml",
    "include_dependencies": True
})

print("Export completed successfully")
```

### Batch Operations Example

```python
# Create multiple analyses at once
analyses_data = [
    {
        "id": f"DEMO_{i:02d}",
        "name": f"Demographics - {var}",
        "variable": var,
        "reporting_event_id": "CSR_MAIN"
    }
    for i, var in enumerate(["AGE", "SEX", "RACE", "WEIGHT"], 1)
]

# Batch create
created_analyses = []
for analysis_data in analyses_data:
    analysis = client.analyses.create(analysis_data)
    created_analyses.append(analysis)

print(f"Created {len(created_analyses)} analyses")
```

### Error Handling Example

```python
from ars_client import ARSClient, ARSAPIError

client = ARSClient(...)

try:
    analysis = client.analyses.create({
        "id": "INVALID",
        "name": "",  # Invalid: empty name
        "reporting_event_id": "NONEXISTENT"  # Invalid: doesn't exist
    })
except ARSAPIError as e:
    if e.status_code == 422:
        print("Validation errors:")
        for error in e.details:
            print(f"- {error['field']}: {error['message']}")
    elif e.status_code == 404:
        print("Referenced resource not found")
    else:
        print(f"API error: {e.message}")
```

This API documentation provides comprehensive coverage of all available endpoints and usage patterns for the Clinical Trial Table Metadata System API.