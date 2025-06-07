import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Tooltip,
  IconButton,
  Tab,
  Tabs
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface AnalysisMethod {
  id: string;
  name: string;
  description: string;
  label?: string;
  reporting_event_id: string;
  code_template?: string;
  operations: Operation[];
  created_at: string;
  updated_at: string;
}

interface Operation {
  id: string;
  name: string;
  description?: string;
  order_num: number;
  result_pattern?: string;
  referenced_relationships?: OperationRelationship[];
}

interface OperationRelationship {
  id: string;
  referenced_operation_role: string;
  referenced_operation_id: string;
  description?: string;
}

interface MethodPreviewProps {
  open: boolean;
  onClose: () => void;
  method: AnalysisMethod;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`method-preview-tabpanel-${index}`}
      aria-labelledby={`method-preview-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MethodPreview: React.FC<MethodPreviewProps> = ({
  open,
  onClose,
  method
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [codeTemplates, setCodeTemplates] = useState<any>({});
  const [parameters, setParameters] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>({});
  const [validation, setValidation] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadMethodDetails();
    }
  }, [open, method]);

  const loadMethodDetails = async () => {
    setLoading(true);
    try {
      // Load code templates
      if (method.code_template) {
        setCodeTemplates(JSON.parse(method.code_template));
      }

      // Load parameters
      const paramsResponse = await fetch(`/api/v1/methods/${method.id}/parameters`);
      const paramsData = await paramsResponse.json();
      setParameters(paramsData || []);

      // Load usage statistics
      const statsResponse = await fetch(`/api/v1/methods/${method.id}/usage-statistics`);
      const statsData = await statsResponse.json();
      setUsageStats(statsData || {});

      // Load validation results
      const validationResponse = await fetch(`/api/v1/methods/${method.id}/validate`, {
        method: 'POST'
      });
      const validationData = await validationResponse.json();
      setValidation(validationData || {});

    } catch (error) {
      console.error('Error loading method details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* Basic Information */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Method Information
            </Typography>
            
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1">
                {method.name}
              </Typography>
            </Box>
            
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1">
                {method.description}
              </Typography>
            </Box>
            
            {method.label && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Label
                </Typography>
                <Typography variant="body1">
                  {method.label}
                </Typography>
              </Box>
            )}
            
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Reporting Event ID
              </Typography>
              <Typography variant="body1">
                {method.reporting_event_id}
              </Typography>
            </Box>
            
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label={`${method.operations?.length || 0} Operations`}
                icon={<TimelineIcon />}
                variant="outlined"
              />
              
              {Object.keys(codeTemplates).length > 0 && (
                <Chip
                  label={`${Object.keys(codeTemplates).length} Code Templates`}
                  icon={<CodeIcon />}
                  color="primary"
                  variant="outlined"
                />
              )}
              
              {parameters.length > 0 && (
                <Chip
                  label={`${parameters.length} Parameters`}
                  icon={<SettingsIcon />}
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Quick Stats */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            
            <Box display="flex" alignItems="center" mb={1}>
              {getStatusIcon(validation.validation_status)}
              <Typography variant="body2" sx={{ ml: 1 }}>
                Validation: {validation.validation_status || 'Unknown'}
              </Typography>
            </Box>
            
            {validation.score !== undefined && (
              <Box mb={1}>
                <Typography variant="body2">
                  Quality Score: {validation.score}/100
                </Typography>
              </Box>
            )}
            
            <Box mb={1}>
              <Typography variant="body2">
                Used in {usageStats.analyses_count || 0} analyses
              </Typography>
            </Box>
            
            <Box mb={1}>
              <Typography variant="body2">
                Created: {new Date(method.created_at).toLocaleDateString()}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2">
                Updated: {new Date(method.updated_at).toLocaleDateString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderOperations = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Operations ({method.operations?.length || 0})
      </Typography>
      
      {!method.operations || method.operations.length === 0 ? (
        <Alert severity="warning">
          No operations defined for this method.
        </Alert>
      ) : (
        <List>
          {method.operations
            .sort((a, b) => a.order_num - b.order_num)
            .map((operation, index) => (
              <Card key={operation.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Chip
                      size="small"
                      label={`#${operation.order_num}`}
                      variant="outlined"
                    />
                    <Typography variant="h6">
                      {operation.name}
                    </Typography>
                  </Box>
                  
                  {operation.description && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {operation.description}
                    </Typography>
                  )}
                  
                  {operation.result_pattern && (
                    <Box mt={1}>
                      <Chip
                        size="small"
                        label={`Result: ${operation.result_pattern}`}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  )}
                  
                  {operation.referenced_relationships && operation.referenced_relationships.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Relationships:
                      </Typography>
                      {operation.referenced_relationships.map((rel, relIndex) => (
                        <Chip
                          key={relIndex}
                          size="small"
                          label={`${rel.referenced_operation_role}: ${rel.referenced_operation_id}`}
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
        </List>
      )}
    </Box>
  );

  const renderCodeTemplates = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Code Templates
      </Typography>
      
      {Object.keys(codeTemplates).length === 0 ? (
        <Alert severity="info">
          No code templates defined for this method.
        </Alert>
      ) : (
        Object.entries(codeTemplates).map(([context, template]: [string, any]) => (
          <Accordion key={context} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <CodeIcon />
                <Typography variant="h6">{context}</Typography>
                {template.parameters && (
                  <Chip
                    size="small"
                    label={`${template.parameters.length} parameters`}
                    variant="outlined"
                  />
                )}
              </Box>
            </AccordionSummary>
            
            <AccordionDetails>
              {template.description && (
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Description:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>
                </Box>
              )}
              
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Template Code:
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    overflow: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    maxHeight: '300px'
                  }}
                >
                  {template.template}
                </Box>
                
                <Box mt={1} display="flex" gap={1}>
                  <Button
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={() => navigator.clipboard.writeText(template.template)}
                  >
                    Copy
                  </Button>
                  
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      const blob = new Blob([template.template], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${method.name}_${context}.${context.toLowerCase()}`;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download
                  </Button>
                </Box>
              </Box>
              
              {template.parameters && template.parameters.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Parameters:
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Required</TableCell>
                          <TableCell>Default</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {template.parameters.map((param: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{param.name}</TableCell>
                            <TableCell>{param.type}</TableCell>
                            <TableCell>
                              {param.required ? (
                                <CheckIcon color="error" fontSize="small" />
                              ) : (
                                '—'
                              )}
                            </TableCell>
                            <TableCell>{param.default || '—'}</TableCell>
                            <TableCell>{param.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
              
              {template.example_usage && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Example Usage:
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: 'grey.50',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}
                  >
                    {template.example_usage}
                  </Box>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );

  const renderValidation = () => (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            {getStatusIcon(validation.validation_status)}
            <Typography variant="h6">
              Validation Results
            </Typography>
            {validation.score !== undefined && (
              <Chip
                label={`Score: ${validation.score}/100`}
                color={getStatusColor(validation.validation_status) as any}
                variant="outlined"
              />
            )}
          </Box>
          
          {validation.issues && validation.issues.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom color="error">
                Issues:
              </Typography>
              <List dense>
                {validation.issues.map((issue: string, index: number) => (
                  <ListItem key={index}>
                    <ErrorIcon color="error" fontSize="small" sx={{ mr: 1 }} />
                    <ListItemText primary={issue} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {validation.warnings && validation.warnings.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom color="warning.main">
                Warnings:
              </Typography>
              <List dense>
                {validation.warnings.map((warning: string, index: number) => (
                  <ListItem key={index}>
                    <WarningIcon color="warning" fontSize="small" sx={{ mr: 1 }} />
                    <ListItemText primary={warning} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {validation.suggestions && validation.suggestions.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom color="info.main">
                Suggestions:
              </Typography>
              <List dense>
                {validation.suggestions.map((suggestion: string, index: number) => (
                  <ListItem key={index}>
                    <InfoIcon color="info" fontSize="small" sx={{ mr: 1 }} />
                    <ListItemText primary={suggestion} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {(!validation.issues || validation.issues.length === 0) &&
           (!validation.warnings || validation.warnings.length === 0) &&
           (!validation.suggestions || validation.suggestions.length === 0) && (
            <Alert severity="success">
              Method validation passed with no issues.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ViewIcon />
          <Typography variant="h6">
            Method Preview - {method.name}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
            <Tab label="Overview" />
            <Tab label="Operations" />
            <Tab label="Code Templates" />
            <Tab label="Validation" />
          </Tabs>
        </Box>
        
        <TabPanel value={selectedTab} index={0}>
          {renderOverview()}
        </TabPanel>
        
        <TabPanel value={selectedTab} index={1}>
          {renderOperations()}
        </TabPanel>
        
        <TabPanel value={selectedTab} index={2}>
          {renderCodeTemplates()}
        </TabPanel>
        
        <TabPanel value={selectedTab} index={3}>
          {renderValidation()}
        </TabPanel>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MethodPreview;