import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Autocomplete,
  Chip,
  Switch,
  FormGroup,
  Card,
  CardContent,
  Grid,
  Alert,
  Divider
} from '@mui/material';
import {
  Article as DocumentIcon,
  Analytics as AnalysisIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface ExportDialogProps {
  onConfigChange: (config: any) => void;
  config: any;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  onConfigChange,
  config
}) => {
  const [exportScope, setExportScope] = useState<'reporting_event' | 'analyses' | 'custom'>('reporting_event');
  const [selectedReportingEvent, setSelectedReportingEvent] = useState<any>(null);
  const [selectedAnalyses, setSelectedAnalyses] = useState<any[]>([]);
  const [exportOptions, setExportOptions] = useState({
    include_metadata: true,
    include_timestamps: true,
    flatten_nested: false
  });

  // Mock data - replace with actual API calls
  const [reportingEvents] = useState([
    { id: 'RE001', name: 'Safety Analysis Report', description: 'Primary safety analysis' },
    { id: 'RE002', name: 'Efficacy Analysis Report', description: 'Primary efficacy analysis' },
    { id: 'RE003', name: 'Interim Analysis Report', description: 'Interim safety and efficacy' }
  ]);

  const [analyses] = useState([
    { id: 'ANA001', name: 'Demographics Analysis', reporting_event_id: 'RE001' },
    { id: 'ANA002', name: 'Adverse Events Analysis', reporting_event_id: 'RE001' },
    { id: 'ANA003', name: 'Primary Endpoint Analysis', reporting_event_id: 'RE002' },
    { id: 'ANA004', name: 'Secondary Endpoint Analysis', reporting_event_id: 'RE002' }
  ]);

  const updateConfig = useCallback(() => {
    const newConfig = {
      ...config,
      ...exportOptions
    };

    if (exportScope === 'reporting_event' && selectedReportingEvent) {
      newConfig.reporting_event_id = selectedReportingEvent.id;
      delete newConfig.analysis_ids;
    } else if (exportScope === 'analyses' && selectedAnalyses.length > 0) {
      newConfig.analysis_ids = selectedAnalyses.map(a => a.id);
      delete newConfig.reporting_event_id;
    }

    onConfigChange(newConfig);
  }, [config, exportScope, selectedReportingEvent, selectedAnalyses, exportOptions, onConfigChange]);

  useEffect(() => {
    updateConfig();
  }, [updateConfig]);

  const handleScopeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newScope = event.target.value as 'reporting_event' | 'analyses' | 'custom';
    setExportScope(newScope);
    
    // Clear selections when changing scope
    if (newScope !== 'reporting_event') {
      setSelectedReportingEvent(null);
    }
    if (newScope !== 'analyses') {
      setSelectedAnalyses([]);
    }
  };

  const handleOptionChange = (option: string, value: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const getAvailableAnalyses = () => {
    if (exportScope === 'reporting_event' && selectedReportingEvent) {
      return analyses.filter(a => a.reporting_event_id === selectedReportingEvent.id);
    }
    return analyses;
  };

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Select Data to Export
      </Typography>

      <Grid container spacing={3}>
        {/* Export Scope Selection */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <FormControl component="fieldset">
                <FormLabel component="legend">Export Scope</FormLabel>
                <RadioGroup
                  value={exportScope}
                  onChange={handleScopeChange}
                  sx={{ mt: 1 }}
                >
                  <FormControlLabel
                    value="reporting_event"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DocumentIcon color="primary" />
                        <Box>
                          <Typography variant="body1">Complete Reporting Event</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Export an entire reporting event with all related analyses
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="analyses"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AnalysisIcon color="primary" />
                        <Box>
                          <Typography variant="body1">Specific Analyses</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Export selected individual analyses
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="custom"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SettingsIcon color="primary" />
                        <Box>
                          <Typography variant="body1">Custom Query</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Export based on custom filters and criteria
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Reporting Event Selection */}
        {exportScope === 'reporting_event' && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select Reporting Event
                </Typography>
                <Autocomplete
                  options={reportingEvents}
                  getOptionLabel={(option) => `${option.name} (${option.id})`}
                  value={selectedReportingEvent}
                  onChange={(event, newValue) => setSelectedReportingEvent(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Reporting Event"
                      placeholder="Search and select a reporting event..."
                      fullWidth
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.id} - {option.description}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
                
                {selectedReportingEvent && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    This will export the reporting event "{selectedReportingEvent.name}" 
                    along with {getAvailableAnalyses().length} related analyses.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Analyses Selection */}
        {exportScope === 'analyses' && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select Analyses
                </Typography>
                <Autocomplete
                  multiple
                  options={analyses}
                  getOptionLabel={(option) => `${option.name} (${option.id})`}
                  value={selectedAnalyses}
                  onChange={(event, newValue) => setSelectedAnalyses(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Analyses"
                      placeholder="Search and select analyses..."
                      fullWidth
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={option.name}
                        {...getTagProps({ index })}
                        key={option.id}
                      />
                    ))
                  }
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.id} - Reporting Event: {option.reporting_event_id}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
                
                {selectedAnalyses.length > 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {selectedAnalyses.length} analysis{selectedAnalyses.length !== 1 ? 'es' : ''} selected for export.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Custom Query */}
        {exportScope === 'custom' && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Custom Export Criteria
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Custom query functionality is coming soon. Please use one of the other export options.
                </Alert>
                <TextField
                  label="Custom Query"
                  placeholder="Enter custom query parameters..."
                  multiline
                  rows={4}
                  fullWidth
                  disabled
                />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Export Options */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Options
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.include_metadata}
                      onChange={(e) => handleOptionChange('include_metadata', e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Include Metadata</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Include export timestamp, version info, and other metadata
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.include_timestamps}
                      onChange={(e) => handleOptionChange('include_timestamps', e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Include Timestamps</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Include created/updated timestamps for all records
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={exportOptions.flatten_nested}
                      onChange={(e) => handleOptionChange('flatten_nested', e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Flatten Nested Structures</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Flatten nested objects for easier processing (Excel format only)
                      </Typography>
                    </Box>
                  }
                />
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};