/**
 * Template Editor Component
 * 
 * Create and edit templates with a comprehensive form interface.
 * Supports all template types with dynamic content editing.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  Typography,
  Paper,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Alert,
  Autocomplete,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { JsonEditor } from '@mui/x-json-view';

import { Template, TemplateCategory, TemplateType, TemplateStatus, TemplateAccessLevel } from '../../types/template';
import { templateService } from '../../services/templateService';
import TemplatePreview from './TemplatePreview';

interface TemplateEditorProps {
  template?: Template | null;
  categories: TemplateCategory[];
  onSave: (template: Template) => void;
  onCancel: () => void;
}

interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  required?: boolean;
  defaultValue?: any;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  categories,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<Template>>({
    name: '',
    description: '',
    type: TemplateType.ANALYSIS,
    categoryId: '',
    content: {},
    config: {},
    parameters: {},
    version: '1.0.0',
    status: TemplateStatus.DRAFT,
    accessLevel: TemplateAccessLevel.PRIVATE,
    keywords: [],
    regulatoryCompliance: [],
    therapeuticAreas: []
  });
  
  const [parameters, setParameters] = useState<TemplateParameter[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCompliance, setNewCompliance] = useState('');
  const [newArea, setNewArea] = useState('');

  useEffect(() => {
    if (template) {
      setFormData({
        ...template,
        keywords: template.keywords || [],
        regulatoryCompliance: template.regulatoryCompliance || [],
        therapeuticAreas: template.therapeuticAreas || []
      });
      
      // Extract parameters if they exist
      if (template.parameters && typeof template.parameters === 'object') {
        const params = Object.entries(template.parameters).map(([name, config]: [string, any]) => ({
          name,
          type: config.type || 'string',
          description: config.description,
          required: config.required,
          defaultValue: config.defaultValue
        }));
        setParameters(params);
      }
    }
  }, [template]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Template type is required';
    }

    if (Object.keys(formData.content || {}).length === 0) {
      newErrors.content = 'Template content cannot be empty';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      // Convert parameters array back to object format
      const parametersObject = parameters.reduce((acc, param) => {
        acc[param.name] = {
          type: param.type,
          description: param.description,
          required: param.required,
          defaultValue: param.defaultValue
        };
        return acc;
      }, {} as Record<string, any>);

      const templateData = {
        ...formData,
        parameters: parametersObject
      } as Template;

      const savedTemplate = template?.id
        ? await templateService.updateTemplate(template.id, templateData)
        : await templateService.createTemplate(templateData);

      onSave(savedTemplate);
    } catch (error) {
      console.error('Failed to save template:', error);
      setErrors({ save: 'Failed to save template. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      {
        name: `param${parameters.length + 1}`,
        type: 'string',
        description: '',
        required: false,
        defaultValue: ''
      }
    ]);
  };

  const handleUpdateParameter = (index: number, updates: Partial<TemplateParameter>) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], ...updates };
    setParameters(updated);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !formData.keywords?.includes(newKeyword.trim())) {
      setFormData({
        ...formData,
        keywords: [...(formData.keywords || []), newKeyword.trim()]
      });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords?.filter(k => k !== keyword) || []
    });
  };

  const getTemplateTypeHelp = (type: TemplateType): string => {
    const helpTexts: Record<TemplateType, string> = {
      [TemplateType.ANALYSIS]: 'Template for analysis definitions including methods and results',
      [TemplateType.METHOD]: 'Template for reusable analysis methods and operations',
      [TemplateType.OUTPUT]: 'Template for output specifications and displays',
      [TemplateType.DISPLAY]: 'Template for display sections and formatting',
      [TemplateType.WHERE_CLAUSE]: 'Template for data filtering conditions',
      [TemplateType.TABLE_SHELL]: 'Template for table structures and layouts',
      [TemplateType.VISUALIZATION]: 'Template for charts and graphical displays',
      [TemplateType.REPORT_SECTION]: 'Template for complete report sections'
    };
    return helpTexts[type] || '';
  };

  return (
    <Box>
      <Stack spacing={3}>
        {errors.save && (
          <Alert severity="error" onClose={() => setErrors({ ...errors, save: '' })}>
            {errors.save}
          </Alert>
        )}

        {/* Basic Information */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          
          <Stack spacing={2}>
            <TextField
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={Boolean(errors.name)}
              helperText={errors.name}
              required
              fullWidth
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth error={Boolean(errors.type)}>
                <InputLabel>Template Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TemplateType })}
                  label="Template Type"
                >
                  {Object.values(TemplateType).map((type) => (
                    <MenuItem key={type} value={type}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>{type.replace('_', ' ')}</span>
                        <Tooltip title={getTemplateTypeHelp(type)}>
                          <HelpIcon fontSize="small" color="action" />
                        </Tooltip>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  label="Category"
                >
                  <MenuItem value="">None</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TemplateStatus })}
                  label="Status"
                >
                  {Object.values(TemplateStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Access Level</InputLabel>
                <Select
                  value={formData.accessLevel}
                  onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value as TemplateAccessLevel })}
                  label="Access Level"
                >
                  {Object.values(TemplateAccessLevel).map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </Paper>

        {/* Template Content */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Template Content</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Alert severity="info">
                Define the content structure for your template based on the selected type.
              </Alert>
              
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<CodeIcon />}
                  onClick={() => setShowJsonEditor(true)}
                >
                  Edit as JSON
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowPreview(true)}
                  disabled={!formData.content || Object.keys(formData.content).length === 0}
                >
                  Preview
                </Button>
              </Stack>

              {errors.content && (
                <Alert severity="error">{errors.content}</Alert>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Parameters */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              Parameters
              <Chip label={parameters.length} size="small" sx={{ ml: 1 }} />
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Define parameters that users can customize when using this template.
              </Typography>

              {parameters.map((param, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <TextField
                        label="Parameter Name"
                        value={param.name}
                        onChange={(e) => handleUpdateParameter(index, { name: e.target.value })}
                        size="small"
                        sx={{ flexGrow: 1 }}
                      />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={param.type}
                          onChange={(e) => handleUpdateParameter(index, { type: e.target.value as any })}
                          label="Type"
                        >
                          <MenuItem value="string">String</MenuItem>
                          <MenuItem value="number">Number</MenuItem>
                          <MenuItem value="boolean">Boolean</MenuItem>
                          <MenuItem value="array">Array</MenuItem>
                          <MenuItem value="object">Object</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={param.required || false}
                            onChange={(e) => handleUpdateParameter(index, { required: e.target.checked })}
                          />
                        }
                        label="Required"
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveParameter(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Stack>
                    
                    <TextField
                      label="Description"
                      value={param.description || ''}
                      onChange={(e) => handleUpdateParameter(index, { description: e.target.value })}
                      size="small"
                      fullWidth
                    />
                    
                    <TextField
                      label="Default Value"
                      value={param.defaultValue || ''}
                      onChange={(e) => handleUpdateParameter(index, { defaultValue: e.target.value })}
                      size="small"
                      fullWidth
                    />
                  </Stack>
                </Paper>
              ))}

              <Button
                startIcon={<AddIcon />}
                onClick={handleAddParameter}
                variant="outlined"
              >
                Add Parameter
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Metadata */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Metadata & Tags</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={3}>
              {/* Keywords */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Keywords
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={1}>
                  {formData.keywords?.map((keyword) => (
                    <Chip
                      key={keyword}
                      label={keyword}
                      onDelete={() => handleRemoveKeyword(keyword)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField
                    placeholder="Add keyword"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                    size="small"
                  />
                  <Button size="small" onClick={handleAddKeyword}>
                    Add
                  </Button>
                </Stack>
              </Box>

              {/* Regulatory Compliance */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Regulatory Compliance
                </Typography>
                <Autocomplete
                  multiple
                  options={['FDA', 'EMA', 'ICH', 'PMDA', 'Health Canada']}
                  value={formData.regulatoryCompliance || []}
                  onChange={(_, newValue) => setFormData({ ...formData, regulatoryCompliance: newValue })}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select compliance standards" size="small" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip {...getTagProps({ index })} key={option} label={option} size="small" />
                    ))
                  }
                />
              </Box>

              {/* Therapeutic Areas */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Therapeutic Areas
                </Typography>
                <Autocomplete
                  multiple
                  options={['Oncology', 'Cardiology', 'Neurology', 'Infectious Disease', 'Rare Diseases']}
                  value={formData.therapeuticAreas || []}
                  onChange={(_, newValue) => setFormData({ ...formData, therapeuticAreas: newValue })}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select therapeutic areas" size="small" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip {...getTagProps({ index })} key={option} label={option} size="small" />
                    ))
                  }
                />
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Actions */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : template?.id ? 'Update Template' : 'Create Template'}
          </Button>
        </Stack>
      </Stack>

      {/* JSON Editor Dialog */}
      <Dialog
        open={showJsonEditor}
        onClose={() => setShowJsonEditor(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Template Content as JSON</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 400, overflow: 'auto' }}>
            <JsonEditor
              value={formData.content || {}}
              onChange={(value) => setFormData({ ...formData, content: value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowJsonEditor(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      {showPreview && formData && (
        <TemplatePreview
          template={formData as Template}
          open={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </Box>
  );
};

export default TemplateEditor;