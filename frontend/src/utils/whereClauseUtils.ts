/**
 * Utility functions for Where Clause operations
 */

import { WhereClause, WhereClauseCondition, WhereClauseCompoundExpression, LogicalOperator } from '../types'

export interface ConditionSummary {
  type: 'condition'
  dataset: string
  variable: string
  comparator: string
  values: string[]
  description: string
}

export interface CompoundExpressionSummary {
  type: 'compound'
  operator: LogicalOperator
  subClauses: number
  description: string
}

export type WhereClauseSummary = ConditionSummary | CompoundExpressionSummary

/**
 * Comparator options for where clause conditions
 */
export const COMPARATOR_OPTIONS = [
  { value: 'EQ', label: 'Equal to (=)', description: 'Exact match' },
  { value: 'NE', label: 'Not equal to (≠)', description: 'Does not match' },
  { value: 'GT', label: 'Greater than (>)', description: 'Numeric or date comparison' },
  { value: 'LT', label: 'Less than (<)', description: 'Numeric or date comparison' },
  { value: 'GE', label: 'Greater than or equal (≥)', description: 'Numeric or date comparison' },
  { value: 'LE', label: 'Less than or equal (≤)', description: 'Numeric or date comparison' },
  { value: 'IN', label: 'In list', description: 'Matches any value in list' },
  { value: 'NOTIN', label: 'Not in list', description: 'Does not match any value in list' },
  { value: 'CONTAINS', label: 'Contains', description: 'Text contains substring' }
] as const

/**
 * Logical operator options for compound expressions
 */
export const LOGICAL_OPERATOR_OPTIONS = [
  { value: 'AND', label: 'AND', description: 'All conditions must be true' },
  { value: 'OR', label: 'OR', description: 'At least one condition must be true' },
  { value: 'NOT', label: 'NOT', description: 'Inverts the condition result' }
] as const

/**
 * Get a human-readable description of a where clause
 */
export const getWhereClauseDescription = (whereClause: WhereClause): string => {
  if (whereClause.condition) {
    return getConditionDescription(whereClause.condition)
  }
  
  if (whereClause.compoundExpression) {
    return getCompoundExpressionDescription(whereClause.compoundExpression)
  }
  
  return 'Empty where clause'
}

/**
 * Get a human-readable description of a condition
 */
export const getConditionDescription = (condition: WhereClauseCondition): string => {
  const { dataset, variable, comparator, value } = condition
  const values = Array.isArray(value) ? value : [value]
  
  const comparatorText = COMPARATOR_OPTIONS.find(opt => opt.value === comparator)?.label || comparator
  
  switch (comparator) {
    case 'EQ':
      return `${dataset}.${variable} = "${values[0]}"`
    case 'NE':
      return `${dataset}.${variable} ≠ "${values[0]}"`
    case 'GT':
      return `${dataset}.${variable} > "${values[0]}"`
    case 'LT':
      return `${dataset}.${variable} < "${values[0]}"`
    case 'GE':
      return `${dataset}.${variable} ≥ "${values[0]}"`
    case 'LE':
      return `${dataset}.${variable} ≤ "${values[0]}"`
    case 'IN':
      return `${dataset}.${variable} in [${values.map(v => `"${v}"`).join(', ')}]`
    case 'NOTIN':
      return `${dataset}.${variable} not in [${values.map(v => `"${v}"`).join(', ')}]`
    case 'CONTAINS':
      return `${dataset}.${variable} contains "${values[0]}"`
    default:
      return `${dataset}.${variable} ${comparator} "${values[0]}"`
  }
}

/**
 * Get a human-readable description of a compound expression
 */
export const getCompoundExpressionDescription = (expression: WhereClauseCompoundExpression): string => {
  const { logicalOperator } = expression
  
  switch (logicalOperator) {
    case 'AND':
      return 'All sub-conditions must be true'
    case 'OR':
      return 'At least one sub-condition must be true'
    case 'NOT':
      return 'Inverts the result of sub-conditions'
    default:
      return `${logicalOperator} expression`
  }
}

/**
 * Validate a where clause condition
 */
export const validateCondition = (condition: WhereClauseCondition): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} => {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Required field validation
  if (!condition.dataset?.trim()) {
    errors.push('Dataset is required')
  }
  
  if (!condition.variable?.trim()) {
    errors.push('Variable is required')
  }
  
  if (!condition.comparator) {
    errors.push('Comparator is required')
  }
  
  const values = Array.isArray(condition.value) ? condition.value : [condition.value]
  if (!values.length || values.every(v => !v?.trim())) {
    errors.push('At least one value is required')
  }
  
  // Comparator-specific validation
  if (condition.comparator) {
    const nonEmptyValues = values.filter(v => v?.trim())
    
    switch (condition.comparator) {
      case 'IN':
      case 'NOTIN':
        if (nonEmptyValues.length === 1) {
          warnings.push(`Using ${condition.comparator} with single value - consider using EQ/NE instead`)
        }
        break
      
      case 'EQ':
      case 'NE':
      case 'GT':
      case 'LT':
      case 'GE':
      case 'LE':
      case 'CONTAINS':
        if (nonEmptyValues.length > 1) {
          warnings.push(`Using ${condition.comparator} with multiple values - only first value will be used`)
        }
        break
    }
    
    // Numeric validation for comparison operators
    if (['GT', 'LT', 'GE', 'LE'].includes(condition.comparator)) {
      const firstValue = nonEmptyValues[0]
      if (firstValue && isNaN(Number(firstValue)) && !isValidDate(firstValue)) {
        warnings.push('Comparison operators work best with numeric or date values')
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Check if a string is a valid date
 */
export const isValidDate = (value: string): boolean => {
  if (!value) return false
  
  // Check common date formats
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/ // MM-DD-YYYY
  ]
  
  return datePatterns.some(pattern => pattern.test(value)) && !isNaN(Date.parse(value))
}

/**
 * Generate a summary of a where clause
 */
export const getWhereClauseSummary = (whereClause: WhereClause): WhereClauseSummary => {
  if (whereClause.condition) {
    const condition = whereClause.condition
    const values = Array.isArray(condition.value) ? condition.value : [condition.value]
    
    return {
      type: 'condition',
      dataset: condition.dataset,
      variable: condition.variable,
      comparator: condition.comparator,
      values: values.filter(v => v?.trim()),
      description: getConditionDescription(condition)
    }
  }
  
  if (whereClause.compoundExpression) {
    return {
      type: 'compound',
      operator: whereClause.compoundExpression.logicalOperator as LogicalOperator,
      subClauses: 0, // Would need to count actual sub-clauses
      description: getCompoundExpressionDescription(whereClause.compoundExpression)
    }
  }
  
  return {
    type: 'condition',
    dataset: '',
    variable: '',
    comparator: 'EQ',
    values: [],
    description: 'Empty condition'
  }
}

/**
 * Convert where clause to different programming language syntax
 */
export const convertToLanguage = (
  whereClause: WhereClause, 
  language: 'sas' | 'r' | 'python' | 'sql'
): string => {
  if (!whereClause.condition) {
    return '/* Complex expression - manual conversion required */'
  }
  
  const condition = whereClause.condition
  const { dataset, variable, comparator, value } = condition
  const values = Array.isArray(value) ? value : [value]
  
  switch (language) {
    case 'sas':
      return convertToSAS(dataset, variable, comparator, values)
    case 'r':
      return convertToR(dataset, variable, comparator, values)
    case 'python':
      return convertToPython(dataset, variable, comparator, values)
    case 'sql':
      return convertToSQL(dataset, variable, comparator, values)
    default:
      return 'Unsupported language'
  }
}

/**
 * Convert condition to SAS syntax
 */
const convertToSAS = (dataset: string, variable: string, comparator: string, values: string[]): string => {
  const quotedValues = values.map(v => `"${v}"`)
  
  switch (comparator) {
    case 'EQ':
      return `where ${variable} = ${quotedValues[0]};`
    case 'NE':
      return `where ${variable} ne ${quotedValues[0]};`
    case 'GT':
      return `where ${variable} > ${quotedValues[0]};`
    case 'LT':
      return `where ${variable} < ${quotedValues[0]};`
    case 'GE':
      return `where ${variable} >= ${quotedValues[0]};`
    case 'LE':
      return `where ${variable} <= ${quotedValues[0]};`
    case 'IN':
      return `where ${variable} in (${quotedValues.join(', ')});`
    case 'NOTIN':
      return `where ${variable} not in (${quotedValues.join(', ')});`
    case 'CONTAINS':
      return `where index(upcase(${variable}), upcase(${quotedValues[0]})) > 0;`
    default:
      return `where ${variable} ${comparator} ${quotedValues[0]};`
  }
}

/**
 * Convert condition to R syntax
 */
const convertToR = (dataset: string, variable: string, comparator: string, values: string[]): string => {
  const quotedValues = values.map(v => `"${v}"`)
  
  switch (comparator) {
    case 'EQ':
      return `${dataset}$${variable} == ${quotedValues[0]}`
    case 'NE':
      return `${dataset}$${variable} != ${quotedValues[0]}`
    case 'GT':
      return `${dataset}$${variable} > ${quotedValues[0]}`
    case 'LT':
      return `${dataset}$${variable} < ${quotedValues[0]}`
    case 'GE':
      return `${dataset}$${variable} >= ${quotedValues[0]}`
    case 'LE':
      return `${dataset}$${variable} <= ${quotedValues[0]}`
    case 'IN':
      return `${dataset}$${variable} %in% c(${quotedValues.join(', ')})`
    case 'NOTIN':
      return `!(${dataset}$${variable} %in% c(${quotedValues.join(', ')}))`
    case 'CONTAINS':
      return `grepl(${quotedValues[0]}, ${dataset}$${variable}, ignore.case = TRUE)`
    default:
      return `${dataset}$${variable} ${comparator} ${quotedValues[0]}`
  }
}

/**
 * Convert condition to Python pandas syntax
 */
const convertToPython = (dataset: string, variable: string, comparator: string, values: string[]): string => {
  const quotedValues = values.map(v => `"${v}"`)
  
  switch (comparator) {
    case 'EQ':
      return `${dataset}['${variable}'] == ${quotedValues[0]}`
    case 'NE':
      return `${dataset}['${variable}'] != ${quotedValues[0]}`
    case 'GT':
      return `${dataset}['${variable}'] > ${quotedValues[0]}`
    case 'LT':
      return `${dataset}['${variable}'] < ${quotedValues[0]}`
    case 'GE':
      return `${dataset}['${variable}'] >= ${quotedValues[0]}`
    case 'LE':
      return `${dataset}['${variable}'] <= ${quotedValues[0]}`
    case 'IN':
      return `${dataset}['${variable}'].isin([${quotedValues.join(', ')}])`
    case 'NOTIN':
      return `~${dataset}['${variable}'].isin([${quotedValues.join(', ')}])`
    case 'CONTAINS':
      return `${dataset}['${variable}'].str.contains(${quotedValues[0]}, case=False, na=False)`
    default:
      return `${dataset}['${variable}'] ${comparator} ${quotedValues[0]}`
  }
}

/**
 * Convert condition to SQL syntax
 */
const convertToSQL = (dataset: string, variable: string, comparator: string, values: string[]): string => {
  const quotedValues = values.map(v => `'${v}'`)
  
  switch (comparator) {
    case 'EQ':
      return `${variable} = ${quotedValues[0]}`
    case 'NE':
      return `${variable} <> ${quotedValues[0]}`
    case 'GT':
      return `${variable} > ${quotedValues[0]}`
    case 'LT':
      return `${variable} < ${quotedValues[0]}`
    case 'GE':
      return `${variable} >= ${quotedValues[0]}`
    case 'LE':
      return `${variable} <= ${quotedValues[0]}`
    case 'IN':
      return `${variable} IN (${quotedValues.join(', ')})`
    case 'NOTIN':
      return `${variable} NOT IN (${quotedValues.join(', ')})`
    case 'CONTAINS':
      return `UPPER(${variable}) LIKE UPPER('%${values[0]}%')`
    default:
      return `${variable} ${comparator} ${quotedValues[0]}`
  }
}

/**
 * Generate code snippets for where clauses
 */
export const generateCodeSnippets = (whereClauses: WhereClause[]): Record<string, string> => {
  const conditions = whereClauses
    .filter(wc => wc.condition)
    .map(wc => wc.condition!)
  
  if (conditions.length === 0) {
    return {
      sas: '/* No conditions defined */',
      r: '# No conditions defined',
      python: '# No conditions defined',
      sql: '-- No conditions defined'
    }
  }
  
  return {
    sas: generateSASCode(conditions),
    r: generateRCode(conditions),
    python: generatePythonCode(conditions),
    sql: generateSQLCode(conditions)
  }
}

/**
 * Generate SAS code for multiple conditions
 */
const generateSASCode = (conditions: WhereClauseCondition[]): string => {
  const clauses = conditions.map(condition => {
    const { dataset, variable, comparator, value } = condition
    const values = Array.isArray(value) ? value : [value]
    return convertToSAS(dataset, variable, comparator, values).replace(/^where\s+/, '').replace(/;$/, '')
  })
  
  return `data filtered;\n  set input_data;\n  where ${clauses.join(' and ')};\nrun;`
}

/**
 * Generate R code for multiple conditions
 */
const generateRCode = (conditions: WhereClauseCondition[]): string => {
  const clauses = conditions.map(condition => {
    const { dataset, variable, comparator, value } = condition
    const values = Array.isArray(value) ? value : [value]
    return convertToR(dataset, variable, comparator, values)
  })
  
  const dataset = conditions[0]?.dataset || 'data'
  return `filtered_data <- ${dataset}[${clauses.join(' & ')}, ]`
}

/**
 * Generate Python code for multiple conditions
 */
const generatePythonCode = (conditions: WhereClauseCondition[]): string => {
  const clauses = conditions.map(condition => {
    const { dataset, variable, comparator, value } = condition
    const values = Array.isArray(value) ? value : [value]
    return convertToPython(dataset, variable, comparator, values)
  })
  
  const dataset = conditions[0]?.dataset || 'data'
  return `filtered_data = ${dataset}[${clauses.join(' & ')}]`
}

/**
 * Generate SQL code for multiple conditions
 */
const generateSQLCode = (conditions: WhereClauseCondition[]): string => {
  const clauses = conditions.map(condition => {
    const { dataset, variable, comparator, value } = condition
    const values = Array.isArray(value) ? value : [value]
    return convertToSQL(dataset, variable, comparator, values)
  })
  
  const dataset = conditions[0]?.dataset || 'table_name'
  return `SELECT * FROM ${dataset}\nWHERE ${clauses.join(' AND ')};`
}

/**
 * Parse and clean input values
 */
export const parseInputValues = (input: string): string[] => {
  if (!input?.trim()) return []
  
  // Split by common delimiters and clean
  return input
    .split(/[,;\n\t]+/)
    .map(value => value.trim())
    .filter(value => value.length > 0)
    .map(value => {
      // Remove surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1)
      }
      return value
    })
}

/**
 * Format values for display
 */
export const formatValuesForDisplay = (values: string[], maxDisplay: number = 5): string => {
  if (!values.length) return 'No values'
  
  const displayValues = values.slice(0, maxDisplay)
  const remaining = values.length - maxDisplay
  
  let result = displayValues.map(v => `"${v}"`).join(', ')
  
  if (remaining > 0) {
    result += ` and ${remaining} more...`
  }
  
  return result
}

/**
 * Check if two where clauses are equivalent
 */
export const areWhereClausesEqual = (clause1: WhereClause, clause2: WhereClause): boolean => {
  // Compare conditions
  if (clause1.condition && clause2.condition) {
    const c1 = clause1.condition
    const c2 = clause2.condition
    
    return (
      c1.dataset === c2.dataset &&
      c1.variable === c2.variable &&
      c1.comparator === c2.comparator &&
      JSON.stringify(c1.value) === JSON.stringify(c2.value)
    )
  }
  
  // Compare compound expressions
  if (clause1.compoundExpression && clause2.compoundExpression) {
    return clause1.compoundExpression.logicalOperator === clause2.compoundExpression.logicalOperator
  }
  
  // Both empty
  return !clause1.condition && !clause1.compoundExpression && 
         !clause2.condition && !clause2.compoundExpression
}

/**
 * Suggest improvements for a where clause
 */
export const suggestImprovements = (whereClause: WhereClause): string[] => {
  const suggestions: string[] = []
  
  if (whereClause.condition) {
    const condition = whereClause.condition
    const validation = validateCondition(condition)
    
    // Add validation warnings as suggestions
    suggestions.push(...validation.warnings)
    
    // Performance suggestions
    if (condition.comparator === 'CONTAINS') {
      suggestions.push('Consider using exact matches (EQ/IN) for better performance when possible')
    }
    
    if (condition.comparator === 'IN' && Array.isArray(condition.value) && condition.value.length > 10) {
      suggestions.push('Large IN lists may impact performance - consider breaking into smaller chunks')
    }
    
    // Data quality suggestions
    if (condition.variable.toLowerCase().includes('date') && condition.comparator === 'EQ') {
      suggestions.push('Consider using date ranges (GE/LE) instead of exact date matches')
    }
  }
  
  return suggestions
}

/**
 * Export utilities
 */
export const whereClauseUtils = {
  getWhereClauseDescription,
  getConditionDescription,
  getCompoundExpressionDescription,
  validateCondition,
  isValidDate,
  getWhereClauseSummary,
  convertToLanguage,
  generateCodeSnippets,
  parseInputValues,
  formatValuesForDisplay,
  areWhereClausesEqual,
  suggestImprovements,
  COMPARATOR_OPTIONS,
  LOGICAL_OPERATOR_OPTIONS
}