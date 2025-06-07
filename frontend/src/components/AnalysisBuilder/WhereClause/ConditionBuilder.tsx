import React, { useState, useEffect } from 'react'
import { Row, Col, Input, Select, Button, Space, Tag, Typography } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { WhereClauseCondition, ConditionComparator } from '../../../types'
import VariableSelector from './VariableSelector'

const { Option } = Select
const { Text } = Typography

interface ConditionBuilderProps {
  value: WhereClauseCondition
  onChange: (value: WhereClauseCondition) => void
  datasets?: string[]
}

const comparatorOptions: { value: ConditionComparator; label: string; description: string }[] = [
  { value: 'EQ', label: 'Equals (=)', description: 'Equal to' },
  { value: 'NE', label: 'Not Equals (≠)', description: 'Not equal to' },
  { value: 'GT', label: 'Greater Than (>)', description: 'Greater than' },
  { value: 'LT', label: 'Less Than (<)', description: 'Less than' },
  { value: 'GE', label: 'Greater or Equal (≥)', description: 'Greater than or equal to' },
  { value: 'LE', label: 'Less or Equal (≤)', description: 'Less than or equal to' },
  { value: 'IN', label: 'In List', description: 'Value is in the list' },
  { value: 'NOTIN', label: 'Not In List', description: 'Value is not in the list' }
]

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  value,
  onChange,
  datasets = []
}) => {
  const [newValue, setNewValue] = useState('')

  const handleDatasetChange = (dataset: string) => {
    onChange({
      ...value,
      dataset,
      variable: '' // Reset variable when dataset changes
    })
  }

  const handleVariableChange = (variable: string) => {
    onChange({
      ...value,
      variable
    })
  }

  const handleComparatorChange = (comparator: ConditionComparator) => {
    // If switching to/from multi-value comparators, adjust values array
    const isMultiValue = ['IN', 'NOTIN'].includes(comparator)
    const wasMultiValue = ['IN', 'NOTIN'].includes(value.comparator)
    
    let newValues = value.value
    
    if (isMultiValue && !wasMultiValue) {
      // Switching to multi-value: ensure we have at least one value
      newValues = value.value.length > 0 ? value.value : ['']
    } else if (!isMultiValue && wasMultiValue) {
      // Switching from multi-value: take first value only
      newValues = value.value.length > 0 ? [value.value[0]] : ['']
    }

    onChange({
      ...value,
      comparator,
      value: newValues
    })
  }

  const handleValueChange = (index: number, val: string) => {
    const newValues = [...value.value]
    newValues[index] = val
    onChange({
      ...value,
      value: newValues
    })
  }

  const handleAddValue = () => {
    const newValues = [...value.value, newValue || '']
    onChange({
      ...value,
      value: newValues
    })
    setNewValue('')
  }

  const handleRemoveValue = (index: number) => {
    const newValues = value.value.filter((_, i) => i !== index)
    onChange({
      ...value,
      value: newValues.length > 0 ? newValues : [''] // Ensure at least one value
    })
  }

  const isMultiValueComparator = ['IN', 'NOTIN'].includes(value.comparator)
  const selectedComparator = comparatorOptions.find(c => c.value === value.comparator)

  return (
    <div>
      <Row gutter={[12, 12]}>
        <Col span={8}>
          <Text strong>Dataset:</Text>
          <VariableSelector
            type="dataset"
            value={value.dataset}
            onChange={handleDatasetChange}
            datasets={datasets}
            placeholder="Enter dataset name"
          />
        </Col>

        <Col span={8}>
          <Text strong>Variable:</Text>
          <VariableSelector
            type="variable"
            value={value.variable}
            onChange={handleVariableChange}
            dataset={value.dataset}
            placeholder="Enter variable name"
          />
        </Col>

        <Col span={8}>
          <Text strong>Comparator:</Text>
          <Select
            value={value.comparator}
            onChange={handleComparatorChange}
            style={{ width: '100%' }}
            placeholder="Select comparator"
          >
            {comparatorOptions.map(option => (
              <Option key={option.value} value={option.value}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{option.label}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {option.description}
                  </div>
                </div>
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Row style={{ marginTop: '12px' }}>
        <Col span={24}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Text strong>Value(s):</Text>
            {selectedComparator && (
              <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
                ({selectedComparator.description})
              </Text>
            )}
          </div>

          {isMultiValueComparator ? (
            <div>
              <div style={{ marginBottom: '8px' }}>
                {value.value.map((val, index) => (
                  <Tag
                    key={index}
                    closable={value.value.length > 1}
                    onClose={() => handleRemoveValue(index)}
                    style={{ marginBottom: '4px' }}
                  >
                    <Input
                      size="small"
                      value={val}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      style={{ 
                        border: 'none', 
                        padding: 0, 
                        backgroundColor: 'transparent',
                        width: Math.max(60, val.length * 8)
                      }}
                      placeholder="Value"
                    />
                  </Tag>
                ))}
              </div>
              <Space>
                <Input
                  size="small"
                  placeholder="Add new value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onPressEnter={handleAddValue}
                  style={{ width: '120px' }}
                />
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleAddValue}
                  disabled={!newValue.trim()}
                >
                  Add
                </Button>
              </Space>
            </div>
          ) : (
            <Input
              value={value.value[0] || ''}
              onChange={(e) => handleValueChange(0, e.target.value)}
              placeholder="Enter comparison value"
              style={{ width: '200px' }}
            />
          )}
        </Col>
      </Row>

      <Row style={{ marginTop: '16px' }}>
        <Col span={24}>
          <div style={{ 
            padding: '8px 12px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            <Text type="secondary">
              Preview: {value.dataset || '[dataset]'}.{value.variable || '[variable]'} {value.comparator} {
                isMultiValueComparator 
                  ? `(${value.value.filter(v => v.trim()).join(', ')})` 
                  : (value.value[0] || '[value]')
              }
            </Text>
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default ConditionBuilder