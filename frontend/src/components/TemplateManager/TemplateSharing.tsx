/**
 * Template Sharing Component
 * 
 * Share templates with teams and manage access permissions.
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  TextField,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Autocomplete,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Share as ShareIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Email as EmailIcon,
  Group as GroupIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';

import { Template, TemplateAccessLevel } from '../../types/template';

interface TemplateSharingProps {
  template: Template;
  onUpdate: () => void;
}

interface SharedUser {
  id: string;
  email: string;
  fullName: string;
  canEdit: boolean;
  sharedAt: string;
}

interface SharedTeam {
  id: string;
  name: string;
  canEdit: boolean;
  sharedAt: string;
}

const TemplateSharing: React.FC<TemplateSharingProps> = ({
  template,
  onUpdate
}) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareWithEmails, setShareWithEmails] = useState<string[]>([]);
  const [shareWithTeams, setShareWithTeams] = useState<string[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [sharedTeams, setSharedTeams] = useState<SharedTeam[]>([]);
  const [availableTeams] = useState([
    { id: '1', name: 'Clinical Team' },
    { id: '2', name: 'Data Science Team' },
    { id: '3', name: 'Regulatory Affairs' }
  ]);

  const generateShareUrl = () => {
    if (template.accessLevel === TemplateAccessLevel.PUBLIC) {
      return `${window.location.origin}/templates/${template.id}`;
    }
    return ''; // Would generate a secure share link
  };

  const handleShare = async () => {
    try {
      // Implementation would call the sharing API
      console.log('Sharing template:', {
        templateId: template.id,
        emails: shareWithEmails,
        teams: shareWithTeams,
        canEdit,
        message: shareMessage
      });
      
      setShareDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to share template:', error);
    }
  };

  const handleRemoveUserAccess = async (userId: string) => {
    try {
      // Implementation would remove user access
      setSharedUsers(sharedUsers.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Failed to remove user access:', error);
    }
  };

  const handleRemoveTeamAccess = async (teamId: string) => {
    try {
      // Implementation would remove team access
      setSharedTeams(sharedTeams.filter(team => team.id !== teamId));
    } catch (error) {
      console.error('Failed to remove team access:', error);
    }
  };

  const handleToggleUserEdit = async (userId: string, newCanEdit: boolean) => {
    try {
      // Implementation would update user permissions
      setSharedUsers(sharedUsers.map(user => 
        user.id === userId ? { ...user, canEdit: newCanEdit } : user
      ));
    } catch (error) {
      console.error('Failed to update user permissions:', error);
    }
  };

  const handleToggleTeamEdit = async (teamId: string, newCanEdit: boolean) => {
    try {
      // Implementation would update team permissions
      setSharedTeams(sharedTeams.map(team => 
        team.id === teamId ? { ...team, canEdit: newCanEdit } : team
      ));
    } catch (error) {
      console.error('Failed to update team permissions:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could show a toast notification
  };

  const getAccessLevelIcon = (accessLevel: TemplateAccessLevel) => {
    switch (accessLevel) {
      case TemplateAccessLevel.PRIVATE:
        return <LockIcon color="error" />;
      case TemplateAccessLevel.PUBLIC:
        return <PublicIcon color="success" />;
      default:
        return <GroupIcon color="primary" />;
    }
  };

  const getAccessLevelDescription = (accessLevel: TemplateAccessLevel) => {
    switch (accessLevel) {
      case TemplateAccessLevel.PRIVATE:
        return 'Only you can access this template';
      case TemplateAccessLevel.TEAM:
        return 'Team members can access this template';
      case TemplateAccessLevel.ORGANIZATION:
        return 'Organization members can access this template';
      case TemplateAccessLevel.PUBLIC:
        return 'Anyone with the link can access this template';
    }
  };

  return (
    <Box>
      <Stack spacing={3}>
        {/* Current Access Level */}
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            {getAccessLevelIcon(template.accessLevel)}
            <Typography variant="h6">
              {template.accessLevel.charAt(0).toUpperCase() + template.accessLevel.slice(1)} Template
            </Typography>
          </Stack>
          
          <Typography variant="body2" color="text.secondary" mb={2}>
            {getAccessLevelDescription(template.accessLevel)}
          </Typography>

          {template.accessLevel === TemplateAccessLevel.PUBLIC && (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Public Link"
                value={generateShareUrl()}
                size="small"
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
              <Tooltip title="Copy link">
                <IconButton onClick={() => copyToClipboard(generateShareUrl())}>
                  <CopyIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Paper>

        {/* Share Actions */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<ShareIcon />}
            onClick={() => setShareDialogOpen(true)}
          >
            Share Template
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={() => copyToClipboard(generateShareUrl())}
            disabled={template.accessLevel === TemplateAccessLevel.PRIVATE}
          >
            Copy Link
          </Button>
        </Stack>

        {/* Shared Users */}
        {sharedUsers.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Shared with Users ({sharedUsers.length})
            </Typography>
            <List>
              {sharedUsers.map((user, index) => (
                <React.Fragment key={user.id}>
                  <ListItem>
                    <ListItemText
                      primary={user.fullName}
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                          <Chip
                            label={user.canEdit ? 'Can Edit' : 'View Only'}
                            size="small"
                            color={user.canEdit ? 'primary' : 'default'}
                          />
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={user.canEdit}
                              onChange={(e) => handleToggleUserEdit(user.id, e.target.checked)}
                              size="small"
                            />
                          }
                          label="Edit"
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveUserAccess(user.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < sharedUsers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}

        {/* Shared Teams */}
        {sharedTeams.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Shared with Teams ({sharedTeams.length})
            </Typography>
            <List>
              {sharedTeams.map((team, index) => (
                <React.Fragment key={team.id}>
                  <ListItem>
                    <ListItemText
                      primary={team.name}
                      secondary={
                        <Chip
                          label={team.canEdit ? 'Can Edit' : 'View Only'}
                          size="small"
                          color={team.canEdit ? 'primary' : 'default'}
                        />
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={team.canEdit}
                              onChange={(e) => handleToggleTeamEdit(team.id, e.target.checked)}
                              size="small"
                            />
                          }
                          label="Edit"
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveTeamAccess(team.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < sharedTeams.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}

        {/* No sharing yet */}
        {sharedUsers.length === 0 && sharedTeams.length === 0 && (
          <Alert severity="info">
            This template hasn't been shared with anyone yet. Click "Share Template" to grant access to other users or teams.
          </Alert>
        )}
      </Stack>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Template</DialogTitle>
        <DialogContent>
          <Stack spacing={3} pt={1}>
            <Alert severity="info">
              Share this template with specific users or teams to collaborate.
            </Alert>

            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={shareWithEmails}
              onChange={(_, newValue) => setShareWithEmails(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Email Addresses"
                  placeholder="Enter email addresses"
                  helperText="Type email addresses and press Enter"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip {...getTagProps({ index })} key={option} label={option} />
                ))
              }
            />

            <Autocomplete
              multiple
              options={availableTeams}
              getOptionLabel={(option) => option.name}
              value={availableTeams.filter(team => shareWithTeams.includes(team.id))}
              onChange={(_, newValue) => setShareWithTeams(newValue.map(team => team.id))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Teams"
                  placeholder="Select teams"
                />
              )}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={canEdit}
                  onChange={(e) => setCanEdit(e.target.checked)}
                />
              }
              label="Allow editing"
            />

            <TextField
              label="Message (optional)"
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              multiline
              rows={3}
              placeholder="Add a message to include with the share notification"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            variant="contained"
            disabled={shareWithEmails.length === 0 && shareWithTeams.length === 0}
          >
            Share
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateSharing;