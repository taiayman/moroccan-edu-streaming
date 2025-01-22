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
  IconButton,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  Alert
} from '@mui/material';
import {
  School as SchoolIcon,
  LiveTv as LiveTvIcon,
  People as PeopleIcon,
  Timer as TimerIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
  PlayCircleOutline as PlayIcon,
  TrendingUp as TrendingUpIcon,
  MenuBook as MenuBookIcon,
  NotificationsNone as NotificationsIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getEnrolledCourses } from '../../api/courses';
import { getUpcomingAssignments } from '../../api/assignments';
import { getDashboardStats } from '../../api/users';
import ShimmerCard from '../../components/common/ShimmerCard';

const StatCardShimmer = () => (
  <Box
    sx={{
      position: 'relative',
      height: '100%',
      '&:before': {
        content: '""',
        position: 'absolute',
        top: '8px',
        left: '8px',
        right: '-8px',
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
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: '16px',
        position: 'relative',
        zIndex: 1,
        border: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.1)',
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
      <Box sx={{ width: 28, height: 28, backgroundColor: '#f0f0f0', borderRadius: 1, mb: 2 }} />
      <Box sx={{ width: '60%', height: 32, backgroundColor: '#f0f0f0', borderRadius: 1, mb: 1 }} />
      <Box sx={{ width: '40%', height: 20, backgroundColor: '#f0f0f0', borderRadius: 1, mb: 1 }} />
      <Box sx={{ width: '80%', height: 16, backgroundColor: '#f0f0f0', borderRadius: 1 }} />
    </Paper>
  </Box>
);

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalCourses: 0,
    avgProgress: 0,
    upcomingCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) {
        console.log('No user ID found:', user);
        return;
      }

      try {
        console.log('Fetching data for user:', user.id);
        const [courses, assignments, stats] = await Promise.all([
          getEnrolledCourses(user.id),
          getUpcomingAssignments(user.id),
          getDashboardStats(user.id)
        ]);

        console.log('Fetched courses:', courses);
        console.log('Fetched assignments:', assignments);
        console.log('Fetched stats:', stats);

        setEnrolledCourses(courses || []);
        setUpcomingAssignments(assignments || []);
        setDashboardStats(stats || {
          totalCourses: 0,
          avgProgress: 0,
          upcomingCount: 0
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Transform enrolled courses to match the UI format
  const upcomingClasses = enrolledCourses.map(course => (
    {
      id: course.id,
      subject: course.title,
      topic: course.description,
      time: course.schedule?.[0]?.time || 'Non programmé',
      duration: '1h 30min',
      teacher: course.teacherId,
      avatar: course.imageURL || '/api/placeholder/40/40'
    }
  ));

  // Transform upcoming assignments to match the UI format
  const assignments = upcomingAssignments.map(assignment => (
    {
      id: assignment.id,
      subject: assignment.courseId, // Ideally, we would map this to course title
      title: assignment.title,
      dueDate: new Date(assignment.dueDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }),
      progress: 0 // You might want to add this to your assignment submission tracking
    }
  ));

  const stats = [
    {
      title: 'Cours',
      value: dashboardStats.totalCourses?.toString() || '0',
      icon: <MenuBookIcon sx={{ fontSize: 28, color: '#000' }} />,
      change: `${enrolledCourses.length} cours actifs`
    },
    {
      title: 'Devoirs à venir',
      value: dashboardStats.upcomingCount?.toString() || '0',
      icon: <AssignmentIcon sx={{ fontSize: 28, color: '#000' }} />,
      change: 'À rendre prochainement'
    },
    {
      title: 'Progression Globale',
      value: `${dashboardStats.avgProgress || 0}%`,
      icon: <TrendingUpIcon sx={{ fontSize: 28, color: '#000' }} />,
      change: 'Moyenne sur tous les cours'
    }
  ];

  const StatCard = ({ stat }) => (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: '8px',
          left: '8px',
          right: '-8px',
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
          height: '100%',
          backgroundColor: '#fff',
          borderRadius: '16px',
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.2s',
          border: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.1)',
          '&:hover': {
            transform: 'translate(-4px, -4px)',
            '& + .glass-shadow': {
              transform: 'translate(4px, 4px)'
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {stat.icon}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {stat.value}
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', mb: 1 }}>
          {stat.title}
        </Typography>
        <Typography variant="caption" sx={{ color: '#666' }}>
          {stat.change}
        </Typography>
      </Paper>
    </Box>
  );

  const ClassCard = ({ class_ }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid #eee',
        borderRadius: '12px',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: '#000',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Grid container alignItems="center" spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar src={class_.avatar} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {class_.subject}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {class_.teacher}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>
            {class_.topic}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Chip
              icon={<TimerIcon sx={{ fontSize: '18px !important' }} />}
              label={class_.time}
              sx={{ 
                backgroundColor: '#F5F5F5',
                borderRadius: '8px'
              }}
            />
            <Chip
              icon={<PlayIcon sx={{ fontSize: '18px !important' }} />}
              label={class_.duration}
              sx={{ 
                backgroundColor: '#F5F5F5',
                borderRadius: '8px'
              }}
            />
          </Stack>
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Box
            sx={{
              position: 'relative',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: '6px',
                left: '6px',
                right: '-6px',
                bottom: '-6px',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                zIndex: 0
              }
            }}
          >
            <Button
              variant="contained"
              startIcon={<LiveTvIcon />}
              onClick={() => navigate(`/student/live-class/${class_.id}`)}
              sx={{
                py: 1.5,
                px: 3,
                backgroundColor: '#000',
                color: '#fff',
                position: 'relative',
                zIndex: 1,
                border: '1px solid rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: '#000',
                  transform: 'translate(-2px, -2px)',
                }
              }}
            >
              Rejoindre le cours
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

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
            Tableau de Bord
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
                Bienvenue, {user?.displayName || 'Étudiant'}! 👋
              </Typography>
              <Typography variant="body1" sx={{ color: '#666' }}>
                Suivez votre progression et gérez votre parcours d'apprentissage
              </Typography>
            </Box>

            {/* Stats Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {loading ? (
                [1, 2, 3].map((index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <StatCardShimmer />
                  </Grid>
                ))
              ) : (
                stats.map((stat, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <StatCard stat={stat} />
                  </Grid>
                ))
              )}
            </Grid>

            {/* Upcoming Classes */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Cours d'Aujourd'hui
                </Typography>
                <Button
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/student/schedule')}
                  sx={{
                    color: '#000',
                    '&:hover': { 
                      backgroundColor: 'transparent', 
                      textDecoration: 'underline' 
                    }
                  }}
                >
                  Voir l'Emploi du Temps
                </Button>
              </Box>
              
              <Stack spacing={2}>
                {loading ? (
                  [1, 2].map((index) => (
                    <ShimmerCard key={index} height={160} />
                  ))
                ) : (
                  <>
                    {upcomingClasses.map((class_) => (
                      <ClassCard key={class_.id} class_={class_} />
                    ))}
                    {upcomingClasses.length === 0 && (
                      <Typography variant="body1" color="textSecondary" align="center">
                        Aucun cours programmé pour aujourd'hui
                      </Typography>
                    )}
                  </>
                )}
              </Stack>
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
                  Actions Rapides
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
                    [
                      {
                        icon: <LiveTvIcon />,
                        text: 'Parcourir les Cours en Direct',
                        path: '/student/live-classes'
                      },
                      {
                        icon: <AssignmentIcon />,
                        text: 'Voir les Devoirs',
                        path: '/student/assignments'
                      },
                      {
                        icon: <CalendarIcon />,
                        text: 'Consulter l\'Emploi du Temps',
                        path: '/student/schedule'
                      }
                    ].map((action) => (
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
