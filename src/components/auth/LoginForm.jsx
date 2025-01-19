import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup 
} from 'firebase/auth';
import { auth, googleProvider, ROLES } from '../../api/config';
import { verifyUserRole } from '../../api/users';
import { navigateByRole } from '../../utils/navigation';

const LoginForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ROLES.STUDENT);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Verify role and get user profile
      const userProfile = await verifyUserRole(user.uid, selectedRole);

      // Store complete user data
      const userData = {
        id: user.uid,
        ...userProfile
      };
      
      localStorage.setItem('user', JSON.stringify(userData));

      // Navigate to role-specific dashboard
      navigateByRole(navigate, userProfile.role);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { user } = await signInWithPopup(auth, googleProvider);

      // Verify role and get user profile
      const userProfile = await verifyUserRole(user.uid, selectedRole);

      // Store complete user data
      const userData = {
        id: user.uid,
        ...userProfile
      };
      
      localStorage.setItem('user', JSON.stringify(userData));

      // Navigate to role-specific dashboard
      navigateByRole(navigate, userProfile.role);
    } catch (err) {
      setError(err.message);
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
              fontSize: { xs: '2rem', sm: '2.5rem' }
            }}
          >
            Sign in
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#666',
              fontSize: '1.1rem'
            }}
          >
            Welcome back! Please select your role and enter your details
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
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
          <InputLabel>Select Role</InputLabel>
          <Select
            value={selectedRole}
            label="Select Role"
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <MenuItem value={ROLES.STUDENT}>Student</MenuItem>
            <MenuItem value={ROLES.PARENT}>Parent</MenuItem>
            <MenuItem value={ROLES.TEACHER}>Teacher</MenuItem>
          </Select>
        </FormControl>

        <TextField
          margin="normal"
          required
          fullWidth
          label="Email address"
          name="email"
          autoComplete="email"
          autoFocus
          value={formData.email}
          onChange={handleChange}
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
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
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
                    color: '#000' 
                  }
                }}
              />
            }
            label={
              <Typography sx={{ color: '#666' }}>
                Remember me
              </Typography>
            }
          />
          <Link 
            to="/auth/forgot-password" 
            style={{ 
              textDecoration: 'none',
              color: '#000',
              fontWeight: 500
            }}
          >
            Forgot password?
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
              backgroundColor: '#666',
              opacity: 0.3,
              borderRadius: '4px',
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
            {loading ? (
              <CircularProgress size={24} sx={{ color: '#fff' }} />
            ) : (
              'Sign in'
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
            Continue with Google
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: '#666' }}>
            Don't have an account?{' '}
            <Link 
              to="/auth/register" 
              style={{ 
                textDecoration: 'none',
                color: '#000',
                fontWeight: 500
              }}
            >
              Sign up for free
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginForm;