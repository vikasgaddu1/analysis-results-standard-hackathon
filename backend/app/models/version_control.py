"""Version Control Models

Database models for version control functionality.
"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, JSON, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

from app.db.base import Base


class Version(Base):
    """Model for version snapshots"""
    __tablename__ = "versions"
    
    id = Column(String, primary_key=True)
    reporting_event_id = Column(String, ForeignKey("reporting_events.id"), nullable=False)
    branch_id = Column(String, ForeignKey("branches.id"), nullable=False)
    version_name = Column(String, nullable=False)
    description = Column(Text)
    version_data = Column(JSON, nullable=False)  # Serialized snapshot of the data
    
    # Metadata
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String)
    
    # Status
    is_current = Column(Boolean, default=False)
    is_tagged = Column(Boolean, default=False)
    tag_name = Column(String)
    
    # Soft delete
    deleted_at = Column(DateTime)
    deleted_by = Column(String)
    
    # Relationships
    branch = relationship("Branch", back_populates="versions")
    change_logs = relationship("ChangeLog", back_populates="version")
    commits = relationship("Commit", back_populates="version")
    
    # Source merge requests
    source_merge_requests = relationship(
        "MergeRequest", 
        foreign_keys="MergeRequest.source_version_id",
        back_populates="source_version"
    )
    target_merge_requests = relationship(
        "MergeRequest", 
        foreign_keys="MergeRequest.target_version_id",
        back_populates="target_version"
    )
    merged_requests = relationship(
        "MergeRequest", 
        foreign_keys="MergeRequest.merged_version_id",
        back_populates="merged_version"
    )


class Branch(Base):
    """Model for version control branches"""
    __tablename__ = "branches"
    
    id = Column(String, primary_key=True)
    reporting_event_id = Column(String, ForeignKey("reporting_events.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    
    # Branch hierarchy
    source_branch_id = Column(String, ForeignKey("branches.id"))
    source_version_id = Column(String, ForeignKey("versions.id"))
    
    # Metadata
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_protected = Column(Boolean, default=False)
    protection_rules = Column(JSON)  # Rules for branch protection
    
    # Soft delete
    deleted_at = Column(DateTime)
    deleted_by = Column(String)
    
    # Relationships
    versions = relationship("Version", back_populates="branch")
    change_logs = relationship("ChangeLog", back_populates="branch")
    
    # Source branch relationship
    source_branch = relationship("Branch", remote_side=[id], back_populates="child_branches")
    child_branches = relationship("Branch", back_populates="source_branch")
    
    # Merge requests
    source_merge_requests = relationship(
        "MergeRequest", 
        foreign_keys="MergeRequest.source_branch_id",
        back_populates="source_branch"
    )
    target_merge_requests = relationship(
        "MergeRequest", 
        foreign_keys="MergeRequest.target_branch_id",
        back_populates="target_branch"
    )


class Commit(Base):
    """Model for commit records"""
    __tablename__ = "commits"
    
    id = Column(String, primary_key=True)
    version_id = Column(String, ForeignKey("versions.id"), nullable=False)
    message = Column(Text, nullable=False)
    author = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Commit details
    changes = Column(JSON)  # Summary of changes made
    parent_commit_id = Column(String, ForeignKey("commits.id"))
    
    # Relationships
    version = relationship("Version", back_populates="commits")
    parent_commit = relationship("Commit", remote_side=[id], back_populates="child_commits")
    child_commits = relationship("Commit", back_populates="parent_commit")


class ChangeLog(Base):
    """Model for tracking changes and operations"""
    __tablename__ = "change_logs"
    
    id = Column(String, primary_key=True)
    version_id = Column(String, ForeignKey("versions.id"))
    branch_id = Column(String, ForeignKey("branches.id"))
    
    # Action details
    action = Column(String, nullable=False)  # e.g., "version_created", "merge_completed"
    description = Column(Text)
    changes_summary = Column(JSON)  # Summary of what changed
    
    # Metadata
    performed_by = Column(String)
    performed_at = Column(DateTime, default=datetime.utcnow)
    
    # Additional context
    context = Column(JSON)  # Additional context for the action
    
    # Relationships
    version = relationship("Version", back_populates="change_logs")
    branch = relationship("Branch", back_populates="change_logs")


class MergeRequest(Base):
    """Model for merge requests"""
    __tablename__ = "merge_requests"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    
    # Branch and version references
    source_branch_id = Column(String, ForeignKey("branches.id"), nullable=False)
    target_branch_id = Column(String, ForeignKey("branches.id"), nullable=False)
    source_version_id = Column(String, ForeignKey("versions.id"), nullable=False)
    target_version_id = Column(String, ForeignKey("versions.id"), nullable=False)
    base_version_id = Column(String, ForeignKey("versions.id"))  # Common ancestor
    
    # Merge status
    status = Column(String, default="open")  # open, merged, closed, draft
    has_conflicts = Column(Boolean, default=False)
    conflicts_data = Column(JSON)  # Detected conflicts
    
    # Review and approval
    requires_review = Column(Boolean, default=True)
    approved_by = Column(JSON)  # List of approvers
    reviewers = Column(JSON)  # List of assigned reviewers
    
    # Metadata
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String)
    
    # Merge details
    merged_at = Column(DateTime)
    merged_by = Column(String)
    merged_version_id = Column(String, ForeignKey("versions.id"))
    
    # Close details
    closed_at = Column(DateTime)
    closed_by = Column(String)
    close_reason = Column(String)
    
    # Relationships
    source_branch = relationship(
        "Branch", 
        foreign_keys=[source_branch_id],
        back_populates="source_merge_requests"
    )
    target_branch = relationship(
        "Branch", 
        foreign_keys=[target_branch_id],
        back_populates="target_merge_requests"
    )
    source_version = relationship(
        "Version", 
        foreign_keys=[source_version_id],
        back_populates="source_merge_requests"
    )
    target_version = relationship(
        "Version", 
        foreign_keys=[target_version_id],
        back_populates="target_merge_requests"
    )
    merged_version = relationship(
        "Version", 
        foreign_keys=[merged_version_id],
        back_populates="merged_requests"
    )
    conflict_resolutions = relationship("ConflictResolution", back_populates="merge_request")


class ConflictResolution(Base):
    """Model for conflict resolution records"""
    __tablename__ = "conflict_resolutions"
    
    id = Column(String, primary_key=True)
    merge_request_id = Column(String, ForeignKey("merge_requests.id"), nullable=False)
    
    # Conflict details
    conflict_path = Column(String, nullable=False)  # Path to the conflicting field
    conflict_type = Column(String)  # Type of conflict
    
    # Resolution details
    resolution_type = Column(String, nullable=False)  # How it was resolved
    resolved_value = Column(JSON)  # The resolved value
    resolution_reason = Column(Text)  # Explanation of the resolution
    
    # Metadata
    resolved_by = Column(String)
    resolved_at = Column(DateTime, default=datetime.utcnow)
    
    # Review
    reviewed_by = Column(String)
    reviewed_at = Column(DateTime)
    review_status = Column(String)  # approved, rejected, pending
    
    # Relationships
    merge_request = relationship("MergeRequest", back_populates="conflict_resolutions")


class Tag(Base):
    """Model for version tags"""
    __tablename__ = "tags"
    
    id = Column(String, primary_key=True)
    version_id = Column(String, ForeignKey("versions.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    tag_type = Column(String)  # release, milestone, snapshot, etc.
    
    # Metadata
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Tag data
    metadata = Column(JSON)  # Additional tag metadata
    
    # Relationships
    version = relationship("Version")


class VersionLock(Base):
    """Model for version locking to prevent concurrent modifications"""
    __tablename__ = "version_locks"
    
    id = Column(String, primary_key=True)
    version_id = Column(String, ForeignKey("versions.id"), nullable=False)
    locked_by = Column(String, nullable=False)
    locked_at = Column(DateTime, default=datetime.utcnow)
    lock_reason = Column(String)
    expires_at = Column(DateTime)
    
    # Lock status
    is_active = Column(Boolean, default=True)
    
    # Relationships
    version = relationship("Version")


class VersionComment(Base):
    """Model for version comments and annotations"""
    __tablename__ = "version_comments"
    
    id = Column(String, primary_key=True)
    version_id = Column(String, ForeignKey("versions.id"), nullable=False)
    comment = Column(Text, nullable=False)
    comment_type = Column(String)  # note, issue, question, approval
    
    # Context
    field_path = Column(String)  # Specific field the comment refers to
    line_number = Column(Integer)  # For code comments
    
    # Metadata
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String)
    
    # Status
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(String)
    resolved_at = Column(DateTime)
    
    # Threading
    parent_comment_id = Column(String, ForeignKey("version_comments.id"))
    
    # Relationships
    version = relationship("Version")
    parent_comment = relationship("VersionComment", remote_side=[id], back_populates="replies")
    replies = relationship("VersionComment", back_populates="parent_comment")


class AccessControl(Base):
    """Model for version control access control"""
    __tablename__ = "access_controls"
    
    id = Column(String, primary_key=True)
    resource_type = Column(String, nullable=False)  # branch, version, merge_request
    resource_id = Column(String, nullable=False)
    user_id = Column(String, nullable=False)
    permission = Column(String, nullable=False)  # read, write, admin, review
    
    # Metadata
    granted_by = Column(String)
    granted_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    
    # Status
    is_active = Column(Boolean, default=True)