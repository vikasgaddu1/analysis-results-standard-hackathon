import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  BugReport as BugIcon,
  Security as SecurityIcon,
  Speed as PerformanceIcon,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

interface ValidationResult {
  field_name: string;
  rule_type: string;
  error_message: string;
  is_valid: boolean;
  value?: any;
}

interface ValidationResultsProps {
  validationResults: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    results?: ValidationResult[];
  };
}

export const ValidationResults: React.FC<ValidationResultsProps> = ({
  validationResults
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    errors: false,
    warnings: false,
    details: false
  });

  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getValidationSeverity = () => {
    if (!validationResults.valid && validationResults.errors.length > 0) {
      return 'error';
    }
    if (validationResults.warnings.length > 0) {
      return 'warning';
    }
    return 'success';
  };

  const getValidationScore = () => {
    const totalIssues = validationResults.errors.length + validationResults.warnings.length;
    const totalChecks = totalIssues + (validationResults.results?.filter(r => r.is_valid).length || 0);
    
    if (totalChecks === 0) return 100;
    
    const errorWeight = 2;
    const warningWeight = 1;
    const score = Math.max(0, 100 - (
      (validationResults.errors.length * errorWeight + validationResults.warnings.length * warningWeight) / totalChecks * 100
    ));
    
    return Math.round(score);
  };

  const categorizeValidationResults = () => {
    if (!validationResults.results) return {};
    
    return validationResults.results.reduce((acc, result) => {
      const category = result.rule_type;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(result);
      return acc;
    }, {} as Record<string, ValidationResult[]>);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'required':
        return <ErrorIcon color="error" />;
      case 'type':
        return <BugIcon color="warning" />;
      case 'format':
        return <SecurityIcon color="info" />;
      case 'foreign_key':
        return <SecurityIcon color="secondary" />;
      case 'integrity':
        return <PerformanceIcon color="primary" />;
      default:
        return <InfoIcon />;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'required':
        return 'Required field validation';
      case 'type':
        return 'Data type validation';
      case 'format':
        return 'Data format validation';
      case 'foreign_key':
        return 'Reference validation';
      case 'integrity':
        return 'Data integrity validation';
      default:
        return 'General validation';
    }
  };

  const renderValidationSummary = () => {
    const score = getValidationScore();
    const severity = getValidationSeverity();
    
    return (
      <Card>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color={`${severity}.main`}>
                  {score}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Validation Score
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={score}
                  color={severity as any}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon color={validationResults.valid ? 'success' : 'disabled'} />
                  <Typography variant="body2">
                    Overall Status: {validationResults.valid ? 'Valid' : 'Invalid'}
                  </Typography>
                </Box>
                
                <Chip
                  icon={<ErrorIcon />}
                  label={`${validationResults.errors.length} Errors`}
                  color={validationResults.errors.length > 0 ? 'error' : 'default'}
                  variant={validationResults.errors.length > 0 ? 'filled' : 'outlined'}
                  size="small"
                />
                
                <Chip
                  icon={<WarningIcon />}
                  label={`${validationResults.warnings.length} Warnings`}
                  color={validationResults.warnings.length > 0 ? 'warning' : 'default'}
                  variant={validationResults.warnings.length > 0 ? 'filled' : 'outlined'}
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {validationResults.valid 
                  ? 'Your data passes all validation checks and is ready for import.'
                  : 'Your data has validation issues that need to be addressed before import.'
                }
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderErrorsAndWarnings = () => {
    if (validationResults.errors.length === 0 && validationResults.warnings.length === 0) {
      return null;
    }

    return (
      <Box>
        {validationResults.errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Validation Errors ({validationResults.errors.length})
                <IconButton
                  size="small"
                  onClick={() => handleSectionToggle('errors')}
                >
                  {expandedSections.errors ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
            </AlertTitle>
            <Collapse in={expandedSections.errors}>
              <List dense>
                {validationResults.errors.map((error, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 20 }}>
                      <ErrorIcon sx={{ fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText primary={error} />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Alert>
        )}

        {validationResults.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Validation Warnings ({validationResults.warnings.length})
                <IconButton
                  size="small"
                  onClick={() => handleSectionToggle('warnings')}
                >
                  {expandedSections.warnings ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
            </AlertTitle>
            <Collapse in={expandedSections.warnings}>
              <List dense>
                {validationResults.warnings.map((warning, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 20 }}>
                      <WarningIcon sx={{ fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText primary={warning} />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Alert>
        )}
      </Box>
    );
  };

  const renderDetailedResults = () => {
    const categorizedResults = categorizeValidationResults();
    
    if (Object.keys(categorizedResults).length === 0) {
      return null;
    }

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detailed Validation Results
          </Typography>
          
          {Object.entries(categorizedResults).map(([category, results]) => (
            <Accordion key={category}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getCategoryIcon(category)}
                  <Typography variant="subtitle1">
                    {getCategoryDescription(category)}
                  </Typography>
                  <Chip
                    label={`${results.length} checks`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {results.map((result, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        {result.is_valid ? (
                          <CheckIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={result.field_name}
                        secondary={
                          result.is_valid 
                            ? 'Validation passed'
                            : result.error_message
                        }
                      />
                      {result.value !== undefined && (
                        <Tooltip title={`Value: ${result.value}`}>
                          <Chip
                            label={String(result.value).substring(0, 20)}
                            size="small"
                            variant="outlined"
                          />
                        </Tooltip>
                      )}
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Validation Results
      </Typography>

      <Box sx={{ mb: 3 }}>
        {renderValidationSummary()}
      </Box>

      {renderErrorsAndWarnings()}

      {validationResults.results && validationResults.results.length > 0 && (
        <Box sx={{ mt: 3 }}>
          {renderDetailedResults()}
        </Box>
      )}

      {validationResults.valid && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <AlertTitle>Ready for Import</AlertTitle>
          All validation checks passed successfully. Your data is ready to be imported.
        </Alert>
      )}
    </Box>
  );
};