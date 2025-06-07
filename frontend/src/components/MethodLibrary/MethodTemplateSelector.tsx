import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Collapse,
  IconButton,
  Tooltip,
  Alert,
  Skeleton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Code as CodeIcon,
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  Category as CategoryIcon,
  Info as InfoIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

interface MethodTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  operations: TemplateOperation[];
  code_templates: { [key: string]: CodeTemplate };
}

interface TemplateOperation {
  id: string;
  name: string;
  description?: string;
  order: number;
  result_pattern?: string;
}

interface CodeTemplate {
  template: string;
  parameters: TemplateParameter[];
  description?: string;
}

interface TemplateParameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description: string;
}

interface MethodTemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: MethodTemplate, customization: any) => void;
}

const categories = [
  { id: 'descriptive', name: 'Descriptive Statistics', icon: <AssessmentIcon /> },
  { id: 'inferential', name: 'Inferential Statistics', icon: <PsychologyIcon /> },
  { id: 'survival', name: 'Survival Analysis', icon: <TimelineIcon /> },
  { id: 'safety', name: 'Safety Analysis', icon: <CategoryIcon /> }
];

const MethodTemplateSelector: React.FC<MethodTemplateSelectorProps> = ({
  open,
  onClose,
  onSelect
}) => {
  const [templates, setTemplates] = useState<MethodTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MethodTemplate | null>(null);
  const [expandedTemplates, setExpandedTemplates] = useState<{ [key: string]: boolean }>({});
  const [viewingCode, setViewingCode] = useState<{ [key: string]: boolean }>({});
  const [customization, setCustomization] = useState<any>({});

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/methods/templates');
      const data = await response.json();
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const toggleExpanded = (templateId: string) => {
    setExpandedTemplates(prev => ({
      ...prev,
      [templateId]: !prev[templateId]
    }));
  };

  const toggleCodeView = (templateId: string) => {
    setViewingCode(prev => ({
      ...prev,
      [templateId]: !prev[templateId]
    }));
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(cat => cat.id === category);
    return categoryData ? categoryData.icon : <CategoryIcon />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'descriptive':
        return 'primary';
      case 'inferential':
        return 'secondary';
      case 'survival':
        return 'success';
      case 'safety':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleSelectTemplate = (template: MethodTemplate) => {
    setSelectedTemplate(template);
    // Initialize customization with default values
    const initialCustomization = {
      method_name: template.name,
      method_description: template.description,
      reporting_event_id: '',
      parameters: {}
    };
    
    // Set default parameter values
    Object.values(template.code_templates).forEach(codeTemplate => {
      codeTemplate.parameters.forEach(param => {
        if (param.default !== undefined) {
          initialCustomization.parameters[param.name] = param.default;
        }
      });
    });
    
    setCustomization(initialCustomization);
  };

  const handleCreateFromTemplate = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate, customization);
    }
  };

  const renderTemplateCard = (template: MethodTemplate) => (
    <Card key={template.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            {getCategoryIcon(template.category)}
            <Typography variant="h6">
              {template.name}
            </Typography>
          </Box>
          
          <Chip
            size="small"
            label={template.category}
            color={getCategoryColor(template.category) as any}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {template.description}
        </Typography>
        
        <Box display="flex" gap={1} mt={2}>
          <Chip
            size="small"
            label={`${template.operations.length} operations`}
            variant="outlined"
          />
          <Chip
            size="small"
            label={`${Object.keys(template.code_templates).length} code templates`}
            variant="outlined"
            icon={<CodeIcon />}
          />
        </Box>
      </CardContent>
      
      <CardActions>
        <Button
          size="small"
          onClick={() => toggleExpanded(template.id)}
          startIcon={expandedTemplates[template.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          {expandedTemplates[template.id] ? 'Show Less' : 'Show Details'}
        </Button>
        
        <Button
          size="small"
          onClick={() => toggleCodeView(template.id)}
          startIcon={<CodeIcon />}
        >
          View Code
        </Button>
        
        <Button
          variant="contained"
          size="small"
          onClick={() => handleSelectTemplate(template)}
        >
          Use Template
        </Button>
      </CardActions>
      
      <Collapse in={expandedTemplates[template.id]}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Operations:</Typography>
          <List dense>
            {template.operations.map((operation, index) => (
              <ListItem key={operation.id}>
                <ListItemText
                  primary={`${index + 1}. ${operation.name}`}
                  secondary={operation.description}
                />
                {operation.result_pattern && (
                  <Chip
                    size="small"
                    label={operation.result_pattern}
                    variant="outlined"
                  />
                )}
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Collapse>
      
      <Collapse in={viewingCode[template.id]}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Available Code Templates:</Typography>
          {Object.entries(template.code_templates).map(([context, codeTemplate]) => (
            <Box key={context} sx={{ mb: 2 }}>
              <Typography variant="subtitle3" gutterBottom>
                {context}:
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.8rem',
                  maxHeight: 200
                }}
              >
                {codeTemplate.template}
              </Box>
              
              {codeTemplate.parameters.length > 0 && (
                <Box mt={1}>
                  <Typography variant="caption" display="block" gutterBottom>
                    Parameters:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {codeTemplate.parameters.map(param => (
                      <Chip
                        key={param.name}
                        size="small"
                        label={`${param.name} (${param.type})`}
                        variant="outlined"
                        color={param.required ? 'primary' : 'default'}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ))}
        </CardContent>
      </Collapse>
    </Card>
  );

  const renderCustomizationForm = () => {
    if (!selectedTemplate) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Customize Template: {selectedTemplate.name}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Method Name"
              value={customization.method_name || ''}
              onChange={(e) => setCustomization({
                ...customization,
                method_name: e.target.value
              })}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={customization.method_description || ''}
              onChange={(e) => setCustomization({
                ...customization,
                method_description: e.target.value
              })}
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Reporting Event</InputLabel>
              <Select
                value={customization.reporting_event_id || ''}
                label="Reporting Event"
                onChange={(e) => setCustomization({
                  ...customization,
                  reporting_event_id: e.target.value
                })}
              >
                {/* Reporting events would be loaded here */}
                <MenuItem value="event1">Sample Reporting Event 1</MenuItem>
                <MenuItem value="event2">Sample Reporting Event 2</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Parameter customization would go here */}
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            Template Parameters:
          </Typography>
          <Alert severity="info">
            Parameter customization will be available in the code template editor after creating the method.
          </Alert>
        </Box>
      </Box>
    );
  };

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
        Method Template Library
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Filters */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} mb={2}>
              <TextField
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ flexGrow: 1 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Grid>
          
          {/* Template List */}
          <Grid item xs={selectedTemplate ? 8 : 12}>
            {loading ? (
              <Box>
                {Array.from(new Array(3)).map((_, index) => (
                  <Skeleton key={index} variant="rectangular" height={200} sx={{ mb: 2 }} />
                ))}
              </Box>
            ) : filteredTemplates.length === 0 ? (
              <Alert severity="info">
                No templates found matching your criteria.
              </Alert>
            ) : (
              <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
                {filteredTemplates.map(renderTemplateCard)}
              </Box>
            )}
          </Grid>
          
          {/* Customization Panel */}
          {selectedTemplate && (
            <Grid item xs={4}>
              <Box sx={{ position: 'sticky', top: 0 }}>
                {renderCustomizationForm()}
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        
        {selectedTemplate && (
          <Button
            variant="contained"
            onClick={handleCreateFromTemplate}
            disabled={!customization.method_name || !customization.reporting_event_id}
          >
            Create Method
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MethodTemplateSelector;