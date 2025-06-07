/**
 * Main validation dashboard component
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  PlayArrow as PlayArrowIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useValidation, useValidationMetrics, useValidationSessions } from '../../hooks/useValidation';
import { ComplianceChecker } from './ComplianceChecker';
import { ValidationReports } from './ValidationReports';
import { ValidationHistory } from './ValidationHistory';
import { QualityMetrics } from './QualityMetrics';
import { ValidationSettings } from './ValidationSettings';
import validationService from '../../services/validationService';

interface ValidationDashboardProps {
  defaultTab?: number;
  showQuickActions?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`validation-tabpanel-${index}`}
      aria-labelledby={`validation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ValidationDashboard: React.FC<ValidationDashboardProps> = ({
  defaultTab = 0,
  showQuickActions = true,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  
  const { isValidating, validationProgress } = useValidation();
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useValidationMetrics();
  const { data: recentSessions, isLoading: sessionsLoading } = useValidationSessions({ limit: 5 });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleExportMetrics = () => {
    if (metrics) {
      const data = {
        exportDate: new Date().toISOString(),
        metrics,
        recentSessions: recentSessions?.slice(0, 10) || [],
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `validation_metrics_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
    handleMenuClose();
  };

  const handleRefreshAll = () => {
    refetchMetrics();
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    return validationService.getStatusColor(status);
  };

  const renderDashboardOverview = () => (
    <Grid container spacing={3}>
      {/* Metrics Cards */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Validations
                </Typography>
                <Typography variant="h4">
                  {metricsLoading ? '...' : metrics?.total_validations || 0}
                </Typography>
              </Box>
              <AssessmentIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Pass Rate
                </Typography>
                <Typography variant="h4" color="success.main">
                  {metricsLoading ? '...' : `${metrics?.pass_rate.toFixed(1) || 0}%`}
                </Typography>
              </Box>
              <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Avg Compliance Score
              </Typography>
              <Typography variant="h4">
                {metricsLoading ? '...' : `${metrics?.average_compliance_score.toFixed(1) || 0}%`}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics?.average_compliance_score || 0}
                sx={{ mt: 1 }}
                color={
                  (metrics?.average_compliance_score || 0) >= 90 ? 'success' :
                  (metrics?.average_compliance_score || 0) >= 75 ? 'warning' : 'error'
                }
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box>
              <Typography color="textSecondary" gutterBottom variant="body2">
                Avg Execution Time
              </Typography>
              <Typography variant="h4">
                {metricsLoading ? '...' : `${(metrics?.average_execution_time_seconds || 0).toFixed(2)}s`}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Validation Progress */}
      {isValidating && (
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Validation in progress... {validationProgress}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={validationProgress}
              sx={{ mt: 1 }}
            />
          </Alert>
        </Grid>
      )}

      {/* Recent Sessions */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Validation Sessions
            </Typography>
            {sessionsLoading ? (
              <Typography>Loading...</Typography>
            ) : recentSessions && recentSessions.length > 0 ? (
              <Box>
                {recentSessions.map((session) => (
                  <Box
                    key={session.id}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    py={1}
                    borderBottom="1px solid"
                    borderColor="divider"
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {session.object_type} - {session.object_id || 'No ID'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(session.started_at).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={session.summary.overall_status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(session.summary.overall_status),
                          color: 'white',
                        }}
                      />
                      <Typography variant="body2">
                        {session.summary.compliance_score.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="textSecondary">
                No recent validation sessions
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Top Failing Object Types */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Failing Object Types
            </Typography>
            {metricsLoading ? (
              <Typography>Loading...</Typography>
            ) : metrics?.top_failing_object_types && metrics.top_failing_object_types.length > 0 ? (
              <Box>
                {metrics.top_failing_object_types.slice(0, 5).map(([objectType, failures]) => (
                  <Box
                    key={objectType}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    py={1}
                  >
                    <Typography variant="body2">{objectType}</Typography>
                    <Chip label={failures} size="small" color="error" />
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="textSecondary">
                No failure data available
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Validation Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Monitor and manage validation processes, compliance, and quality metrics
          </Typography>
        </Box>
        
        {showQuickActions && (
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefreshAll}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="More Actions">
              <IconButton onClick={handleMenuOpen}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleExportMetrics}>
                <DownloadIcon sx={{ mr: 1 }} />
                Export Metrics
              </MenuItem>
              <MenuItem onClick={handleRefreshAll}>
                <RefreshIcon sx={{ mr: 1 }} />
                Refresh All Data
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => setActiveTab(5)}>
                <SettingsIcon sx={{ mr: 1 }} />
                Validation Settings
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="validation dashboard tabs">
          <Tab
            label="Overview"
            icon={<AssessmentIcon />}
            iconPosition="start"
            id="validation-tab-0"
            aria-controls="validation-tabpanel-0"
          />
          <Tab
            label="Compliance Checker"
            icon={<PlayArrowIcon />}
            iconPosition="start"
            id="validation-tab-1"
            aria-controls="validation-tabpanel-1"
          />
          <Tab
            label="Reports"
            icon={<FilterListIcon />}
            iconPosition="start"
            id="validation-tab-2"
            aria-controls="validation-tabpanel-2"
          />
          <Tab
            label="History"
            icon={<HistoryIcon />}
            iconPosition="start"
            id="validation-tab-3"
            aria-controls="validation-tabpanel-3"
          />
          <Tab
            label="Quality Metrics"
            icon={<TrendingUpIcon />}
            iconPosition="start"
            id="validation-tab-4"
            aria-controls="validation-tabpanel-4"
          />
          <Tab
            label="Settings"
            icon={<SettingsIcon />}
            iconPosition="start"
            id="validation-tab-5"
            aria-controls="validation-tabpanel-5"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        {renderDashboardOverview()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ComplianceChecker />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <ValidationReports />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <ValidationHistory />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <QualityMetrics />
      </TabPanel>

      <TabPanel value={activeTab} index={5}>
        <ValidationSettings />
      </TabPanel>
    </Container>
  );
};

export default ValidationDashboard;