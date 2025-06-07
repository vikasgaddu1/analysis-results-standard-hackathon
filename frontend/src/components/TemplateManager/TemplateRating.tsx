/**
 * Template Rating Component
 * 
 * Rate and review templates.
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Rating,
  TextField,
  Button,
  Stack,
  Paper,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ThumbUp as ThumbUpIcon
} from '@mui/icons-material';

import { Template, TemplateRating as TemplateRatingType } from '../../types/template';

interface TemplateRatingProps {
  template: Template;
  onRatingSubmit?: (rating: Partial<TemplateRatingType>) => void;
}

const TemplateRating: React.FC<TemplateRatingProps> = ({
  template,
  onRatingSubmit
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [easeOfUse, setEaseOfUse] = useState<number | null>(null);
  const [documentationQuality, setDocumentationQuality] = useState<number | null>(null);
  const [flexibility, setFlexibility] = useState<number | null>(null);
  const [performance, setPerformance] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Mock data - would come from API
  const ratingsSummary = {
    averageRating: template.averageRating || 0,
    totalRatings: template.ratingCount || 0,
    ratingDistribution: {
      5: 12,
      4: 8,
      3: 3,
      2: 1,
      1: 0
    },
    averageEaseOfUse: 4.2,
    averageDocumentationQuality: 4.0,
    averageFlexibility: 4.5,
    averagePerformance: 4.1,
    recentReviews: [
      {
        id: '1',
        rating: 5,
        review: 'Excellent template, saved me hours of work!',
        user: { fullName: 'John Smith' },
        createdAt: '2023-12-01T10:00:00Z',
        helpfulCount: 3
      },
      {
        id: '2',
        rating: 4,
        review: 'Good template but could use better documentation.',
        user: { fullName: 'Jane Doe' },
        createdAt: '2023-11-28T15:30:00Z',
        helpfulCount: 1
      }
    ]
  };

  const handleSubmitRating = async () => {
    if (userRating === 0) return;

    setSubmitting(true);
    try {
      const ratingData = {
        templateId: template.id,
        rating: userRating,
        review: userReview.trim() || undefined,
        easeOfUse,
        documentationQuality,
        flexibility,
        performance
      };

      if (onRatingSubmit) {
        await onRatingSubmit(ratingData);
      }

      setDialogOpen(false);
      // Reset form
      setUserRating(0);
      setUserReview('');
      setEaseOfUse(null);
      setDocumentationQuality(null);
      setFlexibility(null);
      setPerformance(null);
    } catch (error) {
      console.error('Failed to submit rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingBarValue = (rating: number) => {
    return ratingsSummary.totalRatings > 0
      ? (ratingsSummary.ratingDistribution[rating] || 0) / ratingsSummary.totalRatings * 100
      : 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box>
      <Stack spacing={3}>
        {/* Overall Rating Summary */}
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Stack alignItems="center" spacing={1}>
                <Typography variant="h2" component="div">
                  {ratingsSummary.averageRating.toFixed(1)}
                </Typography>
                <Rating
                  value={ratingsSummary.averageRating}
                  precision={0.1}
                  readOnly
                  size="large"
                />
                <Typography variant="body2" color="text.secondary">
                  {ratingsSummary.totalRatings} reviews
                </Typography>
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Stack spacing={1}>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <Stack key={rating} direction="row" alignItems="center" spacing={2}>
                    <Typography variant="body2" minWidth={20}>
                      {rating}
                    </Typography>
                    <StarIcon fontSize="small" color="action" />
                    <LinearProgress
                      variant="determinate"
                      value={getRatingBarValue(rating)}
                      sx={{ flexGrow: 1, height: 8 }}
                    />
                    <Typography variant="body2" minWidth={30} color="text.secondary">
                      {ratingsSummary.ratingDistribution[rating] || 0}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Detailed Ratings */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detailed Ratings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={6} sm={3}>
              <Stack alignItems="center" spacing={1}>
                <Typography variant="h6">
                  {ratingsSummary.averageEaseOfUse.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Ease of Use
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack alignItems="center" spacing={1}>
                <Typography variant="h6">
                  {ratingsSummary.averageDocumentationQuality.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Documentation
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack alignItems="center" spacing={1}>
                <Typography variant="h6">
                  {ratingsSummary.averageFlexibility.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Flexibility
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack alignItems="center" spacing={1}>
                <Typography variant="h6">
                  {ratingsSummary.averagePerformance.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Performance
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Add Rating Button */}
        <Button
          variant="contained"
          startIcon={<StarIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Rate This Template
        </Button>

        {/* Recent Reviews */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Reviews
          </Typography>
          
          {ratingsSummary.recentReviews.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No reviews yet. Be the first to review this template!
            </Typography>
          ) : (
            <Stack spacing={2}>
              {ratingsSummary.recentReviews.map((review, index) => (
                <React.Fragment key={review.id}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Rating value={review.rating} size="small" readOnly />
                        <Typography variant="body2" fontWeight="medium">
                          {review.user.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(review.createdAt)}
                        </Typography>
                      </Stack>
                      
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <ThumbUpIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {review.helpfulCount}
                        </Typography>
                      </Stack>
                    </Stack>
                    
                    <Typography variant="body2">
                      {review.review}
                    </Typography>
                  </Box>
                  
                  {index < ratingsSummary.recentReviews.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>

      {/* Rating Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rate This Template</DialogTitle>
        <DialogContent>
          <Stack spacing={3} pt={1}>
            <Box>
              <Typography component="legend" gutterBottom>
                Overall Rating *
              </Typography>
              <Rating
                value={userRating}
                onChange={(_, value) => setUserRating(value || 0)}
                size="large"
                emptyIcon={<StarBorderIcon fontSize="inherit" />}
              />
            </Box>

            <TextField
              label="Review (optional)"
              multiline
              rows={4}
              value={userReview}
              onChange={(e) => setUserReview(e.target.value)}
              placeholder="Share your experience with this template..."
              fullWidth
            />

            <Divider />

            <Typography variant="h6">Detailed Ratings (optional)</Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography component="legend" variant="body2" gutterBottom>
                  Ease of Use
                </Typography>
                <Rating
                  value={easeOfUse}
                  onChange={(_, value) => setEaseOfUse(value)}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={6}>
                <Typography component="legend" variant="body2" gutterBottom>
                  Documentation Quality
                </Typography>
                <Rating
                  value={documentationQuality}
                  onChange={(_, value) => setDocumentationQuality(value)}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={6}>
                <Typography component="legend" variant="body2" gutterBottom>
                  Flexibility
                </Typography>
                <Rating
                  value={flexibility}
                  onChange={(_, value) => setFlexibility(value)}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={6}>
                <Typography component="legend" variant="body2" gutterBottom>
                  Performance
                </Typography>
                <Rating
                  value={performance}
                  onChange={(_, value) => setPerformance(value)}
                  size="small"
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitRating}
            variant="contained"
            disabled={userRating === 0 || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateRating;