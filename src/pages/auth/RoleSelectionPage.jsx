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
  Alert,
  Paper
} from '@mui/material';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../api/config';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentLanguage } from '../../utils/navigation';
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

const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

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
        throw new Error(t('roleSelection.errors.invalidSession'));
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
      setError(t('roleSelection.errors.roleFailed'));
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    {
      title: t('roleSelection.student.title'),
      description: t('roleSelection.student.description'),
      value: 'student'
    },
    {
      title: t('roleSelection.teacher.title'),
      description: t('roleSelection.teacher.description'),
      value: 'teacher'
    },
    {
      title: t('roleSelection.parent.title'),
      description: t('roleSelection.parent.description'),
      value: 'parent'
    }
  ];

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
                  {t('roleSelection.title')}
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
                maxWidth: '800px',
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
                {t('roleSelection.description')}
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

              <Grid container spacing={3}>
                {roles.map((role) => (
                  <Grid item xs={12} md={4} key={role.value}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: 'rgba(26,32,44,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: '#00FFA3',
                          '& .MuiTypography-root': {
                            color: '#00FFA3'
                          }
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
                            color: '#fff',
                            transition: 'color 0.2s ease'
                          }}
                        >
                          {role.title}
                        </Typography>
                        <Typography 
                          variant="body2"
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            transition: 'color 0.2s ease'
                          }}
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
        </>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default RoleSelectionPage;
