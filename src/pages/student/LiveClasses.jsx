import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Emotion + RTL Setup
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';

import {
  ThemeProvider,
  createTheme,
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Button,
  Chip,
  Stack,
  Container,
  Alert,
  CircularProgress,
  CssBaseline
} from '@mui/material';

import {
  LiveTv as LiveTvIcon,
  Timer as TimerIcon,
  Person as PersonIcon,
  School as SchoolIcon
} from '@mui/icons-material';

import { useAuth } from '../../hooks/useAuth';
import { getActiveLiveClasses, getDailyRoom } from '../../api/student';
import { getCurrentLanguage } from '../../i18n';
import { auth } from '../../api/config';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

// RTL Cache & Theme Setup
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

const LiveClasses = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joiningClass, setJoiningClass] = useState(false);

  useEffect(() => {
    const fetchLiveClasses = async () => {
      try {
        setLoading(true);
        const classes = await getActiveLiveClasses(user.id);
        console.log('Fetched live classes:', classes);
        setLiveClasses(classes);
      } catch (error) {
        console.error('Error fetching live classes:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchLiveClasses();
    }
  }, [user?.id]);

  const handleJoinClass = async (classId) => {
    try {
      setJoiningClass(true);
      setError(null);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const room = await getDailyRoom(classId);
      if (!room) {
        throw new Error('Room not found');
      }

      const roomName = room.url.split('/').pop();
      window.location.href = `/streaming/student.html?room=${roomName}`;

    } catch (error) {
      console.error('Error joining class:', error);
      setError('Failed to join class: ' + error.message);
      setJoiningClass(false);
    }
  };

  const ClassCard = ({ liveClass }) => (
    <Paper
      component={motion.div}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: '12px',
        backgroundColor: 'rgba(45, 55, 72, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        transition: 'all 0.3s ease',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Left Section: Avatar and Title */}
          <Grid item xs>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(0, 255, 163, 0.1)',
                  color: '#00FFA3',
                  width: 48,
                  height: 48
                }}
              >
                <SchoolIcon />
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: '#fff',
                    fontSize: '1.1rem'
                  }}
                >
                  {liveClass.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: 0.5
                  }}
                >
                  <PersonIcon sx={{ fontSize: '0.9rem' }} />
                  {liveClass.teacherName || t('common.teacher')}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Middle Section: Time */}
          <Grid item>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'rgba(255, 255, 255, 0.7)',
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              px: 2
            }}>
              <TimerIcon sx={{ fontSize: '1.1rem' }} />
              <Typography variant="body2">
                {new Date(liveClass.startTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Typography>
            </Box>
          </Grid>

          {/* Right Section: Live Badge and Join Button */}
          <Grid item>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Live Badge */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  backgroundColor: 'rgba(0, 255, 163, 0.1)',
                  border: '1px solid rgba(0, 255, 163, 0.2)',
                  borderRadius: '20px',
                  py: 0.5,
                  px: 1.5
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#00FFA3',
                    animation: 'pulse 2s infinite'
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: '#00FFA3',
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                >
                  {t('liveClass.live')}
                </Typography>
              </Box>

              {/* Join Button */}
              <Button
                variant="contained"
                disabled={joiningClass}
                onClick={() => handleJoinClass(liveClass.id)}
                sx={{
                  backgroundColor: '#00FFA3',
                  color: '#1a1f2c',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2,
                  '&:hover': {
                    backgroundColor: '#00cc82'
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(0, 255, 163, 0.3)',
                    color: '#1a1f2c'
                  }
                }}
              >
                {joiningClass ? t('liveClass.joining') : t('liveClass.join')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
        `}
      </style>
    </Paper>
  );

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap');
            * { font-family: ${fontFamily}; }
          `}
        </style>
        <Box sx={{ 
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #1a1f2c 0%, #2d3748 100%)',
          pt: { xs: '80px', sm: '90px' },
          pb: 4
        }}>
          <Container maxWidth="xl">
            <Typography 
              variant="h4" 
              component={motion.h1}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              sx={{ 
                fontWeight: 600, 
                mb: 3,
                color: '#fff',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <LiveTvIcon sx={{ color: '#00FFA3' }} />
              {t('liveClass.title')}
            </Typography>
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  backgroundColor: 'rgba(211, 47, 47, 0.1)',
                  color: '#ff5252',
                  border: '1px solid rgba(211, 47, 47, 0.2)',
                  borderRadius: '12px',
                  '& .MuiAlert-icon': { color: '#ff5252' }
                }}
              >
                {error}
              </Alert>
            )}

            {loading ? (
              <Stack spacing={3}>
                {[1, 2, 3].map((index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 3,
                      height: 160,
                      borderRadius: '12px',
                      backgroundColor: 'rgba(45, 55, 72, 0.5)',
                      animation: 'pulse 1.5s infinite'
                    }}
                  />
                ))}
              </Stack>
            ) : (
              <Stack spacing={3}>
                {liveClasses.length > 0 ? (
                  liveClasses.map((liveClass) => (
                    <ClassCard key={liveClass.id} liveClass={liveClass} />
                  ))
                ) : (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 6,
                      color: 'rgba(255, 255, 255, 0.7)',
                      backgroundColor: 'rgba(45, 55, 72, 0.5)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <LiveTvIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5, color: '#00FFA3' }} />
                    <Typography variant="body1">
                      {t('liveClass.noClasses')}
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}
          </Container>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default LiveClasses;
