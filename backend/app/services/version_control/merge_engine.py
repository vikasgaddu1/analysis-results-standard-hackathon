"""Merge Engine for Version Control

Handles merging changes from different versions and branches.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from uuid import uuid4
import copy

from sqlalchemy.orm import Session
from app.models.version_control import Version, Branch, MergeRequest, ConflictResolution
from app.models.ars import ReportingEvent
from .diff_engine import DiffEngine


class MergeEngine:
    """Engine for merging changes between versions and branches"""
    
    def __init__(self):
        self.diff_engine = DiffEngine()
    
    def create_merge_request(
        self,
        db: Session,
        source_branch_id: str,
        target_branch_id: str,
        title: str,
        description: str = "",
        user_id: str = None
    ) -> MergeRequest:
        """Create a new merge request"""
        
        # Get latest versions from both branches
        source_version = self._get_latest_version(db, source_branch_id)
        target_version = self._get_latest_version(db, target_branch_id)
        
        if not source_version or not target_version:
            raise ValueError("Cannot find latest versions for source or target branch")
        
        # Find common ancestor (base version)
        base_version = self._find_common_ancestor(db, source_version, target_version)
        
        # Detect conflicts
        conflicts = self.diff_engine.find_conflicts(
            base_version, source_version, target_version
        ) if base_version else {"conflicts": {}, "statistics": {"total_conflicts": 0}}
        
        merge_request = MergeRequest(
            id=str(uuid4()),
            title=title,
            description=description,
            source_branch_id=source_branch_id,
            target_branch_id=target_branch_id,
            source_version_id=source_version.id,
            target_version_id=target_version.id,
            base_version_id=base_version.id if base_version else None,
            status="open",
            has_conflicts=conflicts["statistics"]["total_conflicts"] > 0,
            conflicts_data=conflicts,
            created_by=user_id,
            created_at=datetime.utcnow()
        )
        
        db.add(merge_request)
        db.commit()
        
        return merge_request
    
    def auto_merge(
        self,
        db: Session,
        merge_request_id: str,
        user_id: str = None
    ) -> Tuple[bool, Optional[Version], List[str]]:
        """Attempt to automatically merge a merge request"""
        
        merge_request = db.query(MergeRequest).filter(
            MergeRequest.id == merge_request_id
        ).first()
        
        if not merge_request:
            raise ValueError(f"Merge request {merge_request_id} not found")
        
        if merge_request.status != "open":
            raise ValueError(f"Merge request is {merge_request.status}, cannot merge")
        
        messages = []
        
        # Check if auto-merge is possible
        if merge_request.has_conflicts:
            auto_resolvable = merge_request.conflicts_data.get("auto_mergeable", [])
            unresolvable = [
                path for path in merge_request.conflicts_data.get("conflicting_paths", [])
                if path not in auto_resolvable
            ]
            
            if unresolvable:
                messages.append(f"Cannot auto-merge: {len(unresolvable)} unresolvable conflicts")
                return False, None, messages
        
        # Perform the merge
        try:
            merged_version = self._perform_merge(
                db, merge_request, user_id, auto_resolve_conflicts=True
            )
            
            # Update merge request status
            merge_request.status = "merged"
            merge_request.merged_at = datetime.utcnow()
            merge_request.merged_by = user_id
            merge_request.merged_version_id = merged_version.id
            
            db.commit()
            
            messages.append("Auto-merge completed successfully")
            return True, merged_version, messages
            
        except Exception as e:
            messages.append(f"Auto-merge failed: {str(e)}")
            return False, None, messages
    
    def manual_merge(
        self,
        db: Session,
        merge_request_id: str,
        conflict_resolutions: List[Dict[str, Any]],
        user_id: str = None
    ) -> Version:
        """Perform manual merge with conflict resolutions"""
        
        merge_request = db.query(MergeRequest).filter(
            MergeRequest.id == merge_request_id
        ).first()
        
        if not merge_request:
            raise ValueError(f"Merge request {merge_request_id} not found")
        
        if merge_request.status != "open":
            raise ValueError(f"Merge request is {merge_request.status}, cannot merge")
        
        # Save conflict resolutions
        for resolution_data in conflict_resolutions:
            resolution = ConflictResolution(
                id=str(uuid4()),
                merge_request_id=merge_request_id,
                conflict_path=resolution_data["path"],
                resolution_type=resolution_data["resolution_type"],
                resolved_value=resolution_data["resolved_value"],
                resolution_reason=resolution_data.get("reason", ""),
                resolved_by=user_id,
                resolved_at=datetime.utcnow()
            )
            db.add(resolution)
        
        # Perform the merge with resolutions
        merged_version = self._perform_merge(
            db, merge_request, user_id, conflict_resolutions=conflict_resolutions
        )
        
        # Update merge request status
        merge_request.status = "merged"
        merge_request.merged_at = datetime.utcnow()
        merge_request.merged_by = user_id
        merge_request.merged_version_id = merged_version.id
        
        db.commit()
        
        return merged_version
    
    def three_way_merge(
        self,
        base_data: Dict[str, Any],
        source_data: Dict[str, Any],
        target_data: Dict[str, Any],
        conflict_resolutions: Optional[List[Dict[str, Any]]] = None
    ) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """Perform three-way merge algorithm"""
        
        merged_data = copy.deepcopy(base_data)
        conflicts = []
        
        # Get changes from base to source and target
        source_changes = self._get_changes_from_base(base_data, source_data)
        target_changes = self._get_changes_from_base(base_data, target_data)
        
        # Apply non-conflicting changes
        for path, value in source_changes.items():
            if path not in target_changes:
                self._set_value_at_path(merged_data, path, value)
        
        for path, value in target_changes.items():
            if path not in source_changes:
                self._set_value_at_path(merged_data, path, value)
        
        # Handle conflicts
        conflicting_paths = set(source_changes.keys()) & set(target_changes.keys())
        
        for path in conflicting_paths:
            source_value = source_changes[path]
            target_value = target_changes[path]
            
            if source_value == target_value:
                # Same change, no conflict
                self._set_value_at_path(merged_data, path, source_value)
            else:
                # Real conflict
                conflict = {
                    "path": path,
                    "base_value": self._get_value_at_path(base_data, path),
                    "source_value": source_value,
                    "target_value": target_value
                }
                
                # Check if we have a resolution for this conflict
                resolution = self._find_conflict_resolution(
                    conflict_resolutions, path
                ) if conflict_resolutions else None
                
                if resolution:
                    self._set_value_at_path(
                        merged_data, path, resolution["resolved_value"]
                    )
                else:
                    conflicts.append(conflict)
        
        return merged_data, conflicts
    
    def cherry_pick(
        self,
        db: Session,
        source_version_id: str,
        target_branch_id: str,
        specific_changes: Optional[List[str]] = None,
        user_id: str = None
    ) -> Version:
        """Cherry-pick specific changes from one version to a branch"""
        
        source_version = db.query(Version).filter(
            Version.id == source_version_id
        ).first()
        
        if not source_version:
            raise ValueError(f"Source version {source_version_id} not found")
        
        target_branch = db.query(Branch).filter(
            Branch.id == target_branch_id
        ).first()
        
        if not target_branch:
            raise ValueError(f"Target branch {target_branch_id} not found")
        
        # Get current version of target branch
        target_version = self._get_latest_version(db, target_branch_id)
        
        if not target_version:
            raise ValueError(f"No versions found in target branch {target_branch_id}")
        
        # Find the parent version of the source (for determining what changed)
        source_branch = db.query(Branch).filter(
            Branch.id == source_version.branch_id
        ).first()
        
        source_parent = self._get_previous_version(db, source_version)
        
        if not source_parent:
            # If no parent, use the entire source version
            cherry_picked_data = source_version.version_data
        else:
            # Get the specific changes
            source_changes = self._get_changes_from_base(
                source_parent.version_data, source_version.version_data
            )
            
            # Filter to specific changes if requested
            if specific_changes:
                filtered_changes = {
                    path: value for path, value in source_changes.items()
                    if any(change_path in path for change_path in specific_changes)
                }
            else:
                filtered_changes = source_changes
            
            # Apply changes to target
            cherry_picked_data = copy.deepcopy(target_version.version_data)
            for path, value in filtered_changes.items():
                self._set_value_at_path(cherry_picked_data, path, value)
        
        # Create new version with cherry-picked changes
        from .version_manager import VersionManager
        version_manager = VersionManager(db)
        
        # Temporarily update the reporting event with cherry-picked data
        reporting_event = db.query(ReportingEvent).filter(
            ReportingEvent.id == target_version.reporting_event_id
        ).first()
        
        original_data = version_manager._serialize_reporting_event(reporting_event)
        version_manager._deserialize_to_reporting_event(cherry_picked_data, reporting_event)
        
        # Create the new version
        new_version = version_manager.create_version(
            target_version.reporting_event_id,
            f"Cherry-pick from {source_version.version_name}",
            f"Cherry-picked changes from version {source_version.version_name}",
            user_id,
            target_branch.name
        )
        
        # Restore original data (the version creation already captured the changes)
        version_manager._deserialize_to_reporting_event(original_data, reporting_event)
        db.commit()
        
        return new_version
    
    def revert_version(
        self,
        db: Session,
        version_to_revert_id: str,
        target_branch_id: str,
        user_id: str = None
    ) -> Version:
        """Revert changes from a specific version"""
        
        version_to_revert = db.query(Version).filter(
            Version.id == version_to_revert_id
        ).first()
        
        if not version_to_revert:
            raise ValueError(f"Version {version_to_revert_id} not found")
        
        # Get the parent version to understand what to revert
        parent_version = self._get_previous_version(db, version_to_revert)
        
        if not parent_version:
            raise ValueError("Cannot revert the first version")
        
        # Get current version of target branch
        current_version = self._get_latest_version(db, target_branch_id)
        
        if not current_version:
            raise ValueError(f"No current version in target branch {target_branch_id}")
        
        # Calculate the reverse changes
        changes_to_revert = self._get_changes_from_base(
            parent_version.version_data, version_to_revert.version_data
        )
        
        # Apply reverse changes
        reverted_data = copy.deepcopy(current_version.version_data)
        for path, original_value in changes_to_revert.items():
            parent_value = self._get_value_at_path(parent_version.version_data, path)
            self._set_value_at_path(reverted_data, path, parent_value)
        
        # Create new version with reverted changes
        from .version_manager import VersionManager
        version_manager = VersionManager(db)
        
        # Update the reporting event temporarily
        reporting_event = db.query(ReportingEvent).filter(
            ReportingEvent.id == current_version.reporting_event_id
        ).first()
        
        original_data = version_manager._serialize_reporting_event(reporting_event)
        version_manager._deserialize_to_reporting_event(reverted_data, reporting_event)
        
        # Create the revert version
        target_branch = db.query(Branch).filter(Branch.id == target_branch_id).first()
        new_version = version_manager.create_version(
            current_version.reporting_event_id,
            f"Revert {version_to_revert.version_name}",
            f"Reverted changes from version {version_to_revert.version_name}",
            user_id,
            target_branch.name
        )
        
        # Restore original data
        version_manager._deserialize_to_reporting_event(original_data, reporting_event)
        db.commit()
        
        return new_version
    
    def _perform_merge(
        self,
        db: Session,
        merge_request: MergeRequest,
        user_id: str = None,
        auto_resolve_conflicts: bool = False,
        conflict_resolutions: Optional[List[Dict[str, Any]]] = None
    ) -> Version:
        """Perform the actual merge operation"""
        
        source_version = db.query(Version).filter(
            Version.id == merge_request.source_version_id
        ).first()
        target_version = db.query(Version).filter(
            Version.id == merge_request.target_version_id
        ).first()
        base_version = db.query(Version).filter(
            Version.id == merge_request.base_version_id
        ).first() if merge_request.base_version_id else None
        
        if base_version:
            # Three-way merge
            merged_data, remaining_conflicts = self.three_way_merge(
                base_version.version_data,
                source_version.version_data,
                target_version.version_data,
                conflict_resolutions
            )
            
            if remaining_conflicts and not auto_resolve_conflicts:
                raise ValueError(f"Unresolved conflicts remain: {len(remaining_conflicts)}")
            
            # Auto-resolve remaining conflicts if enabled
            if remaining_conflicts and auto_resolve_conflicts:
                for conflict in remaining_conflicts:
                    # Simple strategy: prefer source version
                    self._set_value_at_path(
                        merged_data, conflict["path"], conflict["source_value"]
                    )
        else:
            # Simple merge (no common ancestor)
            merged_data = copy.deepcopy(source_version.version_data)
        
        # Create new version with merged data
        from .version_manager import VersionManager
        version_manager = VersionManager(db)
        
        # Update the reporting event temporarily
        reporting_event = db.query(ReportingEvent).filter(
            ReportingEvent.id == target_version.reporting_event_id
        ).first()
        
        original_data = version_manager._serialize_reporting_event(reporting_event)
        version_manager._deserialize_to_reporting_event(merged_data, reporting_event)
        
        # Create the merged version
        target_branch = db.query(Branch).filter(
            Branch.id == merge_request.target_branch_id
        ).first()
        
        merged_version = version_manager.create_version(
            target_version.reporting_event_id,
            f"Merge {merge_request.title}",
            f"Merged changes from {merge_request.title}",
            user_id,
            target_branch.name
        )
        
        # Restore original data
        version_manager._deserialize_to_reporting_event(original_data, reporting_event)
        
        return merged_version
    
    def _get_latest_version(self, db: Session, branch_id: str) -> Optional[Version]:
        """Get the latest version from a branch"""
        
        return db.query(Version).filter(
            Version.branch_id == branch_id,
            Version.is_current == True
        ).first()
    
    def _get_previous_version(self, db: Session, version: Version) -> Optional[Version]:
        """Get the previous version in the same branch"""
        
        return db.query(Version).filter(
            Version.branch_id == version.branch_id,
            Version.created_at < version.created_at
        ).order_by(Version.created_at.desc()).first()
    
    def _find_common_ancestor(
        self,
        db: Session,
        version1: Version,
        version2: Version
    ) -> Optional[Version]:
        """Find the common ancestor of two versions"""
        
        # Simple implementation: find the most recent version that both branches share
        # In a more sophisticated implementation, you'd build a version graph
        
        # Get all versions from both branches
        branch1_versions = db.query(Version).filter(
            Version.branch_id == version1.branch_id
        ).order_by(Version.created_at.asc()).all()
        
        branch2_versions = db.query(Version).filter(
            Version.branch_id == version2.branch_id
        ).order_by(Version.created_at.asc()).all()
        
        # Find common versions (same reporting event, earlier than both versions)
        common_versions = []
        
        for v1 in branch1_versions:
            if v1.created_at >= version1.created_at:
                continue
            
            for v2 in branch2_versions:
                if (v2.created_at >= version2.created_at or 
                    v1.reporting_event_id != v2.reporting_event_id):
                    continue
                
                # Simple heuristic: versions with same data are considered common
                if v1.version_data == v2.version_data:
                    common_versions.append((v1, max(v1.created_at, v2.created_at)))
        
        if common_versions:
            # Return the most recent common version
            return max(common_versions, key=lambda x: x[1])[0]
        
        return None
    
    def _get_changes_from_base(
        self,
        base_data: Dict[str, Any],
        current_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get all changes from base to current version"""
        
        from deepdiff import DeepDiff
        
        diff = DeepDiff(base_data, current_data, ignore_order=True)
        changes = {}
        
        # Extract changed values
        if 'values_changed' in diff:
            for path, change in diff['values_changed'].items():
                clean_path = self._clean_path(path)
                changes[clean_path] = change.new_value
        
        # Extract added items
        if 'iterable_item_added' in diff:
            for path, value in diff['iterable_item_added'].items():
                clean_path = self._clean_path(path)
                changes[clean_path] = value
        
        # Extract added dictionary items
        if 'dictionary_item_added' in diff:
            for path, value in diff['dictionary_item_added'].items():
                clean_path = self._clean_path(path)
                changes[clean_path] = value
        
        return changes
    
    def _clean_path(self, path: str) -> str:
        """Clean DeepDiff path to a more usable format"""
        
        # Remove root notation and clean up
        cleaned = path.replace("root", "").strip("[]'\"")
        
        # Convert array notation
        cleaned = cleaned.replace("']['", ".").replace("'][", ".")
        
        return cleaned.strip(".")
    
    def _get_value_at_path(self, data: Dict[str, Any], path: str) -> Any:
        """Get value at a specific path in nested data"""
        
        keys = path.split('.')
        current = data
        
        for key in keys:
            if isinstance(current, dict):
                current = current.get(key)
            elif isinstance(current, list):
                try:
                    index = int(key)
                    current = current[index]
                except (ValueError, IndexError):
                    return None
            else:
                return None
            
            if current is None:
                return None
        
        return current
    
    def _set_value_at_path(
        self,
        data: Dict[str, Any],
        path: str,
        value: Any
    ) -> None:
        """Set value at a specific path in nested data"""
        
        keys = path.split('.')
        current = data
        
        for key in keys[:-1]:
            if isinstance(current, dict):
                if key not in current:
                    current[key] = {}
                current = current[key]
            elif isinstance(current, list):
                try:
                    index = int(key)
                    while len(current) <= index:
                        current.append({})
                    current = current[index]
                except ValueError:
                    return
        
        # Set the final value
        final_key = keys[-1]
        if isinstance(current, dict):
            current[final_key] = value
        elif isinstance(current, list):
            try:
                index = int(final_key)
                while len(current) <= index:
                    current.append(None)
                current[index] = value
            except ValueError:
                pass
    
    def _find_conflict_resolution(
        self,
        conflict_resolutions: List[Dict[str, Any]],
        path: str
    ) -> Optional[Dict[str, Any]]:
        """Find a conflict resolution for a specific path"""
        
        for resolution in conflict_resolutions:
            if resolution.get("path") == path:
                return resolution
        
        return None