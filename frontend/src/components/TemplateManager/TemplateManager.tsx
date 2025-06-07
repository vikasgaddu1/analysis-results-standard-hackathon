/**
 * Template Manager Component
 * 
 * Main interface for managing reusable templates across the system.
 * Provides a comprehensive dashboard for creating, browsing, and managing templates.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  LibraryBooks as LibraryIcon,
  Category as CategoryIcon,
  History as HistoryIcon,
  Share as ShareIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

import TemplateLibrary from './TemplateLibrary';
import TemplateEditor from './TemplateEditor';
import CategoryManager from './CategoryManager';
import VersionHistory from './VersionHistory';
import TemplateSharing from './TemplateSharing';
import { useTemplate } from '../../hooks/useTemplate';
import { Template, TemplateType } from '../../types/template';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

interface TemplateManagerProps {
  defaultType?: TemplateType;
  onTemplateSelect?: (template: Template) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({
  defaultType,
  onTemplateSelect
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const {
    templates,
    categories,
    loading,
    error,
    refreshTemplates,
    refreshCategories
  } = useTemplate();

  useEffect(() => {
    refreshTemplates();
    refreshCategories();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedTemplate(null);
    setActiveTab(1); // Switch to editor tab
  };

  const handleSaveTemplate = async (template: Template) => {
    setIsCreating(false);
    setSelectedTemplate(template);
    await refreshTemplates();
    setActiveTab(0); // Return to library
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setSelectedTemplate(null);
    setActiveTab(0);
  };

  if (loading && !templates.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Template Manager
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateNew}
            disabled={isCreating}
          >
            Create New Template
          </Button>
        </Stack>

        {selectedTemplate && (
          <Breadcrumbs aria-label="breadcrumb">
            <Link
              component="button"
              variant="body2"
              onClick={() => setSelectedTemplate(null)}
              underline="hover"
            >
              Templates
            </Link>
            <Typography color="text.primary" variant="body2">
              {selectedTemplate.name}
            </Typography>
          </Breadcrumbs>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="template manager tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label="Library"
              icon={<LibraryIcon />}
              iconPosition="start"
              id="template-tab-0"
              aria-controls="template-tabpanel-0"
            />
            <Tab
              label={isCreating ? "Create Template" : "Edit Template"}
              icon={<AddIcon />}
              iconPosition="start"
              id="template-tab-1"
              aria-controls="template-tabpanel-1"
              disabled={!isCreating && !selectedTemplate}
            />
            <Tab
              label="Categories"
              icon={<CategoryIcon />}
              iconPosition="start"
              id="template-tab-2"
              aria-controls="template-tabpanel-2"
            />
            <Tab
              label="Version History"
              icon={<HistoryIcon />}
              iconPosition="start"
              id="template-tab-3"
              aria-controls="template-tabpanel-3"
              disabled={!selectedTemplate}
            />
            <Tab
              label="Sharing"
              icon={<ShareIcon />}
              iconPosition="start"
              id="template-tab-4"
              aria-controls="template-tabpanel-4"
              disabled={!selectedTemplate}
            />
            {selectedTemplate && (
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>Analytics</span>
                    <Chip 
                      label={selectedTemplate.usageCount || 0} 
                      size="small" 
                      color="primary"
                    />
                  </Stack>
                }
                icon={<AnalyticsIcon />}
                iconPosition="start"
                id="template-tab-5"
                aria-controls="template-tabpanel-5"
              />
            )}
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <TemplateLibrary
              templates={templates}
              categories={categories}
              defaultType={defaultType}
              onTemplateSelect={handleTemplateSelect}
              onRefresh={refreshTemplates}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {(isCreating || selectedTemplate) && (
              <TemplateEditor
                template={selectedTemplate}
                categories={categories}
                onSave={handleSaveTemplate}
                onCancel={handleCancelCreate}
              />
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <CategoryManager
              categories={categories}
              onRefresh={refreshCategories}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            {selectedTemplate && (
              <VersionHistory
                templateId={selectedTemplate.id}
                currentVersion={selectedTemplate.version}
              />
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            {selectedTemplate && (
              <TemplateSharing
                template={selectedTemplate}
                onUpdate={refreshTemplates}
              />
            )}
          </TabPanel>

          {selectedTemplate && (
            <TabPanel value={activeTab} index={5}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Usage Analytics
                </Typography>
                <Stack spacing={2}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Uses
                    </Typography>
                    <Typography variant="h4">
                      {selectedTemplate.usageCount || 0}
                    </Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Average Rating
                    </Typography>
                    <Typography variant="h4">
                      {selectedTemplate.averageRating?.toFixed(1) || 'N/A'}
                    </Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Used
                    </Typography>
                    <Typography variant="body1">
                      {selectedTemplate.lastUsedAt
                        ? new Date(selectedTemplate.lastUsedAt).toLocaleDateString()
                        : 'Never'}
                    </Typography>
                  </Paper>
                </Stack>
              </Box>
            </TabPanel>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default TemplateManager;