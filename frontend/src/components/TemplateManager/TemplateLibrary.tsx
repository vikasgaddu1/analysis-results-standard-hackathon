/**
 * Template Library Component
 * 
 * Browse, search, and filter available templates.
 * Provides a grid/list view with filtering capabilities.
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Chip,
  Stack,
  Rating,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Badge,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  Star as StarIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  TrendingUp as TrendingIcon,
  Lock as PrivateIcon,
  Public as PublicIcon,
  Group as TeamIcon,
  Business as OrgIcon
} from '@mui/icons-material';

import { Template, TemplateCategory, TemplateType, TemplateStatus, TemplateAccessLevel } from '../../types/template';
import TemplatePreview from './TemplatePreview';

interface TemplateLibraryProps {
  templates: Template[];
  categories: TemplateCategory[];
  defaultType?: TemplateType;
  onTemplateSelect: (template: Template) => void;
  onRefresh: () => void;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  templates,
  categories,
  defaultType,
  onTemplateSelect,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TemplateType | 'all'>(defaultType || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<TemplateStatus | 'all'>('all');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<TemplateAccessLevel | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'rating' | 'usage'>('created');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({});

  const filteredTemplates = useMemo(() => {
    let filtered = [...templates];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.categoryId === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }

    // Access level filter
    if (selectedAccessLevel !== 'all') {
      filtered = filtered.filter(t => t.accessLevel === selectedAccessLevel);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'usage':
          return (b.usageCount || 0) - (a.usageCount || 0);
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [templates, searchQuery, selectedType, selectedCategory, selectedStatus, selectedAccessLevel, sortBy]);

  const handleMenuOpen = (templateId: string, event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor({ ...menuAnchor, [templateId]: event.currentTarget });
  };

  const handleMenuClose = (templateId: string) => {
    setMenuAnchor({ ...menuAnchor, [templateId]: null });
  };

  const getAccessIcon = (accessLevel: TemplateAccessLevel) => {
    switch (accessLevel) {
      case TemplateAccessLevel.PRIVATE:
        return <PrivateIcon fontSize="small" />;
      case TemplateAccessLevel.TEAM:
        return <TeamIcon fontSize="small" />;
      case TemplateAccessLevel.ORGANIZATION:
        return <OrgIcon fontSize="small" />;
      case TemplateAccessLevel.PUBLIC:
        return <PublicIcon fontSize="small" />;
    }
  };

  const getStatusColor = (status: TemplateStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case TemplateStatus.DRAFT:
        return 'default';
      case TemplateStatus.PUBLISHED:
        return 'success';
      case TemplateStatus.DEPRECATED:
        return 'warning';
      case TemplateStatus.ARCHIVED:
        return 'error';
    }
  };

  const renderTemplateCard = (template: Template) => (
    <Card key={template.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" component="h3" gutterBottom>
            {template.name}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(template.id, e)}
          >
            <MoreIcon />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1} mb={2}>
          <Chip
            label={template.type}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={template.status}
            size="small"
            color={getStatusColor(template.status)}
          />
          <Tooltip title={template.accessLevel}>
            <Chip
              icon={getAccessIcon(template.accessLevel)}
              label=""
              size="small"
              variant="outlined"
            />
          </Tooltip>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {template.description || 'No description available'}
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Rating value={template.averageRating || 0} size="small" readOnly precision={0.5} />
            <Typography variant="caption" color="text.secondary">
              ({template.ratingCount || 0})
            </Typography>
          </Stack>
          
          {template.usageCount > 0 && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <TrendingIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {template.usageCount} uses
              </Typography>
            </Stack>
          )}
        </Stack>

        {template.keywords && template.keywords.length > 0 && (
          <Box mt={2}>
            {template.keywords.slice(0, 3).map((keyword, index) => (
              <Chip
                key={index}
                label={keyword}
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
            {template.keywords.length > 3 && (
              <Chip
                label={`+${template.keywords.length - 3}`}
                size="small"
                sx={{ mb: 0.5 }}
              />
            )}
          </Box>
        )}
      </CardContent>

      <CardActions>
        <Button size="small" onClick={() => setPreviewTemplate(template)}>
          Preview
        </Button>
        <Button size="small" onClick={() => onTemplateSelect(template)}>
          Use Template
        </Button>
      </CardActions>

      <Menu
        anchorEl={menuAnchor[template.id]}
        open={Boolean(menuAnchor[template.id])}
        onClose={() => handleMenuClose(template.id)}
      >
        <MenuItem onClick={() => {
          onTemplateSelect(template);
          handleMenuClose(template.id);
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          // Handle clone
          handleMenuClose(template.id);
        }}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Clone</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          // Handle delete
          handleMenuClose(template.id);
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  );

  return (
    <Box>
      {/* Filters */}
      <Stack spacing={2} mb={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="grid" aria-label="grid view">
              <GridViewIcon />
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              <ListViewIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as TemplateType | 'all')}
              label="Type"
            >
              <MenuItem value="all">All Types</MenuItem>
              {Object.values(TemplateType).map((type) => (
                <MenuItem key={type} value={type}>
                  {type.replace('_', ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as TemplateStatus | 'all')}
              label="Status"
            >
              <MenuItem value="all">All Status</MenuItem>
              {Object.values(TemplateStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Access</InputLabel>
            <Select
              value={selectedAccessLevel}
              onChange={(e) => setSelectedAccessLevel(e.target.value as TemplateAccessLevel | 'all')}
              label="Access"
            >
              <MenuItem value="all">All Access</MenuItem>
              {Object.values(TemplateAccessLevel).map((level) => (
                <MenuItem key={level} value={level}>
                  {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              label="Sort By"
            >
              <MenuItem value="created">Recently Created</MenuItem>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="rating">Highest Rated</MenuItem>
              <MenuItem value="usage">Most Used</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {/* Results */}
      <Typography variant="body2" color="text.secondary" mb={2}>
        {filteredTemplates.length} templates found
      </Typography>

      {viewMode === 'grid' ? (
        <Grid container spacing={2}>
          {filteredTemplates.map((template) => (
            <Grid key={template.id} item xs={12} sm={6} md={4}>
              {renderTemplateCard(template)}
            </Grid>
          ))}
        </Grid>
      ) : (
        <Stack spacing={2}>
          {filteredTemplates.map((template) => renderTemplateCard(template))}
        </Stack>
      )}

      {/* Preview Dialog */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          open={Boolean(previewTemplate)}
          onClose={() => setPreviewTemplate(null)}
          onUse={() => {
            onTemplateSelect(previewTemplate);
            setPreviewTemplate(null);
          }}
        />
      )}
    </Box>
  );
};

export default TemplateLibrary;