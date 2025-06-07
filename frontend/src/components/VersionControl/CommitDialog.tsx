import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface CommitDialogProps {
  open: boolean;
  onClose: () => void;
  onCommit: (message: string, changes?: any) => Promise<void>;
  branchName: string;
  changes?: any[];
}

export const CommitDialog: React.FC<CommitDialogProps> = ({
  open,
  onClose,
  onCommit,
  branchName,
  changes = []
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [commitDescription, setCommitDescription] = useState('');
  const [includeChanges, setIncludeChanges] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;

    setLoading(true);
    try {
      const changeData = includeChanges ? {
        summary: commitMessage.trim(),
        description: commitDescription.trim(),
        changes: changes
      } : undefined;

      await onCommit(commitMessage.trim(), changeData);
      
      // Reset form
      setCommitMessage('');
      setCommitDescription('');
      setIncludeChanges(true);
    } catch (error) {
      console.error('Commit failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCommitMessage('');
      setCommitDescription('');
      setIncludeChanges(true);
      onClose();
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return <AddIcon color="success" fontSize="small" />;
      case 'modified':
        return <EditIcon color="warning" fontSize="small" />;
      case 'deleted':
        return <DeleteIcon color="error" fontSize="small" />;
      default:
        return <EditIcon color="primary" fontSize="small" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return 'success';
      case 'modified':
        return 'warning';
      case 'deleted':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">
            Create Commit
          </Typography>
          <Chip label={branchName} size="small" color="primary" />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <TextField
            autoFocus
            fullWidth
            label="Commit Message"
            placeholder="Brief description of changes"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            variant="outlined"
            required
            sx={{ mb: 2 }}
            helperText="Required. Keep it concise and descriptive."
          />

          <TextField
            fullWidth
            label="Extended Description (optional)"
            placeholder="Detailed explanation of the changes and why they were made"
            value={commitDescription}
            onChange={(e) => setCommitDescription(e.target.value)}
            variant="outlined"
            multiline
            rows={3}
            helperText="Optional. Provide more context about the changes."
          />
        </Box>

        {changes && changes.length > 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Changes to Include
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeChanges}
                    onChange={(e) => setIncludeChanges(e.target.checked)}
                  />
                }
                label="Include change details"
              />
            </Box>

            {includeChanges && (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    The following changes will be committed:
                  </Typography>
                </Alert>

                <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                  {changes.map((change, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {getChangeIcon(change.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {change.path || change.field}
                              </Typography>
                              <Chip
                                label={change.type}
                                size="small"
                                color={getChangeColor(change.type)}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            change.description || change.summary || 'No description available'
                          }
                        />
                      </ListItem>
                      {index < changes.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </>
            )}
          </Box>
        )}

        {(!changes || changes.length === 0) && (
          <Alert severity="info" icon={<InfoIcon />}>
            <Typography variant="body2">
              No specific changes detected. This will create a manual commit point.
            </Typography>
          </Alert>
        )}

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Commit Tips:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            • Use present tense: "Add feature" not "Added feature"
            <br />
            • Keep the first line under 72 characters
            <br />
            • Reference issue numbers if applicable
            <br />
            • Explain what and why, not how
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleCommit}
          variant="contained"
          disabled={!commitMessage.trim() || loading}
        >
          {loading ? 'Creating Commit...' : 'Create Commit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};