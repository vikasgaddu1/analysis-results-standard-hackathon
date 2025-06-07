/**
 * Validation history component for tracking historical validation results
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Chip,
  IconButton,
  Tooltip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Collapse,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useValidationSessions } from '../../hooks/useValidation';
import { ValidationSession } from '../../services/validationService';
import validationService from '../../services/validationService';

export const ValidationHistory: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30'); // days
  const [objectTypeFilter, setObjectTypeFilter] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const { data: sessions = [], isLoading, refetch } = useValidationSessions({
    limit: 100,
    object_type: objectTypeFilter || undefined,
  });

  // Filter sessions by time range
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.started_at);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
    return sessionDate >= cutoffDate;
  });

  // Sort sessions by date (newest first)
  const sortedSessions = [...filteredSessions].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );

  // Calculate trends
  const calculateTrends = () => {
    if (sortedSessions.length < 2) return null;

    const midpoint = Math.floor(sortedSessions.length / 2);
    const recentSessions = sortedSessions.slice(0, midpoint);
    const olderSessions = sortedSessions.slice(midpoint);

    const recentAvgScore = recentSessions.reduce((sum, s) => sum + s.summary.compliance_score, 0) / recentSessions.length;
    const olderAvgScore = olderSessions.reduce((sum, s) => sum + s.summary.compliance_score, 0) / olderSessions.length;

    const scoreTrend = recentAvgScore - olderAvgScore;

    const recentFailureRate = recentSessions.reduce((sum, s) => sum + s.summary.failed_checks, 0) / recentSessions.length;
    const olderFailureRate = olderSessions.reduce((sum, s) => sum + s.summary.failed_checks, 0) / olderSessions.length;

    const failureTrend = recentFailureRate - olderFailureRate;

    return {
      scoreTrend,
      failureTrend,
      recentAvgScore,
      olderAvgScore,
    };
  };

  const trends = calculateTrends();

  const toggleSessionExpansion = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return <CheckCircleIcon sx={{ color: '#48bb78' }} />;
      case 'acceptable':
        return <WarningIcon sx={{ color: '#ecc94b' }} />;
      case 'needs_improvement':
      case 'failed':
        return <ErrorIcon sx={{ color: '#ed8936' }} />;
      case 'critical':
        return <ErrorIcon sx={{ color: '#f56565' }} />;
      default:
        return <InfoIcon sx={{ color: '#4299e1' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    return validationService.getStatusColor(status);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    return seconds < 60 ? `${seconds.toFixed(1)}s` : `${(seconds / 60).toFixed(1)}m`;
  };

  const renderTrendCard = (title: string, value: number, isPercentage = false, reverse = false) => {
    const isPositive = reverse ? value < 0 : value > 0;
    const icon = isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />;
    const color = isPositive ? 'success.main' : 'error.main';

    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="between">
            <Box>
              <Typography variant="body2" color="textSecondary">
                {title}
              </Typography>
              <Typography variant="h6" sx={{ color }}>
                {value > 0 ? '+' : ''}{value.toFixed(1)}{isPercentage ? '%' : ''}
              </Typography>
            </Box>
            <Box sx={{ color }}>
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <Typography>Loading validation history...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Validation History
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Track validation trends and historical performance over time
          </Typography>
        </Box>
        
        <Button variant="outlined" onClick={() => refetch()}>
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  label="Time Range"
                >
                  <MenuItem value="7">Last 7 days</MenuItem>
                  <MenuItem value="30">Last 30 days</MenuItem>
                  <MenuItem value="90">Last 90 days</MenuItem>
                  <MenuItem value="365">Last year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Object Type</InputLabel>
                <Select
                  value={objectTypeFilter}
                  onChange={(e) => setObjectTypeFilter(e.target.value)}
                  label="Object Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="reporting_event">Reporting Event</MenuItem>
                  <MenuItem value="analysis">Analysis</MenuItem>
                  <MenuItem value="method">Method</MenuItem>
                  <MenuItem value="output">Output</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="textSecondary">
                {sortedSessions.length} sessions found
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Trends */}
      {trends && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            {renderTrendCard('Compliance Score Trend', trends.scoreTrend, true)}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderTrendCard('Failure Rate Trend', trends.failureTrend, false, true)}
          </Grid>
        </Grid>
      )}

      {/* Timeline */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Validation Timeline
          </Typography>
          
          {sortedSessions.length === 0 ? (
            <Typography color="textSecondary" textAlign="center" py={4}>
              No validation sessions found for the selected time range
            </Typography>
          ) : (
            <Timeline>
              {sortedSessions.map((session, index) => (
                <TimelineItem key={session.id}>
                  <TimelineSeparator>
                    <TimelineDot>
                      {getStatusIcon(session.summary.overall_status)}
                    </TimelineDot>
                    {index < sortedSessions.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                      <Box display="flex" justifyContent="between" alignItems="center">
                        <Box flex={1}>
                          <Typography variant="h6">
                            {session.object_type} Validation
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {new Date(session.started_at).toLocaleString()}
                          </Typography>
                          <Box display="flex" gap={1} mt={1}>
                            <Chip
                              label={session.summary.overall_status}
                              size="small"
                              sx={{
                                backgroundColor: getStatusColor(session.summary.overall_status),
                                color: 'white',
                              }}
                            />
                            <Chip
                              label={`${session.summary.compliance_score.toFixed(1)}%`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={formatDuration(session.execution_time_seconds)}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" color="textSecondary">
                            {session.summary.failed_checks} failures
                          </Typography>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => toggleSessionExpansion(session.id)}
                            >
                              {expandedSessions.has(session.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Export Session">
                            <IconButton
                              size="small"
                              onClick={() => validationService.exportSessionToJSON(session)}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Collapse in={expandedSessions.has(session.id)}>
                        <Box mt={2}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={3}>
                              <Typography variant="body2" color="textSecondary">
                                Profile
                              </Typography>
                              <Typography variant="body2">
                                {session.profile_name}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Typography variant="body2" color="textSecondary">
                                Total Checks
                              </Typography>
                              <Typography variant="body2">
                                {session.summary.total_checks}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Typography variant="body2" color="textSecondary">
                                Warnings
                              </Typography>
                              <Typography variant="body2">
                                {session.summary.warnings}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <Typography variant="body2" color="textSecondary">
                                Errors
                              </Typography>
                              <Typography variant="body2" color="error.main">
                                {session.summary.errors}
                              </Typography>
                            </Grid>
                          </Grid>

                          {session.results.length > 0 && (
                            <Box mt={2}>
                              <Typography variant="body2" fontWeight="medium" gutterBottom>
                                Top Issues ({Math.min(5, session.results.length)})
                              </Typography>
                              <List dense>
                                {session.results
                                  .filter(r => r.severity === 'critical' || r.severity === 'error')
                                  .slice(0, 5)
                                  .map((result) => (
                                    <ListItem key={result.id}>
                                      <ListItemText
                                        primary={result.rule_name}
                                        secondary={result.message}
                                      />
                                      <ListItemSecondaryAction>
                                        <Chip
                                          label={result.severity}
                                          size="small"
                                          color={result.severity === 'critical' ? 'error' : 'warning'}
                                        />
                                      </ListItemSecondaryAction>
                                    </ListItem>
                                  ))}
                              </List>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ValidationHistory;