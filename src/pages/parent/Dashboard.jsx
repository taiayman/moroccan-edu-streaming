import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Emotion + RTL Setup
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';

// MUI Components & Icons
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Container,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
  CircularProgress,
  Stack,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  LiveTv as LiveTvIcon
} from '@mui/icons-material';

// Hooks and Utilities
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '../../i18n';
import useMediaQuery from '@mui/material/useMediaQuery';
import useParentDashboard from '../../hooks/useParentDashboard';

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

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const currentLang = getCurrentLanguage();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    loading,
    error,
    children,
    assignments,
    notifications,
    selectedChild,
    childPerformance,
    childSchedule,
    liveClasses,
    setSelectedChild,
    refreshData,
  } = useParentDashboard();

  const [currentTab, setCurrentTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #1a1f2c 0%, #2d3748 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress sx={{ color: '#00FFA3' }} />
      </Box>
    );
  }

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            background: 'linear-gradient(145deg, #1a1f2c 0%, #2d3748 100%)',
            display: 'flex',
            flexDirection: 'column',
            pb: 7,
            pt: { xs: 12, sm: 14 }
          }}
        >
          <Container maxWidth="xl" sx={{ flex: 1, px: 2, py: 3, overflowY: 'auto' }}>
            {/* Header */}
            <Box
              sx={{
                mb: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Typography
                variant="h5"
                sx={{ color: '#fff', fontWeight: 600, letterSpacing: '0.5px' }}
              >
                {t('dashboard.welcome', { name: user?.displayName || t('common.parent') })}
              </Typography>
              <Tooltip title={t('common.refresh')}>
                <IconButton onClick={handleRefresh} disabled={refreshing} sx={{ color: '#00FFA3' }}>
                  <RefreshIcon
                    sx={{
                      animation: refreshing ? 'spin 1s linear infinite' : 'none'
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Children Overview */}
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              {t('dashboard.children')}
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {children.map((child) => (
                <Grid item xs={12} sm={6} md={4} key={child.id}>
                  <Paper
                    elevation={0}
                    onClick={() => setSelectedChild(child)}
                    sx={{
                      p: 3,
                      borderRadius: '12px',
                      bgcolor: selectedChild?.id === child.id
                        ? 'rgba(0, 255, 163, 0.1)'
                        : 'rgba(45, 55, 72, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid',
                      borderColor: selectedChild?.id === child.id
                        ? '#00FFA3'
                        : 'rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        src={child.avatar}
                        sx={{
                          width: 60,
                          height: 60,
                          bgcolor: 'rgba(0, 255, 163, 0.1)',
                          color: '#00FFA3'
                        }}
                      >
                        {child.name[0]}
                      </Avatar>
                      <Box>
                        <Typography sx={{ color: '#fff', fontWeight: 600 }}>
                          {child.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {child.grade}
                        </Typography>
                      </Box>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <CircularProgress
                            variant="determinate"
                            value={child.performance?.attendance || 0}
                            size={48}
                            thickness={4}
                            sx={{ color: '#00FFA3', mb: 1 }}
                          />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {t('dashboard.attendance')}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <CircularProgress
                            variant="determinate"
                            value={child.performance?.assignments || 0}
                            size={48}
                            thickness={4}
                            sx={{ color: '#00FFA3', mb: 1 }}
                          />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {t('dashboard.assignments')}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <CircularProgress
                            variant="determinate"
                            value={child.performance?.overall || 0}
                            size={48}
                            thickness={4}
                            sx={{ color: '#00FFA3', mb: 1 }}
                          />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {t('dashboard.overall')}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Assignments Section */}
            <Typography variant="h6" sx={{ color: '#fff', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon sx={{ color: '#00FFA3' }} />
              {t('dashboard.upcomingAssignments')}
            </Typography>
            <Stack spacing={2}>
              {assignments.map((assignment) => (
                <Paper
                  key={assignment.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: 'rgba(45, 55, 72, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                        {assignment.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {assignment.childName} - {assignment.subject}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ color: '#00FFA3' }}>
                        {assignment.status}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
              {assignments.length === 0 && (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    color: 'rgba(255, 255, 255, 0.7)',
                    bgcolor: 'rgba(45, 55, 72, 0.5)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5, color: '#00FFA3' }} />
                  <Typography variant="body2">
                    {t('dashboard.noAssignments')}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Container>

          {/* Bottom Navigation */}
          <Paper
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(26,32,44,0.95)',
              backdropFilter: 'blur(10px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              zIndex: 1000
            }}
            elevation={0}
          >
            <BottomNavigation
              value={currentTab}
              onChange={(event, newValue) => setCurrentTab(newValue)}
              sx={{
                backgroundColor: 'transparent',
                height: 65,
                '& .MuiBottomNavigationAction-root': {
                  color: 'rgba(255,255,255,0.5)',
                  '&.Mui-selected': { color: '#00FFA3' },
                  '& .MuiBottomNavigationAction-label': { fontSize: '0.625rem' }
                }
              }}
            >
              <BottomNavigationAction 
                label={t('nav.overview')} 
                icon={<AssessmentIcon />} 
              />
              <BottomNavigationAction 
                label={t('nav.schedule')} 
                icon={<CalendarIcon />} 
              />
              <BottomNavigationAction 
                label={t('nav.live')} 
                icon={<LiveTvIcon />} 
              />
            </BottomNavigation>
          </Paper>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default ParentDashboard;
