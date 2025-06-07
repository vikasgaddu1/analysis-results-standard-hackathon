import React from 'react'
import { Row, Col, Card, Button, Tag, Space } from 'antd'
import { CheckOutlined, EyeOutlined } from '@ant-design/icons'

interface Theme {
  id: string
  name: string
  description: string
  category: 'clinical' | 'regulatory' | 'publication' | 'custom'
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
  isStandard: boolean
  author?: string
}

interface ThemeSelectorProps {
  currentTheme: string
  onThemeChange: (themeId: string, themeStyles: any) => void
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange
}) => {
  const themes: Theme[] = [
    {
      id: 'clinical-standard',
      name: 'Clinical Standard',
      description: 'Standard clinical trial table format with conservative styling',
      category: 'clinical',
      colors: {
        primary: '#1890ff',
        secondary: '#52c41a',
        background: '#ffffff',
        border: '#000000',
        text: '#000000',
        header: '#f5f5f5'
      },
      typography: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 10,
        headerFontSize: 11,
        fontWeight: 'normal',
        lineHeight: 1.2
      },
      layout: {
        cellPadding: 6,
        borderWidth: 1,
        borderStyle: 'solid',
        tableWidth: '100%',
        alignment: 'left'
      },
      isStandard: true
    },
    {
      id: 'fda-regulatory',
      name: 'FDA Regulatory',
      description: 'FDA-compliant formatting for regulatory submissions',
      category: 'regulatory',
      colors: {
        primary: '#003f5c',
        secondary: '#2f4b7c',
        background: '#ffffff',
        border: '#000000',
        text: '#000000',
        header: '#ffffff'
      },
      typography: {
        fontFamily: 'Times New Roman, serif',
        fontSize: 9,
        headerFontSize: 10,
        fontWeight: 'normal',
        lineHeight: 1.15
      },
      layout: {
        cellPadding: 4,
        borderWidth: 1,
        borderStyle: 'solid',
        tableWidth: '100%',
        alignment: 'left'
      },
      isStandard: true
    },
    {
      id: 'ema-european',
      name: 'EMA European',
      description: 'European Medicines Agency preferred table format',
      category: 'regulatory',
      colors: {
        primary: '#0052cc',
        secondary: '#006644',
        background: '#ffffff',
        border: '#333333',
        text: '#333333',
        header: '#f8f9fa'
      },
      typography: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 9,
        headerFontSize: 10,
        fontWeight: 'normal',
        lineHeight: 1.2
      },
      layout: {
        cellPadding: 5,
        borderWidth: 1,
        borderStyle: 'solid',
        tableWidth: '100%',
        alignment: 'left'
      },
      isStandard: true
    },
    {
      id: 'publication-ready',
      name: 'Publication Ready',
      description: 'Clean, publication-quality formatting for journals',
      category: 'publication',
      colors: {
        primary: '#2c3e50',
        secondary: '#3498db',
        background: '#ffffff',
        border: '#2c3e50',
        text: '#2c3e50',
        header: '#ecf0f1'
      },
      typography: {
        fontFamily: 'Times New Roman, serif',
        fontSize: 11,
        headerFontSize: 12,
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
      isStandard: false,
      author: 'Journal Standards'
    },
    {
      id: 'modern-minimal',
      name: 'Modern Minimal',
      description: 'Clean, modern design with minimal borders',
      category: 'custom',
      colors: {
        primary: '#6c5ce7',
        secondary: '#00b894',
        background: '#ffffff',
        border: '#ddd',
        text: '#2d3436',
        header: '#f8f9fa'
      },
      typography: {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: 12,
        headerFontSize: 13,
        fontWeight: 'normal',
        lineHeight: 1.5
      },
      layout: {
        cellPadding: 12,
        borderWidth: 1,
        borderStyle: 'solid',
        tableWidth: '100%',
        alignment: 'left'
      },
      isStandard: false,
      author: 'Design Team'
    },
    {
      id: 'high-contrast',
      name: 'High Contrast',
      description: 'Accessibility-focused high contrast theme',
      category: 'custom',
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        background: '#ffffff',
        border: '#000000',
        text: '#000000',
        header: '#000000'
      },
      typography: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 12,
        headerFontSize: 14,
        fontWeight: 'bold',
        lineHeight: 1.6
      },
      layout: {
        cellPadding: 10,
        borderWidth: 2,
        borderStyle: 'solid',
        tableWidth: '100%',
        alignment: 'left'
      },
      isStandard: false,
      author: 'Accessibility Team'
    }
  ]

  const getCategoryColor = (category: Theme['category']) => {
    const colors = {
      clinical: 'blue',
      regulatory: 'red',
      publication: 'green',
      custom: 'purple'
    }
    return colors[category]
  }

  const renderThemePreview = (theme: Theme) => (
    <div style={{ 
      transform: 'scale(0.6)',
      transformOrigin: 'top left',
      width: '166%',
      height: '120px',
      overflow: 'hidden'
    }}>
      <table style={{
        fontFamily: theme.typography.fontFamily,
        fontSize: `${theme.typography.fontSize}px`,
        lineHeight: theme.typography.lineHeight,
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        border: `${theme.layout.borderWidth}px ${theme.layout.borderStyle} ${theme.colors.border}`
      }}>
        <thead>
          <tr>
            <th style={{
              backgroundColor: theme.colors.header,
              fontSize: `${theme.typography.headerFontSize}px`,
              fontWeight: theme.typography.fontWeight,
              padding: `${theme.layout.cellPadding}px`,
              border: `${theme.layout.borderWidth}px ${theme.layout.borderStyle} ${theme.colors.border}`,
              textAlign: theme.layout.alignment as any,
              color: theme.id === 'high-contrast' ? '#ffffff' : theme.colors.text
            }}>
              Parameter
            </th>
            <th style={{
              backgroundColor: theme.colors.header,
              fontSize: `${theme.typography.headerFontSize}px`,
              fontWeight: theme.typography.fontWeight,
              padding: `${theme.layout.cellPadding}px`,
              border: `${theme.layout.borderWidth}px ${theme.layout.borderStyle} ${theme.colors.border}`,
              textAlign: 'center',
              color: theme.id === 'high-contrast' ? '#ffffff' : theme.colors.text
            }}>
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{
              padding: `${theme.layout.cellPadding}px`,
              border: `${theme.layout.borderWidth}px ${theme.layout.borderStyle} ${theme.colors.border}`,
              textAlign: theme.layout.alignment as any
            }}>
              Age (years)
            </td>
            <td style={{
              padding: `${theme.layout.cellPadding}px`,
              border: `${theme.layout.borderWidth}px ${theme.layout.borderStyle} ${theme.colors.border}`,
              textAlign: 'center'
            }}>
              65.2 (12.4)
            </td>
          </tr>
          <tr>
            <td style={{
              padding: `${theme.layout.cellPadding}px`,
              border: `${theme.layout.borderWidth}px ${theme.layout.borderStyle} ${theme.colors.border}`,
              textAlign: theme.layout.alignment as any
            }}>
              Gender, n (%)
            </td>
            <td style={{
              padding: `${theme.layout.cellPadding}px`,
              border: `${theme.layout.borderWidth}px ${theme.layout.borderStyle} ${theme.colors.border}`,
              textAlign: 'center'
            }}>
              85 (56.7)
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  const renderThemeCard = (theme: Theme) => (
    <Card
      key={theme.id}
      size="small"
      hoverable
      style={{ 
        height: '100%',
        border: currentTheme === theme.id ? '2px solid #1890ff' : '1px solid #d9d9d9'
      }}
      bodyStyle={{ padding: '12px' }}
      actions={[
        <Button
          type={currentTheme === theme.id ? 'primary' : 'default'}
          size="small"
          icon={currentTheme === theme.id ? <CheckOutlined /> : undefined}
          onClick={() => onThemeChange(theme.id, {
            colors: theme.colors,
            typography: theme.typography,
            layout: theme.layout
          })}
        >
          {currentTheme === theme.id ? 'Selected' : 'Select'}
        </Button>
      ]}
    >
      <div style={{ marginBottom: 8 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: 4
        }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
              {theme.name}
            </div>
            {theme.isStandard && (
              <Tag color="gold" size="small" style={{ margin: '2px 0' }}>
                Standard
              </Tag>
            )}
          </div>
          <Tag color={getCategoryColor(theme.category)} size="small">
            {theme.category}
          </Tag>
        </div>
        
        <div style={{ 
          fontSize: '11px', 
          color: '#666', 
          marginBottom: 8,
          lineHeight: 1.3
        }}>
          {theme.description}
        </div>

        {theme.author && (
          <div style={{ fontSize: '10px', color: '#999', marginBottom: 8 }}>
            by {theme.author}
          </div>
        )}
      </div>

      {/* Theme Preview */}
      <div style={{
        border: '1px solid #f0f0f0',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: '#fafafa',
        marginBottom: 8
      }}>
        {renderThemePreview(theme)}
      </div>

      {/* Color Palette */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '10px', color: '#666', marginBottom: 4 }}>
          Color Palette:
        </div>
        <Space size={2}>
          <div style={{
            width: 16,
            height: 16,
            backgroundColor: theme.colors.primary,
            borderRadius: 2,
            border: '1px solid #d9d9d9'
          }} title="Primary" />
          <div style={{
            width: 16,
            height: 16,
            backgroundColor: theme.colors.header,
            borderRadius: 2,
            border: '1px solid #d9d9d9'
          }} title="Header" />
          <div style={{
            width: 16,
            height: 16,
            backgroundColor: theme.colors.border,
            borderRadius: 2,
            border: '1px solid #d9d9d9'
          }} title="Border" />
          <div style={{
            width: 16,
            height: 16,
            backgroundColor: theme.colors.text,
            borderRadius: 2,
            border: '1px solid #d9d9d9'
          }} title="Text" />
        </Space>
      </div>

      {/* Typography Info */}
      <div style={{ fontSize: '10px', color: '#666' }}>
        <div>{theme.typography.fontFamily}</div>
        <div>Size: {theme.typography.fontSize}px / {theme.typography.headerFontSize}px</div>
      </div>
    </Card>
  )

  // Group themes by category
  const themesByCategory = themes.reduce((acc, theme) => {
    if (!acc[theme.category]) {
      acc[theme.category] = []
    }
    acc[theme.category].push(theme)
    return acc
  }, {} as Record<string, Theme[]>)

  return (
    <div style={{ padding: '16px 0' }}>
      {Object.entries(themesByCategory).map(([category, categoryThemes]) => (
        <div key={category} style={{ marginBottom: 24 }}>
          <h4 style={{ 
            textTransform: 'capitalize',
            marginBottom: 12,
            color: '#262626'
          }}>
            {category} Themes
          </h4>
          <Row gutter={[12, 12]}>
            {categoryThemes.map(theme => (
              <Col key={theme.id} span={24}>
                {renderThemeCard(theme)}
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </div>
  )
}

export default ThemeSelector