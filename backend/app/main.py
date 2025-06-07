from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings

# Create FastAPI app instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.APP_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Set up CORS middleware
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """
    Root endpoint returning API information.
    """
    return {
        "message": "Welcome to Clinical Trial Table Metadata System API",
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_V1_STR}/docs",
        "health": "/health"
    }


# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Global exception handler to catch unhandled exceptions.
    """
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )


# Include API routers
from app.api.v1.api import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)


# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Perform startup tasks.
    """
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    # TODO: Add any startup tasks like:
    # - Database connection verification
    # - Cache initialization
    # - Background task scheduling


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Perform cleanup tasks on shutdown.
    """
    print(f"Shutting down {settings.APP_NAME}")
    # TODO: Add any cleanup tasks like:
    # - Close database connections
    # - Clear caches
    # - Cancel background tasks


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )