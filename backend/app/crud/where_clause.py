"""
CRUD operations for Where Clauses
"""

from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.crud.base import CRUDBase
from app.models.ars import WhereClause, WhereClauseCondition, WhereClauseCompoundExpression
from app.schemas.ars import (
    WhereClauseCreate, WhereClauseBase, WhereClauseConditionBase, 
    WhereClauseCompoundExpressionBase
)


class CRUDWhereClause(CRUDBase[WhereClause, WhereClauseCreate, WhereClauseBase]):
    """CRUD operations for where clauses"""
    
    def create_with_details(
        self,
        db: Session,
        *,
        obj_in: WhereClauseCreate
    ) -> WhereClause:
        """Create a where clause with condition or compound expression"""
        # Create the main where clause
        where_clause_id = uuid4()
        db_obj = WhereClause(
            id=where_clause_id,
            parent_type=obj_in.parent_type,
            parent_id=obj_in.parent_id,
            level=obj_in.level,
            order_num=obj_in.order_num,
            clause_type=obj_in.clause_type
        )
        db.add(db_obj)
        
        # Create condition if specified
        if obj_in.condition and obj_in.clause_type == "condition":
            condition = WhereClauseCondition(
                where_clause_id=where_clause_id,
                dataset=obj_in.condition.dataset,
                variable=obj_in.condition.variable,
                comparator=obj_in.condition.comparator,
                value_array=obj_in.condition.value_array
            )
            db.add(condition)
        
        # Create compound expression if specified
        elif obj_in.compound_expression and obj_in.clause_type == "compound_expression":
            compound_expr = WhereClauseCompoundExpression(
                where_clause_id=where_clause_id,
                logical_operator=obj_in.compound_expression.logical_operator
            )
            db.add(compound_expr)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_by_parent(
        self,
        db: Session,
        *,
        parent_type: str,
        parent_id: str
    ) -> List[WhereClause]:
        """Get all where clauses for a specific parent"""
        return db.query(self.model).filter(
            and_(
                self.model.parent_type == parent_type,
                self.model.parent_id == parent_id
            )
        ).order_by(self.model.level, self.model.order_num).all()
    
    def update_condition(
        self,
        db: Session,
        *,
        where_clause_id: UUID,
        condition_data: WhereClauseConditionBase
    ) -> Optional[WhereClause]:
        """Update the condition of a where clause"""
        where_clause = db.query(self.model).filter(self.model.id == where_clause_id).first()
        if not where_clause or where_clause.clause_type != "condition":
            return None
        
        # Update or create condition
        condition = db.query(WhereClauseCondition).filter(
            WhereClauseCondition.where_clause_id == where_clause_id
        ).first()
        
        if condition:
            condition.dataset = condition_data.dataset
            condition.variable = condition_data.variable
            condition.comparator = condition_data.comparator
            condition.value_array = condition_data.value_array
        else:
            condition = WhereClauseCondition(
                where_clause_id=where_clause_id,
                dataset=condition_data.dataset,
                variable=condition_data.variable,
                comparator=condition_data.comparator,
                value_array=condition_data.value_array
            )
            db.add(condition)
        
        db.commit()
        db.refresh(where_clause)
        return where_clause
    
    def update_compound_expression(
        self,
        db: Session,
        *,
        where_clause_id: UUID,
        expression_data: WhereClauseCompoundExpressionBase
    ) -> Optional[WhereClause]:
        """Update the compound expression of a where clause"""
        where_clause = db.query(self.model).filter(self.model.id == where_clause_id).first()
        if not where_clause or where_clause.clause_type != "compound_expression":
            return None
        
        # Update or create compound expression
        compound_expr = db.query(WhereClauseCompoundExpression).filter(
            WhereClauseCompoundExpression.where_clause_id == where_clause_id
        ).first()
        
        if compound_expr:
            compound_expr.logical_operator = expression_data.logical_operator
        else:
            compound_expr = WhereClauseCompoundExpression(
                where_clause_id=where_clause_id,
                logical_operator=expression_data.logical_operator
            )
            db.add(compound_expr)
        
        db.commit()
        db.refresh(where_clause)
        return where_clause
    
    def clone_where_clause(
        self,
        db: Session,
        *,
        source_id: UUID,
        new_parent_type: str,
        new_parent_id: str,
        new_level: int,
        new_order_num: int
    ) -> Optional[WhereClause]:
        """Clone a where clause to a new parent"""
        source = db.query(self.model).filter(self.model.id == source_id).first()
        if not source:
            return None
        
        # Create new where clause
        new_id = uuid4()
        new_clause = WhereClause(
            id=new_id,
            parent_type=new_parent_type,
            parent_id=new_parent_id,
            level=new_level,
            order_num=new_order_num,
            clause_type=source.clause_type
        )
        db.add(new_clause)
        
        # Clone condition if exists
        if source.condition:
            new_condition = WhereClauseCondition(
                where_clause_id=new_id,
                dataset=source.condition.dataset,
                variable=source.condition.variable,
                comparator=source.condition.comparator,
                value_array=source.condition.value_array
            )
            db.add(new_condition)
        
        # Clone compound expression if exists
        if source.compound_expression:
            new_expression = WhereClauseCompoundExpression(
                where_clause_id=new_id,
                logical_operator=source.compound_expression.logical_operator
            )
            db.add(new_expression)
        
        db.commit()
        db.refresh(new_clause)
        return new_clause
    
    def validate_condition(
        self,
        db: Session,
        *,
        condition: WhereClauseConditionBase
    ) -> Dict[str, Any]:
        """Validate a where clause condition"""
        validation_result = {
            "is_valid": True,
            "errors": [],
            "warnings": []
        }
        
        # Basic validation
        if not condition.dataset:
            validation_result["is_valid"] = False
            validation_result["errors"].append("Dataset is required")
        
        if not condition.variable:
            validation_result["is_valid"] = False
            validation_result["errors"].append("Variable is required")
        
        if not condition.value_array or len(condition.value_array) == 0:
            validation_result["is_valid"] = False
            validation_result["errors"].append("At least one value is required")
        
        # Comparator-specific validation
        if condition.comparator in ["IN", "NOTIN"] and len(condition.value_array) == 1:
            validation_result["warnings"].append(
                f"Using {condition.comparator} with single value - consider using EQ/NE instead"
            )
        
        if condition.comparator in ["EQ", "NE", "GT", "LT", "GE", "LE"] and len(condition.value_array) > 1:
            validation_result["warnings"].append(
                f"Using {condition.comparator} with multiple values - only first value will be used"
            )
        
        return validation_result
    
    def get_template_clauses(
        self,
        db: Session,
        *,
        dataset: Optional[str] = None,
        variable: Optional[str] = None,
        limit: int = 20
    ) -> List[WhereClause]:
        """Get template where clauses for reuse"""
        query = db.query(self.model)
        
        # Filter by dataset/variable if provided
        if dataset or variable:
            query = query.join(WhereClauseCondition)
            if dataset:
                query = query.filter(WhereClauseCondition.dataset == dataset)
            if variable:
                query = query.filter(WhereClauseCondition.variable == variable)
        
        # Group by similar conditions and get most used
        return query.limit(limit).all()
    
    def search_clauses(
        self,
        db: Session,
        *,
        search_term: str,
        parent_type: Optional[str] = None,
        limit: int = 50
    ) -> List[WhereClause]:
        """Search where clauses by various criteria"""
        query = db.query(self.model)
        
        # Filter by parent type if specified
        if parent_type:
            query = query.filter(self.model.parent_type == parent_type)
        
        # Search in conditions
        condition_query = query.join(WhereClauseCondition).filter(
            or_(
                WhereClauseCondition.dataset.ilike(f"%{search_term}%"),
                WhereClauseCondition.variable.ilike(f"%{search_term}%"),
                func.array_to_string(WhereClauseCondition.value_array, ',').ilike(f"%{search_term}%")
            )
        )
        
        return condition_query.limit(limit).all()
    
    def get_statistics(
        self,
        db: Session,
        *,
        parent_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get usage statistics for where clauses"""
        query = db.query(self.model)
        
        if parent_type:
            query = query.filter(self.model.parent_type == parent_type)
        
        total_clauses = query.count()
        condition_clauses = query.filter(self.model.clause_type == "condition").count()
        compound_clauses = query.filter(self.model.clause_type == "compound_expression").count()
        
        # Get most used datasets and variables
        datasets_query = db.query(
            WhereClauseCondition.dataset,
            func.count(WhereClauseCondition.dataset).label('count')
        ).group_by(WhereClauseCondition.dataset).order_by(func.count(WhereClauseCondition.dataset).desc()).limit(10)
        
        variables_query = db.query(
            WhereClauseCondition.variable,
            func.count(WhereClauseCondition.variable).label('count')
        ).group_by(WhereClauseCondition.variable).order_by(func.count(WhereClauseCondition.variable).desc()).limit(10)
        
        return {
            "total_clauses": total_clauses,
            "condition_clauses": condition_clauses,
            "compound_clauses": compound_clauses,
            "most_used_datasets": [{"dataset": row.dataset, "count": row.count} for row in datasets_query.all()],
            "most_used_variables": [{"variable": row.variable, "count": row.count} for row in variables_query.all()]
        }


class CRUDWhereClauseLibrary:
    """CRUD operations for where clause templates and library"""
    
    def __init__(self):
        self.templates = {}  # In-memory storage for now, could be database-backed
    
    def save_template(
        self,
        db: Session,
        *,
        name: str,
        description: str,
        where_clause_id: UUID,
        tags: List[str] = []
    ) -> Dict[str, Any]:
        """Save a where clause as a template"""
        where_clause = db.query(WhereClause).filter(WhereClause.id == where_clause_id).first()
        if not where_clause:
            return {"success": False, "error": "Where clause not found"}
        
        template_id = str(uuid4())
        template = {
            "id": template_id,
            "name": name,
            "description": description,
            "tags": tags,
            "clause_type": where_clause.clause_type,
            "condition": None,
            "compound_expression": None,
            "created_at": func.current_timestamp()
        }
        
        if where_clause.condition:
            template["condition"] = {
                "dataset": where_clause.condition.dataset,
                "variable": where_clause.condition.variable,
                "comparator": where_clause.condition.comparator,
                "value_array": where_clause.condition.value_array
            }
        
        if where_clause.compound_expression:
            template["compound_expression"] = {
                "logical_operator": where_clause.compound_expression.logical_operator
            }
        
        self.templates[template_id] = template
        return {"success": True, "template_id": template_id}
    
    def get_templates(
        self,
        *,
        tags: Optional[List[str]] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get saved templates"""
        templates = list(self.templates.values())
        
        # Filter by tags
        if tags:
            templates = [t for t in templates if any(tag in t["tags"] for tag in tags)]
        
        # Filter by search term
        if search:
            search_lower = search.lower()
            templates = [
                t for t in templates 
                if search_lower in t["name"].lower() or search_lower in t["description"].lower()
            ]
        
        return templates
    
    def delete_template(self, template_id: str) -> bool:
        """Delete a template"""
        if template_id in self.templates:
            del self.templates[template_id]
            return True
        return False
    
    def apply_template(
        self,
        db: Session,
        *,
        template_id: str,
        parent_type: str,
        parent_id: str,
        level: int,
        order_num: int
    ) -> Optional[WhereClause]:
        """Apply a template to create a new where clause"""
        template = self.templates.get(template_id)
        if not template:
            return None
        
        # Create where clause from template
        where_clause_data = WhereClauseCreate(
            parent_type=parent_type,
            parent_id=parent_id,
            level=level,
            order_num=order_num,
            clause_type=template["clause_type"],
            condition=WhereClauseConditionBase(**template["condition"]) if template["condition"] else None,
            compound_expression=WhereClauseCompoundExpressionBase(**template["compound_expression"]) if template["compound_expression"] else None
        )
        
        return crud_where_clause.create_with_details(db, obj_in=where_clause_data)


# Create the CRUD instances
crud_where_clause = CRUDWhereClause(WhereClause)
crud_where_clause_library = CRUDWhereClauseLibrary()