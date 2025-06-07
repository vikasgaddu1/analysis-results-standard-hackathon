import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
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
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  Alert,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Merge as MergeIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  AccountTree as BranchIcon,
  Commit as CommitIcon,
  Compare as CompareIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

import { useVersionControl } from '../../hooks/useVersionControl';

interface Branch {
  id: string;
  name: string;
  description?: string;
  sourceBranchId?: string;
  sourceVersionId?: string;
  createdBy?: string;
  createdAt: string;
  isActive: boolean;
  isProtected: boolean;
  protectionRules?: {
    requireReview?: boolean;
    restrictPush?: boolean;
    requireStatusChecks?: boolean;
  };
}

interface BranchManagerProps {
  reportingEventId: string;
  selectedBranch: string;
  onBranchSelect: (branchName: string) => void;
}

export const BranchManager: React.FC<BranchManagerProps> = ({
  reportingEventId,
  selectedBranch,
  onBranchSelect
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBranchData, setSelectedBranchData] = useState<Branch | null>(null);
  
  // Form state
  const [branchName, setBranchName] = useState('');
  const [branchDescription, setBranchDescription] = useState('');
  const [sourceBranch, setSourceBranch] = useState('main');
  const [protectionEnabled, setProtectionEnabled] = useState(false);
  const [requireReview, setRequireReview] = useState(true);
  const [restrictPush, setRestrictPush] = useState(true);
  const [requireStatusChecks, setRequireStatusChecks] = useState(false);

  const {
    branches,
    loading,
    error,
    fetchBranches,
    createBranch,
    deleteBranch,
    protectBranch,
    unprotectBranch,
    getBranchInfo
  } = useVersionControl(reportingEventId);

  useEffect(() => {
    fetchBranches();
  }, [reportingEventId]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, branch: Branch) => {
    setAnchorEl(event.currentTarget);
    setSelectedBranchData(branch);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBranchData(null);
  };

  const handleCreateBranch = async () => {
    if (!branchName.trim()) return;

    try {
      await createBranch({
        reportingEventId,
        name: branchName.trim(),
        description: branchDescription.trim(),
        sourceBranchName: sourceBranch
      });
      
      setCreateDialogOpen(false);
      setBranchName('');
      setBranchDescription('');
      setSourceBranch('main');
      await fetchBranches();
    } catch (error) {
      console.error('Failed to create branch:', error);
    }
  };

  const handleDeleteBranch = async () => {
    if (!selectedBranchData) return;

    try {
      await deleteBranch(selectedBranchData.name);
      setDeleteDialogOpen(false);
      handleMenuClose();
      await fetchBranches();
      
      // Switch to main if deleting current branch
      if (selectedBranchData.name === selectedBranch) {
        onBranchSelect('main');
      }
    } catch (error) {
      console.error('Failed to delete branch:', error);
    }
  };

  const handleToggleProtection = async () => {
    if (!selectedBranchData) return;

    try {
      if (selectedBranchData.isProtected) {
        await unprotectBranch(selectedBranchData.name);
      } else {
        await protectBranch(selectedBranchData.name, {
          requireReview,
          restrictPush,
          requireStatusChecks
        });
      }
      
      handleMenuClose();
      await fetchBranches();
    } catch (error) {
      console.error('Failed to toggle branch protection:', error);
    }
  };

  const handleUpdateProtection = async () => {
    if (!selectedBranchData) return;

    try {
      await protectBranch(selectedBranchData.name, {
        requireReview,
        restrictPush,
        requireStatusChecks
      });
      
      setSettingsDialogOpen(false);
      handleMenuClose();
      await fetchBranches();
    } catch (error) {
      console.error('Failed to update branch protection:', error);
    }
  };

  const getStatusChip = (branch: Branch) => {
    if (!branch.isActive) {
      return <Chip label="Inactive" size="small" color="default" />;
    }
    if (branch.name === selectedBranch) {
      return <Chip label="Current" size="small" color="primary" />;
    }
    if (branch.isProtected) {
      return <Chip label="Protected" size="small" color="warning" />;
    }
    return <Chip label="Active" size="small" color="success" />;
  };

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
        <Typography variant="h6">
          Branch Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Branch
        </Button>
      </Box>

      {/* Branch Grid */}
      <Grid container spacing={3}>
        {branches.map((branch) => (
          <Grid item xs={12} md={6} lg={4} key={branch.id}>
            <Card
              sx={{
                height: '100%',
                border: branch.name === selectedBranch ? 2 : 1,
                borderColor: branch.name === selectedBranch ? 'primary.main' : 'divider',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 3
                }
              }}
              onClick={() => onBranchSelect(branch.name)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BranchIcon color="primary" />
                    <Typography variant="h6" component="div">
                      {branch.name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, branch);
                    }}
                  >
                    <MoreIcon />
                  </IconButton>
                </Box>

                {getStatusChip(branch)}

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                  {branch.description || 'No description'}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Created: {new Date(branch.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    By: {branch.createdBy || 'Unknown'}
                  </Typography>
                </Box>

                {branch.isProtected && (
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      icon={<LockIcon />}
                      label="Protected"
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  </Box>
                )}
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<MergeIcon />}
                  disabled={branch.name === 'main'}
                >
                  Merge
                </Button>
                <Button
                  size="small"
                  startIcon={<CompareIcon />}
                >
                  Compare
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            setSettingsDialogOpen(true);
            handleMenuClose();
          }}
        >
          <SettingsIcon sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <MenuItem onClick={handleToggleProtection}>
          {selectedBranchData?.isProtected ? (
            <LockOpenIcon sx={{ mr: 1 }} />
          ) : (
            <LockIcon sx={{ mr: 1 }} />
          )}
          {selectedBranchData?.isProtected ? 'Unprotect' : 'Protect'}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          disabled={selectedBranchData?.name === 'main'}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Branch Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Branch</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Branch Name"
            fullWidth
            variant="outlined"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={branchDescription}
            onChange={(e) => setBranchDescription(e.target.value)}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel>Source Branch</InputLabel>
            <Select
              value={sourceBranch}
              onChange={(e) => setSourceBranch(e.target.value)}
              label="Source Branch"
            >
              {branches.filter(b => b.isActive).map((branch) => (
                <MenuItem key={branch.id} value={branch.name}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={protectionEnabled}
                onChange={(e) => setProtectionEnabled(e.target.checked)}
              />
            }
            label="Enable branch protection"
          />

          {protectionEnabled && (
            <Box sx={{ mt: 2, pl: 2, borderLeft: 3, borderColor: 'warning.main' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={requireReview}
                    onChange={(e) => setRequireReview(e.target.checked)}
                  />
                }
                label="Require review before merging"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={restrictPush}
                    onChange={(e) => setRestrictPush(e.target.checked)}
                  />
                }
                label="Restrict direct pushes"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={requireStatusChecks}
                    onChange={(e) => setRequireStatusChecks(e.target.checked)}
                  />
                }
                label="Require status checks"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateBranch}
            variant="contained"
            disabled={!branchName.trim()}
          >
            Create Branch
          </Button>
        </DialogActions>
      </Dialog>

      {/* Branch Settings Dialog */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Branch Settings - {selectedBranchData?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Protection Rules
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={requireReview}
                onChange={(e) => setRequireReview(e.target.checked)}
              />
            }
            label="Require review before merging"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={restrictPush}
                onChange={(e) => setRestrictPush(e.target.checked)}
              />
            }
            label="Restrict direct pushes"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={requireStatusChecks}
                onChange={(e) => setRequireStatusChecks(e.target.checked)}
              />
            }
            label="Require status checks"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateProtection} variant="contained">
            Update Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Branch</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to delete the branch "{selectedBranchData?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone. All versions in this branch will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteBranch} variant="contained" color="error">
            Delete Branch
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};