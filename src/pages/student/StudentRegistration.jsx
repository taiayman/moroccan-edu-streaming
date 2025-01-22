import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../api/config';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  MenuItem,
  Alert,
} from '@mui/material';

const StudentRegistration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    grade: '',
    dateOfBirth: '',
    parentEmail: '',
    schoolName: '',
    address: '',
    phoneNumber: ''
  });

  useEffect(() => {
    // Redirect if user is not logged in or is not a new user
    if (!user) {
      navigate('/auth/login');
    } else if (!user.isNewUser) {
      navigate('/student/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...formData,
        isNewUser: false,
        registrationCompleted: true,
        updatedAt: new Date().toISOString()
      });

      navigate('/student/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Complete Your Profile
        </Typography>
        <Typography color="text.secondary" mb={4}>
          Please provide additional information to complete your registration
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Grade Level"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                required
              >
                {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'].map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    {grade}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date of Birth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Parent's Email"
                name="parentEmail"
                type="email"
                value={formData.parentEmail}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="School Name"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                multiline
                rows={2}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 2,
                  bgcolor: '#000',
                  '&:hover': { bgcolor: '#333' }
                }}
              >
                {loading ? 'Completing Registration...' : 'Complete Registration'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default StudentRegistration;