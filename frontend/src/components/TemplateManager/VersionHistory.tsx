/**
 * Version History Component
 * 
 * Display and manage template version history.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Paper,
  Stack,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  History as HistoryIcon,
  Visibility as ViewIcon,
  Restore as RestoreIcon,
  Compare as CompareIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

import { TemplateVersion } from '../../types/template';
import { templateService } from '../../services/templateService';

interface VersionHistoryProps {
  templateId: string;
  currentVersion?: string;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  templateId,
  currentVersion
}) => {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<TemplateVersion[]>([]);

  useEffect(() => {
    loadVersions();
  }, [templateId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await templateService.getTemplateVersions(templateId);
      setVersions(data.versions);
    } catch (err) {
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = (version: TemplateVersion) => {
    setSelectedVersion(version);
  };

  const handleRestoreVersion = async (version: TemplateVersion) => {
    if (!confirm(`Are you sure you want to restore to version ${version.version}?`)) {
      return;
    }

    try {
      // Create a new version based on the selected one
      await templateService.createTemplateVersion(templateId, {
        ...version,
        version: generateNextVersion(currentVersion || '1.0.0'),
        changeSummary: `Restored from version ${version.version}`,
        isMajorVersion: true
      });
      
      loadVersions();
    } catch (err) {
      setError('Failed to restore version');
    }
  };

  const handleCompareVersions = () => {
    if (compareVersions.length === 2) {
      // Open comparison view
      console.log('Compare versions:', compareVersions);
    }
  };

  const generateNextVersion = (currentVer: string): string => {
    const parts = currentVer.split('.').map(Number);
    parts[0] += 1; // Increment major version
    parts[1] = 0;  // Reset minor
    parts[2] = 0;  // Reset patch
    return parts.join('.');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVersionTypeColor = (isMajor: boolean): "default" | "primary" | "secondary" => {
    return isMajor ? 'primary' : 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Version History</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<CompareIcon />}
            onClick={() => setCompareMode(!compareMode)}
            disabled={versions.length < 2}
          >
            Compare Versions
          </Button>
          {compareMode && compareVersions.length === 2 && (
            <Button variant="contained" onClick={handleCompareVersions}>
              Compare Selected
            </Button>
          )}
        </Stack>
      </Stack>

      {versions.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
          No version history available.
        </Typography>
      ) : (
        <Timeline>
          {versions.map((version, index) => (
            <TimelineItem key={version.id}>
              <TimelineSeparator>
                <TimelineDot
                  color={version.version === currentVersion ? 'primary' : 'grey'}
                  sx={{
                    bgcolor: version.isMajorVersion ? 'primary.main' : 'grey.400'
                  }}
                >
                  <HistoryIcon fontSize="small" />
                </TimelineDot>
                {index < versions.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              
              <TimelineContent>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="h6">
                            Version {version.version}
                          </Typography>
                          {version.version === currentVersion && (
                            <Chip label="Current" color="success" size="small" />
                          )}
                          <Chip
                            label={version.isMajorVersion ? 'Major' : 'Minor'}
                            color={getVersionTypeColor(version.isMajorVersion)}
                            size="small"
                          />
                        </Stack>
                        
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(version.createdAt)}
                          {version.creator && ` by ${version.creator.fullName}`}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        {compareMode && (
                          <Button
                            size="small"
                            variant={compareVersions.includes(version) ? 'contained' : 'outlined'}
                            onClick={() => {
                              if (compareVersions.includes(version)) {
                                setCompareVersions(compareVersions.filter(v => v.id !== version.id));
                              } else if (compareVersions.length < 2) {
                                setCompareVersions([...compareVersions, version]);
                              }
                            }}
                            disabled={!compareVersions.includes(version) && compareVersions.length >= 2}
                          >
                            {compareVersions.includes(version) ? 'Selected' : 'Select'}
                          </Button>
                        )}
                        
                        <Tooltip title="View version details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewVersion(version)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {version.version !== currentVersion && (
                          <Tooltip title="Restore this version">
                            <IconButton
                              size="small"
                              onClick={() => handleRestoreVersion(version)}
                            >
                              <RestoreIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Download version">
                          <IconButton size="small">
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>

                    {version.changeSummary && (
                      <Typography variant="body2">
                        <strong>Changes:</strong> {version.changeSummary}
                      </Typography>
                    )}

                    {version.releaseNotes && (
                      <Typography variant="body2">
                        <strong>Release Notes:</strong> {version.releaseNotes}
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      )}

      {/* Version Details Dialog */}
      <Dialog
        open={Boolean(selectedVersion)}
        onClose={() => setSelectedVersion(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Version {selectedVersion?.version} Details
        </DialogTitle>
        <DialogContent>
          {selectedVersion && (
            <Stack spacing={2}>
              <Typography variant="body2">
                <strong>Created:</strong> {formatDate(selectedVersion.createdAt)}
              </Typography>
              
              {selectedVersion.creator && (
                <Typography variant="body2">
                  <strong>Creator:</strong> {selectedVersion.creator.fullName}
                </Typography>
              )}
              
              {selectedVersion.changeSummary && (
                <Typography variant="body2">
                  <strong>Change Summary:</strong> {selectedVersion.changeSummary}
                </Typography>
              )}
              
              {selectedVersion.releaseNotes && (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    <strong>Release Notes:</strong>
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedVersion.releaseNotes}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedVersion(null)}>
            Close
          </Button>
          {selectedVersion?.version !== currentVersion && (
            <Button
              variant="contained"
              onClick={() => {
                if (selectedVersion) {
                  handleRestoreVersion(selectedVersion);
                  setSelectedVersion(null);
                }
              }}
            >
              Restore This Version
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VersionHistory;