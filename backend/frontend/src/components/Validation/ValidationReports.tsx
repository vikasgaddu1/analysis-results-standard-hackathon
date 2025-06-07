/**
 * Detailed validation reports component
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DatePicker,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useValidationSessions, useValidationResultsFilter } from '../../hooks/useValidation';
import { ValidationSession } from '../../services/validationService';
import validationService from '../../services/validationService';

export const ValidationReports: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedSession, setSelectedSession] = useState<ValidationSession | null>(null);
  const [filters, setFilters] = useState({
    objectType: '',
    status: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: sessions = [], isLoading } = useValidationSessions({
    limit: 1000, // Get all sessions for filtering
  });

  // Filter sessions based on criteria
  const filteredSessions = sessions.filter(session => {
    if (filters.objectType && session.object_type !== filters.objectType) return false;
    if (filters.status && session.summary.overall_status !== filters.status) return false;
    if (filters.startDate && new Date(session.started_at) < filters.startDate) return false;
    if (filters.endDate && new Date(session.started_at) > filters.endDate) return false;
    return true;
  });

  // Paginate filtered sessions
  const paginatedSessions = filteredSessions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleSessionView = (session: ValidationSession) => {
    setSelectedSession(session);
  };

  const handleExportSession = (session: ValidationSession) => {
    validationService.exportSessionToJSON(session);
  };

  const handleExportAllSessions = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      filters,
      totalSessions: filteredSessions.length,
      sessions: filteredSessions,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `validation_reports_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      objectType: '',
      status: '',
      startDate: null,
      endDate: null,
    });
  };

  const getStatusColor = (status: string) => {
    return validationService.getStatusColor(status);
  };

  const renderSessionDetails = () => {
    if (!selectedSession) return null;

    const { filteredResults, filters: resultFilters, updateFilter } = useValidationResultsFilter(
      selectedSession.results
    );

    return (
      <Dialog
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Validation Session Details - {selectedSession.id}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Session Summary */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Session Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Object Type
                      </Typography>
                      <Typography variant="body1">
                        {selectedSession.object_type}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Profile
                      </Typography>
                      <Typography variant="body1">
                        {selectedSession.profile_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Status
                      </Typography>
                      <Chip
                        label={selectedSession.summary.overall_status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(selectedSession.summary.overall_status),
                          color: 'white',
                        }}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Compliance Score
                      </Typography>
                      <Typography variant="body1">
                        {selectedSession.summary.compliance_score.toFixed(1)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Total Checks
                      </Typography>
                      <Typography variant="body1">
                        {selectedSession.summary.total_checks}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Failed Checks
                      </Typography>
                      <Typography variant="body1" color="error.main">
                        {selectedSession.summary.failed_checks}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Execution Time
                      </Typography>
                      <Typography variant="body1">
                        {selectedSession.execution_time_seconds?.toFixed(2)}s
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">
                        Started
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedSession.started_at).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Results Table */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      Validation Results ({filteredResults.length})
                    </Typography>
                    <Box display="flex" gap={1}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Severity</InputLabel>
                        <Select
                          multiple
                          value={resultFilters.severity}
                          onChange={(e) => updateFilter('severity', e.target.value)}
                          label="Severity"
                        >
                          <MenuItem value="critical">Critical</MenuItem>
                          <MenuItem value="error">Error</MenuItem>
                          <MenuItem value="warning">Warning</MenuItem>
                          <MenuItem value="info">Info</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        placeholder="Search..."
                        value={resultFilters.searchTerm}
                        onChange={(e) => updateFilter('searchTerm', e.target.value)}
                      />
                    </Box>
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Severity</TableCell>
                          <TableCell>Rule</TableCell>
                          <TableCell>Message</TableCell>
                          <TableCell>Field</TableCell>
                          <TableCell>Category</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredResults.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>
                              <Chip
                                label={result.severity}
                                size="small"
                                color={
                                  result.severity === 'critical' || result.severity === 'error' ? 'error' :
                                  result.severity === 'warning' ? 'warning' : 'info'
                                }
                              />
                            </TableCell>
                            <TableCell>{result.rule_name}</TableCell>
                            <TableCell>{result.message}</TableCell>
                            <TableCell>{result.field_path || '-'}</TableCell>
                            <TableCell>{result.category}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedSession(null)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleExportSession(selectedSession)}
          >
            Export Session
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <Typography>Loading validation reports...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Validation Reports
          </Typography>
          <Typography variant="body1" color="textSecondary">
            View detailed validation session reports and analysis results
          </Typography>
        </Box>
        
        <Box display="flex" gap={1}>
          <Tooltip title="Toggle Filters">
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportAllSessions}
          >
            Export All
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Object Type</InputLabel>
                  <Select
                    value={filters.objectType}
                    onChange={(e) => setFilters(prev => ({ ...prev, objectType: e.target.value }))}
                    label="Object Type"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="reporting_event">Reporting Event</MenuItem>
                    <MenuItem value="analysis">Analysis</MenuItem>
                    <MenuItem value="method">Method</MenuItem>
                    <MenuItem value="output">Output</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="excellent">Excellent</MenuItem>
                    <MenuItem value="good">Good</MenuItem>
                    <MenuItem value="acceptable">Acceptable</MenuItem>
                    <MenuItem value="needs_improvement">Needs Improvement</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  size="small"
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Sessions Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Object Type</TableCell>
                  <TableCell>Object ID</TableCell>
                  <TableCell>Profile</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Compliance Score</TableCell>
                  <TableCell>Checks</TableCell>
                  <TableCell>Failed</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSessions.map((session) => (
                  <TableRow key={session.id} hover>
                    <TableCell>
                      {new Date(session.started_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{session.object_type}</TableCell>
                    <TableCell>{session.object_id || '-'}</TableCell>
                    <TableCell>{session.profile_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={session.summary.overall_status}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(session.summary.overall_status),
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell>{session.summary.compliance_score.toFixed(1)}%</TableCell>
                    <TableCell>{session.summary.total_checks}</TableCell>
                    <TableCell>
                      <Typography color={session.summary.failed_checks > 0 ? 'error.main' : 'inherit'}>
                        {session.summary.failed_checks}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {session.execution_time_seconds?.toFixed(2)}s
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleSessionView(session)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Export Session">
                          <IconButton
                            size="small"
                            onClick={() => handleExportSession(session)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredSessions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>

      {renderSessionDetails()}
    </Box>
  );
};

export default ValidationReports;