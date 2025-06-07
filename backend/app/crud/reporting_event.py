"""
CRUD operations for ReportingEvent model
"""

from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func

from app.crud.base import CRUDBase
from app.models.ars import (
    ReportingEvent, ReferenceDocument, TerminologyExtension, SponsorTerm,
    AnalysisSet, DataSubset, AnalysisGrouping, Group, AnalysisMethod,
    Analysis, Output, GlobalDisplaySection, ListOfContents,
    AnalysisOutputCategorization, WhereClause
)
from app.schemas.ars import ReportingEventCreate, ReportingEventUpdate


class CRUDReportingEvent(CRUDBase[ReportingEvent, ReportingEventCreate, ReportingEventUpdate]):
    """CRUD operations for ReportingEvent model"""
    
    def get_with_relationships(self, db: Session, *, id: str) -> Optional[ReportingEvent]:
        """
        Get reporting event with all relationships loaded.
        
        Args:
            db: Database session
            id: ReportingEvent ID
            
        Returns:
            ReportingEvent with all relationships or None
        """
        return db.query(ReportingEvent).options(
            joinedload(ReportingEvent.reference_documents),
            joinedload(ReportingEvent.terminology_extensions).joinedload(TerminologyExtension.sponsor_terms),
            joinedload(ReportingEvent.analysis_sets),
            joinedload(ReportingEvent.data_subsets),
            joinedload(ReportingEvent.analysis_groupings).joinedload(AnalysisGrouping.groups),
            joinedload(ReportingEvent.methods),
            joinedload(ReportingEvent.analyses),
            joinedload(ReportingEvent.outputs),
            joinedload(ReportingEvent.global_display_sections),
            joinedload(ReportingEvent.lists_of_contents),
            joinedload(ReportingEvent.categorizations)
        ).filter(ReportingEvent.id == id).first()

    def get_by_user(
        self, 
        db: Session, 
        *, 
        user_id: UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[ReportingEvent]:
        """
        Get reporting events created by a specific user.
        
        Args:
            db: Database session
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of reporting events
        """
        return db.query(ReportingEvent).filter(
            ReportingEvent.created_by == user_id
        ).offset(skip).limit(limit).all()

    def get_children(self, db: Session, *, parent_id: str) -> List[ReportingEvent]:
        """
        Get child reporting events.
        
        Args:
            db: Database session
            parent_id: Parent ReportingEvent ID
            
        Returns:
            List of child reporting events
        """
        return db.query(ReportingEvent).filter(
            ReportingEvent.parent_id == parent_id
        ).all()

    def get_versions(self, db: Session, *, base_id: str) -> List[ReportingEvent]:
        """
        Get all versions of a reporting event (parent and children).
        
        Args:
            db: Database session
            base_id: Base ReportingEvent ID
            
        Returns:
            List of reporting event versions
        """
        # Get the base event and all its children
        base_event = self.get(db, id=base_id)
        if not base_event:
            return []
        
        # If this is a child, get the parent first
        if base_event.parent_id:
            base_id = base_event.parent_id
        
        from sqlalchemy import or_
        versions = db.query(ReportingEvent).filter(
            or_(
                ReportingEvent.id == base_id,
                ReportingEvent.parent_id == base_id
            )
        ).order_by(ReportingEvent.created_at).all()
        
        return versions

    def lock(self, db: Session, *, id: str) -> Optional[ReportingEvent]:
        """
        Lock a reporting event to prevent modifications.
        
        Args:
            db: Database session
            id: ReportingEvent ID
            
        Returns:
            Updated reporting event or None if not found
        """
        db_obj = self.get(db, id=id)
        if db_obj:
            db_obj.is_locked = True
            db.commit()
            db.refresh(db_obj)
        return db_obj

    def unlock(self, db: Session, *, id: str) -> Optional[ReportingEvent]:
        """
        Unlock a reporting event to allow modifications.
        
        Args:
            db: Database session
            id: ReportingEvent ID
            
        Returns:
            Updated reporting event or None if not found
        """
        db_obj = self.get(db, id=id)
        if db_obj:
            db_obj.is_locked = False
            db.commit()
            db.refresh(db_obj)
        return db_obj

    def clone(
        self, 
        db: Session, 
        *, 
        id: str, 
        new_id: str, 
        new_name: str,
        user_id: UUID
    ) -> ReportingEvent:
        """
        Clone a reporting event with all its relationships.
        
        Args:
            db: Database session
            id: Source ReportingEvent ID
            new_id: New ReportingEvent ID
            new_name: New name for the cloned event
            user_id: ID of user creating the clone
            
        Returns:
            Cloned reporting event
        """
        source = self.get_with_relationships(db, id=id)
        if not source:
            raise ValueError(f"ReportingEvent {id} not found")
        
        # Create the new reporting event
        new_event = ReportingEvent(
            id=new_id,
            name=new_name,
            description=source.description,
            label=source.label,
            version=source.version,
            created_by=user_id,
            parent_id=source.id  # Set as child of original
        )
        
        db.add(new_event)
        db.flush()  # Get the ID without committing
        
        # Clone all relationships
        self._clone_reference_documents(db, source, new_event)
        self._clone_terminology_extensions(db, source, new_event)
        self._clone_analysis_sets(db, source, new_event)
        self._clone_data_subsets(db, source, new_event)
        self._clone_analysis_groupings(db, source, new_event)
        self._clone_methods(db, source, new_event)
        self._clone_analyses(db, source, new_event)
        self._clone_outputs(db, source, new_event)
        self._clone_global_display_sections(db, source, new_event)
        self._clone_lists_of_contents(db, source, new_event)
        self._clone_categorizations(db, source, new_event)
        
        db.commit()
        db.refresh(new_event)
        return new_event

    def _clone_reference_documents(self, db: Session, source: ReportingEvent, target: ReportingEvent):
        """Clone reference documents"""
        for doc in source.reference_documents:
            new_doc = ReferenceDocument(
                id=f"{target.id}_{doc.id}",
                reporting_event_id=target.id,
                name=doc.name,
                description=doc.description,
                label=doc.label,
                location=doc.location
            )
            db.add(new_doc)

    def _clone_terminology_extensions(self, db: Session, source: ReportingEvent, target: ReportingEvent):
        """Clone terminology extensions and sponsor terms"""
        for ext in source.terminology_extensions:
            new_ext = TerminologyExtension(
                id=f"{target.id}_{ext.id}",
                reporting_event_id=target.id,
                enumeration=ext.enumeration
            )
            db.add(new_ext)
            db.flush()
            
            for term in ext.sponsor_terms:
                new_term = SponsorTerm(
                    id=f"{target.id}_{term.id}",
                    terminology_extension_id=new_ext.id,
                    submission_value=term.submission_value,
                    description=term.description
                )
                db.add(new_term)

    def _clone_analysis_sets(self, db: Session, source: ReportingEvent, target: ReportingEvent):
        """Clone analysis sets with where clauses"""
        for analysis_set in source.analysis_sets:
            new_set = AnalysisSet(
                id=f"{target.id}_{analysis_set.id}",
                reporting_event_id=target.id,
                name=analysis_set.name,
                description=analysis_set.description,
                label=analysis_set.label,
                level=analysis_set.level,
                order_num=analysis_set.order_num
            )
            db.add(new_set)
            db.flush()
            
            # Clone where clauses
            self._clone_where_clauses(db, analysis_set.where_clauses, 'analysis_set', new_set.id)

    def _clone_data_subsets(self, db: Session, source: ReportingEvent, target: ReportingEvent):
        """Clone data subsets with where clauses"""
        for subset in source.data_subsets:
            new_subset = DataSubset(
                id=f"{target.id}_{subset.id}",
                reporting_event_id=target.id,
                name=subset.name,
                description=subset.description,
                label=subset.label,
                level=subset.level,
                order_num=subset.order_num
            )
            db.add(new_subset)
            db.flush()
            
            # Clone where clauses
            self._clone_where_clauses(db, subset.where_clauses, 'data_subset', new_subset.id)

    def _clone_analysis_groupings(self, db: Session, source: ReportingEvent, target: ReportingEvent):
        """Clone analysis groupings and groups"""
        for grouping in source.analysis_groupings:
            new_grouping = AnalysisGrouping(
                id=f"{target.id}_{grouping.id}",
                reporting_event_id=target.id,
                name=grouping.name,
                description=grouping.description,
                label=grouping.label,
                grouping_dataset=grouping.grouping_dataset,
                grouping_variable=grouping.grouping_variable,
                data_driven=grouping.data_driven
            )
            db.add(new_grouping)
            db.flush()
            
            for group in grouping.groups:
                new_group = Group(
                    id=f"{target.id}_{group.id}",
                    grouping_id=new_grouping.id,
                    name=group.name,
                    description=group.description,
                    label=group.label,
                    level=group.level,
                    order_num=group.order_num
                )
                db.add(new_group)
                db.flush()
                
                # Clone where clauses for group
                self._clone_where_clauses(db, group.where_clauses, 'group', new_group.id)

    def _clone_methods(self, db: Session, source: ReportingEvent, target: ReportingEvent):
        """Clone analysis methods and operations"""
        # Implementation would continue for methods, operations, etc.
        # This is a simplified version - full implementation would clone all nested relationships
        for method in source.methods:
            new_method = AnalysisMethod(
                id=f"{target.id}_{method.id}",
                reporting_event_id=target.id,
                name=method.name,
                description=method.description,
                label=method.label,
                code_template=method.code_template
            )
            db.add(new_method)

    def _clone_analyses(self, db: Session, source: ReportingEvent, target: ReportingEvent):
        """Clone analyses"""
        # Simplified implementation
        pass

    def _clone_outputs(self, db: Session, source: ReportingEvent, target: ReportingEvent):
        """Clone outputs"""
        # Simplified implementation
        pass

    def _clone_global_display_sections(self, db: Session, source: ReportingEvent, target: ReportingEvent):
        """Clone global display sections"""
        for section in source.global_display_sections:
            new_section = GlobalDisplaySection(
                id=f"{target.id}_{section.id}",
                reporting_event_id=target.id,
                section_type=section.section_type,
                section_label=section.section_label
            )
            db.add(new_section)

    def _clone_lists_of_contents(self, db: Session, source: ReportingEvent, target: ReportingEvent):
        """Clone lists of contents"""
        # Simplified implementation
        pass

    def _clone_categorizations(self, db: Session, source: ReportingEvent, target: ReportingEvent):
        """Clone categorizations"""
        # Simplified implementation
        pass

    def _clone_where_clauses(self, db: Session, where_clauses: List[WhereClause], parent_type: str, parent_id: str):
        """Helper method to clone where clauses"""
        for clause in where_clauses:
            new_clause = WhereClause(
                parent_type=parent_type,
                parent_id=parent_id,
                level=clause.level,
                order_num=clause.order_num,
                clause_type=clause.clause_type
            )
            db.add(new_clause)
            db.flush()
            
            # Clone condition or compound expression
            if clause.condition:
                from app.models.ars import WhereClauseCondition
                new_condition = WhereClauseCondition(
                    where_clause_id=new_clause.id,
                    dataset=clause.condition.dataset,
                    variable=clause.condition.variable,
                    comparator=clause.condition.comparator,
                    value_array=clause.condition.value_array
                )
                db.add(new_condition)
            
            if clause.compound_expression:
                from app.models.ars import WhereClauseCompoundExpression
                new_compound = WhereClauseCompoundExpression(
                    where_clause_id=new_clause.id,
                    logical_operator=clause.compound_expression.logical_operator
                )
                db.add(new_compound)

    def get_statistics(self, db: Session, *, id: str) -> Dict[str, int]:
        """
        Get statistics for a reporting event.
        
        Args:
            db: Database session
            id: ReportingEvent ID
            
        Returns:
            Dictionary with counts of various entities
        """
        stats = {}
        
        # Count various entities
        stats['analyses'] = db.query(func.count(Analysis.id)).filter(
            Analysis.reporting_event_id == id
        ).scalar()
        
        stats['outputs'] = db.query(func.count(Output.id)).filter(
            Output.reporting_event_id == id
        ).scalar()
        
        stats['methods'] = db.query(func.count(AnalysisMethod.id)).filter(
            AnalysisMethod.reporting_event_id == id
        ).scalar()
        
        stats['analysis_sets'] = db.query(func.count(AnalysisSet.id)).filter(
            AnalysisSet.reporting_event_id == id
        ).scalar()
        
        stats['data_subsets'] = db.query(func.count(DataSubset.id)).filter(
            DataSubset.reporting_event_id == id
        ).scalar()
        
        stats['groupings'] = db.query(func.count(AnalysisGrouping.id)).filter(
            AnalysisGrouping.reporting_event_id == id
        ).scalar()
        
        return stats


reporting_event = CRUDReportingEvent(ReportingEvent)