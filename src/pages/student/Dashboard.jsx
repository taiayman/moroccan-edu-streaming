import React from 'react';
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
  Divider
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

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const upcomingClasses = [
    {
      id: 1,
      subject: 'Mathématiques',
      topic: 'Analyse: Les Dérivées',
      time: '10:00',
      duration: '1h 30min',
      teacher: 'Prof. Benali',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 2,
      subject: 'Physique',
      topic: 'Mécanique Quantique',
      time: '14:00',
      duration: '1h',
      teacher: 'Prof. El Amrani',
      avatar: '/api/placeholder/40/40'
    }
  ];

  const assignments = [
    {
      id: 1,
      subject: 'Mathématiques',
      title: 'Équations Différentielles',
      dueDate: 'Pour demain',
      progress: 75
    },
    {
      id: 2,
      subject: 'Physique',
      title: 'Fonctions d\'onde',
      dueDate: 'Dans 3 jours',
      progress: 30
    }
  ];

      const stats = [
    {
      title: 'Cours',
      value: '6',
      icon: <MenuBookIcon sx={{ fontSize: 28, color: '#000' }} />,
      change: '+2 du semestre dernier'
    },
    {
      title: 'Heures d\'étude',
      value: '24',
      icon: <TimerIcon sx={{ fontSize: 28, color: '#000' }} />,
      change: 'Cette semaine'
    },
    {
      title: 'Progression Globale',
      value: '85%',
      icon: <TrendingUpIcon sx={{ fontSize: 28, color: '#000' }} />,
      change: 'En bonne voie'
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

  const AssignmentCard = ({ assignment }) => (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        border: '1px solid #eee',
        borderRadius: '12px',
        '&:hover': {
          borderColor: '#000',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            {assignment.title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            {assignment.subject}
          </Typography>
        </Box>
        <Chip
          label={assignment.dueDate}
          size="small"
          sx={{
            backgroundColor: '#F5F5F5',
            borderRadius: '8px'
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1, mr: 2 }}>
          <LinearProgress
            variant="determinate"
            value={assignment.progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#F5F5F5',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#000'
              }
            }}
          />
        </Box>
        <Typography variant="body2" sx={{ color: '#666' }}>
          {assignment.progress}% terminé
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#FAFAFA',
      pt: '90px', // Space for AppBar
      pb: 4
    }}>
      <Container maxWidth="xl">
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
        {stats.map((stat, index) => (
          <Grid item xs={12} md={4} key={index}>
            <StatCard stat={stat} />
          </Grid>
        ))}
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
          {upcomingClasses.map((class_) => (
            <ClassCard key={class_.id} class_={class_} />
          ))}
        </Stack>
      </Box>
          </Grid>

          {/* Right Sidebar */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              position: 'sticky',
              top: '100px', // Slightly more than AppBar height to maintain spacing
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
                  {[
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
                  ))}
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