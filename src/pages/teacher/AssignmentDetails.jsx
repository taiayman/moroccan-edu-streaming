import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
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
import { getCurrentLanguage } from '../../utils/navigation';

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const lang = getCurrentLanguage();
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : lang === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const AssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
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
        setError(t('teacherPages.assignmentDetails.errors.notFound'));
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
      setError(t('teacherPages.assignmentDetails.errors.loadFailed'));
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
      setError(t('teacherPages.assignmentDetails.errors.gradingFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress sx={{ color: '#00FFA3' }} />
      </Box>
    );
  }

  if (error || !assignment) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, mt: { xs: 8, sm: 9 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/${getCurrentLanguage()}/teacher/assignments`)}
          sx={{ mb: 2 }}
        >
          {t('teacherPages.assignmentDetails.back')}
        </Button>
        <Alert severity="error">{error || t('teacherPages.assignmentDetails.errors.notFound')}</Alert>
      </Container>
    );
  }

  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)',
          px: { xs: 2, sm: 4 },
          pt: '80px'
        }}
      >
        <Container maxWidth="xl">
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: '#FCA5A5',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                '& .MuiAlert-icon': { color: '#FCA5A5' }
              }}
            >
              {error}
            </Alert>
          )}

          {/* Header Section */}
          <Box sx={{ 
            mb: 4,
            py: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/${getCurrentLanguage()}/teacher/assignments`)}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: '#00FFA3',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {t('teacherPages.assignmentDetails.back')}
            </Button>
            <Avatar
              sx={{
                bgcolor: 'rgba(0, 255, 163, 0.1)',
                color: '#00FFA3',
                width: 64,
                height: 64
              }}
            >
              <AssignmentIcon sx={{ fontSize: 32 }} />
            </Avatar>
          </Box>

          {/* Content Grid */}
          <Grid container spacing={4}>
            {/* Left Column - Description and Content */}
            <Grid item xs={12} lg={8}>
              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: '16px',
                  backgroundColor: 'rgba(45, 55, 72, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    color: '#fff',
                    fontWeight: 600,
                    fontFamily: '"Plus Jakarta Sans", sans-serif'
                  }}
                >
                  {t('teacherPages.assignmentDetails.description')}
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', whiteSpace: 'pre-wrap' }}>
                  {assignment.description || t('teacherPages.assignmentDetails.noDescription')}
                </Typography>
              </Paper>

              <Paper
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  backgroundColor: 'rgba(45, 55, 72, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    color: '#fff',
                    fontWeight: 600,
                    fontFamily: '"Plus Jakarta Sans", sans-serif'
                  }}
                >
                  {t('teacherPages.assignmentDetails.content')}
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', whiteSpace: 'pre-wrap' }}>
                  {assignment.content || t('teacherPages.assignmentDetails.noContent')}
                </Typography>
              </Paper>
            </Grid>

            {/* Right Column - Stats */}
            <Grid item xs={12} lg={4}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  backgroundColor: 'rgba(45, 55, 72, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3, 
                    color: '#fff',
                    fontWeight: 600,
                    fontFamily: '"Plus Jakarta Sans", sans-serif'
                  }}
                >
                  {t('teacherPages.assignmentDetails.submissionStats.title')}
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                      {t('teacherPages.assignmentDetails.submissionStats.total')}
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#00FFA3', fontWeight: 600 }}>
                      {assignment.totalStudents || 0}
                    </Typography>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  <Box>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                      {t('teacherPages.assignmentDetails.submissionStats.submitted')}
                    </Typography>
                    <Typography variant="h4" sx={{ color: '#00FFA3', fontWeight: 600 }}>
                      {assignment.submissions?.length || 0}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Submissions Section */}
          <Box sx={{ mt: 6 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 3, 
                color: '#fff',
                fontWeight: 600,
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}
            >
              {t('teacherPages.assignmentDetails.submissions')} ({submissions.length})
            </Typography>

            <Grid container spacing={3}>
              {submissions.map((submission) => (
                <Grid item xs={12} key={submission.id}>
                  <Paper
                    sx={{
                      p: 3,
                      borderRadius: '16px',
                      backgroundColor: 'rgba(45, 55, 72, 0.3)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 4px 12px rgba(0, 255, 163, 0.1)'
                      }
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            src={submission.student?.photoURL}
                            sx={{ 
                              width: 40, 
                              height: 40,
                              bgcolor: 'rgba(0, 255, 163, 0.1)',
                              color: '#00FFA3'
                            }}
                          >
                            <PersonOutlineIcon />
                          </Avatar>
                          <Box>
                            <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                              {submission.student?.displayName || t('teacherPages.assignmentDetails.unknownStudent')}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <AccessTimeIcon sx={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.5)' }} />
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                {formatDate(submission.submittedAt)}
                              </Typography>
                            </Stack>
                          </Box>
                        </Stack>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                          {submission.content.substring(0, 100)}
                          {submission.content.length > 100 ? '...' : ''}
                        </Typography>
                        {submission.status === 'graded' && (
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <GradeIcon sx={{ fontSize: 16, color: '#00FFA3' }} />
                              <Typography sx={{ color: '#00FFA3' }}>
                                {submission.grade}/100
                              </Typography>
                            </Box>
                            {submission.feedback && (
                              <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
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
                              backgroundColor: '#00FFA3',
                              color: '#0F172A',
                              '&:hover': { 
                                backgroundColor: '#00E68A',
                                transform: 'scale(1.05)'
                              }
                            }}
                          >
                            {submission.grade ? t('teacherPages.assignmentDetails.grading.update') : t('teacherPages.assignmentDetails.grading.grade')}
                          </Button>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}

              {submissions.length === 0 && (
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      borderRadius: '16px',
                      backgroundColor: 'rgba(45, 55, 72, 0.5)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      textAlign: 'center'
                    }}
                  >
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {t('teacherPages.assignmentDetails.noSubmissions')}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Grade Submission Dialog */}
          <Dialog
            open={gradeDialogOpen}
            onClose={() => setGradeDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: '16px',
                backgroundColor: 'rgba(45, 55, 72, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <Box
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                py: 3,
                px: 3,
                color: '#fff'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {t('teacherPages.assignmentDetails.grading.title')}
                </Typography>
                <IconButton
                  onClick={() => setGradeDialogOpen(false)}
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                {selectedSubmission?.student?.displayName}
              </Typography>
            </Box>

            <DialogContent sx={{ p: 3 }}>
              <Stack spacing={3}>
                <TextField
                  label={t('teacherPages.assignmentDetails.grading.grade')}
                  type="number"
                  value={gradeData.grade}
                  onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                  inputProps={{ min: 0, max: 100 }}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      '&:hover fieldset': {
                        borderColor: '#00FFA3'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#00FFA3'
                    }
                  }}
                />
                <TextField
                  label={t('teacherPages.assignmentDetails.grading.feedback')}
                  multiline
                  rows={4}
                  value={gradeData.feedback}
                  onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      '&:hover fieldset': {
                        borderColor: '#00FFA3'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)'
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#00FFA3'
                    }
                  }}
                />
              </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
              <Button
                onClick={() => setGradeDialogOpen(false)}
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: '#00FFA3'
                  }
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleGradeSubmission}
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={loading}
                sx={{
                  backgroundColor: '#00FFA3',
                  color: '#0F172A',
                  '&:hover': { 
                    backgroundColor: '#00E68A'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(0, 255, 163, 0.3)',
                    color: '#fff'
                  }
                }}
              >
                {loading ? t('teacherPages.assignmentDetails.grading.saving') : t('teacherPages.assignmentDetails.grading.save')}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </>
  );
};

export default AssignmentDetails; 