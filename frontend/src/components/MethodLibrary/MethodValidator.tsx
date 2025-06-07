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
  CardActions,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Alert,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  BugReport as BugIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Lightbulb as SuggestionIcon
} from '@mui/icons-material';

interface AnalysisMethod {
  id: string;
  name: string;
  description: string;
  operations: Operation[];
  code_template?: string;
}

interface Operation {
  id: string;
  name: string;
  description?: string;
  order_num: number;
  result_pattern?: string;
}

interface ValidationResult {
  status: 'valid' | 'warning' | 'error' | 'unknown';
  score: number;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
  suggestions: ValidationIssue[];
  categories: ValidationCategory[];
}

interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
  suggestion?: string;
}

interface ValidationCategory {
  name: string;
  score: number;
  issues: number;
  warnings: number;
  passed: boolean;
}

interface MethodValidatorProps {
  open: boolean;
  onClose: () => void;
  method: AnalysisMethod;
}

const validationCategories = [
  {
    id: 'completeness',
    name: 'Completeness',
    description: 'All required fields and information are present',
    icon: <CheckIcon />
  },
  {
    id: 'consistency',
    name: 'Consistency',
    description: 'Internal consistency and logical flow',
    icon: <AssessmentIcon />
  },
  {
    id: 'code_quality',
    name: 'Code Quality',
    description: 'Code template syntax and best practices',
    icon: <CodeIcon />
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Operation definitions and relationships',
    icon: <TimelineIcon />
  },
  {
    id: 'parameters',
    name: 'Parameters',
    description: 'Parameter definitions and validation',
    icon: <SettingsIcon />
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Security considerations and best practices',
    icon: <SecurityIcon />
  }
];

const MethodValidator: React.FC<MethodValidatorProps> = ({
  open,
  onClose,
  method
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [validationOptions, setValidationOptions] = useState({
    strict_mode: false,
    check_code_syntax: true,
    validate_parameters: true,
    check_operations: true,
    security_scan: false
  });

  useEffect(() => {
    if (open) {
      runValidation();
    }
  }, [open, method]);

  const runValidation = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/methods/${method.id}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validationOptions),
      });

      if (response.ok) {
        const result = await response.json();
        setValidationResult(transformValidationResult(result));
      } else {
        console.error('Validation failed');
      }
    } catch (error) {
      console.error('Error running validation:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformValidationResult = (result: any): ValidationResult => {
    // Transform API response to our ValidationResult format
    const issues: ValidationIssue[] = (result.issues || []).map((issue: string) => ({
      type: 'error',
      severity: 'error' as const,
      message: issue,
      location: 'method'
    }));

    const warnings: ValidationIssue[] = (result.warnings || []).map((warning: string) => ({
      type: 'warning',
      severity: 'warning' as const,
      message: warning,
      location: 'method'
    }));

    const suggestions: ValidationIssue[] = (result.suggestions || []).map((suggestion: string) => ({
      type: 'suggestion',
      severity: 'info' as const,
      message: suggestion,
      location: 'method'
    }));

    // Create category-specific results
    const categories: ValidationCategory[] = validationCategories.map(category => {
      const categoryIssues = issues.filter(issue => 
        issue.message.toLowerCase().includes(category.name.toLowerCase())
      );
      const categoryWarnings = warnings.filter(warning => 
        warning.message.toLowerCase().includes(category.name.toLowerCase())
      );

      const score = Math.max(0, 100 - (categoryIssues.length * 20) - (categoryWarnings.length * 10));
      
      return {
        name: category.name,
        score,
        issues: categoryIssues.length,
        warnings: categoryWarnings.length,
        passed: categoryIssues.length === 0
      };
    });

    return {
      status: result.status || 'unknown',
      score: result.score || 0,
      issues,
      warnings,
      suggestions,
      categories
    };
  };

  const getStatusIcon = (status: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    const iconProps = { fontSize: size };
    switch (status) {
      case 'valid':
        return <CheckIcon color="success" {...iconProps} />;
      case 'warning':
        return <WarningIcon color="warning" {...iconProps} />;
      case 'error':
        return <ErrorIcon color="error" {...iconProps} />;
      default:
        return <InfoIcon color="info" {...iconProps} />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'warning':
        return <WarningIcon color="warning" fontSize="small" />;
      case 'info':
        return <SuggestionIcon color="info" fontSize="small" />;
      default:
        return <InfoIcon color="info" fontSize="small" />;
    }
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const renderOverallScore = () => {
    if (!validationResult) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              {getStatusIcon(validationResult.status, 'large')}
              <Box>
                <Typography variant="h5">
                  Validation Score: {validationResult.score}/100
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Status: {validationResult.status.charAt(0).toUpperCase() + validationResult.status.slice(1)}
                </Typography>
              </Box>
            </Box>
            
            <CircularProgress
              variant="determinate"
              value={validationResult.score}
              size={80}
              thickness={6}
              color={getScoreColor(validationResult.score)}
              sx={{
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
            />
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={validationResult.score}
            color={getScoreColor(validationResult.score)}
            sx={{ height: 8, borderRadius: 4 }}
          />
          
          <Box display="flex" gap={2} mt={2}>
            <Chip
              icon={<ErrorIcon />}
              label={`${validationResult.issues.length} Issues`}
              color="error"
              variant={validationResult.issues.length > 0 ? 'filled' : 'outlined'}
            />
            <Chip
              icon={<WarningIcon />}
              label={`${validationResult.warnings.length} Warnings`}
              color="warning"
              variant={validationResult.warnings.length > 0 ? 'filled' : 'outlined'}
            />
            <Chip
              icon={<SuggestionIcon />}
              label={`${validationResult.suggestions.length} Suggestions`}
              color="info"
              variant={validationResult.suggestions.length > 0 ? 'filled' : 'outlined'}
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderCategoryResults = () => {
    if (!validationResult) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Validation Categories
        </Typography>
        
        {validationResult.categories.map((category) => {
          const categoryData = validationCategories.find(cat => cat.name === category.name);
          
          return (
            <Accordion
              key={category.name}
              expanded={expandedCategories[category.name] ?? false}
              onChange={() => toggleCategory(category.name)}
              sx={{ mb: 1 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  {categoryData?.icon}
                  <Box flexGrow={1}>
                    <Typography variant="subtitle1">
                      {category.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {categoryData?.description}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      size="small"
                      label={`${category.score}%`}
                      color={getScoreColor(category.score)}
                      variant="outlined"
                    />
                    {category.passed ? (
                      <CheckIcon color="success" fontSize="small" />
                    ) : (
                      <ErrorIcon color="error" fontSize="small" />
                    )}
                  </Box>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box>
                  <Box display="flex" gap={1} mb={2}>
                    <Chip
                      size="small"
                      label={`${category.issues} Issues`}
                      color="error"
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`${category.warnings} Warnings`}
                      color="warning"
                      variant="outlined"
                    />
                  </Box>
                  
                  {/* Category-specific issues would be displayed here */}
                  <Typography variant="body2" color="text.secondary">
                    Detailed validation results for {category.name} category.
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    );
  };

  const renderIssuesList = () => {
    if (!validationResult) return null;

    const allIssues = [
      ...validationResult.issues,
      ...validationResult.warnings,
      ...validationResult.suggestions
    ];

    if (allIssues.length === 0) {
      return (
        <Alert severity="success" sx={{ mt: 2 }}>
          No issues found. This method passes all validation checks!
        </Alert>
      );
    }

    return (
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Detailed Results
        </Typography>
        
        <List>
          {allIssues.map((issue, index) => (
            <Card key={index} sx={{ mb: 1 }}>
              <CardContent sx={{ py: 1 }}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    {getSeverityIcon(issue.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={issue.message}
                    secondary={
                      <Box>
                        {issue.location && (
                          <Typography variant="caption" display="block">
                            Location: {issue.location}
                          </Typography>
                        )}
                        {issue.suggestion && (
                          <Typography variant="caption" color="primary">
                            Suggestion: {issue.suggestion}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </CardContent>
            </Card>
          ))}
        </List>
      </Box>
    );
  };

  const renderValidationOptions = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Validation Options
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={validationOptions.strict_mode}
                  onChange={(e) => setValidationOptions({
                    ...validationOptions,
                    strict_mode: e.target.checked
                  })}
                />
              }
              label="Strict Mode"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={validationOptions.check_code_syntax}
                  onChange={(e) => setValidationOptions({
                    ...validationOptions,
                    check_code_syntax: e.target.checked
                  })}
                />
              }
              label="Check Code Syntax"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={validationOptions.validate_parameters}
                  onChange={(e) => setValidationOptions({
                    ...validationOptions,
                    validate_parameters: e.target.checked
                  })}
                />
              }
              label="Validate Parameters"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={validationOptions.check_operations}
                  onChange={(e) => setValidationOptions({
                    ...validationOptions,
                    check_operations: e.target.checked
                  })}
                />
              }
              label="Check Operations"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={validationOptions.security_scan}
                  onChange={(e) => setValidationOptions({
                    ...validationOptions,
                    security_scan: e.target.checked
                  })}
                />
              }
              label="Security Scan"
            />
          </Grid>
        </Grid>
      </CardContent>
      
      <CardActions>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={runValidation}
          disabled={loading}
        >
          {loading ? 'Validating...' : 'Run Validation'}
        </Button>
      </CardActions>
    </Card>
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
          <AssessmentIcon />
          <Typography variant="h6">
            Method Validator - {method.name}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {renderValidationOptions()}
        
        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Validating Method...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This may take a few moments
            </Typography>
          </Box>
        ) : (
          <>
            {renderOverallScore()}
            {renderCategoryResults()}
            {renderIssuesList()}
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {validationResult && (
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={runValidation}
            disabled={loading}
          >
            Re-validate
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MethodValidator;