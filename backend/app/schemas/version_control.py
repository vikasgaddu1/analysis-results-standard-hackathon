"""Version Control Schemas

Pydantic schemas for version control API.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


# Version schemas
class VersionCreate(BaseModel):
    reporting_event_id: str
    version_name: str
    description: Optional[str] = ""
    branch_name: Optional[str] = "main"


class VersionResponse(BaseModel):
    id: str
    reporting_event_id: str
    branch_id: str
    version_name: str
    description: Optional[str]
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    is_current: bool
    is_tagged: bool
    tag_name: Optional[str]
    
    class Config:
        from_attributes = True


# Branch schemas
class BranchCreate(BaseModel):
    reporting_event_id: str
    name: str
    description: Optional[str] = ""
    source_branch_name: Optional[str] = "main"
    source_version_id: Optional[str] = None


class BranchResponse(BaseModel):
    id: str
    reporting_event_id: str
    name: str
    description: Optional[str]
    source_branch_id: Optional[str]
    source_version_id: Optional[str]
    created_by: Optional[str]
    created_at: datetime
    is_active: bool
    is_protected: bool
    protection_rules: Optional[Dict[str, Any]]
    
    class Config:
        from_attributes = True


# Merge request schemas
class MergeRequestCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    source_branch_id: str
    target_branch_id: str


class MergeRequestResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    source_branch_id: str
    target_branch_id: str
    source_version_id: str
    target_version_id: str
    base_version_id: Optional[str]
    status: str
    has_conflicts: bool
    conflicts_data: Optional[Dict[str, Any]]
    requires_review: bool
    approved_by: Optional[List[str]]
    reviewers: Optional[List[str]]
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    merged_at: Optional[datetime]
    merged_by: Optional[str]
    merged_version_id: Optional[str]
    
    class Config:
        from_attributes = True


# Conflict resolution schemas
class ConflictResolutionRequest(BaseModel):
    path: str
    resolution_type: str
    resolved_value: Any
    reason: Optional[str] = ""


class ConflictAnalysis(BaseModel):
    total_conflicts: int
    conflict_types: Dict[str, int]
    critical_conflicts: List[Dict[str, Any]]
    auto_resolvable: List[Dict[str, Any]]
    requires_manual: List[Dict[str, Any]]
    recommendations: List[Dict[str, Any]]


# Diff and comparison schemas
class DiffSummary(BaseModel):
    total_changes: int
    values_changed: int
    items_added: int
    items_removed: int
    type_changes: int
    affected_sections: List[str]


class VersionInfo(BaseModel):
    id: str
    name: str
    created_at: str
    created_by: Optional[str]


class DiffResponse(BaseModel):
    version1: VersionInfo
    version2: VersionInfo
    summary: DiffSummary
    detailed_changes: Dict[str, Any]
    statistics: Dict[str, Any]


# History and tracking schemas
class HistoryResponse(BaseModel):
    id: str
    action: str
    description: Optional[str]
    changes_summary: Dict[str, Any]
    performed_by: Optional[str]
    performed_at: str
    version_id: Optional[str]
    branch_id: Optional[str]


class ActivitySummary(BaseModel):
    user_id: str
    period_start: str
    period_end: str
    total_actions: int
    action_counts: Dict[str, int]
    recent_activities: List[Dict[str, Any]]
    most_active_days: Dict[str, int]


# Lineage schemas
class LineageVersion(BaseModel):
    id: str
    name: str
    created_at: str
    created_by: Optional[str]
    depth: Optional[int] = 0


class BranchInfo(BaseModel):
    id: str
    name: str
    created_at: str
    created_by: Optional[str]
    is_current_branch: Optional[bool] = False
    is_source_branch: Optional[bool] = False


class RelatedOperation(BaseModel):
    id: str
    type: str
    description: str
    performed_at: str
    performed_by: Optional[str]
    details: Dict[str, Any]


class VersionLineage(BaseModel):
    version: LineageVersion
    ancestors: List[LineageVersion]
    descendants: List[LineageVersion]
    branch_history: List[BranchInfo]
    related_operations: List[RelatedOperation]


# Commit schemas
class CommitCreate(BaseModel):
    version_id: str
    message: str
    changes: Optional[Dict[str, Any]] = None


class CommitResponse(BaseModel):
    id: str
    version_id: str
    message: str
    author: str
    timestamp: datetime
    changes: Dict[str, Any]
    parent_commit_id: Optional[str]
    
    class Config:
        from_attributes = True


# Tag schemas
class TagCreate(BaseModel):
    version_id: str
    name: str
    description: Optional[str] = ""
    tag_type: Optional[str] = "manual"
    metadata: Optional[Dict[str, Any]] = None


class TagResponse(BaseModel):
    id: str
    version_id: str
    name: str
    description: Optional[str]
    tag_type: str
    created_by: Optional[str]
    created_at: datetime
    metadata: Optional[Dict[str, Any]]
    
    class Config:
        from_attributes = True


# Comment schemas
class CommentCreate(BaseModel):
    version_id: str
    comment: str
    comment_type: Optional[str] = "note"
    field_path: Optional[str] = None
    line_number: Optional[int] = None
    parent_comment_id: Optional[str] = None


class CommentResponse(BaseModel):
    id: str
    version_id: str
    comment: str
    comment_type: str
    field_path: Optional[str]
    line_number: Optional[int]
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    is_resolved: bool
    resolved_by: Optional[str]
    resolved_at: Optional[datetime]
    parent_comment_id: Optional[str]
    replies: Optional[List["CommentResponse"]] = []
    
    class Config:
        from_attributes = True


# Lock schemas
class LockCreate(BaseModel):
    version_id: str
    lock_reason: Optional[str] = ""
    expires_at: Optional[datetime] = None


class LockResponse(BaseModel):
    id: str
    version_id: str
    locked_by: str
    locked_at: datetime
    lock_reason: Optional[str]
    expires_at: Optional[datetime]
    is_active: bool
    
    class Config:
        from_attributes = True


# Resolution suggestion schemas
class ResolutionSuggestion(BaseModel):
    strategy: str
    applicable: bool
    description: str
    preview_value: Any
    confidence: float


class ConflictSuggestions(BaseModel):
    conflict: Dict[str, Any]
    suggestions: List[ResolutionSuggestion]


# Patch schemas
class PatchOperation(BaseModel):
    operation: str  # replace, add, remove
    path: str
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    value: Optional[Any] = None


class PatchResponse(BaseModel):
    source_version_id: str
    target_version_id: str
    operations: List[PatchOperation]
    metadata: Dict[str, Any]


# Access control schemas
class AccessControlCreate(BaseModel):
    resource_type: str
    resource_id: str
    user_id: str
    permission: str
    expires_at: Optional[datetime] = None


class AccessControlResponse(BaseModel):
    id: str
    resource_type: str
    resource_id: str
    user_id: str
    permission: str
    granted_by: Optional[str]
    granted_at: datetime
    expires_at: Optional[datetime]
    is_active: bool
    
    class Config:
        from_attributes = True


# Bulk operation schemas
class BulkVersionCreate(BaseModel):
    versions: List[VersionCreate]


class BulkVersionResponse(BaseModel):
    created: List[VersionResponse]
    failed: List[Dict[str, Any]]


class BulkConflictResolution(BaseModel):
    merge_request_id: str
    resolutions: List[ConflictResolutionRequest]


class BulkResolutionResponse(BaseModel):
    resolved: List[Dict[str, Any]]
    failed: List[Dict[str, Any]]


# Search and filter schemas
class VersionFilter(BaseModel):
    reporting_event_id: Optional[str] = None
    branch_name: Optional[str] = None
    created_by: Optional[str] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    is_current: Optional[bool] = None
    is_tagged: Optional[bool] = None
    tag_name: Optional[str] = None


class BranchFilter(BaseModel):
    reporting_event_id: Optional[str] = None
    created_by: Optional[str] = None
    is_active: Optional[bool] = None
    is_protected: Optional[bool] = None
    name_pattern: Optional[str] = None


class MergeRequestFilter(BaseModel):
    status: Optional[str] = None
    has_conflicts: Optional[bool] = None
    created_by: Optional[str] = None
    source_branch_id: Optional[str] = None
    target_branch_id: Optional[str] = None
    requires_review: Optional[bool] = None


# Update CommentResponse to handle forward references
CommentResponse.model_rebuild()