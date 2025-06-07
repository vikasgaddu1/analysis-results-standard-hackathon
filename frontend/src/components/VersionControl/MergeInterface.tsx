import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Merge as MergeIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as AutoIcon,
  Build as ManualIcon,
  Visibility as ViewIcon,
  Compare as CompareIcon
} from '@mui/icons-material';

import { useVersionControl } from '../../hooks/useVersionControl';

interface MergeRequest {
  id: string;
  title: string;
  description?: string;
  sourceBranchId: string;
  targetBranchId: string;
  sourceVersionId: string;
  targetVersionId: string;
  status: string;
  hasConflicts: boolean;
  conflictsData?: any;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface Conflict {
  path: string;
  baseValue: any;
  sourceValue: any;
  targetValue: any;
  conflictType: string;
  autoResolvable: boolean;
  resolutionSuggestions: any[];
}

interface MergeInterfaceProps {
  reportingEventId: string;
  selectedBranch: string;
}

export const MergeInterface: React.FC<MergeInterfaceProps> = ({
  reportingEventId,
  selectedBranch
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [selectedMergeRequest, setSelectedMergeRequest] = useState<MergeRequest | null>(null);
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, any>>({});
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceBranch, setSourceBranch] = useState('');
  const [targetBranch, setTargetBranch] = useState('main');

  const {
    branches,
    mergeRequests,
    loading,
    error,
    fetchBranches,
    fetchMergeRequests,
    createMergeRequest,
    autoMerge,
    manualMerge,
    getConflicts,
    suggestResolutions
  } = useVersionControl(reportingEventId);

  useEffect(() => {
    fetchBranches();
    fetchMergeRequests();
  }, [reportingEventId]);

  const handleCreateMergeRequest = async () => {
    if (!title.trim() || !sourceBranch || !targetBranch) return;

    const sourceBranchData = branches.find(b => b.name === sourceBranch);
    const targetBranchData = branches.find(b => b.name === targetBranch);

    if (!sourceBranchData || !targetBranchData) return;

    try {
      await createMergeRequest({
        title: title.trim(),
        description: description.trim(),
        sourceBranchId: sourceBranchData.id,
        targetBranchId: targetBranchData.id
      });

      setCreateDialogOpen(false);
      setTitle('');
      setDescription('');
      setSourceBranch('');
      setTargetBranch('main');
      await fetchMergeRequests();
    } catch (error) {
      console.error('Failed to create merge request:', error);
    }
  };

  const handleAutoMerge = async (mergeRequestId: string) => {
    try {
      const result = await autoMerge(mergeRequestId);
      if (result.success) {
        await fetchMergeRequests();
      }
    } catch (error) {
      console.error('Auto-merge failed:', error);
    }
  };

  const handleManualMerge = async () => {
    if (!selectedMergeRequest) return;

    const resolutions = Object.entries(conflictResolutions).map(([path, resolution]) => ({
      path,
      resolutionType: resolution.strategy,
      resolvedValue: resolution.value,
      reason: resolution.reason || ''
    }));

    try {
      await manualMerge(selectedMergeRequest.id, resolutions);
      setConflictDialogOpen(false);
      setConflictResolutions({});
      await fetchMergeRequests();
    } catch (error) {
      console.error('Manual merge failed:', error);
    }
  };

  const handleResolveConflict = (path: string, strategy: string, value: any, reason?: string) => {
    setConflictResolutions(prev => ({
      ...prev,
      [path]: { strategy, value, reason }
    }));
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

  const renderConflictResolver = (conflict: Conflict) => {
    const currentResolution = conflictResolutions[conflict.path];

    return (
      <Accordion key={conflict.path}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: currentResolution ? 'success.50' : 'error.50',
            '&:hover': {
              bgcolor: currentResolution ? 'success.100' : 'error.100'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            {currentResolution ? (
              <CheckIcon color="success" fontSize="small" />
            ) : (
              <WarningIcon color="error" fontSize="small" />
            )}
            <Typography sx={{ fontFamily: 'monospace', flexGrow: 1 }}>
              {conflict.path}
            </Typography>
            <Chip
              label={conflict.conflictType}
              size="small"
              color={conflict.autoResolvable ? 'success' : 'error'}
              variant="outlined"
            />
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Grid container spacing={3}>
            {/* Conflict Values */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Conflicting Values:
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                    <Typography variant="caption" color="text.secondary">
                      Base Value
                    </Typography>
                    <pre style={{ fontSize: '12px', margin: '8px 0 0 0' }}>
                      {JSON.stringify(conflict.baseValue, null, 2)}
                    </pre>
                  </Paper>
                </Grid>
                
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
                    <Typography variant="caption" color="text.secondary">
                      Source Value
                    </Typography>
                    <pre style={{ fontSize: '12px', margin: '8px 0 0 0' }}>
                      {JSON.stringify(conflict.sourceValue, null, 2)}
                    </pre>
                  </Paper>
                </Grid>
                
                <Grid item xs={4}>
                  <Paper sx={{ p: 2, bgcolor: 'warning.50' }}>
                    <Typography variant="caption" color="text.secondary">
                      Target Value
                    </Typography>
                    <pre style={{ fontSize: '12px', margin: '8px 0 0 0' }}>
                      {JSON.stringify(conflict.targetValue, null, 2)}
                    </pre>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>

            {/* Resolution Options */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Choose Resolution:
              </Typography>
              
              <RadioGroup
                value={currentResolution?.strategy || ''}
                onChange={(e) => {
                  const strategy = e.target.value;
                  let value;
                  
                  switch (strategy) {
                    case 'keep_source':
                      value = conflict.sourceValue;
                      break;
                    case 'keep_target':
                      value = conflict.targetValue;
                      break;
                    case 'keep_base':
                      value = conflict.baseValue;
                      break;
                    default:
                      value = null;
                  }
                  
                  handleResolveConflict(conflict.path, strategy, value);
                }}
              >
                <FormControlLabel
                  value="keep_source"
                  control={<Radio />}
                  label={`Keep source value (${sourceBranch})`}
                />
                <FormControlLabel
                  value="keep_target"
                  control={<Radio />}
                  label={`Keep target value (${targetBranch})`}
                />
                <FormControlLabel
                  value="keep_base"
                  control={<Radio />}
                  label="Keep base value"
                />
                {conflict.conflictType === 'array_conflict' && (
                  <FormControlLabel
                    value="merge_arrays"
                    control={<Radio />}
                    label="Merge arrays (combine and deduplicate)"
                  />
                )}
                <FormControlLabel
                  value="custom"
                  control={<Radio />}
                  label="Custom value"
                />
              </RadioGroup>

              {currentResolution?.strategy === 'custom' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Custom Value (JSON)"
                  value={currentResolution.customValue || ''}
                  onChange={(e) => {
                    try {
                      const value = JSON.parse(e.target.value);
                      handleResolveConflict(
                        conflict.path,
                        'custom',
                        value,
                        currentResolution.reason
                      );
                    } catch {
                      // Invalid JSON, store as string for now
                      setConflictResolutions(prev => ({
                        ...prev,
                        [conflict.path]: {
                          ...prev[conflict.path],
                          customValue: e.target.value
                        }
                      }));
                    }
                  }}
                  sx={{ mt: 2 }}
                />
              )}

              <TextField
                fullWidth
                label="Resolution Reason (optional)"
                value={currentResolution?.reason || ''}
                onChange={(e) => {
                  if (currentResolution) {
                    handleResolveConflict(
                      conflict.path,
                      currentResolution.strategy,
                      currentResolution.value,
                      e.target.value
                    );
                  }
                }}
                sx={{ mt: 2 }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  const openMergeRequests = mergeRequests.filter(mr => mr.status === 'open');
  const conflictedRequests = mergeRequests.filter(mr => mr.hasConflicts);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Merge Requests
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Merge Request
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {openMergeRequests.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Open Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {conflictedRequests.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                With Conflicts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {mergeRequests.filter(mr => mr.status === 'merged').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Merged
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label={`Open (${openMergeRequests.length})`} />
            <Tab label={`Conflicts (${conflictedRequests.length})`} />
            <Tab label="All Requests" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Open Merge Requests */}
          {activeTab === 0 && (
            <List>
              {openMergeRequests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <MergeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No open merge requests
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a merge request to start merging branches
                  </Typography>
                </Box>
              ) : (
                openMergeRequests.map((mr) => (
                  <ListItem key={mr.id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {mr.title}
                          </Typography>
                          <Chip
                            label={mr.status}
                            size="small"
                            color={getStatusColor(mr.status)}
                          />
                          {mr.hasConflicts && (
                            <Chip
                              label="Conflicts"
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {mr.description || 'No description'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {mr.sourceBranchId} → {mr.targetBranchId} • Created {new Date(mr.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {mr.hasConflicts ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<ManualIcon />}
                            onClick={() => {
                              setSelectedMergeRequest(mr);
                              setConflictDialogOpen(true);
                            }}
                          >
                            Resolve Conflicts
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<AutoIcon />}
                            onClick={() => handleAutoMerge(mr.id)}
                          >
                            Auto Merge
                          </Button>
                        )}
                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              )}
            </List>
          )}

          {/* Conflicted Requests */}
          {activeTab === 1 && (
            <List>
              {conflictedRequests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No conflicts to resolve
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All merge requests are ready for automatic merging
                  </Typography>
                </Box>
              ) : (
                conflictedRequests.map((mr) => (
                  <ListItem key={mr.id} divider>
                    <ListItemText
                      primary={mr.title}
                      secondary={`${mr.sourceBranchId} → ${mr.targetBranchId}`}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<ManualIcon />}
                        onClick={() => {
                          setSelectedMergeRequest(mr);
                          setConflictDialogOpen(true);
                        }}
                      >
                        Resolve {mr.conflictsData?.statistics?.totalConflicts || 0} Conflicts
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              )}
            </List>
          )}

          {/* All Requests */}
          {activeTab === 2 && (
            <List>
              {mergeRequests.map((mr) => (
                <ListItem key={mr.id} divider>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {mr.title}
                        </Typography>
                        <Chip
                          label={mr.status}
                          size="small"
                          color={getStatusColor(mr.status)}
                        />
                      </Box>
                    }
                    secondary={`${mr.sourceBranchId} → ${mr.targetBranchId} • ${new Date(mr.createdAt).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Create Merge Request Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Merge Request</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Source Branch</InputLabel>
                <Select
                  value={sourceBranch}
                  onChange={(e) => setSourceBranch(e.target.value)}
                  label="Source Branch"
                >
                  {branches.filter(b => b.isActive && b.name !== targetBranch).map((branch) => (
                    <MenuItem key={branch.id} value={branch.name}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Target Branch</InputLabel>
                <Select
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  label="Target Branch"
                >
                  {branches.filter(b => b.isActive && b.name !== sourceBranch).map((branch) => (
                    <MenuItem key={branch.id} value={branch.name}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateMergeRequest}
            variant="contained"
            disabled={!title.trim() || !sourceBranch || !targetBranch}
          >
            Create Merge Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Conflict Resolution Dialog */}
      <Dialog
        open={conflictDialogOpen}
        onClose={() => setConflictDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Resolve Conflicts - {selectedMergeRequest?.title}
        </DialogTitle>
        <DialogContent>
          {selectedMergeRequest?.conflictsData?.conflicts && (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {Object.keys(selectedMergeRequest.conflictsData.conflicts).length} conflicts need resolution
                </Typography>
                <Typography variant="body2">
                  Review each conflict below and choose how to resolve it.
                </Typography>
              </Alert>

              {Object.entries(selectedMergeRequest.conflictsData.conflicts).map(([path, conflict]: [string, any]) =>
                renderConflictResolver(conflict)
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConflictDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleManualMerge}
            variant="contained"
            color="success"
            disabled={
              !selectedMergeRequest?.conflictsData?.conflicts ||
              Object.keys(conflictResolutions).length < Object.keys(selectedMergeRequest.conflictsData.conflicts).length
            }
          >
            Complete Merge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};