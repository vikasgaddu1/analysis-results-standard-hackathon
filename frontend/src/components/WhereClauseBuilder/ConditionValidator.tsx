import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Alert,
  Space,
  Typography,
  Button,
  Spin,
  Collapse,
  Tag,
  List,
  Row,
  Col,
  Divider,
  Tooltip,
  Progress
} from 'antd'
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  BugOutlined,
  CodeOutlined,
  ReloadOutlined
} from '@ant-design/icons'

import { WhereClause, WhereClauseCondition } from '../../types'
import { useWhereClauseValidation } from '../../hooks/useWhereClause'
import { whereClauseUtils, ValidationResult } from '../../utils/whereClauseUtils'

const { Text, Title, Paragraph } = Typography
const { Panel } = Collapse

interface ConditionValidatorProps {
  whereClause?: WhereClause | null
  onValidationChange?: (result: ValidationResult) => void
  autoValidate?: boolean
  showSuggestions?: boolean
  showCodeGeneration?: boolean
}

interface ValidationSummary {
  total: number
  valid: number
  warnings: number
  errors: number
  score: number
}

export const ConditionValidator: React.FC<ConditionValidatorProps> = ({
  whereClause,
  onValidationChange,
  autoValidate = true,
  showSuggestions = true,
  showCodeGeneration = true
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [codeSnippets, setCodeSnippets] = useState<Record<string, string>>({})
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null)

  const { validateCondition, validating } = useWhereClauseValidation()

  const runValidation = useCallback(async () => {
    if (!whereClause?.condition) {
      setValidationResult(null)
      setValidationSummary(null)
      return
    }

    const result = await validateCondition('current', whereClause.condition)
    
    if (result) {
      setValidationResult(result)
      onValidationChange?.(result)
      
      // Generate suggestions
      const improvements = whereClauseUtils.suggestImprovements(whereClause)
      setSuggestions(improvements)
      
      // Generate code snippets
      if (showCodeGeneration) {
        const snippets = whereClauseUtils.generateCodeSnippets([whereClause])
        setCodeSnippets(snippets)
      }
      
      // Calculate validation summary
      const summary: ValidationSummary = {
        total: 1,
        valid: result.is_valid ? 1 : 0,
        warnings: result.warnings.length,
        errors: result.errors.length,
        score: result.is_valid ? (result.warnings.length === 0 ? 100 : 80) : 20
      }
      setValidationSummary(summary)
    }
  }, [whereClause, validateCondition, onValidationChange, showCodeGeneration])

  useEffect(() => {
    if (autoValidate && whereClause?.condition) {
      runValidation()
    }
  }, [autoValidate, whereClause, runValidation])

  const renderValidationStatus = () => {
    if (!validationResult) {
      return (
        <Alert
          message="No validation data"
          description="Select a where clause with a condition to validate"
          type="info"
          showIcon
        />
      )
    }

    const { is_valid, errors, warnings } = validationResult

    return (
      <div>
        <div style={{ marginBottom: '16px' }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  {is_valid ? (
                    <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                  ) : (
                    <CloseCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
                  )}
                  <div style={{ marginTop: '8px' }}>
                    <Text strong>{is_valid ? 'Valid' : 'Invalid'}</Text>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    size={50}
                    percent={validationSummary?.score || 0}
                    status={is_valid ? 'success' : 'exception'}
                  />
                  <div style={{ marginTop: '8px' }}>
                    <Text strong>Quality Score</Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {errors.length > 0 && (
          <Alert
            message="Validation Errors"
            description={
              <List
                size="small"
                dataSource={errors}
                renderItem={(error) => (
                  <List.Item>
                    <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                    {error}
                  </List.Item>
                )}
              />
            }
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {warnings.length > 0 && (
          <Alert
            message="Validation Warnings"
            description={
              <List
                size="small"
                dataSource={warnings}
                renderItem={(warning) => (
                  <List.Item>
                    <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                    {warning}
                  </List.Item>
                )}
              />
            }
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {is_valid && errors.length === 0 && warnings.length === 0 && (
          <Alert
            message="Perfect Condition"
            description="Your where clause condition is valid and follows best practices."
            type="success"
            showIcon
          />
        )}
      </div>
    )
  }

  const renderConditionAnalysis = () => {
    if (!whereClause?.condition) return null

    const condition = whereClause.condition
    const summary = whereClauseUtils.getWhereClauseSummary(whereClause)
    
    return (
      <Card size="small" title="Condition Analysis" style={{ marginBottom: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Dataset: </Text>
            <Tag color="blue">{condition.dataset}</Tag>
          </div>
          <div>
            <Text strong>Variable: </Text>
            <Tag color="green">{condition.variable}</Tag>
          </div>
          <div>
            <Text strong>Comparator: </Text>
            <Tag color="orange">{condition.comparator}</Tag>
            <Tooltip title={whereClauseUtils.COMPARATOR_OPTIONS.find(opt => opt.value === condition.comparator)?.description}>
              <InfoCircleOutlined style={{ marginLeft: '4px' }} />
            </Tooltip>
          </div>
          <div>
            <Text strong>Values: </Text>
            {Array.isArray(condition.value) ? (
              <Space wrap>
                {condition.value.map((value, index) => (
                  <Tag key={index} color="purple">{value}</Tag>
                ))}
              </Space>
            ) : (
              <Tag color="purple">{condition.value}</Tag>
            )}
          </div>
          <div>
            <Text strong>Description: </Text>
            <Text code style={{ fontSize: '12px' }}>{summary.description}</Text>
          </div>
        </Space>
      </Card>
    )
  }

  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) return null

    return (
      <Card size="small" title="Improvement Suggestions" style={{ marginBottom: '16px' }}>
        <List
          size="small"
          dataSource={suggestions}
          renderItem={(suggestion, index) => (
            <List.Item>
              <Space>
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                <Text>{suggestion}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    )
  }

  const renderCodeGeneration = () => {
    if (!showCodeGeneration || Object.keys(codeSnippets).length === 0) return null

    return (
      <Collapse ghost>
        <Panel 
          header={
            <Space>
              <CodeOutlined />
              <Text strong>Generated Code</Text>
            </Space>
          } 
          key="code"
        >
          <Row gutter={[16, 16]}>
            {Object.entries(codeSnippets).map(([language, code]) => (
              <Col span={12} key={language}>
                <Card 
                  size="small" 
                  title={language.toUpperCase()}
                  extra={
                    <Button
                      size="small"
                      onClick={() => navigator.clipboard.writeText(code)}
                    >
                      Copy
                    </Button>
                  }
                >
                  <pre style={{ 
                    fontSize: '12px', 
                    margin: 0, 
                    maxHeight: '200px', 
                    overflow: 'auto',
                    backgroundColor: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px'
                  }}>
                    {code}
                  </pre>
                </Card>
              </Col>
            ))}
          </Row>
        </Panel>
      </Collapse>
    )
  }

  const renderValidationDetails = () => {
    if (!validationResult) return null

    const details = [
      { label: 'Dataset Check', value: whereClause?.condition?.dataset ? 'Pass' : 'Fail', status: whereClause?.condition?.dataset ? 'success' : 'error' },
      { label: 'Variable Check', value: whereClause?.condition?.variable ? 'Pass' : 'Fail', status: whereClause?.condition?.variable ? 'success' : 'error' },
      { label: 'Comparator Check', value: whereClause?.condition?.comparator ? 'Pass' : 'Fail', status: whereClause?.condition?.comparator ? 'success' : 'error' },
      { label: 'Value Check', value: whereClause?.condition?.value && (Array.isArray(whereClause.condition.value) ? whereClause.condition.value.length > 0 : true) ? 'Pass' : 'Fail', status: whereClause?.condition?.value ? 'success' : 'error' }
    ]

    return (
      <Card size="small" title="Detailed Validation" style={{ marginBottom: '16px' }}>
        <List
          size="small"
          dataSource={details}
          renderItem={(detail) => (
            <List.Item>
              <Space>
                {detail.status === 'success' ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                )}
                <Text>{detail.label}: </Text>
                <Tag color={detail.status === 'success' ? 'green' : 'red'}>
                  {detail.value}
                </Tag>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    )
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <BugOutlined />
            Condition Validator
            {validationSummary && (
              <Tag color={validationSummary.score >= 80 ? 'green' : validationSummary.score >= 60 ? 'orange' : 'red'}>
                Score: {validationSummary.score}%
              </Tag>
            )}
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={runValidation}
            loading={validating}
            disabled={!whereClause?.condition}
          >
            Validate
          </Button>
        }
      >
        <Spin spinning={validating}>
          {whereClause?.condition ? (
            <div>
              {renderConditionAnalysis()}
              {renderValidationStatus()}
              {renderValidationDetails()}
              {renderSuggestions()}
              {renderCodeGeneration()}
            </div>
          ) : (
            <Alert
              message="No Condition Selected"
              description="Please select a where clause with a condition to validate."
              type="info"
              showIcon
            />
          )}
        </Spin>
      </Card>

      {whereClause?.condition && (
        <Card size="small" style={{ marginTop: '16px' }} title="Validation Tips">
          <Paragraph>
            <ul>
              <li><strong>Dataset:</strong> Should be a valid CDISC domain (e.g., DM, AE, LB)</li>
              <li><strong>Variable:</strong> Should be a valid variable name within the dataset</li>
              <li><strong>Comparator:</strong> Choose the appropriate operator for your data type</li>
              <li><strong>Values:</strong> Ensure values match the expected data type and format</li>
              <li><strong>Performance:</strong> Use exact matches (EQ/IN) when possible for better performance</li>
              <li><strong>Best Practice:</strong> Use meaningful variable names and avoid complex expressions when simple ones suffice</li>
            </ul>
          </Paragraph>
        </Card>
      )}
    </div>
  )
}

export default ConditionValidator