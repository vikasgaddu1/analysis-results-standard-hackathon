from typing import Any
from sqlalchemy.ext.declarative import as_declarative, declared_attr
from sqlalchemy import Column, Integer, DateTime, func


@as_declarative()
class Base:
    """
    Base class for all database models.
    Provides common attributes and functionality.
    """
    id: Any
    __name__: str
    
    # Generate __tablename__ automatically from class name
    @declared_attr
    def __tablename__(cls) -> str:
        """Generate table name from class name in snake_case."""
        # Convert CamelCase to snake_case
        name = cls.__name__
        # Handle acronyms and add underscores before capitals
        result = []
        for i, char in enumerate(name):
            if char.isupper() and i > 0:
                # Check if previous char is lowercase or next char is lowercase
                if (name[i-1].islower() or 
                    (i < len(name) - 1 and name[i+1].islower())):
                    result.append('_')
            result.append(char.lower())
        return ''.join(result)


class TimestampMixin:
    """
    Mixin to add created_at and updated_at timestamps to models.
    """
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )


# Import all models here to ensure they are registered with SQLAlchemy
# This is important for Alembic migrations to detect all models
from app.models.ars import (  # noqa
    # User Management
    User, UserSession,
    
    # Core ARS Models
    ReportingEvent, ReferenceDocument, TerminologyExtension, SponsorTerm,
    AnalysisSet, DataSubset, AnalysisGrouping, Group,
    WhereClause, WhereClauseCondition, WhereClauseCompoundExpression,
    AnalysisMethod, Operation, OperationRelationship,
    Analysis, OrderedGrouping, AnalysisResult, ResultGroup,
    Output, OutputProgrammingCode, OutputCodeParameter,
    Display, GlobalDisplaySection, DisplaySection, DisplaySubSection,
    OrderedDisplaySubSection, OutputFileSpecification,
    ListOfContents, ListItem,
    AnalysisOutputCategorization, AnalysisOutputCategory,
    
    # Audit
    AuditLog,
    
    # Association tables
    method_document_refs, analysis_document_refs, analysis_data_subsets,
    output_document_refs, category_sub_categorizations
)

from app.models.template import (  # noqa
    # Template Management
    Template, TemplateCategory, TemplateVersion, TemplateUsage, TemplateRating,
    Team, Organization,
    
    # Association tables
    template_tags, template_team_access
)