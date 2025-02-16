import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemText,
  CssBaseline,
  ThemeProvider,
  createTheme,
  Chip
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { useTranslation } from 'react-i18next';
import authService from '../../api/auth';

// RTL Cache Setup
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const fontFamily = "'Noto Kufi Arabic', sans-serif";
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: fontFamily,
    h3: { fontFamily, fontWeight: 600 },
    h4: { fontFamily, fontWeight: 600 },
    h5: { fontFamily, fontWeight: 500 },
    h6: { fontFamily, fontWeight: 500 },
    body1: { fontFamily },
    button: { fontFamily, fontWeight: 500 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap');
        body { font-family: ${fontFamily}; }
      `,
    },
  },
});

const StudentProfile = () => {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    const refreshUserData = async () => {
      if (user?.id) {
        try {
          const refreshedUser = await authService.refreshUserData(user.id);
          if (refreshedUser) {
            updateUser(refreshedUser);
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }
    };

    refreshUserData();
  }, [user?.id, updateUser]);

  const formatDate = (date) => {
    if (!date) return t('profile.notSpecified');
    return new Date(date).toLocaleDateString('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #1a1f2c 0%, #2d3748 100%)',
          pt: { xs: 12, sm: 14 },
          pb: 4
        }}>
          <Container maxWidth="lg">
            <Grid container justifyContent="center">
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0}
                  sx={{
                    p: 3,
                    bgcolor: 'rgba(45, 55, 72, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Avatar
                      sx={{
                        width: 120,
                        height: 120,
                        margin: '0 auto',
                        backgroundColor: 'rgba(0, 255, 163, 0.1)',
                        color: '#00FFA3',
                        fontSize: '3rem'
                      }}
                    >
                      {user?.displayName?.[0] || 'S'}
                    </Avatar>
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
                        {user?.displayName || t('common.student')}
                      </Typography>
                      <Chip
                        label={user?.isPro ? 'PRO' : 'FREE'}
                        size="small"
                        sx={{
                          backgroundColor: user?.isPro ? 'rgba(0, 255, 163, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                          color: user?.isPro ? '#00FFA3' : '#fff',
                          fontWeight: 600,
                          borderRadius: '6px'
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
                      {user?.email || 'student@example.com'}
                    </Typography>
                  </Box>

                  <List disablePadding>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText 
                        primary={<Typography sx={{ color: '#fff' }}>{t('profile.level')}</Typography>}
                        secondary={
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {user?.level || t('profile.notSpecified')}
                          </Typography>
                        }
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText 
                        primary={<Typography sx={{ color: '#fff' }}>{t('profile.enrollmentDate')}</Typography>}
                        secondary={
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {formatDate(user?.createdAt)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>

      </ThemeProvider>
    </CacheProvider>
  );
};

export default StudentProfile;