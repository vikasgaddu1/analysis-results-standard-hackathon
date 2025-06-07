import React, { useState, useEffect } from 'react'
import { 
  Modal, 
  Tabs, 
  Card, 
  Row, 
  Col, 
  Button, 
  Tag, 
  Input,
  Select,
  Space,
  Tooltip,
  Badge,
  Empty,
  Upload,
  message
} from 'antd'
import { 
  DownloadOutlined,
  UploadOutlined,
  ShareAltOutlined,
  StarOutlined,
  StarFilled,
  FileTableOutlined,
  GlobalOutlined,
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { Output } from '../../../types'

const { TabPane } = Tabs
const { Search } = Input
const { Option } = Select

interface TemplateLibraryProps {
  visible: boolean
  onSelect: (templateId: string) => void
  onCancel: () => void
}

interface LibraryTemplate {
  id: string
  name: string
  description: string
  category: string
  author: string
  organization: string
  version: string
  downloads: number
  rating: number
  tags: string[]
  isPublic: boolean
  isVerified: boolean
  createdDate: string
  lastModified: string
  fileSize: string
  previewUrl?: string
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  visible,
  onSelect,
  onCancel
}) => {
  const [publicTemplates, setPublicTemplates] = useState<LibraryTemplate[]>([])
  const [organizationTemplates, setOrganizationTemplates] = useState<LibraryTemplate[]>([])
  const [myTemplates, setMyTemplates] = useState<LibraryTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Mock data for demonstration
  const mockPublicTemplates: LibraryTemplate[] = [
    {
      id: 'public-demo-1',
      name: 'FDA Demographics Template v2.1',
      description: 'FDA-compliant demographics table template with all required elements',
      category: 'Demographics',
      author: 'CDISC Foundation',
      organization: 'CDISC',
      version: '2.1.0',
      downloads: 15420,
      rating: 4.8,
      tags: ['FDA', 'demographics', 'compliance', 'ICH-E3'],
      isPublic: true,
      isVerified: true,
      createdDate: '2023-01-15',
      lastModified: '2023-11-30',
      fileSize: '15.2 KB'
    },
    {
      id: 'public-safety-1',
      name: 'EMA Safety Analysis Template',
      description: 'European Medicines Agency approved safety analysis template',
      category: 'Safety',
      author: 'EMA Standards Team',
      organization: 'EMA',
      version: '1.5.2',
      downloads: 8940,
      rating: 4.6,
      tags: ['EMA', 'safety', 'adverse events', 'european'],
      isPublic: true,
      isVerified: true,
      createdDate: '2023-03-20',
      lastModified: '2023-10-15',
      fileSize: '22.1 KB'
    }
  ]

  const mockOrgTemplates: LibraryTemplate[] = [
    {
      id: 'org-clinical-1',
      name: 'Company Standard Clinical Table',
      description: 'Internal standard for clinical efficacy tables',
      category: 'Efficacy',
      author: 'Biostatistics Team',
      organization: 'Your Organization',
      version: '3.0.1',
      downloads: 45,
      rating: 4.9,
      tags: ['internal', 'clinical', 'standard', 'efficacy'],
      isPublic: false,
      isVerified: false,
      createdDate: '2023-06-10',
      lastModified: '2023-12-01',
      fileSize: '18.7 KB'
    }
  ]

  const mockMyTemplates: LibraryTemplate[] = [
    {
      id: 'my-custom-1',
      name: 'My Custom Analysis Template',
      description: 'Personal template for pharmacokinetic analysis',
      category: 'Pharmacokinetics',
      author: 'Current User',
      organization: 'Your Organization',
      version: '1.0.0',
      downloads: 0,
      rating: 0,
      tags: ['PK', 'personal', 'custom'],
      isPublic: false,
      isVerified: false,
      createdDate: '2023-11-15',
      lastModified: '2023-11-20',
      fileSize: '12.5 KB'
    }
  ]

  useEffect(() => {
    if (visible) {
      loadTemplates()
    }
  }, [visible])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 800))
      setPublicTemplates(mockPublicTemplates)
      setOrganizationTemplates(mockOrgTemplates)
      setMyTemplates(mockMyTemplates)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (template: LibraryTemplate) => {
    // Simulate download
    message.success(`Downloading ${template.name}...`)
    // In real app, this would trigger actual download
  }

  const handleShare = (template: LibraryTemplate) => {
    // Simulate share functionality
    navigator.clipboard.writeText(`Template: ${template.name} - ${window.location.origin}/templates/${template.id}`)
    message.success('Template link copied to clipboard!')
  }

  const handleUpload = (info: any) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} uploaded successfully`)
      // Refresh templates
      loadTemplates()
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} upload failed`)
    }
  }

  const renderStarRating = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarFilled key={i} style={{ color: '#faad14' }} />)
    }
    
    if (hasHalfStar) {
      stars.push(<StarFilled key="half" style={{ color: '#faad14', opacity: 0.5 }} />)
    }
    
    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<StarOutlined key={`empty-${i}`} style={{ color: '#d9d9d9' }} />)
    }

    return (
      <span>
        {stars} <span style={{ marginLeft: 4, color: '#666' }}>({rating})</span>
      </span>
    )
  }

  const renderTemplateCard = (template: LibraryTemplate) => (
    <Card
      key={template.id}
      size="small"
      hoverable
      style={{ height: '100%' }}
      cover={
        <div style={{ 
          height: 100, 
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          position: 'relative'
        }}>
          <FileTableOutlined style={{ fontSize: 28 }} />
          {template.isVerified && (
            <Badge 
              count="✓" 
              style={{ 
                backgroundColor: '#52c41a',
                position: 'absolute',
                top: 8,
                right: 8
              }} 
            />
          )}
        </div>
      }
      actions={[
        <Tooltip title="Download">
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(template)}
          />
        </Tooltip>,
        <Tooltip title="Share">
          <Button
            type="text"
            icon={<ShareAltOutlined />}
            onClick={() => handleShare(template)}
          />
        </Tooltip>,
        <Button
          type="primary"
          size="small"
          onClick={() => onSelect(template.id)}
        >
          Use
        </Button>
      ]}
    >
      <Card.Meta
        title={
          <div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: 4 }}>
              {template.name}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              v{template.version} • {template.fileSize}
            </div>
          </div>
        }
        description={
          <div>
            <div style={{ marginBottom: 8, fontSize: '12px' }}>
              {template.description}
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <Tag size="small" color="blue">{template.category}</Tag>
              {template.isVerified && <Tag size="small" color="green">Verified</Tag>}
            </div>

            <div style={{ fontSize: '11px', marginBottom: 8 }}>
              {renderStarRating(template.rating)}
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#666'
            }}>
              <span>
                <UserOutlined /> {template.author}
              </span>
              <span>
                <DownloadOutlined /> {template.downloads.toLocaleString()}
              </span>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#999',
              marginTop: 4
            }}>
              <span>{template.organization}</span>
              <span>
                <ClockCircleOutlined /> {template.lastModified}
              </span>
            </div>
          </div>
        }
      />
    </Card>
  )

  const filterTemplates = (templates: LibraryTemplate[]) => {
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

    return filtered
  }

  const allCategories = Array.from(new Set([
    ...publicTemplates.map(t => t.category),
    ...organizationTemplates.map(t => t.category),
    ...myTemplates.map(t => t.category)
  ]))

  return (
    <Modal
      title="Template Library"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={1400}
      style={{ top: 20 }}
      bodyStyle={{ height: '85vh', overflow: 'auto' }}
    >
      {/* Search and Filters */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Search
            placeholder="Search templates..."
            allowClear
            onSearch={setSearchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={6}>
          <Select
            placeholder="Filter by category"
            allowClear
            style={{ width: '100%' }}
            value={categoryFilter}
            onChange={setCategoryFilter}
          >
            {allCategories.map(category => (
              <Option key={category} value={category}>{category}</Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Upload
            showUploadList={false}
            accept=".json,.yaml,.yml"
            onChange={handleUpload}
            customRequest={({ onSuccess }) => {
              // Simulate upload
              setTimeout(() => onSuccess?.('ok'), 1000)
            }}
          >
            <Button icon={<UploadOutlined />} style={{ width: '100%' }}>
              Upload Template
            </Button>
          </Upload>
        </Col>
      </Row>

      <Tabs defaultActiveKey="public" type="card">
        <TabPane 
          tab={
            <span>
              <GlobalOutlined />
              Public Templates
              <Badge 
                count={filterTemplates(publicTemplates).length} 
                style={{ marginLeft: 8 }}
                showZero
              />
            </span>
          } 
          key="public"
        >
          {filterTemplates(publicTemplates).length === 0 ? (
            <Empty description="No public templates found" />
          ) : (
            <Row gutter={[16, 16]}>
              {filterTemplates(publicTemplates).map(template => (
                <Col key={template.id} xs={24} sm={12} md={8} lg={6}>
                  {renderTemplateCard(template)}
                </Col>
              ))}
            </Row>
          )}
        </TabPane>

        <TabPane 
          tab={
            <span>
              <TeamOutlined />
              Organization
              <Badge 
                count={filterTemplates(organizationTemplates).length} 
                style={{ marginLeft: 8 }}
                showZero
              />
            </span>
          } 
          key="organization"
        >
          {filterTemplates(organizationTemplates).length === 0 ? (
            <Empty description="No organization templates found" />
          ) : (
            <Row gutter={[16, 16]}>
              {filterTemplates(organizationTemplates).map(template => (
                <Col key={template.id} xs={24} sm={12} md={8} lg={6}>
                  {renderTemplateCard(template)}
                </Col>
              ))}
            </Row>
          )}
        </TabPane>

        <TabPane 
          tab={
            <span>
              <UserOutlined />
              My Templates
              <Badge 
                count={filterTemplates(myTemplates).length} 
                style={{ marginLeft: 8 }}
                showZero
              />
            </span>
          } 
          key="my"
        >
          {filterTemplates(myTemplates).length === 0 ? (
            <Empty 
              description="No personal templates found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" icon={<UploadOutlined />}>
                Upload Your First Template
              </Button>
            </Empty>
          ) : (
            <Row gutter={[16, 16]}>
              {filterTemplates(myTemplates).map(template => (
                <Col key={template.id} xs={24} sm={12} md={8} lg={6}>
                  {renderTemplateCard(template)}
                </Col>
              ))}
            </Row>
          )}
        </TabPane>
      </Tabs>
    </Modal>
  )
}

export default TemplateLibrary