/**
 * Service for Where Clause API operations
 */

import { api } from './api'
import { WhereClause, WhereClauseCondition, WhereClauseCompoundExpression } from '../types'

export interface WhereClauseCreateRequest {
  parent_type: string
  parent_id: string
  level: number
  order_num: number
  clause_type: 'condition' | 'compound_expression'
  condition?: {
    dataset: string
    variable: string
    comparator: string
    value_array: string[]
  }
  compound_expression?: {
    logical_operator: string
  }
}

export interface ValidationResult {
  is_valid: boolean
  errors: string[]
  warnings: string[]
}

export interface WhereClauseTemplate {
  id: string
  name: string
  description: string
  tags: string[]
  clause_type: string
  condition?: any
  compound_expression?: any
  created_at: string
}

export interface WhereClauseStatistics {
  total_clauses: number
  condition_clauses: number
  compound_clauses: number
  most_used_datasets: Array<{ dataset: string; count: number }>
  most_used_variables: Array<{ variable: string; count: number }>
}

export interface CDISCDataset {
  name: string
  label: string
  domain: string
  description: string
}

export interface CDISCVariable {
  name: string
  label: string
  type: string
  data_type: string
}

class WhereClauseService {
  private baseUrl = '/api/v1/where-clauses'

  /**
   * Create a new where clause
   */
  async createWhereClause(data: WhereClauseCreateRequest): Promise<WhereClause> {
    const response = await api.post(`${this.baseUrl}/`, data)
    return response.data
  }

  /**
   * Get a specific where clause by ID
   */
  async getWhereClause(id: string): Promise<WhereClause> {
    const response = await api.get(`${this.baseUrl}/${id}`)
    return response.data
  }

  /**
   * Get all where clauses for a parent entity
   */
  async getWhereClausesByParent(parentType: string, parentId: string): Promise<WhereClause[]> {
    const response = await api.get(`${this.baseUrl}/`, {
      params: {
        parent_type: parentType,
        parent_id: parentId
      }
    })
    return response.data
  }

  /**
   * Update where clause condition
   */
  async updateWhereClauseCondition(
    id: string, 
    condition: WhereClauseCondition
  ): Promise<WhereClause> {
    const response = await api.put(`${this.baseUrl}/${id}/condition`, condition)
    return response.data
  }

  /**
   * Update where clause compound expression
   */
  async updateWhereClauseCompoundExpression(
    id: string, 
    expression: WhereClauseCompoundExpression
  ): Promise<WhereClause> {
    const response = await api.put(`${this.baseUrl}/${id}/compound-expression`, expression)
    return response.data
  }

  /**
   * Delete a where clause
   */
  async deleteWhereClause(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`)
  }

  /**
   * Clone a where clause to a new parent
   */
  async cloneWhereClause(
    id: string,
    newParentType: string,
    newParentId: string,
    newLevel: number,
    newOrderNum: number
  ): Promise<WhereClause> {
    const response = await api.post(`${this.baseUrl}/${id}/clone`, null, {
      params: {
        new_parent_type: newParentType,
        new_parent_id: newParentId,
        new_level: newLevel,
        new_order_num: newOrderNum
      }
    })
    return response.data
  }

  /**
   * Validate a where clause condition
   */
  async validateCondition(condition: WhereClauseCondition): Promise<ValidationResult> {
    const response = await api.post(`${this.baseUrl}/validate`, condition)
    return response.data
  }

  /**
   * Get template where clauses
   */
  async getTemplateWhereClauses(
    dataset?: string,
    variable?: string,
    limit: number = 20
  ): Promise<WhereClause[]> {
    const response = await api.get(`${this.baseUrl}/templates/`, {
      params: {
        dataset,
        variable,
        limit
      }
    })
    return response.data
  }

  /**
   * Search where clauses
   */
  async searchWhereClauses(
    searchTerm: string,
    parentType?: string,
    limit: number = 50
  ): Promise<WhereClause[]> {
    const response = await api.get(`${this.baseUrl}/search/`, {
      params: {
        q: searchTerm,
        parent_type: parentType,
        limit
      }
    })
    return response.data
  }

  /**
   * Get where clause statistics
   */
  async getStatistics(parentType?: string): Promise<WhereClauseStatistics> {
    const response = await api.get(`${this.baseUrl}/statistics/`, {
      params: {
        parent_type: parentType
      }
    })
    return response.data
  }

  // Library methods
  /**
   * Save where clause as template
   */
  async saveAsTemplate(
    whereClauseId: string,
    name: string,
    description: string,
    tags: string[] = []
  ): Promise<{ success: boolean; template_id?: string; error?: string }> {
    const response = await api.post(`${this.baseUrl}/library/templates/`, null, {
      params: {
        where_clause_id: whereClauseId,
        name,
        description,
        tags
      }
    })
    return response.data
  }

  /**
   * Get saved templates
   */
  async getTemplates(
    tags?: string[],
    search?: string
  ): Promise<WhereClauseTemplate[]> {
    const response = await api.get(`${this.baseUrl}/library/templates/`, {
      params: {
        tags,
        search
      }
    })
    return response.data
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    await api.delete(`${this.baseUrl}/library/templates/${templateId}`)
  }

  /**
   * Apply a template to create new where clause
   */
  async applyTemplate(
    templateId: string,
    parentType: string,
    parentId: string,
    level: number,
    orderNum: number
  ): Promise<WhereClause> {
    const response = await api.post(`${this.baseUrl}/library/templates/${templateId}/apply`, null, {
      params: {
        parent_type: parentType,
        parent_id: parentId,
        level,
        order_num: orderNum
      }
    })
    return response.data
  }

  // CDISC metadata methods
  /**
   * Get CDISC datasets
   */
  async getCDISCDatasets(domain?: string): Promise<CDISCDataset[]> {
    const response = await api.get(`${this.baseUrl}/datasets/`, {
      params: { domain }
    })
    return response.data
  }

  /**
   * Get variables for a dataset
   */
  async getDatasetVariables(
    datasetName: string,
    variableType?: string
  ): Promise<CDISCVariable[]> {
    const response = await api.get(`${this.baseUrl}/datasets/${datasetName}/variables`, {
      params: { variable_type: variableType }
    })
    return response.data
  }

  /**
   * Get possible values for a variable
   */
  async getVariableValues(
    datasetName: string,
    variableName: string,
    limit: number = 100
  ): Promise<string[]> {
    const response = await api.get(
      `${this.baseUrl}/datasets/${datasetName}/variables/${variableName}/values`,
      {
        params: { limit }
      }
    )
    return response.data
  }

  /**
   * Test expression against sample data
   */
  async testExpression(
    whereClause: WhereClause,
    sampleData?: any[]
  ): Promise<{
    success: boolean
    matched_records: number
    total_records: number
    sample_matches: any[]
    errors?: string[]
  }> {
    // This would be implemented when backend supports expression testing
    // For now, return mock data
    return {
      success: true,
      matched_records: Math.floor(Math.random() * 100),
      total_records: 1000,
      sample_matches: [
        { USUBJID: 'SUBJ001', DATASET: 'DM', VARIABLE: 'AGE', VALUE: '25' },
        { USUBJID: 'SUBJ002', DATASET: 'DM', VARIABLE: 'AGE', VALUE: '30' }
      ]
    }
  }

  /**
   * Get auto-completion suggestions for variable values
   */
  async getAutoCompleteSuggestions(
    dataset: string,
    variable: string,
    query: string,
    limit: number = 10
  ): Promise<string[]> {
    try {
      const allValues = await this.getVariableValues(dataset, variable, 100)
      return allValues
        .filter(value => 
          value.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit)
    } catch (error) {
      console.warn('Failed to get auto-complete suggestions:', error)
      return []
    }
  }

  /**
   * Export where clauses to various formats
   */
  async exportWhereClauses(
    parentType: string,
    parentId: string,
    format: 'json' | 'yaml' | 'sas' | 'r' = 'json'
  ): Promise<{ content: string; filename: string }> {
    // This would be implemented when backend supports export
    const whereClauses = await this.getWhereClausesByParent(parentType, parentId)
    
    let content: string
    let filename: string
    
    switch (format) {
      case 'json':
        content = JSON.stringify(whereClauses, null, 2)
        filename = `where_clauses_${parentId}.json`
        break
      case 'yaml':
        // Would use yaml library in real implementation
        content = JSON.stringify(whereClauses, null, 2)
        filename = `where_clauses_${parentId}.yaml`
        break
      case 'sas':
        content = this.generateSASCode(whereClauses)
        filename = `where_clauses_${parentId}.sas`
        break
      case 'r':
        content = this.generateRCode(whereClauses)
        filename = `where_clauses_${parentId}.R`
        break
      default:
        content = JSON.stringify(whereClauses, null, 2)
        filename = `where_clauses_${parentId}.json`
    }
    
    return { content, filename }
  }

  /**
   * Generate SAS code from where clauses
   */
  private generateSASCode(whereClauses: WhereClause[]): string {
    let sasCode = "/* Generated WHERE clauses for SAS */\n\n"
    
    whereClauses.forEach((clause, index) => {
      sasCode += `/* Where Clause ${index + 1} */\n`
      if (clause.condition) {
        const { dataset, variable, comparator, value } = clause.condition
        const values = Array.isArray(value) ? value : [value]
        
        let condition = ''
        switch (comparator) {
          case 'EQ':
            condition = `${variable} = "${values[0]}"`
            break
          case 'NE':
            condition = `${variable} ne "${values[0]}"`
            break
          case 'IN':
            condition = `${variable} in (${values.map(v => `"${v}"`).join(', ')})`
            break
          case 'NOTIN':
            condition = `${variable} not in (${values.map(v => `"${v}"`).join(', ')})`
            break
          default:
            condition = `${variable} ${comparator} "${values[0]}"`
        }
        
        sasCode += `where ${condition};\n\n`
      }
    })
    
    return sasCode
  }

  /**
   * Generate R code from where clauses
   */
  private generateRCode(whereClauses: WhereClause[]): string {
    let rCode = "# Generated WHERE clauses for R\n\n"
    
    whereClauses.forEach((clause, index) => {
      rCode += `# Where Clause ${index + 1}\n`
      if (clause.condition) {
        const { dataset, variable, comparator, value } = clause.condition
        const values = Array.isArray(value) ? value : [value]
        
        let condition = ''
        switch (comparator) {
          case 'EQ':
            condition = `${dataset}$${variable} == "${values[0]}"`
            break
          case 'NE':
            condition = `${dataset}$${variable} != "${values[0]}"`
            break
          case 'IN':
            condition = `${dataset}$${variable} %in% c(${values.map(v => `"${v}"`).join(', ')})`
            break
          case 'NOTIN':
            condition = `!(${dataset}$${variable} %in% c(${values.map(v => `"${v}"`).join(', ')}))`
            break
          default:
            condition = `${dataset}$${variable} ${comparator} "${values[0]}"`
        }
        
        rCode += `filtered_data <- subset(${dataset}, ${condition})\n\n`
      }
    })
    
    return rCode
  }
}

export const whereClauseService = new WhereClauseService()