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
} from '@mui/material';
import { Visibility, VisibilityOff, Google as GoogleIcon } from '@mui/icons-material';
import { signInWithPopup } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../../api/config';
import { createUserProfile } from '../../api/users';
import { navigateByRole } from '../../utils/navigation';

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
            {t('auth.signIn')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              fontSize: '1.1rem'
            }}
          >
            {t('auth.welcomeBack')}
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
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.1)',
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
            mb: 3,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: 0
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

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                sx={{ 
                  '&.Mui-checked': { 
                    color: '#bb5c39' 
                  }
                }}
              />
            }
            label={
              <Typography sx={{ color: '#666' }}>
                {t('auth.rememberMe')}
              </Typography>
            }
          />
          <Link 
            to="/auth/forgot-password" 
            style={{ 
              textDecoration: 'none',
              color: '#bb5c39',
              fontWeight: 500
            }}
          >
            {t('auth.forgotPassword')}
          </Link>
        </Box>

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
              backgroundColor: '#bb5c39',
              opacity: 0.1,
              zIndex: 0
            }
          }}
        >
          <Button
            fullWidth
            variant="contained"
            disabled={loading}
            onClick={handleLogin}
            sx={{
              py: 1.75,
              backgroundColor: '#bb5c39',
              color: '#fff',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              position: 'relative',
              zIndex: 1,
              boxShadow: 'none',
              border: 'none',
              borderRadius: 0,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: '#a94f30'
              }
            }}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: '#fff' }} />
            ) : (
              t('auth.signIn')
            )}
          </Button>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{
              py: 1.5,
              color: '#000',
              borderColor: '#000',
              backgroundColor: 'transparent',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              borderRadius: 0,
              '&:hover': {
                backgroundColor: 'rgba(187, 92, 57, 0.05)',
                borderColor: '#bb5c39',
                color: '#bb5c39'
              }
            }}
          >
            {t('auth.continueWithGoogle')}
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: '#666' }}>
            {t('auth.noAccount')}{' '}
            <Link
              to={`/${getCurrentLanguage()}/auth/register`}
              style={{
                textDecoration: 'none',
                color: '#bb5c39',
                fontWeight: 500
              }}
            >
              {t('auth.signUpFree')}
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginForm;
