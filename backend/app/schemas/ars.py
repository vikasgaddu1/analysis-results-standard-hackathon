"""
Pydantic schemas for Clinical Trial Table Metadata System
Based on CDISC Analysis Results Standard (ARS) v1.0
"""

from datetime import datetime
from typing import List, Optional, Union, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict
from pydantic.types import Json


# ============================================
# BASE SCHEMAS
# ============================================

class ARSBase(BaseModel):
    """Base schema for ARS entities"""
    model_config = ConfigDict(from_attributes=True)


class TimestampMixin(BaseModel):
    """Mixin for timestamps"""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ============================================
# USER MANAGEMENT SCHEMAS
# ============================================

class UserBase(ARSBase):
    email: str = Field(..., max_length=255)
    full_name: str = Field(..., max_length=255)
    role: str = Field(..., pattern="^(admin|editor|viewer)$")
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(ARSBase):
    email: Optional[str] = Field(None, max_length=255)
    full_name: Optional[str] = Field(None, max_length=255)
    role: Optional[str] = Field(None, pattern="^(admin|editor|viewer)$")
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8)


class User(UserBase, TimestampMixin):
    id: UUID
    last_login: Optional[datetime] = None


class UserSessionBase(ARSBase):
    expires_at: datetime


class UserSession(UserSessionBase):
    id: UUID
    user_id: UUID
    created_at: datetime


# ============================================
# REFERENCE AND METADATA SCHEMAS
# ============================================

class ReferenceDocumentBase(ARSBase):
    id: str = Field(..., max_length=255)
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    location: str


class ReferenceDocumentCreate(ReferenceDocumentBase):
    reporting_event_id: str = Field(..., max_length=255)


class ReferenceDocument(ReferenceDocumentBase):
    reporting_event_id: str


class PageRef(ARSBase):
    """Page reference schema for associations"""
    ref_type: str
    page_names: Optional[List[str]] = None
    page_numbers: Optional[List[int]] = None
    first_page: Optional[int] = None
    last_page: Optional[int] = None


class SponsorTermBase(ARSBase):
    id: str = Field(..., max_length=255)
    submission_value: str = Field(..., max_length=255)
    description: Optional[str] = None


class SponsorTermCreate(SponsorTermBase):
    terminology_extension_id: str = Field(..., max_length=255)


class SponsorTerm(SponsorTermBase):
    terminology_extension_id: str


class TerminologyExtensionBase(ARSBase):
    id: str = Field(..., max_length=255)
    enumeration: str = Field(..., max_length=255)


class TerminologyExtensionCreate(TerminologyExtensionBase):
    reporting_event_id: str = Field(..., max_length=255)
    sponsor_terms: Optional[List[SponsorTermCreate]] = []


class TerminologyExtension(TerminologyExtensionBase):
    reporting_event_id: str
    sponsor_terms: List[SponsorTerm] = []


# ============================================
# WHERE CLAUSE SCHEMAS
# ============================================

class WhereClauseConditionBase(ARSBase):
    dataset: str = Field(..., max_length=255)
    variable: str = Field(..., max_length=255)
    comparator: str = Field(..., pattern="^(EQ|NE|GT|LT|GE|LE|IN|NOTIN|CONTAINS)$")
    value_array: Optional[List[str]] = []


class WhereClauseCondition(WhereClauseConditionBase):
    where_clause_id: UUID


class WhereClauseCompoundExpressionBase(ARSBase):
    logical_operator: str = Field(..., pattern="^(AND|OR|NOT)$")


class WhereClauseCompoundExpression(WhereClauseCompoundExpressionBase):
    where_clause_id: UUID


class WhereClauseBase(ARSBase):
    level: int
    order_num: int
    clause_type: str = Field(..., pattern="^(condition|compound_expression)$")


class WhereClauseCreate(WhereClauseBase):
    parent_type: str = Field(..., max_length=50)
    parent_id: str = Field(..., max_length=255)
    condition: Optional[WhereClauseConditionBase] = None
    compound_expression: Optional[WhereClauseCompoundExpressionBase] = None


class WhereClause(WhereClauseBase):
    id: UUID
    parent_type: str
    parent_id: str
    condition: Optional[WhereClauseCondition] = None
    compound_expression: Optional[WhereClauseCompoundExpression] = None


# ============================================
# ANALYSIS SET AND DATA SUBSET SCHEMAS
# ============================================

class AnalysisSetBase(ARSBase):
    id: str = Field(..., max_length=255)
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    level: int
    order_num: int


class AnalysisSetCreate(AnalysisSetBase):
    reporting_event_id: str = Field(..., max_length=255)
    where_clauses: Optional[List[WhereClauseCreate]] = []


class AnalysisSet(AnalysisSetBase):
    reporting_event_id: str
    where_clauses: List[WhereClause] = []


class DataSubsetBase(ARSBase):
    id: str = Field(..., max_length=255)
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    level: int
    order_num: int


class DataSubsetCreate(DataSubsetBase):
    reporting_event_id: str = Field(..., max_length=255)
    where_clauses: Optional[List[WhereClauseCreate]] = []


class DataSubset(DataSubsetBase):
    reporting_event_id: str
    where_clauses: List[WhereClause] = []


# ============================================
# GROUPING SCHEMAS
# ============================================

class GroupBase(ARSBase):
    id: str = Field(..., max_length=255)
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    level: int
    order_num: int


class GroupCreate(GroupBase):
    grouping_id: str = Field(..., max_length=255)
    where_clauses: Optional[List[WhereClauseCreate]] = []


class Group(GroupBase):
    grouping_id: str
    where_clauses: List[WhereClause] = []


class AnalysisGroupingBase(ARSBase):
    id: str = Field(..., max_length=255)
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    grouping_dataset: Optional[str] = Field(None, max_length=255)
    grouping_variable: Optional[str] = Field(None, max_length=255)
    data_driven: bool = False


class AnalysisGroupingCreate(AnalysisGroupingBase):
    reporting_event_id: str = Field(..., max_length=255)
    groups: Optional[List[GroupCreate]] = []


class AnalysisGrouping(AnalysisGroupingBase):
    reporting_event_id: str
    groups: List[Group] = []


class OrderedGroupingBase(ARSBase):
    order_num: int
    results_by_group: bool = False


class OrderedGroupingCreate(OrderedGroupingBase):
    analysis_id: str = Field(..., max_length=255)
    grouping_id: str = Field(..., max_length=255)


class OrderedGrouping(OrderedGroupingBase):
    id: UUID
    analysis_id: str
    grouping_id: str


# ============================================
# METHOD AND OPERATION SCHEMAS
# ============================================

class OperationRelationshipBase(ARSBase):
    id: str = Field(..., max_length=255)
    referenced_operation_role: str = Field(..., max_length=50)
    referenced_operation_id: str = Field(..., max_length=255)
    description: Optional[str] = None


class OperationRelationshipCreate(OperationRelationshipBase):
    operation_id: str = Field(..., max_length=255)


class OperationRelationshipUpdate(ARSBase):
    referenced_operation_role: Optional[str] = Field(None, max_length=50)
    referenced_operation_id: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None


class OperationRelationship(OperationRelationshipBase):
    operation_id: str


class OperationBase(ARSBase):
    id: str = Field(..., max_length=255)
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    order_num: int
    result_pattern: Optional[str] = Field(None, max_length=255)


class OperationCreate(OperationBase):
    method_id: str = Field(..., max_length=255)
    referenced_relationships: Optional[List[OperationRelationshipCreate]] = []


class OperationUpdate(ARSBase):
    name: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    order_num: Optional[int] = None
    result_pattern: Optional[str] = Field(None, max_length=255)


class Operation(OperationBase):
    method_id: str
    referenced_relationships: List[OperationRelationship] = []


class AnalysisMethodBase(ARSBase):
    id: str = Field(..., max_length=255)
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    code_template: Optional[str] = None


class AnalysisMethodCreate(AnalysisMethodBase):
    reporting_event_id: str = Field(..., max_length=255)
    operations: Optional[List[OperationCreate]] = []
    document_refs: Optional[Dict[str, List[PageRef]]] = {}


class AnalysisMethodUpdate(ARSBase):
    name: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    code_template: Optional[str] = None


class AnalysisMethod(AnalysisMethodBase):
    reporting_event_id: str
    operations: List[Operation] = []


# ============================================
# ANALYSIS SCHEMAS
# ============================================

class ResultGroupBase(ARSBase):
    grouping_id: str = Field(..., max_length=255)
    group_id: str = Field(..., max_length=255)


class ResultGroup(ResultGroupBase):
    result_id: UUID


class AnalysisResultBase(ARSBase):
    raw_value: Optional[str] = Field(None, max_length=255)
    formatted_value: Optional[str] = Field(None, max_length=255)


class AnalysisResultCreate(AnalysisResultBase):
    analysis_id: str = Field(..., max_length=255)
    operation_id: str = Field(..., max_length=255)
    result_groups: Optional[List[ResultGroupBase]] = []


class AnalysisResult(AnalysisResultBase):
    id: UUID
    analysis_id: str
    operation_id: str
    result_groups: List[ResultGroup] = []


class AnalysisBase(ARSBase):
    id: str = Field(..., max_length=255)
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    version: Optional[str] = Field(None, max_length=50)
    reason: Optional[str] = Field(None, max_length=255)
    purpose: Optional[str] = Field(None, max_length=255)
    dataset: Optional[str] = Field(None, max_length=255)
    variable: Optional[str] = Field(None, max_length=255)
    category_ids: Optional[List[str]] = []


class AnalysisCreate(AnalysisBase):
    reporting_event_id: str = Field(..., max_length=255)
    method_id: Optional[str] = Field(None, max_length=255)
    analysis_set_id: Optional[str] = Field(None, max_length=255)
    ordered_groupings: Optional[List[OrderedGroupingCreate]] = []
    data_subset_ids: Optional[List[str]] = []
    document_refs: Optional[Dict[str, List[PageRef]]] = {}


class Analysis(AnalysisBase):
    reporting_event_id: str
    method_id: Optional[str] = None
    analysis_set_id: Optional[str] = None
    ordered_groupings: List[OrderedGrouping] = []
    results: List[AnalysisResult] = []


# ============================================
# OUTPUT AND DISPLAY SCHEMAS
# ============================================

class OutputCodeParameterBase(ARSBase):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    value: str


class OutputCodeParameterCreate(OutputCodeParameterBase):
    output_id: str = Field(..., max_length=255)


class OutputCodeParameter(OutputCodeParameterBase):
    id: UUID
    output_id: str


class OutputProgrammingCodeBase(ARSBase):
    context: str = Field(..., max_length=255)
    code: Optional[str] = None
    document_ref_id: Optional[str] = Field(None, max_length=255)


class OutputProgrammingCodeCreate(OutputProgrammingCodeBase):
    output_id: str = Field(..., max_length=255)


class OutputProgrammingCode(OutputProgrammingCodeBase):
    output_id: str


class OutputFileSpecificationBase(ARSBase):
    name: str = Field(..., max_length=500)
    label: Optional[str] = Field(None, max_length=255)
    file_type: str = Field(..., max_length=50)
    location: Optional[str] = None


class OutputFileSpecificationCreate(OutputFileSpecificationBase):
    output_id: str = Field(..., max_length=255)


class OutputFileSpecification(OutputFileSpecificationBase):
    id: UUID
    output_id: str


class DisplaySubSectionBase(ARSBase):
    id: str = Field(..., max_length=255)
    text: str


class DisplaySubSection(DisplaySubSectionBase):
    pass


class OrderedDisplaySubSectionBase(ARSBase):
    order_num: int
    sub_section_id: Optional[str] = Field(None, max_length=255)
    global_sub_section_id: Optional[str] = Field(None, max_length=255)


class OrderedDisplaySubSection(OrderedDisplaySubSectionBase):
    display_section_id: UUID


class DisplaySectionBase(ARSBase):
    section_type: str = Field(..., max_length=50)
    order_num: int


class DisplaySectionCreate(DisplaySectionBase):
    display_id: str = Field(..., max_length=255)
    ordered_sub_sections: Optional[List[OrderedDisplaySubSectionBase]] = []


class DisplaySection(DisplaySectionBase):
    id: UUID
    display_id: str
    ordered_sub_sections: List[OrderedDisplaySubSection] = []


class GlobalDisplaySectionBase(ARSBase):
    id: str = Field(..., max_length=255)
    section_type: str = Field(..., max_length=50)
    section_label: Optional[str] = Field(None, max_length=255)


class GlobalDisplaySectionCreate(GlobalDisplaySectionBase):
    reporting_event_id: str = Field(..., max_length=255)


class GlobalDisplaySection(GlobalDisplaySectionBase):
    reporting_event_id: str


class DisplayBase(ARSBase):
    id: str = Field(..., max_length=255)
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    version: Optional[str] = Field(None, max_length=50)
    display_title: Optional[str] = None
    order_num: int


class DisplayCreate(DisplayBase):
    output_id: str = Field(..., max_length=255)
    display_sections: Optional[List[DisplaySectionCreate]] = []


class Display(DisplayBase):
    output_id: str
    display_sections: List[DisplaySection] = []


class OutputBase(ARSBase):
    id: str = Field(..., max_length=255)
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    version: Optional[str] = Field(None, max_length=50)
    category_ids: Optional[List[str]] = []


class OutputCreate(OutputBase):
    reporting_event_id: str = Field(..., max_length=255)
    displays: Optional[List[DisplayCreate]] = []
    programming_code: Optional[OutputProgrammingCodeCreate] = None
    code_parameters: Optional[List[OutputCodeParameterCreate]] = []
    file_specifications: Optional[List[OutputFileSpecificationCreate]] = []
    document_refs: Optional[Dict[str, List[PageRef]]] = {}


class Output(OutputBase):
    reporting_event_id: str
    displays: List[Display] = []
    programming_code: Optional[OutputProgrammingCode] = None
    code_parameters: List[OutputCodeParameter] = []
    file_specifications: List[OutputFileSpecification] = []


# ============================================
# LIST OF CONTENTS SCHEMAS
# ============================================

class ListItemBase(ARSBase):
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    level: int
    order_num: int
    analysis_id: Optional[str] = Field(None, max_length=255)
    output_id: Optional[str] = Field(None, max_length=255)


class ListItemCreate(ListItemBase):
    list_id: Optional[UUID] = None
    parent_item_id: Optional[UUID] = None


class ListItem(ListItemBase):
    id: UUID
    list_id: Optional[UUID] = None
    parent_item_id: Optional[UUID] = None
    sub_items: List['ListItem'] = []


class ListOfContentsBase(ARSBase):
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    is_main: bool = False


class ListOfContentsCreate(ListOfContentsBase):
    reporting_event_id: str = Field(..., max_length=255)
    list_items: Optional[List[ListItemCreate]] = []


class ListOfContents(ListOfContentsBase):
    id: UUID
    reporting_event_id: str
    list_items: List[ListItem] = []


# ============================================
# CATEGORIZATION SCHEMAS
# ============================================

class AnalysisOutputCategoryBase(ARSBase):
    id: str = Field(..., max_length=255)
    label: Optional[str] = Field(None, max_length=255)


class AnalysisOutputCategoryCreate(AnalysisOutputCategoryBase):
    categorization_id: str = Field(..., max_length=255)
    sub_categorization_ids: Optional[List[str]] = []


class AnalysisOutputCategory(AnalysisOutputCategoryBase):
    categorization_id: str


class AnalysisOutputCategorizationBase(ARSBase):
    id: str = Field(..., max_length=255)
    label: Optional[str] = Field(None, max_length=255)


class AnalysisOutputCategorizationCreate(AnalysisOutputCategorizationBase):
    reporting_event_id: str = Field(..., max_length=255)
    categories: Optional[List[AnalysisOutputCategoryCreate]] = []


class AnalysisOutputCategorization(AnalysisOutputCategorizationBase):
    reporting_event_id: str
    categories: List[AnalysisOutputCategory] = []


# ============================================
# MAIN REPORTING EVENT SCHEMA
# ============================================

class ReportingEventBase(ARSBase):
    id: str = Field(..., max_length=255)
    name: str = Field(..., max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    version: Optional[str] = Field(None, max_length=50)
    is_locked: bool = False
    parent_id: Optional[str] = Field(None, max_length=255)


class ReportingEventCreate(ReportingEventBase):
    created_by: Optional[UUID] = None
    reference_documents: Optional[List[ReferenceDocumentCreate]] = []
    terminology_extensions: Optional[List[TerminologyExtensionCreate]] = []
    analysis_sets: Optional[List[AnalysisSetCreate]] = []
    data_subsets: Optional[List[DataSubsetCreate]] = []
    analysis_groupings: Optional[List[AnalysisGroupingCreate]] = []
    methods: Optional[List[AnalysisMethodCreate]] = []
    analyses: Optional[List[AnalysisCreate]] = []
    outputs: Optional[List[OutputCreate]] = []
    global_display_sections: Optional[List[GlobalDisplaySectionCreate]] = []
    lists_of_contents: Optional[List[ListOfContentsCreate]] = []
    categorizations: Optional[List[AnalysisOutputCategorizationCreate]] = []


class ReportingEventUpdate(ARSBase):
    name: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    label: Optional[str] = Field(None, max_length=255)
    version: Optional[str] = Field(None, max_length=50)
    is_locked: Optional[bool] = None


class ReportingEvent(ReportingEventBase, TimestampMixin):
    created_by: Optional[UUID] = None
    reference_documents: List[ReferenceDocument] = []
    terminology_extensions: List[TerminologyExtension] = []
    analysis_sets: List[AnalysisSet] = []
    data_subsets: List[DataSubset] = []
    analysis_groupings: List[AnalysisGrouping] = []
    methods: List[AnalysisMethod] = []
    analyses: List[Analysis] = []
    outputs: List[Output] = []
    global_display_sections: List[GlobalDisplaySection] = []
    lists_of_contents: List[ListOfContents] = []
    categorizations: List[AnalysisOutputCategorization] = []


# ============================================
# AUDIT SCHEMAS
# ============================================

class AuditLogBase(ARSBase):
    action: str = Field(..., max_length=50)
    table_name: str = Field(..., max_length=100)
    record_id: str = Field(..., max_length=255)
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None


class AuditLog(AuditLogBase):
    id: UUID
    user_id: Optional[UUID] = None
    timestamp: datetime


# ============================================
# AUTHENTICATION SCHEMAS
# ============================================

class Token(ARSBase):
    access_token: str
    token_type: str
    expires_in: int
    user: Dict[str, Any]


class TokenPayload(ARSBase):
    sub: Optional[str] = None


# ============================================
# COMMON RESPONSE SCHEMAS
# ============================================

class MessageResponse(ARSBase):
    message: str


class PaginationMetadata(ARSBase):
    total_count: int
    page_size: int
    current_page: int
    total_pages: int
    has_next: bool
    has_previous: bool


class PaginatedResponse(ARSBase):
    data: List[Any]
    pagination: PaginationMetadata


# Update forward references
ListItem.model_rebuild()