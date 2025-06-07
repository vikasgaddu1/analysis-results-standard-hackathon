import React from 'react'
import { 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Card, 
  Row, 
  Col,
  ColorPicker,
  Slider,
  Space,
  Button,
  Tooltip
} from 'antd'
import { ReloadOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons'

const { Option } = Select

interface CustomStylerProps {
  section: 'typography' | 'layout' | 'colors' | 'spacing'
  styles: any
  onChange: (updates: any) => void
}

const CustomStyler: React.FC<CustomStylerProps> = ({
  section,
  styles,
  onChange
}) => {
  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value })
  }

  const renderTypographyControls = () => (
    <div>
      <Card title="Font Settings" size="small" style={{ marginBottom: 16 }}>
        <Form layout="vertical" size="small">
          <Form.Item label="Font Family">
            <Select
              value={styles.fontFamily}
              onChange={(value) => handleChange('fontFamily', value)}
              style={{ width: '100%' }}
            >
              <Option value="Arial, sans-serif">Arial</Option>
              <Option value="Times New Roman, serif">Times New Roman</Option>
              <Option value="Calibri, sans-serif">Calibri</Option>
              <Option value="Helvetica, sans-serif">Helvetica</Option>
              <Option value="Segoe UI, sans-serif">Segoe UI</Option>
              <Option value="Georgia, serif">Georgia</Option>
              <Option value="Courier New, monospace">Courier New</Option>
            </Select>
          </Form.Item>

          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Form.Item label="Font Size">
                <InputNumber
                  value={styles.fontSize}
                  onChange={(value) => handleChange('fontSize', value)}
                  min={6}
                  max={24}
                  step={0.5}
                  style={{ width: '100%' }}
                  addonAfter="px"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Header Size">
                <InputNumber
                  value={styles.headerFontSize}
                  onChange={(value) => handleChange('headerFontSize', value)}
                  min={6}
                  max={24}
                  step={0.5}
                  style={{ width: '100%' }}
                  addonAfter="px"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Form.Item label="Font Weight">
                <Select
                  value={styles.fontWeight}
                  onChange={(value) => handleChange('fontWeight', value)}
                  style={{ width: '100%' }}
                >
                  <Option value="normal">Normal</Option>
                  <Option value="bold">Bold</Option>
                  <Option value="lighter">Lighter</Option>
                  <Option value="bolder">Bolder</Option>
                  <Option value="100">100</Option>
                  <Option value="200">200</Option>
                  <Option value="300">300</Option>
                  <Option value="400">400</Option>
                  <Option value="500">500</Option>
                  <Option value="600">600</Option>
                  <Option value="700">700</Option>
                  <Option value="800">800</Option>
                  <Option value="900">900</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Line Height">
                <InputNumber
                  value={styles.lineHeight}
                  onChange={(value) => handleChange('lineHeight', value)}
                  min={0.8}
                  max={3}
                  step={0.1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title="Text Formatting" size="small">
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: '12px', marginBottom: 4 }}>Font Size Slider</div>
          <Slider
            value={styles.fontSize}
            onChange={(value) => handleChange('fontSize', value)}
            min={6}
            max={24}
            step={0.5}
            marks={{
              6: '6px',
              10: '10px',
              12: '12px',
              14: '14px',
              18: '18px',
              24: '24px'
            }}
          />
        </div>
        
        <div>
          <div style={{ fontSize: '12px', marginBottom: 4 }}>Line Height Slider</div>
          <Slider
            value={styles.lineHeight}
            onChange={(value) => handleChange('lineHeight', value)}
            min={0.8}
            max={3}
            step={0.1}
            marks={{
              0.8: '0.8',
              1.0: '1.0',
              1.2: '1.2',
              1.5: '1.5',
              2.0: '2.0',
              3.0: '3.0'
            }}
          />
        </div>
      </Card>
    </div>
  )

  const renderLayoutControls = () => (
    <div>
      <Card title="Table Layout" size="small" style={{ marginBottom: 16 }}>
        <Form layout="vertical" size="small">
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Form.Item label="Cell Padding">
                <InputNumber
                  value={styles.cellPadding}
                  onChange={(value) => handleChange('cellPadding', value)}
                  min={0}
                  max={50}
                  style={{ width: '100%' }}
                  addonAfter="px"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Border Width">
                <InputNumber
                  value={styles.borderWidth}
                  onChange={(value) => handleChange('borderWidth', value)}
                  min={0}
                  max={10}
                  style={{ width: '100%' }}
                  addonAfter="px"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Form.Item label="Border Style">
                <Select
                  value={styles.borderStyle}
                  onChange={(value) => handleChange('borderStyle', value)}
                  style={{ width: '100%' }}
                >
                  <Option value="solid">Solid</Option>
                  <Option value="dashed">Dashed</Option>
                  <Option value="dotted">Dotted</Option>
                  <Option value="double">Double</Option>
                  <Option value="none">None</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Text Alignment">
                <Select
                  value={styles.alignment}
                  onChange={(value) => handleChange('alignment', value)}
                  style={{ width: '100%' }}
                >
                  <Option value="left">Left</Option>
                  <Option value="center">Center</Option>
                  <Option value="right">Right</Option>
                  <Option value="justify">Justify</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Table Width">
            <Select
              value={styles.tableWidth}
              onChange={(value) => handleChange('tableWidth', value)}
              style={{ width: '100%' }}
            >
              <Option value="100%">Full Width (100%)</Option>
              <Option value="90%">90%</Option>
              <Option value="80%">80%</Option>
              <Option value="70%">70%</Option>
              <Option value="auto">Auto</Option>
              <Option value="fit-content">Fit Content</Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Spacing Controls" size="small">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '12px', marginBottom: 4 }}>Cell Padding</div>
          <Slider
            value={styles.cellPadding}
            onChange={(value) => handleChange('cellPadding', value)}
            min={0}
            max={30}
            marks={{
              0: '0',
              5: '5px',
              10: '10px',
              15: '15px',
              20: '20px',
              30: '30px'
            }}
          />
        </div>
        
        <div>
          <div style={{ fontSize: '12px', marginBottom: 4 }}>Border Width</div>
          <Slider
            value={styles.borderWidth}
            onChange={(value) => handleChange('borderWidth', value)}
            min={0}
            max={5}
            marks={{
              0: '0',
              1: '1px',
              2: '2px',
              3: '3px',
              4: '4px',
              5: '5px'
            }}
          />
        </div>
      </Card>
    </div>
  )

  const renderColorControls = () => (
    <div>
      <Card title="Color Palette" size="small" style={{ marginBottom: 16 }}>
        <Form layout="vertical" size="small">
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Form.Item label="Primary Color">
                <Input
                  type="color"
                  value={styles.primary}
                  onChange={(e) => handleChange('primary', e.target.value)}
                  style={{ width: '100%', height: '32px' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Secondary Color">
                <Input
                  type="color"
                  value={styles.secondary}
                  onChange={(e) => handleChange('secondary', e.target.value)}
                  style={{ width: '100%', height: '32px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Form.Item label="Background Color">
                <Input
                  type="color"
                  value={styles.background}
                  onChange={(e) => handleChange('background', e.target.value)}
                  style={{ width: '100%', height: '32px' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Header Background">
                <Input
                  type="color"
                  value={styles.header}
                  onChange={(e) => handleChange('header', e.target.value)}
                  style={{ width: '100%', height: '32px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Form.Item label="Text Color">
                <Input
                  type="color"
                  value={styles.text}
                  onChange={(e) => handleChange('text', e.target.value)}
                  style={{ width: '100%', height: '32px' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Border Color">
                <Input
                  type="color"
                  value={styles.border}
                  onChange={(e) => handleChange('border', e.target.value)}
                  style={{ width: '100%', height: '32px' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title="Quick Color Schemes" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            size="small"
            style={{ width: '100%' }}
            onClick={() => onChange({
              primary: '#1890ff',
              secondary: '#52c41a',
              background: '#ffffff',
              border: '#d9d9d9',
              text: '#262626',
              header: '#f5f5f5'
            })}
          >
            Default Blue
          </Button>
          <Button
            size="small"
            style={{ width: '100%' }}
            onClick={() => onChange({
              primary: '#000000',
              secondary: '#666666',
              background: '#ffffff',
              border: '#000000',
              text: '#000000',
              header: '#f0f0f0'
            })}
          >
            High Contrast
          </Button>
          <Button
            size="small"
            style={{ width: '100%' }}
            onClick={() => onChange({
              primary: '#722ed1',
              secondary: '#eb2f96',
              background: '#ffffff',
              border: '#d9d9d9',
              text: '#262626',
              header: '#f9f0ff'
            })}
          >
            Purple Theme
          </Button>
          <Button
            size="small"
            style={{ width: '100%' }}
            onClick={() => onChange({
              primary: '#fa8c16',
              secondary: '#faad14',
              background: '#ffffff',
              border: '#d9d9d9',
              text: '#262626',
              header: '#fff7e6'
            })}
          >
            Orange Theme
          </Button>
        </Space>
      </Card>
    </div>
  )

  const renderSpacingControls = () => (
    <Card title="Spacing Controls" size="small">
      <Form layout="vertical" size="small">
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <Form.Item label="Margin Top">
              <InputNumber
                value={styles.marginTop}
                onChange={(value) => handleChange('marginTop', value)}
                min={0}
                max={100}
                style={{ width: '100%' }}
                addonAfter="px"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Margin Bottom">
              <InputNumber
                value={styles.marginBottom}
                onChange={(value) => handleChange('marginBottom', value)}
                min={0}
                max={100}
                style={{ width: '100%' }}
                addonAfter="px"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Section Spacing">
          <InputNumber
            value={styles.sectionSpacing}
            onChange={(value) => handleChange('sectionSpacing', value)}
            min={0}
            max={50}
            style={{ width: '100%' }}
            addonAfter="px"
          />
        </Form.Item>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: '12px', marginBottom: 4 }}>Section Spacing</div>
          <Slider
            value={styles.sectionSpacing}
            onChange={(value) => handleChange('sectionSpacing', value)}
            min={0}
            max={50}
            marks={{
              0: '0',
              10: '10px',
              20: '20px',
              30: '30px',
              40: '40px',
              50: '50px'
            }}
          />
        </div>
      </Form>
    </Card>
  )

  const renderControls = () => {
    switch (section) {
      case 'typography':
        return renderTypographyControls()
      case 'layout':
        return renderLayoutControls()
      case 'colors':
        return renderColorControls()
      case 'spacing':
        return renderSpacingControls()
      default:
        return null
    }
  }

  return (
    <div style={{ padding: '16px 0' }}>
      {renderControls()}
      
      {/* Reset Button */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Tooltip title="Reset to default values">
          <Button
            icon={<ReloadOutlined />}
            size="small"
            onClick={() => {
              // Reset to default values based on section
              const defaults = {
                typography: {
                  fontFamily: 'Arial, sans-serif',
                  fontSize: 12,
                  headerFontSize: 14,
                  fontWeight: 'normal',
                  lineHeight: 1.4
                },
                layout: {
                  cellPadding: 8,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  tableWidth: '100%',
                  alignment: 'left'
                },
                colors: {
                  primary: '#1890ff',
                  secondary: '#52c41a',
                  background: '#ffffff',
                  border: '#d9d9d9',
                  text: '#262626',
                  header: '#f5f5f5'
                },
                spacing: {
                  marginTop: 20,
                  marginBottom: 20,
                  sectionSpacing: 16
                }
              }
              onChange(defaults[section])
            }}
          >
            Reset {section}
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}

export default CustomStyler