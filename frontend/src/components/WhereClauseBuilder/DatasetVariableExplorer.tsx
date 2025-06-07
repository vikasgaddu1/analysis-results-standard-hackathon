import React, { useState, useEffect } from 'react'
import {
  Card,
  Tree,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Spin,
  Alert,
  Tooltip,
  Button,
  Collapse,
  Row,
  Col,
  List,
  Badge
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { DataNode } from 'antd/es/tree'

import { useCDISCMetadata } from '../../hooks/useWhereClause'
import { CDISCDataset, CDISCVariable } from '../../services/whereClauseService'

const { Text, Title } = Typography
const { Search } = Input
const { Option } = Select
const { Panel } = Collapse

interface DatasetVariableExplorerProps {
  onVariableSelect?: (dataset: string, variable: string) => void
  onDatasetSelect?: (dataset: string) => void
  selectedDataset?: string
  selectedVariable?: string
  showDetails?: boolean
  compact?: boolean
}

interface VariableNode extends DataNode {
  dataset?: string
  variable?: CDISCVariable
  isVariable?: boolean
}

export const DatasetVariableExplorer: React.FC<DatasetVariableExplorerProps> = ({
  onVariableSelect,
  onDatasetSelect,
  selectedDataset,
  selectedVariable,
  showDetails = true,
  compact = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [domainFilter, setDomainFilter] = useState<string>('')
  const [variableTypeFilter, setVariableTypeFilter] = useState<string>('')
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [variableDetails, setVariableDetails] = useState<CDISCVariable | null>(null)
  const [variableValues, setVariableValues] = useState<string[]>([])
  const [loadingValues, setLoadingValues] = useState(false)

  const {
    datasets,
    loading,
    loadDatasets,
    loadVariables,
    loadVariableValues,
    getVariablesForDataset,
    getValuesForVariable
  } = useCDISCMetadata()

  useEffect(() => {
    loadDatasets(domainFilter)
  }, [loadDatasets, domainFilter])

  useEffect(() => {
    if (selectedDataset) {
      loadVariables(selectedDataset, variableTypeFilter)
    }
  }, [selectedDataset, variableTypeFilter, loadVariables])

  const domains = Array.from(new Set(datasets.map(d => d.domain)))
  const variableTypes = ['IDENTIFIER', 'TOPIC', 'FINDING', 'TIMING', 'GROUPING_QUALIFIER', 'VARIABLE_QUALIFIER']

  const filterDatasets = (datasets: CDISCDataset[]) => {
    return datasets.filter(dataset => {
      const matchesSearch = !searchTerm || 
        dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.description.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDomain = !domainFilter || dataset.domain === domainFilter
      
      return matchesSearch && matchesDomain
    })
  }

  const filterVariables = (variables: CDISCVariable[]) => {
    return variables.filter(variable => {
      const matchesSearch = !searchTerm || 
        variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variable.label.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = !variableTypeFilter || variable.type === variableTypeFilter
      
      return matchesSearch && matchesType
    })
  }

  const buildTreeData = (): VariableNode[] => {
    const filteredDatasets = filterDatasets(datasets)
    
    return filteredDatasets.map(dataset => {
      const variables = getVariablesForDataset(dataset.name)
      const filteredVariables = filterVariables(variables)
      
      const children: VariableNode[] = filteredVariables.map(variable => ({
        title: (
          <Space>
            <Text code>{variable.name}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {variable.label}
            </Text>
            <Tag color={getVariableTypeColor(variable.type)} size="small">
              {variable.type}
            </Tag>
          </Space>
        ),
        key: `${dataset.name}-${variable.name}`,
        icon: <FileTextOutlined />,
        dataset: dataset.name,
        variable,
        isVariable: true,
        isLeaf: true
      }))

      return {
        title: (
          <Space>
            <Text strong>{dataset.name}</Text>
            <Text type="secondary">- {dataset.label}</Text>
            <Badge count={children.length} size="small" />
          </Space>
        ),
        key: dataset.name,
        icon: <DatabaseOutlined />,
        children: children.length > 0 ? children : undefined
      }
    })
  }

  const getVariableTypeColor = (type: string): string => {
    const colors = {
      'IDENTIFIER': 'blue',
      'TOPIC': 'green',
      'FINDING': 'orange',
      'TIMING': 'purple',
      'GROUPING_QUALIFIER': 'cyan',
      'VARIABLE_QUALIFIER': 'magenta',
      'RECORD_QUALIFIER': 'yellow',
      'SYNONYM_QUALIFIER': 'lime'
    }
    return colors[type as keyof typeof colors] || 'default'
  }

  const handleSelect = (selectedKeys: string[], info: any) => {
    setSelectedKeys(selectedKeys)
    
    if (info.node.isVariable && info.node.variable) {
      const variable = info.node.variable
      const dataset = info.node.dataset
      
      setVariableDetails(variable)
      onVariableSelect?.(dataset, variable.name)
      
      // Load variable values
      setLoadingValues(true)
      loadVariableValues(dataset, variable.name)
        .then(() => {
          const values = getValuesForVariable(dataset, variable.name)
          setVariableValues(values)
        })
        .finally(() => setLoadingValues(false))
    } else if (!info.node.isVariable) {
      const dataset = info.node.key
      onDatasetSelect?.(dataset)
      setVariableDetails(null)
      setVariableValues([])
    }
  }

  const handleExpand = (expandedKeys: string[]) => {
    setExpandedKeys(expandedKeys)
    
    // Auto-load variables for expanded datasets
    expandedKeys.forEach(key => {
      if (!key.includes('-')) { // Dataset key
        const variables = getVariablesForDataset(key)
        if (variables.length === 0) {
          loadVariables(key, variableTypeFilter)
        }
      }
    })
  }

  const renderVariableDetails = () => {
    if (!variableDetails) {
      return (
        <Alert
          message="Select a variable to view details"
          type="info"
          showIcon
        />
      )
    }

    return (
      <div>
        <Title level={5}>{variableDetails.name} - {variableDetails.label}</Title>
        
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card size="small" title="Variable Information">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Type: </Text>
                  <Tag color={getVariableTypeColor(variableDetails.type)}>
                    {variableDetails.type}
                  </Tag>
                </div>
                <div>
                  <Text strong>Data Type: </Text>
                  <Text code>{variableDetails.data_type}</Text>
                </div>
                <div>
                  <Text strong>Name: </Text>
                  <Text code>{variableDetails.name}</Text>
                </div>
                <div>
                  <Text strong>Label: </Text>
                  <Text>{variableDetails.label}</Text>
                </div>
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card 
              size="small" 
              title="Possible Values" 
              extra={
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    if (selectedKeys.length > 0) {
                      const [dataset, variable] = selectedKeys[0].split('-')
                      onVariableSelect?.(dataset, variable)
                    }
                  }}
                >
                  Use in Where Clause
                </Button>
              }
            >
              {loadingValues ? (
                <Spin size="small" />
              ) : variableValues.length > 0 ? (
                <List
                  size="small"
                  dataSource={variableValues.slice(0, 10)}
                  renderItem={(value) => (
                    <List.Item
                      actions={[
                        <Tooltip title="Copy value">
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => navigator.clipboard.writeText(value)}
                          />
                        </Tooltip>
                      ]}
                    >
                      <Text code>{value}</Text>
                    </List.Item>
                  )}
                />
              ) : (
                <Text type="secondary">No sample values available</Text>
              )}
              
              {variableValues.length > 10 && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  ... and {variableValues.length - 10} more values
                </Text>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    )
  }

  const renderFilters = () => (
    <Card size="small" style={{ marginBottom: '16px' }}>
      <Row gutter={[16, 8]}>
        <Col span={8}>
          <Search
            placeholder="Search datasets and variables"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Col>
        <Col span={8}>
          <Select
            placeholder="Filter by domain"
            value={domainFilter}
            onChange={setDomainFilter}
            style={{ width: '100%' }}
            allowClear
          >
            {domains.map(domain => (
              <Option key={domain} value={domain}>{domain}</Option>
            ))}
          </Select>
        </Col>
        <Col span={8}>
          <Select
            placeholder="Filter by variable type"
            value={variableTypeFilter}
            onChange={setVariableTypeFilter}
            style={{ width: '100%' }}
            allowClear
          >
            {variableTypes.map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
        </Col>
      </Row>
    </Card>
  )

  if (compact) {
    return (
      <div>
        {renderFilters()}
        <Spin spinning={loading}>
          <Tree
            treeData={buildTreeData()}
            onSelect={handleSelect}
            onExpand={handleExpand}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            showIcon
            height={300}
          />
        </Spin>
      </div>
    )
  }

  return (
    <div>
      {renderFilters()}
      
      <Row gutter={[16, 16]}>
        <Col span={showDetails ? 12 : 24}>
          <Card 
            title={
              <Space>
                <DatabaseOutlined />
                CDISC Datasets & Variables
                <Badge count={datasets.length} />
              </Space>
            }
            size="small"
          >
            <Spin spinning={loading}>
              <Tree
                treeData={buildTreeData()}
                onSelect={handleSelect}
                onExpand={handleExpand}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                showIcon
                height={400}
              />
            </Spin>
          </Card>
        </Col>
        
        {showDetails && (
          <Col span={12}>
            <Card
              title={
                <Space>
                  <InfoCircleOutlined />
                  Variable Details
                </Space>
              }
              size="small"
            >
              {renderVariableDetails()}
            </Card>
          </Col>
        )}
      </Row>

      {!compact && (
        <Card size="small" style={{ marginTop: '16px' }} title="Quick Actions">
          <Space wrap>
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchTerm('')
                setDomainFilter('')
                setVariableTypeFilter('')
              }}
            >
              Clear Filters
            </Button>
            <Button
              icon={<DatabaseOutlined />}
              onClick={() => setExpandedKeys(datasets.map(d => d.name))}
            >
              Expand All Datasets
            </Button>
            <Button
              onClick={() => setExpandedKeys([])}
            >
              Collapse All
            </Button>
          </Space>
        </Card>
      )}
    </div>
  )
}

export default DatasetVariableExplorer