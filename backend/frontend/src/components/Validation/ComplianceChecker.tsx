/**
 * Compliance checking interface component
 */

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PlayArrow as PlayArrowIcon,
  Clear as ClearIcon,
  Code as CodeIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useValidation, useValidationProfiles, useRealtimeValidation } from '../../hooks/useValidation';
import { ValidationResult } from '../../services/validationService';
import validationService from '../../services/validationService';

interface ComplianceCheckerProps {
  initialData?: any;
  initialObjectType?: string;
  onValidationComplete?: (results: ValidationResult[]) => void;
}

export const ComplianceChecker: React.FC<ComplianceCheckerProps> = ({
  initialData,
  initialObjectType = 'reporting_event',
  onValidationComplete,
}) => {
  const [inputData, setInputData] = useState(initialData ? JSON.stringify(initialData, null, 2) : '');
  const [objectType, setObjectType] = useState(initialObjectType);
  const [selectedProfile, setSelectedProfile] = useState('default');
  const [includeWarnings, setIncludeWarnings] = useState(true);
  const [includeInfo, setIncludeInfo] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const [jsonError, setJsonError] = useState('');

  const { validate, isValidating, validationProgress, cancelValidation } = useValidation();
  const { data: profiles } = useValidationProfiles();

  const objectTypes = [
    { value: 'reporting_event', label: 'Reporting Event' },
    { value: 'analysis', label: 'Analysis' },
    { value: 'method', label: 'Method' },
    { value: 'output', label: 'Output' },
    { value: 'where_clause', label: 'Where Clause' },
    { value: 'analysis_set', label: 'Analysis Set' },
    { value: 'group', label: 'Group' },
    { value: 'data_subset', label: 'Data Subset' },
  ];

  const handleValidate = useCallback(async () => {
    try {
      // Parse JSON data
      let parsedData;
      try {
        parsedData = JSON.parse(inputData);
        setJsonError('');
      } catch (e) {
        setJsonError('Invalid JSON format');
        return;
      }

      // Perform validation
      const response = await validate({
        data: parsedData,
        object_type: objectType,
        profile: selectedProfile,
        include_warnings: includeWarnings,
        include_info: includeInfo,
      });

      if (response) {
        setValidationResults(response.results);
        onValidationComplete?.(response.results);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  }, [inputData, objectType, selectedProfile, includeWarnings, includeInfo, validate, onValidationComplete]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          // Try to parse and pretty-print JSON
          const parsed = JSON.parse(content);
          setInputData(JSON.stringify(parsed, null, 2));
          setJsonError('');
        } catch (error) {
          // If not JSON, just use raw content
          setInputData(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = () => {
    setInputData('');
    setValidationResults([]);
    setJsonError('');
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon sx={{ color: '#f56565' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: '#ed8936' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: '#ecc94b' }} />;
      case 'info':
        return <InfoIcon sx={{ color: '#4299e1' }} />;
      default:
        return <CheckCircleIcon sx={{ color: '#48bb78' }} />;
    }
  };

  const groupedResults = validationService.groupResultsByCategory(validationResults);
  const severityStats = validationService.groupResultsBySeverity(validationResults);

  const renderValidationResults = () => {
    if (validationResults.length === 0) {
      return (
        <Alert severity="info">
          No validation results yet. Upload data and click "Validate" to check compliance.
        </Alert>
      );
    }

    const hasFailures = validationResults.some(r => r.is_failing);
    const overallStatus = hasFailures ? 'failed' : 'passed';

    return (
      <Box>
        {/* Results Summary */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Validation Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color={overallStatus === 'passed' ? 'success.main' : 'error.main'}>
                    {validationResults.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Checks
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="error.main">
                    {severityStats.critical?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Critical
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {severityStats.error?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Errors
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="info.main">
                    {severityStats.warning?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Warnings
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box mt={2}>
              <Alert severity={overallStatus === 'passed' ? 'success' : 'error'}>
                Validation {overallStatus === 'passed' ? 'passed' : 'failed'} - 
                {hasFailures ? ' Please review and fix the issues below' : ' All checks passed!'}
              </Alert>
            </Box>
          </CardContent>
        </Card>

        {/* Results by Category */}
        {Object.entries(groupedResults).map(([category, results]) => (
          <Accordion key={category} defaultExpanded={results.some(r => r.is_failing)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" width="100%">
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Typography>
                <Box display="flex" gap={1} mr={2}>
                  {['critical', 'error', 'warning', 'info'].map(severity => {
                    const count = results.filter(r => r.severity === severity).length;
                    if (count > 0) {
                      return (
                        <Chip
                          key={severity}
                          label={count}
                          size="small"
                          color={
                            severity === 'critical' || severity === 'error' ? 'error' :
                            severity === 'warning' ? 'warning' : 'info'
                          }
                        />
                      );
                    }
                    return null;
                  })}
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                {results.map((result) => (
                  <ListItem key={result.id} alignItems="flex-start">
                    <ListItemIcon>
                      {getSeverityIcon(result.severity)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body1" fontWeight="medium">
                            {result.rule_name}
                          </Typography>
                          <Chip label={result.severity} size="small" />
                        </Box>
                      }
                      secondary={
                        <Box mt={1}>
                          <Typography variant="body2" color="textSecondary">
                            {result.message}
                          </Typography>
                          {result.description && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {result.description}
                            </Typography>
                          )}
                          {result.field_path && (
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              Field: {result.field_path}
                            </Typography>
                          )}
                          {result.suggestions.length > 0 && (
                            <Box mt={1}>
                              <Typography variant="caption" fontWeight="medium">
                                Suggestions:
                              </Typography>
                              <List dense sx={{ pl: 2 }}>
                                {result.suggestions.map((suggestion, index) => (
                                  <ListItem key={index} sx={{ py: 0 }}>
                                    <Typography variant="caption">
                                      • {suggestion}
                                    </Typography>
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Compliance Checker
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Validate your data against ARS standards, regulatory requirements, and best practices.
      </Typography>

      <Grid container spacing={3}>
        {/* Input Panel */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Input
              </Typography>

              {/* Configuration */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Object Type</InputLabel>
                    <Select
                      value={objectType}
                      onChange={(e) => setObjectType(e.target.value)}
                      label="Object Type"
                    >
                      {objectTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Validation Profile</InputLabel>
                    <Select
                      value={selectedProfile}
                      onChange={(e) => setSelectedProfile(e.target.value)}
                      label="Validation Profile"
                    >
                      {profiles?.map((profile) => (
                        <MenuItem key={profile.name} value={profile.name}>
                          {profile.display_name || profile.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* File Upload */}
              <Box display="flex" gap={1} mb={2}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                >
                  Upload File
                  <input
                    type="file"
                    accept=".json,.yaml,.yml,.txt"
                    hidden
                    onChange={handleFileUpload}
                  />
                </Button>
                <Tooltip title="View as formatted JSON">
                  <IconButton 
                    size="small"
                    onClick={() => setShowJsonDialog(true)}
                    disabled={!inputData}
                  >
                    <CodeIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear data">
                  <IconButton 
                    size="small"
                    onClick={handleClearData}
                    disabled={!inputData}
                  >
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Data Input */}
              <TextField
                fullWidth
                multiline
                rows={12}
                variant="outlined"
                placeholder="Paste your JSON data here or upload a file..."
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                error={!!jsonError}
                helperText={jsonError}
                sx={{ fontFamily: 'monospace' }}
              />

              {/* Validation Controls */}
              <Box mt={2}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Button
                    variant="contained"
                    startIcon={isValidating ? <CancelIcon /> : <PlayArrowIcon />}
                    onClick={isValidating ? cancelValidation : handleValidate}
                    disabled={!inputData || !!jsonError}
                    color={isValidating ? "secondary" : "primary"}
                  >
                    {isValidating ? 'Cancel' : 'Validate'}
                  </Button>
                  
                  <FormControl size="small">
                    <Select
                      value={includeWarnings ? (includeInfo ? 'all' : 'warnings') : 'errors'}
                      onChange={(e) => {
                        const value = e.target.value;
                        setIncludeWarnings(value !== 'errors');
                        setIncludeInfo(value === 'all');
                      }}
                    >
                      <MenuItem value="errors">Errors Only</MenuItem>
                      <MenuItem value="warnings">Include Warnings</MenuItem>
                      <MenuItem value="all">Include All</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {isValidating && (
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Validation Progress: {validationProgress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={validationProgress} />
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Panel */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Validation Results
              </Typography>
              <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                {renderValidationResults()}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* JSON Viewer Dialog */}
      <Dialog 
        open={showJsonDialog} 
        onClose={() => setShowJsonDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>JSON Data Viewer</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={20}
            variant="outlined"
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            sx={{ fontFamily: 'monospace', fontSize: '12px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowJsonDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              try {
                const parsed = JSON.parse(inputData);
                setInputData(JSON.stringify(parsed, null, 2));
                setJsonError('');
              } catch (e) {
                setJsonError('Invalid JSON format');
              }
            }}
          >
            Format JSON
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplianceChecker;