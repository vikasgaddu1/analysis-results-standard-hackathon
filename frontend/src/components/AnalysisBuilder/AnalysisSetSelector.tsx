import React, { useState } from 'react'
import { Card, Select, Row, Col, Alert, Button, Divider, Typography } from 'antd'
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Analysis, ReportingEvent, AnalysisSet, DataSubset } from '../../types'

const { Option } = Select
const { Text, Paragraph } = Typography

interface AnalysisSetSelectorProps {
  analysis: Partial<Analysis>
  onChange: (analysis: Partial<Analysis>) => void
  reportingEvent?: ReportingEvent
}

export const AnalysisSetSelector: React.FC<AnalysisSetSelectorProps> = ({
  analysis,
  onChange,
  reportingEvent
}) => {
  const [showAnalysisSetInfo, setShowAnalysisSetInfo] = useState(false)
  const [showDataSubsetInfo, setShowDataSubsetInfo] = useState(false)

  const handleAnalysisSetChange = (analysisSetId: string) => {
    onChange({
      ...analysis,
      analysisSetId
    })
  }

  const handleDataSubsetChange = (dataSubsetId: string) => {
    onChange({
      ...analysis,
      dataSubsetId
    })
  }

  const availableAnalysisSets = reportingEvent?.analysisSets || []
  const availableDataSubsets = reportingEvent?.dataSubsets || []

  const selectedAnalysisSet = availableAnalysisSets.find(
    set => set.id === analysis.analysisSetId
  )
  const selectedDataSubset = availableDataSubsets.find(
    subset => subset.id === analysis.dataSubsetId
  )

  const renderWhereClauseInfo = (condition: any) => {
    if (!condition) return null

    if (condition.condition) {
      const { dataset, variable, comparator, value } = condition.condition
      return (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          <Text code>{dataset}.{variable} {comparator} {Array.isArray(value) ? value.join(', ') : value}</Text>
        </div>
      )
    }

    if (condition.compoundExpression) {
      const { logicalOperator, whereClauses } = condition.compoundExpression
      return (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          <Text>Complex condition with {logicalOperator} operator ({whereClauses?.length || 0} clauses)</Text>
        </div>
      )
    }

    return null
  }

  return (
    <div>
      <Card title="Population and Dataset Selection" size="small">
        <Alert
          message="Analysis Sets and Data Subsets"
          description="Analysis sets define the population of subjects to include in the analysis. Data subsets define which records from datasets to include. Both are optional but recommended for clear analysis definition."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Row gutter={[16, 24]}>
          <Col span={24}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontWeight: 'bold', marginRight: '8px' }}>
                  Analysis Set (Population)
                </label>
                <Button
                  type="link"
                  icon={<InfoCircleOutlined />}
                  size="small"
                  onClick={() => setShowAnalysisSetInfo(!showAnalysisSetInfo)}
                >
                  What is this?
                </Button>
              </div>
              
              {showAnalysisSetInfo && (
                <Alert
                  message="Analysis Set Definition"
                  description="Analysis sets define the population of subjects to be included in the analysis (e.g., Full Analysis Set, Per Protocol Set, Safety Set). They typically contain conditions that define subject inclusion criteria."
                  type="info"
                  style={{ marginBottom: '12px' }}
                  closable
                  onClose={() => setShowAnalysisSetInfo(false)}
                />
              )}

              <Select
                placeholder="Select analysis set (optional)"
                style={{ width: '100%' }}
                value={analysis.analysisSetId}
                onChange={handleAnalysisSetChange}
                allowClear
                showSearch
                optionFilterProp="children"
                notFoundContent={
                  availableAnalysisSets.length === 0 
                    ? "No analysis sets available"
                    : "No matching analysis sets found"
                }
              >
                {availableAnalysisSets.map(set => (
                  <Option key={set.id} value={set.id}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{set.name}</div>
                      {set.label && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {set.label}
                        </div>
                      )}
                      {set.condition && renderWhereClauseInfo(set.condition)}
                    </div>
                  </Option>
                ))}
              </Select>

              {selectedAnalysisSet && (
                <Card size="small" style={{ marginTop: '12px', backgroundColor: '#f9f9f9' }}>
                  <div>
                    <Text strong>{selectedAnalysisSet.name}</Text>
                    {selectedAnalysisSet.label && (
                      <div style={{ marginTop: '4px' }}>
                        <Text>{selectedAnalysisSet.label}</Text>
                      </div>
                    )}
                    {selectedAnalysisSet.description && (
                      <Paragraph 
                        style={{ marginTop: '8px', marginBottom: '8px', fontSize: '12px' }}
                        ellipsis={{ rows: 2, expandable: true }}
                      >
                        {selectedAnalysisSet.description}
                      </Paragraph>
                    )}
                    {selectedAnalysisSet.condition && (
                      <div style={{ marginTop: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Population Criteria:
                        </Text>
                        {renderWhereClauseInfo(selectedAnalysisSet.condition)}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </Col>

          <Col span={24}>
            <Divider />
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontWeight: 'bold', marginRight: '8px' }}>
                  Data Subset
                </label>
                <Button
                  type="link"
                  icon={<InfoCircleOutlined />}
                  size="small"
                  onClick={() => setShowDataSubsetInfo(!showDataSubsetInfo)}
                >
                  What is this?
                </Button>
              </div>
              
              {showDataSubsetInfo && (
                <Alert
                  message="Data Subset Definition"
                  description="Data subsets define which records from datasets to include in the analysis (e.g., only baseline visits, only post-baseline visits, specific time windows). They contain conditions that filter dataset records."
                  type="info"
                  style={{ marginBottom: '12px' }}
                  closable
                  onClose={() => setShowDataSubsetInfo(false)}
                />
              )}

              <Select
                placeholder="Select data subset (optional)"
                style={{ width: '100%' }}
                value={analysis.dataSubsetId}
                onChange={handleDataSubsetChange}
                allowClear
                showSearch
                optionFilterProp="children"
                notFoundContent={
                  availableDataSubsets.length === 0 
                    ? "No data subsets available"
                    : "No matching data subsets found"
                }
              >
                {availableDataSubsets.map(subset => (
                  <Option key={subset.id} value={subset.id}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{subset.name}</div>
                      {subset.label && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {subset.label}
                        </div>
                      )}
                      {subset.condition && renderWhereClauseInfo(subset.condition)}
                    </div>
                  </Option>
                ))}
              </Select>

              {selectedDataSubset && (
                <Card size="small" style={{ marginTop: '12px', backgroundColor: '#f9f9f9' }}>
                  <div>
                    <Text strong>{selectedDataSubset.name}</Text>
                    {selectedDataSubset.label && (
                      <div style={{ marginTop: '4px' }}>
                        <Text>{selectedDataSubset.label}</Text>
                      </div>
                    )}
                    {selectedDataSubset.description && (
                      <Paragraph 
                        style={{ marginTop: '8px', marginBottom: '8px', fontSize: '12px' }}
                        ellipsis={{ rows: 2, expandable: true }}
                      >
                        {selectedDataSubset.description}
                      </Paragraph>
                    )}
                    {selectedDataSubset.condition && (
                      <div style={{ marginTop: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Data Filter Criteria:
                        </Text>
                        {renderWhereClauseInfo(selectedDataSubset.condition)}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </Col>
        </Row>

        {availableAnalysisSets.length === 0 && availableDataSubsets.length === 0 && (
          <Alert
            message="No Analysis Sets or Data Subsets Available"
            description="No analysis sets or data subsets have been defined for this reporting event. You can proceed without them, but consider adding them for better analysis definition."
            type="warning"
            showIcon
            style={{ marginTop: '16px' }}
            action={
              <Button size="small" icon={<PlusOutlined />}>
                Add Analysis Set
              </Button>
            }
          />
        )}

        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f0f9f0', borderRadius: '6px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <strong>Tip:</strong> Analysis sets and data subsets are optional but help provide clear 
            documentation of what population and data records are included in your analysis. 
            They can be defined at the reporting event level and reused across multiple analyses.
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default AnalysisSetSelector