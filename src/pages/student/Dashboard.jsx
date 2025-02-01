import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Stack,
  Container,
  Paper,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Fade,
  Zoom
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  MenuBook as MenuBookIcon,
  LiveTv as LiveTvIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon,
  Check as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getUpcomingAssignments } from '../../api/assignments';
import { getDashboardStats } from '../../api/users';
import { getAllTeachers, getTeacherCalendarEvents, getTeacherCalendarNotes } from '../../api/teacher';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '../../utils/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const StudentDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const currentLang = getCurrentLanguage();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [calendarData, setCalendarData] = useState({
    events: [],
    notes: {}
  });
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchTeacherCalendar = async (teacherId) => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() + 6));

      const [events, notes] = await Promise.all([
        getTeacherCalendarEvents(teacherId, startOfWeek, endOfWeek),
        getTeacherCalendarNotes(teacherId, startOfWeek, endOfWeek)
      ]);

      setCalendarData({
        events: events || [],
        notes: notes || {}
      });
    } catch (error) {
      console.error('Error fetching teacher calendar:', error);
      setError(t('errors.calendarFetch'));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDashboardData();
      if (selectedTeacher) {
        await fetchTeacherCalendar(selectedTeacher.id);
      }
    } catch (error) {
      setError(t('errors.refreshFailed'));
    } finally {
      setRefreshing(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!user?.id) {
      console.log('No user ID found:', user);
      return;
    }

    try {
      const [assignments, teachersList, dashboardStats] = await Promise.all([
        getUpcomingAssignments(user.id),
        getAllTeachers(),
        getDashboardStats(user.id)
      ]);

      setEnrolledCourses([]);
      setUpcomingAssignments(assignments || []);
      setTeachers(teachersList || []);
      setStats(dashboardStats);
      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(t('errors.dashboardFetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTeacher) {
      fetchTeacherCalendar(selectedTeacher.id);
    }
  }, [selectedTeacher]);

  const quickActions = [
    {
      icon: <LiveTvIcon sx={{ fontSize: 32, color: 'primary.light' }} />,
      text: t('dashboard.quickActions.browseLiveClasses'),
      path: `/${currentLang}/student/live-classes`,
      color: 'primary'
    },
    {
      icon: <AssignmentIcon sx={{ fontSize: 32, color: 'secondary.light' }} />,
      text: t('dashboard.quickActions.viewAssignments'),
      path: `/${currentLang}/student/assignments`,
      color: 'secondary'
    },
    {
      icon: <CalendarIcon sx={{ fontSize: 32, color: 'success.light' }} />,
      text: t('dashboard.quickActions.viewSchedule'),
      path: `/${currentLang}/student/schedule`,
      color: 'success'
    }
  ];

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.palette.background.default
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #1a1f2c 0%, #2d3748 100%)',
        py: { xs: 2, sm: 4 },
        px: { xs: 2, sm: 4 }
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ 
          mb: 4, 
          pt: 8,
          pb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography
            variant="h4"
            component={motion.h1}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            sx={{
              color: '#fff',
              fontWeight: 600,
              fontFamily: '"Roboto", sans-serif',
              letterSpacing: '0.5px'
            }}
          >
            {t('dashboard.welcome', { name: user?.displayName || t('common.student') })}
          </Typography>
          
          <Tooltip title={t('common.refresh')}>
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ color: '#4a90e2' }}
            >
              <RefreshIcon sx={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                color: '#4a90e2'
              }} />
            </IconButton>
          </Tooltip>
        </Box>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  backgroundColor: 'rgba(211, 47, 47, 0.1)',
                  color: '#ff5252',
                  border: '1px solid',
                  borderColor: 'error.main',
                  borderRadius: 2,
                  '& .MuiAlert-icon': { color: '#ff5252' }
                }}
                action={
                  <IconButton
                    color="inherit"
                    size="small"
                    onClick={() => setError(null)}
                  >
                    <CheckIcon />
                  </IconButton>
                }
              >
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {/* Quick Actions */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper
                    component={motion.div}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    elevation={0}
                    onClick={() => navigate(action.path)}
                    sx={{
                      p: 3,
                      height: '100%',
                      borderRadius: '8px',
                      bgcolor: 'rgba(45, 55, 72, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(74, 144, 226, 0.1)',
                          color: '#4a90e2',
                          width: 48,
                          height: 48
                        }}
                      >
                        {action.icon}
                      </Avatar>
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#fff',
                        fontWeight: 500,
                        mb: 1,
                        fontFamily: '"Roboto", sans-serif',
                        letterSpacing: '0.3px'
                      }}
                    >
                      {action.text}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Teachers Section */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h5"
                sx={{
                  color: '#fff',
                  fontWeight: 500,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontFamily: '"Roboto", sans-serif',
                  letterSpacing: '0.3px'
                }}
              >
                <SchoolIcon sx={{ color: '#4a90e2' }} />
                {t('dashboard.teachers.title')}
              </Typography>

              <Grid container spacing={2}>
                {teachers.map((teacher) => (
                  <Grid item xs={12} sm={6} md={4} key={teacher.id}>
                    <Paper
                      component={motion.div}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.98 }}
                      elevation={0}
                      onClick={() => setSelectedTeacher(teacher)}
                      sx={{
                        p: 3,
                        height: '100%',
                        borderRadius: '8px',
                        bgcolor: selectedTeacher?.id === teacher.id
                          ? 'rgba(74, 144, 226, 0.1)'
                          : 'rgba(45, 55, 72, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid',
                        borderColor: selectedTeacher?.id === teacher.id
                          ? '#4a90e2'
                          : 'rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: 'rgba(74, 144, 226, 0.1)',
                            color: '#4a90e2'
                          }}
                        >
                          {teacher.displayName?.[0] || '?'}
                        </Avatar>
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 500,
                              color: selectedTeacher?.id === teacher.id ? '#4a90e2' : '#fff',
                              letterSpacing: '0.3px'
                            }}
                          >
                            {teacher.displayName || t('common.unknownTeacher')}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: selectedTeacher?.id === teacher.id 
                                ? 'rgba(74, 144, 226, 0.8)' 
                                : 'rgba(255, 255, 255, 0.7)'
                            }}
                          >
                            {teacher.email || t('common.noEmail')}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Calendar View */}
              <AnimatePresence mode="wait">
                {selectedTeacher && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        mt: 3,
                        p: 3,
                        borderRadius: '8px',
                        bgcolor: 'rgba(45, 55, 72, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#fff',
                          fontWeight: 500,
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontFamily: '"Roboto", sans-serif',
                          letterSpacing: '0.3px'
                        }}
                      >
                        <span>
                          {t('dashboard.schedule.title', { name: selectedTeacher.displayName })}
                        </span>
                        <Tooltip title={t('dashboard.schedule.info')}>
                          <IconButton size="small">
                            <InfoIcon sx={{ fontSize: 20, color: '#4a90e2' }} />
                          </IconButton>
                        </Tooltip>
                      </Typography>

                      <TableContainer
                        sx={{
                          maxHeight: 600,
                          overflowY: 'auto',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(45, 55, 72, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          '&::-webkit-scrollbar': {
                            width: 8,
                            height: 8
                          },
                          '&::-webkit-scrollbar-track': {
                            bgcolor: 'rgba(45, 55, 72, 0.5)'
                          },
                          '&::-webkit-scrollbar-thumb': {
                            bgcolor: '#4a90e2',
                            borderRadius: 2
                          }
                        }}
                      >
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell
                                sx={{
                                  fontWeight: 500,
                                  fontSize: '0.9rem',
                                  bgcolor: 'rgba(45, 55, 72, 0.9)',
                                  color: '#4a90e2',
                                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                }}
                              >
                                {t('dashboard.schedule.day')}
                              </TableCell>
                              {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                                <TableCell
                                  key={hour}
                                  align="center"
                                  sx={{
                                    fontWeight: 500,
                                    fontSize: '0.9rem',
                                    bgcolor: 'rgba(45, 55, 72, 0.9)',
                                    color: '#4a90e2',
                                    minWidth: 100,
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                  }}
                                >
                                  {`${hour}:00`}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => {
                              const date = new Date();
                              date.setDate(date.getDate() - date.getDay() + dayIndex);
                              const dateStr = date.toISOString().split('T')[0];

                              return (
                                <TableRow key={day} hover sx={{ '&:hover': { backgroundColor: 'rgba(74, 144, 226, 0.05)' } }}>
                                  <TableCell
                                    sx={{
                                      whiteSpace: 'nowrap',
                                      fontWeight: 500,
                                      bgcolor: 'rgba(45, 55, 72, 0.7)',
                                      color: '#fff',
                                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                      <Typography variant="subtitle2">{day}</Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {date.getDate()}/{date.getMonth() + 1}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => {
                                    const timeSlot = `${hour}:00`;
                                    const events = calendarData.events.filter(event => {
                                      const eventDate = new Date(event.startTime);
                                      return (
                                        eventDate.getDay() === dayIndex &&
                                        eventDate.getHours() === hour
                                      );
                                    });
                                    const dayNote = calendarData.notes[`${dateStr}-${timeSlot}`];

                                    return (
                                      <TableCell
                                        key={hour}
                                        align="center"
                                        sx={{
                                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                          bgcolor: 'transparent',
                                          position: 'relative',
                                          minWidth: 100,
                                          p: 1
                                        }}
                                      >
                                        <Box sx={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: 0.5,
                                          minHeight: '100%'
                                        }}>
                                          {events.map((event, i) => (
                                            <Chip
                                              key={i}
                                              label={event.title || t('dashboard.schedule.defaultClass')}
                                              size="small"
                                              sx={{
                                                fontSize: '0.75rem',
                                                height: 24,
                                                mb: 0.5,
                                                bgcolor: 'rgba(74, 144, 226, 0.1)',
                                                color: '#4a90e2',
                                                border: '1px solid rgba(74, 144, 226, 0.3)',
                                                '&:hover': {
                                                  bgcolor: 'rgba(74, 144, 226, 0.2)'
                                                }
                                              }}
                                            />
                                          ))}
                                          {dayNote && (
                                            <Tooltip title={dayNote}>
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  color: 'rgba(255, 255, 255, 0.7)',
                                                  display: 'block',
                                                  fontSize: '0.75rem',
                                                  lineHeight: 1.2,
                                                  mt: 'auto',
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  whiteSpace: 'nowrap'
                                                }}
                                              >
                                                {dayNote}
                                              </Typography>
                                            </Tooltip>
                                          )}
                                        </Box>
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </Grid>

          {/* Right Sidebar */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                position: 'sticky',
                top: theme.spacing(12),
                height: 'fit-content'
              }}
            >
              {/* Upcoming Assignments */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '8px',
                  bgcolor: 'rgba(45, 55, 72, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: '#fff',
                    fontWeight: 500,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontFamily: '"Roboto", sans-serif',
                    letterSpacing: '0.3px'
                  }}
                >
                  <AssignmentIcon sx={{ color: '#4a90e2' }} />
                  {t('dashboard.assignments.title')}
                </Typography>

                <Stack spacing={2}>
                  {upcomingAssignments.length > 0 ? (
                    upcomingAssignments.map((assignment) => (
                      <Paper
                        key={assignment.id}
                        elevation={0}
                        onClick={() => navigate(`/${currentLang}/student/assignments/${assignment.id}`)}
                        sx={{
                          p: 2,
                          borderRadius: '4px',
                          bgcolor: 'rgba(45, 55, 72, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'rgba(74, 144, 226, 0.1)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ 
                            color: '#fff', 
                            fontWeight: 500,
                            mb: 0.5,
                            letterSpacing: '0.3px'
                          }}
                        >
                          {assignment.title}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          display: 'block', 
                          mb: 1 
                        }}>
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
                            sx={{ color: '#4a90e2' }}
                          />
                          <Typography variant="caption" sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)' 
                          }}>
                            {assignment.progress || 0}% {t('dashboard.assignments.complete')}
                          </Typography>
                        </Box>
                      </Paper>
                    ))
                  ) : (
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 4,
                        color: 'rgba(255, 255, 255, 0.7)',
                        bgcolor: 'rgba(45, 55, 72, 0.5)',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <MenuBookIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5, color: '#4a90e2' }} />
                      <Typography variant="body2">
                        {t('dashboard.assignments.noAssignments')}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default StudentDashboard