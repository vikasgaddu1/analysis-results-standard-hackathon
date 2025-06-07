import React, { useState } from 'react'
import { 
  Card, 
  Tabs, 
  Button, 
  Space, 
  Divider,
  Collapse
} from 'antd'
import { 
  CloseOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
  BorderOutlined,
  LayoutOutlined
} from '@ant-design/icons'
import ThemeSelector from './ThemeSelector'
import CustomStyler from './CustomStyler'
import { Output } from '../../../types'

const { TabPane } = Tabs
const { Panel } = Collapse

interface StylePanelProps {
  output: Partial<Output>
  onChange: (updates: Partial<Output>) => void
  onClose: () => void
}

interface TableStyles {
  theme: string
  colors: {
    primary: string
    secondary: string
    background: string
    border: string
    text: string
    header: string
  }
  typography: {
    fontFamily: string
    fontSize: number
    headerFontSize: number
    fontWeight: string
    lineHeight: number
  }
  layout: {
    cellPadding: number
    borderWidth: number
    borderStyle: string
    tableWidth: string
    alignment: string
  }
  spacing: {
    marginTop: number
    marginBottom: number
    sectionSpacing: number
  }
}

const StylePanel: React.FC<StylePanelProps> = ({
  output,
  onChange,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('themes')
  const [tableStyles, setTableStyles] = useState<TableStyles>({
    theme: 'clinical-standard',
    colors: {
      primary: '#1890ff',
      secondary: '#52c41a',
      background: '#ffffff',
      border: '#d9d9d9',
      text: '#262626',
      header: '#f5f5f5'
    },
    typography: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 12,
      headerFontSize: 14,
      fontWeight: 'normal',
      lineHeight: 1.4
    },
    layout: {
      cellPadding: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      tableWidth: '100%',
      alignment: 'left'
    },
    spacing: {
      marginTop: 20,
      marginBottom: 20,
      sectionSpacing: 16
    }
  })

  const handleStyleChange = (updates: Partial<TableStyles>) => {
    const newStyles = { ...tableStyles, ...updates }
    setTableStyles(newStyles)
    
    // Convert to output format and call onChange
    onChange({
      ...output,
      metadata: {
        ...((output as any).metadata || {}),
        styles: newStyles
      }
    })
  }

  const handleThemeChange = (themeName: string, themeStyles: Partial<TableStyles>) => {
    handleStyleChange({ theme: themeName, ...themeStyles })
  }

  const quickActions = [
    {
      key: 'reset',
      label: 'Reset Styles',
      action: () => {
        const defaultStyles: TableStyles = {
          theme: 'clinical-standard',
          colors: {
            primary: '#1890ff',
            secondary: '#52c41a',
            background: '#ffffff',
            border: '#d9d9d9',
            text: '#262626',
            header: '#f5f5f5'
          },
          typography: {
            fontFamily: 'Arial, sans-serif',
            fontSize: 12,
            headerFontSize: 14,
            fontWeight: 'normal',
            lineHeight: 1.4
          },
          layout: {
            cellPadding: 8,
            borderWidth: 1,
            borderStyle: 'solid',
            tableWidth: '100%',
            alignment: 'left'
          },
          spacing: {
            marginTop: 20,
            marginBottom: 20,
            sectionSpacing: 16
          }
        }
        setTableStyles(defaultStyles)
        handleStyleChange(defaultStyles)
      }
    },
    {
      key: 'preview',
      label: 'Preview',
      action: () => {
        // This would trigger a preview with current styles
        console.log('Preview with styles:', tableStyles)
      }
    }
  ]

  const generateCSSPreview = () => {
    return `
/* Table Styles */
.clinical-table {
  font-family: ${tableStyles.typography.fontFamily};
  font-size: ${tableStyles.typography.fontSize}px;
  line-height: ${tableStyles.typography.lineHeight};
  width: ${tableStyles.layout.tableWidth};
  border-collapse: collapse;
  margin: ${tableStyles.spacing.marginTop}px auto ${tableStyles.spacing.marginBottom}px;
  background-color: ${tableStyles.colors.background};
  color: ${tableStyles.colors.text};
}

.clinical-table th {
  background-color: ${tableStyles.colors.header};
  font-size: ${tableStyles.typography.headerFontSize}px;
  font-weight: bold;
  padding: ${tableStyles.layout.cellPadding}px;
  border: ${tableStyles.layout.borderWidth}px ${tableStyles.layout.borderStyle} ${tableStyles.colors.border};
  text-align: ${tableStyles.layout.alignment};
}

.clinical-table td {
  padding: ${tableStyles.layout.cellPadding}px;
  border: ${tableStyles.layout.borderWidth}px ${tableStyles.layout.borderStyle} ${tableStyles.colors.border};
  text-align: ${tableStyles.layout.alignment};
}

.table-section {
  margin-bottom: ${tableStyles.spacing.sectionSpacing}px;
}
    `.trim()
  }

  return (
    <Card
      title={
        <Space>
          <BgColorsOutlined />
          Table Styling
        </Space>
      }
      size="small"
      extra={
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          size="small"
        />
      }
      style={{ height: '100%' }}
      bodyStyle={{ padding: 0, height: 'calc(100vh - 200px)', overflow: 'auto' }}
    >
      {/* Quick Actions */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Space size="small">
          {quickActions.map(action => (
            <Button
              key={action.key}
              size="small"
              onClick={action.action}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="small"
        style={{ padding: '0 16px' }}
      >
        <TabPane
          tab={
            <Space>
              <BgColorsOutlined />
              Themes
            </Space>
          }
          key="themes"
        >
          <ThemeSelector
            currentTheme={tableStyles.theme}
            onThemeChange={handleThemeChange}
          />
        </TabPane>

        <TabPane
          tab={
            <Space>
              <FontSizeOutlined />
              Typography
            </Space>
          }
          key="typography"
        >
          <CustomStyler
            section="typography"
            styles={tableStyles.typography}
            onChange={(updates) => handleStyleChange({ typography: { ...tableStyles.typography, ...updates } })}
          />
        </TabPane>

        <TabPane
          tab={
            <Space>
              <BorderOutlined />
              Layout
            </Space>
          }
          key="layout"
        >
          <CustomStyler
            section="layout"
            styles={tableStyles.layout}
            onChange={(updates) => handleStyleChange({ layout: { ...tableStyles.layout, ...updates } })}
          />
        </TabPane>

        <TabPane
          tab={
            <Space>
              <LayoutOutlined />
              Colors
            </Space>
          }
          key="colors"
        >
          <CustomStyler
            section="colors"
            styles={tableStyles.colors}
            onChange={(updates) => handleStyleChange({ colors: { ...tableStyles.colors, ...updates } })}
          />
        </TabPane>
      </Tabs>

      <Divider style={{ margin: '16px 0' }} />

      {/* Style Preview */}
      <div style={{ padding: '0 16px 16px' }}>
        <Collapse size="small">
          <Panel header="CSS Preview" key="css">
            <pre style={{ 
              fontSize: '10px',
              backgroundColor: '#f5f5f5',
              padding: '8px',
              borderRadius: '4px',
              maxHeight: '200px',
              overflow: 'auto',
              margin: 0
            }}>
              {generateCSSPreview()}
            </pre>
          </Panel>
        </Collapse>
      </div>

      {/* Live Preview */}
      <div style={{ padding: '0 16px 16px' }}>
        <Card title="Live Preview" size="small">
          <div style={{ 
            transform: 'scale(0.7)',
            transformOrigin: 'top left',
            width: '142%',
            height: '200px',
            overflow: 'hidden'
          }}>
            <table style={{
              fontFamily: tableStyles.typography.fontFamily,
              fontSize: `${tableStyles.typography.fontSize}px`,
              lineHeight: tableStyles.typography.lineHeight,
              width: tableStyles.layout.tableWidth,
              borderCollapse: 'collapse',
              backgroundColor: tableStyles.colors.background,
              color: tableStyles.colors.text
            }}>
              <thead>
                <tr>
                  <th style={{
                    backgroundColor: tableStyles.colors.header,
                    fontSize: `${tableStyles.typography.headerFontSize}px`,
                    fontWeight: 'bold',
                    padding: `${tableStyles.layout.cellPadding}px`,
                    border: `${tableStyles.layout.borderWidth}px ${tableStyles.layout.borderStyle} ${tableStyles.colors.border}`,
                    textAlign: tableStyles.layout.alignment as any
                  }}>
                    Parameter
                  </th>
                  <th style={{
                    backgroundColor: tableStyles.colors.header,
                    fontSize: `${tableStyles.typography.headerFontSize}px`,
                    fontWeight: 'bold',
                    padding: `${tableStyles.layout.cellPadding}px`,
                    border: `${tableStyles.layout.borderWidth}px ${tableStyles.layout.borderStyle} ${tableStyles.colors.border}`,
                    textAlign: 'center'
                  }}>
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{
                    padding: `${tableStyles.layout.cellPadding}px`,
                    border: `${tableStyles.layout.borderWidth}px ${tableStyles.layout.borderStyle} ${tableStyles.colors.border}`,
                    textAlign: tableStyles.layout.alignment as any
                  }}>
                    Age (years)
                  </td>
                  <td style={{
                    padding: `${tableStyles.layout.cellPadding}px`,
                    border: `${tableStyles.layout.borderWidth}px ${tableStyles.layout.borderStyle} ${tableStyles.colors.border}`,
                    textAlign: 'center'
                  }}>
                    65.2 (12.4)
                  </td>
                </tr>
                <tr>
                  <td style={{
                    padding: `${tableStyles.layout.cellPadding}px`,
                    border: `${tableStyles.layout.borderWidth}px ${tableStyles.layout.borderStyle} ${tableStyles.colors.border}`,
                    textAlign: tableStyles.layout.alignment as any
                  }}>
                    Gender, n (%)
                  </td>
                  <td style={{
                    padding: `${tableStyles.layout.cellPadding}px`,
                    border: `${tableStyles.layout.borderWidth}px ${tableStyles.layout.borderStyle} ${tableStyles.colors.border}`,
                    textAlign: 'center'
                  }}>
                    85 (56.7)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Card>
  )
}

export default StylePanel