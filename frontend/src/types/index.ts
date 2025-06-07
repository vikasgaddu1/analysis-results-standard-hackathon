// Common types matching the ARS model

export interface NamedObject {
  id: string
  name: string
  label?: string
  description?: string
}

export interface ReportingEvent extends NamedObject {
  version?: string
  referenceDocumentId?: string
  analysisSets?: AnalysisSet[]
  dataSubsets?: DataSubset[]
  analysisGroupings?: GroupingFactor[]
  methods?: AnalysisMethod[]
  analyses?: Analysis[]
  globalDisplaySections?: GlobalDisplaySection[]
  outputs?: Output[]
}

export interface AnalysisSet extends NamedObject {
  condition?: WhereClause
  order?: number
}

export interface DataSubset extends NamedObject {
  condition?: WhereClause
  order?: number
}

export interface WhereClause {
  condition?: WhereClauseCondition
  compoundExpression?: WhereClauseCompoundExpression
}

export interface WhereClauseCondition {
  dataset: string
  variable: string
  comparator: ConditionComparator
  value: string[]
}

export interface WhereClauseCompoundExpression {
  logicalOperator: LogicalOperator
  whereClauses: WhereClause[]
}

export type ConditionComparator = 'EQ' | 'NE' | 'GT' | 'LT' | 'GE' | 'LE' | 'IN' | 'NOTIN'
export type LogicalOperator = 'AND' | 'OR' | 'NOT'

export interface GroupingFactor extends NamedObject {
  groupingDataset?: string
  groupingVariable?: string
  groups: Group[]
}

export interface Group extends NamedObject {
  condition?: WhereClause
  order?: number
}

export interface AnalysisMethod extends NamedObject {
  operations: Operation[]
  codeTemplate?: AnalysisProgrammingCodeTemplate
}

export interface Operation extends NamedObject {
  order: number
  resultPattern?: string
  referencedOperationRelationships?: ReferencedOperationRelationship[]
}

export interface ReferencedOperationRelationship extends NamedObject {
  referencedOperationRole: ExtensibleTerminologyTerm
  operationId: string
  analysisId?: string
}

export interface ExtensibleTerminologyTerm {
  controlledTerm?: string
  sponsorTermId?: string
}

export interface AnalysisProgrammingCodeTemplate extends NamedObject {
  context?: string
  code?: string
  parameters?: TemplateCodeParameter[]
}

export interface TemplateCodeParameter extends NamedObject {
  valueSource?: string
  value?: string[]
}

export interface Analysis extends NamedObject {
  version?: string
  reason: ExtensibleTerminologyTerm
  purpose: ExtensibleTerminologyTerm
  documentRefs?: DocumentReference[]
  categoryIds?: string[]
  analysisSetId?: string
  dataSubsetId?: string
  orderedGroupings?: OrderedGroupingFactor[]
  methodId: string
  referencedAnalysisOperations?: ReferencedAnalysisOperation[]
  programmingCode?: AnalysisOutputProgrammingCode
  results?: OperationResult[]
}

export interface DocumentReference {
  referenceDocumentId: string
  pageRefs?: PageRef[]
}

export interface PageRef {
  refType: PageRefType
  pageNames?: string[]
  pageNumbers?: string[]
  firstPage?: string
  lastPage?: string
}

export type PageRefType = 'PhysicalRef' | 'NamedDestination'

export interface OrderedGroupingFactor {
  order: number
  groupingId: string
  resultsByGroup: boolean
}

export interface ReferencedAnalysisOperation {
  referencedOperationRelationshipId: string
  analysisId: string
}

export interface AnalysisOutputProgrammingCode {
  context?: string
  code?: string
  documentRef?: DocumentReference
  parameters?: AnalysisOutputCodeParameter[]
}

export interface AnalysisOutputCodeParameter extends NamedObject {
  value: string[]
}

export interface OperationResult extends NamedObject {
  operationId: string
  resultGroups?: ResultGroup[]
}

export interface ResultGroup {
  groupingId?: string
  groupId?: string
  rawValue?: string
  formattedValue?: string
}

export interface Output extends NamedObject {
  version?: string
  fileSpecifications?: OutputFile[]
  displays: OutputDisplay[]
}

export interface OutputFile {
  name?: string
  fileType?: ExtensibleTerminologyTerm
  location?: string
  style?: string
}

export interface OutputDisplay extends NamedObject {
  version?: string
  displayTitle?: string
  order: number
  displaySections: DisplaySection[]
}

export interface DisplaySection {
  sectionType: DisplaySectionType
  orderedSubSections?: OrderedDisplaySubSection[]
}

export type DisplaySectionType = 'Header' | 'Title' | 'Rowlabel' | 'Body' | 'Footer' | 'Footnote' | 'Abbreviation' | 'Legend'

export interface OrderedDisplaySubSection {
  order: number
  subSection: DisplaySubSection
  subSectionId?: string
}

export interface DisplaySubSection {
  id?: string
  text?: string
}

export interface GlobalDisplaySection extends NamedObject {
  sectionType: DisplaySectionType[]
  subSections: DisplaySubSection[]
}

// Method Library specific types (exported from service)
export type {
  AnalysisMethod as MethodLibraryMethod,
  AnalysisMethodCreate,
  AnalysisMethodUpdate,
  MethodTemplate,
  MethodParameter,
  ValidationResult,
  UsageStatistics,
  MethodQueryParams,
  TemplateParameter,
  CodeTemplate as MethodCodeTemplate
} from '../services/methodService';

// Template Management types
export type {
  Template,
  TemplateCategory,
  TemplateVersion,
  TemplateUsage,
  TemplateRating,
  TemplateType,
  TemplateStatus,
  TemplateAccessLevel,
  TemplateFormData,
  CategoryFormData,
  VersionFormData,
  RatingFormData,
  TemplateFilters,
  TemplateSortOptions,
  ShareOptions,
  TemplateExportData,
  TemplateImportOptions,
  TemplateUIState,
  TemplateParameter as TemplateParam,
  TemplateParameterConfig,
  TemplateValidationResult,
  TemplateAnalytics,
  TemplateNotification,
  User,
  Team,
  Organization
} from './template';

// API Response types
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface ApiError {
  detail: string
  status?: number
  type?: string
}

// Form types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'boolean'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  rules?: any[]
}