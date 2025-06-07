/**
 * Category Manager Component
 * 
 * Manage template categories with tree structure support.
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  TreeView,
  TreeItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon
} from '@mui/icons-material';

import { TemplateCategory } from '../../types/template';
import { templateService } from '../../services/templateService';

interface CategoryManagerProps {
  categories: TemplateCategory[];
  onRefresh: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onRefresh
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TemplateCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    icon: '',
    color: '#1976d2'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const buildCategoryTree = (parentId: string | null = null): TemplateCategory[] => {
    return categories
      .filter(cat => cat.parentId === parentId)
      .sort((a, b) => (a.orderNum || 0) - (b.orderNum || 0));
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      parentId: '',
      icon: '',
      color: '#1976d2'
    });
    setDialogOpen(true);
  };

  const handleEdit = (category: TemplateCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId || '',
      icon: category.icon || '',
      color: category.color || '#1976d2'
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const categoryData = {
        ...formData,
        parentId: formData.parentId || null
      };

      if (editingCategory) {
        await templateService.updateCategory(editingCategory.id, categoryData);
      } else {
        await templateService.createCategory(categoryData);
      }

      setDialogOpen(false);
      onRefresh();
    } catch (err) {
      setError('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await templateService.deleteCategory(categoryId);
      onRefresh();
    } catch (err) {
      setError('Failed to delete category');
    }
  };

  const renderTreeItem = (category: TemplateCategory) => {
    const children = buildCategoryTree(category.id);
    const hasChildren = children.length > 0;

    return (
      <TreeItem
        key={category.id}
        nodeId={category.id}
        label={
          <Stack direction="row" alignItems="center" spacing={1} py={0.5}>
            {hasChildren ? <FolderOpenIcon /> : <FolderIcon />}
            <Typography variant="body2">{category.name}</Typography>
            {category.color && (
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: category.color,
                  borderRadius: '50%'
                }}
              />
            )}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(category);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(category.id);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        }
      >
        {children.map(child => renderTreeItem(child))}
      </TreeItem>
    );
  };

  const rootCategories = buildCategoryTree();

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Template Categories</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add Category
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        {rootCategories.length > 0 ? (
          <TreeView
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
          >
            {rootCategories.map(category => renderTreeItem(category))}
          </TreeView>
        ) : (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
            No categories found. Create your first category to get started.
          </Typography>
        )}
      </Paper>

      {/* Category Form Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Create Category'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            <TextField
              label="Category Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Parent Category</InputLabel>
              <Select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                label="Parent Category"
              >
                <MenuItem value="">None (Root Category)</MenuItem>
                {categories
                  .filter(cat => cat.id !== editingCategory?.id)
                  .map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              label="Icon (Material-UI icon name)"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              fullWidth
              placeholder="e.g., AnalyticsIcon"
            />

            <TextField
              label="Color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryManager;