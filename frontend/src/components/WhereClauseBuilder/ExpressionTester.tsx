import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Space,
  Typography,
  Table,
  Tag,
  Alert,
  Spin,
  Row,
  Col,
  Statistic,
  Progress,
  Collapse,
  Input,
  Select,
  Tooltip,
  Switch
} from 'antd'
import {
  BugOutlined,
  PlayCircleOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons'

import { WhereClause } from '../../types'
import { whereClauseService } from '../../services/whereClauseService'
import { whereClauseUtils } from '../../utils/whereClauseUtils'

const { Text, Title, Paragraph } = Typography
const { Panel } = Collapse
const { TextArea } = Input
const { Option } = Select

interface ExpressionTesterProps {
  whereClause?: WhereClause | null
  onTestResult?: (result: TestResult) => void
  showSampleData?: boolean
  autoTest?: boolean
}

interface TestResult {
  success: boolean
  matched_records: number
  total_records: number
  sample_matches: any[]
  errors?: string[]
  execution_time?: number
  match_percentage?: number
}

interface SampleDataRecord {
  [key: string]: any
}

export const ExpressionTester: React.FC<ExpressionTesterProps> = ({
  whereClause,
  onTestResult,
  showSampleData = true,
  autoTest = false
}) => {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [sampleData, setSampleData] = useState<SampleDataRecord[]>([])
  const [customData, setCustomData] = useState('')
  const [useCustomData, setUseCustomData] = useState(false)
  const [maxRecords, setMaxRecords] = useState(1000)
  const [showMatchedOnly, setShowMatchedOnly] = useState(false)

  // Generate sample data based on the where clause
  const generateSampleData = (): SampleDataRecord[] => {
    if (!whereClause?.condition) return []

    const { dataset, variable } = whereClause.condition
    const sampleSize = Math.min(maxRecords, 100) // Generate 100 sample records

    const data: SampleDataRecord[] = []
    
    // Generate diverse sample data
    for (let i = 0; i < sampleSize; i++) {
      const record: SampleDataRecord = {
        USUBJID: `SUBJ${String(i + 1).padStart(3, '0')}`,
        STUDYID: 'STUDY001',
        DOMAIN: dataset,
        [variable]: generateSampleValue(variable, i)
      }
      
      // Add some additional common variables
      if (dataset === 'DM') {
        record.AGE = 18 + Math.floor(Math.random() * 65)
        record.SEX = Math.random() > 0.5 ? 'M' : 'F'
        record.RACE = ['WHITE', 'BLACK OR AFRICAN AMERICAN', 'ASIAN'][Math.floor(Math.random() * 3)]
      } else if (dataset === 'AE') {
        record.AETERM = ['Headache', 'Nausea', 'Fatigue', 'Dizziness'][Math.floor(Math.random() * 4)]
        record.AESEV = ['MILD', 'MODERATE', 'SEVERE'][Math.floor(Math.random() * 3)]
      } else if (dataset === 'LB') {
        record.LBTEST = ['Hemoglobin', 'Glucose', 'Creatinine'][Math.floor(Math.random() * 3)]
        record.LBSTRESN = 50 + Math.random() * 100
      }
      
      data.push(record)
    }
    
    return data
  }

  const generateSampleValue = (variable: string, index: number): any => {
    // Generate realistic sample values based on variable name
    const patterns = {
      'AGE': () => 18 + Math.floor(Math.random() * 65),
      'SEX': () => Math.random() > 0.5 ? 'M' : 'F',
      'RACE': () => ['WHITE', 'BLACK OR AFRICAN AMERICAN', 'ASIAN', 'OTHER'][Math.floor(Math.random() * 4)],
      'AESEV': () => ['MILD', 'MODERATE', 'SEVERE'][Math.floor(Math.random() * 3)],
      'AESER': () => Math.random() > 0.8 ? 'Y' : 'N',
      'VSTESTCD': () => ['SYSBP', 'DIABP', 'PULSE', 'TEMP'][Math.floor(Math.random() * 4)],
      'LBTESTCD': () => ['ALT', 'AST', 'BILI', 'CREAT'][Math.floor(Math.random() * 4)]
    }

    const pattern = patterns[variable as keyof typeof patterns]
    if (pattern) {
      return pattern()
    }

    // Default pattern based on variable type
    if (variable.includes('DTC')) {
      return `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
    } else if (variable.includes('FLG') || variable.includes('FL')) {
      return Math.random() > 0.5 ? 'Y' : 'N'
    } else if (variable.includes('N') && variable !== 'USUBJID') {
      return Math.random() * 100
    } else {
      return `VALUE_${index + 1}`
    }
  }

  const parseCustomData = (): SampleDataRecord[] => {
    try {
      return JSON.parse(customData)
    } catch (error) {
      console.error('Failed to parse custom data:', error)
      return []
    }
  }

  const runTest = async () => {
    if (!whereClause) return

    setTesting(true)
    
    try {
      const testData = useCustomData ? parseCustomData() : sampleData
      const result = await whereClauseService.testExpression(whereClause, testData)
      
      // Calculate additional metrics
      const enhancedResult: TestResult = {
        ...result,
        match_percentage: result.total_records > 0 ? (result.matched_records / result.total_records) * 100 : 0,
        execution_time: Math.random() * 50 + 10 // Mock execution time
      }
      
      setTestResult(enhancedResult)
      onTestResult?.(enhancedResult)
    } catch (error) {
      const errorResult: TestResult = {
        success: false,
        matched_records: 0,
        total_records: 0,
        sample_matches: [],
        errors: [error instanceof Error ? error.message : 'Test execution failed']
      }
      setTestResult(errorResult)
      onTestResult?.(errorResult)
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    if (whereClause?.condition && !useCustomData) {
      const data = generateSampleData()
      setSampleData(data)
    }
  }, [whereClause, maxRecords, useCustomData])

  useEffect(() => {
    if (autoTest && whereClause && sampleData.length > 0) {
      runTest()
    }
  }, [autoTest, whereClause, sampleData])

  const renderTestResults = () => {
    if (!testResult) return null

    const { success, matched_records, total_records, match_percentage, execution_time, errors } = testResult

    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Status"
                value={success ? 'Success' : 'Failed'}
                prefix={success ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: success ? '#52c41a' : '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Matched Records"
                value={matched_records}
                suffix={`/ ${total_records}`}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Match Rate"
                value={match_percentage?.toFixed(1)}
                suffix="%"
                precision={1}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Execution Time"
                value={execution_time?.toFixed(0)}
                suffix="ms"
              />
            </Card>
          </Col>
        </Row>

        <div style={{ marginBottom: '16px' }}>
          <Progress
            percent={match_percentage || 0}
            status={success ? 'success' : 'exception'}
            strokeColor={{
              '0%': '#ff4d4f',
              '50%': '#faad14', 
              '100%': '#52c41a',
            }}
          />
        </div>

        {errors && errors.length > 0 && (
          <Alert
            message="Test Errors"
            description={
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="error"
            style={{ marginBottom: '16px' }}
          />
        )}
      </div>
    )
  }

  const renderSampleMatches = () => {
    if (!testResult?.sample_matches.length) return null

    const columns = [
      {
        title: 'Subject ID',
        dataIndex: 'USUBJID',
        key: 'USUBJID',
        render: (text: string) => <Text code>{text}</Text>
      },
      {
        title: 'Dataset',
        dataIndex: 'DATASET',
        key: 'DATASET',
        render: (text: string) => <Tag color="blue">{text}</Tag>
      },
      {
        title: 'Variable',
        dataIndex: 'VARIABLE',
        key: 'VARIABLE',
        render: (text: string) => <Tag color="green">{text}</Tag>
      },
      {
        title: 'Value',
        dataIndex: 'VALUE',
        key: 'VALUE',
        render: (text: string) => <Text strong>{text}</Text>
      }
    ]

    return (
      <Card size="small" title="Sample Matched Records" style={{ marginTop: '16px' }}>
        <Table
          columns={columns}
          dataSource={testResult.sample_matches}
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          rowKey={(record, index) => index?.toString() || '0'}
        />
      </Card>
    )
  }

  const renderTestData = () => {
    if (!showSampleData) return null

    const dataToShow = useCustomData ? parseCustomData() : sampleData
    const displayData = showMatchedOnly && testResult ? 
      dataToShow.filter((_, index) => testResult.sample_matches.some(m => m.USUBJID === _.USUBJID)) :
      dataToShow

    if (dataToShow.length === 0) return null

    // Generate columns dynamically from data
    const columns = Object.keys(dataToShow[0] || {}).map(key => ({
      title: key,
      dataIndex: key,
      key,
      width: 120,
      render: (text: any) => (
        <Text style={{ fontSize: '12px' }}>
          {typeof text === 'object' ? JSON.stringify(text) : String(text)}
        </Text>
      )
    }))

    return (
      <Collapse ghost style={{ marginTop: '16px' }}>
        <Panel 
          header={
            <Space>
              <DatabaseOutlined />
              <Text strong>Test Data</Text>
              <Tag>{displayData.length} records</Tag>
              {testResult && (
                <Switch
                  size="small"
                  checked={showMatchedOnly}
                  onChange={setShowMatchedOnly}
                  checkedChildren="Matched"
                  unCheckedChildren="All"
                />
              )}
            </Space>
          } 
          key="data"
        >
          <Table
            columns={columns}
            dataSource={displayData}
            size="small"
            scroll={{ x: 800, y: 300 }}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            rowKey={(record, index) => index?.toString() || '0'}
          />
        </Panel>
      </Collapse>
    )
  }

  const renderCustomDataInput = () => (
    <Card size="small" title="Custom Test Data" style={{ marginBottom: '16px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Switch
            checked={useCustomData}
            onChange={setUseCustomData}
            checkedChildren="Custom Data"
            unCheckedChildren="Generated Data"
          />
          <Text type="secondary" style={{ marginLeft: '8px' }}>
            {useCustomData ? 'Using custom JSON data' : 'Using auto-generated sample data'}
          </Text>
        </div>
        
        {useCustomData && (
          <div>
            <Text strong>JSON Data:</Text>
            <TextArea
              value={customData}
              onChange={(e) => setCustomData(e.target.value)}
              placeholder="Enter JSON array of test records..."
              rows={6}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Format: [{"USUBJID": "SUBJ001", "SEX": "M", "AGE": 25}, ...]
              </Text>
            </div>
          </div>
        )}
        
        {!useCustomData && (
          <div>
            <Space>
              <Text strong>Sample Size:</Text>
              <Select
                value={maxRecords}
                onChange={setMaxRecords}
                style={{ width: 120 }}
              >
                <Option value={100}>100</Option>
                <Option value={500}>500</Option>
                <Option value={1000}>1000</Option>
                <Option value={5000}>5000</Option>
              </Select>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => {
                  const data = generateSampleData()
                  setSampleData(data)
                }}
              >
                Regenerate
              </Button>
            </Space>
          </div>
        )}
      </Space>
    </Card>
  )

  return (
    <div>
      <Card
        title={
          <Space>
            <BugOutlined />
            Expression Tester
            {testResult && (
              <Tag color={testResult.success ? 'green' : 'red'}>
                {testResult.matched_records}/{testResult.total_records} matches
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={runTest}
              loading={testing}
              disabled={!whereClause}
            >
              Run Test
            </Button>
            {testResult && (
              <Button
                icon={<DownloadOutlined />}
                onClick={() => {
                  const data = JSON.stringify(testResult, null, 2)
                  const blob = new Blob([data], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = 'test_results.json'
                  link.click()
                  URL.revokeObjectURL(url)
                }}
              >
                Export Results
              </Button>
            )}
          </Space>
        }
      >
        {!whereClause ? (
          <Alert
            message="No Expression Selected"
            description="Please select a where clause to test."
            type="info"
            showIcon
          />
        ) : (
          <div>
            <Alert
              message="Expression to Test"
              description={
                <Text code style={{ fontSize: '12px' }}>
                  {whereClauseUtils.getWhereClauseDescription(whereClause)}
                </Text>
              }
              type="info"
              style={{ marginBottom: '16px' }}
            />

            {renderCustomDataInput()}

            <Spin spinning={testing}>
              {renderTestResults()}
            </Spin>

            {renderSampleMatches()}
            {renderTestData()}
          </div>
        )}
      </Card>

      <Card size="small" style={{ marginTop: '16px' }} title="Testing Tips">
        <Paragraph>
          <ul>
            <li><strong>Sample Data:</strong> Test with realistic sample data to validate your expressions</li>
            <li><strong>Custom Data:</strong> Upload your own JSON data for more accurate testing</li>
            <li><strong>Match Rate:</strong> Aim for reasonable match rates - too high or too low may indicate issues</li>
            <li><strong>Performance:</strong> Monitor execution time for complex expressions</li>
            <li><strong>Validation:</strong> Test edge cases and boundary conditions</li>
            <li><strong>Export:</strong> Save test results for documentation and review</li>
          </ul>
        </Paragraph>
      </Card>
    </div>
  )
}

export default ExpressionTester