import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  IconButton
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Grade as GradeIcon
} from '@mui/icons-material';
import { getAssignmentDetails, getSubmissionStatus } from '../../api/assignments';
import { getCurrentLanguage } from '../../utils/navigation';

const AssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [assignmentData, submissionData] = await Promise.all([
          getAssignmentDetails(id),
          getSubmissionStatus(user.id, id)
        ]);
        
        setAssignment(assignmentData);
        setSubmission(submissionData);
        setError(null);
      } catch (err) {
        console.error('Error loading assignment:', err);
        setError(t('errors.assignmentLoad'));
      } finally {
        setLoading(false);
      }
    };

    if (user) loadData();
  }, [id, user]);

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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #1a1f2c 0%, #2d3748 100%)',
        py: 4,
        px: { xs: 2, sm: 4 }
      }}
    >
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box sx={{ 
          mb: 4,
          pt: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: '#4a90e2',
                backgroundColor: 'rgba(74, 144, 226, 0.1)'
              }
            }}
          >
            {t('common.back')}
          </Button>
          <Avatar
            sx={{
              bgcolor: 'rgba(74, 144, 226, 0.1)',
              color: '#4a90e2',
              width: 64,
              height: 64
            }}
          >
            <AssignmentIcon sx={{ fontSize: 32 }} />
          </Avatar>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              backgroundColor: 'rgba(211, 47, 47, 0.1)',
              color: '#ff5252',
              border: '1px solid rgba(211, 47, 47, 0.2)',
              borderRadius: '8px',
              '& .MuiAlert-icon': { color: '#ff5252' }
            }}
          >
            {error}
          </Alert>
        )}

        {/* Main Content */}
        <Grid container spacing={4}>
          {/* Assignment Details */}
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                p: 3,
                borderRadius: '8px',
                backgroundColor: 'rgba(45, 55, 72, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: '#fff',
                  fontWeight: 500,
                  mb: 3,
                  fontFamily: '"Roboto", sans-serif',
                  letterSpacing: '0.5px'
                }}
              >
                {assignment.title}
              </Typography>

              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#4a90e2',
                      mb: 1,
                      fontWeight: 500,
                      letterSpacing: '0.3px'
                    }}
                  >
                    {t('assignment.details.description')}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', whiteSpace: 'pre-wrap' }}>
                    {assignment.description || t('assignment.details.noDescription')}
                  </Typography>
                </Box>

                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />

                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#4a90e2',
                      mb: 1,
                      fontWeight: 500,
                      letterSpacing: '0.3px'
                    }}
                  >
                    {t('assignment.details.requirements')}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', whiteSpace: 'pre-wrap' }}>
                    {assignment.content || t('assignment.details.noContent')}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>

          {/* Submission Status */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                borderRadius: '8px',
                backgroundColor: 'rgba(45, 55, 72, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                position: 'sticky',
                top: 24
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: '#fff',
                  fontWeight: 500,
                  mb: 3,
                  fontFamily: '"Roboto", sans-serif',
                  letterSpacing: '0.3px'
                }}
              >
                {t('assignment.details.yourSubmission')}
              </Typography>

              {submission ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                      {t('assignment.details.status')}
                    </Typography>
                    <Chip
                      label={t(`assignment.status.${submission.status}`)}
                      sx={{
                        backgroundColor: 'rgba(74, 144, 226, 0.1)',
                        color: '#4a90e2',
                        fontWeight: 500
                      }}
                    />
                  </Box>

                  {submission.grade && (
                    <Box>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                        {t('assignment.details.grade')}
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: '#4a90e2', 
                        fontWeight: 500,
                        letterSpacing: '0.5px'
                      }}>
                        {submission.grade}/100
                      </Typography>
                    </Box>
                  )}

                  {submission.feedback && (
                    <Box>
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                        {t('assignment.details.feedback')}
                      </Typography>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          backgroundColor: 'rgba(74, 144, 226, 0.05)',
                          border: '1px solid rgba(74, 144, 226, 0.1)',
                          borderRadius: '4px'
                        }}
                      >
                        <Typography sx={{ 
                          color: 'rgba(255, 255, 255, 0.9)', 
                          fontStyle: 'italic',
                          lineHeight: 1.6
                        }}>
                          "{submission.feedback}"
                        </Typography>
                      </Paper>
                    </Box>
                  )}

                  <Box>
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                      {t('assignment.details.submittedOn')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ color: '#4a90e2', fontSize: 20 }} />
                      <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {new Date(submission.submittedAt).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              ) : (
                <Box
                  sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    backgroundColor: 'rgba(45, 55, 72, 0.5)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 48, mb: 2, color: '#4a90e2', opacity: 0.5 }} />
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {t('assignment.details.notSubmitted')}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AssignmentDetails; 