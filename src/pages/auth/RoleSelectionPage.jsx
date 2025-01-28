import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert
} from '@mui/material';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../api/config';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentLanguage } from '../../utils/navigation';

const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only redirect if user has a role and is not a new user
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData?.role && !userData?.isNewUser) {
      navigate(`/${getCurrentLanguage()}/${userData.role}/dashboard`);
    }
  }, [navigate]);

  const handleRoleSelection = async (role) => {
    setLoading(true);
    setError('');

    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (!userData?.id) {
        throw new Error('Invalid user session');
      }

      // Update user role in Firestore
      const userRef = doc(db, 'users', userData.id);
      await updateDoc(userRef, {
        role: role,
        isNewUser: false
      });

      // Update local user state
      const updatedUser = { ...userData, role: role, isNewUser: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      await updateUser(updatedUser);

      // Navigate based on selected role
      navigate(`/${getCurrentLanguage()}/${role}/dashboard`);
    } catch (err) {
      console.error('Role selection error:', err);
      setError('Failed to set role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      title: 'Student',
      description: 'Access course materials and participate in classes',
      value: 'student'
    },
    {
      title: 'Teacher',
      description: 'Create and manage courses, conduct live classes',
      value: 'teacher'
    },
    {
      title: 'Parent',
      description: 'Monitor your child\'s progress and performance',
      value: 'parent'
    }
  ];

  return (
    <Container 
      maxWidth={false} 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f2f0e9'
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '800px',
          p: { xs: 3, sm: 6 },
          m: 'auto'
        }}
      >
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700, 
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem' },
              color: '#000'
            }}
          >
            Choose Your Role
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#666',
              fontSize: '1.1rem'
            }}
          >
            Select your role to customize your experience
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              backgroundColor: 'rgba(187, 92, 57, 0.05)',
              color: '#bb5c39',
              '& .MuiAlert-icon': {
                color: '#bb5c39'
              }
            }}
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {roles.map((role) => (
            <Grid item xs={12} md={4} key={role.value}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
                onClick={() => !loading && handleRoleSelection(role.value)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 2,
                      color: '#000'
                    }}
                  >
                    {role.title}
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ color: '#666' }}
                  >
                    {role.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default RoleSelectionPage;
