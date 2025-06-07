import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Tabs, 
  Button, 
  Space, 
  Alert, 
  Typography, 
  Tooltip, 
  Collapse,
  Badge,
  Divider 
} from 'antd'
import { 
  PlusOutlined, 
  DeleteOutlined, 
  CopyOutlined, 
  SaveOutlined,
  BugOutlined,
  BookOutlined,
  DownloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'

import { WhereClause, WhereClauseCondition, WhereClauseCompoundExpression } from '../../types'
import { useWhereClause, useWhereClauseTemplates, useWhereClauseExport } from '../../hooks/useWhereClause'
import { whereClauseUtils } from '../../utils/whereClauseUtils'
import { DatasetVariableExplorer } from './DatasetVariableExplorer'
import { ConditionValidator } from './ConditionValidator'
import { WhereClauseLibrary } from './WhereClauseLibrary'
import { ExpressionTester } from './ExpressionTester'
import WhereClauseBuilder from '../AnalysisBuilder/WhereClause/WhereClauseBuilder'

const { Text, Title } = Typography
const { TabPane } = Tabs
const { Panel } = Collapse

interface AdvancedWhereClauseBuilderProps {
  parentType: string
  parentId: string
  title?: string
  description?: string
  onWhereClaused?: (whereClauses: WhereClause[]) => void
  showTabs?: boolean
  defaultActiveTab?: string
}

type BuilderTab = 'builder' | 'explorer' | 'validator' | 'library' | 'tester'

export const AdvancedWhereClauseBuilder: React.FC<AdvancedWhereClauseBuilderProps> = ({
  parentType,
  parentId,
  title = "Advanced Where Clause Builder",
  description,
  onWhereClaused,
  showTabs = true,
  defaultActiveTab = 'builder'
}) => {
  const [activeTab, setActiveTab] = useState<BuilderTab>(defaultActiveTab as BuilderTab)
  const [selectedClause, setSelectedClause] = useState<WhereClause | null>(null)
  const [showSummary, setShowSummary] = useState(true)
  const [exportFormat, setExportFormat] = useState<'json' | 'yaml' | 'sas' | 'r'>('sas')

  const {
    whereClauses,
    loading,
    error,
    createWhereClause,
    updateCondition,
    updateCompoundExpression,
    deleteWhereClause,
    cloneWhereClause,
    refreshWhereClauses
  } = useWhereClause({ parentType, parentId })

  const { saveTemplate } = useWhereClauseTemplates()
  const { exportWhereClauses, exporting } = useWhereClauseExport()

  useEffect(() => {
    if (onWhereClaused) {
      onWhereClaused(whereClauses)
    }
  }, [whereClauses, onWhereClaused])

  const handleCreateClause = async () => {
    const newClause = await createWhereClause({
      parent_type: parentType,
      parent_id: parentId,
      level: 1,
      order_num: whereClauses.length + 1,
      clause_type: 'condition',
      condition: {
        dataset: '',
        variable: '',
        comparator: 'EQ',
        value_array: ['']
      }
    })

    if (newClause) {
      setSelectedClause(newClause)
    }
  }

  const handleCloneClause = async (clause: WhereClause) => {
    if (clause.id) {
      await cloneWhereClause(
        clause.id,
        parentType,
        parentId,
        clause.level,
        whereClauses.length + 1
      )
    }
  }

  const handleSaveAsTemplate = async (clause: WhereClause) => {
    if (!clause.id) return

    const summary = whereClauseUtils.getWhereClauseSummary(clause)
    const defaultName = summary.type === 'condition' 
      ? `${summary.dataset}.${summary.variable} ${summary.comparator}`
      : `${summary.operator} Expression`

    // This would typically open a modal for template details
    const name = prompt('Template name:', defaultName)
    const description = prompt('Template description:', summary.description)

    if (name && description) {
      await saveTemplate(clause.id, name, description, [summary.type])
    }
  }

  const handleExport = async () => {
    await exportWhereClauses(parentType, parentId, exportFormat)
  }

  const renderClauseSummary = (clause: WhereClause) => {
    const summary = whereClauseUtils.getWhereClauseSummary(clause)
    const suggestions = whereClauseUtils.suggestImprovements(clause)

    return (
      <div style={{ padding: '8px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text code style={{ fontSize: '12px' }}>
            {summary.description}
          </Text>
          <Space size="small">
            {suggestions.length > 0 && (
              <Tooltip title={suggestions.join('; ')}>
                <Badge count={suggestions.length} size="small">
                  <InfoCircleOutlined style={{ color: '#faad14' }} />
                </Badge>
              </Tooltip>
            )}
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCloneClause(clause)}
              title="Clone clause"
            />
            <Button
              size="small"
              icon={<SaveOutlined />}
              onClick={() => handleSaveAsTemplate(clause)}
              title="Save as template"
            />
            <Button
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => clause.id && deleteWhereClause(clause.id)}
              danger
              title="Delete clause"
            />
          </Space>
        </div>
      </div>
    )
  }

  const renderMainBuilder = () => (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateClause}
            loading={loading}
          >
            Add Where Clause
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
          >
            Export as {exportFormat.toUpperCase()}
          </Button>
        </Space>
        
        <Space>
          <Text type="secondary">
            {whereClauses.length} clause{whereClauses.length !== 1 ? 's' : ''}
          </Text>
          <Button
            size="small"
            onClick={() => setShowSummary(!showSummary)}
          >
            {showSummary ? 'Hide' : 'Show'} Summary
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          style={{ marginBottom: '16px' }}
        />
      )}

      {whereClauses.length === 0 && !loading && (
        <Alert
          message="No Where Clauses"
          description="Click 'Add Where Clause' to create your first filtering condition."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {showSummary && whereClauses.length > 0 && (
        <Collapse 
          ghost 
          style={{ marginBottom: '16px' }}
          defaultActiveKey={['summary']}
        >
          <Panel 
            header={<Text strong>Where Clauses Summary</Text>} 
            key="summary"
          >
            {whereClauses.map((clause, index) => (
              <div key={clause.id || index}>
                {renderClauseSummary(clause)}
                {index < whereClauses.length - 1 && <Divider style={{ margin: '8px 0' }} />}
              </div>
            ))}
          </Panel>
        </Collapse>
      )}

      <div>
        {whereClauses.map((clause, index) => (
          <Card
            key={clause.id || index}
            size="small"
            title={`Where Clause ${index + 1}`}
            style={{ marginBottom: '12px' }}
            extra={
              <Space size="small">
                <Tooltip title="Test this clause">
                  <Button
                    size="small"
                    icon={<BugOutlined />}
                    onClick={() => {
                      setSelectedClause(clause)
                      setActiveTab('tester')
                    }}
                  />
                </Tooltip>
                <Tooltip title="Validate this clause">
                  <Button
                    size="small"
                    icon={<InfoCircleOutlined />}
                    onClick={() => {
                      setSelectedClause(clause)
                      setActiveTab('validator')
                    }}
                  />
                </Tooltip>
              </Space>
            }
          >
            <WhereClauseBuilder
              value={clause}
              onChange={(updatedClause) => {
                if (updatedClause?.condition && clause.id) {
                  updateCondition(clause.id, updatedClause.condition)
                } else if (updatedClause?.compoundExpression && clause.id) {
                  updateCompoundExpression(clause.id, updatedClause.compoundExpression)
                }
              }}
              datasets={[]} // Will be populated by DatasetVariableExplorer
            />
          </Card>
        ))}
      </div>
    </div>
  )

  const renderTabs = () => (
    <Tabs
      activeKey={activeTab}
      onChange={(key) => setActiveTab(key as BuilderTab)}
      type="card"
      style={{ minHeight: '500px' }}
    >
      <TabPane tab="Builder" key="builder">
        {renderMainBuilder()}
      </TabPane>

      <TabPane 
        tab={
          <Space>
            <BookOutlined />
            Explorer
          </Space>
        } 
        key="explorer"
      >
        <DatasetVariableExplorer
          onVariableSelect={(dataset, variable) => {
            console.log('Variable selected:', { dataset, variable })
            // This could auto-populate a new where clause
          }}
        />
      </TabPane>

      <TabPane 
        tab={
          <Space>
            <InfoCircleOutlined />
            Validator
          </Space>
        } 
        key="validator"
      >
        <ConditionValidator
          whereClause={selectedClause}
          onValidationChange={(result) => {
            console.log('Validation result:', result)
          }}
        />
      </TabPane>

      <TabPane 
        tab={
          <Space>
            <SaveOutlined />
            Library
          </Space>
        } 
        key="library"
      >
        <WhereClauseLibrary
          onTemplateApply={async (template) => {
            const applied = await createWhereClause({
              parent_type: parentType,
              parent_id: parentId,
              level: 1,
              order_num: whereClauses.length + 1,
              clause_type: template.clause_type as 'condition' | 'compound_expression',
              condition: template.condition,
              compound_expression: template.compound_expression
            })
            
            if (applied) {
              setActiveTab('builder')
            }
          }}
        />
      </TabPane>

      <TabPane 
        tab={
          <Space>
            <BugOutlined />
            Tester
          </Space>
        } 
        key="tester"
      >
        <ExpressionTester
          whereClause={selectedClause}
          onTestResult={(result) => {
            console.log('Test result:', result)
          }}
        />
      </TabPane>
    </Tabs>
  )

  return (
    <Card title={title} style={{ width: '100%' }}>
      {description && (
        <Alert
          message={description}
          type="info"
          style={{ marginBottom: '16px' }}
          showIcon
        />
      )}

      {showTabs ? renderTabs() : renderMainBuilder()}
    </Card>
  )
}

export default AdvancedWhereClauseBuilder