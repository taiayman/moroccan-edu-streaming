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
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { navigateByRole, getCurrentLanguage } from '../../utils/navigation';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';

// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Add Arabic font
const fontFamily = "'Noto Kufi Arabic', sans-serif";

// Create RTL theme with Arabic font
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: fontFamily,
    h3: {
      fontFamily: fontFamily,
      fontWeight: 600,
    },
    body1: {
      fontFamily: fontFamily,
    },
    button: {
      fontFamily: fontFamily,
      fontWeight: 500,
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap');
        
        body {
          font-family: ${fontFamily};
        }
      `,
    },
  },
});

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
    phoneNumber: '',
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
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.phoneNumber) {
      setError(t('auth.errors.allFieldsRequired'));
      return false;
    }
    if (formData.password.length < 6) {
      setError(t('auth.errors.passwordLength'));
      return false;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError(t('auth.errors.invalidPhone'));
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

      const response = await register({
        email: formData.email,
        password: formData.password,
        displayName: displayName,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: formData.phoneNumber
      });

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify({
        ...response.user,
        firstName,
        lastName,
        displayName,
        phoneNumber: formData.phoneNumber
      }));
      
      navigate(`/${getCurrentLanguage()}/auth/role-selection`);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || t('auth.errors.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <>
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap');
              
              * {
                font-family: ${fontFamily};
              }
            `}
          </style>
          <Container 
            maxWidth={false} 
            sx={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(145deg, #1a1f2c 0%, #2d3748 100%)',
              position: 'relative',
              px: 0
            }}
          >
            {/* App Bar */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: 'rgba(26,32,44,0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                px: 2,
                py: 1.5,
                borderRadius: 0
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontFamily }}>
                  {t('auth.createAccount')}
                </Typography>
              </Box>
            </Paper>

            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              sx={{
                width: '100%',
                maxWidth: '420px',
                mx: 'auto',
                px: 2,
                py: 4,
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.95rem',
                  mb: 4,
                  textAlign: 'center'
                }}
              >
                {t('auth.createAccountDesc')}
              </Typography>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
                    backgroundColor: 'rgba(239,68,68,0.1)', 
                    color: '#ef4444',
                    border: '1px solid #ef4444'
                  }}
                >
                  {error}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    required
                    fullWidth
                    label={t('auth.firstName')}
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    InputLabelProps={{
                      style: { fontFamily },
                      shrink: true
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(26,32,44,0.9)',
                        color: '#fff',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.1)',
                          transition: 'all 0.2s ease'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(0,255,163,0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00FFA3',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily,
                        transform: 'translate(14px, -9px) scale(0.75)',
                        '&.Mui-focused': {
                          color: '#00FFA3'
                        }
                      }
                    }}
                    InputProps={{ 
                      style: { fontFamily }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    required
                    fullWidth
                    label={t('auth.lastName')}
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    InputLabelProps={{
                      style: { fontFamily },
                      shrink: true
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(26,32,44,0.9)',
                        color: '#fff',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.1)',
                          transition: 'all 0.2s ease'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(0,255,163,0.5)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00FFA3',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily,
                        transform: 'translate(14px, -9px) scale(0.75)',
                        '&.Mui-focused': {
                          color: '#00FFA3'
                        }
                      }
                    }}
                    InputProps={{ 
                      style: { fontFamily }
                    }}
                  />
                </Grid>
              </Grid>

              <TextField
                margin="normal"
                required
                fullWidth
                label={t('auth.emailAddress')}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                InputLabelProps={{
                  style: { fontFamily },
                  shrink: true
                }}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(26,32,44,0.9)',
                    color: '#fff',
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.1)',
                      transition: 'all 0.2s ease'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0,255,163,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00FFA3',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily,
                    transform: 'translate(14px, -9px) scale(0.75)',
                    '&.Mui-focused': {
                      color: '#00FFA3'
                    }
                  }
                }}
                InputProps={{ 
                  style: { fontFamily }
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label={t('auth.phoneNumber')}
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="0612345678"
                InputLabelProps={{
                  style: { fontFamily },
                  shrink: true
                }}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(26,32,44,0.9)',
                    color: '#fff',
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.1)',
                      transition: 'all 0.2s ease'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0,255,163,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00FFA3',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily,
                    transform: 'translate(14px, -9px) scale(0.75)',
                    '&.Mui-focused': {
                      color: '#00FFA3'
                    }
                  }
                }}
                InputProps={{ 
                  style: { fontFamily }
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                InputLabelProps={{
                  style: { fontFamily },
                  shrink: true
                }}
                InputProps={{
                  style: { fontFamily },
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="start"
                        sx={{ 
                          color: 'rgba(255,255,255,0.7)',
                          ml: -1,
                          mr: 1
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  mb: 4,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(26,32,44,0.9)',
                    color: '#fff',
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.1)',
                      transition: 'all 0.2s ease'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(0,255,163,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00FFA3',
                    },
                    '& input': {
                      paddingLeft: '14px'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily,
                    '&.Mui-focused': {
                      color: '#00FFA3'
                    }
                  }
                }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleRegister}
                disabled={loading}
                sx={{
                  py: 1.5,
                  mb: 2,
                  backgroundColor: '#00FFA3',
                  color: '#0F172A',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: '#00cc82'
                  },
                  '&:active': {
                    transform: 'scale(0.98)'
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: '#0F172A' }} />
                ) : (
                  t('auth.register')
                )}
              </Button>

              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography sx={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  fontFamily
                }}>
                  {t('auth.alreadyHaveAccount')}{' '}
                  <Link
                    to={`/${getCurrentLanguage()}/auth/login`}
                    style={{
                      textDecoration: 'none',
                      color: '#00FFA3',
                      fontWeight: 500,
                      fontFamily
                    }}
                  >
                    {t('auth.signIn')}
                  </Link>
                </Typography>
              </Box>

              <Box sx={{ flex: 1 }} />
            </Box>
          </Container>
        </>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default RegisterForm;
