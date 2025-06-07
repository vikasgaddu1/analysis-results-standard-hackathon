/**
 * Quality metrics and scoring component
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  CircularProgress,
  Chart,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useValidationMetrics, useValidationSessions } from '../../hooks/useValidation';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const QualityMetrics: React.FC = () => {
  const [timeRange, setTimeRange] = useState(30);
  const [objectTypeFilter, setObjectTypeFilter] = useState('');

  const { data: metrics, isLoading: metricsLoading } = useValidationMetrics({
    days: timeRange,
    object_type: objectTypeFilter || undefined,
  });

  const { data: sessions = [] } = useValidationSessions({
    limit: 1000,
    object_type: objectTypeFilter || undefined,
  });

  // Calculate trend data for charts
  const getTrendData = () => {
    const now = new Date();
    const days = [];
    
    for (let i = timeRange - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        compliance_score: 0,
        total_checks: 0,
        failures: 0,
        validations: 0,
      });
    }

    // Aggregate session data by day
    sessions.forEach(session => {
      const sessionDate = new Date(session.started_at).toISOString().split('T')[0];
      const dayData = days.find(d => d.date === sessionDate);
      if (dayData) {
        dayData.validations += 1;
        dayData.total_checks += session.summary.total_checks;
        dayData.failures += session.summary.failed_checks;
        dayData.compliance_score += session.summary.compliance_score;
      }
    });

    // Calculate averages
    return days.map(day => ({
      ...day,
      compliance_score: day.validations > 0 ? day.compliance_score / day.validations : 0,
    }));
  };

  // Calculate quality score distribution
  const getQualityDistribution = () => {
    const distribution = {
      excellent: 0,
      good: 0,
      acceptable: 0,
      needs_improvement: 0,
      failed: 0,
    };

    sessions.forEach(session => {
      const score = session.summary.compliance_score;
      if (score >= 95) distribution.excellent++;
      else if (score >= 85) distribution.good++;
      else if (score >= 75) distribution.acceptable++;
      else if (score >= 60) distribution.needs_improvement++;
      else distribution.failed++;
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };

  // Calculate rule failure frequency
  const getRuleFailureData = () => {
    const ruleFailures: Record<string, number> = {};
    
    sessions.forEach(session => {
      session.results.forEach(result => {
        if (result.is_failing) {
          ruleFailures[result.rule_name] = (ruleFailures[result.rule_name] || 0) + 1;
        }
      });
    });

    return Object.entries(ruleFailures)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([rule, failures]) => ({ rule, failures }));
  };

  // Calculate compliance by object type
  const getComplianceByObjectType = () => {
    const typeStats: Record<string, { total: number; score: number; validations: number }> = {};
    
    sessions.forEach(session => {
      if (!typeStats[session.object_type]) {
        typeStats[session.object_type] = { total: 0, score: 0, validations: 0 };
      }
      typeStats[session.object_type].total += session.summary.total_checks;
      typeStats[session.object_type].score += session.summary.compliance_score;
      typeStats[session.object_type].validations += 1;
    });

    return Object.entries(typeStats).map(([type, stats]) => ({
      object_type: type,
      avg_compliance: stats.validations > 0 ? stats.score / stats.validations : 0,
      total_checks: stats.total,
      validations: stats.validations,
    }));
  };

  const trendData = getTrendData();
  const qualityDistribution = getQualityDistribution();
  const ruleFailureData = getRuleFailureData();
  const complianceByType = getComplianceByObjectType();

  if (metricsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Quality Metrics
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Comprehensive quality analysis and performance metrics
          </Typography>
        </Box>
        
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              label="Time Range"
            >
              <MenuItem value={7}>7 days</MenuItem>
              <MenuItem value={30}>30 days</MenuItem>
              <MenuItem value={90}>90 days</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Object Type</InputLabel>
            <Select
              value={objectTypeFilter}
              onChange={(e) => setObjectTypeFilter(e.target.value)}
              label="Object Type"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="reporting_event">Reporting Event</MenuItem>
              <MenuItem value="analysis">Analysis</MenuItem>
              <MenuItem value="method">Method</MenuItem>
              <MenuItem value="output">Output</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                Overall Quality Score
              </Typography>
              <Box display="flex" alignItems="center">
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={metrics?.average_compliance_score || 0}
                    sx={{ height: 10, borderRadius: 1 }}
                    color={
                      (metrics?.average_compliance_score || 0) >= 90 ? 'success' :
                      (metrics?.average_compliance_score || 0) >= 75 ? 'warning' : 'error'
                    }
                  />
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {metrics?.average_compliance_score.toFixed(1) || 0}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pass Rate
              </Typography>
              <Typography variant="h4" color="success.main">
                {metrics?.pass_rate.toFixed(1) || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                of all validation checks
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Validations
              </Typography>
              <Typography variant="h4">
                {metrics?.total_validations || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                in the selected period
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Avg Response Time
              </Typography>
              <Typography variant="h4">
                {(metrics?.average_execution_time_seconds || 0).toFixed(2)}s
              </Typography>
              <Typography variant="body2" color="textSecondary">
                validation execution time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compliance Score Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Compliance Score']} />
                  <Line 
                    type="monotone" 
                    dataKey="compliance_score" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Quality Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quality Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={qualityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {qualityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Failing Rules */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Most Common Failures
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ruleFailureData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="rule" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="failures" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance by Object Type */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Compliance by Object Type
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Object Type</TableCell>
                      <TableCell align="right">Avg Compliance</TableCell>
                      <TableCell align="right">Validations</TableCell>
                      <TableCell align="right">Total Checks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {complianceByType.map((row) => (
                      <TableRow key={row.object_type}>
                        <TableCell>
                          {row.object_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${row.avg_compliance.toFixed(1)}%`}
                            size="small"
                            color={
                              row.avg_compliance >= 90 ? 'success' :
                              row.avg_compliance >= 75 ? 'warning' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">{row.validations}</TableCell>
                        <TableCell align="right">{row.total_checks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Quality Indicators */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quality Indicators
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color={
                      (metrics?.average_compliance_score || 0) >= 95 ? 'success.main' :
                      (metrics?.average_compliance_score || 0) >= 85 ? 'warning.main' : 'error.main'
                    }>
                      {metrics?.average_compliance_score >= 95 ? 'Excellent' :
                       metrics?.average_compliance_score >= 85 ? 'Good' :
                       metrics?.average_compliance_score >= 75 ? 'Acceptable' : 'Needs Improvement'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Overall Quality Rating
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color={
                      (metrics?.pass_rate || 0) >= 95 ? 'success.main' : 'warning.main'
                    }>
                      {(metrics?.pass_rate || 0) >= 95 ? 'Stable' : 'Improving'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Quality Trend
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color={
                      (metrics?.average_execution_time_seconds || 0) <= 5 ? 'success.main' :
                      (metrics?.average_execution_time_seconds || 0) <= 15 ? 'warning.main' : 'error.main'
                    }>
                      {(metrics?.average_execution_time_seconds || 0) <= 5 ? 'Fast' :
                       (metrics?.average_execution_time_seconds || 0) <= 15 ? 'Moderate' : 'Slow'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Performance Rating
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QualityMetrics;