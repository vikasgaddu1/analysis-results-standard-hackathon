import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Card,
  CardContent,
  Button,
  IconButton,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AutoAwesome as AutoMapIcon,
  Refresh as ResetIcon
} from '@mui/icons-material';

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
  defaultValue?: string;
  transformFunction?: string;
}

interface FieldMapperProps {
  previewData: any;
  fieldMappings: FieldMapping[];
  onMappingsChange: (mappings: FieldMapping[]) => void;
}

export const FieldMapper: React.FC<FieldMapperProps> = ({
  previewData,
  fieldMappings,
  onMappingsChange
}) => {
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [targetFields] = useState<string[]>([
    'id',
    'name',
    'description',
    'version',
    'reporting_event_id',
    'method_id',
    'analysis_set_id',
    'data_subset_id',
    'group_id',
    'operation_id',
    'output_id',
    'where_clause_id',
    'created_at',
    'updated_at'
  ]);

  const transformFunctions = [
    { value: 'none', label: 'No transformation' },
    { value: 'upper', label: 'Convert to uppercase' },
    { value: 'lower', label: 'Convert to lowercase' },
    { value: 'strip', label: 'Remove whitespace' },
    { value: 'to_int', label: 'Convert to integer' },
    { value: 'to_float', label: 'Convert to float' },
    { value: 'to_bool', label: 'Convert to boolean' },
    { value: 'to_datetime', label: 'Convert to datetime' }
  ];

  // Extract source fields from preview data
  useEffect(() => {
    if (previewData?.sample_data) {
      const fields = new Set<string>();
      
      // Extract fields from different sections
      Object.entries(previewData.sample_data).forEach(([section, data]) => {
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (typeof item === 'object' && item !== null) {
              Object.keys(item).forEach(key => fields.add(key));
            }
          });
        } else if (typeof data === 'object' && data !== null) {
          Object.keys(data).forEach(key => fields.add(key));
        }
      });
      
      setSourceFields(Array.from(fields).sort());
    }
  }, [previewData]);

  // Auto-map fields based on name similarity
  const autoMapFields = useCallback(() => {
    const autoMappings: FieldMapping[] = [];
    
    sourceFields.forEach(sourceField => {
      const lowerSource = sourceField.toLowerCase();
      
      // Find exact matches first
      const exactMatch = targetFields.find(target => 
        target.toLowerCase() === lowerSource
      );
      
      if (exactMatch) {
        autoMappings.push({
          sourceField,
          targetField: exactMatch,
          required: ['id', 'name'].includes(exactMatch),
          transformFunction: 'none'
        });
        return;
      }
      
      // Find partial matches
      const partialMatch = targetFields.find(target => {
        const lowerTarget = target.toLowerCase();
        return lowerSource.includes(lowerTarget) || lowerTarget.includes(lowerSource);
      });
      
      if (partialMatch) {
        autoMappings.push({
          sourceField,
          targetField: partialMatch,
          required: ['id', 'name'].includes(partialMatch),
          transformFunction: 'none'
        });
      }
    });
    
    onMappingsChange(autoMappings);
  }, [sourceFields, targetFields, onMappingsChange]);

  const addMapping = () => {
    const newMapping: FieldMapping = {
      sourceField: '',
      targetField: '',
      required: false,
      transformFunction: 'none'
    };
    onMappingsChange([...fieldMappings, newMapping]);
  };

  const updateMapping = (index: number, field: keyof FieldMapping, value: any) => {
    const updated = [...fieldMappings];
    updated[index] = { ...updated[index], [field]: value };
    onMappingsChange(updated);
  };

  const removeMapping = (index: number) => {
    const updated = fieldMappings.filter((_, i) => i !== index);
    onMappingsChange(updated);
  };

  const resetMappings = () => {
    onMappingsChange([]);
  };

  const getUsedSourceFields = () => {
    return fieldMappings.map(m => m.sourceField).filter(Boolean);
  };

  const getUsedTargetFields = () => {
    return fieldMappings.map(m => m.targetField).filter(Boolean);
  };

  const getAvailableSourceFields = (currentField?: string) => {
    const used = getUsedSourceFields();
    return sourceFields.filter(field => 
      !used.includes(field) || field === currentField
    );
  };

  const getAvailableTargetFields = (currentField?: string) => {
    const used = getUsedTargetFields();
    return targetFields.filter(field => 
      !used.includes(field) || field === currentField
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Field Mapping Configuration
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Map fields from your import file to the target ARS schema fields. 
        Required fields must be mapped for successful import.
      </Typography>

      {/* Auto-mapping and controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  startIcon={<AutoMapIcon />}
                  onClick={autoMapFields}
                  variant="outlined"
                  size="small"
                >
                  Auto-map Fields
                </Button>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addMapping}
                  variant="outlined"
                  size="small"
                >
                  Add Mapping
                </Button>
                <Button
                  startIcon={<ResetIcon />}
                  onClick={resetMappings}
                  variant="outlined"
                  size="small"
                  color="secondary"
                >
                  Reset All
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Mapping Statistics
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${fieldMappings.length} mappings`} 
                  size="small" 
                  color="primary" 
                />
                <Chip 
                  label={`${sourceFields.length} source fields`} 
                  size="small" 
                  variant="outlined" 
                />
                <Chip 
                  label={`${getUsedSourceFields().length} mapped`} 
                  size="small" 
                  color="success" 
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Validation alerts */}
      {fieldMappings.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No field mappings configured. Click "Auto-map Fields" to automatically map fields 
          with matching names, or add mappings manually.
        </Alert>
      )}

      {fieldMappings.some(m => m.required && !m.sourceField) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Some required fields are not mapped. These must be configured for successful import.
        </Alert>
      )}

      {/* Mapping table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Source Field</TableCell>
              <TableCell>Target Field</TableCell>
              <TableCell>Transform</TableCell>
              <TableCell>Default Value</TableCell>
              <TableCell>Required</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fieldMappings.map((mapping, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Autocomplete
                    options={getAvailableSourceFields(mapping.sourceField)}
                    value={mapping.sourceField || null}
                    onChange={(_, value) => updateMapping(index, 'sourceField', value || '')}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        size="small" 
                        placeholder="Select source field..."
                      />
                    )}
                    sx={{ minWidth: 200 }}
                  />
                </TableCell>
                <TableCell>
                  <Autocomplete
                    options={getAvailableTargetFields(mapping.targetField)}
                    value={mapping.targetField || null}
                    onChange={(_, value) => updateMapping(index, 'targetField', value || '')}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        size="small" 
                        placeholder="Select target field..."
                      />
                    )}
                    sx={{ minWidth: 200 }}
                  />
                </TableCell>
                <TableCell>
                  <Autocomplete
                    options={transformFunctions}
                    getOptionLabel={(option) => option.label}
                    value={transformFunctions.find(t => t.value === mapping.transformFunction) || transformFunctions[0]}
                    onChange={(_, value) => updateMapping(index, 'transformFunction', value?.value || 'none')}
                    renderInput={(params) => (
                      <TextField {...params} size="small" />
                    )}
                    sx={{ minWidth: 180 }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={mapping.defaultValue || ''}
                    onChange={(e) => updateMapping(index, 'defaultValue', e.target.value)}
                    placeholder="Default value..."
                    sx={{ minWidth: 120 }}
                  />
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={mapping.required}
                        onChange={(e) => updateMapping(index, 'required', e.target.checked)}
                        size="small"
                      />
                    }
                    label=""
                  />
                </TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => removeMapping(index)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {fieldMappings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No field mappings configured. Add a mapping to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Unmapped fields info */}
      {sourceFields.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Available Source Fields
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              These fields are available in your source data but not yet mapped:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {sourceFields
                .filter(field => !getUsedSourceFields().includes(field))
                .map(field => (
                  <Chip 
                    key={field} 
                    label={field} 
                    size="small" 
                    variant="outlined"
                    onClick={() => {
                      const newMapping: FieldMapping = {
                        sourceField: field,
                        targetField: '',
                        required: false,
                        transformFunction: 'none'
                      };
                      onMappingsChange([...fieldMappings, newMapping]);
                    }}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};