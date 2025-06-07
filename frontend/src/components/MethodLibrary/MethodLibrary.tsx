import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  TextField,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Divider,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Code as CodeIcon,
  Assessment as AssessmentIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  Upload as UploadIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Category as CategoryIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

import MethodEditor from './MethodEditor';
import MethodTemplateSelector from './MethodTemplateSelector';
import CodeTemplateEditor from './CodeTemplateEditor';
import ParameterManager from './ParameterManager';
import MethodPreview from './MethodPreview';
import MethodValidator from './MethodValidator';

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
}

interface MethodTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  operations: any[];
  code_templates: any;
}

interface FilterOptions {
  category: string;
  programmingContext: string;
  hasCodeTemplate: boolean | null;
  reportingEventId: string;
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
      id={`method-library-tabpanel-${index}`}
      aria-labelledby={`method-library-tab-${index}`}
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

const MethodLibrary: React.FC = () => {
  const [methods, setMethods] = useState<AnalysisMethod[]>([]);
  const [templates, setTemplates] = useState<MethodTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({
    category: '',
    programmingContext: '',
    hasCodeTemplate: null,
    reportingEventId: ''
  });
  const [selectedMethod, setSelectedMethod] = useState<AnalysisMethod | null>(null);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [codeEditorOpen, setCodeEditorOpen] = useState(false);
  const [parameterManagerOpen, setParameterManagerOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [validatorDialogOpen, setValidatorDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Filter and search states
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadMethods();
    loadTemplates();
    loadFavorites();
  }, [filters]);

  const loadMethods = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      const response = await fetch('/api/v1/methods', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers
        },
      });
      const data = await response.json();
      setMethods(data.data || []);
    } catch (error) {
      console.error('Error loading methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/v1/methods/templates');
      const data = await response.json();
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadFavorites = () => {
    const saved = localStorage.getItem('method-favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  };

  const toggleFavorite = (methodId: string) => {
    const newFavorites = favorites.includes(methodId)
      ? favorites.filter(id => id !== methodId)
      : [...favorites, methodId];
    
    setFavorites(newFavorites);
    localStorage.setItem('method-favorites', JSON.stringify(newFavorites));
  };

  const filteredMethods = methods.filter(method => {
    const matchesSearch = !searchTerm || 
      method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      method.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilters = 
      (!filters.reportingEventId || method.reporting_event_id === filters.reportingEventId) &&
      (filters.hasCodeTemplate === null || 
       (filters.hasCodeTemplate && method.code_template) ||
       (!filters.hasCodeTemplate && !method.code_template));
    
    return matchesSearch && matchesFilters;
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filters.category || template.category === filters.category;
    
    return matchesSearch && matchesCategory;
  });

  const handleCreateMethod = () => {
    setSelectedMethod(null);
    setEditDialogOpen(true);
  };

  const handleEditMethod = (method: AnalysisMethod) => {
    setSelectedMethod(method);
    setEditDialogOpen(true);
  };

  const handleCloneMethod = async (method: AnalysisMethod) => {
    try {
      const response = await fetch(`/api/v1/methods/${method.id}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_id: `${method.id}_copy`,
          new_name: `${method.name} (Copy)`,
          reporting_event_id: method.reporting_event_id
        }),
      });
      
      if (response.ok) {
        loadMethods();
      }
    } catch (error) {
      console.error('Error cloning method:', error);
    }
  };

  const handleDeleteMethod = async () => {
    if (!selectedMethod) return;
    
    try {
      const response = await fetch(`/api/v1/methods/${selectedMethod.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        loadMethods();
        setDeleteDialogOpen(false);
        setSelectedMethod(null);
      }
    } catch (error) {
      console.error('Error deleting method:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'descriptive':
        return <AssessmentIcon />;
      case 'inferential':
        return <PsychologyIcon />;
      case 'survival':
        return <TimelineIcon />;
      case 'safety':
        return <CategoryIcon />;
      default:
        return <CategoryIcon />;
    }
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

  const renderMethodCard = (method: AnalysisMethod) => (
    <Card key={method.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" component="h3" gutterBottom>
            {method.name}
          </Typography>
          <IconButton
            size="small"
            onClick={() => toggleFavorite(method.id)}
            color={favorites.includes(method.id) ? 'warning' : 'default'}
          >
            {favorites.includes(method.id) ? <StarIcon /> : <StarBorderIcon />}
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {method.description}
        </Typography>
        
        <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
          <Chip
            size="small"
            label={`${method.operations?.length || 0} operations`}
            variant="outlined"
          />
          {method.code_template && (
            <Chip
              size="small"
              icon={<CodeIcon />}
              label="Has Code Template"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        
        <Typography variant="caption" color="text.secondary" display="block" mt={2}>
          Updated: {new Date(method.updated_at).toLocaleDateString()}
        </Typography>
      </CardContent>
      
      <CardActions>
        <Tooltip title="View/Edit">
          <IconButton
            size="small"
            onClick={() => handleEditMethod(method)}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Preview">
          <IconButton
            size="small"
            onClick={() => {
              setSelectedMethod(method);
              setPreviewDialogOpen(true);
            }}
          >
            <ViewIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Code Template">
          <IconButton
            size="small"
            onClick={() => {
              setSelectedMethod(method);
              setCodeEditorOpen(true);
            }}
            disabled={!method.code_template}
          >
            <CodeIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Clone">
          <IconButton
            size="small"
            onClick={() => handleCloneMethod(method)}
          >
            <CopyIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Validate">
          <IconButton
            size="small"
            onClick={() => {
              setSelectedMethod(method);
              setValidatorDialogOpen(true);
            }}
          >
            <AssessmentIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => {
              setSelectedMethod(method);
              setDeleteDialogOpen(true);
            }}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );

  const renderTemplateCard = (template: MethodTemplate) => (
    <Card key={template.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" mb={1}>
          {getCategoryIcon(template.category)}
          <Typography variant="h6" component="h3" ml={1}>
            {template.name}
          </Typography>
        </Box>
        
        <Chip
          size="small"
          label={template.category}
          color={getCategoryColor(template.category) as any}
          sx={{ mb: 1 }}
        />
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {template.description}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          {template.operations?.length || 0} operations included
        </Typography>
      </CardContent>
      
      <CardActions>
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            // Handle template selection
            setTemplateDialogOpen(true);
          }}
        >
          Use Template
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Method Library
        </Typography>
        
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateMethod}
          >
            Create Method
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
          >
            Import
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Box mb={3}>
        <Box display="flex" gap={2} mb={2}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search methods and templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
          
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        </Box>
        
        {showFilters && (
          <Card sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filters.category}
                    label="Category"
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    <MenuItem value="descriptive">Descriptive</MenuItem>
                    <MenuItem value="inferential">Inferential</MenuItem>
                    <MenuItem value="survival">Survival</MenuItem>
                    <MenuItem value="safety">Safety</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Programming Context</InputLabel>
                  <Select
                    value={filters.programmingContext}
                    label="Programming Context"
                    onChange={(e) => setFilters({ ...filters, programmingContext: e.target.value })}
                  >
                    <MenuItem value="">All Contexts</MenuItem>
                    <MenuItem value="SAS">SAS</MenuItem>
                    <MenuItem value="R">R</MenuItem>
                    <MenuItem value="Python">Python</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Code Template</InputLabel>
                  <Select
                    value={filters.hasCodeTemplate === null ? '' : filters.hasCodeTemplate.toString()}
                    label="Code Template"
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters({ 
                        ...filters, 
                        hasCodeTemplate: value === '' ? null : value === 'true'
                      });
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">With Template</MenuItem>
                    <MenuItem value="false">Without Template</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Card>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={selectedTab} 
          onChange={(e, newValue) => setSelectedTab(newValue)}
          aria-label="method library tabs"
        >
          <Tab 
            label={
              <Badge badgeContent={filteredMethods.length} color="primary">
                My Methods
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={filteredTemplates.length} color="secondary">
                Templates
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={favorites.length} color="warning">
                Favorites
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={selectedTab} index={0}>
        {loading ? (
          <Grid container spacing={3}>
            {Array.from(new Array(6)).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Skeleton variant="rectangular" height={300} />
              </Grid>
            ))}
          </Grid>
        ) : filteredMethods.length === 0 ? (
          <Alert severity="info">
            No methods found. {searchTerm && "Try adjusting your search criteria or "}
            <Button onClick={handleCreateMethod}>create a new method</Button>.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredMethods.map((method) => (
              <Grid item xs={12} sm={6} md={4} key={method.id}>
                {renderMethodCard(method)}
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={selectedTab} index={1}>
        {filteredTemplates.length === 0 ? (
          <Alert severity="info">
            No templates found matching your criteria.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                {renderTemplateCard(template)}
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={selectedTab} index={2}>
        {favorites.length === 0 ? (
          <Alert severity="info">
            No favorite methods selected. Star methods to add them to your favorites.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {methods
              .filter(method => favorites.includes(method.id))
              .map((method) => (
                <Grid item xs={12} sm={6} md={4} key={method.id}>
                  {renderMethodCard(method)}
                </Grid>
              ))}
          </Grid>
        )}
      </TabPanel>

      {/* Dialogs */}
      {editDialogOpen && (
        <MethodEditor
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          method={selectedMethod}
          onSave={() => {
            loadMethods();
            setEditDialogOpen(false);
          }}
        />
      )}

      {templateDialogOpen && (
        <MethodTemplateSelector
          open={templateDialogOpen}
          onClose={() => setTemplateDialogOpen(false)}
          onSelect={(template) => {
            // Handle template selection
            setTemplateDialogOpen(false);
          }}
        />
      )}

      {codeEditorOpen && selectedMethod && (
        <CodeTemplateEditor
          open={codeEditorOpen}
          onClose={() => setCodeEditorOpen(false)}
          method={selectedMethod}
          onSave={() => {
            loadMethods();
            setCodeEditorOpen(false);
          }}
        />
      )}

      {parameterManagerOpen && selectedMethod && (
        <ParameterManager
          open={parameterManagerOpen}
          onClose={() => setParameterManagerOpen(false)}
          method={selectedMethod}
          onSave={() => {
            loadMethods();
            setParameterManagerOpen(false);
          }}
        />
      )}

      {previewDialogOpen && selectedMethod && (
        <MethodPreview
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          method={selectedMethod}
        />
      )}

      {validatorDialogOpen && selectedMethod && (
        <MethodValidator
          open={validatorDialogOpen}
          onClose={() => setValidatorDialogOpen(false)}
          method={selectedMethod}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Method</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedMethod?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteMethod} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MethodLibrary;