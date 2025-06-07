import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  Card,
  CardContent,
  CardActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Code as CodeIcon,
  Play as PlayIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface AnalysisMethod {
  id: string;
  name: string;
  description: string;
  code_template?: string;
}

interface CodeTemplate {
  template: string;
  parameters: TemplateParameter[];
  description: string;
  example_usage: string;
}

interface TemplateParameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description: string;
  validation?: string;
}

interface CodeTemplateEditorProps {
  open: boolean;
  onClose: () => void;
  method: AnalysisMethod;
  onSave: (updatedTemplate: any) => void;
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
      id={`code-template-tabpanel-${index}`}
      aria-labelledby={`code-template-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const programmingContexts = [
  { id: 'SAS', name: 'SAS', icon: '📊' },
  { id: 'R', name: 'R', icon: '📈' },
  { id: 'Python', name: 'Python', icon: '🐍' },
  { id: 'SQL', name: 'SQL', icon: '🗃️' }
];

const parameterTypes = [
  'string',
  'number',
  'boolean',
  'array',
  'object',
  'dataset',
  'variable',
  'expression'
];

const CodeTemplateEditor: React.FC<CodeTemplateEditorProps> = ({
  open,
  onClose,
  method,
  onSave
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedContext, setSelectedContext] = useState('SAS');
  const [codeTemplates, setCodeTemplates] = useState<{ [key: string]: CodeTemplate }>({});
  const [editingParameter, setEditingParameter] = useState<TemplateParameter | null>(null);
  const [parameterDialogOpen, setParameterDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewValues, setPreviewValues] = useState<{ [key: string]: any }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (open) {
      loadCodeTemplates();
    }
  }, [open, method]);

  const loadCodeTemplates = async () => {
    try {
      if (method.code_template) {
        const templates = JSON.parse(method.code_template);
        setCodeTemplates(templates);
      } else {
        // Initialize with empty templates for each context
        const initialTemplates: { [key: string]: CodeTemplate } = {};
        programmingContexts.forEach(context => {
          initialTemplates[context.id] = {
            template: '',
            parameters: [],
            description: '',
            example_usage: ''
          };
        });
        setCodeTemplates(initialTemplates);
      }
    } catch (error) {
      console.error('Error parsing code templates:', error);
      setErrors({ load: 'Error loading code templates' });
    }
  };

  const updateCodeTemplate = (context: string, field: string, value: any) => {
    setCodeTemplates(prev => ({
      ...prev,
      [context]: {
        ...prev[context],
        [field]: value
      }
    }));
  };

  const addParameter = () => {
    setEditingParameter({
      name: '',
      type: 'string',
      required: false,
      description: ''
    });
    setParameterDialogOpen(true);
  };

  const editParameter = (parameter: TemplateParameter) => {
    setEditingParameter(parameter);
    setParameterDialogOpen(true);
  };

  const saveParameter = () => {
    if (!editingParameter) return;

    const currentTemplate = codeTemplates[selectedContext];
    if (!currentTemplate) return;

    const existingIndex = currentTemplate.parameters.findIndex(
      p => p.name === editingParameter.name
    );

    let updatedParameters;
    if (existingIndex >= 0) {
      // Update existing parameter
      updatedParameters = [...currentTemplate.parameters];
      updatedParameters[existingIndex] = editingParameter;
    } else {
      // Add new parameter
      updatedParameters = [...currentTemplate.parameters, editingParameter];
    }

    updateCodeTemplate(selectedContext, 'parameters', updatedParameters);
    setParameterDialogOpen(false);
    setEditingParameter(null);
  };

  const deleteParameter = (parameterName: string) => {
    const currentTemplate = codeTemplates[selectedContext];
    if (!currentTemplate) return;

    const updatedParameters = currentTemplate.parameters.filter(
      p => p.name !== parameterName
    );
    updateCodeTemplate(selectedContext, 'parameters', updatedParameters);
  };

  const generatePreview = () => {
    const currentTemplate = codeTemplates[selectedContext];
    if (!currentTemplate) return '';

    let preview = currentTemplate.template;
    
    // Replace parameter placeholders with preview values
    currentTemplate.parameters.forEach(param => {
      const value = previewValues[param.name] || param.default || `{{${param.name}}}`;
      const regex = new RegExp(`{{${param.name}}}`, 'g');
      preview = preview.replace(regex, value);
    });

    return preview;
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/v1/methods/${method.id}/code-template`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programming_context: selectedContext,
          template: codeTemplates[selectedContext]?.template || '',
          parameters: codeTemplates[selectedContext]?.parameters || [],
          description: codeTemplates[selectedContext]?.description || '',
          example_usage: codeTemplates[selectedContext]?.example_usage || ''
        }),
      });

      if (response.ok) {
        onSave(codeTemplates);
      } else {
        const errorData = await response.json();
        setErrors({ save: errorData.detail || 'Error saving code template' });
      }
    } catch (error) {
      setErrors({ save: 'Network error while saving code template' });
    }
  };

  const exportTemplate = () => {
    const dataStr = JSON.stringify(codeTemplates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${method.name}_code_templates.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentTemplate = codeTemplates[selectedContext];

  const renderTemplateEditor = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Template Description"
          value={currentTemplate?.description || ''}
          onChange={(e) => updateCodeTemplate(selectedContext, 'description', e.target.value)}
          multiline
          rows={2}
          placeholder="Describe what this code template does..."
        />
      </Grid>
      
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Code Template
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={15}
          value={currentTemplate?.template || ''}
          onChange={(e) => updateCodeTemplate(selectedContext, 'template', e.target.value)}
          placeholder={`Enter your ${selectedContext} code template here...\nUse {{parameter_name}} for parameter placeholders.`}
          sx={{ 
            fontFamily: 'monospace',
            '& .MuiInputBase-input': {
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }
          }}
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Example Usage"
          value={currentTemplate?.example_usage || ''}
          onChange={(e) => updateCodeTemplate(selectedContext, 'example_usage', e.target.value)}
          multiline
          rows={4}
          placeholder="Provide an example of how to use this template..."
          sx={{ 
            fontFamily: 'monospace',
            '& .MuiInputBase-input': {
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }
          }}
        />
      </Grid>
    </Grid>
  );

  const renderParameterManager = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Template Parameters</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={addParameter}
        >
          Add Parameter
        </Button>
      </Box>
      
      <List>
        {currentTemplate?.parameters.map((parameter, index) => (
          <Card key={parameter.name} sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box flexGrow={1}>
                  <Typography variant="h6" gutterBottom>
                    {parameter.name}
                    {parameter.required && (
                      <Chip size="small" label="Required" color="error" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {parameter.description}
                  </Typography>
                  
                  <Box display="flex" gap={1} mt={1}>
                    <Chip size="small" label={parameter.type} variant="outlined" />
                    {parameter.default !== undefined && (
                      <Chip
                        size="small"
                        label={`Default: ${parameter.default}`}
                        variant="outlined"
                        color="primary"
                      />
                    )}
                  </Box>
                </Box>
                
                <Box>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => editParameter(parameter)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => deleteParameter(parameter.name)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </List>
      
      {(!currentTemplate?.parameters || currentTemplate.parameters.length === 0) && (
        <Alert severity="info">
          No parameters defined. Parameters allow users to customize the generated code.
        </Alert>
      )}
    </Box>
  );

  const renderPreview = () => (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
        <Typography variant="h6">Template Preview</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={previewMode}
              onChange={(e) => setPreviewMode(e.target.checked)}
            />
          }
          label="Interactive Preview"
        />
      </Box>
      
      {previewMode && currentTemplate?.parameters && currentTemplate.parameters.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Parameter Values
            </Typography>
            <Grid container spacing={2}>
              {currentTemplate.parameters.map((param) => (
                <Grid item xs={12} sm={6} key={param.name}>
                  <TextField
                    fullWidth
                    size="small"
                    label={param.name}
                    value={previewValues[param.name] || param.default || ''}
                    onChange={(e) => setPreviewValues({
                      ...previewValues,
                      [param.name]: e.target.value
                    })}
                    placeholder={param.description}
                    helperText={`Type: ${param.type}${param.required ? ' (Required)' : ''}`}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Generated Code
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
              maxHeight: '400px',
              whiteSpace: 'pre-wrap'
            }}
          >
            {generatePreview()}
          </Box>
        </CardContent>
        
        <CardActions>
          <Button
            startIcon={<CopyIcon />}
            onClick={() => navigator.clipboard.writeText(generatePreview())}
          >
            Copy Code
          </Button>
          
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => {
              const blob = new Blob([generatePreview()], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${method.name}_${selectedContext}.${selectedContext.toLowerCase()}`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download
          </Button>
        </CardActions>
      </Card>
    </Box>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Code Template Editor - {method.name}
            </Typography>
            
            <Box display="flex" gap={1}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Context</InputLabel>
                <Select
                  value={selectedContext}
                  label="Context"
                  onChange={(e) => setSelectedContext(e.target.value)}
                >
                  {programmingContexts.map(context => (
                    <MenuItem key={context.id} value={context.id}>
                      {context.icon} {context.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button
                startIcon={<DownloadIcon />}
                onClick={exportTemplate}
                variant="outlined"
                size="small"
              >
                Export
              </Button>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
              <Tab label="Template" />
              <Tab label="Parameters" />
              <Tab label="Preview" />
            </Tabs>
          </Box>
          
          <TabPanel value={selectedTab} index={0}>
            {renderTemplateEditor()}
          </TabPanel>
          
          <TabPanel value={selectedTab} index={1}>
            {renderParameterManager()}
          </TabPanel>
          
          <TabPanel value={selectedTab} index={2}>
            {renderPreview()}
          </TabPanel>
          
          {errors.save && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errors.save}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Parameter Dialog */}
      <Dialog
        open={parameterDialogOpen}
        onClose={() => setParameterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingParameter?.name ? 'Edit Parameter' : 'Add Parameter'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parameter Name"
                value={editingParameter?.name || ''}
                onChange={(e) => setEditingParameter(prev => 
                  prev ? { ...prev, name: e.target.value } : null
                )}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={editingParameter?.type || 'string'}
                  label="Type"
                  onChange={(e) => setEditingParameter(prev => 
                    prev ? { ...prev, type: e.target.value } : null
                  )}
                >
                  {parameterTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={editingParameter?.description || ''}
                onChange={(e) => setEditingParameter(prev => 
                  prev ? { ...prev, description: e.target.value } : null
                )}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Default Value"
                value={editingParameter?.default || ''}
                onChange={(e) => setEditingParameter(prev => 
                  prev ? { ...prev, default: e.target.value } : null
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingParameter?.required || false}
                    onChange={(e) => setEditingParameter(prev => 
                      prev ? { ...prev, required: e.target.checked } : null
                    )}
                  />
                }
                label="Required"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setParameterDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={saveParameter}
            variant="contained"
            disabled={!editingParameter?.name || !editingParameter?.type}
          >
            Save Parameter
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CodeTemplateEditor;