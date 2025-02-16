import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Avatar,
  Chip,
  Stack,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery,
  Tooltip,
  Card,
  CardContent,
  Divider,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import {
  Timer as TimerIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Event as EventIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  StickyNote2 as NoteIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import {
  getAllTeachers,
  getTeacherSchedule,
  getTeacherCalendarNotes
} from '../../api/teacher';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getCurrentLanguage } from '../../utils/navigation';

const SchedulePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const navigate = useNavigate();
  const currentLang = getCurrentLanguage();

  // Redirect to FreeUserNotice if user is not pro
  useEffect(() => {
    if (user && !user.isPro) {
      navigate(`/${currentLang}/student/free-notice`);
    }
  }, [user, currentLang, navigate]);
  const [schedule, setSchedule] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const teachersData = await getAllTeachers();
        setTeachers(teachersData);
        if (teachersData.length > 0) {
          setSelectedTeacher(teachersData[0]);
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchTeachers();
    }
  }, [user?.id]);

  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!selectedTeacher) return;

      try {
        setLoading(true);
        // Get the current date and calculate the start/end of the week
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start from Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // End on Saturday
        endOfWeek.setHours(23, 59, 59, 999);

        const [scheduleData, notesData] = await Promise.all([
          getTeacherSchedule(selectedTeacher.id),
          getTeacherCalendarNotes(selectedTeacher.id, startOfWeek, endOfWeek)
        ]);
        
        // Ensure notesData is an array and has the expected structure
        const notesArray = Array.isArray(notesData) ? notesData : 
                          (notesData?.docs?.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                          })) || []);

        // Transform notes data into a day-based structure
        const organizedNotes = daysOfWeek.reduce((acc, day) => {
          acc[day] = notesArray.filter(note => {
            if (!note?.date) return false;
            const noteDate = typeof note.date.toDate === 'function' 
              ? note.date.toDate() 
              : new Date(note.date);
            const noteDay = daysOfWeek[noteDate.getDay()];
            return noteDay === day;
          }) || [];
          return acc;
        }, {});

        console.log('Schedule Data:', scheduleData);
        console.log('Notes Data:', notesArray);
        console.log('Organized Notes:', organizedNotes);

        setSchedule(scheduleData);
        setNotes(organizedNotes);
      } catch (error) {
        console.error('Error fetching teacher data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [selectedTeacher]);

  const TeacherCard = ({ teacher, isSelected }) => (
    <Card
      component={motion.div}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setSelectedTeacher(teacher)}
      sx={{
        cursor: 'pointer',
        height: '100%',
        backgroundColor: isSelected ? 'rgba(74, 144, 226, 0.1)' : 'rgba(45, 55, 72, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid',
        borderColor: isSelected ? '#4a90e2' : 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#4a90e2',
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 12px rgba(74, 144, 226, 0.15)'
        }
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={teacher.photoURL}
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'rgba(74, 144, 226, 0.1)',
              color: '#4a90e2',
              border: '2px solid',
              borderColor: isSelected ? '#4a90e2' : 'transparent'
            }}
          >
            {teacher.displayName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: '#fff',
                fontWeight: 500,
                fontFamily: '"Roboto", sans-serif',
                letterSpacing: '0.3px'
              }}
            >
              {teacher.displayName}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              {teacher.subject || t('schedule.noSubject')}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const WeeklySchedule = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={2}>
        {daysOfWeek.map((day) => {
          const dayEvents = schedule.filter((event) => event.day === day);
          return (
            <Grid item xs={12} md={6} lg={4} key={day}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  backgroundColor: 'rgba(45, 55, 72, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarIcon sx={{ color: '#4a90e2' }} />
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: '#fff',
                      fontWeight: 500,
                      fontFamily: '"Roboto", sans-serif',
                      letterSpacing: '0.3px'
                    }}
                  >
                    {t(`schedule.daysOfWeek.${day.toLowerCase()}`)}
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  {dayEvents.length > 0 ? (
                    dayEvents.map((event, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 1.5,
                          backgroundColor: 'rgba(74, 144, 226, 0.1)',
                          borderRadius: '4px',
                          border: '1px solid rgba(74, 144, 226, 0.2)'
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: '#fff',
                            fontWeight: 500,
                            mb: 0.5
                          }}
                        >
                          {event.title}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TimerIcon sx={{ fontSize: 16 }} />
                            <Typography variant="caption">
                              {event.time}
                            </Typography>
                          </Box>
                          {event.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <SchoolIcon sx={{ fontSize: 16 }} />
                              <Typography variant="caption">
                                {event.location}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', py: 2 }}
                    >
                      {t('schedule.noClassesScheduled')}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  const WeeklyNotes = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={2}>
        {daysOfWeek.map((day) => {
          const dayNotes = notes[day] || [];
          return (
            <Grid item xs={12} md={6} lg={4} key={day}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  backgroundColor: 'rgba(45, 55, 72, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <NoteIcon sx={{ color: '#4a90e2' }} />
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: '#fff',
                      fontWeight: 500,
                      fontFamily: '"Roboto", sans-serif',
                      letterSpacing: '0.3px'
                    }}
                  >
                    {t(`schedule.daysOfWeek.${day.toLowerCase()}`)}
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  {dayNotes.length > 0 ? (
                    dayNotes.map((note, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 1.5,
                          backgroundColor: 'rgba(74, 144, 226, 0.1)',
                          borderRadius: '4px',
                          border: '1px solid rgba(74, 144, 226, 0.2)'
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                        >
                          {note.content}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            display: 'block',
                            mt: 1
                          }}
                        >
                          {note.time}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', py: 2 }}
                    >
                      {t('calendar.noNotes')}
                    </Typography>
                  )}
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #1a1f2c 0%, #2d3748 100%)',
      pt: { xs: '80px', sm: '90px' },
      pb: 4
    }}>
      <Container maxWidth="xl">
        <Typography
          variant="h4"
          sx={{
            color: '#fff',
            fontWeight: 500,
            mb: 3,
            fontFamily: '"Roboto", sans-serif',
            letterSpacing: '0.5px'
          }}
        >
          {t('schedule.title')}
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              backgroundColor: 'rgba(211, 47, 47, 0.1)',
              color: '#ff5252',
              border: '1px solid rgba(211, 47, 47, 0.2)',
              borderRadius: '8px',
              '& .MuiAlert-icon': { color: '#ff5252' }
            }}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: '200px'
            }}
          >
            <CircularProgress 
              size={40}
              sx={{ 
                color: '#4a90e2',
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round'
                }
              }} 
            />
          </Box>
        ) : (
          <>
            {/* Teachers Grid */}
            <Box sx={{ mb: 4 }}>
              <Grid container spacing={2}>
                {teachers.map((teacher) => (
                  <Grid item xs={12} sm={6} md={4} key={teacher.id}>
                    <TeacherCard
                      teacher={teacher}
                      isSelected={selectedTeacher?.id === teacher.id}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            {selectedTeacher && (
              <>
                {/* Tabs for Schedule and Notes */}
                <Tabs
                  value={currentTab}
                  onChange={(_, newValue) => setCurrentTab(newValue)}
                  sx={{
                    mb: 3,
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#4a90e2'
                    }
                  }}
                >
                  <Tab
                    icon={<EventIcon />}
                    label={t('schedule.events')}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&.Mui-selected': { color: '#4a90e2' }
                    }}
                  />
                  <Tab
                    icon={<NoteIcon />}
                    label={t('calendar.notes')}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&.Mui-selected': { color: '#4a90e2' }
                    }}
                  />
                </Tabs>

                {/* Content based on selected tab */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentTab === 0 ? <WeeklySchedule /> : <WeeklyNotes />}
                  </motion.div>
                </AnimatePresence>
              </>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default SchedulePage;
