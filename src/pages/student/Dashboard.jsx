import React, { useState, useEffect } from 'react';
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
  Alert,
  Tooltip
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  LiveTv as LiveTvIcon,
  Refresh as RefreshIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';

// Framer Motion for animations
import { motion, AnimatePresence } from 'framer-motion';

// Hooks and Utilities
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '../../i18n'; // adjust this import path as needed
import useMediaQuery from '@mui/material/useMediaQuery';

// API functions (replace with your real API endpoints)
import { getUpcomingAssignments } from '../../api/assignments';
import { getDashboardStats, getRecentActivities } from '../../api/users';
import { getAllTeachers, getTeacherCalendarEvents, getTeacherCalendarNotes } from '../../api/teacher';

// =============================================================================
// RTL Cache & Theme (Same as Teacher Dashboard)
// =============================================================================
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

// =============================================================================
// Helper Functions for Calendar
// =============================================================================
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust for Sunday
  return new Date(d.setDate(diff));
}

function isToday(date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// =============================================================================
// CalendarCard Component
// (Read‑only view; students can only view the teacher's schedule.)
// =============================================================================
const CalendarCard = ({ schedule }) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));

  const hasEvents = (date) => {
    if (!schedule || !Array.isArray(schedule)) return false;
    const dateStr = date.toISOString().split('T')[0];
    return schedule.some((event) => event.date === dateStr);
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const eventsForDay = schedule ? schedule.filter(event => event.date === selectedDateStr) : [];

  return (
    <Box sx={{ height: '100%', p: 2 }}>
      {/* Calendar Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
          {new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => {
              const newWeekStart = new Date(currentWeekStart);
              newWeekStart.setDate(currentWeekStart.getDate() - 7);
              setCurrentWeekStart(newWeekStart);
            }}
            sx={{
              color: '#fff',
              backgroundColor: 'rgba(0, 255, 163, 0.1)',
              '&:hover': { backgroundColor: 'rgba(0, 255, 163, 0.2)' }
            }}
          >
            <CalendarIcon sx={{ transform: 'rotate(-90deg)' }} />
          </IconButton>
          <IconButton
            onClick={() => {
              const newWeekStart = new Date(currentWeekStart);
              newWeekStart.setDate(currentWeekStart.getDate() + 7);
              setCurrentWeekStart(newWeekStart);
            }}
            sx={{
              color: '#fff',
              backgroundColor: 'rgba(0, 255, 163, 0.1)',
              '&:hover': { backgroundColor: 'rgba(0, 255, 163, 0.2)' }
            }}
          >
            <CalendarIcon sx={{ transform: 'rotate(90deg)' }} />
          </IconButton>
        </Box>
      </Box>

      {/* Calendar Days */}
      <Grid container spacing={1}>
        {weekDates.map((date, index) => {
          const isCurrentDay = isToday(date);
          const isSelectedDay =
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
          const dayHasEvents = hasEvents(date);

          return (
            <Grid item xs key={index}>
              <Paper
                component={motion.div}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(new Date(date))}
                sx={{
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  backgroundColor: isSelectedDay
                    ? 'rgba(0, 255, 163, 0.1)'
                    : 'rgba(45, 55, 72, 0.5)',
                  border: isSelectedDay
                    ? '1px solid #00FFA3'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 163, 0.05)',
                    border: '1px solid rgba(0, 255, 163, 0.5)'
                  }
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1rem',
                    fontWeight: isCurrentDay || isSelectedDay ? 600 : 400,
                    color: isCurrentDay ? '#00FFA3' : '#fff',
                    mb: 0.5
                  }}
                >
                  {date.getDate()}
                </Typography>
                {dayHasEvents && (
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: '#00FFA3',
                      position: 'absolute',
                      bottom: 4
                    }}
                  />
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Events List */}
      <Box sx={{ mt: 3 }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 500,
            mb: 2
          }}
        >
          {selectedDate.toLocaleDateString('ar-SA', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </Typography>
        <Stack spacing={2}>
          {eventsForDay.map((event, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: 'rgba(45, 55, 72, 0.5)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#00FFA3'
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    sx={{
                      color: '#fff',
                      fontWeight: 500,
                      mb: 0.5
                    }}
                  >
                    {event.title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {event.time}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
          {eventsForDay.length === 0 && (
            <Box
              sx={{
                textAlign: 'center',
                py: 3,
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(45, 55, 72, 0.5)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Typography variant="body2">{t('calendar.noEvents')}</Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

// =============================================================================
// StudentDashboard Component
// =============================================================================
const StudentDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const currentLang = getCurrentLanguage();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Redirect to FreeUserNotice if user is not pro
  useEffect(() => {
    if (user && !user.isPro) {
      navigate(`/${currentLang}/student/free-notice`);
    }
  }, [user, currentLang, navigate]);

  // State declarations for real data
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [calendarData, setCalendarData] = useState({ events: [], notes: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // Bottom navigation: 0 = Schedule, 1 = Assignments, 2 = Teachers
  const [currentTab, setCurrentTab] = useState(0);
  // When a teacher is selected, we show their calendar in the Schedule tab.
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Fetch dashboard data from real API endpoints
  const fetchDashboardData = async () => {
    if (!user?.id) return;
    try {
      const assignments = await getUpcomingAssignments(user.id);
      const teachersList = await getAllTeachers();
      // Optionally, you can also fetch dashboard stats if needed:
      await getDashboardStats(user.id);
      // Recent activities API call is removed since Activity tab is not used.
      setUpcomingAssignments(assignments || []);
      setTeachers(teachersList || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(t('errors.dashboardFetch'));
    } finally {
      setLoading(false);
    }
  };

  // When a teacher is selected, fetch that teacher's calendar data.
  useEffect(() => {
    const fetchTeacherCalendar = async () => {
      if (selectedTeacher) {
        const now = new Date();
        const startOfWeek = getWeekStart(now);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        try {
          const events = await getTeacherCalendarEvents(
            selectedTeacher.id,
            startOfWeek,
            endOfWeek
          );
          const notes = await getTeacherCalendarNotes(
            selectedTeacher.id,
            startOfWeek,
            endOfWeek
          );
          setCalendarData({ events: events || [], notes: notes || {} });
        } catch (err) {
          console.error('Error fetching teacher calendar:', err);
          setError(t('errors.calendarFetch'));
        }
      }
    };
    fetchTeacherCalendar();
  }, [selectedTeacher, t]);

  // Refresh handler calls dashboard data and teacher calendar (if needed)
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDashboardData();
      if (selectedTeacher) {
        const now = new Date();
        const startOfWeek = getWeekStart(now);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const events = await getTeacherCalendarEvents(
          selectedTeacher.id,
          startOfWeek,
          endOfWeek
        );
        const notes = await getTeacherCalendarNotes(
          selectedTeacher.id,
          startOfWeek,
          endOfWeek
        );
        setCalendarData({ events: events || [], notes: notes || {} });
      }
    } catch (err) {
      setError(t('errors.refreshFailed'));
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, t]);

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
        {/* Global style override for font */}
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap');
            * { font-family: ${fontFamily}; }
          `}
        </style>
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
            {/* Header with Welcome & Refresh */}
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
                component={motion.h1}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                sx={{ color: '#fff', fontWeight: 600, letterSpacing: '0.5px' }}
              >
                {t('dashboard.welcome', { name: user?.displayName || t('common.student') })}
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

            {/* Quick Actions (Mobile Cards) */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                {
                  icon: <LiveTvIcon sx={{ fontSize: 28, color: '#00FFA3' }} />,
                  text: t('dashboard.quickActions.browseLiveClasses'),
                  action: () => navigate(`/${currentLang}/student/live-classes`)
                },
                {
                  icon: <AssignmentIcon sx={{ fontSize: 28, color: '#00FFA3' }} />,
                  text: t('dashboard.quickActions.viewAssignments'),
                  action: () => setCurrentTab(1)
                }
              ].map((action, index) => (
                <Grid item xs={6} key={index}>
                  <Paper
                    component={motion.div}
                    whileTap={{ scale: 0.95 }}
                    elevation={0}
                    onClick={action.action}
                    sx={{
                      p: 2,
                      height: '100%',
                      borderRadius: '12px',
                      bgcolor: 'rgba(45, 55, 72, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      textAlign: 'center'
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(0, 255, 163, 0.1)',
                        width: 44,
                        height: 44,
                        mb: 1
                      }}
                    >
                      {action.icon}
                    </Avatar>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500, fontSize: '0.875rem' }}>
                      {action.text}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Tab Content */}
            <Box sx={{ display: currentTab === 0 ? 'block' : 'none' }}>
              {/* Schedule Tab */}
              {selectedTeacher ? (
                <CalendarCard schedule={calendarData.events} />
              ) : (
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
                  <Typography variant="body2">
                    {t('dashboard.selectTeacherForSchedule')}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ display: currentTab === 1 ? 'block' : 'none' }}>
              {/* Assignments Tab */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#fff',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <AssignmentIcon sx={{ color: '#00FFA3' }} />
                  {t('dashboard.assignments.title')}
                </Typography>
              </Box>
              <Stack spacing={2}>
                {upcomingAssignments.map((assignment) => (
                  <Paper
                    key={assignment.id}
                    elevation={0}
                    onClick={() =>
                      navigate(`/${currentLang}/student/assignments/${assignment.id}`)
                    }
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      bgcolor: 'rgba(45, 55, 72, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:active': { transform: 'scale(0.98)' }
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 500, mb: 1 }}>
                      {assignment.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mb: 1 }}
                    >
                      {new Date(assignment.dueDate).toLocaleDateString(currentLang, {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress
                        variant="determinate"
                        value={assignment.progress || 0}
                        size={24}
                        thickness={4}
                        sx={{ color: '#00FFA3' }}
                      />
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {assignment.progress || 0}% {t('dashboard.assignments.complete')}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
                {upcomingAssignments.length === 0 && (
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
                    <MenuBookIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5, color: '#00FFA3' }} />
                    <Typography variant="body2">
                      {t('dashboard.assignments.noAssignments')}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            <Box sx={{ display: currentTab === 2 ? 'block' : 'none' }}>
              {/* Teachers Tab */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#fff',
                    fontWeight: 600,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <SchoolIcon sx={{ color: '#00FFA3' }} />
                  {t('dashboard.teachers.title')}
                </Typography>
                <Grid container spacing={2}>
                  {teachers.map((teacher) => (
                    <Grid item xs={12} sm={6} key={teacher.id}>
                      <Paper
                        component={motion.div}
                        whileTap={{ scale: 0.95 }}
                        elevation={0}
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setCurrentTab(0); // switch to Schedule tab upon selection
                        }}
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          bgcolor:
                            selectedTeacher?.id === teacher.id
                              ? 'rgba(0, 255, 163, 0.1)'
                              : 'rgba(45, 55, 72, 0.9)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid',
                          borderColor:
                            selectedTeacher?.id === teacher.id
                              ? '#00FFA3'
                              : 'rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor: 'rgba(0, 255, 163, 0.1)',
                              color: '#00FFA3'
                            }}
                          >
                            {teacher.displayName?.[0] || '?'}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                              {teacher.displayName || t('common.unknownTeacher')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {teacher.email}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                  {teachers.length === 0 && (
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
                      <SchoolIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5, color: '#00FFA3' }} />
                      <Typography variant="body2">{t('dashboard.teachers.empty')}</Typography>
                    </Box>
                  )}
                </Grid>
              </Box>
            </Box>
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
              <BottomNavigationAction label={t('nav.schedule')} icon={<CalendarIcon />} />
              <BottomNavigationAction label={t('nav.assignments')} icon={<AssignmentIcon />} />
              <BottomNavigationAction label={t('nav.teachers')} icon={<SchoolIcon />} />
            </BottomNavigation>
          </Paper>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default StudentDashboard;
