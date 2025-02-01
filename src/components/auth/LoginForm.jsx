import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '../../utils/navigation';
import authService from '../../api/auth';
import {
  Box,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Container,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Google as GoogleIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { signInWithPopup } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../../api/config';
import { createUserProfile } from '../../api/users';
import { navigateByRole } from '../../utils/navigation';
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

const LoginForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { login } = useAuth();
  const { t } = useTranslation();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!formData.email || !formData.password) {
        throw new Error(t('auth.enterCredentials'));
      }

      const response = await authService.login(formData.email, formData.password);
      await login(response.user, response.token);
      navigateByRole(navigate, response.user.role);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || t('auth.loginFailed'));
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      
      // Check if user already exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userProfile;

      if (!userDoc.exists()) {
        // New user - create minimal profile
        const userData = {
          id: user.uid,
          email: user.email,
          displayName: user.displayName || 'User',
          firstName: user.displayName?.split(' ')[0] || 'User',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          createdAt: new Date().toISOString(),
          isNewUser: true,
          photoURL: user.photoURL
        };
        
        await createUserProfile(user.uid, userData);
        userProfile = userData;
      } else {
        userProfile = {
          ...userDoc.data(),
          id: user.uid
        };
      }

      const token = await user.getIdToken();
      
      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: user.uid,
        ...userProfile
      }));

      // Login through context
      await login(userProfile, token);
      
      // Navigate based on user status
      if (!userDoc.exists() || userProfile.isNewUser) {
        navigate('/auth/role-selection');
      } else if (userProfile.role) {
        navigateByRole(navigate, userProfile.role);
      } else {
        setError(t('auth.incompleteProfile'));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
                  {t('auth.signIn')}
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
                {t('auth.welcomeBack')}
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

              <TextField
                margin="normal"
                required
                fullWidth
                label={t('auth.emailAddress')}
                name="email"
                autoComplete="email"
                autoFocus
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
                name="password"
                label={t('auth.password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
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
                disabled={loading}
                onClick={handleLogin}
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
                  t('auth.signIn')
                )}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon sx={{ mr: 1.5 }} />}
                onClick={handleGoogleLogin}
                sx={{
                  py: 1.5,
                  mb: 4,
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(26,32,44,0.9)',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderRadius: 2,
                  '& .MuiButton-startIcon': {
                    marginRight: '12px',
                    marginLeft: '4px'
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(26,32,44,0.95)',
                    borderColor: '#00FFA3'
                  },
                  '&:active': {
                    transform: 'scale(0.98)'
                  }
                }}
              >
                {t('auth.continueWithGoogle')}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 'auto' }}>
                <Typography sx={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  fontFamily
                }}>
                  {t('auth.noAccount')}{' '}
                  <Link
                    to={`/${getCurrentLanguage()}/auth/register`}
                    style={{
                      textDecoration: 'none',
                      color: '#00FFA3',
                      fontWeight: 500,
                      fontFamily
                    }}
                  >
                    {t('auth.signUpFree')}
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Container>
        </>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default LoginForm;
