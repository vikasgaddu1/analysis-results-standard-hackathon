import React from 'react'
import { Form, Input, Select, Card, Row, Col, Divider } from 'antd'
import { Analysis, ReportingEvent, ExtensibleTerminologyTerm } from '../../types'

const { TextArea } = Input
const { Option } = Select

interface AnalysisFormProps {
  analysis: Partial<Analysis>
  onChange: (analysis: Partial<Analysis>) => void
  reportingEvent?: ReportingEvent
}

// Predefined options for analysis purposes and reasons
const analysisPurposes = [
  { value: 'Primary', label: 'Primary Analysis' },
  { value: 'Secondary', label: 'Secondary Analysis' },
  { value: 'Exploratory', label: 'Exploratory Analysis' },
  { value: 'PostHoc', label: 'Post-hoc Analysis' },
  { value: 'Interim', label: 'Interim Analysis' },
  { value: 'Safety', label: 'Safety Analysis' },
  { value: 'Efficacy', label: 'Efficacy Analysis' },
  { value: 'PopulationPK', label: 'Population PK Analysis' },
  { value: 'Biomarker', label: 'Biomarker Analysis' }
]

const analysisReasons = [
  { value: 'SpecifiedInPlan', label: 'Specified in Plan' },
  { value: 'SpecifiedInSAP', label: 'Specified in SAP' },
  { value: 'Regulatory', label: 'Regulatory Requirement' },
  { value: 'DataDriven', label: 'Data Driven' },
  { value: 'RequestedByInvestigator', label: 'Requested by Investigator' },
  { value: 'RequestedBySponsor', label: 'Requested by Sponsor' },
  { value: 'Other', label: 'Other' }
]

export const AnalysisForm: React.FC<AnalysisFormProps> = ({
  analysis,
  onChange,
  reportingEvent
}) => {
  const [form] = Form.useForm()

  const handleFieldChange = (field: string, value: any) => {
    const updatedAnalysis = { ...analysis, [field]: value }
    onChange(updatedAnalysis)
  }

  const handleTermChange = (field: 'purpose' | 'reason', value: string) => {
    const term: ExtensibleTerminologyTerm = {
      controlledTerm: value
    }
    handleFieldChange(field, term)
  }

  const availableMethods = reportingEvent?.methods || []

  return (
    <Card title="Analysis Information" size="small">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: analysis.name,
          label: analysis.label,
          description: analysis.description,
          version: analysis.version,
          purpose: analysis.purpose?.controlledTerm,
          reason: analysis.reason?.controlledTerm,
          methodId: analysis.methodId
        }}
        onValuesChange={(changedValues) => {
          Object.keys(changedValues).forEach(key => {
            if (key === 'purpose' || key === 'reason') {
              handleTermChange(key, changedValues[key])
            } else {
              handleFieldChange(key, changedValues[key])
            }
          })
        }}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Analysis Name"
              rules={[
                { required: true, message: 'Analysis name is required' },
                { max: 100, message: 'Name cannot exceed 100 characters' }
              ]}
            >
              <Input
                placeholder="Enter analysis name"
                showCount
                maxLength={100}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="label"
              label="Display Label"
              rules={[
                { max: 200, message: 'Label cannot exceed 200 characters' }
              ]}
            >
              <Input
                placeholder="Enter display label"
                showCount
                maxLength={200}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              name="description"
              label="Description"
              rules={[
                { max: 1000, message: 'Description cannot exceed 1000 characters' }
              ]}
            >
              <TextArea
                rows={3}
                placeholder="Enter analysis description"
                showCount
                maxLength={1000}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Form.Item
              name="version"
              label="Version"
            >
              <Input placeholder="e.g., 1.0" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="purpose"
              label="Analysis Purpose"
              rules={[{ required: true, message: 'Analysis purpose is required' }]}
            >
              <Select
                placeholder="Select analysis purpose"
                showSearch
                optionFilterProp="children"
              >
                {analysisPurposes.map(purpose => (
                  <Option key={purpose.value} value={purpose.value}>
                    {purpose.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="reason"
              label="Analysis Reason"
              rules={[{ required: true, message: 'Analysis reason is required' }]}
            >
              <Select
                placeholder="Select analysis reason"
                showSearch
                optionFilterProp="children"
              >
                {analysisReasons.map(reason => (
                  <Option key={reason.value} value={reason.value}>
                    {reason.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              name="methodId"
              label="Analysis Method"
              rules={[{ required: true, message: 'Analysis method is required' }]}
              extra="Select the statistical method or procedure for this analysis"
            >
              <Select
                placeholder="Select analysis method"
                showSearch
                optionFilterProp="children"
                notFoundContent={
                  availableMethods.length === 0 
                    ? "No methods available. Please add methods to the reporting event first."
                    : "No matching methods found"
                }
              >
                {availableMethods.map(method => (
                  <Option key={method.id} value={method.id}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{method.name}</div>
                      {method.description && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {method.description}
                        </div>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {availableMethods.length === 0 && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#fff7e6', 
            border: '1px solid #ffd591',
            borderRadius: '6px',
            marginTop: '16px'
          }}>
            <strong>Note:</strong> No analysis methods are available. You may need to create 
            analysis methods in the reporting event before creating analyses.
          </div>
        )}
      </Form>
    </Card>
  )
}

export default AnalysisForm