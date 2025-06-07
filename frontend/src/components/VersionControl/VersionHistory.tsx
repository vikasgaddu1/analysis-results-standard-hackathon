import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Commit as CommitIcon,
  MoreVert as MoreIcon,
  Restore as RestoreIcon,
  Compare as CompareIcon,
  Tag as TagIcon,
  Branch as BranchIcon,
  Merge as MergeIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

import { useVersionControl } from '../../hooks/useVersionControl';

interface Version {
  id: string;
  versionName: string;
  description?: string;
  createdBy?: string;
  createdAt: string;
  isCurrent: boolean;
  isTagged: boolean;
  tagName?: string;
  branchId: string;
}

interface VersionHistoryProps {
  reportingEventId: string;
  branchName: string;
  onBranchChange: (branchName: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  reportingEventId,
  branchName,
  onBranchChange
}) => {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagDescription, setTagDescription] = useState('');
  const [createBackup, setCreateBackup] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');

  const {
    versions,
    branches,
    loading,
    error,
    fetchVersions,
    restoreVersion,
    createTag,
    compareVersions
  } = useVersionControl(reportingEventId);

  useEffect(() => {
    fetchVersions(branchName);
  }, [reportingEventId, branchName]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, version: Version) => {
    setAnchorEl(event.currentTarget);
    setSelectedVersion(version);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVersion(null);
  };

  const handleRestore = async () => {
    if (!selectedVersion) return;

    try {
      await restoreVersion(selectedVersion.id, createBackup);
      setRestoreDialogOpen(false);
      handleMenuClose();
      await fetchVersions(branchName);
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  };

  const handleCreateTag = async () => {
    if (!selectedVersion || !tagName.trim()) return;

    try {
      await createTag({
        versionId: selectedVersion.id,
        name: tagName.trim(),
        description: tagDescription.trim(),
        tagType: 'manual'
      });
      setTagDialogOpen(false);
      setTagName('');
      setTagDescription('');
      handleMenuClose();
      await fetchVersions(branchName);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      setCompareDialogOpen(true);
    }
  };

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      } else {
        return [prev[1], versionId];
      }
    });
  };

  const getVersionIcon = (version: Version) => {
    if (version.isTagged) return <TagIcon />;
    if (version.isCurrent) return <CommitIcon color="primary" />;
    return <CommitIcon />;
  };

  const getVersionColor = (version: Version) => {
    if (version.isCurrent) return 'primary';
    if (version.isTagged) return 'secondary';
    return 'grey';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const renderListView = () => (
    <List>
      {versions.map((version) => (
        <ListItem
          key={version.id}
          selected={selectedVersions.includes(version.id)}
          onClick={() => handleVersionSelect(version.id)}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: getVersionColor(version) }}>
              {getVersionIcon(version)}
            </Avatar>
          </ListItemAvatar>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1">
                  {version.versionName}
                </Typography>
                {version.isCurrent && (
                  <Chip label="Current" size="small" color="primary" />
                )}
                {version.isTagged && version.tagName && (
                  <Chip label={version.tagName} size="small" color="secondary" />
                )}
              </Box>
            }
            secondary={
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {version.description || 'No description'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PersonIcon fontSize="small" />
                    <Typography variant="caption">
                      {version.createdBy || 'Unknown'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarIcon fontSize="small" />
                    <Typography variant="caption">
                      {formatDate(version.createdAt).date} at {formatDate(version.createdAt).time}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            }
          />
          
          <ListItemSecondaryAction>
            <IconButton
              onClick={(e) => handleMenuOpen(e, version)}
              size="small"
            >
              <MoreIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  const renderTimelineView = () => (
    <Timeline position="left">
      {versions.map((version, index) => {
        const { date, time } = formatDate(version.createdAt);
        
        return (
          <TimelineItem key={version.id}>
            <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
              <Typography variant="caption" display="block">
                {date}
              </Typography>
              <Typography variant="caption" display="block">
                {time}
              </Typography>
            </TimelineOppositeContent>
            
            <TimelineSeparator>
              <TimelineDot color={getVersionColor(version)}>
                {getVersionIcon(version)}
              </TimelineDot>
              {index < versions.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            
            <TimelineContent sx={{ py: '12px', px: 2 }}>
              <Box
                sx={{
                  border: 1,
                  borderColor: selectedVersions.includes(version.id) ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  p: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => handleVersionSelect(version.id)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6">
                        {version.versionName}
                      </Typography>
                      {version.isCurrent && (
                        <Chip label="Current" size="small" color="primary" />
                      )}
                      {version.isTagged && version.tagName && (
                        <Chip label={version.tagName} size="small" color="secondary" />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {version.description || 'No description'}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary">
                      By {version.createdBy || 'Unknown'}
                    </Typography>
                  </Box>
                  
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, version);
                    }}
                    size="small"
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>
              </Box>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Version History - {branchName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {versions.length} versions
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Branch</InputLabel>
            <Select
              value={branchName}
              label="Branch"
              onChange={(e) => onBranchChange(e.target.value)}
            >
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.name}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('timeline')}
          >
            Timeline
          </Button>
        </Box>
      </Box>

      {/* Compare Actions */}
      {selectedVersions.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>
              {selectedVersions.length} version{selectedVersions.length !== 1 ? 's' : ''} selected
            </Typography>
            {selectedVersions.length === 2 && (
              <Button
                variant="contained"
                size="small"
                startIcon={<CompareIcon />}
                onClick={handleCompareVersions}
              >
                Compare
              </Button>
            )}
          </Box>
        </Alert>
      )}

      {/* Version List */}
      {versions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No versions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first version to get started
          </Typography>
        </Box>
      ) : (
        viewMode === 'list' ? renderListView() : renderTimelineView()
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            setRestoreDialogOpen(true);
            handleMenuClose();
          }}
          disabled={selectedVersion?.isCurrent}
        >
          <RestoreIcon sx={{ mr: 1 }} />
          Restore Version
        </MenuItem>
        <MenuItem
          onClick={() => {
            setTagDialogOpen(true);
            handleMenuClose();
          }}
          disabled={selectedVersion?.isTagged}
        >
          <TagIcon sx={{ mr: 1 }} />
          Create Tag
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <BranchIcon sx={{ mr: 1 }} />
          Create Branch
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <CompareIcon sx={{ mr: 1 }} />
          Compare with Current
        </MenuItem>
      </Menu>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>Restore Version</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to restore "{selectedVersion?.versionName}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This will replace the current state with the selected version.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <label>
              <input
                type="checkbox"
                checked={createBackup}
                onChange={(e) => setCreateBackup(e.target.checked)}
              />
              Create backup of current state
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRestore} variant="contained" color="warning">
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)}>
        <DialogTitle>Create Tag</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tag Name"
            fullWidth
            variant="outlined"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={tagDescription}
            onChange={(e) => setTagDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTag}
            variant="contained"
            disabled={!tagName.trim()}
          >
            Create Tag
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};