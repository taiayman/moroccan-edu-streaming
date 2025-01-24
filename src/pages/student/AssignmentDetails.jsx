import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  Upload as UploadIcon,
  Save as SaveIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../api/config';
import { getSubmissionStatus, updateAssignmentStatus } from '../../api/assignments';

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const AssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissionDialog, setSubmissionDialog] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    loadAssignment();
  }, [id]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get assignment details
      const assignmentRef = doc(db, COLLECTIONS.ASSIGNMENTS, id);
      const assignmentSnap = await getDoc(assignmentRef);

      if (!assignmentSnap.exists()) {
        setError('Assignment not found');
        return;
      }

      const assignmentData = {
        id: assignmentSnap.id,
        ...assignmentSnap.data()
      };

      // Get teacher details
      const teacherRef = doc(db, COLLECTIONS.USERS, assignmentData.teacherId);
      const teacherSnap = await getDoc(teacherRef);
      
      if (teacherSnap.exists()) {
        assignmentData.teacher = {
          id: teacherSnap.id,
          ...teacherSnap.data()
        };
      }

      setAssignment(assignmentData);

      // Get submission status
      const status = await getSubmissionStatus(user.id, id);
      setSubmission(status);
      if (status.content) {
        setSubmissionContent(status.content);
      }

    } catch (err) {
      console.error('Error loading assignment:', err);
      setError('Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!submissionContent.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      await updateAssignmentStatus(user.id, id, 'submitted', {
        content: submissionContent,
        submittedAt: new Date()
      });

      setSubmissionDialog(false);
      await loadAssignment();
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setError('Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!assignment) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 3 }}>
          {error || 'Assignment not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f2f0e9',
      pt: '90px',
      pb: 4
    }}>
      <Container maxWidth="xl">
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/student/assignments')}
            sx={{ color: '#bb5c39' }}
          >
            Back to Assignments
          </Button>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(187, 92, 57, 0.1)',
                color: '#bb5c39',
                width: 56,
                height: 56
              }}
            >
              <AssignmentIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {assignment.title}
              </Typography>
              <Stack direction="row" spacing={3} alignItems="center">
                {assignment.teacher && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      src={assignment.teacher.photoURL}
                      sx={{ width: 24, height: 24 }}
                    >
                      {assignment.teacher.displayName?.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {assignment.teacher.displayName}
                    </Typography>
                  </Stack>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Due {formatDate(assignment.dueDate)}
                  </Typography>
                </Box>
                <Chip
                  label={submission?.status === 'submitted' ? 'Submitted' : 'Not Submitted'}
                  size="small"
                  sx={{
                    backgroundColor: submission?.status === 'submitted' 
                      ? 'rgba(76, 175, 80, 0.1)' 
                      : 'rgba(187, 92, 57, 0.1)',
                    color: submission?.status === 'submitted' 
                      ? '#4caf50' 
                      : '#bb5c39',
                    fontWeight: 500
                  }}
                />
                {submission?.grade && (
                  <Chip
                    label={`Grade: ${submission.grade}`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                      color: '#2196f3',
                      fontWeight: 500
                    }}
                  />
                )}
              </Stack>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { md: '1fr 300px' },
            gap: 3,
            mt: 4
          }}
        >
          {/* Main Content */}
          <Box>
            {/* Description */}
            <Box
              sx={{
                position: 'relative',
                mb: 3,
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  right: '-8px',
                  bottom: '-8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '16px',
                  zIndex: 0
                }
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  backgroundColor: '#fff',
                  position: 'relative',
                  zIndex: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translate(-4px, -4px)'
                  }
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {assignment.description || 'No description provided.'}
                </Typography>
              </Paper>
            </Box>

            {/* Assignment Content */}
            <Box
              sx={{
                position: 'relative',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  right: '-8px',
                  bottom: '-8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '16px',
                  zIndex: 0
                }
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  backgroundColor: '#fff',
                  position: 'relative',
                  zIndex: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translate(-4px, -4px)'
                  }
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Assignment Content
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {assignment.content || 'No content provided.'}
                </Typography>
              </Paper>
            </Box>
          </Box>

          {/* Sidebar */}
          <Box>
            {/* Submission Status */}
            <Box
              sx={{
                position: 'relative',
                position: 'sticky',
                top: '100px',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  right: '-8px',
                  bottom: '-8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '16px',
                  zIndex: 0
                }
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  backgroundColor: '#fff',
                  position: 'relative',
                  zIndex: 1,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translate(-4px, -4px)'
                  }
                }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Your Submission
                </Typography>
                {submission?.status === 'submitted' ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Submitted on {formatDate(submission.submittedAt)}
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {submission.content}
                    </Typography>
                    {submission.grade && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Grade
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 600 }}>
                          {submission.grade}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <UploadIcon sx={{ fontSize: 48, color: 'rgba(0, 0, 0, 0.2)', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      You haven't submitted this assignment yet
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => setSubmissionDialog(true)}
                      sx={{
                        backgroundColor: '#bb5c39',
                        '&:hover': { backgroundColor: '#a04b2e' }
                      }}
                    >
                      Submit Now
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>
          </Box>
        </Box>

        {/* Submit Dialog */}
        <Dialog
          open={submissionDialog}
          onClose={() => setSubmissionDialog(false)}
          maxWidth="sm"
          fullWidth
          TransitionProps={{
            enter: true,
            exit: true
          }}
          PaperProps={{
            sx: {
              borderRadius: '20px',
              p: 0,
              backgroundColor: '#fff',
              overflow: 'hidden',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
            }
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #bb5c39 0%, #a04b2e 100%)',
              py: 4,
              px: 3,
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)',
              }
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Submit Assignment
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {assignment.title}
            </Typography>
          </Box>

          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Your Answer"
                variant="outlined"
                multiline
                rows={8}
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Write your answer here..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    '&:hover fieldset': {
                      borderColor: 'rgba(187, 92, 57, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#bb5c39',
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#bb5c39',
                  }
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
            <Button
              onClick={() => setSubmissionDialog(false)}
              variant="outlined"
              sx={{
                borderColor: 'rgba(187, 92, 57, 0.5)',
                color: '#bb5c39',
                px: 3,
                '&:hover': { 
                  backgroundColor: 'rgba(187, 92, 57, 0.05)',
                  borderColor: '#bb5c39'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || !submissionContent.trim()}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              sx={{
                backgroundColor: '#bb5c39',
                px: 4,
                '&:hover': {
                  backgroundColor: '#a04b2e'
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(187, 92, 57, 0.3)'
                }
              }}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AssignmentDetails; 