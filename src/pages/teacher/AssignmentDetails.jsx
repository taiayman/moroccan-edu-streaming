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
  Divider
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { doc, getDoc } from 'firebase/firestore';
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
    } catch (err) {
      console.error('Error loading assignment details:', err);
      setError('Failed to load assignment details');
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
    </Container>
  );
};

export default AssignmentDetails; 