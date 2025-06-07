import React, { useState, useEffect } from 'react'
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  List,
  Tag,
  Modal,
  Form,
  Select,
  Alert,
  Tooltip,
  Row,
  Col,
  Divider,
  Empty,
  Spin
} from 'antd'
import {
  BookOutlined,
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  TagsOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  FilterOutlined,
  StarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

import { useWhereClauseTemplates } from '../../hooks/useWhereClause'
import { WhereClauseTemplate } from '../../services/whereClauseService'
import { whereClauseUtils } from '../../utils/whereClauseUtils'

const { Text, Title, Paragraph } = Typography
const { Search } = Input
const { Option } = Select
const { TextArea } = Input

interface WhereClauseLibraryProps {
  onTemplateApply?: (template: WhereClauseTemplate) => Promise<void>
  onTemplateSelect?: (template: WhereClauseTemplate) => void
  compact?: boolean
  showActions?: boolean
}

interface TemplateFormData {
  name: string
  description: string
  tags: string[]
}

export const WhereClauseLibrary: React.FC<WhereClauseLibraryProps> = ({
  onTemplateApply,
  onTemplateSelect,
  compact = false,
  showActions = true
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<WhereClauseTemplate | null>(null)
  const [createForm] = Form.useForm<TemplateFormData>()

  const {
    templates,
    loading,
    loadTemplates,
    deleteTemplate
  } = useWhereClauseTemplates()

  useEffect(() => {
    loadTemplates(selectedTags.length > 0 ? selectedTags : undefined, searchTerm || undefined)
  }, [selectedTags, searchTerm, loadTemplates])

  // Extract all available tags from templates
  const allTags = Array.from(
    new Set(templates.flatMap(template => template.tags))
  ).sort()

  const handleTemplateApply = async (template: WhereClauseTemplate) => {
    if (onTemplateApply) {
      await onTemplateApply(template)
    }
  }

  const handleTemplateDelete = async (templateId: string) => {
    Modal.confirm({
      title: 'Delete Template',
      content: 'Are you sure you want to delete this template? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deleteTemplate(templateId)
      }
    })
  }

  const handleCreateTemplate = () => {
    setShowCreateModal(true)
  }

  const handleCreateSubmit = async (values: TemplateFormData) => {
    // This would typically save a new template
    // For now, just close the modal
    setShowCreateModal(false)
    createForm.resetFields()
    await loadTemplates()
  }

  const renderTemplateCard = (template: WhereClauseTemplate) => {
    const isCondition = template.clause_type === 'condition'
    const description = isCondition && template.condition
      ? whereClauseUtils.getConditionDescription(template.condition)
      : template.description

    return (
      <Card
        size="small"
        title={
          <Space>
            <Text strong>{template.name}</Text>
            <Tag color={isCondition ? 'blue' : 'purple'}>
              {template.clause_type === 'condition' ? 'Condition' : 'Expression'}
            </Tag>
          </Space>
        }
        extra={
          showActions && (
            <Space size="small">
              <Tooltip title="Apply template">
                <Button
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleTemplateApply(template)}
                />
              </Tooltip>
              <Tooltip title="Delete template">
                <Button
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleTemplateDelete(template.id)}
                  danger
                />
              </Tooltip>
            </Space>
          )
        }
        hoverable
        onClick={() => {
          setSelectedTemplate(template)
          onTemplateSelect?.(template)
        }}
        style={{
          marginBottom: '8px',
          border: selectedTemplate?.id === template.id ? '2px solid #1890ff' : undefined
        }}
      >
        <div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {description}
          </Text>
          
          {template.tags.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <Space wrap size="small">
                {template.tags.map(tag => (
                  <Tag key={tag} size="small">{tag}</Tag>
                ))}
              </Space>
            </div>
          )}
          
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              <ClockCircleOutlined style={{ marginRight: '4px' }} />
              {new Date(template.created_at).toLocaleDateString()}
            </Text>
            {!compact && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                ID: {template.id.slice(0, 8)}...
              </Text>
            )}
          </div>
        </div>
      </Card>
    )
  }

  const renderTemplateDetails = () => {
    if (!selectedTemplate) return null

    const isCondition = selectedTemplate.clause_type === 'condition'

    return (
      <Card
        size="small"
        title={
          <Space>
            <StarOutlined />
            Template Details
          </Space>
        }
        style={{ marginTop: '16px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Name: </Text>
            <Text>{selectedTemplate.name}</Text>
          </div>
          
          <div>
            <Text strong>Description: </Text>
            <Text>{selectedTemplate.description}</Text>
          </div>
          
          <div>
            <Text strong>Type: </Text>
            <Tag color={isCondition ? 'blue' : 'purple'}>
              {selectedTemplate.clause_type}
            </Tag>
          </div>
          
          {selectedTemplate.tags.length > 0 && (
            <div>
              <Text strong>Tags: </Text>
              <Space wrap>
                {selectedTemplate.tags.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            </div>
          )}
          
          <div>
            <Text strong>Created: </Text>
            <Text>{new Date(selectedTemplate.created_at).toLocaleString()}</Text>
          </div>

          {isCondition && selectedTemplate.condition && (
            <div>
              <Text strong>Condition: </Text>
              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <Text code style={{ fontSize: '12px' }}>
                  {whereClauseUtils.getConditionDescription(selectedTemplate.condition)}
                </Text>
              </div>
            </div>
          )}

          {selectedTemplate.compound_expression && (
            <div>
              <Text strong>Expression: </Text>
              <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <Text code style={{ fontSize: '12px' }}>
                  {whereClauseUtils.getCompoundExpressionDescription(selectedTemplate.compound_expression)}
                </Text>
              </div>
            </div>
          )}

          {showActions && (
            <div style={{ marginTop: '16px' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleTemplateApply(selectedTemplate)}
                >
                  Apply Template
                </Button>
                <Button
                  icon={<DeleteOutlined />}
                  onClick={() => handleTemplateDelete(selectedTemplate.id)}
                  danger
                >
                  Delete
                </Button>
              </Space>
            </div>
          )}
        </Space>
      </Card>
    )
  }

  const renderFilters = () => (
    <Card size="small" style={{ marginBottom: '16px' }}>
      <Row gutter={[16, 8]}>
        <Col span={12}>
          <Search
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
        </Col>
        <Col span={12}>
          <Select
            mode="multiple"
            placeholder="Filter by tags"
            value={selectedTags}
            onChange={setSelectedTags}
            style={{ width: '100%' }}
            allowClear
          >
            {allTags.map(tag => (
              <Option key={tag} value={tag}>{tag}</Option>
            ))}
          </Select>
        </Col>
      </Row>
    </Card>
  )

  const renderCreateModal = () => (
    <Modal
      title="Create Template"
      open={showCreateModal}
      onCancel={() => {
        setShowCreateModal(false)
        createForm.resetFields()
      }}
      onOk={() => createForm.submit()}
      width={600}
    >
      <Form
        form={createForm}
        layout="vertical"
        onFinish={handleCreateSubmit}
      >
        <Form.Item
          name="name"
          label="Template Name"
          rules={[{ required: true, message: 'Please enter a template name' }]}
        >
          <Input placeholder="Enter template name" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter a description' }]}
        >
          <TextArea
            placeholder="Describe what this template does"
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="tags"
          label="Tags"
        >
          <Select
            mode="tags"
            placeholder="Add tags for organization"
            style={{ width: '100%' }}
          >
            {allTags.map(tag => (
              <Option key={tag} value={tag}>{tag}</Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )

  if (compact) {
    return (
      <div>
        <div style={{ marginBottom: '12px' }}>
          <Search
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            allowClear
          />
        </div>
        
        <Spin spinning={loading}>
          {templates.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No templates found"
            />
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {templates.map(template => renderTemplateCard(template))}
            </div>
          )}
        </Spin>
      </div>
    )
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <BookOutlined />
            Where Clause Library
            <Tag>{templates.length} templates</Tag>
          </Space>
        }
        extra={
          showActions && (
            <Space>
              <Button
                icon={<PlusOutlined />}
                onClick={handleCreateTemplate}
              >
                Create Template
              </Button>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchTerm('')
                  setSelectedTags([])
                }}
              >
                Clear Filters
              </Button>
            </Space>
          )
        }
      >
        {renderFilters()}

        <Spin spinning={loading}>
          {templates.length === 0 ? (
            <Empty
              description={
                <div>
                  <Paragraph>No templates found.</Paragraph>
                  {showActions && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleCreateTemplate}
                    >
                      Create Your First Template
                    </Button>
                  )}
                </div>
              }
            />
          ) : (
            <Row gutter={[16, 16]}>
              <Col span={selectedTemplate ? 14 : 24}>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {templates.map(template => renderTemplateCard(template))}
                </div>
              </Col>
              
              {selectedTemplate && (
                <Col span={10}>
                  {renderTemplateDetails()}
                </Col>
              )}
            </Row>
          )}
        </Spin>
      </Card>

      {renderCreateModal()}

      {!compact && (
        <Card size="small" style={{ marginTop: '16px' }} title="Library Tips">
          <Paragraph>
            <ul>
              <li><strong>Templates:</strong> Save frequently used where clause patterns as reusable templates</li>
              <li><strong>Tags:</strong> Organize templates with tags for easy discovery</li>
              <li><strong>Search:</strong> Find templates by name, description, or dataset/variable patterns</li>
              <li><strong>Apply:</strong> Click the play button to instantly apply a template to your analysis</li>
              <li><strong>Share:</strong> Export and share useful templates with your team</li>
            </ul>
          </Paragraph>
        </Card>
      )}
    </div>
  )
}

export default WhereClauseLibrary