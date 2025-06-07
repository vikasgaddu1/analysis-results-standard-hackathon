/**
 * Template Preview Component
 * 
 * Preview templates before using them.
 * Shows template structure, parameters, and metadata.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Lock as PrivateIcon,
  Public as PublicIcon,
  Group as TeamIcon,
  Business as OrgIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { JsonView } from '@mui/x-json-view';

import { Template, TemplateAccessLevel } from '../../types/template';

interface TemplatePreviewProps {
  template: Template;
  open: boolean;
  onClose: () => void;
  onUse?: () => void;
  onClone?: () => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  open,
  onClose,
  onUse,
  onClone
}) => {
  const [expandedPanel, setExpandedPanel] = useState<string>('overview');

  const handlePanelChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedPanel(isExpanded ? panel : '');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getParameterTypeChip = (type: string) => {
    const colors: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
      string: 'default',
      number: 'primary',
      boolean: 'secondary',
      array: 'info',
      object: 'warning'
    };
    return <Chip label={type} size="small" color={colors[type] || 'default'} />;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{template.name}</Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pb: 0 }}>
        <Stack spacing={2}>
          {/* Basic Info */}
          <Accordion
            expanded={expandedPanel === 'overview'}
            onChange={handlePanelChange('overview')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Overview</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Typography variant="body1">
                  {template.description || 'No description available.'}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={template.type} color="primary" size="small" />
                  <Chip label={template.status} color="success" size="small" />
                  <Chip
                    icon={getAccessIcon(template.accessLevel)}
                    label={template.accessLevel}
                    size="small"
                    variant="outlined"
                  />
                  <Chip label={`v${template.version}`} size="small" variant="outlined" />
                </Stack>

                {/* Statistics */}
                <Stack direction="row" spacing={3}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Rating
                      value={template.averageRating || 0}
                      size="small"
                      readOnly
                      precision={0.5}
                    />
                    <Typography variant="body2" color="text.secondary">
                      ({template.ratingCount || 0} reviews)
                    </Typography>
                  </Stack>

                  {template.usageCount > 0 && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <TrendingIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {template.usageCount} uses
                      </Typography>
                    </Stack>
                  )}

                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Created {formatDate(template.createdAt)}
                    </Typography>
                  </Stack>

                  {template.creator && (
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {template.creator.fullName}
                      </Typography>
                    </Stack>
                  )}
                </Stack>

                {/* Keywords */}
                {template.keywords && template.keywords.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Keywords
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {template.keywords.map((keyword, index) => (
                        <Chip key={index} label={keyword} size="small" sx={{ mb: 0.5 }} />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Compliance and Therapeutic Areas */}
                {(template.regulatoryCompliance?.length > 0 || template.therapeuticAreas?.length > 0) && (
                  <Stack spacing={1}>
                    {template.regulatoryCompliance && template.regulatoryCompliance.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Regulatory Compliance
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {template.regulatoryCompliance.map((compliance, index) => (
                            <Chip
                              key={index}
                              label={compliance}
                              size="small"
                              color="info"
                              sx={{ mb: 0.5 }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {template.therapeuticAreas && template.therapeuticAreas.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Therapeutic Areas
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {template.therapeuticAreas.map((area, index) => (
                            <Chip
                              key={index}
                              label={area}
                              size="small"
                              color="secondary"
                              sx={{ mb: 0.5 }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>

          {/* Parameters */}
          {template.parameters && Object.keys(template.parameters).length > 0 && (
            <Accordion
              expanded={expandedPanel === 'parameters'}
              onChange={handlePanelChange('parameters')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Parameters
                  <Chip 
                    label={Object.keys(template.parameters).length} 
                    size="small" 
                    sx={{ ml: 1 }} 
                  />
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Required</TableCell>
                        <TableCell>Default</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(template.parameters).map(([name, config]: [string, any]) => (
                        <TableRow key={name}>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getParameterTypeChip(config.type || 'string')}
                          </TableCell>
                          <TableCell>
                            {config.required ? (
                              <Chip label="Required" size="small" color="error" />
                            ) : (
                              <Chip label="Optional" size="small" variant="outlined" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {config.defaultValue !== undefined
                                ? JSON.stringify(config.defaultValue)
                                : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {config.description || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Content Structure */}
          <Accordion
            expanded={expandedPanel === 'content'}
            onChange={handlePanelChange('content')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Content Structure</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {template.content && Object.keys(template.content).length > 0 ? (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <JsonView value={template.content} />
                </Box>
              ) : (
                <Alert severity="info">
                  No content structure defined for this template.
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Configuration */}
          {template.config && Object.keys(template.config).length > 0 && (
            <Accordion
              expanded={expandedPanel === 'config'}
              onChange={handlePanelChange('config')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Configuration</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <JsonView value={template.config} />
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Recent Ratings */}
          {template.ratings && template.ratings.length > 0 && (
            <Accordion
              expanded={expandedPanel === 'ratings'}
              onChange={handlePanelChange('ratings')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  Recent Reviews
                  <Chip 
                    label={template.ratings.length} 
                    size="small" 
                    sx={{ ml: 1 }} 
                  />
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {template.ratings.slice(0, 3).map((rating, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Rating value={rating.rating} size="small" readOnly />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(rating.createdAt)}
                          </Typography>
                        </Stack>
                        {rating.review && (
                          <Typography variant="body2">
                            {rating.review}
                          </Typography>
                        )}
                        {rating.user && (
                          <Typography variant="caption" color="text.secondary">
                            - {rating.user.fullName}
                          </Typography>
                        )}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Stack direction="row" spacing={1} width="100%" justifyContent="space-between">
          <Stack direction="row" spacing={1}>
            {onClone && (
              <Tooltip title="Clone this template">
                <Button
                  variant="outlined"
                  startIcon={<CopyIcon />}
                  onClick={onClone}
                  size="small"
                >
                  Clone
                </Button>
              </Tooltip>
            )}
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose}>
              Cancel
            </Button>
            {onUse && (
              <Button
                variant="contained"
                onClick={onUse}
              >
                Use Template
              </Button>
            )}
          </Stack>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default TemplatePreview;