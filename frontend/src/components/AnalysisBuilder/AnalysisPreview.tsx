import React from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Descriptions, 
  Tag, 
  Button, 
  Typography, 
  Space, 
  Alert,
  Divider
} from 'antd'
import { 
  CloseOutlined, 
  SaveOutlined, 
  EditOutlined 
} from '@ant-design/icons'
import { Analysis, ReportingEvent } from '../../types'

const { Title, Text, Paragraph } = Typography

interface AnalysisPreviewProps {
  analysis: Analysis
  reportingEvent?: ReportingEvent
  onClose: () => void
  onSave: () => void
  saving: boolean
}

export const AnalysisPreview: React.FC<AnalysisPreviewProps> = ({
  analysis,
  reportingEvent,
  onClose,
  onSave,
  saving
}) => {
  const selectedMethod = reportingEvent?.methods?.find(m => m.id === analysis.methodId)
  const selectedAnalysisSet = reportingEvent?.analysisSets?.find(s => s.id === analysis.analysisSetId)
  const selectedDataSubset = reportingEvent?.dataSubsets?.find(s => s.id === analysis.dataSubsetId)

  const renderWhereClause = (condition: any) => {
    if (!condition) return <Text type="secondary">No conditions defined</Text>

    if (condition.condition) {
      const { dataset, variable, comparator, value } = condition.condition
      return (
        <Text code>
          {dataset}.{variable} {comparator} {Array.isArray(value) ? value.join(', ') : value}
        </Text>
      )
    }

    if (condition.compoundExpression) {
      const { logicalOperator, whereClauses } = condition.compoundExpression
      return (
        <div>
          <Text>Complex expression with {logicalOperator} operator</Text>
          <div style={{ marginLeft: '16px', marginTop: '4px' }}>
            {whereClauses?.map((clause: any, index: number) => (
              <div key={index} style={{ marginBottom: '2px' }}>
                {renderWhereClause(clause)}
              </div>
            ))}
          </div>
        </div>
      )
    }

    return <Text type="secondary">Complex condition structure</Text>
  }

  const getGroupingInfo = (groupingId: string) => {
    return reportingEvent?.analysisGroupings?.find(g => g.id === groupingId)
  }

  const getOperationInfo = (operationId: string) => {
    return selectedMethod?.operations.find(op => op.id === operationId)
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px' 
            }}>
              <Title level={3} style={{ margin: 0 }}>
                Analysis Preview
              </Title>
              <Space>
                <Button 
                  icon={<EditOutlined />} 
                  onClick={onClose}
                >
                  Continue Editing
                </Button>
                <Button 
                  type="primary"
                  icon={<SaveOutlined />} 
                  onClick={onSave}
                  loading={saving}
                >
                  Save Analysis
                </Button>
                <Button 
                  icon={<CloseOutlined />} 
                  onClick={onClose}
                >
                  Close
                </Button>
              </Space>
            </div>

            {/* Basic Information */}
            <Card title="Basic Information" size="small" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Name">{analysis.name}</Descriptions.Item>
                <Descriptions.Item label="Version">{analysis.version || 'Not specified'}</Descriptions.Item>
                <Descriptions.Item label="Label">{analysis.label || 'Not specified'}</Descriptions.Item>
                <Descriptions.Item label="ID">{analysis.id}</Descriptions.Item>
                <Descriptions.Item label="Purpose" span={2}>
                  <Tag color="blue">{analysis.purpose?.controlledTerm || 'Not specified'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Reason" span={2}>
                  <Tag color="green">{analysis.reason?.controlledTerm || 'Not specified'}</Tag>
                </Descriptions.Item>
                {analysis.description && (
                  <Descriptions.Item label="Description" span={2}>
                    <Paragraph>{analysis.description}</Paragraph>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Method Information */}
            <Card title="Analysis Method" size="small" style={{ marginBottom: '16px' }}>
              {selectedMethod ? (
                <div>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Method Name">
                      {selectedMethod.name}
                    </Descriptions.Item>
                    {selectedMethod.label && (
                      <Descriptions.Item label="Label">
                        {selectedMethod.label}
                      </Descriptions.Item>
                    )}
                    {selectedMethod.description && (
                      <Descriptions.Item label="Description">
                        {selectedMethod.description}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Operations">
                      {selectedMethod.operations.length} operation(s) defined
                    </Descriptions.Item>
                  </Descriptions>
                  
                  {selectedMethod.operations.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <Text strong>Operations:</Text>
                      {selectedMethod.operations.map((op, index) => (
                        <div key={op.id} style={{ marginLeft: '16px', marginTop: '4px' }}>
                          <Text>{index + 1}. {op.name}</Text>
                          {op.resultPattern && (
                            <Text type="secondary" style={{ marginLeft: '8px' }}>
                              (Pattern: {op.resultPattern})
                            </Text>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Alert 
                  message="No method selected" 
                  type="warning" 
                  showIcon 
                />
              )}
            </Card>

            {/* Population and Data */}
            <Card title="Population and Data Selection" size="small" style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div>
                    <Text strong>Analysis Set:</Text>
                    <div style={{ marginTop: '4px' }}>
                      {selectedAnalysisSet ? (
                        <div>
                          <Text>{selectedAnalysisSet.name}</Text>
                          {selectedAnalysisSet.label && (
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {selectedAnalysisSet.label}
                            </div>
                          )}
                          {selectedAnalysisSet.condition && (
                            <div style={{ marginTop: '8px' }}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Condition:
                              </Text>
                              <div style={{ marginLeft: '8px' }}>
                                {renderWhereClause(selectedAnalysisSet.condition)}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Text type="secondary">Not specified</Text>
                      )}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div>
                    <Text strong>Data Subset:</Text>
                    <div style={{ marginTop: '4px' }}>
                      {selectedDataSubset ? (
                        <div>
                          <Text>{selectedDataSubset.name}</Text>
                          {selectedDataSubset.label && (
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {selectedDataSubset.label}
                            </div>
                          )}
                          {selectedDataSubset.condition && (
                            <div style={{ marginTop: '8px' }}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Condition:
                              </Text>
                              <div style={{ marginLeft: '8px' }}>
                                {renderWhereClause(selectedDataSubset.condition)}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Text type="secondary">Not specified</Text>
                      )}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Groupings */}
            <Card title="Analysis Groupings" size="small" style={{ marginBottom: '16px' }}>
              {analysis.orderedGroupings && analysis.orderedGroupings.length > 0 ? (
                <div>
                  {analysis.orderedGroupings.map((og, index) => {
                    const grouping = getGroupingInfo(og.groupingId)
                    return (
                      <div key={index} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Tag color="purple">Order {og.order}</Tag>
                          <Text strong>{grouping?.name || 'Unknown Grouping'}</Text>
                          {og.resultsByGroup && (
                            <Tag color="green" style={{ marginLeft: '8px' }}>
                              Results by Group
                            </Tag>
                          )}
                        </div>
                        {grouping && (
                          <div style={{ marginLeft: '16px', marginTop: '4px' }}>
                            {grouping.label && (
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {grouping.label}
                              </div>
                            )}
                            {grouping.groupingDataset && grouping.groupingVariable && (
                              <div style={{ fontSize: '12px', color: '#999' }}>
                                Variable: <Text code>{grouping.groupingDataset}.{grouping.groupingVariable}</Text>
                              </div>
                            )}
                            {grouping.groups && (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                Groups ({grouping.groups.length}): {grouping.groups.map(g => g.name).join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <Text type="secondary">No groupings configured</Text>
              )}
            </Card>

            {/* Results */}
            <Card title="Expected Results" size="small">
              {analysis.results && analysis.results.length > 0 ? (
                <div>
                  {analysis.results.map((result, index) => {
                    const operation = getOperationInfo(result.operationId)
                    return (
                      <div key={result.id} style={{ marginBottom: '12px' }}>
                        <div>
                          <Text strong>{result.name}</Text>
                          {result.label && (
                            <Text type="secondary" style={{ marginLeft: '8px' }}>
                              ({result.label})
                            </Text>
                          )}
                        </div>
                        <div style={{ marginLeft: '16px', marginTop: '4px' }}>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Operation: <Text>{operation?.name || 'Unknown Operation'}</Text>
                          </div>
                          {result.description && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                              {result.description}
                            </div>
                          )}
                          {result.resultGroups && result.resultGroups.length > 0 && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                              Result groups: {result.resultGroups.length} defined
                            </div>
                          )}
                        </div>
                        {index < analysis.results!.length - 1 && <Divider style={{ margin: '8px 0' }} />}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <Text type="secondary">No expected results defined</Text>
              )}
            </Card>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Alert
                message="Ready to Save"
                description="Review the analysis configuration above. Click 'Save Analysis' to create this analysis in the reporting event."
                type="success"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              <Space>
                <Button 
                  size="large"
                  icon={<EditOutlined />} 
                  onClick={onClose}
                >
                  Continue Editing
                </Button>
                <Button 
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />} 
                  onClick={onSave}
                  loading={saving}
                >
                  Save Analysis
                </Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AnalysisPreview