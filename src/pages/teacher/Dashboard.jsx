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
  Link,
  Paper,
  Avatar,
  FormControlLabel,
  Switch,
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
  Delete as DeleteIcon,
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
  deleteCalendarEvent,
} from '../../api/teacher';
import { auth } from '../../api/config';

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

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

const StatsCard = ({ stat }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(today));
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
  const isRTL = getCurrentLanguage() === 'ar';

  // Get Monday of the current week
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    return new Date(d.setDate(diff));
  }

  // Get dates for the week
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(currentWeekStart.getDate() + i);
    return date;
  });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handlePrevWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const hasEvents = (date) => {
    if (!stat.schedule || !Array.isArray(stat.schedule)) return false;
    const dateStr = date.toISOString().split('T')[0];
    return stat.schedule.some(event => event.date === dateStr);
  };

  useEffect(() => {
    if (stat.isCalendar && user) {
      loadCalendarData();
    }
  }, [currentWeekStart, user]);

  // Add new effect for loading notes when date changes
  useEffect(() => {
    if (selectedDate && user) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setDayNote(savedNotes[dateStr] || '');
    }
  }, [selectedDate, savedNotes]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const endDate = new Date(currentWeekStart);
      endDate.setDate(currentWeekStart.getDate() + 6);
      
      // Load events
      const events = await getTeacherCalendarEvents(user.id, currentWeekStart, endDate);
      console.log('Loaded events:', events);
      stat.schedule = events;
      
      // Load notes
      const notes = await getTeacherCalendarNotes(user.id, currentWeekStart, endDate);
      console.log('Loaded notes:', notes);
      setSavedNotes(notes);
    } catch (err) {
      console.error('Error loading calendar data:', err);
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
        setError('Title and time are required');
        return;
      }

      const eventData = {
        ...newEvent,
        date: selectedDate.toISOString().split('T')[0],
        teacherId: user.id
      };

      console.log('Saving event data:', eventData);
      const eventId = await saveCalendarEvent(user.id, eventData);
      console.log('Event saved with ID:', eventId);
      
      // Reset form and refresh data
    setNewEvent({ title: '', time: '', description: '' });
    setIsAddEventOpen(false);
      await loadCalendarData();
    } catch (err) {
      console.error('Error adding event:', err);
      setError('Failed to add event');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      await saveCalendarNote(user.id, dateStr, dayNote);
      
      // Update local state
      setSavedNotes(prev => ({
        ...prev,
        [dateStr]: dayNote
      }));
      
      setIsEditingNote(false);
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      setLoading(true);
      console.log('Deleting event:', eventId);
      console.log('Teacher ID:', user.id);
      await deleteCalendarEvent(user.id, eventId);
      console.log('Event deleted successfully');
      await loadCalendarData();
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err.message || 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      await saveCalendarNote(user.id, dateStr, ''); // Save empty note to delete it
      setSavedNotes(prev => ({
        ...prev,
        [dateStr]: ''
      }));
      setDayNote('');
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  const toggleSchedule = () => {
    setIsScheduleExpanded(!isScheduleExpanded);
  };

  // Add debug output in the render to check events
  console.log('Current schedule:', stat.schedule);
  console.log('Selected date:', selectedDate?.toISOString().split('T')[0]);

  return (
  <Box
    sx={{
      position: 'relative',
      height: '100%',
      direction: isRTL ? 'rtl' : 'ltr',
        ...(stat.isCalendar && {
      '&:before': {
        content: '""',
        position: 'absolute',
        top: '8px',
        [isRTL ? 'right' : 'left']: '8px',
        [isRTL ? 'left' : 'right']: '-8px',
        bottom: '-8px',
        backgroundColor: stat.accent ? 'rgba(187, 92, 57, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderRadius: '16px',
        zIndex: 0
      }
        })
    }}
  >
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        backgroundColor: stat.accent ? '#bb5c39' : '#fff',
        borderRadius: '16px',
        position: 'relative',
          zIndex: 2,
        transition: 'all 0.2s',
        border: '1px solid',
        borderColor: stat.accent ? '#bb5c39' : 'rgba(0, 0, 0, 0.1)',
        '&:hover': {
          transform: isRTL ? 'translate(4px, -4px)' : 'translate(-4px, -4px)',
          }
        }}
      >
        {stat.isCalendar ? (
          <>
            {/* Calendar Header with Navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon sx={{ color: '#fff', fontSize: 24 }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  {t('dashboard.teacher.stats.calendar.title')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={handlePrevWeek} sx={{ color: '#fff' }}>
                  <KeyboardArrowDownIcon sx={{ transform: 'rotate(90deg)' }} />
                </IconButton>
                <IconButton onClick={handleNextWeek} sx={{ color: '#fff' }}>
                  <KeyboardArrowDownIcon sx={{ transform: 'rotate(-90deg)' }} />
                </IconButton>
              </Box>
            </Box>

            {/* Calendar Grid */}
            <Box sx={{ mb: 2 }}>
              {/* Weekday Headers */}
              <Grid container spacing={1.5} sx={{ px: 1, mb: 1 }}>
                {weekDays.map((day, index) => (
                  <Grid item xs key={index}>
                    <Typography
                      align="center"
                      sx={{
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 500
                      }}
                    >
                      {day}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {/* Calendar Days */}
              <Grid container spacing={1.5} sx={{ px: 1 }}>
                {weekDates.map((date, index) => {
                  const isCurrentDay = isToday(date);
                  const isSelectedDay = selectedDate && 
                    date.getDate() === selectedDate.getDate() && 
                    date.getMonth() === selectedDate.getMonth() && 
                    date.getFullYear() === selectedDate.getFullYear();
                  const dayHasEvents = hasEvents(date);
                  
                  return (
                    <Grid item xs key={index}>
                      <Box
                        onClick={() => setSelectedDate(new Date(date))}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        <Box
                          sx={{
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            backgroundColor: isSelectedDay ? '#fff' : 'transparent',
                            border: isSelectedDay ? '2px solid #fff' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            '&:hover': {
                              backgroundColor: isSelectedDay ? '#fff' : 'rgba(255, 255, 255, 0.1)'
                            },
                            '&::after': dayHasEvents ? {
                              content: '""',
                              position: 'absolute',
                              bottom: '2px',
                              width: '4px',
                              height: '4px',
                              backgroundColor: isSelectedDay ? '#bb5c39' : '#fff',
                              borderRadius: '50%'
                            } : {},
                            '&::before': isCurrentDay && !isSelectedDay ? {
                              content: '""',
                              position: 'absolute',
                              top: '2px',
                              width: '4px',
                              height: '4px',
                              backgroundColor: '#fff',
                              borderRadius: '50%'
                            } : {}
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '0.9rem',
                              fontWeight: isCurrentDay || isSelectedDay ? 700 : 400,
                              color: isSelectedDay ? '#bb5c39' : '#fff',
                              lineHeight: 1
                            }}
                          >
                            {date.getDate()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            {/* Today's Schedule */}
            <Box
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                p: 2,
                mt: 'auto'
              }}
            >
              <Box
                onClick={toggleSchedule}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  mb: isScheduleExpanded ? 2 : 0
                }}
              >
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: '#fff', 
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                >
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Typography>
                <IconButton 
                  size="small" 
                  sx={{ 
                    color: '#fff',
                    transform: isScheduleExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                >
                  <KeyboardArrowDownIcon />
                </IconButton>
              </Box>

              {isScheduleExpanded && (
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {t('calendar.events')}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setIsAddEventOpen(true)}
                      sx={{ 
                        color: '#fff',
                        padding: 0,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {stat.schedule && stat.schedule
                      .filter(event => event.date === selectedDate.toISOString().split('T')[0])
                      .map((event, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                          gap: 1.5,
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          p: 1.5
                          }}
                        >
                          <Box
                            sx={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: '#fff',
                              borderRadius: '50%',
                              opacity: 0.8
                            }}
                          />
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.9)',
                              fontSize: '0.85rem',
                              fontWeight: 500,
                              mb: 0.5
                            }}
                          >
                            {event.title}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              display: 'block'
                            }}
                          >
                            {event.time}
                            {event.description && (
                              <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                                - {event.description}
                              </span>
                            )}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event.id);
                          }}
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              color: '#fff'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}

                  {(!stat.schedule || stat.schedule.filter(event => 
                    event.date === selectedDate.toISOString().split('T')[0]
                  ).length === 0) && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        py: 1
                      }}
                    >
                      {t('calendar.noEvents')}
                    </Typography>
                  )}

                  {/* Notes Section */}
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {t('calendar.notes.title')}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {dayNote && !isEditingNote && (
                      <IconButton
                        size="small"
                            onClick={handleDeleteNote}
                            disabled={loading}
                            sx={{
                              color: 'rgba(255, 255, 255, 0.7)',
                              padding: 0,
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: '#fff'
                              },
                              '&.Mui-disabled': {
                                color: 'rgba(255, 255, 255, 0.5)'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton 
                          size="small" 
                          onClick={() => {
                            if (isEditingNote) {
                              handleSaveNote();
                            } else {
                              setIsEditingNote(true);
                            }
                          }}
                          disabled={loading}
                          sx={{ 
                            color: '#fff',
                            padding: 0,
                            '&.Mui-disabled': {
                              color: 'rgba(255, 255, 255, 0.5)'
                            }
                          }}
                        >
                          {loading ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : isEditingNote ? (
                            <SaveIcon fontSize="small" />
                          ) : (
                            <EditIcon fontSize="small" />
                          )}
                      </IconButton>
                      </Box>
                    </Box>
                    {isEditingNote ? (
                      <TextField
                        multiline
                        rows={2}
                        fullWidth
                        value={dayNote}
                        onChange={(e) => setDayNote(e.target.value)}
                        variant="standard"
                        placeholder={t('calendar.notes.placeholder')}
                        sx={{
                          '& .MuiInputBase-input': {
                            color: '#fff',
                            fontSize: '0.85rem',
                          },
                          '& .MuiInput-underline:before': {
                            borderBottomColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                            borderBottomColor: 'rgba(255, 255, 255, 0.4)',
                          },
                          '& .MuiInput-underline:after': {
                            borderBottomColor: '#fff',
                          },
                        }}
                      />
                    ) : (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '0.85rem',
                          minHeight: '40px',
                          fontStyle: savedNotes[selectedDate.toISOString().split('T')[0]] ? 'normal' : 'italic'
                        }}
                      >
                        {savedNotes[selectedDate.toISOString().split('T')[0]] || t('calendar.notes.noNotes')}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              )}
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              {React.cloneElement(stat.icon, { 
                sx: { 
                  fontSize: 32, 
                  color: stat.accent ? '#fff' : '#000'
                } 
              })}
            </Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 700, 
              mb: 2,
              color: stat.accent ? '#fff' : '#000'
            }}>
              {stat.value}
            </Typography>
            <Typography variant="body1" sx={{ 
              color: stat.accent ? 'rgba(255, 255, 255, 0.8)' : '#666',
              mb: 2,
              fontSize: '1rem'
            }}>
              {stat.title}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: stat.accent ? 'rgba(255, 255, 255, 0.8)' : '#666',
              fontSize: '0.85rem'
            }}>
              {stat.change}
            </Typography>
          </>
        )}
    </Paper>

    {/* Add Event Dialog */}
    <Dialog
      open={isAddEventOpen}
      onClose={() => setIsAddEventOpen(false)}
        TransitionProps={{
          enter: true,
          exit: true
        }}
      PaperProps={{
        sx: {
          backgroundColor: '#fff',
            borderRadius: '20px',
          width: '100%',
            maxWidth: '400px',
            overflow: 'hidden',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
            p: 0
          }
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #bb5c39 0%, #a04b2e 100%)',
            py: 4,
            px: 3,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {t('calendar.addEvent.title')}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t('calendar.addEvent.subtitle')}
              </Typography>
            </Box>
            <IconButton 
              onClick={() => setIsAddEventOpen(false)}
              size="small"
              sx={{ 
                color: 'white',
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
            <CloseIcon />
          </IconButton>
        </Box>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label={t('calendar.addEvent.form.title')}
            fullWidth
            required
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            variant="outlined"
            error={error && !newEvent.title}
            helperText={error && !newEvent.title ? t('calendar.addEvent.form.titleRequired') : ''}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'rgba(187, 92, 57, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#bb5c39',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#bb5c39',
                }
              }}
          />
          <TextField
            label={t('calendar.addEvent.form.time')}
            type="time"
            fullWidth
            required
            value={newEvent.time}
            onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
            error={error && !newEvent.time}
            helperText={error && !newEvent.time ? t('calendar.addEvent.form.timeRequired') : ''}
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'rgba(187, 92, 57, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#bb5c39',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#bb5c39',
                }
            }}
          />
          <TextField
            label={t('calendar.addEvent.form.description')}
            fullWidth
            multiline
            rows={3}
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            variant="outlined"
            placeholder={t('calendar.addEvent.form.placeholder.description')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'rgba(187, 92, 57, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#bb5c39',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#bb5c39',
                }
              }}
            />
            {error && !error.includes('required') && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
        </Stack>
      </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          onClick={() => setIsAddEventOpen(false)}
          variant="outlined"
          sx={{
            borderColor: 'rgba(187, 92, 57, 0.5)',
            color: '#bb5c39',
            px: 3,
            '&:hover': {
              backgroundColor: 'rgba(187, 92, 57, 0.05)',
              borderColor: '#bb5c39'
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
            backgroundColor: '#bb5c39',
            px: 4,
            '&:hover': {
              backgroundColor: '#a04b2e'
            },
            '&.Mui-disabled': {
              backgroundColor: 'rgba(187, 92, 57, 0.3)'
            }
          }}
        >
          {loading ? t('calendar.addEvent.actions.adding') : t('calendar.addEvent.actions.add')}
        </Button>
      </DialogActions>
    </Dialog>
  </Box>
);
};

const TeacherDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const { user } = useAuth();
  const isRTL = getCurrentLanguage() === 'ar';
  
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

  // Form states
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

  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Load data with individual error handling
      const results = await Promise.allSettled([
        getTeacherLessons(user.id),
        getTeacherSchedule(user.id, startOfDay, endOfDay),
        getTeacherCourses(user.id),
        getTeacherAssignments(user.id),
        getTeacherStudents(user.id),
        getTeacherStats(user.id),
        getRecentActivities(user.id)
      ]);

      // Process results and set data
      const [
        lessonsResult,
        scheduleResult,
        coursesResult,
        assignmentsResult,
        studentsResult,
        statsResult,
        activitiesResult
      ] = results;

      // Handle each result individually
      if (lessonsResult.status === 'fulfilled') setLessons(lessonsResult.value);
      if (scheduleResult.status === 'fulfilled') setSchedule(scheduleResult.value);
      if (coursesResult.status === 'fulfilled') setCourses(coursesResult.value);
      if (assignmentsResult.status === 'fulfilled') setAssignments(assignmentsResult.value);
      if (studentsResult.status === 'fulfilled') setStudents(studentsResult.value);
      if (activitiesResult.status === 'fulfilled') setActivities(activitiesResult.value);

      // Check if we have any rejected promises
      const failedRequests = results.filter(result => result.status === 'rejected');
      if (failedRequests.length > 0) {
        console.warn('Some data failed to load:', failedRequests);
        setError('Some dashboard data could not be loaded. Please check your internet connection.');
      }

      // Set stats even if some data is missing
      setStats([
        {
          title: 'Calendar',
          value: new Date().toLocaleDateString('en-US', { month: 'long' }),
          icon: <CalendarIcon />,
          schedule: (scheduleResult.status === 'fulfilled' ? scheduleResult.value : []).map(item => ({
            time: item.time,
            title: item.subject
          })),
          accent: true,
          isCalendar: true
        }
      ]);

    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data. Please check your internet connection and try again.');
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

      // Create Daily.co room
      const roomData = {
        title: liveClassData.title,
        description: liveClassData.description,
        subject: liveClassData.subject || 'General',
        startTime: new Date().toISOString(),
        teacherId: user.id,
        teacherName: user.displayName || 'Unknown Teacher'
      };

      const result = await createDailyRoom(user.id, roomData);
      console.log('Created Daily.co room:', result);

      // Close the dialog before navigation
      setStartLiveClassDialog(false);
      
      // Reset form data
      setLiveClassData({
        title: '',
        description: '',
        subject: ''
      });

      // Navigate to Daily.co room URL
      window.location.href = `/streaming/teacher.html?room=${result.roomName}`;

    } catch (error) {
      console.error('Error creating room:', error);
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
        setError('Title is required');
        return;
      }
      
      setLoading(true);
      setError(null);

      const assignmentId = await createNewAssignment({
        ...newAssignmentData,
        teacherId: user.id,
        dueDate: new Date().toISOString() // You might want to add a due date field to the form
      });

      console.log('Created assignment with ID:', assignmentId);
      setNewAssignmentDialog(false);
      setNewAssignmentData({
        title: '',
        description: '',
        content: ''
      });
      await loadDashboardData();
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError('');

    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleFile = (file) => {
    if (file?.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setUploadError('File size should be less than 10MB');
      return;
    }
    setNewAssignmentData(prev => ({ ...prev, pdf: file }));
    setUploadError('');
  };

  const handleRemovePdf = () => {
    setNewAssignmentData(prev => ({ ...prev, pdf: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

      // Create Daily.co room with stream data
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
      console.log('Created Daily.co room:', result);
      
      // Close dialog before navigation
      setStartStreamDialog(false);
      
      // Reset form data
      setStreamData({
        channelName: '',
        description: '',
        enableChat: true,
        allowQuestions: true
      });

      // Navigate to streaming page with room name
      window.location.href = `/streaming/teacher.html?room=${result.roomName}`;

    } catch (error) {
      console.error('Stream start failed:', error);
      setError('Failed to start stream: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        py: 4, 
        mt: { xs: 8, sm: 9 },
        direction: isRTL ? 'rtl' : 'ltr'
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3, textAlign: isRTL ? 'right' : 'left' }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Quick Actions and Assignments Section */}
        <Grid item xs={12} md={7}>
          <Box
            sx={{
              position: 'relative',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: '8px',
                [isRTL ? 'right' : 'left']: '8px',
                [isRTL ? 'left' : 'right']: '-8px',
                bottom: '-8px',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '16px',
                zIndex: 0
              }
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                position: 'relative',
                backgroundColor: '#fff',
                zIndex: 1,
                height: '100%',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: isRTL ? 'translate(4px, -4px)' : 'translate(-4px, -4px)'
                }
              }}
            >
              {/* Quick Actions */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, textAlign: isRTL ? 'right' : 'left' }}>
                  {t('dashboard.teacher.quickActions.title')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: '12px',
                        border: '1px solid rgba(187, 92, 57, 0.2)',
                        backgroundColor: 'rgba(187, 92, 57, 0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: 'rgba(187, 92, 57, 0.08)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                      onClick={() => setStartStreamDialog(true)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: '#bb5c39',
                            width: 40,
                            height: 40
                          }}
                        >
                          <LiveTvIcon />
                        </Avatar>
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#bb5c39' }}>
                            {t('dashboard.teacher.quickActions.liveClass.title')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {t('dashboard.teacher.quickActions.liveClass.subtitle')}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: '12px',
                        border: '1px solid rgba(187, 92, 57, 0.2)',
                        backgroundColor: 'rgba(187, 92, 57, 0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: 'rgba(187, 92, 57, 0.08)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                      onClick={() => setNewAssignmentDialog(true)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: '#bb5c39',
                            width: 40,
                            height: 40
                          }}
                        >
                          <AssignmentIcon />
                        </Avatar>
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#bb5c39' }}>
                            {t('dashboard.teacher.quickActions.assignment.title')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {t('dashboard.teacher.quickActions.assignment.subtitle')}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Assignments Overview */}
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 3,
                  flexDirection: isRTL ? 'row-reverse' : 'row'
                }}>
                  <Box>
                    <Typography variant="h6" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                      {t('dashboard.teacher.assignments.title')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                      {t('dashboard.teacher.assignments.subtitle')}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() => navigate(`/${getCurrentLanguage()}/teacher/assignments`)}
                    sx={{
                      color: '#bb5c39',
                      transform: isRTL ? 'rotate(180deg)' : 'none',
                      '&:hover': { backgroundColor: 'rgba(187, 92, 57, 0.1)' }
                    }}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </Box>

                <Grid container spacing={2}>
                {assignments.slice(0, 3).map((assignment, index) => (
                    <Grid item xs={12} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => navigate(`/${getCurrentLanguage()}/teacher/assignments/${assignment.id}`)}
                  >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {assignment.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t('teacherPages.assignments.created')} {formatRelativeTime(assignment.createdAt, t)}
                      </Typography>
                    </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5,
                          color: 'text.secondary',
                          fontSize: '0.75rem'
                        }}
                      >
                        <PeopleIcon sx={{ fontSize: 16 }} />
                        {assignment.submissions?.length || 0} {t('dashboard.teacher.assignments.submissions', { count: assignment.submissions?.length || 0 })}
                      </Box>
                      <Chip
                        label={t(`teacherPages.assignments.status.${assignment.status?.toLowerCase() || 'active'}`)}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(187, 92, 57, 0.1)',
                          color: '#bb5c39',
                          fontWeight: 500
                        }}
                      />
                          </Box>
                    </Box>
                  </Paper>
                    </Grid>
                ))}
                {assignments.length === 0 && (
                    <Grid item xs={12}>
                  <Box 
                    sx={{ 
                      textAlign: 'center', 
                      py: 4,
                      color: 'text.secondary'
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 48, color: 'rgba(0, 0, 0, 0.2)', mb: 1 }} />
                    <Typography variant="body2">
                      {t('dashboard.teacher.assignments.empty')}
                    </Typography>
                  </Box>
                    </Grid>
                )}
                </Grid>
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* Calendar Card */}
        <Grid item xs={12} md={5}>
          {stats
            .filter(stat => stat.isCalendar)
            .map((stat, index) => (
              <StatsCard key={index} stat={stat} />
            ))}
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
      {/* Dialogs */}
        <Grid item xs={12}>
      <Dialog
        open={newCourseDialog}
        onClose={() => setNewCourseDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 2,
            backgroundColor: '#fff',
            direction: isRTL ? 'rtl' : 'ltr'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(187, 92, 57, 0.1)',
                  color: '#bb5c39',
                  width: 48,
                  height: 48
                }}
              >
                <MenuBookIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: '#2f2f2f', fontWeight: 600 }}>
                  {t('dashboard.teacher.dialogs.course.title')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('dashboard.teacher.dialogs.course.subtitle')}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => setNewCourseDialog(false)} 
              size="small"
              sx={{
                '&:hover': { backgroundColor: 'rgba(187, 92, 57, 0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              mt: 2,
              p: 3,
              borderRadius: '12px',
              backgroundColor: 'rgba(187, 92, 57, 0.03)',
              border: '1px solid rgba(187, 92, 57, 0.1)'
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    color: '#2f2f2f',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <MenuBookIcon sx={{ fontSize: 20, color: '#bb5c39' }} />
                  {t('dashboard.teacher.dialogs.course.form.title')}
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{
                      color: '#bb5c39',
                      ml: 0.5
                    }}
                  >
                    *
                  </Typography>
                </Typography>
                <TextField
                  required
                  fullWidth
                  placeholder="Enter course title"
                  value={newCourseData.title}
                  onChange={(e) => setNewCourseData({ ...newCourseData, title: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(187, 92, 57, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#bb5c39',
                      }
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    color: '#2f2f2f',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 20, color: '#bb5c39' }} />
                  {t('dashboard.teacher.dialogs.course.form.description')}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Add course description"
                  value={newCourseData.description}
                  onChange={(e) => setNewCourseData({ ...newCourseData, description: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(187, 92, 57, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#bb5c39',
                      }
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    color: '#2f2f2f',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 20, color: '#bb5c39' }} />
                  {t('dashboard.teacher.dialogs.course.form.level')}
                </Typography>
                <TextField
                  select
                  fullWidth
                  placeholder="Select course level"
                  value={newCourseData.level}
                  onChange={(e) => setNewCourseData({ ...newCourseData, level: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(187, 92, 57, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#bb5c39',
                      }
                    }
                  }}
                >
                  {[
                    { value: 'beginner', label: 'Beginner', icon: <SchoolIcon /> },
                    { value: 'intermediate', label: 'Intermediate', icon: <SchoolIcon /> },
                    { value: 'advanced', label: 'Advanced', icon: <SchoolIcon /> }
                  ].map((option) => (
                    <MenuItem 
                      key={option.value} 
                      value={option.value}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 1.5
                      }}
                    >
                      {React.cloneElement(option.icon, { 
                        sx: { 
                          fontSize: 20,
                          color: '#bb5c39'
                        } 
                      })}
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions 
          sx={{ 
            px: 3, 
            pb: 3,
            gap: 2
          }}
        >
          <Button
            onClick={() => setNewCourseDialog(false)}
            variant="outlined"
            sx={{
              borderColor: 'rgba(187, 92, 57, 0.5)',
              color: '#bb5c39',
              '&:hover': { 
                backgroundColor: 'rgba(187, 92, 57, 0.05)',
                borderColor: '#bb5c39'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateCourse}
            disabled={loading}
            startIcon={<SaveIcon />}
            sx={{
              backgroundColor: '#bb5c39',
              '&:hover': { backgroundColor: '#a04b2e' },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(187, 92, 57, 0.3)',
                color: '#fff'
              }
            }}
          >
            {loading ? t('common.loading') : t('dashboard.teacher.dialogs.course.actions.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Assignment Dialog */}
      <Dialog
        open={newAssignmentDialog}
        onClose={() => setNewAssignmentDialog(false)}
        maxWidth="sm"
        fullWidth
        TransitionProps={{
          enter: true,
          exit: true
        }}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 0,
            backgroundColor: '#fff',
            overflow: 'hidden',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
          }
        }}
      >
        <Box
                sx={{
            background: 'linear-gradient(135deg, #bb5c39 0%, #a04b2e 100%)',
            py: 4,
            px: 3,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
              <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {t('dashboard.teacher.dialogs.assignment.title')}
                </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {t('dashboard.teacher.dialogs.assignment.subtitle')}
                </Typography>
            </Box>
            <IconButton 
              onClick={() => setNewAssignmentDialog(false)} 
              size="small"
              sx={{
                color: 'white',
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mt: 2 }}>
            <TextField
                  required
              fullWidth
              label={t('dashboard.teacher.dialogs.assignment.form.title')}
              variant="outlined"
              value={newAssignmentData.title}
              onChange={(e) => setNewAssignmentData({ ...newAssignmentData, title: e.target.value })}
                  error={error && !newAssignmentData.title}
                  helperText={error && !newAssignmentData.title ? 'Title is required' : ''}
                  sx={{
                mb: 3,
                    '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                        borderColor: 'rgba(187, 92, 57, 0.5)',
                      },
                  '&.Mui-focused fieldset': {
                        borderColor: '#bb5c39',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#bb5c39',
                    }
                  }}
                />

            <TextField
              fullWidth
              label={t('dashboard.teacher.dialogs.assignment.form.description')}
              variant="outlined"
              multiline
              rows={4}
              placeholder={t('dashboard.teacher.dialogs.assignment.form.placeholder.description')}
              value={newAssignmentData.description}
              onChange={(e) => setNewAssignmentData({ ...newAssignmentData, description: e.target.value })}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'rgba(187, 92, 57, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#bb5c39',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#bb5c39',
                }
              }}
            />

            <TextField
              fullWidth
              label={t('dashboard.teacher.dialogs.assignment.form.content')}
              variant="outlined"
              multiline
              rows={8}
              placeholder={t('dashboard.teacher.dialogs.assignment.form.placeholder.content')}
              value={newAssignmentData.content}
              onChange={(e) => setNewAssignmentData({ ...newAssignmentData, content: e.target.value })}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  '&:hover fieldset': {
                    borderColor: 'rgba(187, 92, 57, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                      borderColor: '#bb5c39',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#bb5c39',
                }
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button
            onClick={() => setNewAssignmentDialog(false)}
            variant="outlined"
            sx={{
              borderColor: 'rgba(187, 92, 57, 0.5)',
              color: '#bb5c39',
              px: 3,
              '&:hover': { 
                backgroundColor: 'rgba(187, 92, 57, 0.05)',
                borderColor: '#bb5c39'
              }
            }}
          >
            {t('dashboard.teacher.dialogs.assignment.actions.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateAssignment}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{
              backgroundColor: '#bb5c39',
              px: 4,
              '&:hover': {
                backgroundColor: '#a04b2e'
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(187, 92, 57, 0.3)',
                color: '#fff'
              }
            }}
          >
            {loading ? t('common.loading') : t('dashboard.teacher.dialogs.assignment.actions.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stream Dialog */}
      <Dialog
        open={startStreamDialog}
        onClose={() => setStartStreamDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 2
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(187, 92, 57, 0.1)',
                  color: '#bb5c39',
                  width: 48,
                  height: 48
                }}
              >
                <LiveTvIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: '#2f2f2f', fontWeight: 600 }}>
                  Start Live Stream
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Create a new live streaming session
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => setStartStreamDialog(false)}
              size="small"
              sx={{
                '&:hover': { backgroundColor: 'rgba(187, 92, 57, 0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              mt: 2,
              p: 3,
              borderRadius: '12px',
              backgroundColor: 'rgba(187, 92, 57, 0.03)',
              border: '1px solid rgba(187, 92, 57, 0.1)'
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    color: '#2f2f2f',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <LiveTvIcon sx={{ fontSize: 20, color: '#bb5c39' }} />
                  Stream Title
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{
                      color: '#bb5c39',
                      ml: 0.5
                    }}
                  >
                    *
                  </Typography>
                </Typography>
                <TextField
                  required
                  fullWidth
                  placeholder="Enter stream title"
                  value={streamData.channelName}
                  onChange={(e) => setStreamData({ ...streamData, channelName: e.target.value })}
                  error={error && !streamData.channelName}
                  helperText={error && !streamData.channelName ? 'Stream title is required' : ''}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(187, 92, 57, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#bb5c39',
                      }
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    color: '#2f2f2f',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <MenuBookIcon sx={{ fontSize: 20, color: '#bb5c39' }} />
                  Description
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Add stream description"
                  value={streamData.description}
                  onChange={(e) => setStreamData({ ...streamData, description: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#fff',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(187, 92, 57, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#bb5c39',
                      }
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 2,
                    color: '#2f2f2f'
                  }}
                >
                  Stream Settings
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={streamData.enableChat}
                        onChange={(e) => setStreamData({ ...streamData, enableChat: e.target.checked })}
                      />
                    }
                    label="Enable Chat"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={streamData.allowQuestions}
                        onChange={(e) => setStreamData({ ...streamData, allowQuestions: e.target.checked })}
                      />
                    }
                    label="Allow Student Questions"
                  />
                </Stack>
              </Box>
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setStartStreamDialog(false)}
            variant="outlined"
            sx={{
              borderColor: 'rgba(187, 92, 57, 0.5)',
              color: '#bb5c39',
              '&:hover': { 
                backgroundColor: 'rgba(187, 92, 57, 0.05)',
                borderColor: '#bb5c39'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStartStream}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            sx={{
              backgroundColor: '#bb5c39',
              '&:hover': { backgroundColor: '#a04b2e' },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(187, 92, 57, 0.3)',
                color: '#fff'
              }
            }}
          >
            {loading ? 'Starting Stream...' : 'Start Stream'}
          </Button>
        </DialogActions>
      </Dialog>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TeacherDashboard;
