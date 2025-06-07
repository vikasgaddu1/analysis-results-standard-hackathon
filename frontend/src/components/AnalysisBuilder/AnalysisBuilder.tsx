import React, { useState, useEffect } from 'react'
import { Card, Steps, Button, message, Spin, Row, Col } from 'antd'
import { SaveOutlined, EyeOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { Analysis, ReportingEvent } from '../../types'
import { useAnalysis } from '../../hooks/useAnalysis'
import AnalysisForm from './AnalysisForm'
import AnalysisSetSelector from './AnalysisSetSelector'
import GroupingSelector from './GroupingSelector'
import ResultsSection from './ResultsSection'
import AnalysisPreview from './AnalysisPreview'

const { Step } = Steps

interface AnalysisBuilderProps {
  reportingEventId?: string
  analysisId?: string
  onSave?: (analysis: Analysis) => void
}

export const AnalysisBuilder: React.FC<AnalysisBuilderProps> = ({
  reportingEventId,
  analysisId,
  onSave
}) => {
  const navigate = useNavigate()
  const params = useParams()
  const eventId = reportingEventId || params.reportingEventId
  const editAnalysisId = analysisId || params.analysisId

  const [currentStep, setCurrentStep] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [analysis, setAnalysis] = useState<Partial<Analysis>>({})

  const {
    analysis: existingAnalysis,
    reportingEvent,
    loading,
    saving,
    createAnalysis,
    updateAnalysis,
    fetchAnalysis,
    fetchReportingEvent
  } = useAnalysis(eventId)

  useEffect(() => {
    if (eventId) {
      fetchReportingEvent(eventId)
    }
    if (editAnalysisId) {
      fetchAnalysis(editAnalysisId)
    }
  }, [eventId, editAnalysisId])

  useEffect(() => {
    if (existingAnalysis) {
      setAnalysis(existingAnalysis)
    }
  }, [existingAnalysis])

  const steps = [
    {
      title: 'Basic Information',
      description: 'Analysis details and metadata',
      content: (
        <AnalysisForm
          analysis={analysis}
          onChange={setAnalysis}
          reportingEvent={reportingEvent}
        />
      )
    },
    {
      title: 'Analysis Sets',
      description: 'Select population and datasets',
      content: (
        <AnalysisSetSelector
          analysis={analysis}
          onChange={setAnalysis}
          reportingEvent={reportingEvent}
        />
      )
    },
    {
      title: 'Groupings',
      description: 'Configure analysis groupings',
      content: (
        <GroupingSelector
          analysis={analysis}
          onChange={setAnalysis}
          reportingEvent={reportingEvent}
        />
      )
    },
    {
      title: 'Results',
      description: 'Define expected results',
      content: (
        <ResultsSection
          analysis={analysis}
          onChange={setAnalysis}
          reportingEvent={reportingEvent}
        />
      )
    }
  ]

  const handleNext = () => {
    setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSave = async () => {
    try {
      if (!eventId) {
        message.error('Reporting event ID is required')
        return
      }

      if (!analysis.name || !analysis.methodId) {
        message.error('Please fill in all required fields')
        return
      }

      let savedAnalysis: Analysis
      if (editAnalysisId) {
        savedAnalysis = await updateAnalysis(editAnalysisId, analysis)
        message.success('Analysis updated successfully')
      } else {
        savedAnalysis = await createAnalysis({
          ...analysis,
          reportingEventId: eventId
        })
        message.success('Analysis created successfully')
      }

      if (onSave) {
        onSave(savedAnalysis)
      } else {
        navigate(`/reporting-events/${eventId}/analyses`)
      }
    } catch (error) {
      console.error('Error saving analysis:', error)
      message.error('Failed to save analysis')
    }
  }

  const handlePreview = () => {
    setShowPreview(true)
  }

  const handleClosePreview = () => {
    setShowPreview(false)
  }

  const handleBack = () => {
    if (eventId) {
      navigate(`/reporting-events/${eventId}/analyses`)
    } else {
      navigate('/analyses')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (showPreview) {
    return (
      <AnalysisPreview
        analysis={analysis as Analysis}
        reportingEvent={reportingEvent}
        onClose={handleClosePreview}
        onSave={handleSave}
        saving={saving}
      />
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <div style={{ marginBottom: '24px' }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{ marginBottom: '16px' }}
              >
                Back to Analyses
              </Button>
              <h2 style={{ margin: 0 }}>
                {editAnalysisId ? 'Edit Analysis' : 'Create New Analysis'}
              </h2>
              {reportingEvent && (
                <p style={{ color: '#666', marginTop: '8px' }}>
                  Reporting Event: {reportingEvent.name}
                </p>
              )}
            </div>

            <Steps
              current={currentStep}
              style={{ marginBottom: '32px' }}
              size="small"
            >
              {steps.map((step, index) => (
                <Step
                  key={index}
                  title={step.title}
                  description={step.description}
                />
              ))}
            </Steps>

            <div style={{ minHeight: '400px', marginBottom: '24px' }}>
              {steps[currentStep].content}
            </div>

            <div style={{ textAlign: 'right' }}>
              <Button
                style={{ marginRight: '8px' }}
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button type="primary" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={handlePreview}
                    style={{ marginRight: '8px' }}
                  >
                    Preview
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={saving}
                  >
                    {editAnalysisId ? 'Update Analysis' : 'Create Analysis'}
                  </Button>
                </>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AnalysisBuilder