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
  LinearProgress
} from '@mui/material';
import {
  School as SchoolIcon,
  LiveTv as LiveTvIcon,
  People as PeopleIcon,
  Timer as TimerIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  MenuBook as MenuBookIcon,
  NotificationsNone as NotificationsIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const upcomingClasses = [
    {
      id: 1,
      subject: 'Mathématiques',
      topic: 'Analyse: Les Dérivées',
      time: '10:00',
      duration: '1h 30min',
      students: 25,
      level: 'Niveau 2',
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 2,
      subject: 'Mathématiques',
      topic: 'Algèbre Linéaire',
      time: '14:00',
      duration: '1h',
      students: 30,
      level: 'Niveau 1',
      avatar: '/api/placeholder/40/40'
    }
  ];

  const assignments = [
    {
      id: 1,
      subject: 'Mathématiques',
      title: 'Exercices sur les Dérivées',
      dueDate: 'Pour demain',
      submissions: 18,
      totalStudents: 25
    },
    {
      id: 2,
      subject: 'Mathématiques',
      title: 'Matrices et Déterminants',
      dueDate: 'Dans 3 jours',
      submissions: 5,
      totalStudents: 30
    }
  ];

  const stats = [
    {
      title: 'Classes',
      value: '6',
      icon: <MenuBookIcon sx={{ fontSize: 28, color: '#000' }} />,
      change: '+2 ce semestre'
    },
    {
      title: 'Étudiants',
      value: '150',
      icon: <PeopleIcon sx={{ fontSize: 28, color: '#000' }} />,
      change: 'Total actuel'
    },
    {
      title: 'Taux de Réussite',
      value: '92%',
      icon: <TrendingUpIcon sx={{ fontSize: 28, color: '#000' }} />,
      change: 'Moyenne globale'
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f2f0e9',
      pt: { xs: '70px', md: '90px' },
      pb: 4
    }}>
      <Container maxWidth="xl">
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Tableau de Bord Professeur
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', mt: 1 }}>
                {user?.displayName || 'Prof. Benali'} • Mathématiques
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CalendarIcon />}
                sx={{
                  borderColor: '#000',
                  color: '#000',
                  '&:hover': {
                    borderColor: '#000',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                Emploi du Temps
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                  backgroundColor: '#000',
                  '&:hover': {
                    backgroundColor: '#333'
                  }
                }}
              >
                Nouveau Cours
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={4}>
          {/* Left Column - Stats and Classes */}
          <Grid item xs={12} md={8}>
            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {stats.map((stat, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      backgroundColor: index === 2 ? '#000' : '#fff',
                      borderRadius: '16px',
                      border: '1px solid',
                      borderColor: index === 2 ? '#000' : 'rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {React.cloneElement(stat.icon, { 
                        sx: { 
                          fontSize: 28, 
                          color: index === 2 ? '#fff' : '#000'
                        } 
                      })}
                    </Box>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 700, 
                      mb: 1,
                      color: index === 2 ? '#fff' : '#000'
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      color: index === 2 ? 'rgba(255, 255, 255, 0.7)' : '#666',
                      mb: 1 
                    }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: index === 2 ? 'rgba(255, 255, 255, 0.7)' : '#666'
                    }}>
                      {stat.change}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Today's Schedule */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Programme d'Aujourd'hui
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '16px',
                  overflow: 'hidden'
                }}
              >
                {upcomingClasses.map((class_, index) => (
                  <Box
                    key={class_.id}
                    sx={{
                      p: 3,
                      borderBottom: index !== upcomingClasses.length - 1 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    <Grid container alignItems="center" spacing={3}>
                      <Grid item xs={12} sm={7}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: '#22C55E'
                            }}
                          />
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {class_.time} - {class_.duration}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              {class_.subject} • {class_.level}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={5} sx={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <Chip
                          icon={<PeopleIcon sx={{ fontSize: '18px !important' }} />}
                          label={`${class_.students} étudiants`}
                          sx={{ 
                            backgroundColor: '#F5F5F5',
                            borderRadius: '8px'
                          }}
                        />
                        <Button
                          variant="contained"
                          startIcon={<LiveTvIcon />}
                          onClick={() => navigate(`/teacher/live-class/${class_.id}`)}
                          sx={{
                            backgroundColor: '#000',
                            '&:hover': {
                              backgroundColor: '#333'
                            }
                          }}
                        >
                          Démarrer
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Paper>
            </Box>

            {/* Recent Activity */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Activité Récente
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '16px',
                  p: 3
                }}
              >
                <Stack spacing={3}>
                  {[
                    {
                      type: 'submission',
                      text: '5 nouveaux devoirs rendus en Algèbre Linéaire',
                      time: 'Il y a 10 minutes'
                    },
                    {
                      type: 'question',
                      text: 'Ahmed a posé une question sur les Dérivées',
                      time: 'Il y a 30 minutes'
                    },
                    {
                      type: 'grade',
                      text: 'Notes mises à jour pour le devoir de Calcul',
                      time: 'Il y a 1 heure'
                    }
                  ].map((activity, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#000',
                          mt: 1
                        }}
                      />
                      <Box>
                        <Typography variant="body1">
                          {activity.text}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {activity.time}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Box>
          </Grid>

          {/* Right Column - Assignments and Quick Actions */}
          <Grid item xs={12} md={4}>
            <Stack spacing={4}>
              {/* Quick Actions */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  backgroundColor: '#000',
                  borderRadius: '16px',
                  color: 'white'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Actions Rapides
                </Typography>
                <Stack spacing={2}>
                  {[
                    {
                      icon: <AssignmentIcon />,
                      text: 'Ajouter un Devoir',
                      path: '/teacher/create-assignment'
                    },
                    {
                      icon: <PeopleIcon />,
                      text: 'Gérer les Étudiants',
                      path: '/teacher/students'
                    },
                    {
                      icon: <MenuBookIcon />,
                      text: 'Ressources de Cours',
                      path: '/teacher/resources'
                    }
                  ].map((action) => (
                    <Button
                      key={action.text}
                      fullWidth
                      startIcon={action.icon}
                      onClick={() => navigate(action.path)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        justifyContent: 'flex-start',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      {action.text}
                    </Button>
                  ))}
                </Stack>
              </Paper>

              {/* Assignments Overview */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '16px'
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 3
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Devoirs à Évaluer
                  </Typography>
                  <Chip
                    label="23 en attente"
                    size="small"
                    sx={{
                      backgroundColor: '#000',
                      color: 'white',
                      borderRadius: '8px',
                      fontWeight: 600
                    }}
                  />
                </Box>
                <Stack spacing={2}>
                  {assignments.map((assignment) => (
                    <Paper
                      key={assignment.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        backgroundColor: '#F5F5F5',
                        borderRadius: '8px',
                        '&:hover': {
                          backgroundColor: '#EAEAEA'
                        }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        {assignment.title}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {assignment.submissions} rendus sur {assignment.totalStudents}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {assignment.dueDate}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TeacherDashboard;
