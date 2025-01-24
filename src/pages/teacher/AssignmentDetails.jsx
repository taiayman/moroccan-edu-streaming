import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Grade as GradeIcon,
  CheckCircle as CheckCircleIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  PersonOutline as PersonOutlineIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../../api/config';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionDetails, setSubmissionDetails] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [gradeData, setGradeData] = useState({ grade: '', feedback: '' });

  useEffect(() => {
    loadAssignmentDetails();
  }, [id]);

  const loadAssignmentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const assignmentRef = doc(db, COLLECTIONS.ASSIGNMENTS, id);
      const assignmentDoc = await getDoc(assignmentRef);
      
      if (!assignmentDoc.exists()) {
        setError('Assignment not found');
        return;
      }

      const data = {
        id: assignmentDoc.id,
        ...assignmentDoc.data()
      };
      setAssignment(data);

      // Fetch submissions
      const submissionsRef = collection(db, 'assignments', id, 'submissions');
      const submissionsSnap = await getDocs(submissionsRef);
      
      const submissionsData = [];
      for (const submissionDoc of submissionsSnap.docs) {
        const submissionData = submissionDoc.data();
        // Get student details
        const studentRef = doc(db, COLLECTIONS.USERS, submissionData.studentId);
        const studentSnap = await getDoc(studentRef);
        
        submissionsData.push({
          id: submissionDoc.id,
          ...submissionData,
          student: studentSnap.exists() ? {
            id: studentSnap.id,
            ...studentSnap.data()
          } : null
        });
      }

      // Sort submissions by date
      submissionsData.sort((a, b) => b.submittedAt - a.submittedAt);
      setSubmissions(submissionsData);

    } catch (err) {
      console.error('Error loading assignment details:', err);
      setError('Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async () => {
    try {
      if (!selectedSubmission) return;

      setLoading(true);
      await updateDoc(
        doc(db, 'assignments', id, 'submissions', selectedSubmission.id),
        {
          grade: Number(gradeData.grade),
          feedback: gradeData.feedback,
          gradedBy: user.id,
          gradedAt: serverTimestamp(),
          status: 'graded'
        }
      );

      // Update assignment stats
      const submissionStats = {
        [`submissionStats.gradedCount`]: increment(1),
      };
      await updateDoc(doc(db, COLLECTIONS.ASSIGNMENTS, id), submissionStats);

      setGradeDialogOpen(false);
      setGradeData({ grade: '', feedback: '' });
      await loadAssignmentDetails();

    } catch (err) {
      console.error('Error grading submission:', err);
      setError('Failed to grade submission');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !assignment) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, mt: { xs: 8, sm: 9 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/assignments')}
          sx={{ mb: 2 }}
        >
          Back to Assignments
        </Button>
        <Alert severity="error">{error || 'Assignment not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, mt: { xs: 8, sm: 9 } }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/teacher/assignments')}
          sx={{ mb: 2 }}
        >
          Back to Assignments
        </Button>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(187, 92, 57, 0.1)',
                  color: '#bb5c39',
                  width: 64,
                  height: 64
                }}
              >
                <AssignmentIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#2f2f2f' }}>
                    {assignment.title}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Created {formatDate(assignment.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PeopleIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {assignment.submissions?.length || 0} submissions
                    </Typography>
                  </Box>
                  <Chip
                    label={assignment.status || 'Active'}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(187, 92, 57, 0.1)',
                      color: '#bb5c39',
                      fontWeight: 500
                    }}
                  />
                </Stack>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
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
              <Typography variant="h6" sx={{ mb: 2, color: '#2f2f2f' }}>
                Description
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', whiteSpace: 'pre-wrap' }}>
                {assignment.description || 'No description provided'}
              </Typography>
            </Paper>
          </Box>

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
              <Typography variant="h6" sx={{ mb: 2, color: '#2f2f2f' }}>
                Assignment Content
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', whiteSpace: 'pre-wrap' }}>
                {assignment.content || 'No content provided'}
              </Typography>
            </Paper>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
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
                },
                position: 'sticky',
                top: { xs: 88, sm: 96 }
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, color: '#2f2f2f' }}>
                Assignment Stats
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Total Students
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#2f2f2f', fontWeight: 600 }}>
                    {assignment.totalStudents || 0}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Submissions
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#2f2f2f', fontWeight: 600 }}>
                    {assignment.submissions?.length || 0}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Status
                  </Typography>
                  <Chip
                    label={assignment.status || 'Active'}
                    sx={{
                      backgroundColor: 'rgba(187, 92, 57, 0.1)',
                      color: '#bb5c39',
                      fontWeight: 500
                    }}
                  />
                </Box>
              </Stack>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Submissions Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 3, color: '#2f2f2f', fontWeight: 600 }}>
          Submissions ({submissions.length})
        </Typography>

        {submissions.length > 0 ? (
          <Grid container spacing={2}>
            {submissions.map((submission) => (
              <Grid item xs={12} key={submission.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    backgroundColor: '#fff',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={submission.student?.photoURL}
                          sx={{ width: 40, height: 40 }}
                        >
                          <PersonOutlineIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {submission.student?.displayName || 'Unknown Student'}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(submission.submittedAt)}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        {submission.content.substring(0, 100)}
                        {submission.content.length > 100 ? '...' : ''}
                      </Typography>
                      {submission.status === 'graded' && (
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <GradeIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                            <Typography variant="body2" color="success.main">
                              Grade: {submission.grade}/100
                            </Typography>
                          </Box>
                          {submission.feedback && (
                            <Typography variant="body2" color="text.secondary">
                              "{submission.feedback}"
                            </Typography>
                          )}
                        </Stack>
                      )}
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          variant="contained"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setGradeData({
                              grade: submission.grade?.toString() || '',
                              feedback: submission.feedback || ''
                            });
                            setGradeDialogOpen(true);
                          }}
                          startIcon={submission.grade ? <GradeIcon /> : <CheckCircleIcon />}
                          sx={{
                            backgroundColor: '#bb5c39',
                            '&:hover': { backgroundColor: '#a04b2e' }
                          }}
                        >
                          {submission.grade ? 'Update Grade' : 'Grade'}
                        </Button>
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: '12px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              backgroundColor: '#fff',
              textAlign: 'center'
            }}
          >
            <Typography color="text.secondary">No submissions yet</Typography>
          </Paper>
        )}
      </Box>

      {/* Grade Submission Dialog */}
      <Dialog
        open={gradeDialogOpen}
        onClose={() => setGradeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
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
            py: 3,
            px: 3,
            color: '#fff'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Grade Submission
            </Typography>
            <IconButton
              onClick={() => setGradeDialogOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            {selectedSubmission?.student?.displayName}
          </Typography>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            <TextField
              label="Grade"
              type="number"
              value={gradeData.grade}
              onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
              inputProps={{ min: 0, max: 100 }}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
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
            <TextField
              label="Feedback"
              multiline
              rows={4}
              value={gradeData.feedback}
              onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
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
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setGradeDialogOpen(false)}
            variant="outlined"
            sx={{
              borderColor: 'rgba(187, 92, 57, 0.5)',
              color: '#bb5c39',
              '&:hover': {
                backgroundColor: 'rgba(187, 92, 57, 0.05)',
                borderColor: '#bb5c39'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGradeSubmission}
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            disabled={loading}
            sx={{
              backgroundColor: '#bb5c39',
              '&:hover': { backgroundColor: '#a04b2e' }
            }}
          >
            {loading ? 'Saving...' : 'Save Grade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AssignmentDetails; 