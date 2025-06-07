import React, { useState, useCallback } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  Settings as SettingsIcon,
  Preview as PreviewIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

import { ExportDialog } from './ExportDialog';
import { ImportDialog } from './ImportDialog';
import { FormatSelector } from './FormatSelector';
import { FieldMapper } from './FieldMapper';
import { PreviewComponent } from './PreviewComponent';
import { ValidationResults } from './ValidationResults';
import { useImportExport } from '../../hooks/useImportExport';

interface ImportExportWizardProps {
  onClose?: () => void;
  defaultTab?: 'import' | 'export';
}

const importSteps = ['Upload File', 'Configure Import', 'Preview Data', 'Import'];
const exportSteps = ['Select Data', 'Configure Export', 'Preview', 'Export'];

export const ImportExportWizard: React.FC<ImportExportWizardProps> = ({
  onClose,
  defaultTab = 'import'
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>(defaultTab);
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [fieldMappings, setFieldMappings] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [exportConfig, setExportConfig] = useState<any>({});

  const {
    importData,
    exportData,
    previewImport,
    validateData,
    getSupportedFormats,
    isLoading,
    error
  } = useImportExport();

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: 'import' | 'export') => {
    setActiveTab(newValue);
    setActiveStep(0);
    setUploadedFile(null);
    setPreviewData(null);
    setValidationResults(null);
  }, []);

  const handleNext = useCallback(async () => {
    if (activeTab === 'import') {
      if (activeStep === 0 && uploadedFile) {
        // Step 1: Preview the uploaded file
        try {
          const preview = await previewImport(uploadedFile);
          setPreviewData(preview);
          setValidationResults(preview.validation);
        } catch (err) {
          console.error('Preview failed:', err);
          return;
        }
      } else if (activeStep === 2) {
        // Step 3: Perform import
        try {
          const importConfig = {
            validate_before_import: true,
            skip_duplicates: true,
            update_existing: false,
            dry_run: false,
            field_mappings: fieldMappings
          };
          
          await importData(uploadedFile!, importConfig);
          if (onClose) onClose();
        } catch (err) {
          console.error('Import failed:', err);
          return;
        }
      }
    } else {
      if (activeStep === 2) {
        // Step 3: Perform export
        try {
          await exportData(exportConfig);
          if (onClose) onClose();
        } catch (err) {
          console.error('Export failed:', err);
          return;
        }
      }
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  }, [activeTab, activeStep, uploadedFile, fieldMappings, exportConfig, previewImport, importData, exportData, onClose]);

  const handleBack = useCallback(() => {
    setActiveStep((prevStep) => prevStep - 1);
  }, []);

  const handleReset = useCallback(() => {
    setActiveStep(0);
    setUploadedFile(null);
    setPreviewData(null);
    setValidationResults(null);
    setFieldMappings([]);
    setExportConfig({});
  }, []);

  const renderImportStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <ImportDialog
            onFileSelect={setUploadedFile}
            selectedFile={uploadedFile}
            onFormatSelect={setSelectedFormat}
          />
        );
      case 1:
        return (
          <FieldMapper
            previewData={previewData}
            fieldMappings={fieldMappings}
            onMappingsChange={setFieldMappings}
          />
        );
      case 2:
        return (
          <PreviewComponent
            data={previewData}
            validationResults={validationResults}
            fieldMappings={fieldMappings}
          />
        );
      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Import Completed Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your data has been imported successfully.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  const renderExportStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <ExportDialog
            onConfigChange={setExportConfig}
            config={exportConfig}
          />
        );
      case 1:
        return (
          <FormatSelector
            selectedFormat={exportConfig.format}
            onFormatSelect={(format) => setExportConfig({ ...exportConfig, format })}
            operation="export"
          />
        );
      case 2:
        return (
          <PreviewComponent
            data={exportConfig}
            isExportPreview={true}
          />
        );
      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Export Completed Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your file is ready for download.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  const steps = activeTab === 'import' ? importSteps : exportSteps;
  const isStepOptional = (step: number) => false;
  const isStepSkipped = (step: number) => false;

  const canProceed = () => {
    if (activeTab === 'import') {
      switch (activeStep) {
        case 0:
          return uploadedFile !== null;
        case 1:
          return true; // Field mapping is optional
        case 2:
          return validationResults?.valid !== false;
        default:
          return true;
      }
    } else {
      switch (activeStep) {
        case 0:
          return exportConfig.reporting_event_id || exportConfig.analysis_ids?.length > 0;
        case 1:
          return exportConfig.format !== '';
        case 2:
          return true;
        default:
          return true;
      }
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, margin: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Import/Export Wizard
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab
            icon={<UploadIcon />}
            label="Import Data"
            value="import"
            iconPosition="start"
          />
          <Tab
            icon={<DownloadIcon />}
            label="Export Data"
            value="export"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label, index) => {
          const stepProps: { completed?: boolean } = {};
          const labelProps: { optional?: React.ReactNode } = {};

          if (isStepOptional(index)) {
            labelProps.optional = (
              <Typography variant="caption">Optional</Typography>
            );
          }

          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }

          return (
            <Step key={label} {...stepProps}>
              <StepLabel {...labelProps}>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>

      <Box sx={{ minHeight: 400, mb: 4 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={64} />
          </Box>
        ) : (
          activeTab === 'import' ? renderImportStep() : renderExportStep()
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          variant="outlined"
        >
          Back
        </Button>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={handleReset} variant="outlined">
            Reset
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button onClick={onClose} variant="contained">
              Finish
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              variant="contained"
            >
              {activeStep === steps.length - 2 
                ? (activeTab === 'import' ? 'Import' : 'Export')
                : 'Next'
              }
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};