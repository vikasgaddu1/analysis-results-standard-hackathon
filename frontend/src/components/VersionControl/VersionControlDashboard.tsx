import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
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
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  AccountTree as BranchIcon,
  MergeType as MergeIcon,
  History as HistoryIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { useVersionControl } from '../../hooks/useVersionControl';
import { VersionHistory } from './VersionHistory';
import { BranchManager } from './BranchManager';
import { MergeInterface } from './MergeInterface';
import { DiffViewer } from './DiffViewer';
import { CommitDialog } from './CommitDialog';

interface VersionControlDashboardProps {
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
      id={`version-control-tabpanel-${index}`}
      aria-labelledby={`version-control-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const VersionControlDashboard: React.FC<VersionControlDashboardProps> = ({
  reportingEventId
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState<string>('main');
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    branches,
    versions,
    mergeRequests,
    currentVersion,
    loading,
    error,
    fetchBranches,
    fetchVersions,
    fetchMergeRequests,
    createVersion,
    createBranch,
    createMergeRequest
  } = useVersionControl(reportingEventId);

  useEffect(() => {
    fetchBranches();
    fetchVersions(selectedBranch);
    fetchMergeRequests();
  }, [reportingEventId, selectedBranch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleBranchChange = (branchName: string) => {
    setSelectedBranch(branchName);
    fetchVersions(branchName);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchBranches(),
        fetchVersions(selectedBranch),
        fetchMergeRequests()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateCommit = async (message: string, changes?: any) => {
    try {
      await createVersion({
        reportingEventId,
        versionName: `Auto-commit ${new Date().toISOString()}`,
        description: message,
        branchName: selectedBranch
      });
      setCommitDialogOpen(false);
      await fetchVersions(selectedBranch);
    } catch (error) {
      console.error('Failed to create commit:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'primary';
      case 'merged': return 'success';
      case 'closed': return 'default';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const activeBranch = branches.find(b => b.name === selectedBranch);
  const openMergeRequests = mergeRequests.filter(mr => mr.status === 'open');
  const conflictedMergeRequests = mergeRequests.filter(mr => mr.hasConflicts);

  if (loading && !branches.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Version Control
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setCommitDialogOpen(true)}
            disabled={!currentVersion}
          >
            Create Commit
          </Button>
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BranchIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Branches</Typography>
              </Box>
              <Typography variant="h4">{branches.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Active: {branches.filter(b => b.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimelineIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Versions</Typography>
              </Box>
              <Typography variant="h4">{versions.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                In {selectedBranch}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MergeIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Merge Requests</Typography>
              </Box>
              <Typography variant="h4">{openMergeRequests.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Open requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <HistoryIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Conflicts</Typography>
              </Box>
              <Typography variant="h4">{conflictedMergeRequests.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Need resolution
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Current Branch Info */}
      {activeBranch && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Current Branch: {activeBranch.name}
                  {activeBranch.isProtected && (
                    <Chip label="Protected" size="small" color="warning" sx={{ ml: 1 }} />
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeBranch.description || 'No description'}
                </Typography>
                {currentVersion && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Latest: {currentVersion.versionName} ({new Date(currentVersion.createdAt).toLocaleDateString()})
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Branch Info">
                  <IconButton size="small">
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Branch Settings">
                  <IconButton size="small">
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="version control tabs">
            <Tab label="Version History" icon={<TimelineIcon />} />
            <Tab label="Branches" icon={<BranchIcon />} />
            <Tab label="Merge Requests" icon={<MergeIcon />} />
            <Tab label="Compare" icon={<HistoryIcon />} />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <VersionHistory
            reportingEventId={reportingEventId}
            branchName={selectedBranch}
            onBranchChange={handleBranchChange}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <BranchManager
            reportingEventId={reportingEventId}
            selectedBranch={selectedBranch}
            onBranchSelect={handleBranchChange}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <MergeInterface
            reportingEventId={reportingEventId}
            selectedBranch={selectedBranch}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <DiffViewer
            reportingEventId={reportingEventId}
          />
        </TabPanel>
      </Card>

      {/* Quick Actions Panel */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <List dense>
            {mergeRequests.slice(0, 3).map((mr) => (
              <ListItem key={mr.id}>
                <ListItemText
                  primary={mr.title}
                  secondary={`${mr.sourceBranchId} → ${mr.targetBranchId} • ${new Date(mr.createdAt).toLocaleDateString()}`}
                />
                <ListItemSecondaryAction>
                  <Chip 
                    label={mr.status} 
                    size="small" 
                    color={getStatusColor(mr.status)} 
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Commit Dialog */}
      <CommitDialog
        open={commitDialogOpen}
        onClose={() => setCommitDialogOpen(false)}
        onCommit={handleCreateCommit}
        branchName={selectedBranch}
      />
    </Box>
  );
};