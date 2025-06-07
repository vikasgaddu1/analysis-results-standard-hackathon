import React, { useState, useEffect } from 'react'
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  DatePicker, 
  Switch,
  Row,
  Col,
  Card,
  Divider,
  ColorPicker,
  Radio,
  Space
} from 'antd'
import { BoldOutlined, ItalicOutlined, UnderlineOutlined } from '@ant-design/icons'
import moment from 'moment'

const { TextArea } = Input
const { Option } = Select

interface TableColumn {
  id: string
  name: string
  dataType: 'text' | 'number' | 'date' | 'category'
  width?: number
  alignment: 'left' | 'center' | 'right'
  format?: string
}

interface CellValue {
  rawValue?: any
  formattedValue?: string
  style?: {
    fontWeight?: 'normal' | 'bold'
    fontStyle?: 'normal' | 'italic'
    textDecoration?: 'none' | 'underline'
    backgroundColor?: string
    color?: string
    fontSize?: number
    border?: string
  }
  metadata?: {
    isCalculated?: boolean
    formula?: string
    source?: string
    note?: string
  }
}

interface CellEditorProps {
  visible: boolean
  rowId?: string
  columnId?: string
  value?: CellValue
  column?: TableColumn
  onSave: (value: CellValue) => void
  onCancel: () => void
}

const CellEditor: React.FC<CellEditorProps> = ({
  visible,
  rowId,
  columnId,
  value = {},
  column,
  onSave,
  onCancel
}) => {
  const [form] = Form.useForm()
  const [cellValue, setCellValue] = useState<CellValue>(value)
  const [activeTab, setActiveTab] = useState('content')

  useEffect(() => {
    if (visible) {
      setCellValue(value || {})
      form.setFieldsValue({
        rawValue: value?.rawValue,
        formattedValue: value?.formattedValue,
        isCalculated: value?.metadata?.isCalculated || false,
        formula: value?.metadata?.formula,
        source: value?.metadata?.source,
        note: value?.metadata?.note,
        fontWeight: value?.style?.fontWeight || 'normal',
        fontStyle: value?.style?.fontStyle || 'normal',
        textDecoration: value?.style?.textDecoration || 'none',
        backgroundColor: value?.style?.backgroundColor,
        color: value?.style?.color,
        fontSize: value?.style?.fontSize || 12,
        border: value?.style?.border
      })
    }
  }, [visible, value, form])

  const handleSave = () => {
    form.validateFields().then(values => {
      const updatedValue: CellValue = {
        rawValue: values.rawValue,
        formattedValue: values.formattedValue,
        style: {
          fontWeight: values.fontWeight,
          fontStyle: values.fontStyle,
          textDecoration: values.textDecoration,
          backgroundColor: values.backgroundColor,
          color: values.color,
          fontSize: values.fontSize,
          border: values.border
        },
        metadata: {
          isCalculated: values.isCalculated,
          formula: values.formula,
          source: values.source,
          note: values.note
        }
      }
      onSave(updatedValue)
    })
  }

  const renderContentTab = () => {
    if (!column) return null

    switch (column.dataType) {
      case 'text':
        return (
          <>
            <Form.Item
              label="Text Content"
              name="rawValue"
            >
              <TextArea
                rows={3}
                placeholder="Enter text content"
              />
            </Form.Item>
            <Form.Item
              label="Formatted Display"
              name="formattedValue"
              help="Override how this value is displayed (optional)"
            >
              <Input placeholder="e.g., formatted with HTML tags" />
            </Form.Item>
          </>
        )

      case 'number':
        return (
          <>
            <Form.Item
              label="Numeric Value"
              name="rawValue"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter number"
                precision={column.format?.includes('.') ? 2 : 0}
              />
            </Form.Item>
            <Form.Item
              label="Formatted Display"
              name="formattedValue"
              help="How the number should be displayed (e.g., with units, percentages)"
            >
              <Input placeholder="e.g., 12.5%, $1,234.00, 12.5 kg" />
            </Form.Item>
          </>
        )

      case 'date':
        return (
          <>
            <Form.Item
              label="Date Value"
              name="rawValue"
            >
              <DatePicker
                style={{ width: '100%' }}
                format={column.format || 'YYYY-MM-DD'}
              />
            </Form.Item>
            <Form.Item
              label="Formatted Display"
              name="formattedValue"
              help="Custom date format display"
            >
              <Input placeholder="e.g., Jan 15, 2023" />
            </Form.Item>
          </>
        )

      case 'category':
        return (
          <>
            <Form.Item
              label="Category Value"
              name="rawValue"
            >
              <Select
                placeholder="Select or enter category"
                allowClear
                showSearch
                mode="tags"
                style={{ width: '100%' }}
              >
                <Option value="High">High</Option>
                <Option value="Medium">Medium</Option>
                <Option value="Low">Low</Option>
                <Option value="Yes">Yes</Option>
                <Option value="No">No</Option>
                <Option value="N/A">N/A</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Formatted Display"
              name="formattedValue"
            >
              <Input placeholder="Custom display format" />
            </Form.Item>
          </>
        )

      default:
        return (
          <Form.Item
            label="Value"
            name="rawValue"
          >
            <Input placeholder="Enter value" />
          </Form.Item>
        )
    }
  }

  const renderStyleTab = () => (
    <>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Form.Item label="Font Weight" name="fontWeight">
            <Radio.Group>
              <Radio.Button value="normal">Normal</Radio.Button>
              <Radio.Button value="bold">Bold</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Font Style" name="fontStyle">
            <Radio.Group>
              <Radio.Button value="normal">Normal</Radio.Button>
              <Radio.Button value="italic">Italic</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Text Decoration" name="textDecoration">
            <Radio.Group>
              <Radio.Button value="none">None</Radio.Button>
              <Radio.Button value="underline">Underline</Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Form.Item label="Font Size" name="fontSize">
            <InputNumber
              min={8}
              max={72}
              style={{ width: '100%' }}
              addonAfter="px"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Text Color" name="color">
            <Input
              type="color"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Background Color" name="backgroundColor">
            <Input
              type="color"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Border" name="border">
        <Select placeholder="Select border style">
          <Option value="">None</Option>
          <Option value="1px solid #000">Solid Black</Option>
          <Option value="1px dashed #000">Dashed Black</Option>
          <Option value="2px solid #000">Thick Solid</Option>
          <Option value="1px solid #ccc">Light Gray</Option>
        </Select>
      </Form.Item>
    </>
  )

  const renderMetadataTab = () => (
    <>
      <Form.Item 
        label="Is Calculated"
        name="isCalculated"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        label="Formula"
        name="formula"
        help="Mathematical formula or calculation logic"
      >
        <TextArea
          rows={2}
          placeholder="e.g., SUM(A1:A10), AVERAGE(col1)"
          disabled={!form.getFieldValue('isCalculated')}
        />
      </Form.Item>

      <Form.Item
        label="Data Source"
        name="source"
        help="Where this data comes from"
      >
        <Input placeholder="e.g., ADSL.SAFFL, calculated field, manual entry" />
      </Form.Item>

      <Form.Item
        label="Note"
        name="note"
        help="Additional notes or comments about this cell"
      >
        <TextArea
          rows={3}
          placeholder="Any additional information about this cell value"
        />
      </Form.Item>
    </>
  )

  const renderPreview = () => {
    const style = {
      fontWeight: form.getFieldValue('fontWeight') || 'normal',
      fontStyle: form.getFieldValue('fontStyle') || 'normal',
      textDecoration: form.getFieldValue('textDecoration') || 'none',
      backgroundColor: form.getFieldValue('backgroundColor'),
      color: form.getFieldValue('color'),
      fontSize: `${form.getFieldValue('fontSize') || 12}px`,
      border: form.getFieldValue('border'),
      padding: '8px',
      minHeight: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: column?.alignment || 'left'
    }

    const displayValue = form.getFieldValue('formattedValue') || 
                        form.getFieldValue('rawValue') || 
                        'Preview text'

    return (
      <Card title="Preview" size="small">
        <div style={style}>
          {displayValue}
        </div>
      </Card>
    )
  }

  return (
    <Modal
      title={`Edit Cell (${column?.name || 'Unknown Column'})`}
      visible={visible}
      onCancel={onCancel}
      onOk={handleSave}
      width={700}
      okText="Save Cell"
    >
      <Form
        form={form}
        layout="vertical"
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Radio.Group value={activeTab} onChange={(e) => setActiveTab(e.target.value)}>
              <Radio.Button value="content">Content</Radio.Button>
              <Radio.Button value="style">Style</Radio.Button>
              <Radio.Button value="metadata">Metadata</Radio.Button>
            </Radio.Group>
          </Space>
        </div>

        {activeTab === 'content' && renderContentTab()}
        {activeTab === 'style' && renderStyleTab()}
        {activeTab === 'metadata' && renderMetadataTab()}

        <Divider />
        {renderPreview()}
      </Form>
    </Modal>
  )
}

export default CellEditor