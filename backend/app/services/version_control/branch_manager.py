"""Branch Manager for Version Control

Handles branch creation, management, and operations.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from uuid import uuid4

from sqlalchemy.orm import Session
from app.models.version_control import Branch, Version


class BranchManager:
    """Manages branches for version control"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_branch(
        self,
        reporting_event_id: str,
        branch_name: str,
        user_id: str = None,
        description: str = "",
        source_branch_name: str = "main",
        source_version_id: str = None
    ) -> Branch:
        """Create a new branch"""
        
        # Check if branch already exists
        existing_branch = self.get_branch(reporting_event_id, branch_name)
        if existing_branch:
            raise ValueError(f"Branch '{branch_name}' already exists")
        
        # Get source branch and version
        source_branch = self.get_branch(reporting_event_id, source_branch_name)
        if not source_branch:
            # Create main branch if it doesn't exist
            if source_branch_name == "main":
                source_branch = self._create_main_branch(reporting_event_id, user_id)
            else:
                raise ValueError(f"Source branch '{source_branch_name}' not found")
        
        # Determine source version
        if source_version_id:
            source_version = self.db.query(Version).filter(
                Version.id == source_version_id,
                Version.branch_id == source_branch.id
            ).first()
            if not source_version:
                raise ValueError(f"Source version {source_version_id} not found in branch {source_branch_name}")
        else:
            # Use latest version from source branch
            source_version = self._get_latest_version(source_branch.id)
        
        # Create the new branch
        branch = Branch(
            id=str(uuid4()),
            reporting_event_id=reporting_event_id,
            name=branch_name,
            description=description,
            source_branch_id=source_branch.id,
            source_version_id=source_version.id if source_version else None,
            created_by=user_id,
            created_at=datetime.utcnow(),
            is_active=True,
            is_protected=False
        )
        
        self.db.add(branch)
        self.db.commit()
        
        return branch
    
    def get_branch(
        self,
        reporting_event_id: str,
        branch_name: str
    ) -> Optional[Branch]:
        """Get a branch by name"""
        
        return self.db.query(Branch).filter(
            Branch.reporting_event_id == reporting_event_id,
            Branch.name == branch_name,
            Branch.is_active == True
        ).first()
    
    def get_or_create_branch(
        self,
        reporting_event_id: str,
        branch_name: str,
        user_id: str = None
    ) -> Branch:
        """Get existing branch or create if it doesn't exist"""
        
        branch = self.get_branch(reporting_event_id, branch_name)
        if branch:
            return branch
        
        # Create main branch by default
        if branch_name == "main":
            return self._create_main_branch(reporting_event_id, user_id)
        else:
            return self.create_branch(reporting_event_id, branch_name, user_id)
    
    def list_branches(
        self,
        reporting_event_id: str,
        include_inactive: bool = False
    ) -> List[Branch]:
        """List all branches for a reporting event"""
        
        query = self.db.query(Branch).filter(
            Branch.reporting_event_id == reporting_event_id
        )
        
        if not include_inactive:
            query = query.filter(Branch.is_active == True)
        
        return query.order_by(Branch.created_at.desc()).all()
    
    def delete_branch(
        self,
        reporting_event_id: str,
        branch_name: str,
        user_id: str = None,
        force: bool = False
    ) -> bool:
        """Delete a branch (soft delete)"""
        
        branch = self.get_branch(reporting_event_id, branch_name)
        if not branch:
            return False
        
        # Prevent deletion of main branch
        if branch.name == "main" and not force:
            raise ValueError("Cannot delete main branch")
        
        # Prevent deletion of protected branches
        if branch.is_protected and not force:
            raise ValueError(f"Branch '{branch_name}' is protected")
        
        # Check for unmerged changes
        if not force and self._has_unmerged_changes(branch):
            raise ValueError(f"Branch '{branch_name}' has unmerged changes")
        
        # Soft delete
        branch.is_active = False
        branch.deleted_at = datetime.utcnow()
        branch.deleted_by = user_id
        
        # Also soft delete associated versions
        self.db.query(Version).filter(
            Version.branch_id == branch.id
        ).update({
            "deleted_at": datetime.utcnow(),
            "deleted_by": user_id
        })
        
        self.db.commit()
        return True
    
    def protect_branch(
        self,
        reporting_event_id: str,
        branch_name: str,
        protection_rules: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Protect a branch with optional rules"""
        
        branch = self.get_branch(reporting_event_id, branch_name)
        if not branch:
            return False
        
        branch.is_protected = True
        branch.protection_rules = protection_rules or {
            "require_review": True,
            "restrict_push": True,
            "require_status_checks": False
        }
        
        self.db.commit()
        return True
    
    def unprotect_branch(
        self,
        reporting_event_id: str,
        branch_name: str
    ) -> bool:
        """Remove protection from a branch"""
        
        branch = self.get_branch(reporting_event_id, branch_name)
        if not branch:
            return False
        
        branch.is_protected = False
        branch.protection_rules = None
        
        self.db.commit()
        return True
    
    def rename_branch(
        self,
        reporting_event_id: str,
        old_name: str,
        new_name: str,
        user_id: str = None
    ) -> bool:
        """Rename a branch"""
        
        # Check if old branch exists
        branch = self.get_branch(reporting_event_id, old_name)
        if not branch:
            raise ValueError(f"Branch '{old_name}' not found")
        
        # Check if new name is available
        existing_branch = self.get_branch(reporting_event_id, new_name)
        if existing_branch:
            raise ValueError(f"Branch '{new_name}' already exists")
        
        # Prevent renaming main branch
        if branch.name == "main":
            raise ValueError("Cannot rename main branch")
        
        # Prevent renaming protected branches
        if branch.is_protected:
            raise ValueError(f"Cannot rename protected branch '{old_name}'")
        
        # Rename the branch
        branch.name = new_name
        branch.updated_at = datetime.utcnow()
        branch.updated_by = user_id
        
        self.db.commit()
        return True
    
    def get_branch_info(
        self,
        reporting_event_id: str,
        branch_name: str
    ) -> Optional[Dict[str, Any]]:
        """Get detailed information about a branch"""
        
        branch = self.get_branch(reporting_event_id, branch_name)
        if not branch:
            return None
        
        # Get version statistics
        version_count = self.db.query(Version).filter(
            Version.branch_id == branch.id,
            Version.deleted_at.is_(None)
        ).count()
        
        latest_version = self._get_latest_version(branch.id)
        
        # Get source branch info
        source_branch = None
        if branch.source_branch_id:
            source_branch = self.db.query(Branch).filter(
                Branch.id == branch.source_branch_id
            ).first()
        
        # Check for ahead/behind status compared to main
        ahead_behind = self._get_ahead_behind_status(branch)
        
        return {
            "id": branch.id,
            "name": branch.name,
            "description": branch.description,
            "created_at": branch.created_at.isoformat(),
            "created_by": branch.created_by,
            "is_protected": branch.is_protected,
            "protection_rules": branch.protection_rules,
            "source_branch": {
                "id": source_branch.id,
                "name": source_branch.name
            } if source_branch else None,
            "statistics": {
                "version_count": version_count,
                "latest_version": {
                    "id": latest_version.id,
                    "name": latest_version.version_name,
                    "created_at": latest_version.created_at.isoformat()
                } if latest_version else None,
                "ahead_commits": ahead_behind["ahead"],
                "behind_commits": ahead_behind["behind"]
            }
        }
    
    def compare_branches(
        self,
        reporting_event_id: str,
        branch1_name: str,
        branch2_name: str
    ) -> Dict[str, Any]:
        """Compare two branches"""
        
        branch1 = self.get_branch(reporting_event_id, branch1_name)
        branch2 = self.get_branch(reporting_event_id, branch2_name)
        
        if not branch1 or not branch2:
            raise ValueError("One or both branches not found")
        
        # Get latest versions from both branches
        version1 = self._get_latest_version(branch1.id)
        version2 = self._get_latest_version(branch2.id)
        
        if not version1 or not version2:
            return {
                "branch1": branch1_name,
                "branch2": branch2_name,
                "comparable": False,
                "reason": "One or both branches have no versions"
            }
        
        # Use diff engine to compare
        from .diff_engine import DiffEngine
        diff_engine = DiffEngine()
        
        comparison = diff_engine.compare_versions(version1, version2)
        
        return {
            "branch1": {
                "name": branch1_name,
                "latest_version": {
                    "id": version1.id,
                    "name": version1.version_name,
                    "created_at": version1.created_at.isoformat()
                }
            },
            "branch2": {
                "name": branch2_name,
                "latest_version": {
                    "id": version2.id,
                    "name": version2.version_name,
                    "created_at": version2.created_at.isoformat()
                }
            },
            "comparable": True,
            "differences": comparison
        }
    
    def get_branch_history(
        self,
        reporting_event_id: str,
        branch_name: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get the version history for a branch"""
        
        branch = self.get_branch(reporting_event_id, branch_name)
        if not branch:
            raise ValueError(f"Branch '{branch_name}' not found")
        
        versions = self.db.query(Version).filter(
            Version.branch_id == branch.id,
            Version.deleted_at.is_(None)
        ).order_by(Version.created_at.desc()).limit(limit).all()
        
        history = []
        for version in versions:
            history.append({
                "id": version.id,
                "name": version.version_name,
                "description": version.description,
                "created_at": version.created_at.isoformat(),
                "created_by": version.created_by,
                "is_current": version.is_current
            })
        
        return history
    
    def _create_main_branch(
        self,
        reporting_event_id: str,
        user_id: str = None
    ) -> Branch:
        """Create the main branch for a reporting event"""
        
        branch = Branch(
            id=str(uuid4()),
            reporting_event_id=reporting_event_id,
            name="main",
            description="Main branch",
            source_branch_id=None,
            source_version_id=None,
            created_by=user_id,
            created_at=datetime.utcnow(),
            is_active=True,
            is_protected=True,  # Main branch is protected by default
            protection_rules={
                "require_review": True,
                "restrict_push": True,
                "require_status_checks": False
            }
        )
        
        self.db.add(branch)
        self.db.commit()
        
        return branch
    
    def _get_latest_version(self, branch_id: str) -> Optional[Version]:
        """Get the latest version from a branch"""
        
        return self.db.query(Version).filter(
            Version.branch_id == branch_id,
            Version.is_current == True,
            Version.deleted_at.is_(None)
        ).first()
    
    def _has_unmerged_changes(self, branch: Branch) -> bool:
        """Check if a branch has unmerged changes"""
        
        # Simple check: if branch has versions not in main branch
        main_branch = self.get_branch(branch.reporting_event_id, "main")
        if not main_branch or branch.id == main_branch.id:
            return False
        
        # Count versions in this branch that are newer than the branch point
        branch_versions = self.db.query(Version).filter(
            Version.branch_id == branch.id,
            Version.deleted_at.is_(None)
        ).count()
        
        # If branch has any versions, consider it as having potential unmerged changes
        # In a more sophisticated implementation, you'd track merges
        return branch_versions > 0
    
    def _get_ahead_behind_status(self, branch: Branch) -> Dict[str, int]:
        """Get how many commits ahead/behind this branch is compared to main"""
        
        # Simplified implementation - in practice, you'd need to track
        # the commit graph more carefully
        
        main_branch = self.get_branch(branch.reporting_event_id, "main")
        if not main_branch or branch.id == main_branch.id:
            return {"ahead": 0, "behind": 0}
        
        # Count versions in each branch since divergence
        branch_versions = self.db.query(Version).filter(
            Version.branch_id == branch.id,
            Version.deleted_at.is_(None)
        ).count()
        
        main_versions = self.db.query(Version).filter(
            Version.branch_id == main_branch.id,
            Version.deleted_at.is_(None)
        ).count()
        
        # Simple heuristic - in practice, you'd need to find the actual divergence point
        return {
            "ahead": max(0, branch_versions - 1),  # Exclude the initial branch version
            "behind": max(0, main_versions - (branch_versions if branch.source_version_id else 0))
        }