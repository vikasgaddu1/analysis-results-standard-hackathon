import React, { useState, useCallback } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Select, 
  Input, 
  Space, 
  Table, 
  Modal, 
  Form,
  Tooltip,
  Tag,
  Divider
} from 'antd'
import { 
  PlusOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  DragOutlined,
  TableOutlined,
  ColumnWidthOutlined
} from '@ant-design/icons'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import CellEditor from './CellEditor'
import { Output } from '../../types'

const { Option } = Select

interface TableColumn {
  id: string
  name: string
  dataType: 'text' | 'number' | 'date' | 'category'
  width?: number
  alignment: 'left' | 'center' | 'right'
  format?: string
  order: number
}

interface TableRow {
  id: string
  name: string
  type: 'header' | 'data' | 'summary' | 'spacer'
  order: number
  cells: Record<string, any>
}

interface TableStructure {
  columns: TableColumn[]
  rows: TableRow[]
  layout: 'standard' | 'grouped' | 'nested'
  orientation: 'portrait' | 'landscape'
}

interface TableStructureEditorProps {
  output: Partial<Output>
  onChange: (updates: Partial<Output>) => void
}

const TableStructureEditor: React.FC<TableStructureEditorProps> = ({
  output,
  onChange
}) => {
  const [structure, setStructure] = useState<TableStructure>({
    columns: [],
    rows: [],
    layout: 'standard',
    orientation: 'portrait'
  })
  
  const [editingCell, setEditingCell] = useState<{
    rowId: string
    columnId: string
    value: any
  } | null>(null)
  
  const [showColumnEditor, setShowColumnEditor] = useState(false)
  const [editingColumn, setEditingColumn] = useState<TableColumn | null>(null)
  const [showRowEditor, setShowRowEditor] = useState(false)
  const [editingRow, setEditingRow] = useState<TableRow | null>(null)

  const addColumn = useCallback(() => {
    const newColumn: TableColumn = {
      id: `col_${Date.now()}`,
      name: `Column ${structure.columns.length + 1}`,
      dataType: 'text',
      alignment: 'left',
      order: structure.columns.length + 1
    }
    setEditingColumn(newColumn)
    setShowColumnEditor(true)
  }, [structure.columns.length])

  const addRow = useCallback(() => {
    const newRow: TableRow = {
      id: `row_${Date.now()}`,
      name: `Row ${structure.rows.length + 1}`,
      type: 'data',
      order: structure.rows.length + 1,
      cells: {}
    }
    setEditingRow(newRow)
    setShowRowEditor(true)
  }, [structure.rows.length])

  const handleColumnSave = useCallback((column: TableColumn) => {
    const existingIndex = structure.columns.findIndex(c => c.id === column.id)
    let newColumns: TableColumn[]
    
    if (existingIndex >= 0) {
      newColumns = structure.columns.map((c, i) => i === existingIndex ? column : c)
    } else {
      newColumns = [...structure.columns, column]
    }
    
    setStructure(prev => ({ ...prev, columns: newColumns }))
    setShowColumnEditor(false)
    setEditingColumn(null)
  }, [structure.columns])

  const handleRowSave = useCallback((row: TableRow) => {
    const existingIndex = structure.rows.findIndex(r => r.id === row.id)
    let newRows: TableRow[]
    
    if (existingIndex >= 0) {
      newRows = structure.rows.map((r, i) => i === existingIndex ? row : r)
    } else {
      newRows = [...structure.rows, row]
    }
    
    setStructure(prev => ({ ...prev, rows: newRows }))
    setShowRowEditor(false)
    setEditingRow(null)
  }, [structure.rows])

  const handleColumnDragEnd = useCallback((result: any) => {
    if (!result.destination) return

    const columns = Array.from(structure.columns)
    const [reorderedColumn] = columns.splice(result.source.index, 1)
    columns.splice(result.destination.index, 0, reorderedColumn)

    const reorderedColumns = columns.map((col, index) => ({
      ...col,
      order: index + 1
    }))

    setStructure(prev => ({ ...prev, columns: reorderedColumns }))
  }, [structure.columns])

  const handleRowDragEnd = useCallback((result: any) => {
    if (!result.destination) return

    const rows = Array.from(structure.rows)
    const [reorderedRow] = rows.splice(result.source.index, 1)
    rows.splice(result.destination.index, 0, reorderedRow)

    const reorderedRows = rows.map((row, index) => ({
      ...row,
      order: index + 1
    }))

    setStructure(prev => ({ ...prev, rows: reorderedRows }))
  }, [structure.rows])

  const handleCellEdit = useCallback((rowId: string, columnId: string, currentValue: any) => {
    setEditingCell({ rowId, columnId, value: currentValue })
  }, [])

  const handleCellSave = useCallback((value: any) => {
    if (!editingCell) return

    const newRows = structure.rows.map(row => {
      if (row.id === editingCell.rowId) {
        return {
          ...row,
          cells: {
            ...row.cells,
            [editingCell.columnId]: value
          }
        }
      }
      return row
    })

    setStructure(prev => ({ ...prev, rows: newRows }))
    setEditingCell(null)
  }, [editingCell, structure.rows])

  const deleteColumn = useCallback((columnId: string) => {
    Modal.confirm({
      title: 'Delete Column',
      content: 'Are you sure you want to delete this column? All cell data in this column will be lost.',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        const newColumns = structure.columns.filter(col => col.id !== columnId)
        const newRows = structure.rows.map(row => ({
          ...row,
          cells: Object.fromEntries(
            Object.entries(row.cells).filter(([key]) => key !== columnId)
          )
        }))
        setStructure(prev => ({ ...prev, columns: newColumns, rows: newRows }))
      }
    })
  }, [structure])

  const deleteRow = useCallback((rowId: string) => {
    Modal.confirm({
      title: 'Delete Row',
      content: 'Are you sure you want to delete this row?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        const newRows = structure.rows.filter(row => row.id !== rowId)
        setStructure(prev => ({ ...prev, rows: newRows }))
      }
    })
  }, [structure.rows])

  const getRowTypeColor = (type: TableRow['type']) => {
    switch (type) {
      case 'header': return 'blue'
      case 'data': return 'green'
      case 'summary': return 'orange'
      case 'spacer': return 'default'
      default: return 'default'
    }
  }

  const renderTablePreview = () => {
    const tableColumns = structure.columns.map(col => ({
      title: (
        <div style={{ textAlign: col.alignment as any }}>
          <div>{col.name}</div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            {col.dataType} | {col.alignment}
          </div>
        </div>
      ),
      dataIndex: col.id,
      key: col.id,
      width: col.width,
      align: col.alignment as any,
      render: (value: any, record: any) => (
        <div
          style={{ 
            cursor: 'pointer',
            minHeight: '30px',
            padding: '4px',
            border: '1px dashed transparent'
          }}
          onClick={() => handleCellEdit(record.id, col.id, value)}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = '1px dashed #1890ff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = '1px dashed transparent'
          }}
        >
          {value || <span style={{ color: '#ccc' }}>Click to edit</span>}
        </div>
      )
    }))

    const tableData = structure.rows.map(row => ({
      ...row,
      key: row.id,
      ...row.cells
    }))

    return (
      <Table
        columns={tableColumns}
        dataSource={tableData}
        pagination={false}
        size="small"
        bordered
        rowClassName={(record) => {
          switch (record.type) {
            case 'header': return 'table-header-row'
            case 'summary': return 'table-summary-row'
            case 'spacer': return 'table-spacer-row'
            default: return ''
          }
        }}
      />
    )
  }

  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 16 
          }}>
            <h3>Table Structure</h3>
            <Space>
              <Select
                value={structure.layout}
                onChange={(value) => setStructure(prev => ({ ...prev, layout: value }))}
                style={{ width: 120 }}
              >
                <Option value="standard">Standard</Option>
                <Option value="grouped">Grouped</Option>
                <Option value="nested">Nested</Option>
              </Select>
              <Select
                value={structure.orientation}
                onChange={(value) => setStructure(prev => ({ ...prev, orientation: value }))}
                style={{ width: 120 }}
              >
                <Option value="portrait">Portrait</Option>
                <Option value="landscape">Landscape</Option>
              </Select>
            </Space>
          </div>
        </Col>

        {/* Column Management */}
        <Col span={12}>
          <Card
            title="Columns"
            extra={
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={addColumn}
              >
                Add Column
              </Button>
            }
          >
            <DragDropContext onDragEnd={handleColumnDragEnd}>
              <Droppable droppableId="columns">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {structure.columns.map((column, index) => (
                      <Draggable
                        key={column.id}
                        draggableId={column.id}
                        index={index}
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
                                  <span>{column.name}</span>
                                  <Tag color="blue">{column.dataType}</Tag>
                                </div>
                              }
                              extra={
                                <Space>
                                  <Tooltip title="Edit Column">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={() => {
                                        setEditingColumn(column)
                                        setShowColumnEditor(true)
                                      }}
                                    />
                                  </Tooltip>
                                  <Tooltip title="Delete Column">
                                    <Button
                                      type="text"
                                      size="small"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() => deleteColumn(column.id)}
                                    />
                                  </Tooltip>
                                </Space>
                              }
                            >
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                Alignment: {column.alignment} | Width: {column.width || 'Auto'}
                              </div>
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
            
            {structure.columns.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                color: '#999', 
                padding: '20px 0' 
              }}>
                No columns defined
              </div>
            )}
          </Card>
        </Col>

        {/* Row Management */}
        <Col span={12}>
          <Card
            title="Rows"
            extra={
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={addRow}
              >
                Add Row
              </Button>
            }
          >
            <DragDropContext onDragEnd={handleRowDragEnd}>
              <Droppable droppableId="rows">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {structure.rows.map((row, index) => (
                      <Draggable
                        key={row.id}
                        draggableId={row.id}
                        index={index}
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
                                  <span>{row.name}</span>
                                  <Tag color={getRowTypeColor(row.type)}>{row.type}</Tag>
                                </div>
                              }
                              extra={
                                <Space>
                                  <Tooltip title="Edit Row">
                                    <Button
                                      type="text"
                                      size="small"
                                      icon={<EditOutlined />}
                                      onClick={() => {
                                        setEditingRow(row)
                                        setShowRowEditor(true)
                                      }}
                                    />
                                  </Tooltip>
                                  <Tooltip title="Delete Row">
                                    <Button
                                      type="text"
                                      size="small"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() => deleteRow(row.id)}
                                    />
                                  </Tooltip>
                                </Space>
                              }
                            >
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                Order: {row.order} | Cells: {Object.keys(row.cells).length}
                              </div>
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
            
            {structure.rows.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                color: '#999', 
                padding: '20px 0' 
              }}>
                No rows defined
              </div>
            )}
          </Card>
        </Col>

        {/* Table Preview */}
        <Col span={24}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TableOutlined />
                <span>Table Preview</span>
                <Tag>{structure.layout} layout</Tag>
                <Tag>{structure.orientation}</Tag>
              </div>
            }
          >
            {structure.columns.length > 0 ? (
              renderTablePreview()
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: '#999', 
                padding: '40px 0' 
              }}>
                Add columns and rows to see table preview
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Column Editor Modal */}
      <Modal
        title={editingColumn?.id ? 'Edit Column' : 'Add Column'}
        visible={showColumnEditor}
        onCancel={() => {
          setShowColumnEditor(false)
          setEditingColumn(null)
        }}
        onOk={() => {
          if (editingColumn) {
            handleColumnSave(editingColumn)
          }
        }}
      >
        {editingColumn && (
          <Form layout="vertical">
            <Form.Item label="Column Name">
              <Input
                value={editingColumn.name}
                onChange={(e) => setEditingColumn({
                  ...editingColumn,
                  name: e.target.value
                })}
              />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Data Type">
                  <Select
                    value={editingColumn.dataType}
                    onChange={(value) => setEditingColumn({
                      ...editingColumn,
                      dataType: value
                    })}
                  >
                    <Option value="text">Text</Option>
                    <Option value="number">Number</Option>
                    <Option value="date">Date</Option>
                    <Option value="category">Category</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Form.Item label="Alignment">
                  <Select
                    value={editingColumn.alignment}
                    onChange={(value) => setEditingColumn({
                      ...editingColumn,
                      alignment: value
                    })}
                  >
                    <Option value="left">Left</Option>
                    <Option value="center">Center</Option>
                    <Option value="right">Right</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item label="Width (pixels)">
              <Input
                type="number"
                value={editingColumn.width}
                onChange={(e) => setEditingColumn({
                  ...editingColumn,
                  width: e.target.value ? parseInt(e.target.value) : undefined
                })}
              />
            </Form.Item>
            
            <Form.Item label="Format">
              <Input
                value={editingColumn.format}
                placeholder="e.g., #,##0.00 for numbers, YYYY-MM-DD for dates"
                onChange={(e) => setEditingColumn({
                  ...editingColumn,
                  format: e.target.value
                })}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Row Editor Modal */}
      <Modal
        title={editingRow?.id ? 'Edit Row' : 'Add Row'}
        visible={showRowEditor}
        onCancel={() => {
          setShowRowEditor(false)
          setEditingRow(null)
        }}
        onOk={() => {
          if (editingRow) {
            handleRowSave(editingRow)
          }
        }}
      >
        {editingRow && (
          <Form layout="vertical">
            <Form.Item label="Row Name">
              <Input
                value={editingRow.name}
                onChange={(e) => setEditingRow({
                  ...editingRow,
                  name: e.target.value
                })}
              />
            </Form.Item>
            
            <Form.Item label="Row Type">
              <Select
                value={editingRow.type}
                onChange={(value) => setEditingRow({
                  ...editingRow,
                  type: value
                })}
              >
                <Option value="header">Header</Option>
                <Option value="data">Data</Option>
                <Option value="summary">Summary</Option>
                <Option value="spacer">Spacer</Option>
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Cell Editor */}
      <CellEditor
        visible={!!editingCell}
        rowId={editingCell?.rowId}
        columnId={editingCell?.columnId}
        value={editingCell?.value}
        column={structure.columns.find(c => c.id === editingCell?.columnId)}
        onSave={handleCellSave}
        onCancel={() => setEditingCell(null)}
      />
    </div>
  )
}

export default TableStructureEditor