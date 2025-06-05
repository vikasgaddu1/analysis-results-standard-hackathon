"""
SQLAlchemy ORM Models for Clinical Trial Table Metadata System
Based on CDISC Analysis Results Standard (ARS) v1.0
"""

from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, Text, 
    Table, UniqueConstraint, CheckConstraint, ARRAY, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func

Base = declarative_base()

# ============================================
# USER MANAGEMENT MODELS
# ============================================

class User(Base):
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, 
                  CheckConstraint("role IN ('admin', 'editor', 'viewer')"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), 
                        onupdate=func.current_timestamp())
    last_login = Column(DateTime)
    
    # Relationships
    sessions = relationship('UserSession', back_populates='user', cascade='all, delete-orphan')
    reporting_events = relationship('ReportingEvent', back_populates='created_by_user')


class UserSession(Base):
    __tablename__ = 'user_sessions'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token_hash = Column(String(255), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=func.current_timestamp())
    
    # Relationships
    user = relationship('User', back_populates='sessions')


# ============================================
# CORE ARS MODEL
# ============================================

class ReportingEvent(Base):
    __tablename__ = 'reporting_events'
    
    id = Column(String(255), primary_key=True)
    name = Column(String(500), nullable=False)
    description = Column(Text)
    label = Column(String(255))
    version = Column(String(50))
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_at = Column(DateTime, default=func.current_timestamp())
    updated_at = Column(DateTime, default=func.current_timestamp(), 
                        onupdate=func.current_timestamp())
    is_locked = Column(Boolean, default=False)
    parent_id = Column(String(255), ForeignKey('reporting_events.id'))
    
    # Relationships
    created_by_user = relationship('User', back_populates='reporting_events')
    parent = relationship('ReportingEvent', remote_side=[id])
    reference_documents = relationship('ReferenceDocument', back_populates='reporting_event', 
                                       cascade='all, delete-orphan')
    terminology_extensions = relationship('TerminologyExtension', back_populates='reporting_event', 
                                          cascade='all, delete-orphan')
    analysis_sets = relationship('AnalysisSet', back_populates='reporting_event', 
                                 cascade='all, delete-orphan')
    data_subsets = relationship('DataSubset', back_populates='reporting_event', 
                                cascade='all, delete-orphan')
    analysis_groupings = relationship('AnalysisGrouping', back_populates='reporting_event', 
                                      cascade='all, delete-orphan')
    methods = relationship('AnalysisMethod', back_populates='reporting_event', 
                           cascade='all, delete-orphan')
    analyses = relationship('Analysis', back_populates='reporting_event', 
                            cascade='all, delete-orphan')
    outputs = relationship('Output', back_populates='reporting_event', 
                           cascade='all, delete-orphan')
    global_display_sections = relationship('GlobalDisplaySection', back_populates='reporting_event', 
                                           cascade='all, delete-orphan')
    lists_of_contents = relationship('ListOfContents', back_populates='reporting_event', 
                                     cascade='all, delete-orphan')
    categorizations = relationship('AnalysisOutputCategorization', back_populates='reporting_event', 
                                   cascade='all, delete-orphan')


class ReferenceDocument(Base):
    __tablename__ = 'reference_documents'
    
    id = Column(String(255), primary_key=True)
    reporting_event_id = Column(String(255), ForeignKey('reporting_events.id', ondelete='CASCADE'), 
                                nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text)
    label = Column(String(255))
    location = Column(Text, nullable=False)
    
    # Relationships
    reporting_event = relationship('ReportingEvent', back_populates='reference_documents')


class TerminologyExtension(Base):
    __tablename__ = 'terminology_extensions'
    
    id = Column(String(255), primary_key=True)
    reporting_event_id = Column(String(255), ForeignKey('reporting_events.id', ondelete='CASCADE'), 
                                nullable=False)
    enumeration = Column(String(255), nullable=False)
    
    # Relationships
    reporting_event = relationship('ReportingEvent', back_populates='terminology_extensions')
    sponsor_terms = relationship('SponsorTerm', back_populates='terminology_extension', 
                                 cascade='all, delete-orphan')


class SponsorTerm(Base):
    __tablename__ = 'sponsor_terms'
    
    id = Column(String(255), primary_key=True)
    terminology_extension_id = Column(String(255), 
                                      ForeignKey('terminology_extensions.id', ondelete='CASCADE'), 
                                      nullable=False)
    submission_value = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Relationships
    terminology_extension = relationship('TerminologyExtension', back_populates='sponsor_terms')


class AnalysisSet(Base):
    __tablename__ = 'analysis_sets'
    
    id = Column(String(255), primary_key=True)
    reporting_event_id = Column(String(255), ForeignKey('reporting_events.id', ondelete='CASCADE'), 
                                nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text)
    label = Column(String(255))
    level = Column(Integer, nullable=False)
    order_num = Column(Integer, nullable=False)
    
    # Relationships
    reporting_event = relationship('ReportingEvent', back_populates='analysis_sets')
    where_clauses = relationship('WhereClause', 
                                 primaryjoin="and_(WhereClause.parent_type=='analysis_set', "
                                            "foreign(WhereClause.parent_id)==AnalysisSet.id)",
                                 cascade='all, delete-orphan')
    analyses = relationship('Analysis', back_populates='analysis_set')


class DataSubset(Base):
    __tablename__ = 'data_subsets'
    
    id = Column(String(255), primary_key=True)
    reporting_event_id = Column(String(255), ForeignKey('reporting_events.id', ondelete='CASCADE'), 
                                nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text)
    label = Column(String(255))
    level = Column(Integer, nullable=False)
    order_num = Column(Integer, nullable=False)
    
    # Relationships
    reporting_event = relationship('ReportingEvent', back_populates='data_subsets')
    where_clauses = relationship('WhereClause', 
                                 primaryjoin="and_(WhereClause.parent_type=='data_subset', "
                                            "foreign(WhereClause.parent_id)==DataSubset.id)",
                                 cascade='all, delete-orphan')


class AnalysisGrouping(Base):
    __tablename__ = 'analysis_groupings'
    
    id = Column(String(255), primary_key=True)
    reporting_event_id = Column(String(255), ForeignKey('reporting_events.id', ondelete='CASCADE'), 
                                nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text)
    label = Column(String(255))
    grouping_dataset = Column(String(255))
    grouping_variable = Column(String(255))
    data_driven = Column(Boolean, default=False)
    
    # Relationships
    reporting_event = relationship('ReportingEvent', back_populates='analysis_groupings')
    groups = relationship('Group', back_populates='grouping', cascade='all, delete-orphan')


class Group(Base):
    __tablename__ = 'groups'
    
    id = Column(String(255), primary_key=True)
    grouping_id = Column(String(255), ForeignKey('analysis_groupings.id', ondelete='CASCADE'), 
                         nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text)
    label = Column(String(255))
    level = Column(Integer, nullable=False)
    order_num = Column(Integer, nullable=False)
    
    # Relationships
    grouping = relationship('AnalysisGrouping', back_populates='groups')
    where_clauses = relationship('WhereClause', 
                                 primaryjoin="and_(WhereClause.parent_type=='group', "
                                            "foreign(WhereClause.parent_id)==Group.id)",
                                 cascade='all, delete-orphan')


class WhereClause(Base):
    __tablename__ = 'where_clauses'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    parent_type = Column(String(50), nullable=False)
    parent_id = Column(String(255), nullable=False)
    level = Column(Integer, nullable=False)
    order_num = Column(Integer, nullable=False)
    clause_type = Column(String(50), nullable=False,
                         CheckConstraint("clause_type IN ('condition', 'compound_expression')"))
    
    # Relationships
    condition = relationship('WhereClauseCondition', back_populates='where_clause', 
                             uselist=False, cascade='all, delete-orphan')
    compound_expression = relationship('WhereClauseCompoundExpression', back_populates='where_clause', 
                                       uselist=False, cascade='all, delete-orphan')


class WhereClauseCondition(Base):
    __tablename__ = 'where_clause_conditions'
    
    where_clause_id = Column(UUID(as_uuid=True), ForeignKey('where_clauses.id', ondelete='CASCADE'), 
                             primary_key=True)
    dataset = Column(String(255), nullable=False)
    variable = Column(String(255), nullable=False)
    comparator = Column(String(10), nullable=False,
                        CheckConstraint("comparator IN ('EQ', 'NE', 'GT', 'LT', 'GE', 'LE', "
                                        "'IN', 'NOTIN', 'CONTAINS')"))
    value_array = Column(ARRAY(Text))
    
    # Relationships
    where_clause = relationship('WhereClause', back_populates='condition')


class WhereClauseCompoundExpression(Base):
    __tablename__ = 'where_clause_compound_expressions'
    
    where_clause_id = Column(UUID(as_uuid=True), ForeignKey('where_clauses.id', ondelete='CASCADE'), 
                             primary_key=True)
    logical_operator = Column(String(10), nullable=False,
                              CheckConstraint("logical_operator IN ('AND', 'OR', 'NOT')"))
    
    # Relationships
    where_clause = relationship('WhereClause', back_populates='compound_expression')
    sub_clauses = relationship('WhereClause',
                               primaryjoin="and_(WhereClause.parent_type=='compound_expression', "
                                          "foreign(WhereClause.parent_id)==cast(WhereClauseCompoundExpression.where_clause_id, String))",
                               cascade='all, delete-orphan')


class AnalysisMethod(Base):
    __tablename__ = 'analysis_methods'
    
    id = Column(String(255), primary_key=True)
    reporting_event_id = Column(String(255), ForeignKey('reporting_events.id', ondelete='CASCADE'), 
                                nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text)
    label = Column(String(255))
    code_template = Column(Text)
    
    # Relationships
    reporting_event = relationship('ReportingEvent', back_populates='methods')
    operations = relationship('Operation', back_populates='method', cascade='all, delete-orphan')
    analyses = relationship('Analysis', back_populates='method')


# Association table for method document references
method_document_refs = Table('method_document_refs', Base.metadata,
    Column('method_id', String(255), ForeignKey('analysis_methods.id', ondelete='CASCADE'), 
           primary_key=True),
    Column('reference_document_id', String(255), ForeignKey('reference_documents.id', ondelete='CASCADE'), 
           primary_key=True),
    Column('page_refs', JSON)
)


class Operation(Base):
    __tablename__ = 'operations'
    
    id = Column(String(255), primary_key=True)
    method_id = Column(String(255), ForeignKey('analysis_methods.id', ondelete='CASCADE'), 
                       nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text)
    label = Column(String(255))
    order_num = Column(Integer, nullable=False)
    result_pattern = Column(String(255))
    
    # Relationships
    method = relationship('AnalysisMethod', back_populates='operations')
    referenced_relationships = relationship('OperationRelationship', 
                                            foreign_keys='OperationRelationship.operation_id',
                                            back_populates='operation', cascade='all, delete-orphan')
    referencing_relationships = relationship('OperationRelationship', 
                                             foreign_keys='OperationRelationship.referenced_operation_id',
                                             back_populates='referenced_operation')


class OperationRelationship(Base):
    __tablename__ = 'operation_relationships'
    
    id = Column(String(255), primary_key=True)
    operation_id = Column(String(255), ForeignKey('operations.id', ondelete='CASCADE'), 
                          nullable=False)
    referenced_operation_role = Column(String(50), nullable=False)
    referenced_operation_id = Column(String(255), ForeignKey('operations.id'), nullable=False)
    description = Column(Text)
    
    # Relationships
    operation = relationship('Operation', foreign_keys=[operation_id], 
                             back_populates='referenced_relationships')
    referenced_operation = relationship('Operation', foreign_keys=[referenced_operation_id], 
                                        back_populates='referencing_relationships')


class Analysis(Base):
    __tablename__ = 'analyses'
    
    id = Column(String(255), primary_key=True)
    reporting_event_id = Column(String(255), ForeignKey('reporting_events.id', ondelete='CASCADE'), 
                                nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text)
    label = Column(String(255))
    version = Column(String(50))
    reason = Column(String(255))
    purpose = Column(String(255))
    method_id = Column(String(255), ForeignKey('analysis_methods.id'))
    analysis_set_id = Column(String(255), ForeignKey('analysis_sets.id'))
    dataset = Column(String(255))
    variable = Column(String(255))
    category_ids = Column(ARRAY(Text))
    
    # Relationships
    reporting_event = relationship('ReportingEvent', back_populates='analyses')
    method = relationship('AnalysisMethod', back_populates='analyses')
    analysis_set = relationship('AnalysisSet', back_populates='analyses')
    ordered_groupings = relationship('OrderedGrouping', back_populates='analysis', 
                                     cascade='all, delete-orphan')
    results = relationship('AnalysisResult', back_populates='analysis', cascade='all, delete-orphan')
    list_items = relationship('ListItem', back_populates='analysis')


# Association tables
analysis_document_refs = Table('analysis_document_refs', Base.metadata,
    Column('analysis_id', String(255), ForeignKey('analyses.id', ondelete='CASCADE'), 
           primary_key=True),
    Column('reference_document_id', String(255), ForeignKey('reference_documents.id', ondelete='CASCADE'), 
           primary_key=True),
    Column('page_refs', JSON)
)

analysis_data_subsets = Table('analysis_data_subsets', Base.metadata,
    Column('analysis_id', String(255), ForeignKey('analyses.id', ondelete='CASCADE'), 
           primary_key=True),
    Column('data_subset_id', String(255), ForeignKey('data_subsets.id'), primary_key=True)
)


class OrderedGrouping(Base):
    __tablename__ = 'ordered_groupings'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    analysis_id = Column(String(255), ForeignKey('analyses.id', ondelete='CASCADE'), nullable=False)
    grouping_id = Column(String(255), ForeignKey('analysis_groupings.id'), nullable=False)
    order_num = Column(Integer, nullable=False)
    results_by_group = Column(Boolean, default=False)
    
    # Relationships
    analysis = relationship('Analysis', back_populates='ordered_groupings')
    grouping = relationship('AnalysisGrouping')


class AnalysisResult(Base):
    __tablename__ = 'analysis_results'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    analysis_id = Column(String(255), ForeignKey('analyses.id', ondelete='CASCADE'), nullable=False)
    operation_id = Column(String(255), ForeignKey('operations.id'), nullable=False)
    raw_value = Column(String(255))
    formatted_value = Column(String(255))
    
    # Relationships
    analysis = relationship('Analysis', back_populates='results')
    operation = relationship('Operation')
    result_groups = relationship('ResultGroup', back_populates='result', cascade='all, delete-orphan')


class ResultGroup(Base):
    __tablename__ = 'result_groups'
    
    result_id = Column(UUID(as_uuid=True), ForeignKey('analysis_results.id', ondelete='CASCADE'), 
                       primary_key=True)
    grouping_id = Column(String(255), primary_key=True)
    group_id = Column(String(255), primary_key=True)
    
    # Relationships
    result = relationship('AnalysisResult', back_populates='result_groups')


class Output(Base):
    __tablename__ = 'outputs'
    
    id = Column(String(255), primary_key=True)
    reporting_event_id = Column(String(255), ForeignKey('reporting_events.id', ondelete='CASCADE'), 
                                nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text)
    label = Column(String(255))
    version = Column(String(50))
    category_ids = Column(ARRAY(Text))
    
    # Relationships
    reporting_event = relationship('ReportingEvent', back_populates='outputs')
    displays = relationship('Display', back_populates='output', cascade='all, delete-orphan')
    programming_code = relationship('OutputProgrammingCode', back_populates='output', 
                                    uselist=False, cascade='all, delete-orphan')
    code_parameters = relationship('OutputCodeParameter', back_populates='output', 
                                   cascade='all, delete-orphan')
    file_specifications = relationship('OutputFileSpecification', back_populates='output', 
                                       cascade='all, delete-orphan')
    list_items = relationship('ListItem', back_populates='output')


# Association table for output document references
output_document_refs = Table('output_document_refs', Base.metadata,
    Column('output_id', String(255), ForeignKey('outputs.id', ondelete='CASCADE'), 
           primary_key=True),
    Column('reference_document_id', String(255), ForeignKey('reference_documents.id', ondelete='CASCADE'), 
           primary_key=True),
    Column('page_refs', JSON)
)


class OutputProgrammingCode(Base):
    __tablename__ = 'output_programming_code'
    
    output_id = Column(String(255), ForeignKey('outputs.id', ondelete='CASCADE'), primary_key=True)
    context = Column(String(255), nullable=False)
    code = Column(Text)
    document_ref_id = Column(String(255), ForeignKey('reference_documents.id'))
    
    # Relationships
    output = relationship('Output', back_populates='programming_code')
    document_ref = relationship('ReferenceDocument')


class OutputCodeParameter(Base):
    __tablename__ = 'output_code_parameters'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    output_id = Column(String(255), ForeignKey('outputs.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    label = Column(String(255))
    value = Column(Text, nullable=False)
    
    # Relationships
    output = relationship('Output', back_populates='code_parameters')


class Display(Base):
    __tablename__ = 'displays'
    
    id = Column(String(255), primary_key=True)
    output_id = Column(String(255), ForeignKey('outputs.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text)
    label = Column(String(255))
    version = Column(String(50))
    display_title = Column(Text)
    order_num = Column(Integer, nullable=False)
    
    # Relationships
    output = relationship('Output', back_populates='displays')
    display_sections = relationship('DisplaySection', back_populates='display', 
                                    cascade='all, delete-orphan')


class GlobalDisplaySection(Base):
    __tablename__ = 'global_display_sections'
    
    id = Column(String(255), primary_key=True)
    reporting_event_id = Column(String(255), ForeignKey('reporting_events.id', ondelete='CASCADE'), 
                                nullable=False)
    section_type = Column(String(50), nullable=False)
    section_label = Column(String(255))
    
    # Relationships
    reporting_event = relationship('ReportingEvent', back_populates='global_display_sections')


class DisplaySection(Base):
    __tablename__ = 'display_sections'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    display_id = Column(String(255), ForeignKey('displays.id', ondelete='CASCADE'), nullable=False)
    section_type = Column(String(50), nullable=False)
    order_num = Column(Integer, nullable=False)
    
    # Relationships
    display = relationship('Display', back_populates='display_sections')
    ordered_sub_sections = relationship('OrderedDisplaySubSection', back_populates='display_section', 
                                        cascade='all, delete-orphan')


class DisplaySubSection(Base):
    __tablename__ = 'display_sub_sections'
    
    id = Column(String(255), primary_key=True)
    text = Column(Text, nullable=False)
    
    # Relationships
    ordered_references = relationship('OrderedDisplaySubSection', back_populates='sub_section')


class OrderedDisplaySubSection(Base):
    __tablename__ = 'ordered_display_sub_sections'
    
    display_section_id = Column(UUID(as_uuid=True), 
                                ForeignKey('display_sections.id', ondelete='CASCADE'), 
                                primary_key=True)
    sub_section_id = Column(String(255), ForeignKey('display_sub_sections.id'))
    global_sub_section_id = Column(String(255), ForeignKey('global_display_sections.id'))
    order_num = Column(Integer, nullable=False, primary_key=True)
    
    # Relationships
    display_section = relationship('DisplaySection', back_populates='ordered_sub_sections')
    sub_section = relationship('DisplaySubSection', back_populates='ordered_references')
    global_sub_section = relationship('GlobalDisplaySection')
    
    __table_args__ = (
        CheckConstraint(
            "(sub_section_id IS NOT NULL AND global_sub_section_id IS NULL) OR "
            "(sub_section_id IS NULL AND global_sub_section_id IS NOT NULL)",
            name='check_sub_section_xor_global'
        ),
    )


class OutputFileSpecification(Base):
    __tablename__ = 'output_file_specifications'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    output_id = Column(String(255), ForeignKey('outputs.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(500), nullable=False)
    label = Column(String(255))
    file_type = Column(String(50), nullable=False)
    location = Column(Text)
    
    # Relationships
    output = relationship('Output', back_populates='file_specifications')


class ListOfContents(Base):
    __tablename__ = 'lists_of_contents'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    reporting_event_id = Column(String(255), ForeignKey('reporting_events.id', ondelete='CASCADE'), 
                                nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text)
    label = Column(String(255))
    is_main = Column(Boolean, default=False)
    
    # Relationships
    reporting_event = relationship('ReportingEvent', back_populates='lists_of_contents')
    list_items = relationship('ListItem', back_populates='list_of_contents', 
                              cascade='all, delete-orphan')


class ListItem(Base):
    __tablename__ = 'list_items'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    list_id = Column(UUID(as_uuid=True), ForeignKey('lists_of_contents.id', ondelete='CASCADE'))
    parent_item_id = Column(UUID(as_uuid=True), ForeignKey('list_items.id', ondelete='CASCADE'))
    name = Column(String(500), nullable=False)
    description = Column(Text)
    label = Column(String(255))
    level = Column(Integer, nullable=False)
    order_num = Column(Integer, nullable=False)
    analysis_id = Column(String(255), ForeignKey('analyses.id'))
    output_id = Column(String(255), ForeignKey('outputs.id'))
    
    # Relationships
    list_of_contents = relationship('ListOfContents', back_populates='list_items')
    parent_item = relationship('ListItem', remote_side=[id], backref='sub_items')
    analysis = relationship('Analysis', back_populates='list_items')
    output = relationship('Output', back_populates='list_items')
    
    __table_args__ = (
        CheckConstraint(
            "(analysis_id IS NOT NULL AND output_id IS NULL) OR "
            "(analysis_id IS NULL AND output_id IS NOT NULL) OR "
            "(analysis_id IS NULL AND output_id IS NULL)",
            name='check_analysis_xor_output'
        ),
    )


class AnalysisOutputCategorization(Base):
    __tablename__ = 'analysis_output_categorizations'
    
    id = Column(String(255), primary_key=True)
    reporting_event_id = Column(String(255), ForeignKey('reporting_events.id', ondelete='CASCADE'), 
                                nullable=False)
    label = Column(String(255))
    
    # Relationships
    reporting_event = relationship('ReportingEvent', back_populates='categorizations')
    categories = relationship('AnalysisOutputCategory', back_populates='categorization', 
                              cascade='all, delete-orphan')


class AnalysisOutputCategory(Base):
    __tablename__ = 'analysis_output_categories'
    
    id = Column(String(255), primary_key=True)
    categorization_id = Column(String(255), 
                               ForeignKey('analysis_output_categorizations.id', ondelete='CASCADE'), 
                               nullable=False)
    label = Column(String(255))
    
    # Relationships
    categorization = relationship('AnalysisOutputCategorization', back_populates='categories')


# Association table for category sub-categorizations
category_sub_categorizations = Table('category_sub_categorizations', Base.metadata,
    Column('category_id', String(255), ForeignKey('analysis_output_categories.id', ondelete='CASCADE'), 
           primary_key=True),
    Column('sub_categorization_id', String(255), ForeignKey('analysis_output_categorizations.id'), 
           primary_key=True)
)


# ============================================
# AUDIT MODEL
# ============================================

class AuditLog(Base):
    __tablename__ = 'audit_log'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    action = Column(String(50), nullable=False)
    table_name = Column(String(100), nullable=False)
    record_id = Column(String(255), nullable=False)
    old_values = Column(JSON)
    new_values = Column(JSON)
    timestamp = Column(DateTime, default=func.current_timestamp())
    
    # Relationships
    user = relationship('User')