"""Version Control Services Package

This package provides comprehensive version control functionality for analysis metadata,
including branching, merging, conflict resolution, and change tracking.
"""

from .version_manager import VersionManager
from .diff_engine import DiffEngine
from .merge_engine import MergeEngine
from .branch_manager import BranchManager
from .conflict_resolver import ConflictResolver
from .history_tracker import HistoryTracker

__all__ = [
    "VersionManager",
    "DiffEngine", 
    "MergeEngine",
    "BranchManager",
    "ConflictResolver",
    "HistoryTracker"
]