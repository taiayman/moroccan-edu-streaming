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

const AssignmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissionDialog, setSubmissionDialog] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    loadAssignment();
    if (['submitted', 'graded'].includes(submission?.status)) {
      setSubmissionDialog(false);
    }
  }, [id, submission?.status]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      setError(null);

      const assignmentRef = doc(db, COLLECTIONS.ASSIGNMENTS, id);
      const assignmentSnap = await getDoc(assignmentRef);

      if (!assignmentSnap.exists()) {
        setError(t('assignment.assignmentNotFound'));
        return;
      }

      const assignmentData = {
        id: assignmentSnap.id,
        ...assignmentSnap.data()
      };

      const teacherRef = doc(db, COLLECTIONS.USERS, assignmentData.teacherId);
      const teacherSnap = await getDoc(teacherRef);
      
      if (teacherSnap.exists()) {
        assignmentData.teacher = {
          id: teacherSnap.id,
          ...teacherSnap.data()
        };
      }

      setAssignment(assignmentData);

      const status = await getSubmissionStatus(user.id, id);
      setSubmission(status);
      if (status.content) {
        setSubmissionContent(status.content);
      }

    } catch (err) {
      console.error('Error loading assignment:', err);
      setError(t('assignment.failedToLoad'));
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
      setError(t('assignment.failedToSubmit'));
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
          {error || t('assignment.assignmentNotFound')}
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
            onClick={() => navigate(`/${getCurrentLanguage()}/student/assignments`)}
            sx={{ color: '#bb5c39' }}
          >
            {t('assignment.backToAssignments')}
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
                    {t('assignment.due')} {formatDate(assignment.dueDate)}
                  </Typography>
                </Box>
                <Chip
                  label={t(`assignment.status.${submission?.status || 'notSubmitted'}`)}
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
                    label={`${t('assignment.grade')}: ${submission.grade}`}
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
            <Paper
              sx={{
                p: 3,
                borderRadius: '16px',
                mb: 3,
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('assignment.description')}
              </Typography>
              <Typography>
                {assignment.description || t('assignment.noDescription')}
              </Typography>
            </Paper>

            <Paper
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {t('assignment.yourSubmission')}
              </Typography>
              {submission?.status === 'submitted' ? (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('assignment.submittedOn')} {formatDate(submission.submittedAt)}
                  </Typography>
                  <Typography>{submission.content}</Typography>
                </>
              ) : (
                <Typography color="text.secondary">
                  {t('assignment.notSubmitted')}
                </Typography>
              )}
            </Paper>

            {!['submitted', 'graded'].includes(submission?.status) && (
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setSubmissionDialog(true)}
                sx={{
                  mt: 3,
                  backgroundColor: '#bb5c39',
                  '&:hover': {
                    backgroundColor: '#a04f31'
                  }
                }}
              >
                {t('assignment.submitNow')}
              </Button>
            )}
          </Box>
        </Box>

        {/* Submit Dialog */}
        <Dialog
          open={submissionDialog}
          onClose={() => !submitting && setSubmissionDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('assignment.submitAssignment')}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              placeholder={t('assignment.writeAnswer')}
              disabled={submitting}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setSubmissionDialog(false)}
              disabled={submitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!submissionContent.trim() || submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {submitting ? t('assignment.submitting') : t('assignment.submit')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AssignmentDetails; 