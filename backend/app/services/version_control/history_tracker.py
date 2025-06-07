"""History Tracker for Version Control

Tracks change history and lineage for version control operations.
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from uuid import uuid4
import json

from sqlalchemy.orm import Session
from app.models.version_control import Version, Branch, ChangeLog, Commit


class HistoryTracker:
    """Tracks and manages change history and lineage"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def track_version_creation(
        self,
        version: Version,
        changes: Optional[Dict[str, Any]] = None
    ) -> ChangeLog:
        """Track the creation of a new version"""
        
        change_log = ChangeLog(
            id=str(uuid4()),
            version_id=version.id,
            action="version_created",
            description=f"Created version '{version.version_name}'",
            changes_summary=changes or {},
            performed_by=version.created_by,
            performed_at=version.created_at
        )
        
        self.db.add(change_log)
        self.db.commit()
        
        return change_log
    
    def track_version_restoration(
        self,
        restored_version: Version,
        user_id: str = None
    ) -> ChangeLog:
        """Track version restoration"""
        
        change_log = ChangeLog(
            id=str(uuid4()),
            version_id=restored_version.id,
            action="version_restored",
            description=f"Restored version '{restored_version.version_name}'",
            changes_summary={
                "action": "restore",
                "restored_version_id": restored_version.id,
                "restored_version_name": restored_version.version_name
            },
            performed_by=user_id,
            performed_at=datetime.utcnow()
        )
        
        self.db.add(change_log)
        self.db.commit()
        
        return change_log
    
    def track_version_deletion(
        self,
        version: Version,
        user_id: str = None
    ) -> ChangeLog:
        """Track version deletion"""
        
        change_log = ChangeLog(
            id=str(uuid4()),
            version_id=version.id,
            action="version_deleted",
            description=f"Deleted version '{version.version_name}'",
            changes_summary={
                "action": "delete",
                "deleted_version_id": version.id,
                "deleted_version_name": version.version_name
            },
            performed_by=user_id,
            performed_at=datetime.utcnow()
        )
        
        self.db.add(change_log)
        self.db.commit()
        
        return change_log
    
    def track_branch_creation(
        self,
        branch: Branch,
        source_version: Optional[Version] = None
    ) -> ChangeLog:
        """Track branch creation"""
        
        changes_summary = {
            "action": "branch_create",
            "branch_name": branch.name,
            "source_branch_id": branch.source_branch_id
        }
        
        if source_version:
            changes_summary["source_version_id"] = source_version.id
            changes_summary["source_version_name"] = source_version.version_name
        
        change_log = ChangeLog(
            id=str(uuid4()),
            branch_id=branch.id,
            action="branch_created",
            description=f"Created branch '{branch.name}'",
            changes_summary=changes_summary,
            performed_by=branch.created_by,
            performed_at=branch.created_at
        )
        
        self.db.add(change_log)
        self.db.commit()
        
        return change_log
    
    def track_merge_operation(
        self,
        merge_request_id: str,
        source_branch: Branch,
        target_branch: Branch,
        merged_version: Version,
        conflicts_resolved: List[Dict[str, Any]] = None
    ) -> ChangeLog:
        """Track merge operations"""
        
        changes_summary = {
            "action": "merge",
            "merge_request_id": merge_request_id,
            "source_branch": source_branch.name,
            "target_branch": target_branch.name,
            "merged_version_id": merged_version.id,
            "conflicts_count": len(conflicts_resolved) if conflicts_resolved else 0
        }
        
        if conflicts_resolved:
            changes_summary["resolved_conflicts"] = conflicts_resolved
        
        change_log = ChangeLog(
            id=str(uuid4()),
            version_id=merged_version.id,
            branch_id=target_branch.id,
            action="merge_completed",
            description=f"Merged '{source_branch.name}' into '{target_branch.name}'",
            changes_summary=changes_summary,
            performed_by=merged_version.created_by,
            performed_at=merged_version.created_at
        )
        
        self.db.add(change_log)
        self.db.commit()
        
        return change_log
    
    def track_cherry_pick(
        self,
        source_version: Version,
        target_version: Version,
        cherry_picked_changes: List[str],
        user_id: str = None
    ) -> ChangeLog:
        """Track cherry-pick operations"""
        
        changes_summary = {
            "action": "cherry_pick",
            "source_version_id": source_version.id,
            "source_version_name": source_version.version_name,
            "cherry_picked_changes": cherry_picked_changes,
            "changes_count": len(cherry_picked_changes)
        }
        
        change_log = ChangeLog(
            id=str(uuid4()),
            version_id=target_version.id,
            action="cherry_pick_completed",
            description=f"Cherry-picked changes from '{source_version.version_name}'",
            changes_summary=changes_summary,
            performed_by=user_id,
            performed_at=datetime.utcnow()
        )
        
        self.db.add(change_log)
        self.db.commit()
        
        return change_log
    
    def track_revert_operation(
        self,
        reverted_version: Version,
        new_version: Version,
        user_id: str = None
    ) -> ChangeLog:
        """Track revert operations"""
        
        changes_summary = {
            "action": "revert",
            "reverted_version_id": reverted_version.id,
            "reverted_version_name": reverted_version.version_name,
            "new_version_id": new_version.id
        }
        
        change_log = ChangeLog(
            id=str(uuid4()),
            version_id=new_version.id,
            action="revert_completed",
            description=f"Reverted changes from '{reverted_version.version_name}'",
            changes_summary=changes_summary,
            performed_by=user_id,
            performed_at=datetime.utcnow()
        )
        
        self.db.add(change_log)
        self.db.commit()
        
        return change_log
    
    def get_version_lineage(
        self,
        version_id: str,
        max_depth: int = 50
    ) -> Dict[str, Any]:
        """Get the complete lineage of a version"""
        
        version = self.db.query(Version).filter(Version.id == version_id).first()
        if not version:
            raise ValueError(f"Version {version_id} not found")
        
        lineage = {
            "version": {
                "id": version.id,
                "name": version.version_name,
                "created_at": version.created_at.isoformat(),
                "created_by": version.created_by
            },
            "ancestors": [],
            "descendants": [],
            "branch_history": [],
            "related_operations": []
        }
        
        # Get ancestors (previous versions in the branch)
        ancestors = self._get_version_ancestors(version, max_depth)
        lineage["ancestors"] = ancestors
        
        # Get descendants (subsequent versions)
        descendants = self._get_version_descendants(version, max_depth)
        lineage["descendants"] = descendants
        
        # Get branch history
        branch_history = self._get_branch_history_for_version(version)
        lineage["branch_history"] = branch_history
        
        # Get related operations (merges, cherry-picks, etc.)
        related_operations = self._get_related_operations(version)
        lineage["related_operations"] = related_operations
        
        return lineage
    
    def get_change_history(
        self,
        reporting_event_id: str = None,
        branch_id: str = None,
        version_id: str = None,
        user_id: str = None,
        action_type: str = None,
        since: datetime = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get filtered change history"""
        
        query = self.db.query(ChangeLog)
        
        # Apply filters
        if version_id:
            query = query.filter(ChangeLog.version_id == version_id)
        
        if branch_id:
            query = query.filter(ChangeLog.branch_id == branch_id)
        
        if user_id:
            query = query.filter(ChangeLog.performed_by == user_id)
        
        if action_type:
            query = query.filter(ChangeLog.action == action_type)
        
        if since:
            query = query.filter(ChangeLog.performed_at >= since)
        
        # Join with version/branch to filter by reporting event
        if reporting_event_id:
            query = query.join(Version, ChangeLog.version_id == Version.id).filter(
                Version.reporting_event_id == reporting_event_id
            )
        
        change_logs = query.order_by(ChangeLog.performed_at.desc()).limit(limit).all()
        
        history = []
        for change_log in change_logs:
            history.append({
                "id": change_log.id,
                "action": change_log.action,
                "description": change_log.description,
                "changes_summary": change_log.changes_summary,
                "performed_by": change_log.performed_by,
                "performed_at": change_log.performed_at.isoformat(),
                "version_id": change_log.version_id,
                "branch_id": change_log.branch_id
            })
        
        return history
    
    def get_user_activity(
        self,
        user_id: str,
        since: datetime = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get activity summary for a user"""
        
        if since is None:
            since = datetime.utcnow() - timedelta(days=30)  # Last 30 days
        
        query = self.db.query(ChangeLog).filter(
            ChangeLog.performed_by == user_id,
            ChangeLog.performed_at >= since
        )
        
        change_logs = query.order_by(ChangeLog.performed_at.desc()).limit(limit).all()
        
        # Aggregate activity
        activity_summary = {
            "user_id": user_id,
            "period_start": since.isoformat(),
            "period_end": datetime.utcnow().isoformat(),
            "total_actions": len(change_logs),
            "action_counts": {},
            "recent_activities": [],
            "most_active_days": {}
        }
        
        day_counts = {}
        
        for change_log in change_logs:
            # Count actions by type
            action = change_log.action
            if action not in activity_summary["action_counts"]:
                activity_summary["action_counts"][action] = 0
            activity_summary["action_counts"][action] += 1
            
            # Count by day
            day = change_log.performed_at.date().isoformat()
            if day not in day_counts:
                day_counts[day] = 0
            day_counts[day] += 1
            
            # Add to recent activities
            if len(activity_summary["recent_activities"]) < 20:
                activity_summary["recent_activities"].append({
                    "action": change_log.action,
                    "description": change_log.description,
                    "performed_at": change_log.performed_at.isoformat()
                })
        
        # Get most active days
        activity_summary["most_active_days"] = dict(
            sorted(day_counts.items(), key=lambda x: x[1], reverse=True)[:7]
        )
        
        return activity_summary
    
    def create_commit(
        self,
        version_id: str,
        message: str,
        author: str,
        changes: Dict[str, Any] = None
    ) -> Commit:
        """Create a commit record for a version"""
        
        commit = Commit(
            id=str(uuid4()),
            version_id=version_id,
            message=message,
            author=author,
            timestamp=datetime.utcnow(),
            changes=changes or {}
        )
        
        self.db.add(commit)
        self.db.commit()
        
        return commit
    
    def get_commit_history(
        self,
        branch_id: str = None,
        version_id: str = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get commit history"""
        
        query = self.db.query(Commit)
        
        if version_id:
            query = query.filter(Commit.version_id == version_id)
        elif branch_id:
            query = query.join(Version, Commit.version_id == Version.id).filter(
                Version.branch_id == branch_id
            )
        
        commits = query.order_by(Commit.timestamp.desc()).limit(limit).all()
        
        history = []
        for commit in commits:
            history.append({
                "id": commit.id,
                "version_id": commit.version_id,
                "message": commit.message,
                "author": commit.author,
                "timestamp": commit.timestamp.isoformat(),
                "changes": commit.changes
            })
        
        return history
    
    def _get_version_ancestors(
        self,
        version: Version,
        max_depth: int
    ) -> List[Dict[str, Any]]:
        """Get ancestors of a version in the same branch"""
        
        ancestors = []
        current_depth = 0
        
        # Get all versions in the same branch before this version
        branch_versions = self.db.query(Version).filter(
            Version.branch_id == version.branch_id,
            Version.created_at < version.created_at
        ).order_by(Version.created_at.desc()).limit(max_depth).all()
        
        for ancestor in branch_versions:
            ancestors.append({
                "id": ancestor.id,
                "name": ancestor.version_name,
                "created_at": ancestor.created_at.isoformat(),
                "created_by": ancestor.created_by,
                "depth": current_depth + 1
            })
            current_depth += 1
            
            if current_depth >= max_depth:
                break
        
        return ancestors
    
    def _get_version_descendants(
        self,
        version: Version,
        max_depth: int
    ) -> List[Dict[str, Any]]:
        """Get descendants of a version"""
        
        descendants = []
        current_depth = 0
        
        # Get versions in the same branch after this version
        branch_versions = self.db.query(Version).filter(
            Version.branch_id == version.branch_id,
            Version.created_at > version.created_at
        ).order_by(Version.created_at.asc()).limit(max_depth).all()
        
        for descendant in branch_versions:
            descendants.append({
                "id": descendant.id,
                "name": descendant.version_name,
                "created_at": descendant.created_at.isoformat(),
                "created_by": descendant.created_by,
                "depth": current_depth + 1
            })
            current_depth += 1
            
            if current_depth >= max_depth:
                break
        
        return descendants
    
    def _get_branch_history_for_version(self, version: Version) -> List[Dict[str, Any]]:
        """Get branch history related to a version"""
        
        branch = self.db.query(Branch).filter(Branch.id == version.branch_id).first()
        if not branch:
            return []
        
        history = [{
            "id": branch.id,
            "name": branch.name,
            "created_at": branch.created_at.isoformat(),
            "created_by": branch.created_by,
            "is_current_branch": True
        }]
        
        # Add source branch info if available
        if branch.source_branch_id:
            source_branch = self.db.query(Branch).filter(
                Branch.id == branch.source_branch_id
            ).first()
            if source_branch:
                history.append({
                    "id": source_branch.id,
                    "name": source_branch.name,
                    "created_at": source_branch.created_at.isoformat(),
                    "created_by": source_branch.created_by,
                    "is_source_branch": True
                })
        
        return history
    
    def _get_related_operations(self, version: Version) -> List[Dict[str, Any]]:
        """Get operations related to a version (merges, cherry-picks, etc.)"""
        
        # Get change logs that reference this version
        change_logs = self.db.query(ChangeLog).filter(
            ChangeLog.version_id == version.id
        ).all()
        
        operations = []
        for change_log in change_logs:
            if change_log.action in ['merge_completed', 'cherry_pick_completed', 'revert_completed']:
                operations.append({
                    "id": change_log.id,
                    "type": change_log.action,
                    "description": change_log.description,
                    "performed_at": change_log.performed_at.isoformat(),
                    "performed_by": change_log.performed_by,
                    "details": change_log.changes_summary
                })
        
        return operations