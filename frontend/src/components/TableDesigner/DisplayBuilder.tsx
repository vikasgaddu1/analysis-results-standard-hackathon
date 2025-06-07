import React, { useState, useCallback } from 'react'
import { Card, Button, List, Modal, Space, Tooltip, Badge } from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  DragOutlined,
  CopyOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import DisplaySectionEditor from './DisplaySectionEditor'
import { Output, OutputDisplay, DisplaySection } from '../../types'

interface DisplayBuilderProps {
  output: Partial<Output>
  onDisplayChange: (displays: OutputDisplay[]) => void
}

const DisplayBuilder: React.FC<DisplayBuilderProps> = ({ 
  output, 
  onDisplayChange 
}) => {
  const [editingDisplay, setEditingDisplay] = useState<OutputDisplay | null>(null)
  const [editingIndex, setEditingIndex] = useState<number>(-1)
  const [showEditor, setShowEditor] = useState(false)
  const [previewDisplay, setPreviewDisplay] = useState<OutputDisplay | null>(null)

  const displays = output.displays || []

  const handleAddDisplay = useCallback(() => {
    const newDisplay: OutputDisplay = {
      id: `display_${Date.now()}`,
      name: `Display ${displays.length + 1}`,
      label: '',
      order: displays.length + 1,
      displaySections: []
    }
    setEditingDisplay(newDisplay)
    setEditingIndex(-1)
    setShowEditor(true)
  }, [displays.length])

  const handleEditDisplay = useCallback((display: OutputDisplay, index: number) => {
    setEditingDisplay({ ...display })
    setEditingIndex(index)
    setShowEditor(true)
  }, [])

  const handleDeleteDisplay = useCallback((index: number) => {
    Modal.confirm({
      title: 'Delete Display',
      content: 'Are you sure you want to delete this display?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        const newDisplays = displays.filter((_, i) => i !== index)
        onDisplayChange(newDisplays)
      }
    })
  }, [displays, onDisplayChange])

  const handleDuplicateDisplay = useCallback((display: OutputDisplay, index: number) => {
    const duplicated: OutputDisplay = {
      ...display,
      id: `display_${Date.now()}`,
      name: `${display.name} (Copy)`,
      order: displays.length + 1
    }
    const newDisplays = [...displays, duplicated]
    onDisplayChange(newDisplays)
  }, [displays, onDisplayChange])

  const handleSaveDisplay = useCallback((display: OutputDisplay) => {
    let newDisplays: OutputDisplay[]
    
    if (editingIndex >= 0) {
      // Editing existing display
      newDisplays = displays.map((d, i) => i === editingIndex ? display : d)
    } else {
      // Adding new display
      newDisplays = [...displays, display]
    }
    
    onDisplayChange(newDisplays)
    setShowEditor(false)
    setEditingDisplay(null)
    setEditingIndex(-1)
  }, [displays, editingIndex, onDisplayChange])

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return

    const items = Array.from(displays)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order property
    const reorderedDisplays = items.map((item, index) => ({
      ...item,
      order: index + 1
    }))

    onDisplayChange(reorderedDisplays)
  }, [displays, onDisplayChange])

  const getSectionTypeCount = (display: OutputDisplay) => {
    const sectionTypes = display.displaySections.map(s => s.sectionType)
    return {
      total: sectionTypes.length,
      header: sectionTypes.filter(t => t === 'Header').length,
      title: sectionTypes.filter(t => t === 'Title').length,
      body: sectionTypes.filter(t => t === 'Body').length,
      footer: sectionTypes.filter(t => t === 'Footer').length,
      footnote: sectionTypes.filter(t => t === 'Footnote').length
    }
  }

  const renderDisplayItem = (display: OutputDisplay, index: number) => {
    const sectionCount = getSectionTypeCount(display)
    
    return (
      <Card
        size="small"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DragOutlined style={{ color: '#999', cursor: 'grab' }} />
            <span>{display.name || display.label || `Display ${index + 1}`}</span>
            <Badge count={sectionCount.total} style={{ backgroundColor: '#52c41a' }} />
          </div>
        }
        extra={
          <Space>
            <Tooltip title="Preview">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setPreviewDisplay(display)}
              />
            </Tooltip>
            <Tooltip title="Duplicate">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleDuplicateDisplay(display, index)}
              />
            </Tooltip>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditDisplay(display, index)}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteDisplay(index)}
              />
            </Tooltip>
          </Space>
        }
      >
        <div style={{ marginBottom: 8 }}>
          <strong>Title:</strong> {display.displayTitle || 'No title set'}
        </div>
        <div style={{ marginBottom: 8 }}>
          <strong>Order:</strong> {display.order}
        </div>
        <div>
          <strong>Sections:</strong>
          <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
            {sectionCount.header > 0 && <span>Header: {sectionCount.header} </span>}
            {sectionCount.title > 0 && <span>Title: {sectionCount.title} </span>}
            {sectionCount.body > 0 && <span>Body: {sectionCount.body} </span>}
            {sectionCount.footer > 0 && <span>Footer: {sectionCount.footer} </span>}
            {sectionCount.footnote > 0 && <span>Footnote: {sectionCount.footnote} </span>}
            {sectionCount.total === 0 && <span style={{ color: '#ff4d4f' }}>No sections defined</span>}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16 
      }}>
        <h3>Table Displays</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddDisplay}
        >
          Add Display
        </Button>
      </div>

      {displays.length === 0 ? (
        <Card>
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 0',
            color: '#999'
          }}>
            <div style={{ fontSize: '16px', marginBottom: 16 }}>
              No displays created yet
            </div>
            <div style={{ marginBottom: 24 }}>
              Create your first table display to define how your data will be presented
            </div>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleAddDisplay}
            >
              Create First Display
            </Button>
          </div>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="displays">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {displays.map((display, index) => (
                  <Draggable
                    key={display.id}
                    draggableId={display.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          marginBottom: 16,
                          opacity: snapshot.isDragging ? 0.8 : 1
                        }}
                      >
                        {renderDisplayItem(display, index)}
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

      {/* Display Section Editor Modal */}
      <DisplaySectionEditor
        visible={showEditor}
        display={editingDisplay}
        onSave={handleSaveDisplay}
        onCancel={() => {
          setShowEditor(false)
          setEditingDisplay(null)
          setEditingIndex(-1)
        }}
      />

      {/* Preview Modal */}
      <Modal
        title="Display Preview"
        visible={!!previewDisplay}
        onCancel={() => setPreviewDisplay(null)}
        footer={null}
        width={800}
      >
        {previewDisplay && (
          <div>
            <h4>{previewDisplay.displayTitle || previewDisplay.name}</h4>
            <div style={{ marginTop: 16 }}>
              {previewDisplay.displaySections.map((section, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#666',
                    fontSize: '12px',
                    marginBottom: 4
                  }}>
                    {section.sectionType.toUpperCase()}
                  </div>
                  {section.orderedSubSections?.map((orderedSub, subIndex) => (
                    <div key={subIndex} style={{ 
                      marginBottom: 8,
                      padding: 8,
                      background: '#f5f5f5',
                      borderRadius: 4
                    }}>
                      {orderedSub.subSection.text || 'No text defined'}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DisplayBuilder