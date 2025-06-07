import React from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import AnalysisBuilder from '../components/AnalysisBuilder/AnalysisBuilder'

const AnalysisBuilderPage: React.FC = () => {
  const { reportingEventId, analysisId } = useParams<{
    reportingEventId?: string
    analysisId?: string
  }>()
  const [searchParams] = useSearchParams()
  
  // Handle both URL params and query params for flexibility
  const eventId = reportingEventId || searchParams.get('reportingEventId') || undefined
  const editAnalysisId = analysisId || searchParams.get('analysisId') || undefined

  return (
    <AnalysisBuilder
      reportingEventId={eventId}
      analysisId={editAnalysisId}
    />
  )
}

export default AnalysisBuilderPage