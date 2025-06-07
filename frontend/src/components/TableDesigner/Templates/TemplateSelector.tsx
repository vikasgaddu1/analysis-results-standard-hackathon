import React, { useState, useEffect } from 'react'
import { 
  Modal, 
  Card, 
  Row, 
  Col, 
  Input, 
  Select, 
  Button, 
  Tag, 
  Empty,
  Spin,
  Tooltip,
  Space,
  Avatar
} from 'antd'
import { 
  SearchOutlined, 
  FilterOutlined, 
  EyeOutlined,
  StarOutlined,
  StarFilled,
  UserOutlined,
  CalendarOutlined,
  FileTableOutlined
} from '@ant-design/icons'
import TemplateLibrary from './TemplateLibrary'
import { Output } from '../../../types'

const { Search } = Input
const { Option } = Select

interface Template {
  id: string
  name: string
  description: string
  category: string
  type: 'clinical' | 'safety' | 'efficacy' | 'demographics' | 'custom'
  author: string
  createdDate: string
  lastModified: string
  tags: string[]
  isFavorite: boolean
  isStandard: boolean
  previewImage?: string
  output: Output
  usage: {
    timesUsed: number
    lastUsed?: string
  }
}

interface TemplateSelectorProps {
  visible: boolean
  onSelect: (templateId: string) => void
  onCancel: () => void
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  visible,
  onSelect,
  onCancel
}) => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [showLibrary, setShowLibrary] = useState(false)

  // Mock templates data - in real app this would come from API
  const mockTemplates: Template[] = [
    {
      id: 'demo-table-1',
      name: 'Demographics Summary Table',
      description: 'Standard demographics table with age, gender, race, and baseline characteristics',
      category: 'Demographics',
      type: 'demographics',
      author: 'CDISC Standards',
      createdDate: '2023-01-15',
      lastModified: '2023-12-01',
      tags: ['demographics', 'baseline', 'standard', 'ICH-E3'],
      isFavorite: true,
      isStandard: true,
      usage: { timesUsed: 245, lastUsed: '2023-12-01' },
      output: {
        id: 'demo-output-1',
        name: 'Demographics Table',
        displays: []
      }
    },
    {
      id: 'ae-summary-1',
      name: 'Adverse Events Summary',
      description: 'Overview table of adverse events by system organ class and preferred term',
      category: 'Safety',
      type: 'safety',
      author: 'Safety Team',
      createdDate: '2023-02-20',
      lastModified: '2023-11-15',
      tags: ['adverse events', 'safety', 'SOC', 'PT'],
      isFavorite: false,
      isStandard: true,
      usage: { timesUsed: 189, lastUsed: '2023-11-20' },
      output: {
        id: 'ae-output-1',
        name: 'AE Summary Table',
        displays: []
      }
    },
    {
      id: 'efficacy-primary-1',
      name: 'Primary Efficacy Analysis',
      description: 'Primary endpoint analysis table with statistical testing results',
      category: 'Efficacy',
      type: 'efficacy',
      author: 'Biostatistics',
      createdDate: '2023-03-10',
      lastModified: '2023-10-30',
      tags: ['efficacy', 'primary endpoint', 'statistics', 'p-values'],
      isFavorite: true,
      isStandard: true,
      usage: { timesUsed: 156, lastUsed: '2023-11-10' },
      output: {
        id: 'efficacy-output-1',
        name: 'Primary Efficacy Table',
        displays: []
      }
    },
    {
      id: 'vitals-summary-1',
      name: 'Vital Signs Summary',
      description: 'Summary of vital signs measurements over time with change from baseline',
      category: 'Clinical',
      type: 'clinical',
      author: 'Clinical Team',
      createdDate: '2023-04-05',
      lastModified: '2023-09-15',
      tags: ['vital signs', 'clinical', 'change from baseline'],
      isFavorite: false,
      isStandard: false,
      usage: { timesUsed: 98, lastUsed: '2023-10-25' },
      output: {
        id: 'vitals-output-1',
        name: 'Vital Signs Table',
        displays: []
      }
    },
    {
      id: 'custom-analysis-1',
      name: 'Custom Analysis Template',
      description: 'Flexible template for custom analysis tables',
      category: 'Custom',
      type: 'custom',
      author: 'John Doe',
      createdDate: '2023-11-01',
      lastModified: '2023-11-20',
      tags: ['custom', 'flexible', 'user-defined'],
      isFavorite: false,
      isStandard: false,
      usage: { timesUsed: 12, lastUsed: '2023-11-25' },
      output: {
        id: 'custom-output-1',
        name: 'Custom Analysis',
        displays: []
      }
    }
  ]

  useEffect(() => {
    if (visible) {
      loadTemplates()
    }
  }, [visible])

  useEffect(() => {
    filterTemplates()
  }, [templates, searchTerm, categoryFilter, typeFilter, showFavoritesOnly])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (categoryFilter) {
      filtered = filtered.filter(template => template.category === categoryFilter)
    }

    if (typeFilter) {
      filtered = filtered.filter(template => template.type === typeFilter)
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(template => template.isFavorite)
    }

    setFilteredTemplates(filtered)
  }

  const toggleFavorite = (templateId: string) => {
    setTemplates(prev =>
      prev.map(template =>
        template.id === templateId
          ? { ...template, isFavorite: !template.isFavorite }
          : template
      )
    )
  }

  const getTypeColor = (type: Template['type']) => {
    const colors = {
      clinical: 'blue',
      safety: 'red',
      efficacy: 'green',
      demographics: 'purple',
      custom: 'orange'
    }
    return colors[type] || 'default'
  }

  const renderTemplateCard = (template: Template) => (
    <Card
      key={template.id}
      size="small"
      hoverable
      style={{ height: '100%' }}
      cover={
        template.previewImage ? (
          <img 
            alt={template.name} 
            src={template.previewImage}
            style={{ height: 120, objectFit: 'cover' }}
          />
        ) : (
          <div style={{ 
            height: 120, 
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999'
          }}>
            <FileTableOutlined style={{ fontSize: 32 }} />
          </div>
        )
      }
      actions={[
        <Tooltip title="Preview">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => setPreviewTemplate(template)}
          />
        </Tooltip>,
        <Tooltip title={template.isFavorite ? "Remove from favorites" : "Add to favorites"}>
          <Button
            type="text"
            icon={template.isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            onClick={() => toggleFavorite(template.id)}
          />
        </Tooltip>,
        <Button
          type="primary"
          size="small"
          onClick={() => onSelect(template.id)}
        >
          Use Template
        </Button>
      ]}
    >
      <Card.Meta
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{template.name}</span>
            {template.isStandard && <Tag color="gold" size="small">Standard</Tag>}
          </div>
        }
        description={
          <div>
            <div style={{ marginBottom: 8, fontSize: '12px' }}>
              {template.description}
            </div>
            <div style={{ marginBottom: 8 }}>
              <Tag color={getTypeColor(template.type)} size="small">
                {template.type}
              </Tag>
              <Tag size="small">{template.category}</Tag>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#666'
            }}>
              <span>
                <UserOutlined /> {template.author}
              </span>
              <span>
                <CalendarOutlined /> {template.lastModified}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
              Used {template.usage.timesUsed} times
            </div>
          </div>
        }
      />
    </Card>
  )

  const categories = Array.from(new Set(templates.map(t => t.category)))
  const types = Array.from(new Set(templates.map(t => t.type)))

  return (
    <>
      <Modal
        title="Select Table Template"
        visible={visible}
        onCancel={onCancel}
        footer={[
          <Button key="library" onClick={() => setShowLibrary(true)}>
            Browse Library
          </Button>,
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>
        ]}
        width={1200}
        style={{ top: 20 }}
        bodyStyle={{ height: '80vh', overflow: 'auto' }}
      >
        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Search
              placeholder="Search templates..."
              allowClear
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Category"
              allowClear
              style={{ width: '100%' }}
              value={categoryFilter}
              onChange={setCategoryFilter}
            >
              {categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="Type"
              allowClear
              style={{ width: '100%' }}
              value={typeFilter}
              onChange={setTypeFilter}
            >
              {types.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Button
              type={showFavoritesOnly ? 'primary' : 'default'}
              icon={<StarOutlined />}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              style={{ width: '100%' }}
            >
              Favorites
            </Button>
          </Col>
          <Col span={4}>
            <div style={{ textAlign: 'right', color: '#666' }}>
              {filteredTemplates.length} of {templates.length} templates
            </div>
          </Col>
        </Row>

        {/* Templates Grid */}
        <Spin spinning={loading}>
          {filteredTemplates.length === 0 ? (
            <Empty
              description="No templates found"
              style={{ padding: '40px 0' }}
            />
          ) : (
            <Row gutter={[16, 16]}>
              {filteredTemplates.map(template => (
                <Col key={template.id} xs={24} sm={12} md={8} lg={6}>
                  {renderTemplateCard(template)}
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </Modal>

      {/* Template Library Modal */}
      <TemplateLibrary
        visible={showLibrary}
        onSelect={onSelect}
        onCancel={() => setShowLibrary(false)}
      />

      {/* Preview Modal */}
      <Modal
        title={`Preview: ${previewTemplate?.name}`}
        visible={!!previewTemplate}
        onCancel={() => setPreviewTemplate(null)}
        footer={[
          <Button
            key="use"
            type="primary"
            onClick={() => {
              if (previewTemplate) {
                onSelect(previewTemplate.id)
                setPreviewTemplate(null)
              }
            }}
          >
            Use This Template
          </Button>
        ]}
        width={800}
      >
        {previewTemplate && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>Description:</strong> {previewTemplate.description}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Tags:</strong>{' '}
              {previewTemplate.tags.map(tag => (
                <Tag key={tag} size="small">{tag}</Tag>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Author:</strong> {previewTemplate.author}
            </div>
            <div style={{ 
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              padding: 16,
              backgroundColor: '#fafafa'
            }}>
              <div style={{ textAlign: 'center', color: '#666' }}>
                Template preview would be displayed here
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default TemplateSelector