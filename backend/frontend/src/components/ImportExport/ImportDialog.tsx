import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondary,
  IconButton,
  Grid
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Description as YamlIcon,
  DataObject as JsonIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material';

interface ImportDialogProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  onFormatSelect: (format: string) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  onFileSelect,
  selectedFile,
  onFormatSelect
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = [
    {
      format: 'yaml',
      extensions: ['.yml', '.yaml'],
      icon: <YamlIcon />,
      description: 'YAML files for human-readable configuration',
      maxSize: '50MB'
    },
    {
      format: 'json',
      extensions: ['.json'],
      icon: <JsonIcon />,
      description: 'JSON files for structured data exchange',
      maxSize: '50MB'
    },
    {
      format: 'excel',
      extensions: ['.xlsx', '.xls'],
      icon: <ExcelIcon />,
      description: 'Excel files with multiple sheets',
      maxSize: '100MB'
    }
  ];

  const getFileIcon = (filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'yml':
      case 'yaml':
        return <YamlIcon color="primary" />;
      case 'json':
        return <JsonIcon color="primary" />;
      case 'xlsx':
      case 'xls':
        return <ExcelIcon color="primary" />;
      default:
        return <FileIcon />;
    }
  };

  const getFileFormat = (filename: string) => {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'yml':
      case 'yaml':
        return 'yaml';
      case 'json':
        return 'json';
      case 'xlsx':
      case 'xls':
        return 'excel';
      default:
        return 'unknown';
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file size (50MB for YAML/JSON, 100MB for Excel)
    const maxSize = file.name.toLowerCase().includes('.xls') ? 100 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size exceeds limit (${maxSize / 1024 / 1024}MB)`;
    }

    // Check file extension
    const format = getFileFormat(file.name);
    if (format === 'unknown') {
      return 'Unsupported file format. Please use YAML (.yml, .yaml), JSON (.json), or Excel (.xlsx, .xls) files.';
    }

    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    
    if (error) {
      setFileError(error);
      onFileSelect(null);
      return;
    }

    setFileError(null);
    onFileSelect(file);
    onFormatSelect(getFileFormat(file.name));
    
    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  }, [onFileSelect, onFormatSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleRemoveFile = useCallback(() => {
    onFileSelect(null);
    setFileError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelect]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Upload Import File
      </Typography>

      {/* File Upload Area */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          border: 2,
          borderStyle: 'dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          backgroundColor: dragActive ? 'action.hover' : 'background.paper',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".yml,.yaml,.json,.xlsx,.xls"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        
        <UploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {dragActive ? 'Drop file here' : 'Drag & drop your file here'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          or click to browse
        </Typography>
        <Button variant="outlined" sx={{ mt: 2 }}>
          Choose File
        </Button>
      </Paper>

      {/* File Error */}
      {fileError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {fileError}
        </Alert>
      )}

      {/* Selected File */}
      {selectedFile && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getFileIcon(selectedFile.name)}
                <Box>
                  <Typography variant="subtitle1">{selectedFile.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(selectedFile.size)} • {getFileFormat(selectedFile.name).toUpperCase()}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {uploadProgress === 100 ? (
                  <Chip icon={<CheckIcon />} label="Ready" color="success" size="small" />
                ) : (
                  <Chip label={`${uploadProgress}%`} color="primary" size="small" />
                )}
                <IconButton onClick={handleRemoveFile} size="small">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
            
            {uploadProgress > 0 && uploadProgress < 100 && (
              <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 2 }} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Supported Formats */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Supported File Formats
          </Typography>
          <Grid container spacing={2}>
            {supportedFormats.map((format) => (
              <Grid item xs={12} md={4} key={format.format}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {format.icon}
                      <Typography variant="subtitle1">
                        {format.format.toUpperCase()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {format.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      {format.extensions.map((ext) => (
                        <Chip key={ext} label={ext} size="small" variant="outlined" />
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Max size: {format.maxSize}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Import Guidelines */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Import Guidelines
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Ensure your data follows the ARS schema structure"
                secondary="Check the documentation for required fields and data types"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Backup your existing data before importing"
                secondary="Import operations may modify or replace existing records"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Use unique IDs for all records"
                secondary="Duplicate IDs will be handled based on your import settings"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};