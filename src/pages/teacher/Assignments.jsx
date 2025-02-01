import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
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
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogContent,
  DialogActions,
  AvatarGroup,
  Tooltip,
  DialogTitle
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { getTeacherAssignments, createNewAssignment } from '../../api/teacher';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../api/config';
import { getCurrentLanguage } from '../../i18n';

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

const TeacherAssignments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isRTL = getCurrentLanguage() === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [newAssignmentDialog, setNewAssignmentDialog] = useState(false);
  const [newAssignmentData, setNewAssignmentData] = useState({
    title: '',
    description: '',
    content: ''
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: '',
    title: '',
    description: '',
    content: ''
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    loadAssignments();
  }, [user]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        console.error('No user found');
        setError(t('common.error.authRequired'));
        return;
      }

      const data = await getTeacherAssignments(user.id);
      console.log('Loaded assignments for teacher:', data);
      if (data && Array.isArray(data)) {
        setAssignments(data);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError(t('teacherPages.assignments.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      if (!newAssignmentData.title) {
        setError(t('teacherPages.assignments.errors.titleRequired'));
        return;
      }
      
      setLoading(true);
      setError(null);

      const assignmentId = await createNewAssignment({
        ...newAssignmentData,
        teacherId: user.id,
        dueDate: new Date().toISOString()
      });

      console.log('Created assignment with ID:', assignmentId);
      setNewAssignmentDialog(false);
      setNewAssignmentData({
        title: '',
        description: '',
        content: ''
      });
      await loadAssignments();
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError(t('teacherPages.assignments.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      if (!editData.title) {
        setError('Title is required');
        return;
      }
      
      setLoading(true);
      setError(null);

      const assignmentRef = doc(db, COLLECTIONS.ASSIGNMENTS, editData.id);
      await setDoc(assignmentRef, {
        ...editData,
        updatedAt: new Date()
      }, { merge: true });

      setEditDialogOpen(false);
      await loadAssignments();
    } catch (err) {
      console.error('Error updating assignment:', err);
      setError('Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedAssignment) return;
      
      setLoading(true);
      setError(null);

      await deleteDoc(doc(db, COLLECTIONS.ASSIGNMENTS, selectedAssignment.id));
      setDeleteDialogOpen(false);
      await loadAssignments();
    } catch (err) {
      console.error('Error deleting assignment:', err);
      setError('Failed to delete assignment');
      setLoading(false);
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
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)',
        py: 4,
        px: { xs: 2, sm: 4 },
        direction: isRTL ? 'rtl' : 'ltr'
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
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
          pt: 4,
          pb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/${getCurrentLanguage()}/teacher/dashboard`)}
              sx={{ 
                mb: 2,
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {t('teacherPages.assignments.backToDashboard')}
            </Button>
            <Typography 
              variant="h4"
              sx={{ 
                color: '#fff',
                fontWeight: 700,
                mb: 1,
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}
            >
              {t('teacherPages.assignments.title')}
            </Typography>
          </Box>
          <IconButton
            onClick={() => setNewAssignmentDialog(true)}
            sx={{
              backgroundColor: '#00FFA3',
              color: '#0F172A',
              '&:hover': { 
                backgroundColor: '#00E68A',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.2s'
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>

        {/* Search Box */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: '16px',
            backgroundColor: 'rgba(45, 55, 72, 0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <TextField
            fullWidth
            placeholder={t('teacherPages.assignments.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                borderRadius: '8px',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                },
                '&:hover fieldset': {
                  borderColor: '#00FFA3'
                },
                '&.Mui-focused fieldset': {
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
        </Paper>

        {/* Assignments List */}
        <Grid container spacing={3}>
          {filteredAssignments.map((assignment) => (
            <Grid item xs={12} key={assignment.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  backgroundColor: 'rgba(45, 55, 72, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    backgroundColor: 'rgba(45, 55, 72, 0.7)'
                  }
                }}
                onClick={() => navigate(`/${getCurrentLanguage()}/teacher/assignments/${assignment.id}`)}
              >
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(0, 255, 163, 0.1)',
                          color: '#00FFA3'
                        }}
                      >
                        <AssignmentIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                          {assignment.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {t('teacherPages.assignments.created')} {formatDate(assignment.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PeopleIcon sx={{ color: '#00FFA3', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {assignment.submissions?.length || 0} {t('teacherPages.assignments.submissions', { count: assignment.submissions?.length || 0 })}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditData(assignment);
                          setEditDialogOpen(true);
                        }}
                        sx={{
                          color: '#00FFA3',
                          '&:hover': { backgroundColor: 'rgba(0, 255, 163, 0.1)' }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAssignment(assignment);
                          setDeleteDialogOpen(true);
                        }}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': { 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
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
                  px: 3,
                  color: 'rgba(255, 255, 255, 0.7)'
                }}
              >
                <AssignmentIcon
                  sx={{
                    fontSize: 48,
                    color: 'rgba(255, 255, 255, 0.2)',
                    mb: 2
                  }}
                />
                <Typography variant="h6" sx={{ color: '#fff' }} gutterBottom>
                  {t('teacherPages.assignments.noAssignments')}
                </Typography>
                <Typography variant="body2">
                  {t('teacherPages.assignments.empty')}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Dialogs - Update their styles to match the dark theme */}
        {/* Create Assignment Dialog */}
        <Dialog
          open={newAssignmentDialog}
          onClose={() => setNewAssignmentDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              p: 0,
              backgroundColor: 'rgba(45, 55, 72, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }
          }}
        >
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              py: 3,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
              {t('teacherPages.assignments.dialogs.assignment.title')}
            </Typography>
            <IconButton
              onClick={() => setNewAssignmentDialog(false)}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label={t('teacherPages.assignments.dialogs.assignment.form.title')}
                value={newAssignmentData.title}
                onChange={(e) => setNewAssignmentData({ ...newAssignmentData, title: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&:hover fieldset': {
                      borderColor: '#00FFA3'
                    },
                    '&.Mui-focused fieldset': {
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
                fullWidth
                multiline
                rows={4}
                label={t('teacherPages.assignments.dialogs.assignment.form.description')}
                value={newAssignmentData.description}
                onChange={(e) => setNewAssignmentData({ ...newAssignmentData, description: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&:hover fieldset': {
                      borderColor: '#00FFA3'
                    },
                    '&.Mui-focused fieldset': {
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
                fullWidth
                multiline
                rows={6}
                label={t('teacherPages.assignments.dialogs.assignment.form.content')}
                value={newAssignmentData.content}
                onChange={(e) => setNewAssignmentData({ ...newAssignmentData, content: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&:hover fieldset': {
                      borderColor: '#00FFA3'
                    },
                    '&.Mui-focused fieldset': {
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
              onClick={() => setNewAssignmentDialog(false)}
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
              {t('teacherPages.assignments.dialogs.assignment.actions.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateAssignment}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              sx={{
                backgroundColor: '#00FFA3',
                color: '#0F172A',
                '&:hover': { backgroundColor: '#00E68A' },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(0, 255, 163, 0.3)',
                  color: '#fff'
                }
              }}
            >
              {loading ? t('common.loading') : t('teacherPages.assignments.dialogs.assignment.actions.create')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Assignment Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              p: 0,
              backgroundColor: 'rgba(45, 55, 72, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }
          }}
        >
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              py: 3,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                {t('teacherPages.assignments.dialogs.edit.title')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {t('teacherPages.assignments.dialogs.edit.subtitle')}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setEditDialogOpen(false)}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              <TextField
                required
                fullWidth
                label={t('teacherPages.assignments.dialogs.assignment.form.title')}
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                error={error && !editData.title}
                helperText={error && !editData.title ? t('teacherPages.assignments.errors.titleRequired') : ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&:hover fieldset': {
                      borderColor: '#00FFA3'
                    },
                    '&.Mui-focused fieldset': {
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
                fullWidth
                multiline
                rows={4}
                label={t('teacherPages.assignments.dialogs.assignment.form.description')}
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&:hover fieldset': {
                      borderColor: '#00FFA3'
                    },
                    '&.Mui-focused fieldset': {
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
                fullWidth
                multiline
                rows={6}
                label={t('teacherPages.assignments.dialogs.assignment.form.content')}
                value={editData.content}
                onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    },
                    '&:hover fieldset': {
                      borderColor: '#00FFA3'
                    },
                    '&.Mui-focused fieldset': {
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
              onClick={() => setEditDialogOpen(false)}
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
              onClick={handleEdit}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              sx={{
                backgroundColor: '#00FFA3',
                color: '#0F172A',
                '&:hover': { backgroundColor: '#00E68A' },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(0, 255, 163, 0.3)',
                  color: '#fff'
                }
              }}
            >
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: '16px',
              p: 0,
              backgroundColor: 'rgba(45, 55, 72, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }
          }}
        >
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              py: 3,
              px: 3
            }}
          >
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
              {t('teacherPages.assignments.dialogs.delete.title')}
            </Typography>
          </Box>

          <DialogContent sx={{ p: 3 }}>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {t('teacherPages.assignments.dialogs.delete.message')}
            </Typography>
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
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
              onClick={handleDelete}
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: '#ef4444',
                color: '#fff',
                '&:hover': { backgroundColor: '#dc2626' },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(239, 68, 68, 0.3)',
                  color: 'rgba(255, 255, 255, 0.5)'
                }
              }}
            >
              {loading ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default TeacherAssignments;
