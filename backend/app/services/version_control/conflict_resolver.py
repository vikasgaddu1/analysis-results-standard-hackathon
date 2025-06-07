"""Conflict Resolver for Version Control

Handles merge conflicts and provides resolution strategies.
"""

from typing import Dict, List, Any, Optional, Tuple, Callable
from datetime import datetime
from enum import Enum
import json

from app.models.version_control import ConflictResolution


class ConflictType(Enum):
    """Types of conflicts that can occur"""
    VALUE_CONFLICT = "value_conflict"
    TYPE_MISMATCH = "type_mismatch" 
    ARRAY_CONFLICT = "array_conflict"
    OBJECT_CONFLICT = "object_conflict"
    DELETION_CONFLICT = "deletion_conflict"
    CRITICAL_FIELD = "critical_field"


class ResolutionStrategy(Enum):
    """Available resolution strategies"""
    KEEP_SOURCE = "keep_source"
    KEEP_TARGET = "keep_target"
    MERGE_ARRAYS = "merge_arrays"
    MERGE_OBJECTS = "merge_objects"
    CUSTOM_VALUE = "custom_value"
    MANUAL = "manual"


class ConflictResolver:
    """Resolves merge conflicts using various strategies"""
    
    def __init__(self):
        self.resolution_strategies = {
            ConflictType.VALUE_CONFLICT: [
                ResolutionStrategy.KEEP_SOURCE,
                ResolutionStrategy.KEEP_TARGET,
                ResolutionStrategy.CUSTOM_VALUE,
                ResolutionStrategy.MANUAL
            ],
            ConflictType.TYPE_MISMATCH: [
                ResolutionStrategy.KEEP_SOURCE,
                ResolutionStrategy.KEEP_TARGET,
                ResolutionStrategy.CUSTOM_VALUE,
                ResolutionStrategy.MANUAL
            ],
            ConflictType.ARRAY_CONFLICT: [
                ResolutionStrategy.KEEP_SOURCE,
                ResolutionStrategy.KEEP_TARGET,
                ResolutionStrategy.MERGE_ARRAYS,
                ResolutionStrategy.CUSTOM_VALUE,
                ResolutionStrategy.MANUAL
            ],
            ConflictType.OBJECT_CONFLICT: [
                ResolutionStrategy.KEEP_SOURCE,
                ResolutionStrategy.KEEP_TARGET,
                ResolutionStrategy.MERGE_OBJECTS,
                ResolutionStrategy.CUSTOM_VALUE,
                ResolutionStrategy.MANUAL
            ],
            ConflictType.DELETION_CONFLICT: [
                ResolutionStrategy.KEEP_SOURCE,
                ResolutionStrategy.KEEP_TARGET,
                ResolutionStrategy.MANUAL
            ],
            ConflictType.CRITICAL_FIELD: [
                ResolutionStrategy.MANUAL
            ]
        }
        
        # Define critical fields that require manual resolution
        self.critical_fields = {
            'id', 'name', 'version', 'primary_key', 'unique_identifier'
        }
    
    def analyze_conflicts(
        self,
        conflicts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze conflicts and provide resolution recommendations"""
        
        analysis = {
            "total_conflicts": len(conflicts),
            "conflict_types": {},
            "critical_conflicts": [],
            "auto_resolvable": [],
            "requires_manual": [],
            "recommendations": []
        }
        
        for conflict in conflicts:
            conflict_type = self._classify_conflict(conflict)
            conflict["conflict_type"] = conflict_type.value
            
            # Count conflict types
            if conflict_type.value not in analysis["conflict_types"]:
                analysis["conflict_types"][conflict_type.value] = 0
            analysis["conflict_types"][conflict_type.value] += 1
            
            # Categorize conflicts
            if conflict_type == ConflictType.CRITICAL_FIELD:
                analysis["critical_conflicts"].append(conflict)
                analysis["requires_manual"].append(conflict)
            elif self._is_auto_resolvable(conflict, conflict_type):
                analysis["auto_resolvable"].append(conflict)
                # Add auto-resolution recommendation
                recommendation = self._get_auto_resolution_recommendation(conflict, conflict_type)
                if recommendation:
                    analysis["recommendations"].append(recommendation)
            else:
                analysis["requires_manual"].append(conflict)
        
        return analysis
    
    def suggest_resolutions(
        self,
        conflict: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Suggest resolution options for a specific conflict"""
        
        conflict_type = ConflictType(conflict.get("conflict_type", "value_conflict"))
        available_strategies = self.resolution_strategies.get(
            conflict_type, [ResolutionStrategy.MANUAL]
        )
        
        suggestions = []
        
        for strategy in available_strategies:
            suggestion = self._create_resolution_suggestion(conflict, strategy)
            if suggestion:
                suggestions.append(suggestion)
        
        return suggestions
    
    def apply_resolution(
        self,
        conflict: Dict[str, Any],
        resolution_strategy: ResolutionStrategy,
        custom_value: Any = None
    ) -> Tuple[bool, Any, str]:
        """Apply a resolution strategy to a conflict"""
        
        try:
            if resolution_strategy == ResolutionStrategy.KEEP_SOURCE:
                return True, conflict["source_value"], "Kept source value"
            
            elif resolution_strategy == ResolutionStrategy.KEEP_TARGET:
                return True, conflict["target_value"], "Kept target value"
            
            elif resolution_strategy == ResolutionStrategy.CUSTOM_VALUE:
                if custom_value is None:
                    return False, None, "Custom value required but not provided"
                return True, custom_value, "Applied custom value"
            
            elif resolution_strategy == ResolutionStrategy.MERGE_ARRAYS:
                return self._merge_arrays(conflict)
            
            elif resolution_strategy == ResolutionStrategy.MERGE_OBJECTS:
                return self._merge_objects(conflict)
            
            elif resolution_strategy == ResolutionStrategy.MANUAL:
                return False, None, "Manual resolution required"
            
            else:
                return False, None, f"Unknown resolution strategy: {resolution_strategy}"
        
        except Exception as e:
            return False, None, f"Error applying resolution: {str(e)}"
    
    def resolve_conflicts_batch(
        self,
        conflicts: List[Dict[str, Any]],
        resolutions: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Resolve multiple conflicts in batch"""
        
        resolved = []
        failed = []
        
        # Create resolution lookup
        resolution_map = {
            res["conflict_path"]: res for res in resolutions
        }
        
        for conflict in conflicts:
            path = conflict["path"]
            
            if path in resolution_map:
                resolution = resolution_map[path]
                strategy = ResolutionStrategy(resolution["strategy"])
                custom_value = resolution.get("custom_value")
                
                success, resolved_value, message = self.apply_resolution(
                    conflict, strategy, custom_value
                )
                
                if success:
                    resolved.append({
                        "path": path,
                        "resolved_value": resolved_value,
                        "strategy": strategy.value,
                        "message": message
                    })
                else:
                    failed.append({
                        "path": path,
                        "conflict": conflict,
                        "error": message
                    })
            else:
                failed.append({
                    "path": path,
                    "conflict": conflict,
                    "error": "No resolution provided"
                })
        
        return resolved, failed
    
    def create_conflict_resolution_record(
        self,
        merge_request_id: str,
        conflict_path: str,
        resolution_strategy: ResolutionStrategy,
        resolved_value: Any,
        resolution_reason: str = "",
        user_id: str = None
    ) -> ConflictResolution:
        """Create a record of conflict resolution for audit purposes"""
        
        return ConflictResolution(
            merge_request_id=merge_request_id,
            conflict_path=conflict_path,
            resolution_type=resolution_strategy.value,
            resolved_value=json.dumps(resolved_value) if resolved_value is not None else None,
            resolution_reason=resolution_reason,
            resolved_by=user_id,
            resolved_at=datetime.utcnow()
        )
    
    def get_resolution_templates(self) -> Dict[str, Any]:
        """Get predefined resolution templates for common conflicts"""
        
        return {
            "array_merge_unique": {
                "name": "Merge Arrays (Remove Duplicates)",
                "description": "Combine arrays from both versions and remove duplicates",
                "strategy": ResolutionStrategy.MERGE_ARRAYS.value,
                "parameters": {"remove_duplicates": True}
            },
            "array_merge_preserve": {
                "name": "Merge Arrays (Preserve All)",
                "description": "Combine arrays from both versions preserving all items",
                "strategy": ResolutionStrategy.MERGE_ARRAYS.value,
                "parameters": {"remove_duplicates": False}
            },
            "object_deep_merge": {
                "name": "Deep Merge Objects",
                "description": "Recursively merge object properties",
                "strategy": ResolutionStrategy.MERGE_OBJECTS.value,
                "parameters": {"deep_merge": True}
            },
            "prefer_newer": {
                "name": "Prefer Newer Value",
                "description": "Keep the value from the more recent version",
                "strategy": "prefer_newer",
                "parameters": {}
            },
            "prefer_non_empty": {
                "name": "Prefer Non-Empty Value",
                "description": "Keep the value that is not empty or null",
                "strategy": "prefer_non_empty",
                "parameters": {}
            }
        }
    
    def _classify_conflict(self, conflict: Dict[str, Any]) -> ConflictType:
        """Classify the type of conflict"""
        
        path = conflict["path"]
        source_value = conflict["source_value"]
        target_value = conflict["target_value"]
        
        # Check for critical fields
        if any(critical_field in path.lower() for critical_field in self.critical_fields):
            return ConflictType.CRITICAL_FIELD
        
        # Check for type mismatches
        if type(source_value) != type(target_value):
            return ConflictType.TYPE_MISMATCH
        
        # Check for deletion conflicts
        if source_value is None or target_value is None:
            return ConflictType.DELETION_CONFLICT
        
        # Check for array conflicts
        if isinstance(source_value, list) and isinstance(target_value, list):
            return ConflictType.ARRAY_CONFLICT
        
        # Check for object conflicts
        if isinstance(source_value, dict) and isinstance(target_value, dict):
            return ConflictType.OBJECT_CONFLICT
        
        # Default to value conflict
        return ConflictType.VALUE_CONFLICT
    
    def _is_auto_resolvable(
        self,
        conflict: Dict[str, Any],
        conflict_type: ConflictType
    ) -> bool:
        """Determine if conflict can be automatically resolved"""
        
        # Never auto-resolve critical fields
        if conflict_type == ConflictType.CRITICAL_FIELD:
            return False
        
        source_value = conflict["source_value"]
        target_value = conflict["target_value"]
        
        # Auto-resolve if one value is empty/None
        if not source_value and target_value:
            return True
        if not target_value and source_value:
            return True
        
        # Auto-resolve simple array merges
        if conflict_type == ConflictType.ARRAY_CONFLICT:
            if isinstance(source_value, list) and isinstance(target_value, list):
                # Auto-resolve if one is subset of other
                try:
                    if (set(source_value).issubset(set(target_value)) or 
                        set(target_value).issubset(set(source_value))):
                        return True
                except TypeError:
                    # Values not hashable, can't use set operations
                    pass
        
        return False
    
    def _get_auto_resolution_recommendation(
        self,
        conflict: Dict[str, Any],
        conflict_type: ConflictType
    ) -> Optional[Dict[str, Any]]:
        """Get automatic resolution recommendation for a conflict"""
        
        source_value = conflict["source_value"]
        target_value = conflict["target_value"]
        
        # Prefer non-empty values
        if not source_value and target_value:
            return {
                "path": conflict["path"],
                "strategy": ResolutionStrategy.KEEP_TARGET.value,
                "reason": "Target value is non-empty, source is empty",
                "confidence": 0.9
            }
        
        if not target_value and source_value:
            return {
                "path": conflict["path"],
                "strategy": ResolutionStrategy.KEEP_SOURCE.value,
                "reason": "Source value is non-empty, target is empty",
                "confidence": 0.9
            }
        
        # Array merge recommendations
        if conflict_type == ConflictType.ARRAY_CONFLICT:
            try:
                source_set = set(source_value)
                target_set = set(target_value)
                
                if source_set.issubset(target_set):
                    return {
                        "path": conflict["path"],
                        "strategy": ResolutionStrategy.KEEP_TARGET.value,
                        "reason": "Source array is subset of target",
                        "confidence": 0.8
                    }
                
                if target_set.issubset(source_set):
                    return {
                        "path": conflict["path"],
                        "strategy": ResolutionStrategy.KEEP_SOURCE.value,
                        "reason": "Target array is subset of source",
                        "confidence": 0.8
                    }
                
                # Recommend merge if arrays have some overlap
                if source_set & target_set:
                    return {
                        "path": conflict["path"],
                        "strategy": ResolutionStrategy.MERGE_ARRAYS.value,
                        "reason": "Arrays have overlapping elements",
                        "confidence": 0.7
                    }
            
            except TypeError:
                # Can't use set operations, recommend manual resolution
                pass
        
        return None
    
    def _create_resolution_suggestion(
        self,
        conflict: Dict[str, Any],
        strategy: ResolutionStrategy
    ) -> Optional[Dict[str, Any]]:
        """Create a resolution suggestion for a strategy"""
        
        suggestion = {
            "strategy": strategy.value,
            "applicable": True,
            "description": "",
            "preview_value": None,
            "confidence": 0.5
        }
        
        source_value = conflict["source_value"]
        target_value = conflict["target_value"]
        
        if strategy == ResolutionStrategy.KEEP_SOURCE:
            suggestion["description"] = f"Keep source value: {source_value}"
            suggestion["preview_value"] = source_value
            suggestion["confidence"] = 0.5
        
        elif strategy == ResolutionStrategy.KEEP_TARGET:
            suggestion["description"] = f"Keep target value: {target_value}"
            suggestion["preview_value"] = target_value
            suggestion["confidence"] = 0.5
        
        elif strategy == ResolutionStrategy.MERGE_ARRAYS:
            if isinstance(source_value, list) and isinstance(target_value, list):
                merged = self._preview_array_merge(source_value, target_value)
                suggestion["description"] = f"Merge arrays: {len(merged)} total items"
                suggestion["preview_value"] = merged
                suggestion["confidence"] = 0.7
            else:
                suggestion["applicable"] = False
        
        elif strategy == ResolutionStrategy.MERGE_OBJECTS:
            if isinstance(source_value, dict) and isinstance(target_value, dict):
                merged = self._preview_object_merge(source_value, target_value)
                suggestion["description"] = f"Merge objects: {len(merged)} total keys"
                suggestion["preview_value"] = merged
                suggestion["confidence"] = 0.7
            else:
                suggestion["applicable"] = False
        
        elif strategy == ResolutionStrategy.CUSTOM_VALUE:
            suggestion["description"] = "Provide custom value"
            suggestion["preview_value"] = None
            suggestion["confidence"] = 1.0
        
        elif strategy == ResolutionStrategy.MANUAL:
            suggestion["description"] = "Manual resolution required"
            suggestion["preview_value"] = None
            suggestion["confidence"] = 1.0
        
        return suggestion if suggestion["applicable"] else None
    
    def _merge_arrays(self, conflict: Dict[str, Any]) -> Tuple[bool, Any, str]:
        """Merge two arrays"""
        
        source_value = conflict["source_value"]
        target_value = conflict["target_value"]
        
        if not isinstance(source_value, list) or not isinstance(target_value, list):
            return False, None, "Values are not arrays"
        
        try:
            # Combine arrays and remove duplicates while preserving order
            merged = []
            seen = set()
            
            for item in source_value + target_value:
                # Handle unhashable types
                try:
                    if item not in seen:
                        merged.append(item)
                        seen.add(item)
                except TypeError:
                    # Item is unhashable, just append
                    if item not in merged:
                        merged.append(item)
            
            return True, merged, f"Merged arrays: {len(merged)} total items"
        
        except Exception as e:
            return False, None, f"Error merging arrays: {str(e)}"
    
    def _merge_objects(self, conflict: Dict[str, Any]) -> Tuple[bool, Any, str]:
        """Merge two objects"""
        
        source_value = conflict["source_value"]
        target_value = conflict["target_value"]
        
        if not isinstance(source_value, dict) or not isinstance(target_value, dict):
            return False, None, "Values are not objects"
        
        try:
            # Deep merge objects
            merged = self._deep_merge(source_value, target_value)
            return True, merged, f"Merged objects: {len(merged)} total keys"
        
        except Exception as e:
            return False, None, f"Error merging objects: {str(e)}"
    
    def _preview_array_merge(self, source: List[Any], target: List[Any]) -> List[Any]:
        """Preview what array merge would produce"""
        
        merged = []
        seen = set()
        
        for item in source + target:
            try:
                if item not in seen:
                    merged.append(item)
                    seen.add(item)
            except TypeError:
                if item not in merged:
                    merged.append(item)
        
        return merged
    
    def _preview_object_merge(self, source: Dict[str, Any], target: Dict[str, Any]) -> Dict[str, Any]:
        """Preview what object merge would produce"""
        
        return self._deep_merge(source, target)
    
    def _deep_merge(self, source: Dict[str, Any], target: Dict[str, Any]) -> Dict[str, Any]:
        """Perform deep merge of two dictionaries"""
        
        result = source.copy()
        
        for key, value in target.items():
            if key in result:
                if isinstance(result[key], dict) and isinstance(value, dict):
                    result[key] = self._deep_merge(result[key], value)
                elif isinstance(result[key], list) and isinstance(value, list):
                    # Merge lists
                    result[key] = self._preview_array_merge(result[key], value)
                else:
                    # Target value overwrites source
                    result[key] = value
            else:
                result[key] = value
        
        return result