"""
Validation API endpoints.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Path
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import uuid
from datetime import datetime, timedelta

from ....db.session import get_db
from ....services.validation import ValidationEngine, ValidationContext
from ....models.validation import (
    ValidationSession, ValidationResult, ValidationProfile, ValidationRule,
    ValidationSuppression, ValidationMetrics,
    ValidationSessionSchema, ValidationResultSchema, ValidationProfileSchema,
    ValidationRuleSchema, ValidationSummarySchema
)
from ....core.security import get_current_user
from ....crud.base import CRUDBase


router = APIRouter()

# Initialize validation engine
validation_engine = ValidationEngine()


# Request/Response models
class ValidationRequest(BaseModel):
    """Request model for validation."""
    data: Any = Field(..., description="Data to validate")
    object_type: str = Field(..., description="Type of object being validated")
    object_id: Optional[str] = Field(None, description="Unique identifier of the object")
    profile: str = Field("default", description="Validation profile to use")
    include_warnings: bool = Field(True, description="Include warning-level results")
    include_info: bool = Field(False, description="Include info-level results")
    custom_rules: List[str] = Field([], description="Additional custom rules to apply")
    excluded_rules: List[str] = Field([], description="Rules to exclude from validation")


class BatchValidationRequest(BaseModel):
    """Request model for batch validation."""
    items: List[Dict[str, Any]] = Field(..., description="List of validation items")
    profile: str = Field("default", description="Validation profile to use")


class ValidationResponse(BaseModel):
    """Response model for validation."""
    session_id: str
    status: str
    summary: ValidationSummarySchema
    results: List[ValidationResultSchema]
    execution_time_seconds: float
    metadata: Dict[str, Any] = {}


class SuppressionRequest(BaseModel):
    """Request model for suppressing validation results."""
    rule_id: str
    reason: str
    object_type: Optional[str] = None
    object_id: Optional[str] = None
    field_path: Optional[str] = None
    expires_at: Optional[datetime] = None


@router.post("/validate", response_model=ValidationResponse)
async def validate_data(
    request: ValidationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Validate data using specified validation profile.
    """
    try:
        # Create validation context
        context = ValidationContext(
            object_type=request.object_type,
            object_id=request.object_id,
            user_id=current_user.get("sub"),
            organization_id=current_user.get("organization_id"),
            validation_profile=request.profile,
            include_warnings=request.include_warnings,
            include_info=request.include_info,
            custom_rules=request.custom_rules,
            excluded_rules=request.excluded_rules
        )
        
        # Create validation session
        session_id = str(uuid.uuid4())
        db_session = ValidationSession(
            session_id=session_id,
            user_id=context.user_id,
            organization_id=context.organization_id,
            profile_name=request.profile,
            object_type=request.object_type,
            object_id=request.object_id,
            status="running",
            validators_used=[],
            metadata={"request_timestamp": datetime.utcnow().isoformat()}
        )
        db.add(db_session)
        db.commit()
        
        # Run validation
        validation_report = validation_engine.validate(request.data, context, request.profile)
        
        # Update session with results
        db_session.status = "completed"
        db_session.completed_at = datetime.utcnow()
        db_session.execution_time_seconds = validation_report["execution_time_seconds"]
        db_session.total_checks = validation_report["summary"]["total_checks"]
        db_session.passed_checks = validation_report["summary"]["passed_checks"]
        db_session.failed_checks = validation_report["summary"]["failed_checks"]
        db_session.warnings = validation_report["summary"]["warnings"]
        db_session.errors = validation_report["summary"]["errors"]
        db_session.critical_issues = validation_report["summary"]["critical_issues"]
        db_session.compliance_score = validation_report["summary"]["compliance_score"]
        db_session.overall_status = validation_report["summary"]["overall_status"]
        db_session.validators_used = validation_report["metadata"]["validators_used"]
        
        # Store individual results
        for result_data in validation_report["results"]:
            db_result = ValidationResult(
                result_id=result_data["id"],
                session_id=session_id,
                rule_id=result_data["rule_id"],
                rule_name=result_data["rule_name"],
                validator_name=result_data.get("validator_name", "unknown"),
                category=result_data["category"],
                severity=result_data["severity"],
                message=result_data["message"],
                description=result_data.get("description"),
                field_path=result_data.get("field_path"),
                actual_value=str(result_data.get("value")) if result_data.get("value") is not None else None,
                expected_value=str(result_data.get("expected_value")) if result_data.get("expected_value") is not None else None,
                suggestions=result_data.get("suggestions", []),
                is_passing=result_data["is_passing"],
                is_failing=result_data["is_failing"],
                metadata=result_data.get("metadata", {})
            )
            db.add(db_result)
        
        db.commit()
        
        # Schedule background tasks for metrics calculation
        background_tasks.add_task(update_validation_metrics, session_id, db)
        
        # Convert to response format
        summary = ValidationSummarySchema(**validation_report["summary"])
        results = [ValidationResultSchema(**result) for result in validation_report["results"]]
        
        return ValidationResponse(
            session_id=session_id,
            status=validation_report["summary"]["overall_status"],
            summary=summary,
            results=results,
            execution_time_seconds=validation_report["execution_time_seconds"],
            metadata=validation_report["metadata"]
        )
        
    except Exception as e:
        # Update session with error status
        if 'db_session' in locals():
            db_session.status = "failed"
            db_session.completed_at = datetime.utcnow()
            db_session.metadata = {"error": str(e)}
            db.commit()
        
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.post("/validate/batch", response_model=Dict[str, Any])
async def validate_batch(
    request: BatchValidationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Validate multiple data items in batch.
    """
    try:
        # Prepare validation items
        validation_items = []
        for item in request.items:
            context = ValidationContext(
                object_type=item.get("object_type", "unknown"),
                object_id=item.get("object_id"),
                user_id=current_user.get("sub"),
                organization_id=current_user.get("organization_id"),
                validation_profile=request.profile
            )
            validation_items.append({
                "data": item.get("data"),
                "context": context
            })
        
        # Run batch validation
        batch_report = validation_engine.validate_multiple(validation_items, request.profile)
        
        # Store batch session (simplified for batch)
        session_id = str(uuid.uuid4())
        db_session = ValidationSession(
            session_id=session_id,
            user_id=current_user.get("sub"),
            organization_id=current_user.get("organization_id"),
            profile_name=request.profile,
            object_type="batch",
            status="completed",
            completed_at=datetime.utcnow(),
            execution_time_seconds=batch_report["execution_time_seconds"],
            total_checks=batch_report["batch_summary"]["total_checks"],
            failed_checks=batch_report["batch_summary"]["total_failures"],
            metadata={"batch_size": len(request.items)}
        )
        db.add(db_session)
        db.commit()
        
        return {
            "session_id": session_id,
            "batch_summary": batch_report["batch_summary"],
            "results": batch_report["results"],
            "execution_time_seconds": batch_report["execution_time_seconds"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch validation failed: {str(e)}")


@router.get("/sessions/{session_id}", response_model=ValidationSessionSchema)
async def get_validation_session(
    session_id: str = Path(..., description="Validation session ID"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get validation session details and results.
    """
    db_session = db.query(ValidationSession).filter(
        ValidationSession.session_id == session_id,
        ValidationSession.user_id == current_user.get("sub")
    ).first()
    
    if not db_session:
        raise HTTPException(status_code=404, detail="Validation session not found")
    
    # Get associated results
    results = db.query(ValidationResult).filter(
        ValidationResult.session_id == session_id
    ).all()
    
    # Convert to schema
    summary = ValidationSummarySchema(
        total_checks=db_session.total_checks or 0,
        passed_checks=db_session.passed_checks or 0,
        failed_checks=db_session.failed_checks or 0,
        warnings=db_session.warnings or 0,
        errors=db_session.errors or 0,
        critical_issues=db_session.critical_issues or 0,
        compliance_score=db_session.compliance_score or 0.0,
        pass_rate=(db_session.passed_checks / max(db_session.total_checks, 1)) * 100,
        overall_status=db_session.overall_status or "unknown"
    )
    
    result_schemas = [
        ValidationResultSchema(
            id=result.result_id,
            rule_id=result.rule_id,
            rule_name=result.rule_name,
            category=result.category.value,
            severity=result.severity.value,
            message=result.message,
            description=result.description,
            field_path=result.field_path,
            value=result.actual_value,
            expected_value=result.expected_value,
            suggestions=result.suggestions or [],
            metadata=result.metadata or {},
            timestamp=result.created_at,
            is_passing=result.is_passing,
            is_failing=result.is_failing
        )
        for result in results
    ]
    
    return ValidationSessionSchema(
        id=db_session.session_id,
        user_id=db_session.user_id,
        profile_name=db_session.profile_name,
        object_type=db_session.object_type,
        object_id=db_session.object_id,
        status=db_session.status.value,
        started_at=db_session.started_at,
        completed_at=db_session.completed_at,
        execution_time_seconds=db_session.execution_time_seconds,
        summary=summary,
        results=result_schemas,
        metadata=db_session.metadata or {}
    )


@router.get("/sessions", response_model=List[ValidationSessionSchema])
async def list_validation_sessions(
    limit: int = Query(50, ge=1, le=100, description="Number of sessions to return"),
    offset: int = Query(0, ge=0, description="Number of sessions to skip"),
    object_type: Optional[str] = Query(None, description="Filter by object type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List validation sessions for the current user.
    """
    query = db.query(ValidationSession).filter(
        ValidationSession.user_id == current_user.get("sub")
    )
    
    if object_type:
        query = query.filter(ValidationSession.object_type == object_type)
    
    if status:
        query = query.filter(ValidationSession.status == status)
    
    sessions = query.order_by(ValidationSession.created_at.desc()).offset(offset).limit(limit).all()
    
    # Convert to schemas (simplified without full results)
    return [
        ValidationSessionSchema(
            id=session.session_id,
            user_id=session.user_id,
            profile_name=session.profile_name,
            object_type=session.object_type,
            object_id=session.object_id,
            status=session.status.value,
            started_at=session.started_at,
            completed_at=session.completed_at,
            execution_time_seconds=session.execution_time_seconds,
            summary=ValidationSummarySchema(
                total_checks=session.total_checks or 0,
                passed_checks=session.passed_checks or 0,
                failed_checks=session.failed_checks or 0,
                warnings=session.warnings or 0,
                errors=session.errors or 0,
                critical_issues=session.critical_issues or 0,
                compliance_score=session.compliance_score or 0.0,
                pass_rate=(session.passed_checks / max(session.total_checks, 1)) * 100,
                overall_status=session.overall_status or "unknown"
            ),
            results=[],  # Don't include full results in list view
            metadata=session.metadata or {}
        )
        for session in sessions
    ]


@router.get("/profiles", response_model=List[ValidationProfileSchema])
async def list_validation_profiles(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List available validation profiles.
    """
    # Get system profiles
    system_profiles = validation_engine.get_validation_profiles()
    
    # Get custom organization profiles
    org_profiles = db.query(ValidationProfile).filter(
        ValidationProfile.organization_id == current_user.get("organization_id")
    ).all()
    
    # Combine and convert to schemas
    profiles = []
    
    # Add system profiles
    for name, profile_data in system_profiles.items():
        profiles.append(ValidationProfileSchema(
            name=name,
            display_name=profile_data.get("name"),
            description=profile_data.get("description"),
            enabled_validators=profile_data.get("enabled_validators", []),
            severity_threshold=profile_data.get("severity_threshold", "info"),
            excluded_rules=[],
            is_system_profile=True
        ))
    
    # Add custom profiles
    for profile in org_profiles:
        profiles.append(ValidationProfileSchema(
            name=profile.name,
            display_name=profile.display_name,
            description=profile.description,
            enabled_validators=profile.enabled_validators or [],
            severity_threshold=profile.severity_threshold,
            fail_fast=profile.fail_fast,
            parallel_execution=profile.parallel_execution,
            excluded_rules=profile.excluded_rules or [],
            is_system_profile=profile.is_system_profile
        ))
    
    return profiles


@router.get("/rules", response_model=List[ValidationRuleSchema])
async def list_validation_rules(
    validator: Optional[str] = Query(None, description="Filter by validator name"),
    category: Optional[str] = Query(None, description="Filter by rule category"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List available validation rules.
    """
    # Get rules from validation engine
    rules = []
    
    for validator_name, validator_instance in validation_engine._validators.items():
        if validator and validator != validator_name:
            continue
            
        for rule_id in validator_instance.get_supported_rules():
            # This is simplified - in practice, you'd want to store rule metadata
            rule_name = getattr(validator_instance, f"{validator_name}_rules", {}).get(rule_id, rule_id)
            
            rules.append(ValidationRuleSchema(
                rule_id=rule_id,
                validator_name=validator_name,
                name=rule_name,
                description=f"Rule {rule_id} from {validator_name} validator",
                category="data_integrity",  # Would be determined from actual rule metadata
                severity="error",  # Would be determined from actual rule metadata
                is_enabled=True,
                object_types=["all"]  # Would be determined from actual rule metadata
            ))
    
    if category:
        rules = [rule for rule in rules if rule.category == category]
    
    return rules


@router.post("/suppressions")
async def create_suppression(
    request: SuppressionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a validation result suppression.
    """
    suppression = ValidationSuppression(
        rule_id=request.rule_id,
        object_type=request.object_type,
        object_id=request.object_id,
        field_path=request.field_path,
        reason=request.reason,
        suppressed_by=current_user.get("sub"),
        expires_at=request.expires_at,
        organization_id=current_user.get("organization_id")
    )
    
    db.add(suppression)
    db.commit()
    
    return {"message": "Suppression created successfully", "id": suppression.id}


@router.get("/metrics/summary")
async def get_validation_metrics(
    days: int = Query(30, ge=1, le=365, description="Number of days to include"),
    object_type: Optional[str] = Query(None, description="Filter by object type"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get validation metrics summary.
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Query sessions in the time period
    query = db.query(ValidationSession).filter(
        ValidationSession.organization_id == current_user.get("organization_id"),
        ValidationSession.created_at >= start_date,
        ValidationSession.status == "completed"
    )
    
    if object_type:
        query = query.filter(ValidationSession.object_type == object_type)
    
    sessions = query.all()
    
    # Calculate metrics
    total_validations = len(sessions)
    total_checks = sum(session.total_checks or 0 for session in sessions)
    total_failures = sum(session.failed_checks or 0 for session in sessions)
    avg_compliance = sum(session.compliance_score or 0 for session in sessions) / max(total_validations, 1)
    avg_execution_time = sum(session.execution_time_seconds or 0 for session in sessions) / max(total_validations, 1)
    
    # Top failing object types
    object_type_failures = {}
    for session in sessions:
        obj_type = session.object_type
        if obj_type not in object_type_failures:
            object_type_failures[obj_type] = 0
        object_type_failures[obj_type] += session.failed_checks or 0
    
    return {
        "period_days": days,
        "total_validations": total_validations,
        "total_checks": total_checks,
        "total_failures": total_failures,
        "pass_rate": ((total_checks - total_failures) / max(total_checks, 1)) * 100,
        "average_compliance_score": avg_compliance,
        "average_execution_time_seconds": avg_execution_time,
        "top_failing_object_types": sorted(
            object_type_failures.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
    }


async def update_validation_metrics(session_id: str, db: Session):
    """Background task to update validation metrics."""
    try:
        # This would implement metrics aggregation logic
        # For now, just log that it would be done
        pass
    except Exception as e:
        # Log error but don't fail the main validation
        pass