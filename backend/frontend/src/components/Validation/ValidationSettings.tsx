/**
 * Validation settings and configuration component
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { useValidationProfiles, useValidationRules } from '../../hooks/useValidation';

interface ValidationSettingsProps {
  onSettingsChange?: (settings: any) => void;
}

export const ValidationSettings: React.FC<ValidationSettingsProps> = ({
  onSettingsChange,
}) => {
  const [settings, setSettings] = useState({
    defaultProfile: 'default',
    autoValidation: true,
    realtimeValidation: false,
    includeWarnings: true,
    includeInfo: false,
    validationTimeout: 60,
    maxConcurrentValidations: 4,
    enableNotifications: true,
    notificationThreshold: 'error',
  });

  const [customProfile, setCustomProfile] = useState({
    name: '',
    description: '',
    enabled_validators: ['data_integrity', 'ars'],
    severity_threshold: 'warning',
    fail_fast: false,
    parallel_execution: true,
    excluded_rules: [] as string[],
  });

  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showRuleConfig, setShowRuleConfig] = useState(false);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);

  const { data: profiles = [] } = useValidationProfiles();
  const { data: rules = [] } = useValidationRules();

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const handleProfileSave = () => {
    // In a real implementation, this would call an API to save the profile
    console.log('Saving custom profile:', customProfile);
    setShowProfileDialog(false);
    // Reset form
    setCustomProfile({
      name: '',
      description: '',
      enabled_validators: ['data_integrity', 'ars'],
      severity_threshold: 'warning',
      fail_fast: false,
      parallel_execution: true,
      excluded_rules: [],
    });
  };

  const handleRuleToggle = (ruleId: string) => {
    // In a real implementation, this would update rule configuration
    console.log('Toggling rule:', ruleId);
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      defaultProfile: 'default',
      autoValidation: true,
      realtimeValidation: false,
      includeWarnings: true,
      includeInfo: false,
      validationTimeout: 60,
      maxConcurrentValidations: 4,
      enableNotifications: true,
      notificationThreshold: 'error',
    };
    setSettings(defaultSettings);
    onSettingsChange?.(defaultSettings);
  };

  const renderGeneralSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          General Settings
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Default Validation Profile</InputLabel>
              <Select
                value={settings.defaultProfile}
                onChange={(e) => handleSettingChange('defaultProfile', e.target.value)}
                label="Default Validation Profile"
              >
                {profiles.map((profile) => (
                  <MenuItem key={profile.name} value={profile.name}>
                    {profile.display_name || profile.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Notification Threshold</InputLabel>
              <Select
                value={settings.notificationThreshold}
                onChange={(e) => handleSettingChange('notificationThreshold', e.target.value)}
                label="Notification Threshold"
              >
                <MenuItem value="info">Info and above</MenuItem>
                <MenuItem value="warning">Warning and above</MenuItem>
                <MenuItem value="error">Error and above</MenuItem>
                <MenuItem value="critical">Critical only</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Validation Timeout (seconds)"
              value={settings.validationTimeout}
              onChange={(e) => handleSettingChange('validationTimeout', parseInt(e.target.value))}
              inputProps={{ min: 10, max: 300 }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Max Concurrent Validations"
              value={settings.maxConcurrentValidations}
              onChange={(e) => handleSettingChange('maxConcurrentValidations', parseInt(e.target.value))}
              inputProps={{ min: 1, max: 10 }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoValidation}
                    onChange={(e) => handleSettingChange('autoValidation', e.target.checked)}
                  />
                }
                label="Enable automatic validation on data changes"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.realtimeValidation}
                    onChange={(e) => handleSettingChange('realtimeValidation', e.target.checked)}
                  />
                }
                label="Enable real-time validation (as you type)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.includeWarnings}
                    onChange={(e) => handleSettingChange('includeWarnings', e.target.checked)}
                  />
                }
                label="Include warnings in validation results by default"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.includeInfo}
                    onChange={(e) => handleSettingChange('includeInfo', e.target.checked)}
                  />
                }
                label="Include informational messages in validation results"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableNotifications}
                    onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                  />
                }
                label="Enable validation notifications"
              />
            </FormGroup>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderProfileManagement = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Validation Profiles
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowProfileDialog(true)}
          >
            Create Profile
          </Button>
        </Box>

        <List>
          {profiles.map((profile) => (
            <ListItem key={profile.name}>
              <ListItemText
                primary={profile.display_name || profile.name}
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      {profile.description}
                    </Typography>
                    <Box display="flex" gap={1} mt={1}>
                      {profile.enabled_validators.map((validator) => (
                        <Chip key={validator} label={validator} size="small" />
                      ))}
                    </Box>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" size="small">
                  <EditIcon />
                </IconButton>
                {!profile.is_system_profile && (
                  <IconButton edge="end" size="small">
                    <DeleteIcon />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const renderRuleConfiguration = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Validation Rules Configuration
        </Typography>
        
        {['ars', 'cdisc', 'regulatory', 'data_integrity', 'business_rules'].map((validatorName) => {
          const validatorRules = rules.filter(rule => rule.validator_name === validatorName);
          
          return (
            <Accordion key={validatorName}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  {validatorName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Validator
                </Typography>
                <Chip
                  label={`${validatorRules.filter(r => r.is_enabled).length}/${validatorRules.length}`}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {validatorRules.map((rule) => (
                    <ListItem key={rule.rule_id}>
                      <ListItemText
                        primary={rule.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              {rule.description}
                            </Typography>
                            <Box display="flex" gap={1} mt={1}>
                              <Chip label={rule.category} size="small" />
                              <Chip label={rule.severity} size="small" color={
                                rule.severity === 'critical' || rule.severity === 'error' ? 'error' :
                                rule.severity === 'warning' ? 'warning' : 'info'
                              } />
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          checked={rule.is_enabled}
                          onChange={() => handleRuleToggle(rule.rule_id)}
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Validation Settings
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Configure validation behavior, profiles, and rules
          </Typography>
        </Box>
        
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RestoreIcon />}
            onClick={resetToDefaults}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => console.log('Settings saved:', settings)}
          >
            Save Settings
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          {renderGeneralSettings()}
        </Grid>
        
        <Grid item xs={12}>
          {renderProfileManagement()}
        </Grid>
        
        <Grid item xs={12}>
          {renderRuleConfiguration()}
        </Grid>
      </Grid>

      {/* Create Profile Dialog */}
      <Dialog
        open={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Custom Validation Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Profile Name"
                value={customProfile.name}
                onChange={(e) => setCustomProfile(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={customProfile.description}
                onChange={(e) => setCustomProfile(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Severity Threshold</InputLabel>
                <Select
                  value={customProfile.severity_threshold}
                  onChange={(e) => setCustomProfile(prev => ({ ...prev, severity_threshold: e.target.value }))}
                  label="Severity Threshold"
                >
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Enabled Validators
              </Typography>
              <FormGroup row>
                {['ars', 'cdisc', 'regulatory', 'data_integrity', 'business_rules'].map((validator) => (
                  <FormControlLabel
                    key={validator}
                    control={
                      <Switch
                        checked={customProfile.enabled_validators.includes(validator)}
                        onChange={(e) => {
                          const newValidators = e.target.checked
                            ? [...customProfile.enabled_validators, validator]
                            : customProfile.enabled_validators.filter(v => v !== validator);
                          setCustomProfile(prev => ({ ...prev, enabled_validators: newValidators }));
                        }}
                      />
                    }
                    label={validator.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  />
                ))}
              </FormGroup>
            </Grid>
            
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={customProfile.fail_fast}
                      onChange={(e) => setCustomProfile(prev => ({ ...prev, fail_fast: e.target.checked }))}
                    />
                  }
                  label="Fail fast (stop validation on first critical error)"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={customProfile.parallel_execution}
                      onChange={(e) => setCustomProfile(prev => ({ ...prev, parallel_execution: e.target.checked }))}
                    />
                  }
                  label="Enable parallel execution for faster validation"
                />
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProfileDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleProfileSave}
            disabled={!customProfile.name.trim()}
          >
            Create Profile
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ValidationSettings;