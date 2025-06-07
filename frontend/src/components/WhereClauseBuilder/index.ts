/**
 * WhereClauseBuilder Component Library
 * 
 * Enhanced where clause functionality with advanced features:
 * - AdvancedWhereClauseBuilder: Main component with tabs and full feature set
 * - DatasetVariableExplorer: Browse CDISC datasets and variables
 * - ConditionValidator: Real-time validation of conditions
 * - WhereClauseLibrary: Save and reuse common where clauses
 * - ExpressionTester: Test expressions against sample data
 */

export { default as AdvancedWhereClauseBuilder } from './AdvancedWhereClauseBuilder'
export { default as DatasetVariableExplorer } from './DatasetVariableExplorer'
export { default as ConditionValidator } from './ConditionValidator'
export { default as WhereClauseLibrary } from './WhereClauseLibrary'
export { default as ExpressionTester } from './ExpressionTester'

// Re-export types for convenience
export type {
  WhereClauseCreateRequest,
  ValidationResult,
  WhereClauseTemplate,
  WhereClauseStatistics,
  CDISCDataset,
  CDISCVariable
} from '../../services/whereClauseService'

export type {
  ConditionSummary,
  CompoundExpressionSummary,
  WhereClauseSummary
} from '../../utils/whereClauseUtils'