import React, { useState, useCallback, useEffect } from 'react'
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Space, 
  Row, 
  Col, 
  Divider,
  Tabs,
  Tag
} from 'antd'
import { PlusOutlined, DeleteOutlined, DragOutlined } from '@ant-design/icons'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { 
  OutputDisplay, 
  DisplaySection, 
  DisplaySectionType, 
  OrderedDisplaySubSection,
  DisplaySubSection
} from '../../types'

const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

interface DisplaySectionEditorProps {
  visible: boolean
  display: OutputDisplay | null
  onSave: (display: OutputDisplay) => void
  onCancel: () => void
}

const sectionTypes: DisplaySectionType[] = [
  'Header', 'Title', 'Rowlabel', 'Body', 'Footer', 'Footnote', 'Abbreviation', 'Legend'
]

const sectionTypeDescriptions: Record<DisplaySectionType, string> = {
  'Header': 'Table header information (title, study details)',
  'Title': 'Main table title',
  'Rowlabel': 'Row labels and categories',
  'Body': 'Main table content and data',
  'Footer': 'Table footer information',
  'Footnote': 'Footnotes and additional information',
  'Abbreviation': 'Abbreviations used in the table',
  'Legend': 'Legend for symbols or categories'
}

const DisplaySectionEditor: React.FC<DisplaySectionEditorProps> = ({
  visible,
  display,
  onSave,
  onCancel
}) => {
  const [form] = Form.useForm()
  const [workingDisplay, setWorkingDisplay] = useState<OutputDisplay | null>(null)
  const [activeSection, setActiveSection] = useState<string>('0')

  useEffect(() => {
    if (display) {
      setWorkingDisplay({ ...display })
      form.setFieldsValue({
        name: display.name,
        label: display.label,
        displayTitle: display.displayTitle,
        order: display.order,
        version: display.version
      })
    } else {
      setWorkingDisplay(null)
      form.resetFields()
    }
  }, [display, form])

  const handleFormChange = useCallback((changedValues: any) => {
    if (workingDisplay) {
      setWorkingDisplay({ ...workingDisplay, ...changedValues })
    }
  }, [workingDisplay])

  const addSection = useCallback((sectionType: DisplaySectionType) => {
    if (!workingDisplay) return

    const newSection: DisplaySection = {
      sectionType,
      orderedSubSections: []
    }

    const updatedDisplay = {
      ...workingDisplay,
      displaySections: [...workingDisplay.displaySections, newSection]
    }

    setWorkingDisplay(updatedDisplay)
    setActiveSection(String(updatedDisplay.displaySections.length - 1))
  }, [workingDisplay])

  const removeSection = useCallback((index: number) => {
    if (!workingDisplay) return

    const sections = workingDisplay.displaySections.filter((_, i) => i !== index)
    setWorkingDisplay({
      ...workingDisplay,
      displaySections: sections
    })

    // Adjust active section if necessary
    if (parseInt(activeSection) >= sections.length && sections.length > 0) {
      setActiveSection(String(sections.length - 1))
    } else if (sections.length === 0) {
      setActiveSection('0')
    }
  }, [workingDisplay, activeSection])

  const addSubSection = useCallback((sectionIndex: number) => {
    if (!workingDisplay) return

    const newSubSection: OrderedDisplaySubSection = {
      order: (workingDisplay.displaySections[sectionIndex]?.orderedSubSections?.length || 0) + 1,
      subSection: {
        id: `subsection_${Date.now()}`,
        text: ''
      }
    }

    const sections = [...workingDisplay.displaySections]
    sections[sectionIndex] = {
      ...sections[sectionIndex],
      orderedSubSections: [
        ...(sections[sectionIndex].orderedSubSections || []),
        newSubSection
      ]
    }

    setWorkingDisplay({
      ...workingDisplay,
      displaySections: sections
    })
  }, [workingDisplay])

  const removeSubSection = useCallback((sectionIndex: number, subSectionIndex: number) => {
    if (!workingDisplay) return

    const sections = [...workingDisplay.displaySections]
    const subSections = sections[sectionIndex].orderedSubSections?.filter((_, i) => i !== subSectionIndex) || []
    
    // Reorder remaining subsections
    const reorderedSubSections = subSections.map((sub, i) => ({
      ...sub,
      order: i + 1
    }))

    sections[sectionIndex] = {
      ...sections[sectionIndex],
      orderedSubSections: reorderedSubSections
    }

    setWorkingDisplay({
      ...workingDisplay,
      displaySections: sections
    })
  }, [workingDisplay])

  const updateSubSection = useCallback((
    sectionIndex: number, 
    subSectionIndex: number, 
    updates: Partial<DisplaySubSection>
  ) => {
    if (!workingDisplay) return

    const sections = [...workingDisplay.displaySections]
    const subSections = [...(sections[sectionIndex].orderedSubSections || [])]
    
    subSections[subSectionIndex] = {
      ...subSections[subSectionIndex],
      subSection: {
        ...subSections[subSectionIndex].subSection,
        ...updates
      }
    }

    sections[sectionIndex] = {
      ...sections[sectionIndex],
      orderedSubSections: subSections
    }

    setWorkingDisplay({
      ...workingDisplay,
      displaySections: sections
    })
  }, [workingDisplay])

  const handleSubSectionDragEnd = useCallback((result: any, sectionIndex: number) => {
    if (!result.destination || !workingDisplay) return

    const sections = [...workingDisplay.displaySections]
    const subSections = [...(sections[sectionIndex].orderedSubSections || [])]
    
    const [reorderedItem] = subSections.splice(result.source.index, 1)
    subSections.splice(result.destination.index, 0, reorderedItem)

    // Update order property
    const reorderedSubSections = subSections.map((item, index) => ({
      ...item,
      order: index + 1
    }))

    sections[sectionIndex] = {
      ...sections[sectionIndex],
      orderedSubSections: reorderedSubSections
    }

    setWorkingDisplay({
      ...workingDisplay,
      displaySections: sections
    })
  }, [workingDisplay])

  const handleSave = useCallback(() => {
    if (!workingDisplay) return

    form.validateFields().then(() => {
      onSave(workingDisplay)
    })
  }, [form, workingDisplay, onSave])

  const renderSectionContent = (section: DisplaySection, sectionIndex: number) => {
    return (
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <div>
            <Tag color="blue">{section.sectionType}</Tag>
            <span style={{ color: '#666', fontSize: '12px' }}>
              {sectionTypeDescriptions[section.sectionType]}
            </span>
          </div>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => addSubSection(sectionIndex)}
          >
            Add Sub-section
          </Button>
        </div>

        {(!section.orderedSubSections || section.orderedSubSections.length === 0) ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 0',
            color: '#999',
            border: '1px dashed #d9d9d9',
            borderRadius: 6
          }}>
            No sub-sections defined. Click "Add Sub-section" to start.
          </div>
        ) : (
          <DragDropContext onDragEnd={(result) => handleSubSectionDragEnd(result, sectionIndex)}>
            <Droppable droppableId={`subsections-${sectionIndex}`}>
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {section.orderedSubSections.map((orderedSub, subIndex) => (
                    <Draggable
                      key={orderedSub.subSection.id || subIndex}
                      draggableId={`${sectionIndex}-${subIndex}`}
                      index={subIndex}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                            marginBottom: 8
                          }}
                        >
                          <Card 
                            size="small"
                            title={
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div {...provided.dragHandleProps}>
                                  <DragOutlined style={{ color: '#999', cursor: 'grab' }} />
                                </div>
                                <span>Sub-section {orderedSub.order}</span>
                              </div>
                            }
                            extra={
                              <Button
                                type="text"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeSubSection(sectionIndex, subIndex)}
                              />
                            }
                          >
                            <Form.Item label="Text Content">
                              <TextArea
                                rows={3}
                                placeholder="Enter sub-section content"
                                value={orderedSub.subSection.text}
                                onChange={(e) => updateSubSection(
                                  sectionIndex, 
                                  subIndex, 
                                  { text: e.target.value }
                                )}
                              />
                            </Form.Item>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    )
  }

  const availableSectionTypes = sectionTypes.filter(type => 
    !workingDisplay?.displaySections.some(section => section.sectionType === type)
  )

  return (
    <Modal
      title={display?.id ? 'Edit Display' : 'Create Display'}
      visible={visible}
      onCancel={onCancel}
      onOk={handleSave}
      width={1000}
      okText="Save Display"
    >
      {workingDisplay && (
        <>
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleFormChange}
            style={{ marginBottom: 24 }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  label="Display Name"
                  name="name"
                  rules={[{ required: true, message: 'Please enter display name' }]}
                >
                  <Input placeholder="Enter display name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Display Label" name="label">
                  <Input placeholder="Enter display label" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col span={16}>
                <Form.Item label="Display Title" name="displayTitle">
                  <Input placeholder="Enter the title that will appear on the table" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Order" name="order">
                  <Input type="number" placeholder="1" />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="Version" name="version">
                  <Input placeholder="1.0" />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Divider />

          <div style={{ marginBottom: 16 }}>
            <h4>Display Sections</h4>
            {availableSectionTypes.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ marginRight: 8 }}>Add section:</span>
                {availableSectionTypes.map(type => (
                  <Button
                    key={type}
                    size="small"
                    onClick={() => addSection(type)}
                    style={{ marginRight: 8, marginBottom: 4 }}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {workingDisplay.displaySections.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 0',
              color: '#999',
              border: '1px dashed #d9d9d9',
              borderRadius: 6
            }}>
              No sections defined. Add sections using the buttons above.
            </div>
          ) : (
            <Tabs
              activeKey={activeSection}
              onChange={setActiveSection}
              type="editable-card"
              hideAdd
              onEdit={(targetKey, action) => {
                if (action === 'remove') {
                  removeSection(parseInt(targetKey as string))
                }
              }}
            >
              {workingDisplay.displaySections.map((section, index) => (
                <TabPane
                  tab={section.sectionType}
                  key={String(index)}
                  closable={true}
                >
                  {renderSectionContent(section, index)}
                </TabPane>
              ))}
            </Tabs>
          )}
        </>
      )}
    </Modal>
  )
}

export default DisplaySectionEditor