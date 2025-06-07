"""
Main API v1 router for Clinical Trial Table Metadata System
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, reporting_events, analyses, outputs, where_clauses, methods, templates, validation, version_control

api_router = APIRouter()

# Authentication endpoints
api_router.include_router(
    auth.router, 
    prefix="/auth", 
    tags=["authentication"]
)

# User management endpoints
api_router.include_router(
    users.router, 
    prefix="/users", 
    tags=["users"]
)

# ReportingEvent endpoints
api_router.include_router(
    reporting_events.router, 
    prefix="/reporting-events", 
    tags=["reporting-events"]
)

# Analysis endpoints
api_router.include_router(
    analyses.router, 
    prefix="/analyses", 
    tags=["analyses"]
)

# Method endpoints
api_router.include_router(
    methods.router, 
    prefix="/methods", 
    tags=["methods"]
)

# Output endpoints
api_router.include_router(
    outputs.router, 
    prefix="/outputs", 
    tags=["outputs"]
)

# Where clause endpoints
api_router.include_router(
    where_clauses.router, 
    prefix="/where-clauses", 
    tags=["where-clauses"]
)

# Template endpoints
api_router.include_router(
    templates.router, 
    prefix="/templates", 
    tags=["templates"]
)

# Validation endpoints
api_router.include_router(
    validation.router, 
    prefix="/validation", 
    tags=["validation"]
)

# Version control endpoints
api_router.include_router(
    version_control.router, 
    prefix="/version-control", 
    tags=["version-control"]
)

# Health check endpoint for the API
@api_router.get("/health", tags=["health"])
async def api_health_check():
    """
    API v1 health check endpoint.
    """
    return {
        "status": "healthy",
        "version": "1.0",
        "api": "Clinical Trial Table Metadata System API v1"
    }