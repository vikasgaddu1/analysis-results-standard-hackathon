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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Code as CodeIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

interface AnalysisMethod {
  id: string;
  name: string;
  description: string;
}

interface MethodParameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description: string;
  validation?: string;
  programming_context?: string;
  category?: string;
}

interface ParameterManagerProps {
  open: boolean;
  onClose: () => void;
  method: AnalysisMethod;
  onSave: (parameters: MethodParameter[]) => void;
}

const parameterTypes = [
  { id: 'string', name: 'Text', description: 'String value' },
  { id: 'number', name: 'Number', description: 'Numeric value' },
  { id: 'boolean', name: 'Boolean', description: 'True/false value' },
  { id: 'array', name: 'List', description: 'Array of values' },
  { id: 'dataset', name: 'Dataset', description: 'Dataset name' },
  { id: 'variable', name: 'Variable', description: 'Variable name' },
  { id: 'expression', name: 'Expression', description: 'Code expression' },
  { id: 'file', name: 'File Path', description: 'File or directory path' },
  { id: 'date', name: 'Date', description: 'Date value' },
  { id: 'enum', name: 'Selection', description: 'Predefined options' }
];

const parameterCategories = [
  { id: 'input', name: 'Input Data', description: 'Data source parameters' },
  { id: 'analysis', name: 'Analysis Settings', description: 'Analysis configuration' },
  { id: 'output', name: 'Output Settings', description: 'Output configuration' },
  { id: 'display', name: 'Display Options', description: 'Presentation options' },
  { id: 'advanced', name: 'Advanced', description: 'Advanced settings' }
];

const programmingContexts = ['SAS', 'R', 'Python', 'SQL', 'All'];

const ParameterManager: React.FC<ParameterManagerProps> = ({
  open,
  onClose,
  method,
  onSave
}) => {
  const [parameters, setParameters] = useState<MethodParameter[]>([]);
  const [editingParameter, setEditingParameter] = useState<MethodParameter | null>(null);
  const [parameterDialogOpen, setParameterDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterContext, setFilterContext] = useState<string>('');
  const [expandedAccordions, setExpandedAccordions] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (open) {
      loadParameters();
    }
  }, [open, method]);

  const loadParameters = async () => {
    try {
      const response = await fetch(`/api/v1/methods/${method.id}/parameters`);
      const data = await response.json();
      setParameters(data || []);
    } catch (error) {
      console.error('Error loading parameters:', error);
      setErrors({ load: 'Error loading method parameters' });
    }
  };

  const validateParameter = (parameter: MethodParameter): string[] => {
    const errors: string[] = [];
    
    if (!parameter.name.trim()) {
      errors.push('Parameter name is required');
    }
    
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(parameter.name)) {
      errors.push('Parameter name must be a valid identifier');
    }
    
    if (parameters.some(p => p.name === parameter.name && p !== editingParameter)) {
      errors.push('Parameter name must be unique');
    }
    
    if (!parameter.description.trim()) {
      errors.push('Parameter description is required');
    }
    
    return errors;
  };

  const addParameter = () => {
    setEditingParameter({
      name: '',
      type: 'string',
      required: false,
      description: '',
      programming_context: 'All',
      category: 'input'
    });
    setParameterDialogOpen(true);
  };

  const editParameter = (parameter: MethodParameter) => {
    setEditingParameter({ ...parameter });
    setParameterDialogOpen(true);
  };

  const saveParameter = () => {
    if (!editingParameter) return;
    
    const validationErrors = validateParameter(editingParameter);
    if (validationErrors.length > 0) {
      setErrors({ parameter: validationErrors.join(', ') });
      return;
    }
    
    const existingIndex = parameters.findIndex(p => p.name === editingParameter.name);
    
    let updatedParameters;
    if (existingIndex >= 0 && parameters[existingIndex] !== editingParameter) {
      // Update existing parameter
      updatedParameters = [...parameters];
      updatedParameters[existingIndex] = editingParameter;
    } else if (existingIndex < 0) {
      // Add new parameter
      updatedParameters = [...parameters, editingParameter];
    } else {
      updatedParameters = parameters;
    }
    
    setParameters(updatedParameters);
    setParameterDialogOpen(false);
    setEditingParameter(null);
    setErrors({});
  };

  const deleteParameter = (parameterName: string) => {
    setParameters(parameters.filter(p => p.name !== parameterName));
  };

  const duplicateParameter = (parameter: MethodParameter) => {
    const newParameter = {
      ...parameter,
      name: `${parameter.name}_copy`,
      description: `${parameter.description} (Copy)`
    };
    setParameters([...parameters, newParameter]);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/v1/methods/${method.id}/parameters`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parameters),
      });

      if (response.ok) {
        onSave(parameters);
      } else {
        const errorData = await response.json();
        setErrors({ save: errorData.detail || 'Error saving parameters' });
      }
    } catch (error) {
      setErrors({ save: 'Network error while saving parameters' });
    }
  };

  const toggleAccordion = (category: string) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const filteredParameters = parameters.filter(parameter => {
    const matchesCategory = !filterCategory || parameter.category === filterCategory;
    const matchesContext = !filterContext || 
      parameter.programming_context === filterContext || 
      parameter.programming_context === 'All';
    
    return matchesCategory && matchesContext;
  });

  const groupedParameters = parameterCategories.reduce((groups, category) => {
    groups[category.id] = filteredParameters.filter(p => p.category === category.id);
    return groups;
  }, {} as { [key: string]: MethodParameter[] });

  const renderParameterCard = (parameter: MethodParameter) => (
    <Card key={parameter.name} sx={{ mb: 1 }}>
      <CardContent sx={{ pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="start">
          <Box flexGrow={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                {parameter.name}
              </Typography>
              
              {parameter.required && (
                <Chip size="small" label="Required" color="error" />
              )}
              
              <Chip
                size="small"
                label={parameterTypes.find(t => t.id === parameter.type)?.name || parameter.type}
                variant="outlined"
              />
              
              {parameter.programming_context && parameter.programming_context !== 'All' && (
                <Chip
                  size="small"
                  label={parameter.programming_context}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {parameter.description}
            </Typography>
            
            {parameter.default !== undefined && (
              <Typography variant="caption" color="text.secondary">
                Default: {JSON.stringify(parameter.default)}
              </Typography>
            )}
          </Box>
          
          <Box display="flex" gap={0.5}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => editParameter(parameter)}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Duplicate">
              <IconButton
                size="small"
                onClick={() => duplicateParameter(parameter)}
              >
                <CodeIcon />
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
  );

  const renderParameterDialog = () => (
    <Dialog
      open={parameterDialogOpen}
      onClose={() => setParameterDialogOpen(false)}
      maxWidth="md"
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
              helperText="Use valid identifier (letters, numbers, underscore)"
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
                  <MenuItem key={type.id} value={type.id}>
                    <Box>
                      <Typography variant="body2">{type.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Box>
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
              required
              helperText="Describe what this parameter controls"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={editingParameter?.category || 'input'}
                label="Category"
                onChange={(e) => setEditingParameter(prev => 
                  prev ? { ...prev, category: e.target.value } : null
                )}
              >
                {parameterCategories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    <Box>
                      <Typography variant="body2">{category.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {category.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Programming Context</InputLabel>
              <Select
                value={editingParameter?.programming_context || 'All'}
                label="Programming Context"
                onChange={(e) => setEditingParameter(prev => 
                  prev ? { ...prev, programming_context: e.target.value } : null
                )}
              >
                {programmingContexts.map(context => (
                  <MenuItem key={context} value={context}>
                    {context}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Default Value"
              value={editingParameter?.default || ''}
              onChange={(e) => setEditingParameter(prev => 
                prev ? { ...prev, default: e.target.value } : null
              )}
              helperText="Optional default value"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" height="100%">
              <FormControlLabel
                control={
                  <Switch
                    checked={editingParameter?.required || false}
                    onChange={(e) => setEditingParameter(prev => 
                      prev ? { ...prev, required: e.target.checked } : null
                    )}
                  />
                }
                label="Required Parameter"
              />
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Validation Pattern (Optional)"
              value={editingParameter?.validation || ''}
              onChange={(e) => setEditingParameter(prev => 
                prev ? { ...prev, validation: e.target.value } : null
              )}
              placeholder="Regular expression for validation"
              helperText="Use regex pattern to validate parameter values"
            />
          </Grid>
        </Grid>
        
        {errors.parameter && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errors.parameter}
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => setParameterDialogOpen(false)}>Cancel</Button>
        <Button
          onClick={saveParameter}
          variant="contained"
          disabled={!editingParameter?.name || !editingParameter?.description}
        >
          Save Parameter
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
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
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Parameter Manager - {method.name}
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addParameter}
            >
              Add Parameter
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {/* Filters */}
          <Box display="flex" gap={2} mb={3}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Filter by Category</InputLabel>
              <Select
                value={filterCategory}
                label="Filter by Category"
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {parameterCategories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Filter by Context</InputLabel>
              <Select
                value={filterContext}
                label="Filter by Context"
                onChange={(e) => setFilterContext(e.target.value)}
              >
                <MenuItem value="">All Contexts</MenuItem>
                {programmingContexts.map(context => (
                  <MenuItem key={context} value={context}>
                    {context}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box flexGrow={1} />
            
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              {filteredParameters.length} parameter(s)
            </Typography>
          </Box>
          
          {/* Parameter Groups */}
          {parameterCategories.map(category => {
            const categoryParameters = groupedParameters[category.id];
            
            if (categoryParameters.length === 0 && filterCategory && filterCategory !== category.id) {
              return null;
            }
            
            return (
              <Accordion
                key={category.id}
                expanded={expandedAccordions[category.id] ?? true}
                onChange={() => toggleAccordion(category.id)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6">{category.name}</Typography>
                    <Chip
                      size="small"
                      label={categoryParameters.length}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', mr: 2 }}>
                    {category.description}
                  </Typography>
                </AccordionSummary>
                
                <AccordionDetails>
                  {categoryParameters.length === 0 ? (
                    <Alert severity="info">
                      No parameters in this category. 
                      <Button onClick={addParameter} sx={{ ml: 1 }}>
                        Add one now
                      </Button>
                    </Alert>
                  ) : (
                    <Box>
                      {categoryParameters.map(renderParameterCard)}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
          
          {parameters.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No parameters defined for this method. Parameters allow users to customize 
              the method behavior and generated code.
            </Alert>
          )}
          
          {errors.save && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errors.save}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save Parameters
          </Button>
        </DialogActions>
      </Dialog>

      {renderParameterDialog()}
    </>
  );
};

export default ParameterManager;