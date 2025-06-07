import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Commit as CommitIcon,
  Merge as MergeIcon,
  Branch as BranchIcon,
  Tag as TagIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

import { useVersionControl } from '../../hooks/useVersionControl';

interface ChangelogEntry {
  id: string;
  action: string;
  description?: string;
  changesSummary: any;
  performedBy?: string;
  performedAt: string;
  versionId?: string;
  branchId?: string;
}

interface ChangelogViewerProps {
  reportingEventId: string;
}

export const ChangelogViewer: React.FC<ChangelogViewerProps> = ({
  reportingEventId
}) => {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [filteredChangelog, setFilteredChangelog] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');
  
  // Filters
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');

  const {
    branches,
    getChangeHistory,
    getUserActivity
  } = useVersionControl(reportingEventId);

  useEffect(() => {
    fetchChangelog();
  }, [reportingEventId]);

  useEffect(() => {
    applyFilters();
  }, [changelog, actionFilter, userFilter, dateFilter, branchFilter]);

  const fetchChangelog = async () => {
    setLoading(true);
    setError(null);

    try {
      const history = await getChangeHistory({
        reportingEventId,
        limit: 100
      });
      setChangelog(history);
    } catch (err) {
      setError('Failed to fetch changelog');
      console.error('Changelog fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...changelog];

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(entry => entry.action === actionFilter);
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(entry => entry.performedBy === userFilter);
    }

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.performedAt);
        return entryDate >= filterDate;
      });
    }

    // Branch filter
    if (branchFilter !== 'all') {
      const branch = branches.find(b => b.name === branchFilter);
      if (branch) {
        filtered = filtered.filter(entry => entry.branchId === branch.id);
      }
    }

    setFilteredChangelog(filtered);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'version_created':
        return <CommitIcon />;
      case 'version_restored':
        return <RestoreIcon />;
      case 'version_deleted':
        return <DeleteIcon />;
      case 'branch_created':
        return <BranchIcon />;
      case 'merge_completed':
        return <MergeIcon />;
      case 'cherry_pick_completed':
        return <CommitIcon />;
      case 'revert_completed':
        return <RestoreIcon />;
      default:
        return <TimelineIcon />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'version_created':
      case 'branch_created':
        return 'success';
      case 'version_deleted':
        return 'error';
      case 'version_restored':
      case 'revert_completed':
        return 'warning';
      case 'merge_completed':
      case 'cherry_pick_completed':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderListView = () => (
    <List>
      {filteredChangelog.map((entry) => (
        <ListItem key={entry.id} divider>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: `${getActionColor(entry.action)}.main` }}>
              {getActionIcon(entry.action)}
            </Avatar>
          </ListItemAvatar>
          
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle1">
                  {entry.description || formatActionName(entry.action)}
                </Typography>
                <Chip
                  label={formatActionName(entry.action)}
                  size="small"
                  color={getActionColor(entry.action)}
                  variant="outlined"
                />
              </Box>
            }
            secondary={
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PersonIcon fontSize="small" />
                    <Typography variant="caption">
                      {entry.performedBy || 'Unknown'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarIcon fontSize="small" />
                    <Typography variant="caption">
                      {new Date(entry.performedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                
                {entry.changesSummary && Object.keys(entry.changesSummary).length > 0 && (
                  <Accordion sx={{ mt: 1, boxShadow: 'none' }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ minHeight: 'auto', '& .MuiAccordionSummary-content': { margin: 0 } }}
                    >
                      <Typography variant="caption" color="primary">
                        View Details
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
                        <pre style={{ fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(entry.changesSummary, null, 2)}
                        </pre>
                      </Paper>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );

  const renderTimelineView = () => (
    <Timeline position="left">
      {filteredChangelog.map((entry, index) => (
        <TimelineItem key={entry.id}>
          <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
            <Typography variant="caption" display="block">
              {new Date(entry.performedAt).toLocaleDateString()}
            </Typography>
            <Typography variant="caption" display="block">
              {new Date(entry.performedAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Typography>
          </TimelineOppositeContent>
          
          <TimelineSeparator>
            <TimelineDot color={getActionColor(entry.action)}>
              {getActionIcon(entry.action)}
            </TimelineDot>
            {index < filteredChangelog.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          
          <TimelineContent sx={{ py: '12px', px: 2 }}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="div">
                    {entry.description || formatActionName(entry.action)}
                  </Typography>
                  <Chip
                    label={formatActionName(entry.action)}
                    size="small"
                    color={getActionColor(entry.action)}
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  By {entry.performedBy || 'Unknown'}
                </Typography>
                
                {entry.changesSummary && Object.keys(entry.changesSummary).length > 0 && (
                  <Accordion sx={{ mt: 1, boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ minHeight: 'auto' }}
                    >
                      <Typography variant="caption" color="primary">
                        Change Details
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
                        <pre style={{ fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(entry.changesSummary, null, 2)}
                        </pre>
                      </Paper>
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );

  const uniqueActions = [...new Set(changelog.map(entry => entry.action))];
  const uniqueUsers = [...new Set(changelog.map(entry => entry.performedBy).filter(Boolean))];

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
          Change History
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
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
          <IconButton onClick={fetchChangelog} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterIcon />
            <Typography variant="subtitle1">Filters</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  label="Action Type"
                >
                  <MenuItem value="all">All Actions</MenuItem>
                  {uniqueActions.map((action) => (
                    <MenuItem key={action} value={action}>
                      {formatActionName(action)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>User</InputLabel>
                <Select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  label="User"
                >
                  <MenuItem value="all">All Users</MenuItem>
                  {uniqueUsers.map((user) => (
                    <MenuItem key={user} value={user}>
                      {user}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Branch</InputLabel>
                <Select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  label="Branch"
                >
                  <MenuItem value="all">All Branches</MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.name}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Since Date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Typography variant="h4" color="primary">
                {filteredChangelog.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Entries
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="h4" color="success.main">
                {filteredChangelog.filter(e => e.action.includes('created')).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Creations
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="h4" color="warning.main">
                {filteredChangelog.filter(e => e.action.includes('merge') || e.action.includes('restored')).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Merges/Restores
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="h4" color="error.main">
                {filteredChangelog.filter(e => e.action.includes('deleted')).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deletions
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Changelog Content */}
      {filteredChangelog.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No changelog entries found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or check back later
          </Typography>
        </Box>
      ) : (
        <Card>
          <CardContent>
            {viewMode === 'list' ? renderListView() : renderTimelineView()}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};