import React, { useState } from 'react'
import { Card, Radio, Button, Space, Alert, Typography } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { WhereClause, WhereClauseCondition, WhereClauseCompoundExpression, LogicalOperator } from '../../../types'
import ConditionBuilder from './ConditionBuilder'
import CompoundExpressionBuilder from './CompoundExpressionBuilder'

const { Text } = Typography

interface WhereClauseBuilderProps {
  value?: WhereClause
  onChange: (value: WhereClause | undefined) => void
  datasets?: string[]
  title?: string
  description?: string
}

type ClauseType = 'condition' | 'compound' | 'none'

export const WhereClauseBuilder: React.FC<WhereClauseBuilderProps> = ({
  value,
  onChange,
  datasets = [],
  title = "Where Clause",
  description = "Define conditions to filter data"
}) => {
  const getClauseType = (): ClauseType => {
    if (!value) return 'none'
    if (value.condition) return 'condition'
    if (value.compoundExpression) return 'compound'
    return 'none'
  }

  const [clauseType, setClauseType] = useState<ClauseType>(getClauseType())

  const handleTypeChange = (type: ClauseType) => {
    setClauseType(type)
    
    switch (type) {
      case 'none':
        onChange(undefined)
        break
      case 'condition':
        onChange({
          condition: {
            dataset: '',
            variable: '',
            comparator: 'EQ',
            value: ['']
          }
        })
        break
      case 'compound':
        onChange({
          compoundExpression: {
            logicalOperator: 'AND',
            whereClauses: [
              {
                condition: {
                  dataset: '',
                  variable: '',
                  comparator: 'EQ',
                  value: ['']
                }
              }
            ]
          }
        })
        break
    }
  }

  const handleConditionChange = (condition: WhereClauseCondition) => {
    onChange({ condition })
  }

  const handleCompoundExpressionChange = (compoundExpression: WhereClauseCompoundExpression) => {
    onChange({ compoundExpression })
  }

  return (
    <Card title={title} size="small">
      {description && (
        <Alert
          message={description}
          type="info"
          style={{ marginBottom: '16px' }}
          showIcon
        />
      )}

      <div style={{ marginBottom: '16px' }}>
        <Text strong>Condition Type:</Text>
        <Radio.Group
          value={clauseType}
          onChange={(e) => handleTypeChange(e.target.value)}
          style={{ marginLeft: '12px' }}
        >
          <Radio value="none">No Condition</Radio>
          <Radio value="condition">Simple Condition</Radio>
          <Radio value="compound">Complex Expression</Radio>
        </Radio.Group>
      </div>

      {clauseType === 'condition' && value?.condition && (
        <ConditionBuilder
          value={value.condition}
          onChange={handleConditionChange}
          datasets={datasets}
        />
      )}

      {clauseType === 'compound' && value?.compoundExpression && (
        <CompoundExpressionBuilder
          value={value.compoundExpression}
          onChange={handleCompoundExpressionChange}
          datasets={datasets}
        />
      )}

      {clauseType === 'none' && (
        <Alert
          message="No condition specified"
          description="No filtering conditions will be applied. All records will be included."
          type="warning"
          showIcon
        />
      )}

      {datasets.length === 0 && clauseType !== 'none' && (
        <Alert
          message="No datasets available"
          description="Dataset information is not available. You may need to specify datasets manually."
          type="warning"
          showIcon
          style={{ marginTop: '16px' }}
        />
      )}
    </Card>
  )
}

export default WhereClauseBuilder