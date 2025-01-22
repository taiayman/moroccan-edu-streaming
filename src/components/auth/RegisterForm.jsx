import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { navigateByRole } from '../../utils/navigation';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('All fields are required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const firstName = formData.firstName.trim() || 'User';
      const lastName = formData.lastName.trim() || '';
      const displayName = firstName + (lastName ? ` ${lastName}` : '');

      await register({
        email: formData.email,
        password: formData.password,
        displayName: displayName,
        firstName: firstName,
        lastName: lastName
      });

      navigate('/auth/role-selection');
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

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
          maxWidth: '480px',
          p: { xs: 3, sm: 6 },
          m: 'auto'
        }}
      >
        <Box sx={{ mb: 5 }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700, 
              mb: 2,
              fontSize: { xs: '2rem', sm: '2.5rem' },
              color: '#000'
            }}
          >
            Create Account
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#666',
              fontSize: '1.1rem'
            }}
          >
            Please fill in your details to create an account
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

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  },
                  '&:hover fieldset': {
                    borderColor: '#000'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000'
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#000'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  },
                  '&:hover fieldset': {
                    borderColor: '#000'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000'
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#000'
                }
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  },
                  '&:hover fieldset': {
                    borderColor: '#000'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000'
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#000'
                }
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  },
                  '&:hover fieldset': {
                    borderColor: '#000'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000'
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#000'
                }
              }}
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            position: 'relative',
            mt: 3,
            mb: 3,
            '&:before': {
              content: '""',
              position: 'absolute',
              top: '6px',
              left: '6px',
              right: '-6px',
              bottom: '-6px',
              backgroundColor: '#bb5c39',
              opacity: 0.1,
              borderRadius: '4px',
              zIndex: 0
            }
          }}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={handleRegister}
            disabled={loading}
            sx={{
              py: 1.75,
              backgroundColor: '#bb5c39',
              color: '#fff',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '4px',
              position: 'relative',
              zIndex: 1,
              boxShadow: 'none',
              border: 'none',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: '#a94f30'
              }
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: '#666' }}>
            Already have an account?{' '}
            <Link 
              to="/auth/login" 
              style={{ 
                textDecoration: 'none',
                color: '#bb5c39',
                fontWeight: 500
              }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterForm;
