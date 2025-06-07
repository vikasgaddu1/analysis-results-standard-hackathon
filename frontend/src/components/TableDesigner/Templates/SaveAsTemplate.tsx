import React, { useState } from 'react'
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Checkbox, 
  Row, 
  Col,
  Card,
  Tag,
  Space,
  message,
  Divider
} from 'antd'
import { 
  SaveOutlined,
  TagsOutlined,
  GlobalOutlined,
  TeamOutlined,
  UserOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { Output } from '../../../types'

const { TextArea } = Input
const { Option } = Select

interface SaveAsTemplateProps {
  visible: boolean
  output: Output
  onSave: (templateData: any) => Promise<void>
  onCancel: () => void
}

interface TemplateMetadata {
  name: string
  description: string
  category: string
  tags: string[]
  version: string
  isPublic: boolean
  includeData: boolean
  includeStyles: boolean
  includeValidation: boolean
  license: string
  organization?: string
  keywords: string[]
  documentation?: string
}

const SaveAsTemplate: React.FC<SaveAsTemplateProps> = ({
  visible,
  output,
  onSave,
  onCancel
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [customTags, setCustomTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  const predefinedCategories = [
    'Demographics',
    'Safety',
    'Efficacy',
    'Pharmacokinetics',
    'Clinical',
    'Laboratory',
    'Vital Signs',
    'Medical History',
    'Concomitant Medications',
    'Disposition',
    'Custom'
  ]

  const predefinedTags = [
    'ICH-E3',
    'FDA',
    'EMA',
    'CDISC',
    'standard',
    'clinical trial',
    'regulatory',
    'baseline',
    'summary',
    'listing',
    'analysis',
    'statistical'
  ]

  const licenseOptions = [
    { value: 'MIT', label: 'MIT License' },
    { value: 'Apache-2.0', label: 'Apache License 2.0' },
    { value: 'GPL-3.0', label: 'GNU General Public License v3.0' },
    { value: 'BSD-3-Clause', label: 'BSD 3-Clause License' },
    { value: 'CC-BY-4.0', label: 'Creative Commons Attribution 4.0' },
    { value: 'proprietary', label: 'Proprietary' },
    { value: 'custom', label: 'Custom License' }
  ]

  const handleSave = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      
      const templateData: TemplateMetadata = {
        ...values,
        tags: [...customTags, ...(values.tags || [])],
        keywords: values.keywords ? values.keywords.split(',').map((k: string) => k.trim()) : [],
        organization: values.isPublic ? undefined : 'Your Organization'
      }

      await onSave({
        ...templateData,
        output,
        createdDate: new Date().toISOString(),
        author: 'Current User' // This would come from auth context
      })

      message.success('Template saved successfully!')
      form.resetFields()
      setCustomTags([])
      
    } catch (error) {
      message.error('Failed to save template')
    } finally {
      setLoading(false)
    }
  }

  const addCustomTag = () => {
    if (newTag && !customTags.includes(newTag) && !predefinedTags.includes(newTag)) {
      setCustomTags([...customTags, newTag])
      setNewTag('')
    }
  }

  const removeCustomTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter(tag => tag !== tagToRemove))
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomTag()
    }
  }

  const generateSuggestedName = () => {
    if (output?.name) {
      return `${output.name} Template`
    }
    return 'New Table Template'
  }

  const generateSuggestedDescription = () => {
    const displayCount = output?.displays?.length || 0
    const hasMultipleDisplays = displayCount > 1
    
    return `Table template${hasMultipleDisplays ? ` with ${displayCount} displays` : ''} based on ${output?.name || 'current design'}`
  }

  return (
    <Modal
      title={
        <Space>
          <SaveOutlined />
          Save as Template
        </Space>
      }
      visible={visible}
      onCancel={onCancel}
      onOk={handleSave}
      confirmLoading={loading}
      width={800}
      okText="Save Template"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: generateSuggestedName(),
          description: generateSuggestedDescription(),
          version: '1.0.0',
          isPublic: false,
          includeData: false,
          includeStyles: true,
          includeValidation: true,
          license: 'proprietary'
        }}
      >
        <Card title="Basic Information" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={16}>
              <Form.Item
                label="Template Name"
                name="name"
                rules={[{ required: true, message: 'Please enter template name' }]}
              >
                <Input placeholder="Enter template name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Version"
                name="version"
                rules={[{ required: true, message: 'Please enter version' }]}
              >
                <Input placeholder="1.0.0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea
              rows={3}
              placeholder="Describe what this template does and when to use it"
            />
          </Form.Item>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category">
                  {predefinedCategories.map(category => (
                    <Option key={category} value={category}>{category}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="License"
                name="license"
              >
                <Select placeholder="Select license">
                  {licenseOptions.map(license => (
                    <Option key={license.value} value={license.value}>
                      {license.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="Tags and Keywords" size="small" style={{ marginBottom: 16 }}>
          <Form.Item
            label="Predefined Tags"
            name="tags"
            help="Select relevant predefined tags"
          >
            <Checkbox.Group>
              <Row gutter={[8, 8]}>
                {predefinedTags.map(tag => (
                  <Col key={tag} span={6}>
                    <Checkbox value={tag}>{tag}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item label="Custom Tags">
            <div style={{ marginBottom: 8 }}>
              <Input
                placeholder="Add custom tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                onBlur={addCustomTag}
                style={{ marginBottom: 8 }}
              />
            </div>
            <div>
              {customTags.map(tag => (
                <Tag
                  key={tag}
                  closable
                  onClose={() => removeCustomTag(tag)}
                  style={{ marginBottom: 4 }}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </Form.Item>

          <Form.Item
            label="Keywords"
            name="keywords"
            help="Comma-separated keywords for search"
          >
            <Input placeholder="table, analysis, clinical, efficacy" />
          </Form.Item>
        </Card>

        <Card title="Template Options" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Include Sample Data"
                name="includeData"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Include sample/mock data for demonstration
              </div>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Include Styles"
                name="includeStyles"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Include custom styling and formatting
              </div>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Include Validation Rules"
                name="includeValidation"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Include data validation and business rules
              </div>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Make Public"
                name="isPublic"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                Share with the public template library
              </div>
            </Col>
          </Row>
        </Card>

        <Card title="Additional Information" size="small">
          <Form.Item
            label="Documentation"
            name="documentation"
            help="Additional documentation or usage instructions"
          >
            <TextArea
              rows={4}
              placeholder="Provide detailed usage instructions, examples, or additional documentation"
            />
          </Form.Item>

          <div style={{ 
            backgroundColor: '#f6f8fa', 
            padding: 12, 
            borderRadius: 4,
            border: '1px solid #e1e4e8'
          }}>
            <Space>
              <InfoCircleOutlined style={{ color: '#0366d6' }} />
              <span style={{ fontSize: '12px', color: '#586069' }}>
                Templates help standardize table creation across your organization. 
                Public templates are reviewed before publication.
              </span>
            </Space>
          </div>
        </Card>
      </Form>
    </Modal>
  )
}

export default SaveAsTemplate