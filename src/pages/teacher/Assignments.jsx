import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const TeacherAssignments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
        setError('Authentication required');
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
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      if (!newAssignmentData.title) {
        setError('Title is required');
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
      setError('Failed to create assignment');
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
          onClick={() => navigate('/teacher/dashboard')}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#2f2f2f', mb: 1 }}>
              My Assignments
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage and track your assignments and student submissions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewAssignmentDialog(true)}
            sx={{
              backgroundColor: '#bb5c39',
              '&:hover': { backgroundColor: '#a04b2e' }
            }}
          >
            Create Assignment
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search assignments..."
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
                  onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
                >
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={6}>
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
                                Created {formatDate(assignment.createdAt)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
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
                    <Grid item xs={12} md={3}>
                      {assignment.submissions?.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                            Recent Submissions
                          </Typography>
                          <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                            {assignment.submissions.map((submission, index) => (
                              <Tooltip key={index} title={submission.studentName}>
                                <Avatar
                                  alt={submission.studentName}
                                  src={submission.studentAvatar}
                                  sx={{ width: 32, height: 32 }}
                                />
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditData({
                              id: assignment.id,
                              title: assignment.title,
                              description: assignment.description || '',
                              content: assignment.content || ''
                            });
                            setEditDialogOpen(true);
                          }}
                          sx={{ 
                            color: '#bb5c39',
                            '&:hover': { backgroundColor: 'rgba(187, 92, 57, 0.1)' }
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
                            color: '#bb5c39',
                            '&:hover': { backgroundColor: 'rgba(187, 92, 57, 0.1)' }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                        <Button
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/teacher/assignments/${assignment.id}`);
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
                    {searchQuery ? 'Try adjusting your search' : 'Create your first assignment to get started'}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>

      {/* Create Assignment Dialog */}
      <Dialog
        open={newAssignmentDialog}
        onClose={() => setNewAssignmentDialog(false)}
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
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Create New Assignment
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Add a new assignment for your students
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setNewAssignmentDialog(false)}
              size="small"
              sx={{
                color: 'white',
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mt: 2 }}>
            <TextField
              required
              fullWidth
              label="Assignment Title"
              variant="outlined"
              value={newAssignmentData.title}
              onChange={(e) => setNewAssignmentData({ ...newAssignmentData, title: e.target.value })}
              error={error && !newAssignmentData.title}
              helperText={error && !newAssignmentData.title ? 'Title is required' : ''}
              sx={{
                mb: 3,
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
              fullWidth
              label="Description"
              variant="outlined"
              multiline
              rows={4}
              value={newAssignmentData.description}
              onChange={(e) => setNewAssignmentData({ ...newAssignmentData, description: e.target.value })}
              sx={{
                mb: 3,
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
              fullWidth
              label="Assignment Content"
              variant="outlined"
              multiline
              rows={8}
              placeholder="Write your assignment content here..."
              value={newAssignmentData.content}
              onChange={(e) => setNewAssignmentData({ ...newAssignmentData, content: e.target.value })}
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
            onClick={() => setNewAssignmentDialog(false)}
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
            onClick={handleCreateAssignment}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
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
            {loading ? 'Creating...' : 'Create Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
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
            Edit Assignment
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Update assignment details
          </Typography>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mt: 2 }}>
            <TextField
              required
              fullWidth
              label="Assignment Title"
              variant="outlined"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              error={error && !editData.title}
              helperText={error && !editData.title ? 'Title is required' : ''}
              sx={{
                mb: 3,
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
              fullWidth
              label="Description"
              variant="outlined"
              multiline
              rows={4}
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              sx={{
                mb: 3,
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
              fullWidth
              label="Assignment Content"
              variant="outlined"
              multiline
              rows={8}
              value={editData.content}
              onChange={(e) => setEditData({ ...editData, content: e.target.value })}
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
            onClick={() => setEditDialogOpen(false)}
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
            onClick={handleEdit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
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
            {loading ? 'Saving...' : 'Save Changes'}
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
            p: 2
          }
        }}
      >
        <DialogTitle>Delete Assignment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this assignment? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
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
            onClick={handleDelete}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: '#d32f2f',
              '&:hover': { backgroundColor: '#b71c1c' }
            }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default TeacherAssignments;
