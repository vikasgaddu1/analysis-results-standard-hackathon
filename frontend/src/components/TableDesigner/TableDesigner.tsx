import React, { useState, useCallback } from 'react'
import { Layout, Row, Col, Steps, Button, message, Card } from 'antd'
import { SaveOutlined, EyeOutlined, TemplateOutlined } from '@ant-design/icons'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import OutputForm from './OutputForm'
import DisplayBuilder from './DisplayBuilder'
import TableStructureEditor from './TableStructureEditor'
import TablePreview from './TablePreview'
import TemplateSelector from './Templates/TemplateSelector'
import StylePanel from './Styling/StylePanel'
import { useOutput } from '../../hooks/useOutput'
import { Output, OutputDisplay } from '../../types'

const { Header, Content, Sider } = Layout
const { Step } = Steps

interface TableDesignerProps {
  outputId?: string
  onSave?: (output: Output) => void
  onCancel?: () => void
}

const TableDesigner: React.FC<TableDesignerProps> = ({
  outputId,
  onSave,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showStylePanel, setShowStylePanel] = useState(false)
  
  const {
    output,
    loading,
    updateOutput,
    saveOutput,
    loadTemplate,
    validateOutput
  } = useOutput(outputId)

  const [workingOutput, setWorkingOutput] = useState<Partial<Output>>(
    output || {
      name: '',
      label: '',
      description: '',
      displays: []
    }
  )

  const steps = [
    {
      title: 'Basic Details',
      description: 'Output name and description',
      component: OutputForm
    },
    {
      title: 'Table Structure',
      description: 'Define table layout',
      component: TableStructureEditor
    },
    {
      title: 'Display Builder',
      description: 'Configure display sections',
      component: DisplayBuilder
    }
  ]

  const handleStepChange = useCallback((step: number) => {
    setCurrentStep(step)
  }, [])

  const handleOutputChange = useCallback((updates: Partial<Output>) => {
    setWorkingOutput(prev => ({ ...prev, ...updates }))
  }, [])

  const handleDisplayChange = useCallback((displays: OutputDisplay[]) => {
    setWorkingOutput(prev => ({ ...prev, displays }))
  }, [])

  const handleSave = useCallback(async () => {
    try {
      const validation = await validateOutput(workingOutput as Output)
      if (!validation.isValid) {
        message.error('Please fix validation errors before saving')
        return
      }

      const savedOutput = await saveOutput(workingOutput as Output)
      message.success('Table design saved successfully')
      onSave?.(savedOutput)
    } catch (error) {
      message.error('Failed to save table design')
    }
  }, [workingOutput, saveOutput, validateOutput, onSave])

  const handleTemplateLoad = useCallback(async (templateId: string) => {
    try {
      const template = await loadTemplate(templateId)
      setWorkingOutput(template)
      setShowTemplates(false)
      message.success('Template loaded successfully')
    } catch (error) {
      message.error('Failed to load template')
    }
  }, [loadTemplate])

  const CurrentStepComponent = steps[currentStep]?.component

  return (
    <DndProvider backend={HTML5Backend}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#fff', 
          borderBottom: '1px solid #f0f0f0',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ margin: 0 }}>Table Designer</h2>
          </div>
          <div>
            <Button
              icon={<TemplateOutlined />}
              onClick={() => setShowTemplates(true)}
              style={{ marginRight: 8 }}
            >
              Templates
            </Button>
            <Button
              icon={<EyeOutlined />}
              onClick={() => setShowPreview(true)}
              style={{ marginRight: 8 }}
            >
              Preview
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={loading}
              style={{ marginRight: 8 }}
            >
              Save
            </Button>
            {onCancel && (
              <Button onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </Header>

        <Layout>
          <Content style={{ padding: '24px' }}>
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Card>
                  <Steps 
                    current={currentStep} 
                    onChange={handleStepChange}
                    style={{ marginBottom: 24 }}
                  >
                    {steps.map((step, index) => (
                      <Step
                        key={index}
                        title={step.title}
                        description={step.description}
                      />
                    ))}
                  </Steps>
                </Card>
              </Col>

              <Col span={showStylePanel ? 18 : 24}>
                <Card style={{ minHeight: '600px' }}>
                  {CurrentStepComponent && (
                    <CurrentStepComponent
                      output={workingOutput}
                      onChange={handleOutputChange}
                      onDisplayChange={handleDisplayChange}
                    />
                  )}
                </Card>
              </Col>

              {showStylePanel && (
                <Col span={6}>
                  <StylePanel
                    output={workingOutput}
                    onChange={handleOutputChange}
                    onClose={() => setShowStylePanel(false)}
                  />
                </Col>
              )}
            </Row>

            <div style={{ 
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000
            }}>
              <Button
                type="primary"
                icon={<TemplateOutlined />}
                onClick={() => setShowStylePanel(!showStylePanel)}
              >
                {showStylePanel ? 'Hide' : 'Show'} Styling
              </Button>
            </div>
          </Content>
        </Layout>

        {/* Template Selector Modal */}
        <TemplateSelector
          visible={showTemplates}
          onSelect={handleTemplateLoad}
          onCancel={() => setShowTemplates(false)}
        />

        {/* Preview Modal */}
        <TablePreview
          visible={showPreview}
          output={workingOutput as Output}
          onClose={() => setShowPreview(false)}
        />
      </Layout>
    </DndProvider>
  )
}

export default TableDesigner