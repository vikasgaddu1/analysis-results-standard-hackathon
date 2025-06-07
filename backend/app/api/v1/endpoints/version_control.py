"""Version Control API Endpoints

API endpoints for version control functionality.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from datetime import datetime

from app.api import deps
from app.services.version_control import (
    VersionManager, DiffEngine, MergeEngine, BranchManager, 
    ConflictResolver, HistoryTracker
)
from app.models.version_control import Version, Branch, MergeRequest
from app.schemas.version_control import (
    VersionCreate, VersionResponse, BranchCreate, BranchResponse,
    MergeRequestCreate, MergeRequestResponse, ConflictResolutionRequest,
    DiffResponse, HistoryResponse
)

router = APIRouter()


# Version endpoints
@router.post("/versions/", response_model=VersionResponse)
def create_version(
    version_data: VersionCreate,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Create a new version"""
    version_manager = VersionManager(db)
    
    try:
        version = version_manager.create_version(
            reporting_event_id=version_data.reporting_event_id,
            version_name=version_data.version_name,
            description=version_data.description,
            user_id=current_user.get("id"),
            branch_name=version_data.branch_name or "main"
        )
        
        return VersionResponse.from_orm(version)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/versions/{version_id}", response_model=VersionResponse)
def get_version(
    version_id: str,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get a specific version"""
    version_manager = VersionManager(db)
    version = version_manager.get_version_by_id(version_id)
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return VersionResponse.from_orm(version)


@router.get("/versions/", response_model=List[VersionResponse])
def list_versions(
    reporting_event_id: str = Query(...),
    branch_name: str = Query(None),
    limit: int = Query(50, le=100),
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """List versions for a reporting event"""
    version_manager = VersionManager(db)
    
    versions = version_manager.get_version_history(
        reporting_event_id=reporting_event_id,
        branch_name=branch_name,
        limit=limit
    )
    
    return [VersionResponse.from_orm(version) for version in versions]


@router.post("/versions/{version_id}/restore", response_model=dict)
def restore_version(
    version_id: str,
    create_backup: bool = Body(True),
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Restore a specific version"""
    version_manager = VersionManager(db)
    
    try:
        reporting_event = version_manager.restore_version(
            version_id=version_id,
            user_id=current_user.get("id"),
            create_backup=create_backup
        )
        
        return {
            "message": "Version restored successfully",
            "reporting_event_id": reporting_event.id
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/versions/{version_id}")
def delete_version(
    version_id: str,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Delete a version"""
    version_manager = VersionManager(db)
    
    try:
        success = version_manager.delete_version(
            version_id=version_id,
            user_id=current_user.get("id")
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Version not found")
        
        return {"message": "Version deleted successfully"}
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Branch endpoints
@router.post("/branches/", response_model=BranchResponse)
def create_branch(
    branch_data: BranchCreate,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Create a new branch"""
    branch_manager = BranchManager(db)
    
    try:
        branch = branch_manager.create_branch(
            reporting_event_id=branch_data.reporting_event_id,
            branch_name=branch_data.name,
            user_id=current_user.get("id"),
            description=branch_data.description,
            source_branch_name=branch_data.source_branch_name or "main",
            source_version_id=branch_data.source_version_id
        )
        
        return BranchResponse.from_orm(branch)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/branches/", response_model=List[BranchResponse])
def list_branches(
    reporting_event_id: str = Query(...),
    include_inactive: bool = Query(False),
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """List branches for a reporting event"""
    branch_manager = BranchManager(db)
    
    branches = branch_manager.list_branches(
        reporting_event_id=reporting_event_id,
        include_inactive=include_inactive
    )
    
    return [BranchResponse.from_orm(branch) for branch in branches]


@router.get("/branches/{reporting_event_id}/{branch_name}", response_model=dict)
def get_branch_info(
    reporting_event_id: str,
    branch_name: str,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get detailed branch information"""
    branch_manager = BranchManager(db)
    
    branch_info = branch_manager.get_branch_info(reporting_event_id, branch_name)
    
    if not branch_info:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    return branch_info


@router.delete("/branches/{reporting_event_id}/{branch_name}")
def delete_branch(
    reporting_event_id: str,
    branch_name: str,
    force: bool = Query(False),
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Delete a branch"""
    branch_manager = BranchManager(db)
    
    try:
        success = branch_manager.delete_branch(
            reporting_event_id=reporting_event_id,
            branch_name=branch_name,
            user_id=current_user.get("id"),
            force=force
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Branch not found")
        
        return {"message": "Branch deleted successfully"}
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/branches/{reporting_event_id}/{branch_name}/protect")
def protect_branch(
    reporting_event_id: str,
    branch_name: str,
    protection_rules: dict = Body(None),
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Protect a branch"""
    branch_manager = BranchManager(db)
    
    success = branch_manager.protect_branch(
        reporting_event_id=reporting_event_id,
        branch_name=branch_name,
        protection_rules=protection_rules
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    return {"message": "Branch protected successfully"}


@router.post("/branches/{reporting_event_id}/{branch_name}/unprotect")
def unprotect_branch(
    reporting_event_id: str,
    branch_name: str,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Remove protection from a branch"""
    branch_manager = BranchManager(db)
    
    success = branch_manager.unprotect_branch(
        reporting_event_id=reporting_event_id,
        branch_name=branch_name
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    return {"message": "Branch protection removed successfully"}


# Comparison and diff endpoints
@router.get("/versions/{version_id_1}/compare/{version_id_2}", response_model=DiffResponse)
def compare_versions(
    version_id_1: str,
    version_id_2: str,
    include_metadata: bool = Query(True),
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Compare two versions"""
    version_manager = VersionManager(db)
    
    try:
        comparison = version_manager.compare_versions(version_id_1, version_id_2)
        return DiffResponse(**comparison)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/branches/{reporting_event_id}/{branch1_name}/compare/{branch2_name}")
def compare_branches(
    reporting_event_id: str,
    branch1_name: str,
    branch2_name: str,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Compare two branches"""
    branch_manager = BranchManager(db)
    
    try:
        comparison = branch_manager.compare_branches(
            reporting_event_id=reporting_event_id,
            branch1_name=branch1_name,
            branch2_name=branch2_name
        )
        return comparison
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Merge request endpoints
@router.post("/merge-requests/", response_model=MergeRequestResponse)
def create_merge_request(
    merge_data: MergeRequestCreate,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Create a new merge request"""
    merge_engine = MergeEngine()
    
    try:
        merge_request = merge_engine.create_merge_request(
            db=db,
            source_branch_id=merge_data.source_branch_id,
            target_branch_id=merge_data.target_branch_id,
            title=merge_data.title,
            description=merge_data.description,
            user_id=current_user.get("id")
        )
        
        return MergeRequestResponse.from_orm(merge_request)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/merge-requests/{merge_request_id}", response_model=MergeRequestResponse)
def get_merge_request(
    merge_request_id: str,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get a merge request"""
    merge_request = db.query(MergeRequest).filter(
        MergeRequest.id == merge_request_id
    ).first()
    
    if not merge_request:
        raise HTTPException(status_code=404, detail="Merge request not found")
    
    return MergeRequestResponse.from_orm(merge_request)


@router.post("/merge-requests/{merge_request_id}/auto-merge")
def auto_merge(
    merge_request_id: str,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Attempt auto-merge of a merge request"""
    merge_engine = MergeEngine()
    
    try:
        success, merged_version, messages = merge_engine.auto_merge(
            db=db,
            merge_request_id=merge_request_id,
            user_id=current_user.get("id")
        )
        
        return {
            "success": success,
            "merged_version_id": merged_version.id if merged_version else None,
            "messages": messages
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/merge-requests/{merge_request_id}/manual-merge")
def manual_merge(
    merge_request_id: str,
    conflict_resolutions: List[ConflictResolutionRequest],
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Perform manual merge with conflict resolutions"""
    merge_engine = MergeEngine()
    
    try:
        # Convert Pydantic models to dicts
        resolutions_data = [resolution.dict() for resolution in conflict_resolutions]
        
        merged_version = merge_engine.manual_merge(
            db=db,
            merge_request_id=merge_request_id,
            conflict_resolutions=resolutions_data,
            user_id=current_user.get("id")
        )
        
        return {
            "message": "Merge completed successfully",
            "merged_version_id": merged_version.id
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Conflict resolution endpoints
@router.get("/merge-requests/{merge_request_id}/conflicts")
def get_conflicts(
    merge_request_id: str,
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get conflicts for a merge request"""
    merge_request = db.query(MergeRequest).filter(
        MergeRequest.id == merge_request_id
    ).first()
    
    if not merge_request:
        raise HTTPException(status_code=404, detail="Merge request not found")
    
    conflicts_data = merge_request.conflicts_data or {"conflicts": {}}
    
    # Analyze conflicts if we have them
    if conflicts_data.get("conflicts"):
        conflict_resolver = ConflictResolver()
        conflict_list = list(conflicts_data["conflicts"].values())
        analysis = conflict_resolver.analyze_conflicts(conflict_list)
        conflicts_data["analysis"] = analysis
    
    return conflicts_data


@router.post("/conflicts/suggest-resolutions")
def suggest_conflict_resolutions(
    conflict: dict = Body(...),
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get resolution suggestions for a conflict"""
    conflict_resolver = ConflictResolver()
    suggestions = conflict_resolver.suggest_resolutions(conflict)
    
    return {"suggestions": suggestions}


# Cherry-pick and revert endpoints
@router.post("/versions/{source_version_id}/cherry-pick")
def cherry_pick(
    source_version_id: str,
    target_branch_id: str = Body(...),
    specific_changes: Optional[List[str]] = Body(None),
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Cherry-pick changes from a version to a branch"""
    merge_engine = MergeEngine()
    
    try:
        new_version = merge_engine.cherry_pick(
            db=db,
            source_version_id=source_version_id,
            target_branch_id=target_branch_id,
            specific_changes=specific_changes,
            user_id=current_user.get("id")
        )
        
        return {
            "message": "Cherry-pick completed successfully",
            "new_version_id": new_version.id
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/versions/{version_id}/revert")
def revert_version(
    version_id: str,
    target_branch_id: str = Body(...),
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Revert changes from a specific version"""
    merge_engine = MergeEngine()
    
    try:
        new_version = merge_engine.revert_version(
            db=db,
            version_to_revert_id=version_id,
            target_branch_id=target_branch_id,
            user_id=current_user.get("id")
        )
        
        return {
            "message": "Revert completed successfully",
            "new_version_id": new_version.id
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# History and tracking endpoints
@router.get("/versions/{version_id}/lineage")
def get_version_lineage(
    version_id: str,
    max_depth: int = Query(50, le=100),
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get version lineage"""
    history_tracker = HistoryTracker(db)
    
    try:
        lineage = history_tracker.get_version_lineage(
            version_id=version_id,
            max_depth=max_depth
        )
        return lineage
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/history/", response_model=List[HistoryResponse])
def get_change_history(
    reporting_event_id: str = Query(None),
    branch_id: str = Query(None),
    version_id: str = Query(None),
    user_id: str = Query(None),
    action_type: str = Query(None),
    since: Optional[datetime] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get filtered change history"""
    history_tracker = HistoryTracker(db)
    
    history = history_tracker.get_change_history(
        reporting_event_id=reporting_event_id,
        branch_id=branch_id,
        version_id=version_id,
        user_id=user_id,
        action_type=action_type,
        since=since,
        limit=limit
    )
    
    return [HistoryResponse(**item) for item in history]


@router.get("/users/{user_id}/activity")
def get_user_activity(
    user_id: str,
    since: Optional[datetime] = Query(None),
    limit: int = Query(50, le=100),
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get user activity summary"""
    history_tracker = HistoryTracker(db)
    
    activity = history_tracker.get_user_activity(
        user_id=user_id,
        since=since,
        limit=limit
    )
    
    return activity


@router.get("/branches/{branch_id}/history")
def get_branch_history(
    branch_id: str,
    limit: int = Query(50, le=100),
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get branch history"""
    history_tracker = HistoryTracker(db)
    
    # Get branch info first
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    history = history_tracker.get_branch_history(
        reporting_event_id=branch.reporting_event_id,
        branch_name=branch.name,
        limit=limit
    )
    
    return history


# Utility endpoints
@router.get("/templates/resolution")
def get_resolution_templates(
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Get conflict resolution templates"""
    conflict_resolver = ConflictResolver()
    templates = conflict_resolver.get_resolution_templates()
    
    return templates


@router.post("/versions/{version_id}/branch")
def create_branch_from_version(
    version_id: str,
    new_branch_name: str = Body(...),
    db: Session = Depends(deps.get_db),
    current_user: dict = Depends(deps.get_current_user)
):
    """Create a new branch from a specific version"""
    version_manager = VersionManager(db)
    
    try:
        new_branch = version_manager.create_branch_from_version(
            version_id=version_id,
            new_branch_name=new_branch_name,
            user_id=current_user.get("id")
        )
        
        return {
            "message": "Branch created successfully",
            "branch_id": new_branch.id,
            "branch_name": new_branch.name
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))