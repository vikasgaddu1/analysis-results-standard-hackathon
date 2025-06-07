"""
CRUD operations for Analysis model
"""

from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func, or_

from app.crud.base import CRUDBase
from app.models.ars import (
    Analysis, AnalysisResult, OrderedGrouping, AnalysisSet, 
    AnalysisMethod, AnalysisGrouping, DataSubset, Operation
)
from app.schemas.ars import AnalysisCreate, AnalysisUpdate


class CRUDAnalysis(CRUDBase[Analysis, AnalysisCreate, AnalysisUpdate]):
    """CRUD operations for Analysis model"""
    
    def get_with_relationships(self, db: Session, *, id: str) -> Optional[Analysis]:
        """
        Get analysis with all relationships loaded.
        
        Args:
            db: Database session
            id: Analysis ID
            
        Returns:
            Analysis with relationships or None
        """
        return db.query(Analysis).options(
            joinedload(Analysis.method).joinedload(AnalysisMethod.operations),
            joinedload(Analysis.analysis_set),
            joinedload(Analysis.ordered_groupings).joinedload(OrderedGrouping.grouping),
            joinedload(Analysis.results).joinedload(AnalysisResult.result_groups)
        ).filter(Analysis.id == id).first()

    def get_by_reporting_event(
        self, 
        db: Session, 
        *, 
        reporting_event_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Analysis]:
        """
        Get analyses for a specific reporting event.
        
        Args:
            db: Database session
            reporting_event_id: ReportingEvent ID
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of analyses
        """
        return db.query(Analysis).filter(
            Analysis.reporting_event_id == reporting_event_id
        ).offset(skip).limit(limit).all()

    def get_by_method(
        self, 
        db: Session, 
        *, 
        method_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Analysis]:
        """
        Get analyses using a specific method.
        
        Args:
            db: Database session
            method_id: AnalysisMethod ID
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of analyses
        """
        return db.query(Analysis).filter(
            Analysis.method_id == method_id
        ).offset(skip).limit(limit).all()

    def get_by_analysis_set(
        self, 
        db: Session, 
        *, 
        analysis_set_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Analysis]:
        """
        Get analyses using a specific analysis set.
        
        Args:
            db: Database session
            analysis_set_id: AnalysisSet ID
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of analyses
        """
        return db.query(Analysis).filter(
            Analysis.analysis_set_id == analysis_set_id
        ).offset(skip).limit(limit).all()

    def get_by_category(
        self, 
        db: Session, 
        *, 
        category_id: str,
        reporting_event_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Analysis]:
        """
        Get analyses with a specific category.
        
        Args:
            db: Database session
            category_id: Category ID
            reporting_event_id: Optional reporting event filter
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of analyses
        """
        query = db.query(Analysis).filter(
            Analysis.category_ids.contains([category_id])
        )
        
        if reporting_event_id:
            query = query.filter(Analysis.reporting_event_id == reporting_event_id)
        
        return query.offset(skip).limit(limit).all()

    def search(
        self, 
        db: Session, 
        *, 
        query: str,
        reporting_event_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Analysis]:
        """
        Search analyses by text.
        
        Args:
            db: Database session
            query: Search query
            reporting_event_id: Optional reporting event filter
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of matching analyses
        """
        search_filter = or_(
            Analysis.name.ilike(f"%{query}%"),
            Analysis.description.ilike(f"%{query}%"),
            Analysis.label.ilike(f"%{query}%"),
            Analysis.id.ilike(f"%{query}%")
        )
        
        db_query = db.query(Analysis).filter(search_filter)
        
        if reporting_event_id:
            db_query = db_query.filter(Analysis.reporting_event_id == reporting_event_id)
        
        return db_query.offset(skip).limit(limit).all()

    def add_result(
        self, 
        db: Session, 
        *, 
        analysis_id: str,
        operation_id: str,
        raw_value: Optional[str] = None,
        formatted_value: Optional[str] = None,
        result_groups: Optional[List[Dict[str, str]]] = None
    ) -> AnalysisResult:
        """
        Add a result to an analysis.
        
        Args:
            db: Database session
            analysis_id: Analysis ID
            operation_id: Operation ID
            raw_value: Raw result value
            formatted_value: Formatted result value
            result_groups: List of group associations
            
        Returns:
            Created analysis result
        """
        result = AnalysisResult(
            analysis_id=analysis_id,
            operation_id=operation_id,
            raw_value=raw_value,
            formatted_value=formatted_value
        )
        
        db.add(result)
        db.flush()  # Get the ID
        
        # Add result groups if provided
        if result_groups:
            from app.models.ars import ResultGroup
            for group_data in result_groups:
                result_group = ResultGroup(
                    result_id=result.id,
                    grouping_id=group_data['grouping_id'],
                    group_id=group_data['group_id']
                )
                db.add(result_group)
        
        db.commit()
        db.refresh(result)
        return result

    def get_results(
        self, 
        db: Session, 
        *, 
        analysis_id: str
    ) -> List[AnalysisResult]:
        """
        Get all results for an analysis.
        
        Args:
            db: Database session
            analysis_id: Analysis ID
            
        Returns:
            List of analysis results
        """
        return db.query(AnalysisResult).options(
            joinedload(AnalysisResult.operation),
            joinedload(AnalysisResult.result_groups)
        ).filter(AnalysisResult.analysis_id == analysis_id).all()

    def remove_result(self, db: Session, *, result_id: UUID) -> bool:
        """
        Remove a specific result from an analysis.
        
        Args:
            db: Database session
            result_id: AnalysisResult ID
            
        Returns:
            True if result was removed
        """
        result = db.query(AnalysisResult).filter(
            AnalysisResult.id == result_id
        ).first()
        
        if result:
            db.delete(result)
            db.commit()
            return True
        return False

    def clear_results(self, db: Session, *, analysis_id: str) -> int:
        """
        Clear all results for an analysis.
        
        Args:
            db: Database session
            analysis_id: Analysis ID
            
        Returns:
            Number of results removed
        """
        deleted_count = db.query(AnalysisResult).filter(
            AnalysisResult.analysis_id == analysis_id
        ).delete()
        db.commit()
        return deleted_count

    def add_grouping(
        self, 
        db: Session, 
        *, 
        analysis_id: str,
        grouping_id: str,
        order_num: int,
        results_by_group: bool = False
    ) -> OrderedGrouping:
        """
        Add a grouping to an analysis.
        
        Args:
            db: Database session
            analysis_id: Analysis ID
            grouping_id: AnalysisGrouping ID
            order_num: Order number
            results_by_group: Whether results are grouped
            
        Returns:
            Created ordered grouping
        """
        ordered_grouping = OrderedGrouping(
            analysis_id=analysis_id,
            grouping_id=grouping_id,
            order_num=order_num,
            results_by_group=results_by_group
        )
        
        db.add(ordered_grouping)
        db.commit()
        db.refresh(ordered_grouping)
        return ordered_grouping

    def remove_grouping(
        self, 
        db: Session, 
        *, 
        analysis_id: str,
        grouping_id: str
    ) -> bool:
        """
        Remove a grouping from an analysis.
        
        Args:
            db: Database session
            analysis_id: Analysis ID
            grouping_id: AnalysisGrouping ID
            
        Returns:
            True if grouping was removed
        """
        ordered_grouping = db.query(OrderedGrouping).filter(
            and_(
                OrderedGrouping.analysis_id == analysis_id,
                OrderedGrouping.grouping_id == grouping_id
            )
        ).first()
        
        if ordered_grouping:
            db.delete(ordered_grouping)
            db.commit()
            return True
        return False

    def reorder_groupings(
        self, 
        db: Session, 
        *, 
        analysis_id: str,
        grouping_orders: List[Dict[str, Any]]
    ) -> List[OrderedGrouping]:
        """
        Reorder groupings for an analysis.
        
        Args:
            db: Database session
            analysis_id: Analysis ID
            grouping_orders: List of {grouping_id, order_num} dicts
            
        Returns:
            Updated ordered groupings
        """
        updated_groupings = []
        
        for order_data in grouping_orders:
            grouping_id = order_data['grouping_id']
            order_num = order_data['order_num']
            
            ordered_grouping = db.query(OrderedGrouping).filter(
                and_(
                    OrderedGrouping.analysis_id == analysis_id,
                    OrderedGrouping.grouping_id == grouping_id
                )
            ).first()
            
            if ordered_grouping:
                ordered_grouping.order_num = order_num
                updated_groupings.append(ordered_grouping)
        
        db.commit()
        for grouping in updated_groupings:
            db.refresh(grouping)
        
        return updated_groupings

    def clone(
        self, 
        db: Session, 
        *, 
        id: str,
        new_id: str,
        new_name: str,
        reporting_event_id: str
    ) -> Analysis:
        """
        Clone an analysis to a new analysis.
        
        Args:
            db: Database session
            id: Source Analysis ID
            new_id: New Analysis ID
            new_name: New name
            reporting_event_id: Target reporting event ID
            
        Returns:
            Cloned analysis
        """
        source = self.get_with_relationships(db, id=id)
        if not source:
            raise ValueError(f"Analysis {id} not found")
        
        # Create new analysis
        new_analysis = Analysis(
            id=new_id,
            reporting_event_id=reporting_event_id,
            name=new_name,
            description=source.description,
            label=source.label,
            version=source.version,
            reason=source.reason,
            purpose=source.purpose,
            method_id=source.method_id,
            analysis_set_id=source.analysis_set_id,
            dataset=source.dataset,
            variable=source.variable,
            category_ids=source.category_ids.copy() if source.category_ids else None
        )
        
        db.add(new_analysis)
        db.flush()
        
        # Clone ordered groupings
        for og in source.ordered_groupings:
            new_og = OrderedGrouping(
                analysis_id=new_analysis.id,
                grouping_id=og.grouping_id,
                order_num=og.order_num,
                results_by_group=og.results_by_group
            )
            db.add(new_og)
        
        # Note: Results are typically not cloned as they are data-specific
        
        db.commit()
        db.refresh(new_analysis)
        return new_analysis

    def get_statistics(self, db: Session, *, id: str) -> Dict[str, Any]:
        """
        Get statistics for an analysis.
        
        Args:
            db: Database session
            id: Analysis ID
            
        Returns:
            Dictionary with analysis statistics
        """
        stats = {}
        
        # Count results
        stats['result_count'] = db.query(func.count(AnalysisResult.id)).filter(
            AnalysisResult.analysis_id == id
        ).scalar()
        
        # Count groupings
        stats['grouping_count'] = db.query(func.count(OrderedGrouping.id)).filter(
            OrderedGrouping.analysis_id == id
        ).scalar()
        
        # Get method info
        analysis = self.get(db, id=id)
        if analysis and analysis.method_id:
            method = db.query(AnalysisMethod).filter(
                AnalysisMethod.id == analysis.method_id
            ).first()
            if method:
                stats['method_name'] = method.name
                stats['operation_count'] = db.query(func.count(Operation.id)).filter(
                    Operation.method_id == method.id
                ).scalar()
        
        return stats


analysis = CRUDAnalysis(Analysis)