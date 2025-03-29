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
  CssBaseline,
  TextField,
  InputAdornment,
  Tooltip,
  Skeleton,
  IconButton,
  Fade,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

import {
  LiveTv as LiveTvIcon,
  Timer as TimerIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  Info as InfoIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';

import { useAuth } from '../../hooks/useAuth';
import { getActiveLiveClasses, getDailyRoom } from '../../api/student';
import { getCurrentLanguage } from '../../i18n';
import { auth } from '../../api/config';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [joiningClass, setJoiningClass] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const currentLang = getCurrentLanguage();

  // Redirect to FreeUserNotice if user is not pro
  useEffect(() => {
    if (user && !user.isPro) {
      navigate(`/${currentLang}/student/free-notice`);
    }
  }, [user, currentLang, navigate]);

  const fetchLiveClasses = async (isRefreshing = false) => {
    try {
      isRefreshing ? setRefreshing(true) : setLoading(true);
      setError(null);
      const classes = await getActiveLiveClasses(user.id);
      console.log('Fetched live classes:', classes);
      setLiveClasses(classes);
      setFilteredClasses(classes);
    } catch (error) {
      console.error('Error fetching live classes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchLiveClasses();
    }
  }, [user?.id]);

  // Filter classes when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClasses(liveClasses);
    } else {
      const filtered = liveClasses.filter(
        cls => cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (cls.teacherName && cls.teacherName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredClasses(filtered);
    }
  }, [searchQuery, liveClasses]);

  const handleRefresh = () => {
    fetchLiveClasses(true);
  };

  const handleJoinRequest = (classData) => {
    setSelectedClass(classData);
    setConfirmDialogOpen(true);
  };

  const handleJoinClass = async () => {
    if (!selectedClass) return;
    
    try {
      setJoiningClass(selectedClass.id);
      setConfirmDialogOpen(false);
      setError(null);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const room = await getDailyRoom(selectedClass.id);
      if (!room) {
        throw new Error('Room not found');
      }

      const roomName = room.url.split('/').pop();
      window.location.href = `/streaming/student.html?room=${roomName}`;

    } catch (error) {
      console.error('Error joining class:', error);
      setError('Failed to join class: ' + error.message);
      setJoiningClass(null);
    }
  };

  const calculateTimeRemaining = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start - now;
    
    if (diffMs <= 0) return { text: t('liveClass.ongoing'), color: '#00FFA3' };
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return { 
        text: `${t('liveClass.startsIn')} ${diffMins} ${t('liveClass.minutes')}`,
        color: '#FFB400'
      };
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return { 
        text: `${t('liveClass.startsIn')} ${hours} ${t('liveClass.hours')} ${mins} ${t('liveClass.minutes')}`,
        color: '#3DA5FF'
      };
    }
  };

  const ClassCard = ({ liveClass }) => {
    const timeRemaining = calculateTimeRemaining(liveClass.startTime);
    const isJoining = joiningClass === liveClass.id;
    
    return (
      <Paper
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
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

            {/* Middle Section: Date and Time */}
            <Grid item>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                gap: 0.5,
                color: 'rgba(255, 255, 255, 0.7)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                px: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon sx={{ fontSize: '0.9rem' }} />
                  <Typography variant="body2">
                    {new Date(liveClass.startTime).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimerIcon sx={{ fontSize: '0.9rem' }} />
                  <Typography variant="body2">
                    {new Date(liveClass.startTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Right Section: Live Badge and Join Button */}
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Status Badge */}
                <Tooltip title={timeRemaining.text}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      backgroundColor: `rgba(${timeRemaining.color === '#00FFA3' ? '0, 255, 163' : timeRemaining.color === '#FFB400' ? '255, 180, 0' : '61, 165, 255'}, 0.1)`,
                      border: `1px solid rgba(${timeRemaining.color === '#00FFA3' ? '0, 255, 163' : timeRemaining.color === '#FFB400' ? '255, 180, 0' : '61, 165, 255'}, 0.2)`,
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
                        backgroundColor: timeRemaining.color,
                        animation: timeRemaining.color === '#00FFA3' ? 'pulse 2s infinite' : 'none'
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: timeRemaining.color,
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    >
                      {timeRemaining.color === '#00FFA3' ? t('liveClass.live') : t('liveClass.upcoming')}
                    </Typography>
                  </Box>
                </Tooltip>

                {/* Join Button */}
                <Tooltip title={timeRemaining.color === '#00FFA3' ? t('liveClass.joinNow') : t('liveClass.joinWhenStarts')}>
                  <span>
                    <Button
                      variant="contained"
                      disabled={isJoining || timeRemaining.color !== '#00FFA3'}
                      onClick={() => handleJoinRequest(liveClass)}
                      sx={{
                        backgroundColor: timeRemaining.color === '#00FFA3' ? '#00FFA3' : 'rgba(255, 255, 255, 0.1)',
                        color: timeRemaining.color === '#00FFA3' ? '#1a1f2c' : 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 2,
                        '&:hover': {
                          backgroundColor: timeRemaining.color === '#00FFA3' ? '#00cc82' : 'rgba(255, 255, 255, 0.2)'
                        },
                        '&.Mui-disabled': {
                          backgroundColor: 'rgba(0, 255, 163, 0.3)',
                          color: timeRemaining.color === '#00FFA3' ? '#1a1f2c' : 'rgba(255, 255, 255, 0.3)'
                        }
                      }}
                    >
                      {isJoining ? (
                        <>
                          <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                          {t('liveClass.joining')}
                        </>
                      ) : (
                        timeRemaining.color === '#00FFA3' ? t('liveClass.join') : t('liveClass.upcoming')
                      )}
                    </Button>
                  </span>
                </Tooltip>
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
  };

  // Skeletons for loading state
  const ClassCardSkeleton = () => (
    <Skeleton
      variant="rectangular"
      animation="wave"
      sx={{
        height: 100,
        borderRadius: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        '&::after': {
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)'
        }
      }}
    />
  );

  // Empty state component
  const EmptyState = () => (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
      <Typography variant="h6" color="white" sx={{ mb: 1 }}>
        {t('liveClass.noClassesTitle')}
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, maxWidth: '80%', mx: 'auto' }}>
        {t('liveClass.noClasses')}
      </Typography>
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={handleRefresh}
        sx={{
          borderColor: 'rgba(255, 255, 255, 0.3)',
          color: 'white',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }
        }}
      >
        {t('common.refresh')}
      </Button>
    </Box>
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
            {/* Header Section */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between',
              mb: 3,
              gap: 2
            }}>
              <Typography 
                variant="h4" 
                component={motion.h1}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                sx={{ 
                  fontWeight: 600, 
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
              
              <Box sx={{ 
                display: 'flex',
                gap: 2,
                width: { xs: '100%', sm: 'auto' }
              }}>
                <TextField
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{
                    minWidth: { xs: '100%', sm: 240 },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00FFA3'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Tooltip title={t('common.refresh')}>
                  <IconButton
                    onClick={handleRefresh}
                    disabled={loading || refreshing}
                    sx={{
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    {refreshing ? 
                      <CircularProgress size={24} sx={{ color: '#00FFA3' }} /> : 
                      <RefreshIcon />
                    }
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert 
                    severity="error" 
                    onClose={() => setError(null)}
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            {loading ? (
              <Stack spacing={3}>
                {[1, 2, 3].map((index) => (
                  <ClassCardSkeleton key={index} />
                ))}
              </Stack>
            ) : (
              <AnimatePresence>
                <Stack spacing={3} component={motion.div} layout>
                  {filteredClasses.length > 0 ? (
                    filteredClasses.map((liveClass) => (
                      <ClassCard key={liveClass.id} liveClass={liveClass} />
                    ))
                  ) : (
                    searchQuery ? (
                      <Box
                        component={motion.div}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        sx={{
                          textAlign: 'center',
                          py: 6,
                          color: 'rgba(255, 255, 255, 0.7)',
                          backgroundColor: 'rgba(45, 55, 72, 0.5)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <SearchIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" color="white" sx={{ mb: 1 }}>
                          {t('common.noSearchResults')}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3 }}>
                          {t('common.tryDifferentSearch')}
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={() => setSearchQuery('')}
                          sx={{
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            color: 'white',
                            '&:hover': {
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)'
                            }
                          }}
                        >
                          {t('common.clearSearch')}
                        </Button>
                      </Box>
                    ) : (
                      <EmptyState />
                    )
                  )}
                </Stack>
              </AnimatePresence>
            )}
          </Container>
        </Box>

        {/* Join Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              backgroundColor: '#2d3748',
              color: 'white',
              maxWidth: '400px'
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
            color: 'white', 
            fontWeight: 600
          }}>
            {t('liveClass.confirmJoin')}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {selectedClass && (
              <Typography variant="body1">
                {t('liveClass.joinConfirmMessage', { className: selectedClass.title })}
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button 
              onClick={() => setConfirmDialogOpen(false)}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.05)' }
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleJoinClass}
              variant="contained"
              sx={{ 
                backgroundColor: '#00FFA3',
                color: '#1a1f2c',
                '&:hover': { backgroundColor: '#00cc82' }
              }}
            >
              {t('liveClass.join')}
            </Button>
          </DialogActions>
        </Dialog>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default LiveClasses;
