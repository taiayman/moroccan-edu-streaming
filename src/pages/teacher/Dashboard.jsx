import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentLanguage } from '../../i18n';
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Stack,
  Container,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  FormControlLabel,
  Switch,
  Tooltip,
  useTheme,
  ThemeProvider,
  CssBaseline,
  createTheme,
  BottomNavigation,
  BottomNavigationAction
} from '@mui/material';
import {
  School as SchoolIcon,
  LiveTv as LiveTvIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  MenuBook as MenuBookIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  PlayCircleOutline as PlayIcon,
  NotificationsNone as NotificationsIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  PictureAsPdf as PictureAsPdfIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {
  getTeacherLessons,
  getTeacherSchedule,
  startLiveClass,
  saveLessonPlan,
  getTeacherStats,
  createDailyRoom,
  getTeacherCourses,
  getTeacherAssignments,
  getTeacherStudents,
  createNewCourse,
  createNewAssignment,
  getRecentActivities,
  getTeacherCalendarEvents,
  getTeacherCalendarNotes,
  saveCalendarEvent,
  saveCalendarNote,
  deleteCalendarEvent
} from '../../api/teacher';
import { auth } from '../../api/config';
import { motion } from 'framer-motion';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import { usePresence } from '../../hooks/usePresence';

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
    h4: {
      fontFamily: fontFamily,
      fontWeight: 600,
    },
    h5: {
      fontFamily: fontFamily,
      fontWeight: 500,
    },
    h6: {
      fontFamily: fontFamily,
      fontWeight: 500,
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

const formatRelativeTime = (timestamp, t) => {
  if (!timestamp) return t('common.time.unknown');

  try {
    const now = new Date();
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return t('common.time.unknown');

    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return t('common.time.justNow');
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return t('common.time.minutesAgo', { count: diffInMinutes });
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return t('common.time.hoursAgo', { count: diffInHours });
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return t('common.time.daysAgo', { count: diffInDays });
    }

    return date.toLocaleDateString();
  } catch (error) {
    return t('common.time.unknown');
  }
};

const StatsCard = ({ stat }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isRTL = getCurrentLanguage() === 'ar';
  const theme = useTheme();

  // Calendar-specific states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(true);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [dayNote, setDayNote] = useState('');
  const [savedNotes, setSavedNotes] = useState({});
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to get Monday of the current week
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const hasEvents = (date) => {
    if (!stat.schedule || !Array.isArray(stat.schedule)) return false;
    const dateStr = date.toISOString().split('T')[0];
    return stat.schedule.some((event) => event.date === dateStr);
  };

  // Get array of 7 days in the current week
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  useEffect(() => {
    if (stat.isCalendar && user) {
      loadCalendarData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart, user]);

  useEffect(() => {
    if (selectedDate && user) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setDayNote(savedNotes[dateStr] || '');
    }
  }, [selectedDate, savedNotes, user]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const endDate = new Date(currentWeekStart);
      endDate.setDate(currentWeekStart.getDate() + 6);

      // Load events
      const events = await getTeacherCalendarEvents(user.id, currentWeekStart, endDate);
      stat.schedule = events;

      // Load notes
      const notes = await getTeacherCalendarNotes(user.id, currentWeekStart, endDate);
      setSavedNotes(notes);
    } catch (err) {
      setError('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!newEvent.title || !newEvent.time) {
        setError(t('calendar.addEvent.form.required'));
        return;
      }

      const eventData = {
        title: newEvent.title,
        time: newEvent.time,
        description: newEvent.description,
        date: selectedDate.toISOString().split('T')[0]
      };

      await saveCalendarEvent(user.id, eventData);

      // Reset form and close dialog
      setNewEvent({
        title: '',
        time: '',
        description: ''
      });
      setIsAddEventOpen(false);

      // Refresh calendar data
      await loadCalendarData();
    } catch (err) {
      console.error('Failed to add event:', err);
      setError(t('calendar.addEvent.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      await saveCalendarNote(user.id, dateStr, dayNote);
      setSavedNotes((prev) => ({
        ...prev,
        [dateStr]: dayNote
      }));
      setIsEditingNote(false);
    } catch (err) {
      setError('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      setLoading(true);
      await deleteCalendarEvent(user.id, eventId);
      await loadCalendarData();
    } catch (err) {
      setError(err.message || 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      await saveCalendarNote(user.id, dateStr, '');
      setSavedNotes((prev) => ({
        ...prev,
        [dateStr]: ''
      }));
      setDayNote('');
    } catch (err) {
      setError('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  const toggleSchedule = () => {
    setIsScheduleExpanded(!isScheduleExpanded);
  };

  return (
    <Box sx={{ height: '100%', direction: isRTL ? 'rtl' : 'ltr' }}>
      {/* Calendar Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#fff',
            fontWeight: 600,
            fontFamily
          }}
        >
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
            <KeyboardArrowDownIcon sx={{ transform: 'rotate(-90deg)' }} />
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
            <KeyboardArrowDownIcon sx={{ transform: 'rotate(90deg)' }} />
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
                  backgroundColor: isSelectedDay ? 'rgba(0, 255, 163, 0.1)' : 'rgba(45, 55, 72, 0.5)',
                  border: isSelectedDay ? '1px solid #00FFA3' : '1px solid rgba(255, 255, 255, 0.1)',
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 500,
              fontFamily
            }}
          >
            {selectedDate.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Typography>
          <IconButton
            onClick={() => setIsAddEventOpen(true)}
            sx={{
              color: '#00FFA3',
              backgroundColor: 'rgba(0, 255, 163, 0.1)',
              '&:hover': { backgroundColor: 'rgba(0, 255, 163, 0.2)' }
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>

        <Stack spacing={2}>
          {stat.schedule &&
            stat.schedule
              .filter(
                (event) =>
                  event.date === selectedDate.toISOString().split('T')[0]
              )
              .map((event, index) => (
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
                          mb: 0.5,
                          fontFamily
                        }}
                      >
                        {event.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontFamily
                        }}
                      >
                        {event.time}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
          {(!stat.schedule ||
            stat.schedule.filter(
              (event) =>
                event.date === selectedDate.toISOString().split('T')[0]
            ).length === 0) && (
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
              <Typography variant="body2" sx={{ fontFamily }}>
                {t('calendar.noEvents')}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Add Event Dialog */}
        <Dialog
          open={isAddEventOpen}
          onClose={() => setIsAddEventOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              p: 0,
              backgroundColor: 'rgba(45, 55, 72, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }
          }}
        >
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              py: 3,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontFamily }}>
                {t('calendar.addEvent.title')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontFamily }}>
                {selectedDate.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setIsAddEventOpen(false)}
              size="small"
              sx={{
                color: '#fff',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <DialogContent sx={{ p: 3 }}>
            <TextField
              required
              fullWidth
              label={t('calendar.addEvent.form.title')}
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              error={error && !newEvent.title}
              helperText={error && !newEvent.title ? t('calendar.addEvent.form.titleRequired') : ''}
              InputLabelProps={{
                style: { fontFamily },
                shrink: true
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  borderRadius: '12px',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  },
                  '&:hover fieldset': {
                    borderColor: '#00FFA3'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00FFA3'
                  }
                }
              }}
            />

            <TextField
              required
              fullWidth
              type="time"
              label={t('calendar.addEvent.form.time')}
              value={newEvent.time}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              error={error && !newEvent.time}
              helperText={error && !newEvent.time ? t('calendar.addEvent.form.timeRequired') : ''}
              InputLabelProps={{
                style: { fontFamily },
                shrink: true
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  borderRadius: '12px',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  },
                  '&:hover fieldset': {
                    borderColor: '#00FFA3'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00FFA3'
                  }
                }
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label={t('calendar.addEvent.form.description')}
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              InputLabelProps={{
                style: { fontFamily },
                shrink: true
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  borderRadius: '12px',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  },
                  '&:hover fieldset': {
                    borderColor: '#00FFA3'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00FFA3'
                  }
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, display: 'flex', gap: 2 }}>
            <Button
              onClick={() => setIsAddEventOpen(false)}
              variant="outlined"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                minWidth: '100px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: '#00FFA3'
                }
              }}
            >
              {t('calendar.addEvent.actions.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleAddEvent}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              sx={{
                backgroundColor: '#00FFA3',
                color: '#0F172A',
                minWidth: '140px',
                '& .MuiButton-startIcon': {
                  marginRight: 1,
                  marginLeft: 0
                },
                '&:hover': { 
                  backgroundColor: '#00cc82' 
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(0, 255, 163, 0.3)'
                }
              }}
            >
              {loading ? t('calendar.addEvent.actions.adding') : t('calendar.addEvent.actions.add')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

const TeacherDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const { user } = useAuth();
  const isRTL = getCurrentLanguage() === 'ar';
  const theme = useTheme();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState([]);
  const [activities, setActivities] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [newCourseDialog, setNewCourseDialog] = useState(false);
  const [newAssignmentDialog, setNewAssignmentDialog] = useState(false);
  const [startLiveClassDialog, setStartLiveClassDialog] = useState(false);
  const [liveClassData, setLiveClassData] = useState({
    title: '',
    description: '',
    subject: '',
    enableChat: true,
    allowQuestions: true
  });
  const [startStreamDialog, setStartStreamDialog] = useState(false);
  const [streamData, setStreamData] = useState({
    channelName: '',
    description: '',
    enableChat: true,
    allowQuestions: true
  });

  const [newCourseData, setNewCourseData] = useState({
    title: '',
    description: '',
    schedule: [],
    level: ''
  });

  const [newAssignmentData, setNewAssignmentData] = useState({
    title: '',
    description: '',
    content: ''
  });

  const [uploadError, setUploadError] = useState('');
  const [currentTab, setCurrentTab] = useState(0);

  // Add presence hook
  const { onlineUsers, loading: presenceLoading } = usePresence(
    students.map(student => student.id)
  );

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const results = await Promise.allSettled([
        getTeacherLessons(user.id),
        getTeacherSchedule(user.id, startOfDay, endOfDay),
        getTeacherCourses(user.id),
        getTeacherAssignments(user.id),
        getTeacherStudents(user.id),
        getTeacherStats(user.id),
        getRecentActivities(user.id)
      ]);

      const [
        lessonsResult,
        scheduleResult,
        coursesResult,
        assignmentsResult,
        studentsResult,
        statsResult,
        activitiesResult
      ] = results;

      if (lessonsResult.status === 'fulfilled') setLessons(lessonsResult.value);
      if (scheduleResult.status === 'fulfilled') setSchedule(scheduleResult.value);
      if (coursesResult.status === 'fulfilled') setCourses(coursesResult.value);
      if (assignmentsResult.status === 'fulfilled') setAssignments(assignmentsResult.value);
      if (studentsResult.status === 'fulfilled') setStudents(studentsResult.value);
      if (activitiesResult.status === 'fulfilled') setActivities(activitiesResult.value);

      const failedRequests = results.filter((result) => result.status === 'rejected');
      if (failedRequests.length > 0) {
        setError('Some dashboard data could not be loaded. Please check your internet connection.');
      }

      // For demonstration, set stats for the calendar
      setStats([
        {
          title: 'Calendar',
          value: new Date().toLocaleDateString('en-US', { month: 'long' }),
          icon: <CalendarIcon />,
          schedule: (scheduleResult.status === 'fulfilled' ? scheduleResult.value : []).map(
            (item) => ({
              time: item.time,
              title: item.subject
            })
          ),
          accent: true,
          isCalendar: true
        }
      ]);
    } catch (err) {
      setError('Failed to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartLiveClass = async () => {
    try {
      if (!liveClassData.title) {
        setError('Title is required');
        return;
      }

      setLoading(true);
      setError(null);

      // Create a Daily.co room
      const roomData = {
        title: liveClassData.title,
        description: liveClassData.description,
        subject: liveClassData.subject || 'General',
        startTime: new Date().toISOString(),
        teacherId: user.id,
        teacherName: user.displayName || 'Unknown Teacher'
      };

      const result = await createDailyRoom(user.id, roomData);

      // Close dialog & reset
      setStartLiveClassDialog(false);
      setLiveClassData({
        title: '',
        description: '',
        subject: ''
      });

      // Navigate to the Daily.co room
      window.location.href = `/streaming/teacher.html?room=${result.roomName}`;
    } catch (error) {
      setError(error.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    try {
      setLoading(true);
      await createNewCourse({
        ...newCourseData,
        teacherId: user.id
      });
      setNewCourseDialog(false);
      loadDashboardData();
    } catch (err) {
      setError('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      if (!newAssignmentData.title) {
        setError(t('teacherPages.assignments.errors.titleRequired'));
        return;
      }

      setLoading(true);
      setError(null);

      await createNewAssignment({
        title: newAssignmentData.title,
        description: newAssignmentData.description,
        content: newAssignmentData.content,
        teacherId: user.id,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        submissionCount: 0
      });

      // Reset form and close dialog
      setNewAssignmentData({
        title: '',
        description: '',
        content: ''
      });
      setNewAssignmentDialog(false);

      // Refresh assignments list
      await loadDashboardData();

    } catch (err) {
      console.error('Failed to create assignment:', err);
      setError(t('teacherPages.assignments.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleStartStream = async () => {
    try {
      if (!streamData.channelName) {
        setError('Stream title is required');
        return;
      }

      setLoading(true);
      setError(null);

      // Create Daily.co room
      const roomData = {
        title: streamData.channelName,
        description: streamData.description,
        subject: 'Live Stream',
        startTime: new Date().toISOString(),
        teacherId: user.id,
        teacherName: user.displayName || 'Unknown Teacher',
        enableChat: streamData.enableChat,
        allowQuestions: streamData.allowQuestions
      };

      const result = await createDailyRoom(user.id, roomData);

      // Close & reset
      setStartStreamDialog(false);
      setStreamData({
        channelName: '',
        description: '',
        enableChat: true,
        allowQuestions: true
      });

      // Navigate to streaming page
      window.location.href = `/streaming/teacher.html?room=${result.roomName}`;
    } catch (error) {
      setError('Failed to start stream: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CircularProgress sx={{ color: '#4a90e2' }} />
      </Box>
    );
  }

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap');
            
            * {
              font-family: ${fontFamily};
            }
          `}
        </style>
        <Box
          sx={{
            minHeight: '100vh',
            background: 'linear-gradient(145deg, #1a1f2c 0%, #2d3748 100%)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            pb: 7 // Add padding for bottom navigation
          }}
        >
          {/* Main Content */}
          <Box sx={{ 
            flex: 1, 
            px: 2, 
            py: 3, 
            overflowY: 'auto',
            pt: { xs: 12, sm: 14 } // Much more top padding for mobile status bar and safe area
          }}>
            {/* Quick Actions - Now as touch-friendly cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[
                {
                  icon: <LiveTvIcon sx={{ fontSize: 28, color: '#00FFA3' }} />,
                  text: t('dashboard.teacher.quickActions.liveClass.title'),
                  action: () => setStartStreamDialog(true)
                },
                {
                  icon: <AssignmentIcon sx={{ fontSize: 28, color: '#00FFA3' }} />,
                  text: t('dashboard.teacher.quickActions.assignment.title'),
                  action: () => setNewAssignmentDialog(true)
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
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#fff',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        lineHeight: 1.2
                      }}
                    >
                      {action.text}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Content based on current tab */}
            <Box sx={{ display: currentTab === 0 ? 'block' : 'none' }}>
              {/* Calendar View */}
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
                <CalendarIcon sx={{ color: '#00FFA3' }} />
                {t('dashboard.schedule.title')}
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '12px',
                  bgcolor: 'rgba(45, 55, 72, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                {stats
                  .filter((stat) => stat.isCalendar)
                  .map((stat, index) => (
                    <StatsCard key={index} stat={stat} />
                  ))}
              </Paper>
            </Box>

            <Box sx={{ display: currentTab === 1 ? 'block' : 'none' }}>
              {/* Assignments View */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                  {t('dashboard.teacher.assignments.title')}
                </Typography>
                <IconButton
                  onClick={() => setNewAssignmentDialog(true)}
                  sx={{
                    color: '#00FFA3',
                    backgroundColor: 'rgba(0, 255, 163, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 255, 163, 0.2)',
                    }
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              <Stack spacing={2}>
                {assignments.map((assignment, index) => (
                  <Paper
                    key={assignment.id}
                    elevation={0}
                    onClick={() => navigate(`/${getCurrentLanguage()}/teacher/assignments/${assignment.id}`)}
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      bgcolor: 'rgba(45, 55, 72, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:active': {
                        transform: 'scale(0.98)'
                      }
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color: '#fff',
                        fontWeight: 500,
                        mb: 1
                      }}
                    >
                      {assignment.title}
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      display: 'block',
                      mb: 1
                    }}>
                      {t('teacherPages.assignments.created')} {formatRelativeTime(assignment.createdAt, t)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PeopleIcon sx={{ fontSize: 16, color: '#00FFA3' }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {assignment.submissions?.length || 0}
                        </Typography>
                      </Box>
                      <Chip
                        label={t(`teacherPages.assignments.status.${assignment.status?.toLowerCase() || 'active'}`)}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(0, 255, 163, 0.1)',
                          color: '#00FFA3',
                          fontSize: '0.75rem'
                        }}
                      />
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
                    <MenuBookIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5, color: '#00FFA3' }} />
                    <Typography variant="body2">
                      {t('dashboard.teacher.assignments.empty')}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            <Box sx={{ display: currentTab === 2 ? 'block' : 'none' }}>
              {/* Students View - Removed online students section */}
              
              {/* Keep only the "All Students" section */}
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
                  <PeopleIcon sx={{ color: '#00FFA3' }} />
                  {t('dashboard.teacher.students.all')} {isRTL ? `(${students.length.toLocaleString('ar-SA')})` : `(${students.length})`}
                </Typography>
                <Stack spacing={2}>
                  {students.map((student) => (
                    <Paper
                      key={student.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: 'rgba(45, 55, 72, 0.9)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ position: 'relative' }}>
                          <Avatar sx={{ bgcolor: 'rgba(0, 255, 163, 0.1)', color: '#00FFA3' }}>
                            {student.displayName?.charAt(0) || 'S'}
                          </Avatar>
                          {onlineUsers[student.id]?.isOnline && (
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                backgroundColor: '#00FFA3',
                                border: '2px solid rgba(45, 55, 72, 0.9)',
                                position: 'absolute',
                                bottom: 0,
                                right: 0
                              }}
                            />
                          )}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ color: '#fff', fontWeight: 500, fontFamily }}>
                            {student.displayName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily }}>
                            {student.email}
                          </Typography>
                          {!onlineUsers[student.id]?.isOnline && onlineUsers[student.id]?.lastSeen && (
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', fontFamily }}>
                              {t('dashboard.teacher.students.lastSeen')} {formatRelativeTime(onlineUsers[student.id].lastSeen, t)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                  {students.length === 0 && (
                    <Box
                      sx={{
                        textAlign: 'center',
                        py: 4,
                        color: 'rgba(255, 255, 255, 0.7)',
                        bgcolor: 'rgba(45, 55, 72, 0.5)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <PeopleIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5, color: '#00FFA3' }} />
                      <Typography variant="body2" sx={{ fontFamily }}>
                        {t('dashboard.teacher.students.empty')}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Box>

            <Box sx={{ display: currentTab === 3 ? 'block' : 'none' }}>
              {/* Activity View */}
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
                <TrendingUpIcon sx={{ color: '#00FFA3' }} />
                {t('dashboard.teacher.activity.title')}
              </Typography>
              <Stack spacing={2}>
                {activities.map((activity, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      bgcolor: 'rgba(45, 55, 72, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#00FFA3',
                          mt: 1
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: '#fff', mb: 0.5 }}>
                          {activity.description}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {formatRelativeTime(activity.timestamp, t)}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
                {activities.length === 0 && (
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
                    <TrendingUpIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5, color: '#00FFA3' }} />
                    <Typography variant="body2">
                      {t('dashboard.teacher.activity.empty')}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Create Assignment Dialog */}
            <Dialog
              open={newAssignmentDialog}
              onClose={() => setNewAssignmentDialog(false)}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: '16px',
                  p: 0,
                  backgroundColor: 'rgba(45, 55, 72, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden'
                }
              }}
            >
              <Box
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  py: 3,
                  px: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontFamily }}>
                    {t('teacherPages.assignments.dialogs.assignment.title')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontFamily }}>
                    {t('dashboard.teacher.dialogs.assignment.subtitle')}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setNewAssignmentDialog(false)}
                  size="small"
                  sx={{
                    color: '#fff',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <DialogContent sx={{ p: 3 }}>
                <TextField
                  required
                  fullWidth
                  label={t('teacherPages.assignments.dialogs.assignment.form.title')}
                  variant="outlined"
                  value={newAssignmentData.title}
                  onChange={(e) =>
                    setNewAssignmentData({ ...newAssignmentData, title: e.target.value })
                  }
                  error={error && !newAssignmentData.title}
                  helperText={error && !newAssignmentData.title ? t('teacherPages.assignments.errors.titleRequired') : ''}
                  InputLabelProps={{
                    style: { fontFamily },
                    shrink: true
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      borderRadius: '12px',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      },
                      '&:hover fieldset': {
                        borderColor: '#00FFA3'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00FFA3'
                      }
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label={t('teacherPages.assignments.dialogs.assignment.form.description')}
                  variant="outlined"
                  multiline
                  rows={4}
                  value={newAssignmentData.description}
                  onChange={(e) =>
                    setNewAssignmentData({ ...newAssignmentData, description: e.target.value })
                  }
                  InputLabelProps={{
                    style: { fontFamily },
                    shrink: true
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      borderRadius: '12px',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      },
                      '&:hover fieldset': {
                        borderColor: '#00FFA3'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00FFA3'
                      }
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label={t('teacherPages.assignments.dialogs.assignment.form.content')}
                  variant="outlined"
                  multiline
                  rows={6}
                  value={newAssignmentData.content}
                  onChange={(e) =>
                    setNewAssignmentData({ ...newAssignmentData, content: e.target.value })
                  }
                  InputLabelProps={{
                    style: { fontFamily },
                    shrink: true
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      borderRadius: '12px',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      },
                      '&:hover fieldset': {
                        borderColor: '#00FFA3'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00FFA3'
                      }
                    }
                  }}
                />
              </DialogContent>
              <DialogActions sx={{ p: 3, display: 'flex', gap: 2 }}>
                <Button
                  onClick={() => setNewAssignmentDialog(false)}
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    minWidth: '100px',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: '#00FFA3'
                    }
                  }}
                >
                  {t('teacherPages.assignments.dialogs.assignment.actions.cancel')}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCreateAssignment}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  sx={{
                    backgroundColor: '#00FFA3',
                    color: '#0F172A',
                    minWidth: '140px',
                    '& .MuiButton-startIcon': {
                      marginRight: 1,
                      marginLeft: 0
                    },
                    '&:hover': { 
                      backgroundColor: '#00cc82' 
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(0, 255, 163, 0.3)'
                    }
                  }}
                >
                  {loading ? t('teacherPages.assignments.dialogs.assignment.actions.creating') : t('teacherPages.assignments.dialogs.assignment.actions.create')}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Start Live Stream Dialog */}
            <Dialog
              open={startStreamDialog}
              onClose={() => setStartStreamDialog(false)}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: '16px',
                  p: 0,
                  backgroundColor: 'rgba(45, 55, 72, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden'
                }
              }}
            >
              <Box
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  py: 3,
                  px: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontFamily }}>
                    {t('teacherPages.streaming.startStream.title')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontFamily }}>
                    {t('dashboard.teacher.dialogs.liveClass.subtitle')}
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => setStartStreamDialog(false)}
                  size="small"
                  sx={{
                    color: '#fff',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <DialogContent sx={{ p: 3 }}>
                <TextField
                  required
                  fullWidth
                  label={t('teacherPages.streaming.startStream.streamTitle')}
                  variant="outlined"
                  value={streamData.channelName}
                  onChange={(e) => setStreamData({ ...streamData, channelName: e.target.value })}
                  error={error && !streamData.channelName}
                  helperText={error && !streamData.channelName ? t('dashboard.teacher.dialogs.liveClass.form.titleRequired') : ''}
                  InputLabelProps={{
                    style: { fontFamily },
                    shrink: true
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      borderRadius: '12px',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      },
                      '&:hover fieldset': {
                        borderColor: '#00FFA3'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00FFA3'
                      }
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label={t('dashboard.teacher.dialogs.liveClass.form.description')}
                  variant="outlined"
                  multiline
                  rows={4}
                  value={streamData.description}
                  onChange={(e) => setStreamData({ ...streamData, description: e.target.value })}
                  placeholder={t('dashboard.teacher.dialogs.liveClass.form.placeholder.description')}
                  InputLabelProps={{
                    style: { fontFamily },
                    shrink: true
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      borderRadius: '12px',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      },
                      '&:hover fieldset': {
                        borderColor: '#00FFA3'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00FFA3'
                      }
                    }
                  }}
                />

                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={streamData.enableChat}
                        onChange={(e) => setStreamData({ ...streamData, enableChat: e.target.checked })}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#00FFA3',
                            '& + .MuiSwitch-track': {
                              backgroundColor: 'rgba(0, 255, 163, 0.5)'
                            }
                          }
                        }}
                      />
                    }
                    label={
                      <Typography sx={{ color: '#fff', fontFamily }}>
                        {t('teacherPages.streaming.chat.title')}
                      </Typography>
                    }
                  />
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={streamData.allowQuestions}
                      onChange={(e) => setStreamData({ ...streamData, allowQuestions: e.target.checked })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#00FFA3',
                          '& + .MuiSwitch-track': {
                            backgroundColor: 'rgba(0, 255, 163, 0.5)'
                          }
                        }
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ color: '#fff', fontFamily }}>
                      {t('teacherPages.streaming.participants.title')}
                    </Typography>
                  }
                />
              </DialogContent>
              <DialogActions sx={{ p: 3, display: 'flex', gap: 2 }}>
                <Button
                  onClick={() => setStartStreamDialog(false)}
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    minWidth: '100px',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: '#00FFA3'
                    }
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleStartStream}
                  disabled={loading}
                  sx={{
                    backgroundColor: '#00FFA3',
                    color: '#0F172A',
                    minWidth: 'unset',
                    width: '48px',
                    height: '48px',
                    padding: 0,
                    borderRadius: 2,
                    '&:hover': { 
                      backgroundColor: '#00cc82' 
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(0, 255, 163, 0.3)'
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : <PlayIcon />}
                </Button>
              </DialogActions>
            </Dialog>

          </Box>

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
              onChange={(event, newValue) => {
                setCurrentTab(newValue);
              }}
              sx={{
                backgroundColor: 'transparent',
                height: 65,
                '& .MuiBottomNavigationAction-root': {
                  color: 'rgba(255,255,255,0.5)',
                  '&.Mui-selected': {
                    color: '#00FFA3'
                  },
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.625rem'
                  }
                }
              }}
            >
              <BottomNavigationAction
                label={t('nav.schedule')}
                icon={<CalendarIcon />}
                sx={{ 
                  minWidth: 'auto',
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.625rem'
                  }
                }}
              />
              <BottomNavigationAction
                label={t('nav.assignments')}
                icon={<AssignmentIcon />}
                sx={{ minWidth: 'auto' }}
              />
              <BottomNavigationAction
                label={t('nav.students')}
                icon={<PeopleIcon />}
                sx={{ minWidth: 'auto' }}
              />
              <BottomNavigationAction
                label={t('nav.activity')}
                icon={<TrendingUpIcon />}
                sx={{ minWidth: 'auto' }}
              />
            </BottomNavigation>
          </Paper>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default TeacherDashboard;
