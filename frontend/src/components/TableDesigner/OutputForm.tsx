import React from 'react'
import { Form, Input, Select, Card, Row, Col } from 'antd'
import { Output, OutputFile, ExtensibleTerminologyTerm } from '../../types'

const { TextArea } = Input
const { Option } = Select

interface OutputFormProps {
  output: Partial<Output>
  onChange: (updates: Partial<Output>) => void
}

const OutputForm: React.FC<OutputFormProps> = ({ output, onChange }) => {
  const [form] = Form.useForm()

  const handleFieldChange = (field: string, value: any) => {
    onChange({ [field]: value })
  }

  const handleFileSpecChange = (index: number, field: string, value: any) => {
    const fileSpecs = [...(output.fileSpecifications || [])]
    if (!fileSpecs[index]) {
      fileSpecs[index] = {}
    }
    fileSpecs[index] = { ...fileSpecs[index], [field]: value }
    onChange({ fileSpecifications: fileSpecs })
  }

  const addFileSpecification = () => {
    const fileSpecs = [...(output.fileSpecifications || []), {}]
    onChange({ fileSpecifications: fileSpecs })
  }

  const removeFileSpecification = (index: number) => {
    const fileSpecs = (output.fileSpecifications || []).filter((_, i) => i !== index)
    onChange({ fileSpecifications: fileSpecs })
  }

  return (
    <div>
      <h3>Basic Output Information</h3>
      
      <Form
        form={form}
        layout="vertical"
        initialValues={output}
        onValuesChange={(changedValues) => {
          Object.keys(changedValues).forEach(key => {
            handleFieldChange(key, changedValues[key])
          })
        }}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              label="Output Name"
              name="name"
              rules={[{ required: true, message: 'Please enter output name' }]}
            >
              <Input
                placeholder="Enter output name"
                value={output.name}
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              label="Output ID"
              name="id"
              rules={[{ required: true, message: 'Please enter output ID' }]}
            >
              <Input
                placeholder="Enter unique output ID"
                value={output.id}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              label="Label"
              name="label"
            >
              <Input
                placeholder="Enter display label"
                value={output.label}
              />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              label="Version"
              name="version"
            >
              <Input
                placeholder="e.g., 1.0"
                value={output.version}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Description"
          name="description"
        >
          <TextArea
            rows={3}
            placeholder="Enter output description"
            value={output.description}
          />
        </Form.Item>
      </Form>

      <Card 
        title="File Specifications" 
        style={{ marginTop: 24 }}
        extra={
          <a onClick={addFileSpecification}>Add File Specification</a>
        }
      >
        {(output.fileSpecifications || []).map((fileSpec: OutputFile, index: number) => (
          <Card 
            key={index}
            size="small" 
            style={{ marginBottom: 16 }}
            extra={
              <a 
                onClick={() => removeFileSpecification(index)}
                style={{ color: '#ff4d4f' }}
              >
                Remove
              </a>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Form.Item label="File Name">
                  <Input
                    placeholder="output.rtf"
                    value={fileSpec.name}
                    onChange={(e) => handleFileSpecChange(index, 'name', e.target.value)}
                  />
                </Form.Item>
              </Col>
              
              <Col span={8}>
                <Form.Item label="File Type">
                  <Select
                    placeholder="Select file type"
                    value={fileSpec.fileType?.controlledTerm}
                    onChange={(value) => handleFileSpecChange(index, 'fileType', { controlledTerm: value })}
                  >
                    <Option value="pdf">PDF</Option>
                    <Option value="rtf">RTF</Option>
                    <Option value="docx">DOCX</Option>
                    <Option value="html">HTML</Option>
                    <Option value="xlsx">Excel</Option>
                    <Option value="sas7bdat">SAS Dataset</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col span={8}>
                <Form.Item label="Location">
                  <Input
                    placeholder="outputs/tables/"
                    value={fileSpec.location}
                    onChange={(e) => handleFileSpecChange(index, 'location', e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Style">
              <TextArea
                rows={2}
                placeholder="CSS or style specifications"
                value={fileSpec.style}
                onChange={(e) => handleFileSpecChange(index, 'style', e.target.value)}
              />
            </Form.Item>
          </Card>
        ))}
        
        {(!output.fileSpecifications || output.fileSpecifications.length === 0) && (
          <div style={{ 
            textAlign: 'center', 
            color: '#999', 
            padding: '40px 0' 
          }}>
            No file specifications defined. Click "Add File Specification" to start.
          </div>
        )}
      </Card>
    </div>
  )
}

export default OutputForm