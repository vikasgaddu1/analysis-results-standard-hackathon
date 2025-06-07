import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  CardActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DragIndicator as DragIcon,
  ArrowUpward as UpIcon,
  ArrowDownward as DownIcon,
  Code as CodeIcon,
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

interface MethodEditorProps {
  open: boolean;
  onClose: () => void;
  method?: AnalysisMethod | null;
  onSave: (method: AnalysisMethod) => void;
}

const steps = [
  'Basic Information',
  'Operations',
  'Relationships',
  'Code Template',
  'Review'
];

const MethodEditor: React.FC<MethodEditorProps> = ({ open, onClose, method, onSave }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<Partial<AnalysisMethod>>({
    name: '',
    description: '',
    label: '',
    reporting_event_id: '',
    operations: []
  });
  const [operations, setOperations] = useState<Operation[]>([]);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [reportingEvents, setReportingEvents] = useState<any[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (method) {
      setFormData({
        id: method.id,
        name: method.name,
        description: method.description,
        label: method.label,
        reporting_event_id: method.reporting_event_id,
        code_template: method.code_template
      });
      setOperations(method.operations || []);
    } else {
      // Reset for new method
      setFormData({
        name: '',
        description: '',
        label: '',
        reporting_event_id: '',
        operations: []
      });
      setOperations([]);
    }
  }, [method, open]);

  useEffect(() => {
    if (open) {
      loadReportingEvents();
    }
  }, [open]);

  const loadReportingEvents = async () => {
    try {
      const response = await fetch('/api/v1/reporting-events');
      const data = await response.json();
      setReportingEvents(data.data || []);
    } catch (error) {
      console.error('Error loading reporting events:', error);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};

    switch (step) {
      case 0: // Basic Information
        if (!formData.name?.trim()) {
          newErrors.name = 'Method name is required';
        }
        if (!formData.description?.trim()) {
          newErrors.description = 'Description is required';
        }
        if (!formData.reporting_event_id) {
          newErrors.reporting_event_id = 'Reporting event is required';
        }
        break;
      
      case 1: // Operations
        if (operations.length === 0) {
          newErrors.operations = 'At least one operation is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSave = async () => {
    if (!validateStep(activeStep)) return;

    try {
      const methodData = {
        ...formData,
        operations: operations.map((op, index) => ({
          ...op,
          order_num: index + 1
        }))
      };

      const url = method ? `/api/v1/methods/${method.id}` : '/api/v1/methods';
      const response = await fetch(url, {
        method: method ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(methodData),
      });

      if (response.ok) {
        const savedMethod = await response.json();
        onSave(savedMethod);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.detail || 'Error saving method' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error while saving method' });
    }
  };

  const addOperation = () => {
    setEditingOperation({
      id: `op_${Date.now()}`,
      name: '',
      description: '',
      order_num: operations.length + 1,
      result_pattern: ''
    });
    setOperationDialogOpen(true);
  };

  const editOperation = (operation: Operation) => {
    setEditingOperation(operation);
    setOperationDialogOpen(true);
  };

  const saveOperation = (operation: Operation) => {
    if (operations.find(op => op.id === operation.id)) {
      // Update existing
      setOperations(operations.map(op => op.id === operation.id ? operation : op));
    } else {
      // Add new
      setOperations([...operations, operation]);
    }
    setOperationDialogOpen(false);
    setEditingOperation(null);
  };

  const deleteOperation = (operationId: string) => {
    setOperations(operations.filter(op => op.id !== operationId));
  };

  const moveOperation = (index: number, direction: 'up' | 'down') => {
    const newOperations = [...operations];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newOperations.length) {
      [newOperations[index], newOperations[targetIndex]] = 
      [newOperations[targetIndex], newOperations[index]];
      setOperations(newOperations);
    }
  };

  const renderBasicInformation = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Method Name"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={!!errors.name}
          helperText={errors.name}
          required
        />
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          multiline
          rows={3}
          error={!!errors.description}
          helperText={errors.description}
          required
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Label (Optional)"
          value={formData.label || ''}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
        />
      </Grid>
      
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.reporting_event_id} required>
          <InputLabel>Reporting Event</InputLabel>
          <Select
            value={formData.reporting_event_id || ''}
            label="Reporting Event"
            onChange={(e) => setFormData({ ...formData, reporting_event_id: e.target.value })}
          >
            {reportingEvents.map((event) => (
              <MenuItem key={event.id} value={event.id}>
                {event.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderOperations = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Operations</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={addOperation}
        >
          Add Operation
        </Button>
      </Box>
      
      {errors.operations && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.operations}
        </Alert>
      )}
      
      <List>
        {operations.map((operation, index) => (
          <Card key={operation.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <DragIcon color="disabled" />
                  <Typography variant="h6">
                    {index + 1}. {operation.name}
                  </Typography>
                </Box>
                
                <Box>
                  <Tooltip title="Move Up">
                    <IconButton
                      size="small"
                      onClick={() => moveOperation(index, 'up')}
                      disabled={index === 0}
                    >
                      <UpIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Move Down">
                    <IconButton
                      size="small"
                      onClick={() => moveOperation(index, 'down')}
                      disabled={index === operations.length - 1}
                    >
                      <DownIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => editOperation(operation)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => deleteOperation(operation.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              {operation.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {operation.description}
                </Typography>
              )}
              
              {operation.result_pattern && (
                <Chip
                  size="small"
                  label={`Result: ${operation.result_pattern}`}
                  variant="outlined"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </List>
    </Box>
  );

  const renderReview = () => (
    <Box>
      <Typography variant="h6" gutterBottom>Review Method</Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Basic Information</Typography>
          <Typography><strong>Name:</strong> {formData.name}</Typography>
          <Typography><strong>Description:</strong> {formData.description}</Typography>
          {formData.label && <Typography><strong>Label:</strong> {formData.label}</Typography>}
        </CardContent>
      </Card>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Operations ({operations.length})
          </Typography>
          {operations.map((operation, index) => (
            <Box key={operation.id} sx={{ mb: 1, pl: 2, borderLeft: '2px solid #e0e0e0' }}>
              <Typography variant="body2">
                <strong>{index + 1}. {operation.name}</strong>
              </Typography>
              {operation.description && (
                <Typography variant="caption" color="text.secondary">
                  {operation.description}
                </Typography>
              )}
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          {method ? 'Edit Method' : 'Create New Method'}
        </DialogTitle>
        
        <DialogContent dividers>
          <Stepper activeStep={activeStep} orientation="vertical">
            <Step>
              <StepLabel>Basic Information</StepLabel>
              <StepContent>
                {renderBasicInformation()}
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Continue
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Operations</StepLabel>
              <StepContent>
                {renderOperations()}
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Continue
                  </Button>
                  <Button
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Relationships</StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Operation relationships will be configured in a future update.
                </Typography>
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Continue
                  </Button>
                  <Button
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Code Template</StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Code templates can be configured after creating the method.
                </Typography>
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Continue
                  </Button>
                  <Button
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Review</StepLabel>
              <StepContent>
                {renderReview()}
                <Box sx={{ mb: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    {method ? 'Update Method' : 'Create Method'}
                  </Button>
                  <Button
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
          
          {errors.submit && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errors.submit}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Operation Dialog */}
      <Dialog
        open={operationDialogOpen}
        onClose={() => setOperationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingOperation?.name ? 'Edit Operation' : 'Add Operation'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Operation Name"
                value={editingOperation?.name || ''}
                onChange={(e) => setEditingOperation(prev => 
                  prev ? { ...prev, name: e.target.value } : null
                )}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={editingOperation?.description || ''}
                onChange={(e) => setEditingOperation(prev => 
                  prev ? { ...prev, description: e.target.value } : null
                )}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Result Pattern"
                value={editingOperation?.result_pattern || ''}
                onChange={(e) => setEditingOperation(prev => 
                  prev ? { ...prev, result_pattern: e.target.value } : null
                )}
                placeholder="e.g., N, Mean, P_Value"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOperationDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => editingOperation && saveOperation(editingOperation)}
            variant="contained"
            disabled={!editingOperation?.name}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MethodEditor;