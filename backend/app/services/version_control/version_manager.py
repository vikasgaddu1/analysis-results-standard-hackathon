"""Main Version Control Manager

Coordinates all version control operations for analysis metadata.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
from uuid import uuid4
import json

from sqlalchemy.orm import Session
from app.models.version_control import Version, Branch, Commit, ChangeLog
from app.models.ars import ReportingEvent
from .diff_engine import DiffEngine
from .merge_engine import MergeEngine
from .branch_manager import BranchManager
from .history_tracker import HistoryTracker


class VersionManager:
    """Main version control manager for analysis metadata"""
    
    def __init__(self, db: Session):
        self.db = db
        self.diff_engine = DiffEngine()
        self.merge_engine = MergeEngine()
        self.branch_manager = BranchManager(db)
        self.history_tracker = HistoryTracker(db)
    
    def create_version(
        self,
        reporting_event_id: str,
        version_name: str,
        description: str = "",
        user_id: str = None,
        branch_name: str = "main"
    ) -> Version:
        """Create a new version of an analysis"""
        
        # Get the current state of the reporting event
        reporting_event = self.db.query(ReportingEvent).filter(
            ReportingEvent.id == reporting_event_id
        ).first()
        
        if not reporting_event:
            raise ValueError(f"ReportingEvent {reporting_event_id} not found")
        
        # Get or create branch
        branch = self.branch_manager.get_or_create_branch(
            reporting_event_id, branch_name, user_id
        )
        
        # Create version snapshot
        version_data = self._serialize_reporting_event(reporting_event)
        
        version = Version(
            id=str(uuid4()),
            reporting_event_id=reporting_event_id,
            branch_id=branch.id,
            version_name=version_name,
            description=description,
            version_data=version_data,
            created_by=user_id,
            created_at=datetime.utcnow(),
            is_current=True
        )
        
        # Mark previous version as not current
        self.db.query(Version).filter(
            Version.reporting_event_id == reporting_event_id,
            Version.branch_id == branch.id,
            Version.is_current == True
        ).update({"is_current": False})
        
        self.db.add(version)
        self.db.commit()
        
        # Track the version creation
        self.history_tracker.track_version_creation(version)
        
        return version
    
    def get_version_history(
        self,
        reporting_event_id: str,
        branch_name: str = None,
        limit: int = 50
    ) -> List[Version]:
        """Get version history for an analysis"""
        
        query = self.db.query(Version).filter(
            Version.reporting_event_id == reporting_event_id
        )
        
        if branch_name:
            branch = self.branch_manager.get_branch(reporting_event_id, branch_name)
            if branch:
                query = query.filter(Version.branch_id == branch.id)
        
        return query.order_by(Version.created_at.desc()).limit(limit).all()
    
    def compare_versions(
        self,
        version_id_1: str,
        version_id_2: str
    ) -> Dict[str, Any]:
        """Compare two versions and return differences"""
        
        version1 = self.db.query(Version).filter(Version.id == version_id_1).first()
        version2 = self.db.query(Version).filter(Version.id == version_id_2).first()
        
        if not version1 or not version2:
            raise ValueError("One or both versions not found")
        
        return self.diff_engine.compare_versions(version1, version2)
    
    def restore_version(
        self,
        version_id: str,
        user_id: str = None,
        create_backup: bool = True
    ) -> ReportingEvent:
        """Restore a specific version as the current state"""
        
        version = self.db.query(Version).filter(Version.id == version_id).first()
        if not version:
            raise ValueError(f"Version {version_id} not found")
        
        # Create backup of current state if requested
        if create_backup:
            self.create_version(
                version.reporting_event_id,
                f"Backup before restore to {version.version_name}",
                f"Automatic backup created before restoring version {version_id}",
                user_id
            )
        
        # Restore the version data to the reporting event
        reporting_event = self.db.query(ReportingEvent).filter(
            ReportingEvent.id == version.reporting_event_id
        ).first()
        
        if not reporting_event:
            raise ValueError(f"ReportingEvent {version.reporting_event_id} not found")
        
        self._deserialize_to_reporting_event(version.version_data, reporting_event)
        self.db.commit()
        
        # Track the restoration
        self.history_tracker.track_version_restoration(version, user_id)
        
        return reporting_event
    
    def create_branch_from_version(
        self,
        version_id: str,
        new_branch_name: str,
        user_id: str = None
    ) -> Branch:
        """Create a new branch from a specific version"""
        
        version = self.db.query(Version).filter(Version.id == version_id).first()
        if not version:
            raise ValueError(f"Version {version_id} not found")
        
        # Create new branch
        new_branch = self.branch_manager.create_branch(
            version.reporting_event_id,
            new_branch_name,
            user_id,
            source_version_id=version_id
        )
        
        # Create initial version in new branch
        self.create_version(
            version.reporting_event_id,
            f"Branched from {version.version_name}",
            f"Created branch {new_branch_name} from version {version.version_name}",
            user_id,
            new_branch_name
        )
        
        return new_branch
    
    def get_version_by_id(self, version_id: str) -> Optional[Version]:
        """Get a specific version by ID"""
        return self.db.query(Version).filter(Version.id == version_id).first()
    
    def get_current_version(
        self,
        reporting_event_id: str,
        branch_name: str = "main"
    ) -> Optional[Version]:
        """Get the current version for a branch"""
        
        branch = self.branch_manager.get_branch(reporting_event_id, branch_name)
        if not branch:
            return None
        
        return self.db.query(Version).filter(
            Version.reporting_event_id == reporting_event_id,
            Version.branch_id == branch.id,
            Version.is_current == True
        ).first()
    
    def delete_version(self, version_id: str, user_id: str = None) -> bool:
        """Delete a version (soft delete with tracking)"""
        
        version = self.db.query(Version).filter(Version.id == version_id).first()
        if not version:
            return False
        
        # Don't allow deletion of current versions
        if version.is_current:
            raise ValueError("Cannot delete current version")
        
        # Track deletion before removing
        self.history_tracker.track_version_deletion(version, user_id)
        
        # Soft delete
        version.deleted_at = datetime.utcnow()
        version.deleted_by = user_id
        self.db.commit()
        
        return True
    
    def _serialize_reporting_event(self, reporting_event: ReportingEvent) -> Dict[str, Any]:
        """Serialize a ReportingEvent to JSON-serializable format"""
        
        # This is a simplified serialization - in practice, you'd want
        # a more comprehensive approach that handles all relationships
        return {
            "id": reporting_event.id,
            "name": reporting_event.name,
            "description": reporting_event.description,
            "version": reporting_event.version,
            "main_list_of_contents": self._serialize_list_of_contents(reporting_event.main_list_of_contents),
            "other_lists_of_contents": [
                self._serialize_list_of_contents(loc) for loc in reporting_event.other_lists_of_contents or []
            ],
            "reference_documents": [
                self._serialize_reference_document(doc) for doc in reporting_event.reference_documents or []
            ],
            "terminology_extensions": [
                self._serialize_terminology_extension(ext) for ext in reporting_event.terminology_extensions or []
            ],
            "analyses": [
                self._serialize_analysis(analysis) for analysis in reporting_event.analyses or []
            ],
            "analysis_sets": [
                self._serialize_analysis_set(analysis_set) for analysis_set in reporting_event.analysis_sets or []
            ],
            "data_subsets": [
                self._serialize_data_subset(subset) for subset in reporting_event.data_subsets or []
            ],
            "outputs": [
                self._serialize_output(output) for output in reporting_event.outputs or []
            ],
            "methods": [
                self._serialize_method(method) for method in reporting_event.methods or []
            ]
        }
    
    def _deserialize_to_reporting_event(
        self,
        version_data: Dict[str, Any],
        reporting_event: ReportingEvent
    ):
        """Deserialize version data back to a ReportingEvent"""
        
        # Update basic fields
        reporting_event.name = version_data.get("name")
        reporting_event.description = version_data.get("description")
        reporting_event.version = version_data.get("version")
        
        # Note: In a full implementation, you would need to handle
        # the restoration of all related objects (analyses, outputs, etc.)
        # This would involve creating/updating/deleting child objects
        # to match the version snapshot
    
    def _serialize_list_of_contents(self, loc):
        """Serialize ListOfContents object"""
        if not loc:
            return None
        
        return {
            "id": loc.id,
            "name": loc.name,
            "contents_list": [
                self._serialize_nested_list(item) for item in loc.contents_list or []
            ]
        }
    
    def _serialize_nested_list(self, item):
        """Serialize NestedList item"""
        if not item:
            return None
        
        return {
            "id": item.id,
            "name": item.name,
            "label": item.label,
            "level": item.level,
            "order": item.order,
            "sublist": [
                self._serialize_nested_list(subitem) for subitem in item.sublist or []
            ],
            "list_items": [
                self._serialize_list_item(list_item) for list_item in item.list_items or []
            ]
        }
    
    def _serialize_list_item(self, item):
        """Serialize OrderedListItem"""
        if not item:
            return None
        
        return {
            "id": item.id,
            "name": item.name,
            "label": item.label,
            "level": item.level,
            "order": item.order
        }
    
    def _serialize_reference_document(self, doc):
        """Serialize ReferenceDocument"""
        if not doc:
            return None
        
        return {
            "id": doc.id,
            "name": doc.name,
            "description": doc.description,
            "location": doc.location
        }
    
    def _serialize_terminology_extension(self, ext):
        """Serialize TerminologyExtension"""
        if not ext:
            return None
        
        return {
            "id": ext.id,
            "enumeration": ext.enumeration,
            "sponsor_terms": [
                self._serialize_sponsor_term(term) for term in ext.sponsor_terms or []
            ]
        }
    
    def _serialize_sponsor_term(self, term):
        """Serialize SponsorTerm"""
        if not term:
            return None
        
        return {
            "id": term.id,
            "controlled_term": term.controlled_term,
            "submission_value": term.submission_value
        }
    
    def _serialize_analysis(self, analysis):
        """Serialize Analysis"""
        if not analysis:
            return None
        
        return {
            "id": analysis.id,
            "name": analysis.name,
            "description": analysis.description,
            "version": analysis.version,
            "reason": self._serialize_analysis_reason(analysis.reason),
            "purpose": self._serialize_analysis_purpose(analysis.purpose),
            "category_ids": analysis.category_ids,
            "dataset": analysis.dataset,
            "variable": analysis.variable,
            "method_id": analysis.method_id,
            "referenced_analysis_operations": [
                self._serialize_referenced_operation(op) for op in analysis.referenced_analysis_operations or []
            ],
            "analysis_set_id": analysis.analysis_set_id,
            "ordered_groupings": [
                self._serialize_ordered_grouping(grouping) for grouping in analysis.ordered_groupings or []
            ],
            "where_clauses": [
                self._serialize_where_clause(clause) for clause in analysis.where_clauses or []
            ]
        }
    
    def _serialize_analysis_reason(self, reason):
        """Serialize AnalysisReason"""
        if not reason:
            return None
        
        return {
            "controlled_term": reason.controlled_term,
            "submission_value": reason.submission_value
        }
    
    def _serialize_analysis_purpose(self, purpose):
        """Serialize AnalysisPurpose"""
        if not purpose:
            return None
        
        return {
            "controlled_term": purpose.controlled_term,
            "submission_value": purpose.submission_value
        }
    
    def _serialize_referenced_operation(self, op):
        """Serialize ReferencedAnalysisOperation"""
        if not op:
            return None
        
        return {
            "id": op.id,
            "referenced_operation_relationship_id": op.referenced_operation_relationship_id,
            "referenced_operation_role": self._serialize_operation_role(op.referenced_operation_role),
            "analysis_id": op.analysis_id
        }
    
    def _serialize_operation_role(self, role):
        """Serialize OperationRole"""
        if not role:
            return None
        
        return {
            "controlled_term": role.controlled_term,
            "submission_value": role.submission_value
        }
    
    def _serialize_ordered_grouping(self, grouping):
        """Serialize OrderedGroupingFactor"""
        if not grouping:
            return None
        
        return {
            "id": grouping.id,
            "order": grouping.order,
            "grouping_id": grouping.grouping_id,
            "result_groups": [
                self._serialize_result_group(group) for group in grouping.result_groups or []
            ]
        }
    
    def _serialize_result_group(self, group):
        """Serialize ResultGroup"""
        if not group:
            return None
        
        return {
            "id": group.id,
            "group_id": group.group_id,
            "group_value": group.group_value
        }
    
    def _serialize_where_clause(self, clause):
        """Serialize WhereClause"""
        if not clause:
            return None
        
        return {
            "id": clause.id,
            "dataset": clause.dataset,
            "variable": clause.variable,
            "condition": self._serialize_condition(clause.condition),
            "compound_expression": self._serialize_compound_expression(clause.compound_expression)
        }
    
    def _serialize_condition(self, condition):
        """Serialize WhereClauseCondition"""
        if not condition:
            return None
        
        return {
            "id": condition.id,
            "dataset": condition.dataset,
            "variable": condition.variable,
            "comparator": condition.comparator,
            "value": condition.value
        }
    
    def _serialize_compound_expression(self, expression):
        """Serialize WhereClauseCompoundExpression"""
        if not expression:
            return None
        
        return {
            "id": expression.id,
            "logical_operator": expression.logical_operator,
            "where_clauses": [
                self._serialize_where_clause(clause) for clause in expression.where_clauses or []
            ]
        }
    
    def _serialize_analysis_set(self, analysis_set):
        """Serialize AnalysisSet"""
        if not analysis_set:
            return None
        
        return {
            "id": analysis_set.id,
            "name": analysis_set.name,
            "description": analysis_set.description,
            "label": analysis_set.label,
            "level": analysis_set.level,
            "order": analysis_set.order,
            "compound_expression": self._serialize_compound_set_expression(analysis_set.compound_expression)
        }
    
    def _serialize_compound_set_expression(self, expression):
        """Serialize CompoundSetExpression"""
        if not expression:
            return None
        
        return {
            "id": expression.id,
            "logical_operator": expression.logical_operator,
            "where_clauses": [
                self._serialize_where_clause(clause) for clause in expression.where_clauses or []
            ]
        }
    
    def _serialize_data_subset(self, subset):
        """Serialize DataSubset"""
        if not subset:
            return None
        
        return {
            "id": subset.id,
            "name": subset.name,
            "description": subset.description,
            "label": subset.label,
            "level": subset.level,
            "order": subset.order,
            "compound_expression": self._serialize_compound_subset_expression(subset.compound_expression)
        }
    
    def _serialize_compound_subset_expression(self, expression):
        """Serialize CompoundSubsetExpression"""
        if not expression:
            return None
        
        return {
            "id": expression.id,
            "logical_operator": expression.logical_operator,
            "where_clauses": [
                self._serialize_where_clause(clause) for clause in expression.where_clauses or []
            ]
        }
    
    def _serialize_output(self, output):
        """Serialize Output"""
        if not output:
            return None
        
        return {
            "id": output.id,
            "name": output.name,
            "description": output.description,
            "version": output.version,
            "file_specifications": [
                self._serialize_file_spec(spec) for spec in output.file_specifications or []
            ],
            "displays": [
                self._serialize_display(display) for display in output.displays or []
            ]
        }
    
    def _serialize_file_spec(self, spec):
        """Serialize OutputFile"""
        if not spec:
            return None
        
        return {
            "id": spec.id,
            "name": spec.name,
            "description": spec.description,
            "file_type": self._serialize_file_type(spec.file_type)
        }
    
    def _serialize_file_type(self, file_type):
        """Serialize OutputFileType"""
        if not file_type:
            return None
        
        return {
            "controlled_term": file_type.controlled_term,
            "submission_value": file_type.submission_value
        }
    
    def _serialize_display(self, display):
        """Serialize OutputDisplay"""
        if not display:
            return None
        
        return {
            "id": display.id,
            "name": display.name,
            "description": display.description,
            "version": display.version,
            "display_title": display.display_title,
            "display_sections": [
                self._serialize_display_section(section) for section in display.display_sections or []
            ]
        }
    
    def _serialize_display_section(self, section):
        """Serialize DisplaySection"""
        if not section:
            return None
        
        return {
            "id": section.id,
            "section_type": section.section_type,
            "ordered_sub_sections": [
                self._serialize_ordered_subsection(subsection) for subsection in section.ordered_sub_sections or []
            ]
        }
    
    def _serialize_ordered_subsection(self, subsection):
        """Serialize OrderedSubSection"""
        if not subsection:
            return None
        
        return {
            "id": subsection.id,
            "order": subsection.order,
            "sub_section": self._serialize_subsection(subsection.sub_section)
        }
    
    def _serialize_subsection(self, subsection):
        """Serialize DisplaySubSection"""
        if not subsection:
            return None
        
        return {
            "id": subsection.id,
            "text": subsection.text
        }
    
    def _serialize_method(self, method):
        """Serialize AnalysisMethod"""
        if not method:
            return None
        
        return {
            "id": method.id,
            "name": method.name,
            "description": method.description,
            "label": method.label,
            "operations": [
                self._serialize_operation(op) for op in method.operations or []
            ],
            "code_template": self._serialize_code_template(method.code_template)
        }
    
    def _serialize_operation(self, operation):
        """Serialize Operation"""
        if not operation:
            return None
        
        return {
            "id": operation.id,
            "name": operation.name,
            "description": operation.description,
            "label": operation.label,
            "order": operation.order,
            "result_pattern": operation.result_pattern
        }
    
    def _serialize_code_template(self, template):
        """Serialize AnalysisProgrammingCodeTemplate"""
        if not template:
            return None
        
        return {
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "label": template.label,
            "context": template.context,
            "code": template.code,
            "parameters": [
                self._serialize_template_parameter(param) for param in template.parameters or []
            ]
        }
    
    def _serialize_template_parameter(self, param):
        """Serialize TemplateCodeParameter"""
        if not param:
            return None
        
        return {
            "id": param.id,
            "name": param.name,
            "description": param.description,
            "value_source": param.value_source
        }