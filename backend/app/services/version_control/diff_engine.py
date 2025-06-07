"""Diff Engine for Version Control

Calculates differences between versions of analysis metadata.
"""

from typing import Dict, List, Any, Optional, Union
import json
from deepdiff import DeepDiff
from datetime import datetime

from app.models.version_control import Version


class DiffEngine:
    """Engine for calculating differences between versions"""
    
    def __init__(self):
        self.ignore_keys = [
            'created_at', 'updated_at', 'created_by', 'updated_by',
            'id'  # We may want to include IDs in some cases
        ]
    
    def compare_versions(
        self,
        version1: Version,
        version2: Version,
        include_metadata: bool = True
    ) -> Dict[str, Any]:
        """Compare two versions and return detailed differences"""
        
        diff_result = {
            "version1": {
                "id": version1.id,
                "name": version1.version_name,
                "created_at": version1.created_at.isoformat(),
                "created_by": version1.created_by
            },
            "version2": {
                "id": version2.id,
                "name": version2.version_name,
                "created_at": version2.created_at.isoformat(),
                "created_by": version2.created_by
            },
            "summary": {},
            "detailed_changes": {},
            "statistics": {}
        }
        
        # Calculate deep diff
        deep_diff = DeepDiff(
            version1.version_data,
            version2.version_data,
            ignore_order=True,
            report_type='text',
            exclude_paths=self.ignore_keys if not include_metadata else []
        )
        
        # Process the differences
        diff_result["detailed_changes"] = self._process_deep_diff(deep_diff)
        diff_result["summary"] = self._generate_summary(diff_result["detailed_changes"])
        diff_result["statistics"] = self._calculate_statistics(diff_result["detailed_changes"])
        
        return diff_result
    
    def compare_specific_sections(
        self,
        version1: Version,
        version2: Version,
        sections: List[str]
    ) -> Dict[str, Any]:
        """Compare specific sections between versions"""
        
        result = {}
        
        for section in sections:
            data1 = self._get_section_data(version1.version_data, section)
            data2 = self._get_section_data(version2.version_data, section)
            
            if data1 is not None or data2 is not None:
                diff = DeepDiff(
                    data1,
                    data2,
                    ignore_order=True,
                    report_type='text'
                )
                
                result[section] = {
                    "changes": self._process_deep_diff(diff),
                    "summary": self._generate_section_summary(diff, section)
                }
        
        return result
    
    def get_field_history(
        self,
        versions: List[Version],
        field_path: str
    ) -> List[Dict[str, Any]]:
        """Track the history of changes for a specific field across versions"""
        
        history = []
        
        for version in sorted(versions, key=lambda v: v.created_at):
            field_value = self._get_field_value(version.version_data, field_path)
            
            history.append({
                "version_id": version.id,
                "version_name": version.version_name,
                "created_at": version.created_at.isoformat(),
                "created_by": version.created_by,
                "field_value": field_value
            })
        
        # Add change indicators
        for i in range(1, len(history)):
            prev_value = history[i-1]["field_value"]
            curr_value = history[i]["field_value"]
            history[i]["changed"] = prev_value != curr_value
        
        return history
    
    def find_conflicts(
        self,
        base_version: Version,
        version1: Version,
        version2: Version
    ) -> Dict[str, Any]:
        """Find conflicts between two versions relative to a base version"""
        
        # Get changes from base to each version
        changes1 = self.compare_versions(base_version, version1)
        changes2 = self.compare_versions(base_version, version2)
        
        conflicts = {
            "conflicting_paths": [],
            "conflicts": {},
            "auto_mergeable": [],
            "statistics": {
                "total_conflicts": 0,
                "resolvable_conflicts": 0,
                "critical_conflicts": 0
            }
        }
        
        # Find overlapping change paths
        paths1 = self._extract_change_paths(changes1["detailed_changes"])
        paths2 = self._extract_change_paths(changes2["detailed_changes"])
        
        conflicting_paths = set(paths1) & set(paths2)
        
        for path in conflicting_paths:
            value1 = self._get_change_value(changes1["detailed_changes"], path)
            value2 = self._get_change_value(changes2["detailed_changes"], path)
            
            if value1 != value2:
                conflict_info = {
                    "path": path,
                    "base_value": self._get_field_value(base_version.version_data, path),
                    "version1_value": value1,
                    "version2_value": value2,
                    "conflict_type": self._classify_conflict_type(path, value1, value2),
                    "auto_resolvable": self._is_auto_resolvable(path, value1, value2),
                    "resolution_suggestions": self._get_resolution_suggestions(path, value1, value2)
                }
                
                conflicts["conflicts"][path] = conflict_info
                conflicts["conflicting_paths"].append(path)
                
                if conflict_info["auto_resolvable"]:
                    conflicts["auto_mergeable"].append(path)
        
        # Update statistics
        conflicts["statistics"]["total_conflicts"] = len(conflicts["conflicts"])
        conflicts["statistics"]["resolvable_conflicts"] = len(conflicts["auto_mergeable"])
        conflicts["statistics"]["critical_conflicts"] = (
            conflicts["statistics"]["total_conflicts"] - 
            conflicts["statistics"]["resolvable_conflicts"]
        )
        
        return conflicts
    
    def generate_patch(
        self,
        source_version: Version,
        target_version: Version
    ) -> Dict[str, Any]:
        """Generate a patch that can be applied to transform one version to another"""
        
        diff = self.compare_versions(source_version, target_version)
        
        patch = {
            "source_version_id": source_version.id,
            "target_version_id": target_version.id,
            "operations": [],
            "metadata": {
                "created_at": datetime.utcnow().isoformat(),
                "changes_count": 0
            }
        }
        
        # Convert diff to patch operations
        for change_type, changes in diff["detailed_changes"].items():
            if change_type == "values_changed":
                for path, change in changes.items():
                    patch["operations"].append({
                        "operation": "replace",
                        "path": path,
                        "old_value": change.get("old_value"),
                        "new_value": change.get("new_value")
                    })
            elif change_type == "iterable_item_added":
                for path, value in changes.items():
                    patch["operations"].append({
                        "operation": "add",
                        "path": path,
                        "value": value
                    })
            elif change_type == "iterable_item_removed":
                for path, value in changes.items():
                    patch["operations"].append({
                        "operation": "remove",
                        "path": path,
                        "value": value
                    })
        
        patch["metadata"]["changes_count"] = len(patch["operations"])
        
        return patch
    
    def _process_deep_diff(self, deep_diff: DeepDiff) -> Dict[str, Any]:
        """Process DeepDiff result into a more usable format"""
        
        processed = {
            "values_changed": {},
            "iterable_item_added": {},
            "iterable_item_removed": {},
            "dictionary_item_added": {},
            "dictionary_item_removed": {},
            "type_changes": {},
            "set_item_added": {},
            "set_item_removed": {}
        }
        
        for change_type, changes in deep_diff.items():
            if change_type in processed:
                if isinstance(changes, dict):
                    for path, change in changes.items():
                        processed[change_type][path] = self._format_change_value(change)
                elif isinstance(changes, set):
                    for change in changes:
                        processed[change_type][str(change)] = True
        
        return processed
    
    def _format_change_value(self, change: Any) -> Any:
        """Format change values for better readability"""
        
        if hasattr(change, 'new_value') and hasattr(change, 'old_value'):
            return {
                "old_value": change.old_value,
                "new_value": change.new_value
            }
        elif hasattr(change, 'new_type') and hasattr(change, 'old_type'):
            return {
                "old_type": str(change.old_type),
                "new_type": str(change.new_type),
                "old_value": change.old_value,
                "new_value": change.new_value
            }
        else:
            return change
    
    def _generate_summary(self, detailed_changes: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a summary of changes"""
        
        summary = {
            "total_changes": 0,
            "values_changed": 0,
            "items_added": 0,
            "items_removed": 0,
            "type_changes": 0,
            "affected_sections": set()
        }
        
        for change_type, changes in detailed_changes.items():
            count = len(changes) if isinstance(changes, dict) else 0
            summary["total_changes"] += count
            
            if "changed" in change_type:
                summary["values_changed"] += count
            elif "added" in change_type:
                summary["items_added"] += count
            elif "removed" in change_type:
                summary["items_removed"] += count
            elif "type" in change_type:
                summary["type_changes"] += count
            
            # Extract affected sections
            for path in changes.keys() if isinstance(changes, dict) else []:
                section = self._extract_section_from_path(path)
                if section:
                    summary["affected_sections"].add(section)
        
        summary["affected_sections"] = list(summary["affected_sections"])
        
        return summary
    
    def _generate_section_summary(self, diff: DeepDiff, section: str) -> Dict[str, Any]:
        """Generate summary for a specific section"""
        
        summary = {
            "section": section,
            "has_changes": len(diff) > 0,
            "change_types": list(diff.keys()) if diff else [],
            "change_count": sum(len(changes) for changes in diff.values() if isinstance(changes, dict))
        }
        
        return summary
    
    def _get_section_data(self, version_data: Dict[str, Any], section: str) -> Any:
        """Extract data for a specific section from version data"""
        
        return version_data.get(section)
    
    def _get_field_value(self, data: Dict[str, Any], field_path: str) -> Any:
        """Get the value of a field using dot notation path"""
        
        keys = field_path.split('.')
        current = data
        
        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            elif isinstance(current, list):
                try:
                    index = int(key)
                    current = current[index]
                except (ValueError, IndexError):
                    return None
            else:
                return None
        
        return current
    
    def _extract_change_paths(self, detailed_changes: Dict[str, Any]) -> List[str]:
        """Extract all change paths from detailed changes"""
        
        paths = []
        for change_type, changes in detailed_changes.items():
            if isinstance(changes, dict):
                paths.extend(changes.keys())
        
        return paths
    
    def _get_change_value(self, detailed_changes: Dict[str, Any], path: str) -> Any:
        """Get the change value for a specific path"""
        
        for change_type, changes in detailed_changes.items():
            if isinstance(changes, dict) and path in changes:
                change = changes[path]
                if isinstance(change, dict) and "new_value" in change:
                    return change["new_value"]
                else:
                    return change
        
        return None
    
    def _classify_conflict_type(self, path: str, value1: Any, value2: Any) -> str:
        """Classify the type of conflict"""
        
        # Check if it's a critical field
        critical_fields = ['id', 'name', 'version']
        if any(field in path.lower() for field in critical_fields):
            return "critical"
        
        # Check if values are compatible
        if type(value1) != type(value2):
            return "type_mismatch"
        
        # Check if it's a list/array conflict
        if isinstance(value1, list) and isinstance(value2, list):
            return "array_conflict"
        
        # Default to simple value conflict
        return "value_conflict"
    
    def _is_auto_resolvable(self, path: str, value1: Any, value2: Any) -> bool:
        """Determine if a conflict can be automatically resolved"""
        
        # Don't auto-resolve critical fields
        critical_fields = ['id', 'name', 'version']
        if any(field in path.lower() for field in critical_fields):
            return False
        
        # Auto-resolve if one value is None/empty
        if not value1 and value2:
            return True
        if not value2 and value1:
            return True
        
        # Auto-resolve list merges in some cases
        if isinstance(value1, list) and isinstance(value2, list):
            # If one list is a subset of the other
            if set(value1).issubset(set(value2)) or set(value2).issubset(set(value1)):
                return True
        
        return False
    
    def _get_resolution_suggestions(
        self,
        path: str,
        value1: Any,
        value2: Any
    ) -> List[Dict[str, Any]]:
        """Get suggestions for resolving conflicts"""
        
        suggestions = []
        
        # Suggest keeping one value
        suggestions.append({
            "type": "keep_version1",
            "description": f"Keep value from version 1: {value1}",
            "action": "replace",
            "value": value1
        })
        
        suggestions.append({
            "type": "keep_version2", 
            "description": f"Keep value from version 2: {value2}",
            "action": "replace",
            "value": value2
        })
        
        # Suggest merging for lists
        if isinstance(value1, list) and isinstance(value2, list):
            merged = list(set(value1 + value2))
            suggestions.append({
                "type": "merge_lists",
                "description": f"Merge both lists (remove duplicates)",
                "action": "replace",
                "value": merged
            })
        
        # Suggest manual resolution
        suggestions.append({
            "type": "manual",
            "description": "Manually resolve the conflict",
            "action": "manual",
            "value": None
        })
        
        return suggestions
    
    def _extract_section_from_path(self, path: str) -> Optional[str]:
        """Extract the main section name from a change path"""
        
        # Remove root notation and get first segment
        clean_path = path.lstrip("root['").rstrip("']")
        
        if "']['" in clean_path:
            return clean_path.split("']['")[0]
        elif "." in clean_path:
            return clean_path.split(".")[0]
        else:
            return clean_path