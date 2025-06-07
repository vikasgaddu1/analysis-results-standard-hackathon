import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Button, message, Modal } from 'antd'
import { ArrowLeftOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import TableDesigner from '../components/TableDesigner/TableDesigner'
import { useOutput } from '../hooks/useOutput'
import { Output } from '../types'

interface TableDesignerPageProps {
  // Optional props for embedded usage
  embedded?: boolean
  onSave?: (output: Output) => void
  onCancel?: () => void
}

const TableDesignerPage: React.FC<TableDesignerPageProps> = ({
  embedded = false,
  onSave,
  onCancel
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { outputId } = useParams<{ outputId?: string }>()
  
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const {
    output,
    loading,
    isDirty,
    saveOutput,
    reset
  } = useOutput(outputId, {
    autoSave: false, // Disable auto-save for better user control
    onSave: (savedOutput) => {
      message.success('Table design saved successfully')
      onSave?.(savedOutput)
      if (!embedded && !outputId) {
        // Navigate to edit mode if we were creating a new output
        navigate(`/table-designer/${savedOutput.id}`, { replace: true })
      }
    },
    onError: (error) => {
      message.error(`Error: ${error.message}`)
    }
  })

  // Handle browser back button and navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      if (isDirty) {
        e.preventDefault()
        setShowUnsavedWarning(true)
        // Push the current state back to prevent navigation
        window.history.pushState(null, '', location.pathname)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isDirty, location.pathname])

  const handleSave = async (outputData: Output) => {
    try {
      const saved = await saveOutput(outputData)
      if (saved && onSave) {
        onSave(saved)
      }
    } catch (error) {
      console.error('Failed to save output:', error)
    }
  }

  const handleCancel = () => {
    if (isDirty) {
      setShowUnsavedWarning(true)
    } else {
      performCancel()
    }
  }

  const performCancel = () => {
    reset()
    if (embedded && onCancel) {
      onCancel()
    } else {
      navigate('/outputs')
    }
  }

  const handleUnsavedSave = async () => {
    if (output) {
      const saved = await saveOutput(output)
      if (saved) {
        setShowUnsavedWarning(false)
        performCancel()
      }
    }
  }

  const handleUnsavedDiscard = () => {
    setShowUnsavedWarning(false)
    performCancel()
  }

  const getPageTitle = () => {
    if (loading) return 'Loading...'
    if (outputId && output) return `Edit Table: ${output.name || 'Untitled'}`
    return 'Create New Table'
  }

  const getPageSubtitle = () => {
    if (loading) return ''
    if (outputId && output) {
      return `Last modified: ${output.version || 'Never'} ${isDirty ? '(unsaved changes)' : ''}`
    }
    return 'Design a new clinical table from scratch or use a template'
  }

  if (embedded) {
    return (
      <>
        <TableDesigner
          outputId={outputId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
        
        {/* Unsaved Changes Warning Modal */}
        <Modal
          title="Unsaved Changes"
          visible={showUnsavedWarning}
          onCancel={() => setShowUnsavedWarning(false)}
          footer={[
            <Button key="continue" onClick={() => setShowUnsavedWarning(false)}>
              Continue Editing
            </Button>,
            <Button key="discard" onClick={handleUnsavedDiscard}>
              Discard Changes
            </Button>,
            <Button key="save" type="primary" onClick={handleUnsavedSave}>
              Save & Exit
            </Button>
          ]}
        >
          <p>You have unsaved changes. What would you like to do?</p>
        </Modal>
      </>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Page Header */}
      <div style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleCancel}
              type="text"
            >
              Back to Outputs
            </Button>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
                {getPageTitle()}
              </h1>
              <div style={{ fontSize: '14px', color: '#666', marginTop: 4 }}>
                {getPageSubtitle()}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isDirty && (
              <div style={{
                padding: '4px 8px',
                backgroundColor: '#fff2e8',
                color: '#d46b08',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500
              }}>
                Unsaved changes
              </div>
            )}
            <Button
              icon={<QuestionCircleOutlined />}
              onClick={() => setShowHelpModal(true)}
              type="text"
            >
              Help
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 0
      }}>
        <TableDesigner
          outputId={outputId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>

      {/* Unsaved Changes Warning Modal */}
      <Modal
        title="Unsaved Changes"
        visible={showUnsavedWarning}
        onCancel={() => setShowUnsavedWarning(false)}
        footer={[
          <Button key="continue" onClick={() => setShowUnsavedWarning(false)}>
            Continue Editing
          </Button>,
          <Button key="discard" onClick={handleUnsavedDiscard}>
            Discard Changes
          </Button>,
          <Button key="save" type="primary" onClick={handleUnsavedSave}>
            Save & Exit
          </Button>
        ]}
        width={480}
      >
        <p>You have unsaved changes that will be lost if you leave this page.</p>
        <p>Would you like to save your changes before leaving?</p>
      </Modal>

      {/* Help Modal */}
      <Modal
        title="Table Designer Help"
        visible={showHelpModal}
        onCancel={() => setShowHelpModal(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setShowHelpModal(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        <div>
          <h4>Getting Started</h4>
          <ol>
            <li><strong>Basic Details:</strong> Start by entering your table name, description, and file specifications.</li>
            <li><strong>Table Structure:</strong> Define columns and rows for your table layout.</li>
            <li><strong>Display Builder:</strong> Configure how your table will be displayed with sections and content.</li>
          </ol>

          <h4>Key Features</h4>
          <ul>
            <li><strong>Templates:</strong> Use predefined templates to quickly start your table design</li>
            <li><strong>Drag & Drop:</strong> Reorder sections, rows, and columns by dragging</li>
            <li><strong>Live Preview:</strong> See how your table will look as you build it</li>
            <li><strong>Styling:</strong> Apply themes and custom styles to match your requirements</li>
            <li><strong>Export:</strong> Generate tables in multiple formats (PDF, RTF, Excel, etc.)</li>
          </ul>

          <h4>Tips</h4>
          <ul>
            <li>Save frequently to avoid losing your work</li>
            <li>Use templates for standard table types (Demographics, Safety, Efficacy)</li>
            <li>Preview your table before finalizing to ensure proper formatting</li>
            <li>Consider your target output format when designing (some features may not be supported in all formats)</li>
          </ul>

          <h4>Need More Help?</h4>
          <p>
            Check the documentation or contact support for advanced features and troubleshooting.
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default TableDesignerPage