import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Visibility as ViewIcon,
  DataObject as DataIcon,
  Assessment as StatsIcon
} from '@mui/icons-material';

import { ValidationResults } from './ValidationResults';

interface PreviewComponentProps {
  data: any;
  validationResults?: any;
  fieldMappings?: any[];
  isExportPreview?: boolean;
}

export const PreviewComponent: React.FC<PreviewComponentProps> = ({
  data,
  validationResults,
  fieldMappings = [],
  isExportPreview = false
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | false>('structure');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const renderDataStructure = () => {
    if (!data?.structure) return null;

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Section</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Count/Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(data.structure).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {key}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={typeof value === 'string' ? 'Object' : 'Array'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{String(value)}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderSampleData = () => {
    if (!data?.sample_data) return null;

    return (
      <Box>
        {Object.entries(data.sample_data).map(([section, sectionData]) => (
          <Accordion
            key={section}
            expanded={expandedSection === section}
            onChange={handleAccordionChange(section)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DataIcon color="primary" />
                <Typography variant="subtitle1">{section}</Typography>
                {Array.isArray(sectionData) && (
                  <Chip label={`${sectionData.length} items`} size="small" />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {Array.isArray(sectionData) ? (
                sectionData.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {Object.keys(sectionData[0] || {}).map((key) => (
                            <TableCell key={key}>{key}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sectionData.slice(0, 5).map((item, index) => (
                          <TableRow key={index}>
                            {Object.values(item as Record<string, any>).map((value, cellIndex) => (
                              <TableCell key={cellIndex}>
                                <Typography variant="body2" noWrap>
                                  {String(value).substring(0, 50)}
                                  {String(value).length > 50 ? '...' : ''}
                                </Typography>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">No data available</Typography>
                )
              ) : (
                <pre style={{ 
                  fontSize: '12px', 
                  overflow: 'auto', 
                  backgroundColor: '#f5f5f5', 
                  padding: '16px',
                  borderRadius: '4px'
                }}>
                  {JSON.stringify(sectionData, null, 2)}
                </pre>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  const renderFieldMappings = () => {
    if (!fieldMappings || fieldMappings.length === 0) {
      return (
        <Alert severity="info">
          No field mappings configured. Data will be imported using original field names.
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Source Field</TableCell>
              <TableCell>Target Field</TableCell>
              <TableCell>Transform</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fieldMappings.map((mapping, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Typography variant="body2">{mapping.sourceField || '-'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {mapping.targetField || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={mapping.transformFunction || 'none'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {mapping.required ? (
                    <Chip
                      icon={<CheckIcon />}
                      label="Required"
                      size="small"
                      color="primary"
                    />
                  ) : (
                    <Chip
                      label="Optional"
                      size="small"
                      variant="outlined"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderExportPreview = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Configuration
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Format"
                    secondary={data.format?.toUpperCase() || 'Not specified'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Scope"
                    secondary={
                      data.reporting_event_id 
                        ? `Reporting Event: ${data.reporting_event_id}`
                        : data.analysis_ids 
                        ? `${data.analysis_ids.length} Analyses`
                        : 'Custom query'
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Include Metadata"
                    secondary={data.include_metadata ? 'Yes' : 'No'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Include Timestamps"
                    secondary={data.include_timestamps ? 'Yes' : 'No'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Export Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your export will include the selected data in {data.format?.toUpperCase()} format.
                The file will be generated and made available for download.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderMetadata = () => {
    if (!data?.metadata) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            File Metadata
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(data.metadata).map(([key, value]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Typography>
                  <Typography variant="body2">
                    {String(value)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  if (isExportPreview) {
    return (
      <Box sx={{ maxWidth: 1000, margin: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          Export Preview
        </Typography>
        {renderExportPreview()}
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Import Data Preview
      </Typography>

      {validationResults && (
        <Box sx={{ mb: 3 }}>
          <ValidationResults validationResults={validationResults} />
        </Box>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab 
            icon={<StatsIcon />} 
            label="Structure" 
            iconPosition="start"
          />
          <Tab 
            icon={<ViewIcon />} 
            label="Sample Data" 
            iconPosition="start"
          />
          {fieldMappings.length > 0 && (
            <Tab 
              icon={<DataIcon />} 
              label="Field Mappings" 
              iconPosition="start"
            />
          )}
          {data?.metadata && (
            <Tab 
              icon={<InfoIcon />} 
              label="Metadata" 
              iconPosition="start"
            />
          )}
        </Tabs>
      </Box>

      <Box>
        {selectedTab === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Data Structure
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Overview of the data structure in your import file.
              </Typography>
              {renderDataStructure()}
            </CardContent>
          </Card>
        )}

        {selectedTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sample Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Preview of the actual data that will be imported. Only the first few records are shown.
              </Typography>
              {renderSampleData()}
            </CardContent>
          </Card>
        )}

        {selectedTab === 2 && fieldMappings.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Field Mappings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                How your source fields will be mapped to target fields during import.
              </Typography>
              {renderFieldMappings()}
            </CardContent>
          </Card>
        )}

        {selectedTab === 3 && data?.metadata && (
          renderMetadata()
        )}
      </Box>
    </Box>
  );
};