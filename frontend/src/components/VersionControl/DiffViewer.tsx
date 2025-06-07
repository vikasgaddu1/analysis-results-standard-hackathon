import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Compare as CompareIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  Code as CodeIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  SwapHoriz as SwapIcon
} from '@mui/icons-material';

import { useVersionControl } from '../../hooks/useVersionControl';

interface DiffViewerProps {
  reportingEventId: string;
}

interface DiffData {
  version1: {
    id: string;
    name: string;
    createdAt: string;
    createdBy?: string;
  };
  version2: {
    id: string;
    name: string;
    createdAt: string;
    createdBy?: string;
  };
  summary: {
    totalChanges: number;
    valuesChanged: number;
    itemsAdded: number;
    itemsRemoved: number;
    typeChanges: number;
    affectedSections: string[];
  };
  detailedChanges: {
    valuesChanged: Record<string, any>;
    iterableItemAdded: Record<string, any>;
    iterableItemRemoved: Record<string, any>;
    dictionaryItemAdded: Record<string, any>;
    dictionaryItemRemoved: Record<string, any>;
    typeChanges: Record<string, any>;
  };
  statistics: Record<string, any>;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ reportingEventId }) => {
  const [version1Id, setVersion1Id] = useState('');
  const [version2Id, setVersion2Id] = useState('');
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [showOnlyChanges, setShowOnlyChanges] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    versions,
    branches,
    fetchVersions,
    compareVersions
  } = useVersionControl(reportingEventId);

  useEffect(() => {
    // Fetch versions from all branches
    branches.forEach(branch => {
      fetchVersions(branch.name);
    });
  }, [reportingEventId, branches]);

  const handleCompare = async () => {
    if (!version1Id || !version2Id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await compareVersions(version1Id, version2Id);
      setDiffData(result);
    } catch (err) {
      setError('Failed to compare versions');
      console.error('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapVersions = () => {
    const temp = version1Id;
    setVersion1Id(version2Id);
    setVersion2Id(temp);
  };

  const renderChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return <AddIcon color="success" fontSize="small" />;
      case 'removed':
        return <RemoveIcon color="error" fontSize="small" />;
      case 'modified':
        return <EditIcon color="warning" fontSize="small" />;
      default:
        return <EditIcon color="primary" fontSize="small" />;
    }
  };

  const renderChangeChip = (changeType: string, count: number) => {
    const colors = {
      added: 'success',
      removed: 'error',
      modified: 'warning'
    } as const;

    return (
      <Chip
        icon={renderChangeIcon(changeType)}
        label={`${count} ${changeType}`}
        size="small"
        color={colors[changeType as keyof typeof colors] || 'default'}
        variant="outlined"
      />
    );
  };

  const renderValueChange = (path: string, change: any) => {
    const isAddition = !change.oldValue && change.newValue;
    const isRemoval = change.oldValue && !change.newValue;
    const isModification = change.oldValue && change.newValue;

    return (
      <Box key={path} sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', mb: 1 }}>
          {path}
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {isRemoval || isModification ? (
            <Box sx={{ 
              p: 1, 
              bgcolor: 'error.50', 
              border: 1, 
              borderColor: 'error.200',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center'
            }}>
              <RemoveIcon color="error" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {JSON.stringify(change.oldValue, null, 2)}
              </Typography>
            </Box>
          ) : null}
          
          {isAddition || isModification ? (
            <Box sx={{ 
              p: 1, 
              bgcolor: 'success.50', 
              border: 1, 
              borderColor: 'success.200',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center'
            }}>
              <AddIcon color="success" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {JSON.stringify(change.newValue, null, 2)}
              </Typography>
            </Box>
          ) : null}
        </Box>
      </Box>
    );
  };

  const renderSummaryTab = () => (
    <Box>
      {diffData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {diffData.summary.totalChanges}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Changes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {diffData.summary.itemsAdded}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Items Added
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {diffData.summary.itemsRemoved}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Items Removed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {diffData.summary.valuesChanged}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Values Changed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Affected Sections */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Affected Sections
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {diffData.summary.affectedSections.map((section) => (
                  <Chip key={section} label={section} variant="outlined" />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Change Types */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Change Breakdown
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {renderChangeChip('added', diffData.summary.itemsAdded)}
                {renderChangeChip('removed', diffData.summary.itemsRemoved)}
                {renderChangeChip('modified', diffData.summary.valuesChanged)}
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );

  const renderDetailedTab = () => (
    <Box>
      {diffData && (
        <>
          {/* Values Changed */}
          {Object.keys(diffData.detailedChanges.valuesChanged).length > 0 && (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Values Changed ({Object.keys(diffData.detailedChanges.valuesChanged).length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {Object.entries(diffData.detailedChanges.valuesChanged).map(([path, change]) =>
                  renderValueChange(path, change)
                )}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Items Added */}
          {Object.keys(diffData.detailedChanges.iterableItemAdded).length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Items Added ({Object.keys(diffData.detailedChanges.iterableItemAdded).length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {Object.entries(diffData.detailedChanges.iterableItemAdded).map(([path, value]) => (
                  <Box key={path} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                      {path}
                    </Typography>
                    <Box sx={{ 
                      p: 1, 
                      bgcolor: 'success.50', 
                      border: 1, 
                      borderColor: 'success.200',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <AddIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {JSON.stringify(value, null, 2)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Items Removed */}
          {Object.keys(diffData.detailedChanges.iterableItemRemoved).length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Items Removed ({Object.keys(diffData.detailedChanges.iterableItemRemoved).length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {Object.entries(diffData.detailedChanges.iterableItemRemoved).map(([path, value]) => (
                  <Box key={path} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                      {path}
                    </Typography>
                    <Box sx={{ 
                      p: 1, 
                      bgcolor: 'error.50', 
                      border: 1, 
                      borderColor: 'error.200',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <RemoveIcon color="error" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {JSON.stringify(value, null, 2)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Type Changes */}
          {Object.keys(diffData.detailedChanges.typeChanges).length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Type Changes ({Object.keys(diffData.detailedChanges.typeChanges).length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {Object.entries(diffData.detailedChanges.typeChanges).map(([path, change]) => (
                  <Box key={path} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                      {path}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Type changed from {change.oldType} to {change.newType}
                    </Typography>
                    {renderValueChange(path, change)}
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>
          )}
        </>
      )}
    </Box>
  );

  const renderRawTab = () => (
    <Box>
      {diffData && (
        <Paper sx={{ p: 2 }}>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(diffData, null, 2)}
          </pre>
        </Paper>
      )}
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Typography variant="h6" gutterBottom>
        Version Comparison
      </Typography>

      {/* Version Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={5}>
              <FormControl fullWidth>
                <InputLabel>Version 1 (From)</InputLabel>
                <Select
                  value={version1Id}
                  onChange={(e) => setVersion1Id(e.target.value)}
                  label="Version 1 (From)"
                >
                  {versions.map((version) => (
                    <MenuItem key={version.id} value={version.id}>
                      {version.versionName} ({new Date(version.createdAt).toLocaleDateString()})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={2} sx={{ textAlign: 'center' }}>
              <IconButton onClick={handleSwapVersions} disabled={!version1Id || !version2Id}>
                <SwapIcon />
              </IconButton>
            </Grid>

            <Grid item xs={12} sm={5}>
              <FormControl fullWidth>
                <InputLabel>Version 2 (To)</InputLabel>
                <Select
                  value={version2Id}
                  onChange={(e) => setVersion2Id(e.target.value)}
                  label="Version 2 (To)"
                >
                  {versions.map((version) => (
                    <MenuItem key={version.id} value={version.id}>
                      {version.versionName} ({new Date(version.createdAt).toLocaleDateString()})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={<CompareIcon />}
              onClick={handleCompare}
              disabled={!version1Id || !version2Id || loading}
            >
              {loading ? 'Comparing...' : 'Compare Versions'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {diffData && !loading && (
        <Card>
          {/* Version Info Header */}
          <CardContent sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Version 1: {diffData.version1.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(diffData.version1.createdAt).toLocaleString()}
                  {diffData.version1.createdBy && ` • ${diffData.version1.createdBy}`}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Version 2: {diffData.version2.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(diffData.version2.createdAt).toLocaleString()}
                  {diffData.version2.createdBy && ` • ${diffData.version2.createdBy}`}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Summary" />
              <Tab label="Detailed Changes" />
              <Tab label="Raw Data" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <CardContent>
            {activeTab === 0 && renderSummaryTab()}
            {activeTab === 1 && renderDetailedTab()}
            {activeTab === 2 && renderRawTab()}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {!diffData && !loading && !error && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CompareIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Select two versions to compare
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose versions from the dropdowns above and click compare
          </Typography>
        </Box>
      )}
    </Box>
  );
};