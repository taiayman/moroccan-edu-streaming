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
import { navigateByRole, getCurrentLanguage } from '../../utils/navigation';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError(t('auth.errors.allFieldsRequired'));
      return false;
    }
    if (formData.password.length < 6) {
      setError(t('auth.errors.passwordLength'));
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
            {t('auth.createAccount')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              fontSize: '1.1rem'
            }}
          >
            {t('auth.createAccountDesc')}
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
              label={t('auth.firstName')}
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
              label={t('auth.lastName')}
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
              label={t('auth.emailAddress')}
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
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t('auth.togglePasswordVisibility')}
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

        <Button
          fullWidth
          variant="contained"
          onClick={handleRegister}
          disabled={loading}
          sx={{
            mt: 3,
            mb: 2,
            py: 1.5,
            backgroundColor: '#bb5c39',
            '&:hover': {
              backgroundColor: '#a04b2e'
            }
          }}
        >
          {loading ? t('auth.registering') : t('auth.register')}
        </Button>

        <Typography variant="body2" align="center" sx={{ mt: 2 }}>
          {t('auth.alreadyHaveAccount')}{' '}
          <Link 
            to={`/${getCurrentLanguage()}/auth/login`}
            style={{ 
              color: '#bb5c39',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            {t('auth.signIn')}
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};

export default RegisterForm;
