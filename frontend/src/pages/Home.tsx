import React from 'react'
import { Card, Col, Row, Statistic, Typography, Space, Button, Progress } from 'antd'
import {
  FileTextOutlined,
  LineChartOutlined,
  DesktopOutlined,
  FundOutlined,
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { endpoints } from '@/services/api'

const { Title, Paragraph } = Typography

const Home: React.FC = () => {
  const navigate = useNavigate()

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // In a real app, this would be a dedicated endpoint
      const [reportingEvents, analyses, outputs, methods] = await Promise.all([
        endpoints.reportingEvents.list({ size: 1 }),
        endpoints.analyses.list({ size: 1 }),
        endpoints.outputs.list({ size: 1 }),
        endpoints.methods.list({ size: 1 }),
      ])

      return {
        reportingEvents: reportingEvents.total || 0,
        analyses: analyses.total || 0,
        outputs: outputs.total || 0,
        methods: methods.total || 0,
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const quickActions = [
    {
      title: 'New Reporting Event',
      icon: <PlusOutlined />,
      onClick: () => navigate('/reporting-events/new'),
    },
    {
      title: 'Import Data',
      icon: <UploadOutlined />,
      onClick: () => navigate('/import'),
    },
    {
      title: 'Export Data',
      icon: <DownloadOutlined />,
      onClick: () => navigate('/export'),
    },
    {
      title: 'Sync Metadata',
      icon: <SyncOutlined />,
      onClick: () => navigate('/sync'),
    },
  ]

  const recentActivity = [
    { type: 'create', item: 'Reporting Event', name: 'Study XYZ Safety Analysis', time: '2 hours ago' },
    { type: 'update', item: 'Analysis', name: 'Demographics Table', time: '5 hours ago' },
    { type: 'create', item: 'Output', name: 'Adverse Events Summary', time: '1 day ago' },
    { type: 'update', item: 'Method', name: 'Kaplan-Meier Analysis', time: '2 days ago' },
  ]

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>Welcome to Clinical Trial Table Metadata System</Title>
          <Paragraph>
            Manage and organize your clinical trial analysis results, outputs, and displays
            according to the CDISC Analysis Results Standard (ARS).
          </Paragraph>
        </div>

        {/* Statistics */}
        <Row gutter={16}>
          <Col span={6}>
            <Card hoverable onClick={() => navigate('/reporting-events')}>
              <Statistic
                title="Reporting Events"
                value={stats?.reportingEvents || 0}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable onClick={() => navigate('/analyses')}>
              <Statistic
                title="Analyses"
                value={stats?.analyses || 0}
                prefix={<LineChartOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable onClick={() => navigate('/outputs')}>
              <Statistic
                title="Outputs"
                value={stats?.outputs || 0}
                prefix={<DesktopOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable onClick={() => navigate('/methods')}>
              <Statistic
                title="Methods"
                value={stats?.methods || 0}
                prefix={<FundOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <Row gutter={[16, 16]}>
            {quickActions.map((action, index) => (
              <Col span={6} key={index}>
                <Button
                  type="default"
                  icon={action.icon}
                  onClick={action.onClick}
                  style={{ width: '100%', height: 60 }}
                  size="large"
                >
                  {action.title}
                </Button>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Recent Activity and Progress */}
        <Row gutter={16}>
          <Col span={16}>
            <Card title="Recent Activity" style={{ height: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: index < recentActivity.length - 1 ? '1px solid #f0f0f0' : 'none',
                    }}
                  >
                    <Space>
                      <span style={{ textTransform: 'capitalize', color: '#1890ff' }}>
                        {activity.type}
                      </span>
                      <span>{activity.item}:</span>
                      <strong>{activity.name}</strong>
                    </Space>
                    <span style={{ color: '#8c8c8c' }}>{activity.time}</span>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="System Status" style={{ height: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Database Usage</span>
                    <span>45%</span>
                  </div>
                  <Progress percent={45} strokeColor="#52c41a" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>API Performance</span>
                    <span>98%</span>
                  </div>
                  <Progress percent={98} strokeColor="#1890ff" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Active Users</span>
                    <span>12</span>
                  </div>
                  <Progress percent={80} strokeColor="#722ed1" showInfo={false} />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  )
}

export default Home