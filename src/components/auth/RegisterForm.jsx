import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
} from '@mui/icons-material';
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, ROLES } from '../../api/config';
import { createUserProfile, verifyUserRole } from '../../api/users';
import { navigateByRole } from '../../utils/navigation';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: ROLES.STUDENT
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
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Prepare user data
      const firstName = formData.firstName.trim() || 'User';
      const lastName = formData.lastName.trim() || '';
      const displayName = firstName + (lastName ? ` ${lastName}` : '');

      // Update Firebase profile
      await updateProfile(user, {
        displayName
      });

      // Prepare user data for storage
      const userData = {
        email: user.email || '',
        role: formData.role,
        displayName: displayName,
        firstName: firstName,
        lastName: lastName
      };

      // Save to Firestore
      await createUserProfile(user.uid, userData);
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: user.uid,
        ...userData
      }));

      // Navigate to role-specific dashboard
      navigateByRole(navigate, userData.role);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError('');

    try {
      const { user } = await signInWithPopup(auth, googleProvider);

      // Process user data
      const displayName = user.displayName || 'User';
      let firstName = 'User';
      let lastName = '';
      
      if (displayName && displayName !== 'User') {
        const nameParts = displayName.split(' ');
        firstName = nameParts[0] || 'User';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      // Prepare user data for storage
      const userData = {
        email: user.email || '',
        role: formData.role,
        displayName: displayName,
        firstName: firstName,
        lastName: lastName
      };

      // Save to Firestore
      await createUserProfile(user.uid, userData);
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: user.uid,
        ...userData
      }));

      // Navigate to role-specific dashboard
      navigateByRole(navigate, userData.role);
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
        background: '#f2f0e9',
        py: { xs: 4, md: 8 }
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
              fontSize: { xs: '2rem', sm: '2.5rem' }
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
            Fill in your details to get started
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              backgroundColor: 'rgba(211, 47, 47, 0.05)',
              color: '#d32f2f',
              '& .MuiAlert-icon': {
                color: '#d32f2f'
              }
            }}
          >
            {error}
          </Alert>
        )}

        {/* Role Selection */}
        <FormControl 
          fullWidth 
          sx={{ 
            mb: 3,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#fff',
              '& fieldset': {
                borderColor: '#ddd',
              },
              '&:hover fieldset': {
                borderColor: '#000',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#000',
              }
            },
            '& .MuiInputLabel-root.Mui-focused': {
              color: '#000'
            }
          }}
        >
          <InputLabel>Role</InputLabel>
          <Select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <MenuItem value={ROLES.STUDENT}>Student</MenuItem>
            <MenuItem value={ROLES.PARENT}>Parent</MenuItem>
            <MenuItem value={ROLES.TEACHER}>Teacher</MenuItem>
          </Select>
        </FormControl>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  '& fieldset': {
                    borderColor: '#ddd',
                  },
                  '&:hover fieldset': {
                    borderColor: '#000',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000',
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#000'
                }
              }}
            />
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  '& fieldset': {
                    borderColor: '#ddd',
                  },
                  '&:hover fieldset': {
                    borderColor: '#000',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#000',
                  }
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#000'
                }
              }}
            />
          </Box>

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff',
                '& fieldset': {
                  borderColor: '#ddd',
                },
                '&:hover fieldset': {
                  borderColor: '#000',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#000',
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#000'
              }
            }}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: '#666' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff',
                '& fieldset': {
                  borderColor: '#ddd',
                },
                '&:hover fieldset': {
                  borderColor: '#000',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#000',
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#000'
              }
            }}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#fff',
                '& fieldset': {
                  borderColor: '#ddd',
                },
                '&:hover fieldset': {
                  borderColor: '#000',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#000',
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#000'
              }
            }}
          />

          <Box
            sx={{
              position: 'relative',
              mb: 3,
              '&:before': {
                content: '""',
                position: 'absolute',
                top: '6px',
                left: '6px',
                right: '-6px',
                bottom: '-6px',
                backgroundColor: '#666',
                opacity: 0.3,
                borderRadius: '4px',
                zIndex: 0
              }
            }}
          >
            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.75,
                backgroundColor: '#000',
                color: '#fff',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '4px',
                position: 'relative',
                zIndex: 1,
                boxShadow: 'none',
                border: '1px solid #333',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: '#1a1a1a',
                  transform: 'translate(-2px, -2px)',
                  '&:before': {
                    transform: 'translate(2px, 2px)'
                  }
                }
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Create Account'}
            </Button>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignUp}
            sx={{
              py: 1.5,
              color: '#000',
              borderColor: '#ddd',
              backgroundColor: '#fff',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#f5f5f5',
                borderColor: '#ddd'
              }
            }}
          >
            Sign up with Google
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: '#666' }}>
            Already have an account?{' '}
            <Button
              onClick={() => navigate('/auth/login')}
              sx={{ 
                textTransform: 'none',
                color: '#000',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'transparent',
                  textDecoration: 'underline'
                }
              }}
            >
              Sign in
            </Button>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterForm;