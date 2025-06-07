import React, { useState } from 'react'
import { 
  Card, 
  Select, 
  Button, 
  Table, 
  Modal, 
  Row, 
  Col, 
  Alert, 
  Checkbox, 
  InputNumber,
  Typography,
  Space,
  Popconfirm
} from 'antd'
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  InfoCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons'
import { Analysis, ReportingEvent, OrderedGroupingFactor, GroupingFactor } from '../../types'

const { Option } = Select
const { Text } = Typography

interface GroupingSelectorProps {
  analysis: Partial<Analysis>
  onChange: (analysis: Partial<Analysis>) => void
  reportingEvent?: ReportingEvent
}

interface GroupingFormData {
  groupingId: string
  order: number
  resultsByGroup: boolean
}

export const GroupingSelector: React.FC<GroupingSelectorProps> = ({
  analysis,
  onChange,
  reportingEvent
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<GroupingFormData>({
    groupingId: '',
    order: 1,
    resultsByGroup: false
  })
  const [showGroupingInfo, setShowGroupingInfo] = useState(false)

  const availableGroupings = reportingEvent?.analysisGroupings || []
  const orderedGroupings = analysis.orderedGroupings || []

  const handleAddGrouping = () => {
    setFormData({
      groupingId: '',
      order: orderedGroupings.length + 1,
      resultsByGroup: false
    })
    setEditingIndex(null)
    setIsModalVisible(true)
  }

  const handleEditGrouping = (index: number) => {
    const grouping = orderedGroupings[index]
    setFormData({
      groupingId: grouping.groupingId,
      order: grouping.order,
      resultsByGroup: grouping.resultsByGroup
    })
    setEditingIndex(index)
    setIsModalVisible(true)
  }

  const handleDeleteGrouping = (index: number) => {
    const newGroupings = orderedGroupings.filter((_, i) => i !== index)
    // Reorder the remaining groupings
    const reorderedGroupings = newGroupings.map((g, i) => ({
      ...g,
      order: i + 1
    }))
    
    onChange({
      ...analysis,
      orderedGroupings: reorderedGroupings
    })
  }

  const handleMoveGrouping = (index: number, direction: 'up' | 'down') => {
    const newGroupings = [...orderedGroupings]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < newGroupings.length) {
      // Swap the items
      [newGroupings[index], newGroupings[targetIndex]] = 
      [newGroupings[targetIndex], newGroupings[index]]
      
      // Update order numbers
      newGroupings.forEach((g, i) => {
        g.order = i + 1
      })
      
      onChange({
        ...analysis,
        orderedGroupings: newGroupings
      })
    }
  }

  const handleSaveGrouping = () => {
    if (!formData.groupingId) return

    const newGrouping: OrderedGroupingFactor = {
      order: formData.order,
      groupingId: formData.groupingId,
      resultsByGroup: formData.resultsByGroup
    }

    let newGroupings: OrderedGroupingFactor[]
    
    if (editingIndex !== null) {
      // Edit existing grouping
      newGroupings = [...orderedGroupings]
      newGroupings[editingIndex] = newGrouping
    } else {
      // Add new grouping
      newGroupings = [...orderedGroupings, newGrouping]
    }
    
    // Ensure proper ordering
    newGroupings = newGroupings
      .sort((a, b) => a.order - b.order)
      .map((g, i) => ({ ...g, order: i + 1 }))

    onChange({
      ...analysis,
      orderedGroupings: newGroupings
    })
    
    setIsModalVisible(false)
  }

  const getGroupingDetails = (groupingId: string): GroupingFactor | undefined => {
    return availableGroupings.find(g => g.id === groupingId)
  }

  const isGroupingAlreadyUsed = (groupingId: string): boolean => {
    if (editingIndex !== null && orderedGroupings[editingIndex]?.groupingId === groupingId) {
      return false // Allow selecting the same grouping when editing
    }
    return orderedGroupings.some(g => g.groupingId === groupingId)
  }

  const columns = [
    {
      title: 'Order',
      dataIndex: 'order',
      key: 'order',
      width: 80,
      render: (order: number, _: any, index: number) => (
        <Space>
          <Text strong>{order}</Text>
          <div>
            <Button
              size="small"
              icon={<ArrowUpOutlined />}
              disabled={index === 0}
              onClick={() => handleMoveGrouping(index, 'up')}
              style={{ marginRight: 4, padding: '0 4px' }}
            />
            <Button
              size="small"
              icon={<ArrowDownOutlined />}
              disabled={index === orderedGroupings.length - 1}
              onClick={() => handleMoveGrouping(index, 'down')}
              style={{ padding: '0 4px' }}
            />
          </div>
        </Space>
      )
    },
    {
      title: 'Grouping Factor',
      dataIndex: 'groupingId',
      key: 'groupingId',
      render: (groupingId: string) => {
        const grouping = getGroupingDetails(groupingId)
        return (
          <div>
            <Text strong>{grouping?.name || 'Unknown Grouping'}</Text>
            {grouping?.label && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                {grouping.label}
              </div>
            )}
            {grouping?.groupingDataset && grouping?.groupingVariable && (
              <div style={{ fontSize: '12px', color: '#999' }}>
                <Text code>{grouping.groupingDataset}.{grouping.groupingVariable}</Text>
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: 'Groups',
      dataIndex: 'groupingId',
      key: 'groups',
      render: (groupingId: string) => {
        const grouping = getGroupingDetails(groupingId)
        const groupCount = grouping?.groups?.length || 0
        return (
          <div>
            <Text>{groupCount} groups</Text>
            {grouping?.groups && groupCount > 0 && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                {grouping.groups.slice(0, 3).map(g => g.name).join(', ')}
                {groupCount > 3 && '...'}
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: 'Results by Group',
      dataIndex: 'resultsByGroup',
      key: 'resultsByGroup',
      width: 120,
      render: (resultsByGroup: boolean) => (
        <Text type={resultsByGroup ? 'success' : 'secondary'}>
          {resultsByGroup ? 'Yes' : 'No'}
        </Text>
      )
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
            onClick={() => handleEditGrouping(index)}
          />
          <Popconfirm
            title="Remove grouping"
            description="Are you sure you want to remove this grouping?"
            onConfirm={() => handleDeleteGrouping(index)}
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
      <Card title="Analysis Groupings" size="small">
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Text>
              Configure how results should be grouped and organized in the analysis output.
            </Text>
            <Button
              type="link"
              icon={<InfoCircleOutlined />}
              size="small"
              onClick={() => setShowGroupingInfo(!showGroupingInfo)}
            >
              Learn more
            </Button>
          </div>
          
          {showGroupingInfo && (
            <Alert
              message="About Analysis Groupings"
              description="Analysis groupings define how subjects or data are stratified in the analysis. For example, you might group by treatment, age group, or gender. The order matters as it determines the hierarchical structure of the results presentation."
              type="info"
              style={{ marginBottom: '16px' }}
              closable
              onClose={() => setShowGroupingInfo(false)}
            />
          )}
        </div>

        {orderedGroupings.length === 0 ? (
          <Alert
            message="No Groupings Configured"
            description="No analysis groupings have been configured. Add grouping factors to organize your analysis results by different variables."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <Table
            dataSource={orderedGroupings}
            columns={columns}
            rowKey={(_, index) => index?.toString() || '0'}
            pagination={false}
            size="small"
            style={{ marginBottom: '16px' }}
          />
        )}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddGrouping}
          disabled={availableGroupings.length === 0}
          block
        >
          Add Grouping Factor
        </Button>

        {availableGroupings.length === 0 && (
          <Alert
            message="No Grouping Factors Available"
            description="No grouping factors have been defined for this reporting event. Create grouping factors first to use them in analyses."
            type="warning"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </Card>

      <Modal
        title={editingIndex !== null ? 'Edit Grouping Factor' : 'Add Grouping Factor'}
        open={isModalVisible}
        onOk={handleSaveGrouping}
        onCancel={() => setIsModalVisible(false)}
        okText={editingIndex !== null ? 'Update' : 'Add'}
        okButtonProps={{ disabled: !formData.groupingId }}
      >
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
              Grouping Factor
            </label>
            <Select
              placeholder="Select grouping factor"
              style={{ width: '100%' }}
              value={formData.groupingId}
              onChange={(value) => setFormData({ ...formData, groupingId: value })}
              showSearch
              optionFilterProp="children"
            >
              {availableGroupings.map(grouping => (
                <Option 
                  key={grouping.id} 
                  value={grouping.id}
                  disabled={isGroupingAlreadyUsed(grouping.id)}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {grouping.name}
                      {isGroupingAlreadyUsed(grouping.id) && (
                        <Text type="secondary" style={{ marginLeft: '8px' }}>
                          (already used)
                        </Text>
                      )}
                    </div>
                    {grouping.label && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {grouping.label}
                      </div>
                    )}
                    {grouping.groupingDataset && grouping.groupingVariable && (
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        <Text code>{grouping.groupingDataset}.{grouping.groupingVariable}</Text>
                      </div>
                    )}
                  </div>
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={12}>
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
              Order
            </label>
            <InputNumber
              min={1}
              max={10}
              value={formData.order}
              onChange={(value) => setFormData({ ...formData, order: value || 1 })}
              style={{ width: '100%' }}
            />
          </Col>

          <Col span={12}>
            <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
              Options
            </label>
            <Checkbox
              checked={formData.resultsByGroup}
              onChange={(e) => setFormData({ ...formData, resultsByGroup: e.target.checked })}
            >
              Show results by group
            </Checkbox>
          </Col>

          {formData.groupingId && (
            <Col span={24}>
              <Alert
                message="Grouping Preview"
                description={(() => {
                  const grouping = getGroupingDetails(formData.groupingId)
                  if (!grouping) return 'Grouping details not available'
                  
                  const groupNames = grouping.groups?.map(g => g.name).join(', ') || 'No groups defined'
                  return `This grouping contains ${grouping.groups?.length || 0} groups: ${groupNames}`
                })()}
                type="info"
                showIcon
                style={{ marginTop: '8px' }}
              />
            </Col>
          )}
        </Row>
      </Modal>
    </div>
  )
}

export default GroupingSelector