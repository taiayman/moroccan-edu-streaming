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
  Alert
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  MenuBook as MenuBookIcon,
  LiveTv as LiveTvIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getEnrolledCourses } from '../../api/courses';
import { getUpcomingAssignments } from '../../api/assignments';
import { getDashboardStats } from '../../api/users';
import { getAllTeachers, getTeacherCalendarEvents, getTeacherCalendarNotes } from '../../api/teacher';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '../../utils/navigation';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const currentLang = getCurrentLanguage();

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

  const fetchTeacherCalendar = async (teacherId) => {
    try {
      // Get current week's start and end dates
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
      setError('Failed to load teacher calendar');
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) {
        console.log('No user ID found:', user);
        return;
      }

      try {
        console.log('Fetching data for user:', user.id);
        const [courses, assignments, teachersList] = await Promise.all([
          getEnrolledCourses(user.id),
          getUpcomingAssignments(user.id),
          getAllTeachers()
        ]);

        console.log('Fetched courses:', courses);
        console.log('Fetched assignments:', assignments);
        console.log('Fetched teachers:', teachersList);

        setEnrolledCourses(courses || []);
        setUpcomingAssignments(assignments || []);
        setTeachers(teachersList || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTeacher) {
      fetchTeacherCalendar(selectedTeacher.id);
    }
  }, [selectedTeacher]);

  // Transform upcoming assignments to match the UI format
  const assignments = upcomingAssignments.map(assignment => (
    {
      id: assignment.id,
      subject: assignment.courseId,
      title: assignment.title,
      dueDate: new Date(assignment.dueDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }),
      progress: 0
    }
  ));

  // Quick Actions Section
  const quickActions = [
    {
      icon: <LiveTvIcon />,
      text: t('dashboard.quickActions.browseLiveClasses'),
      path: `/${currentLang}/student/live-classes`
    },
    {
      icon: <AssignmentIcon />,
      text: t('dashboard.quickActions.viewAssignments'),
      path: `/${currentLang}/student/assignments`
    },
    {
      icon: <CalendarIcon />,
      text: t('dashboard.quickActions.viewSchedule'),
      path: `/${currentLang}/student/schedule`
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f2f0e9',
      pt: '90px',
      pb: 4
    }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t('dashboard.title')}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Welcome Section */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {t('dashboard.welcome', { name: user?.displayName || t('common.student') })}
              </Typography>
              <Typography variant="body1" sx={{ color: '#666' }}>
                {t('dashboard.welcomeSubtitle')}
              </Typography>
            </Box>

            {/* Teachers Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                {t('dashboard.teachers.title')}
              </Typography>
              <Grid container spacing={2}>
                {teachers.map((teacher) => (
                  <Grid item xs={12} sm={6} md={4} key={teacher.id}>
                    <Paper
                      elevation={0}
                      onClick={() => setSelectedTeacher(teacher)}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: selectedTeacher?.id === teacher.id ? '#000' : '#eee',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: '#000',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 48, height: 48 }}>
                          {teacher.displayName?.[0] || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {teacher.displayName || 'Unknown Teacher'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {teacher.email || 'No email'}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Calendar View */}
              {selectedTeacher && (
                <Paper
                  elevation={0}
                  sx={{
                    mt: 3,
                    p: 3,
                    border: '1px solid #eee',
                    borderRadius: '12px'
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Emploi du temps de {selectedTeacher.displayName}
                  </Typography>
                 <TableContainer sx={{ maxHeight: 600, overflowY: 'auto' }}>
                   <Table stickyHeader size="small">
                     <TableHead>
                       <TableRow>
                         <TableCell
                           sx={{
                             fontWeight: 600,
                             backgroundColor: '#fff',
                             width: '80px'
                           }}
                         >
                           Jour
                         </TableCell>
                         {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                           <TableCell
                             key={hour}
                             align="center"
                             sx={{
                               fontWeight: 600,
                               backgroundColor: '#fff',
                               minWidth: '100px'
                             }}
                           >
                             {hour}:00
                           </TableCell>
                         ))}
                       </TableRow>
                     </TableHead>
                     <TableBody>
                       {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day, dayIndex) => {
                         const date = new Date();
                         date.setDate(date.getDate() - date.getDay() + dayIndex);
                         const dateStr = date.toISOString().split('T')[0];
                         
                         return (
                           <TableRow key={day} hover>
                             <TableCell
                               sx={{
                                 whiteSpace: 'nowrap',
                                 fontWeight: 500,
                                 position: 'sticky',
                                 left: 0,
                                 backgroundColor: '#fff',
                                 zIndex: 1
                               }}
                             >
                               {day}<br />{date.getDate()}/{date.getMonth() + 1}
                             </TableCell>
                             {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => {
                               const timeSlot = `${hour}:00`;
                               const events = calendarData.events.filter(event => {
                                 const eventHour = parseInt(event.time.split(':')[0]);
                                 return event.date === dateStr && eventHour === hour;
                               });
                               const dayNote = calendarData.notes[dateStr];

                               return (
                                 <TableCell
                                   key={`${day}-${hour}`}
                                   align="center"
                                   sx={{
                                     height: 60,
                                     p: 1,
                                     borderLeft: '1px solid rgba(224, 224, 224, 0.5)',
                                     backgroundColor: events.length > 0 ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                                     verticalAlign: 'top',
                                     '&:hover': {
                                       backgroundColor: events.length > 0 ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                                     }
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
                                         label={event.title || 'Cours'}
                                         size="small"
                                         color="primary"
                                         variant="outlined"
                                         sx={{
                                           fontSize: '0.75rem',
                                           height: '24px',
                                           mb: 0.5
                                         }}
                                       />
                                     ))}
                                     {dayNote && (
                                       <Typography
                                         variant="caption"
                                         color="text.secondary"
                                         sx={{
                                           display: 'block',
                                           fontSize: '0.75rem',
                                           lineHeight: 1.2,
                                           mt: 'auto'
                                         }}
                                       >
                                         {dayNote}
                                       </Typography>
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
              )}
            </Box>
          </Grid>

          {/* Right Sidebar */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              position: 'sticky',
              top: '100px',
              height: 'fit-content'
            }}>
              {/* Quick Actions */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: '1px solid #eee',
                  borderRadius: '12px'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  {t('dashboard.quickActions.title')}
                </Typography>
                <Stack spacing={2.5}>
                  {loading ? (
                    [1, 2, 3].map((index) => (
                      <Box
                        key={index}
                        sx={{
                          position: 'relative',
                          width: '100%',
                          height: 48,
                          overflow: 'hidden',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `linear-gradient(
                              90deg,
                              rgba(255, 255, 255, 0) 0%,
                              rgba(255, 255, 255, 0.6) 50%,
                              rgba(255, 255, 255, 0) 100%
                            )`,
                            animation: 'shimmer 1.5s infinite',
                          }
                        }}
                      >
                        <Box
                          sx={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '8px'
                          }}
                        />
                      </Box>
                    ))
                  ) : (
                    quickActions.map((action) => (
                      <Box
                        key={action.text}
                        sx={{
                          position: 'relative',
                          width: '100%',
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            top: '6px',
                            left: '6px',
                            right: '-6px',
                            bottom: '-6px',
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            borderRadius: '8px',
                            zIndex: 0
                          }
                        }}
                      >
                        <Button
                          fullWidth
                          startIcon={action.icon}
                          onClick={() => navigate(action.path)}
                          sx={{
                            py: 1.5,
                            justifyContent: 'flex-start',
                            backgroundColor: '#fff',
                            color: '#000',
                            position: 'relative',
                            zIndex: 1,
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              backgroundColor: '#fff',
                              transform: 'translate(-2px, -2px)',
                            }
                          }}
                        >
                          {action.text}
                        </Button>
                      </Box>
                    ))
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

export default StudentDashboard;
