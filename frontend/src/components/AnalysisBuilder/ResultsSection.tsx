import React, { useState } from 'react'
import { 
  Card, 
  Button, 
  Table, 
  Modal, 
  Input, 
  Select, 
  Row, 
  Col, 
  Alert, 
  Typography,
  Space,
  Popconfirm,
  Divider
} from 'antd'
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons'
import { Analysis, ReportingEvent, OperationResult, ResultGroup, AnalysisMethod } from '../../types'

const { TextArea } = Input
const { Option } = Select
const { Text, Paragraph } = Typography

interface ResultsSectionProps {
  analysis: Partial<Analysis>
  onChange: (analysis: Partial<Analysis>) => void
  reportingEvent?: ReportingEvent
}

interface ResultFormData {
  name: string
  label: string
  description: string
  operationId: string
  resultGroups: ResultGroup[]
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  analysis,
  onChange,
  reportingEvent
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<ResultFormData>({
    name: '',
    label: '',
    description: '',
    operationId: '',
    resultGroups: []
  })
  const [showResultsInfo, setShowResultsInfo] = useState(false)

  const results = analysis.results || []
  const selectedMethod = reportingEvent?.methods?.find(m => m.id === analysis.methodId)
  const availableOperations = selectedMethod?.operations || []

  const handleAddResult = () => {
    setFormData({
      name: '',
      label: '',
      description: '',
      operationId: '',
      resultGroups: []
    })
    setEditingIndex(null)
    setIsModalVisible(true)
  }

  const handleEditResult = (index: number) => {
    const result = results[index]
    setFormData({
      name: result.name || '',
      label: result.label || '',
      description: result.description || '',
      operationId: result.operationId,
      resultGroups: result.resultGroups || []
    })
    setEditingIndex(index)
    setIsModalVisible(true)
  }

  const handleDeleteResult = (index: number) => {
    const newResults = results.filter((_, i) => i !== index)
    onChange({
      ...analysis,
      results: newResults
    })
  }

  const handleSaveResult = () => {
    if (!formData.name || !formData.operationId) return

    const newResult: OperationResult = {
      id: editingIndex !== null ? results[editingIndex].id : `result_${Date.now()}`,
      name: formData.name,
      label: formData.label || undefined,
      description: formData.description || undefined,
      operationId: formData.operationId,
      resultGroups: formData.resultGroups.length > 0 ? formData.resultGroups : undefined
    }

    let newResults: OperationResult[]
    
    if (editingIndex !== null) {
      newResults = [...results]
      newResults[editingIndex] = newResult
    } else {
      newResults = [...results, newResult]
    }

    onChange({
      ...analysis,
      results: newResults
    })
    
    setIsModalVisible(false)
  }

  const getOperationDetails = (operationId: string) => {
    return availableOperations.find(op => op.id === operationId)
  }

  const columns = [
    {
      title: 'Result Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: OperationResult) => (
        <div>
          <Text strong>{name}</Text>
          {record.label && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.label}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Operation',
      dataIndex: 'operationId',
      key: 'operationId',
      render: (operationId: string) => {
        const operation = getOperationDetails(operationId)
        return (
          <div>
            <Text>{operation?.name || 'Unknown Operation'}</Text>
            {operation?.resultPattern && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                Pattern: <Text code>{operation.resultPattern}</Text>
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: 'Result Groups',
      dataIndex: 'resultGroups',
      key: 'resultGroups',
      render: (resultGroups: ResultGroup[] | undefined) => {
        const count = resultGroups?.length || 0
        return (
          <Text type={count > 0 ? 'success' : 'secondary'}>
            {count > 0 ? `${count} groups` : 'No groups'}
          </Text>
        )
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, __: any, index: number) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditResult(index)}
          />
          <Popconfirm
            title="Delete result"
            description="Are you sure you want to delete this result?"
            onConfirm={() => handleDeleteResult(index)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              danger
            />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card title="Expected Results" size="small">
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Text>
              Define the expected outputs and results from this analysis.
            </Text>
            <Button
              type="link"
              icon={<InfoCircleOutlined />}
              size="small"
              onClick={() => setShowResultsInfo(!showResultsInfo)}
            >
              Learn more
            </Button>
          </div>
          
          {showResultsInfo && (
            <Alert
              message="About Analysis Results"
              description="Results define what outputs you expect from each operation in your analysis method. This helps document the expected deliverables and can be used for validation purposes."
              type="info"
              style={{ marginBottom: '16px' }}
              closable
              onClose={() => setShowResultsInfo(false)}
            />
          )}
        </div>

        {!analysis.methodId && (
          <Alert
            message="Analysis Method Required"
            description="Please select an analysis method in the first step before defining results."
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {analysis.methodId && availableOperations.length === 0 && (
          <Alert
            message="No Operations Available"
            description="The selected analysis method does not have any operations defined. Operations are required to define results."
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {results.length === 0 ? (
          <Alert
            message="No Results Defined"
            description="No expected results have been defined for this analysis. Consider adding result definitions to document expected outputs."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <Table
            dataSource={results}
            columns={columns}
            rowKey={(record) => record.id}
            pagination={false}
            size="small"
            style={{ marginBottom: '16px' }}
          />
        )}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddResult}
          disabled={!analysis.methodId || availableOperations.length === 0}
          block
        >
          Add Expected Result
        </Button>
      </Card>

      <Modal
        title={editingIndex !== null ? 'Edit Result' : 'Add Expected Result'}
        open={isModalVisible}
        onOk={handleSaveResult}
        onCancel={() => setIsModalVisible(false)}
        width={600}
        okText={editingIndex !== null ? 'Update' : 'Add'}
        okButtonProps={{ disabled: !formData.name || !formData.operationId }}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
              Result Name *
            </label>
            <Input
              placeholder="Enter result name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={100}
              showCount
            />
          </Col>

          <Col span={12}>
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
              Display Label
            </label>
            <Input
              placeholder="Enter display label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              maxLength={200}
              showCount
            />
          </Col>

          <Col span={24}>
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
              Description
            </label>
            <TextArea
              rows={2}
              placeholder="Describe the expected result"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={500}
              showCount
            />
          </Col>

          <Col span={24}>
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
              Operation *
            </label>
            <Select
              placeholder="Select operation"
              style={{ width: '100%' }}
              value={formData.operationId}
              onChange={(value) => setFormData({ ...formData, operationId: value })}
              showSearch
              optionFilterProp="children"
            >
              {availableOperations.map(operation => (
                <Option key={operation.id} value={operation.id}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{operation.name}</div>
                    {operation.description && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {operation.description}
                      </div>
                    )}
                    {operation.resultPattern && (
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        Pattern: <Text code>{operation.resultPattern}</Text>
                      </div>
                    )}
                  </div>
                </Option>
              ))}
            </Select>
          </Col>

          {formData.operationId && (
            <Col span={24}>
              <Divider />
              <Alert
                message="Result Groups (Optional)"
                description="You can define specific result groups if this operation produces results grouped by analysis groupings. This is optional and can be configured later."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Result groups will be automatically populated based on your analysis groupings 
                when the analysis is executed. You can pre-define them here if needed for planning purposes.
              </Text>
            </Col>
          )}
        </Row>
      </Modal>
    </div>
  )
}

export default ResultsSection