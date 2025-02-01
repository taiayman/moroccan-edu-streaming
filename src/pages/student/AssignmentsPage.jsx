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
      background: 'linear-gradient(145deg, #1a1f2c 0%, #2d3748 100%)',
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
          <Typography variant="h4" sx={{ 
            fontWeight: 600, 
            mb: 1,
            color: '#fff',
            fontFamily: '"Roboto", sans-serif',
            letterSpacing: '0.5px'
          }}>
            {t('assignment.myAssignments')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
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
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              zIndex: 0
            }
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '8px',
              bgcolor: 'rgba(45, 55, 72, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              position: 'relative',
              zIndex: 1,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
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
                      backgroundColor: 'rgba(45, 55, 72, 0.9)',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        borderColor: '#4a90e2',
                      },
                      '&.Mui-focused': {
                        borderColor: '#4a90e2',
                        boxShadow: '0 0 0 2px rgba(74, 144, 226, 0.2)'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none'
                      },
                      '& .MuiSelect-select': {
                        color: '#fff',
                        padding: '12px 14px'
                      },
                      '& .MuiSvgIcon-root': {
                        color: '#4a90e2'
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: 'rgba(45, 55, 72, 0.95)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '4px',
                          marginTop: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                        }
                      }
                    }}
                  >
                    {teachers.map((teacher) => (
                      <MenuItem
                        key={teacher.id}
                        value={teacher.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(74, 144, 226, 0.1)'
                          },
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(74, 144, 226, 0.2)'
                          }
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: 'rgba(74, 144, 226, 0.1)',
                              color: '#4a90e2'
                            }}
                          >
                            {teacher.displayName?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ color: '#fff' }}>{teacher.displayName}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {teacher.email}
                            </Typography>
                          </Box>
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
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.3)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4a90e2',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#4a90e2',
                      },
                      '& .MuiInputBase-input': {
                        color: '#fff'
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
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              zIndex: 0
            }
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '8px',
              bgcolor: 'rgba(45, 55, 72, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              position: 'relative',
              zIndex: 1,
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
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
                      borderRadius: '6px',
                      bgcolor: 'rgba(45, 55, 72, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.03)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                    onClick={() => navigate(`/${getCurrentLanguage()}/student/assignments/${assignment.id}`)}
                  >
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                          <Avatar
                            sx={{
                              bgcolor: 'rgba(74, 144, 226, 0.1)',
                              color: '#4a90e2',
                              width: 48,
                              height: 48
                            }}
                          >
                            <AssignmentIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ 
                              mb: 0.5, 
                              color: '#fff',
                              fontWeight: 500,
                              letterSpacing: '0.3px'
                            }}>
                              {assignment.title}
                            </Typography>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.5)' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {t('assignment.due')} {formatDate(assignment.dueDate)}
                                </Typography>
                              </Box>
                              <Chip
                                label={t(`assignment.status.${assignment.status}`)}
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(74, 144, 226, 0.1)',
                                  color: '#4a90e2',
                                  fontWeight: 500
                                }}
                              />
                              {assignment.grade && (
                                <Chip
                                  label={`Grade: ${assignment.grade}`}
                                  size="small"
                                  sx={{
                                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                                    color: '#4a90e2',
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
                              backgroundColor: '#4a90e2',
                              color: '#fff',
                              '&:hover': {
                                backgroundColor: '#357abd'
                              },
                              '&.Mui-disabled': {
                                backgroundColor: 'rgba(74, 144, 226, 0.3)'
                              }
                            }}
                          >
                            {assignment.status === 'graded' ? 'Submission Graded' :
                             assignment.status === 'submitted' ? 'Already Submitted' :
                             'Submit Assignment'}
                          </Button>
                          <Button
                            variant="outlined"
                            sx={{
                              borderColor: 'rgba(74, 144, 226, 0.5)',
                              color: '#4a90e2',
                              '&:hover': { 
                                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                                borderColor: '#4a90e2'
                              }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/${getCurrentLanguage()}/student/assignments/${assignment.id}`);
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
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '6px'
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.2)', mb: 2 }} />
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
          PaperProps={{
            sx: {
              borderRadius: '8px',
              backgroundColor: 'rgba(45, 55, 72, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
              py: 3,
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
            <Typography variant="h5" sx={{ fontWeight: 500, mb: 1, letterSpacing: '0.5px' }}>
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
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: '#fff',
                    '&:hover fieldset': {
                      borderColor: '#4a90e2'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#4a90e2'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
            <Button
              variant="outlined"
              sx={{
                borderColor: 'rgba(74, 144, 226, 0.5)',
                color: '#4a90e2',
                '&:hover': { 
                  backgroundColor: 'rgba(74, 144, 226, 0.1)',
                  borderColor: '#4a90e2'
                }
              }}
              onClick={() => setSubmissionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || !submissionContent.trim()}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              sx={{
                backgroundColor: '#4a90e2',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#357abd'
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(74, 144, 226, 0.3)'
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
