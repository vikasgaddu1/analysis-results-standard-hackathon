import React from 'react'
import { Card, Radio, Button, Space, Alert, Typography, Divider } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { WhereClauseCompoundExpression, WhereClause, LogicalOperator } from '../../../types'
import ConditionBuilder from './ConditionBuilder'

const { Text } = Typography

interface CompoundExpressionBuilderProps {
  value: WhereClauseCompoundExpression
  onChange: (value: WhereClauseCompoundExpression) => void
  datasets?: string[]
}

const logicalOperatorOptions: { value: LogicalOperator; label: string; description: string }[] = [
  { value: 'AND', label: 'AND', description: 'All conditions must be true' },
  { value: 'OR', label: 'OR', description: 'At least one condition must be true' },
  { value: 'NOT', label: 'NOT', description: 'Negates the result of the conditions' }
]

export const CompoundExpressionBuilder: React.FC<CompoundExpressionBuilderProps> = ({
  value,
  onChange,
  datasets = []
}) => {
  const handleLogicalOperatorChange = (logicalOperator: LogicalOperator) => {
    onChange({
      ...value,
      logicalOperator
    })
  }

  const handleWhereClauseChange = (index: number, whereClause: WhereClause) => {
    const newWhereClauses = [...value.whereClauses]
    newWhereClauses[index] = whereClause
    onChange({
      ...value,
      whereClauses: newWhereClauses
    })
  }

  const handleAddWhereClause = () => {
    const newWhereClause: WhereClause = {
      condition: {
        dataset: '',
        variable: '',
        comparator: 'EQ',
        value: ['']
      }
    }
    
    onChange({
      ...value,
      whereClauses: [...value.whereClauses, newWhereClause]
    })
  }

  const handleRemoveWhereClause = (index: number) => {
    if (value.whereClauses.length <= 1) return // Ensure at least one clause
    
    const newWhereClauses = value.whereClauses.filter((_, i) => i !== index)
    onChange({
      ...value,
      whereClauses: newWhereClauses
    })
  }

  const canRemoveClause = value.whereClauses.length > 1
  const selectedOperator = logicalOperatorOptions.find(op => op.value === value.logicalOperator)

  const renderExpressionPreview = () => {
    if (value.whereClauses.length === 0) return 'No conditions'
    
    const conditionPreviews = value.whereClauses.map((clause, index) => {
      if (clause.condition) {
        const { dataset, variable, comparator, value: condValue } = clause.condition
        const valueStr = Array.isArray(condValue) ? condValue.join(', ') : condValue
        return `${dataset || '[dataset]'}.${variable || '[variable]'} ${comparator} ${valueStr || '[value]'}`
      }
      return `Clause ${index + 1}`
    })

    if (value.logicalOperator === 'NOT') {
      return `NOT (${conditionPreviews.join(' AND ')})`
    }
    
    return conditionPreviews.join(` ${value.logicalOperator} `)
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Text strong>Logical Operator:</Text>
        <Radio.Group
          value={value.logicalOperator}
          onChange={(e) => handleLogicalOperatorChange(e.target.value)}
          style={{ marginLeft: '12px' }}
        >
          {logicalOperatorOptions.map(option => (
            <Radio key={option.value} value={option.value}>
              <div>
                <Text strong>{option.label}</Text>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {option.description}
                </div>
              </div>
            </Radio>
          ))}
        </Radio.Group>
      </div>

      {selectedOperator && (
        <Alert
          message={`Using ${selectedOperator.label} operator`}
          description={selectedOperator.description}
          type="info"
          style={{ marginBottom: '16px' }}
        />
      )}

      <div style={{ marginBottom: '16px' }}>
        <Text strong>Conditions ({value.whereClauses.length}):</Text>
        {value.logicalOperator === 'NOT' && value.whereClauses.length > 1 && (
          <Alert
            message="Note about NOT operator"
            description="When using NOT, all conditions will be grouped together and then negated."
            type="warning"
            style={{ marginTop: '8px' }}
            size="small"
          />
        )}
      </div>

      {value.whereClauses.map((whereClause, index) => (
        <Card 
          key={index}
          size="small" 
          style={{ marginBottom: '12px' }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Condition {index + 1}</Text>
              <Button
                size="small"
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleRemoveWhereClause(index)}
                disabled={!canRemoveClause}
                title={canRemoveClause ? 'Remove condition' : 'At least one condition is required'}
              >
                Remove
              </Button>
            </div>
          }
        >
          {whereClause.condition ? (
            <ConditionBuilder
              value={whereClause.condition}
              onChange={(condition) => handleWhereClauseChange(index, { condition })}
              datasets={datasets}
            />
          ) : (
            <Alert
              message="Nested compound expressions are not supported in this interface"
              description="This condition contains a nested compound expression. Use the JSON editor for complex nested conditions."
              type="warning"
            />
          )}
        </Card>
      ))}

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={handleAddWhereClause}
        style={{ width: '100%', marginBottom: '16px' }}
      >
        Add Condition
      </Button>

      <Divider />

      <div style={{ marginTop: '16px' }}>
        <Text strong>Expression Preview:</Text>
        <div style={{ 
          marginTop: '8px',
          padding: '12px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          wordBreak: 'break-all'
        }}>
          <Text type="secondary">
            {renderExpressionPreview()}
          </Text>
        </div>
      </div>
    </div>
  )
}

export default CompoundExpressionBuilder