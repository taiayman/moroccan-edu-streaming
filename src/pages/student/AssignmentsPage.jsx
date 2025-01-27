import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  InputAdornment,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Upload as UploadIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getUpcomingAssignments, getSubmissionStatus, submitAssignment } from '../../api/assignments';
import { getAllTeachers } from '../../api/teacher';
import { getCurrentLanguage } from '../../i18n';
import { useTranslation } from 'react-i18next';

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const AssignmentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionDialog, setSubmissionDialog] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    if (selectedTeacher || !teachers.length) {
      loadAssignments();
    }
  }, [selectedTeacher, user]);

  const loadTeachers = async () => {
    try {
      const teachersData = await getAllTeachers();
      setTeachers(teachersData);
      if (teachersData.length > 0) {
        setSelectedTeacher(teachersData[0].id);
      }
    } catch (err) {
      console.error('Error loading teachers:', err);
      setError('Failed to load teachers');
    }
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        console.error('No user found');
        setError(t('assignment.authRequired'));
        return;
      }

      const assignmentsData = await getUpcomingAssignments(user.id, selectedTeacher);
      
      // Get submission status for each assignment
      const assignmentsWithStatus = await Promise.all(
        assignmentsData.map(async (assignment) => {
          const status = await getSubmissionStatus(user.id, assignment.id);
          return {
            ...assignment,
            status: status.status || 'not_submitted',
            submittedAt: status.submittedAt,
            grade: status.grade
          };
        })
      );

      setAssignments(assignmentsWithStatus);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError(t('assignment.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || !submissionContent.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      await submitAssignment(user.id, selectedAssignment.id, {
        content: submissionContent
      });

      setSubmissionDialog(false);
      setSubmissionContent('');
      await loadAssignments();
    } catch (err) {
      console.error('Error submitting assignment:', err);
      if (err.message === 'You have already submitted this assignment') {
        setError(t('assignment.multipleSubmissionsNotAllowed'));
      } else {
        setError(t('assignment.failedToSubmit'));
      }
      
      if (err.message === 'You have already submitted this assignment') {
        setSubmissionDialog(false);
        await loadAssignments();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
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
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {t('assignment.myAssignments')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('assignment.viewAndSubmit')}
          </Typography>
        </Box>

        {/* Search and Teacher Selection */}
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
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="teacher-select-label">{t('assignment.selectTeacher')}</InputLabel>
                  <Select
                    labelId="teacher-select-label"
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    label={t('assignment.selectTeacher')}
                    startAdornment={
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    }
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(187, 92, 57, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#bb5c39',
                      }
                    }}
                  >
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            src={teacher.photoURL}
                            sx={{ width: 24, height: 24 }}
                          >
                            {teacher.displayName?.charAt(0)}
                          </Avatar>
                          <Typography>{teacher.displayName}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder={t('assignment.searchAssignments')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(187, 92, 57, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#bb5c39',
                      }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Assignments List */}
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
            <Grid container spacing={2}>
              {filteredAssignments.map((assignment) => (
                <Grid item xs={12} key={assignment.id}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => navigate(`/${getCurrentLanguage()}/student/assignments/${assignment.id}`)}
                  >
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                          <Avatar
                            sx={{
                              bgcolor: 'rgba(187, 92, 57, 0.1)',
                              color: '#bb5c39',
                              width: 48,
                              height: 48
                            }}
                          >
                            <AssignmentIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ mb: 0.5, color: '#2f2f2f' }}>
                              {assignment.title}
                            </Typography>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {t('assignment.due')} {formatDate(assignment.dueDate)}
                                </Typography>
                              </Box>
                              <Chip
                                label={t(`assignment.status.${assignment.status}`)}
                                size="small"
                                sx={{
                                  backgroundColor: assignment.status === 'submitted' 
                                    ? 'rgba(76, 175, 80, 0.1)' 
                                    : 'rgba(187, 92, 57, 0.1)',
                                  color: assignment.status === 'submitted' 
                                    ? '#4caf50' 
                                    : '#bb5c39',
                                  fontWeight: 500
                                }}
                              />
                              {assignment.grade && (
                                <Chip
                                  label={`Grade: ${assignment.grade}`}
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
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            variant="contained"
                            startIcon={<UploadIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!['submitted', 'graded'].includes(assignment.status)) {
                                setSelectedAssignment(assignment);
                                setSubmissionDialog(true);
                              }
                            }}
                            disabled={['submitted', 'graded'].includes(assignment.status)}
                            sx={{
                              backgroundColor: ['submitted', 'graded'].includes(assignment.status) ? '#ccc' : '#bb5c39',
                              '&:hover': {
                                backgroundColor: ['submitted', 'graded'].includes(assignment.status) ? '#ccc' : '#a04b2e'
                              },
                              '&.Mui-disabled': {
                                backgroundColor: '#ccc',
                                color: '#666'
                              }
                            }}
                          >
                            {assignment.status === 'graded' ? 'Submission Graded' :
                             assignment.status === 'submitted' ? 'Already Submitted' :
                             'Submit Assignment'}
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/${getCurrentLanguage()}/student/assignments/${assignment.id}`);
                            }}
                            sx={{
                              borderColor: 'rgba(187, 92, 57, 0.5)',
                              color: '#bb5c39',
                              '&:hover': { 
                                backgroundColor: 'rgba(187, 92, 57, 0.05)',
                                borderColor: '#bb5c39'
                              }
                            }}
                          >
                            View Details
                          </Button>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}

              {filteredAssignments.length === 0 && (
                <Grid item xs={12}>
                  <Box 
                    sx={{ 
                      textAlign: 'center', 
                      py: 8,
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      borderRadius: '12px'
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 64, color: 'rgba(0, 0, 0, 0.2)', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No assignments found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchQuery ? 'Try adjusting your search' : 'You have no assignments at the moment'}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Box>

        {/* Submit Assignment Dialog */}
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
              {selectedAssignment?.title}
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

export default AssignmentsPage;
