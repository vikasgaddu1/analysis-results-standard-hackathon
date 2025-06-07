import React, { useState, useMemo } from 'react'
import { 
  Modal, 
  Card, 
  Select, 
  Space, 
  Button, 
  Divider, 
  Typography,
  Row,
  Col,
  Tag
} from 'antd'
import { 
  DownloadOutlined, 
  PrinterOutlined, 
  FullscreenOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons'
import { Output, OutputDisplay, DisplaySection } from '../../types'

const { Option } = Select
const { Title, Text } = Typography

interface TablePreviewProps {
  visible: boolean
  output: Output
  onClose: () => void
}

const TablePreview: React.FC<TablePreviewProps> = ({
  visible,
  output,
  onClose
}) => {
  const [selectedDisplay, setSelectedDisplay] = useState<string>('')
  const [previewFormat, setPreviewFormat] = useState<'html' | 'pdf' | 'rtf'>('html')
  const [zoom, setZoom] = useState<number>(100)
  const [fullscreen, setFullscreen] = useState(false)

  const displays = output?.displays || []
  const currentDisplay = displays.find(d => d.id === selectedDisplay) || displays[0]

  // Initialize selected display
  React.useEffect(() => {
    if (displays.length > 0 && !selectedDisplay) {
      setSelectedDisplay(displays[0].id)
    }
  }, [displays, selectedDisplay])

  const handleExport = (format: 'pdf' | 'rtf' | 'html' | 'docx') => {
    // Implementation would call export API
    console.log(`Exporting to ${format}`)
  }

  const handlePrint = () => {
    window.print()
  }

  const renderSectionContent = (section: DisplaySection) => {
    const sectionStyles: Record<string, React.CSSProperties> = {
      Header: {
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold',
        padding: '12px',
        borderBottom: '2px solid #ddd'
      },
      Title: {
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '16px',
        borderBottom: '1px solid #eee'
      },
      Rowlabel: {
        fontWeight: 'bold',
        backgroundColor: '#fafafa',
        padding: '8px 12px',
        borderRight: '1px solid #ddd'
      },
      Body: {
        padding: '8px 12px',
        borderBottom: '1px solid #f0f0f0'
      },
      Footer: {
        backgroundColor: '#f5f5f5',
        padding: '8px 12px',
        borderTop: '1px solid #ddd',
        fontSize: '12px'
      },
      Footnote: {
        fontSize: '11px',
        color: '#666',
        padding: '4px 12px',
        fontStyle: 'italic'
      },
      Abbreviation: {
        fontSize: '10px',
        color: '#888',
        padding: '4px 12px'
      },
      Legend: {
        fontSize: '11px',
        padding: '8px 12px',
        backgroundColor: '#f9f9f9',
        border: '1px solid #e8e8e8'
      }
    }

    return (
      <div key={section.sectionType} style={sectionStyles[section.sectionType]}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginBottom: section.orderedSubSections?.length ? 8 : 0 
        }}>
          <Tag color="blue" size="small">{section.sectionType}</Tag>
        </div>
        
        {section.orderedSubSections?.map((orderedSub, index) => (
          <div key={index} style={{ marginBottom: 4 }}>
            {orderedSub.subSection.text}
          </div>
        ))}
      </div>
    )
  }

  const renderHTMLPreview = () => {
    if (!currentDisplay) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 0',
          color: '#999'
        }}>
          No display selected or available
        </div>
      )
    }

    return (
      <div 
        style={{ 
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
          width: `${10000 / zoom}%`,
          minHeight: '400px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        {/* Display Title */}
        {currentDisplay.displayTitle && (
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '20px',
            borderBottom: '2px solid #000'
          }}>
            {currentDisplay.displayTitle}
          </div>
        )}

        {/* Display Sections */}
        {currentDisplay.displaySections.map((section, index) => (
          <div key={index}>
            {renderSectionContent(section)}
          </div>
        ))}

        {/* Sample Table Structure */}
        <div style={{ padding: '20px' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            border: '1px solid #000'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ 
                  border: '1px solid #000', 
                  padding: '8px', 
                  textAlign: 'left' 
                }}>
                  Parameter
                </th>
                <th style={{ 
                  border: '1px solid #000', 
                  padding: '8px', 
                  textAlign: 'center' 
                }}>
                  Treatment A<br/>(N=150)
                </th>
                <th style={{ 
                  border: '1px solid #000', 
                  padding: '8px', 
                  textAlign: 'center' 
                }}>
                  Treatment B<br/>(N=148)
                </th>
                <th style={{ 
                  border: '1px solid #000', 
                  padding: '8px', 
                  textAlign: 'center' 
                }}>
                  Total<br/>(N=298)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ 
                  border: '1px solid #000', 
                  padding: '8px',
                  fontWeight: 'bold'
                }}>
                  Age (years)
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  65.2 (12.4)
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  64.8 (11.9)
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  65.0 (12.1)
                </td>
              </tr>
              <tr>
                <td style={{ 
                  border: '1px solid #000', 
                  padding: '8px',
                  fontWeight: 'bold'
                }}>
                  Gender, n (%)
                </td>
                <td style={{ border: '1px solid #000', padding: '8px' }}></td>
                <td style={{ border: '1px solid #000', padding: '8px' }}></td>
                <td style={{ border: '1px solid #000', padding: '8px' }}></td>
              </tr>
              <tr>
                <td style={{ 
                  border: '1px solid #000', 
                  padding: '8px',
                  paddingLeft: '20px'
                }}>
                  Male
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  85 (56.7)
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  82 (55.4)
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  167 (56.0)
                </td>
              </tr>
              <tr>
                <td style={{ 
                  border: '1px solid #000', 
                  padding: '8px',
                  paddingLeft: '20px'
                }}>
                  Female
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  65 (43.3)
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  66 (44.6)
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  131 (44.0)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer sections */}
        {currentDisplay.displaySections
          .filter(section => ['Footer', 'Footnote', 'Abbreviation'].includes(section.sectionType))
          .map((section, index) => (
            <div key={index}>
              {renderSectionContent(section)}
            </div>
          ))}
      </div>
    )
  }

  const renderPDFPreview = () => (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px 0',
      color: '#666'
    }}>
      <div style={{ fontSize: '16px', marginBottom: 16 }}>
        PDF Preview
      </div>
      <div style={{ marginBottom: 24 }}>
        PDF preview would show the table formatted for print output
      </div>
      <Button 
        type="primary" 
        icon={<DownloadOutlined />}
        onClick={() => handleExport('pdf')}
      >
        Generate PDF
      </Button>
    </div>
  )

  const renderRTFPreview = () => (
    <div style={{ 
      textAlign: 'center', 
      padding: '40px 0',
      color: '#666'
    }}>
      <div style={{ fontSize: '16px', marginBottom: 16 }}>
        RTF Preview
      </div>
      <div style={{ marginBottom: 24 }}>
        RTF preview would show the table formatted for Word/RTF output
      </div>
      <Button 
        type="primary" 
        icon={<DownloadOutlined />}
        onClick={() => handleExport('rtf')}
      >
        Generate RTF
      </Button>
    </div>
  )

  const renderPreviewContent = () => {
    switch (previewFormat) {
      case 'html':
        return renderHTMLPreview()
      case 'pdf':
        return renderPDFPreview()
      case 'rtf':
        return renderRTFPreview()
      default:
        return renderHTMLPreview()
    }
  }

  return (
    <Modal
      title="Table Preview"
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={fullscreen ? '95vw' : '90vw'}
      style={fullscreen ? { top: 20 } : {}}
      bodyStyle={{ 
        height: fullscreen ? '85vh' : '70vh', 
        overflow: 'auto',
        padding: '16px'
      }}
    >
      {/* Preview Controls */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select
            placeholder="Select Display"
            style={{ width: '100%' }}
            value={selectedDisplay}
            onChange={setSelectedDisplay}
          >
            {displays.map(display => (
              <Option key={display.id} value={display.id}>
                {display.name || display.label || `Display ${display.order}`}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col span={4}>
          <Select
            value={previewFormat}
            onChange={setPreviewFormat}
            style={{ width: '100%' }}
          >
            <Option value="html">HTML</Option>
            <Option value="pdf">PDF</Option>
            <Option value="rtf">RTF</Option>
          </Select>
        </Col>
        
        <Col span={6}>
          <Space>
            <Button
              size="small"
              icon={<ZoomOutOutlined />}
              onClick={() => setZoom(Math.max(zoom - 25, 25))}
              disabled={zoom <= 25}
            />
            <Select
              value={zoom}
              onChange={setZoom}
              style={{ width: 80 }}
              size="small"
            >
              <Option value={25}>25%</Option>
              <Option value={50}>50%</Option>
              <Option value={75}>75%</Option>
              <Option value={100}>100%</Option>
              <Option value={125}>125%</Option>
              <Option value={150}>150%</Option>
            </Select>
            <Button
              size="small"
              icon={<ZoomInOutlined />}
              onClick={() => setZoom(Math.min(zoom + 25, 200))}
              disabled={zoom >= 200}
            />
          </Space>
        </Col>
        
        <Col span={8}>
          <Space style={{ float: 'right' }}>
            <Button
              size="small"
              icon={<FullscreenOutlined />}
              onClick={() => setFullscreen(!fullscreen)}
            >
              {fullscreen ? 'Exit' : 'Fullscreen'}
            </Button>
            <Button
              size="small"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
            >
              Print
            </Button>
            <Select
              placeholder="Export"
              style={{ width: 100 }}
              size="small"
              onSelect={handleExport}
            >
              <Option value="pdf">PDF</Option>
              <Option value="rtf">RTF</Option>
              <Option value="docx">DOCX</Option>
              <Option value="html">HTML</Option>
            </Select>
          </Space>
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      {/* Preview Content */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '20px',
        minHeight: '400px',
        overflow: 'auto'
      }}>
        {renderPreviewContent()}
      </div>

      {/* Preview Info */}
      {currentDisplay && (
        <Card size="small" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Text strong>Display:</Text> {currentDisplay.name}
            </Col>
            <Col span={6}>
              <Text strong>Sections:</Text> {currentDisplay.displaySections.length}
            </Col>
            <Col span={6}>
              <Text strong>Version:</Text> {currentDisplay.version || 'N/A'}
            </Col>
            <Col span={6}>
              <Text strong>Order:</Text> {currentDisplay.order}
            </Col>
          </Row>
        </Card>
      )}
    </Modal>
  )
}

export default TablePreview