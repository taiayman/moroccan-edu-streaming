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
  Tab,
  Tabs,
  Divider
} from '@mui/material';
import {
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  NotificationsNone as NotificationsIcon,
  Chat as ChatIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Grade as GradeIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeChild, setActiveChild] = React.useState(0);

  const children = [
    {
      id: 1,
      name: 'Sara Alami',
      grade: 'Niveau 2',
      avatar: '/api/placeholder/40/40',
      attendance: 95,
      overallGrade: 88,
      subjects: [
        { name: 'Mathématiques', grade: 92, status: 'excellent' },
        { name: 'Physique', grade: 85, status: 'good' },
        { name: 'Français', grade: 88, status: 'good' }
      ],
      upcomingAssignments: [
        {
          subject: 'Mathématiques',
          title: 'Exercices sur les Dérivées',
          dueDate: 'Pour demain'
        },
        {
          subject: 'Physique',
          title: 'Mécanique Quantique',
          dueDate: 'Dans 3 jours'
        }
      ],
      recentActivities: [
        {
          type: 'grade',
          text: 'Note: 18/20 en Mathématiques',
          time: 'Aujourd\'hui'
        },
        {
          type: 'attendance',
          text: 'Présent au cours de Physique',
          time: 'Hier'
        }
      ]
    },
    {
      id: 2,
      name: 'Karim Alami',
      grade: 'Niveau 1',
      avatar: '/api/placeholder/40/40',
      attendance: 92,
      overallGrade: 85,
      subjects: [
        { name: 'Mathématiques', grade: 84, status: 'good' },
        { name: 'Physique', grade: 88, status: 'good' },
        { name: 'Français', grade: 82, status: 'good' }
      ],
      upcomingAssignments: [
        {
          subject: 'Physique',
          title: 'Exercices d\'Optique',
          dueDate: 'Pour demain'
        }
      ],
      recentActivities: [
        {
          type: 'assignment',
          text: 'Devoir rendu en Physique',
          time: 'Aujourd\'hui'
        }
      ]
    }
  ];

  const currentChild = children[activeChild];

  const getGradeColor = (grade) => {
    if (grade >= 90) return '#22C55E';
    if (grade >= 80) return '#3B82F6';
    if (grade >= 70) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#FAFAFA',
      pt: { xs: '70px', md: '90px' },
      pb: 4
    }}>
      <Container maxWidth="xl">
        {/* Header with Children Tabs */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            Suivi Parental
          </Typography>
          <Tabs
            value={activeChild}
            onChange={(_, newValue) => setActiveChild(newValue)}
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                backgroundColor: 'white',
                borderRadius: '12px',
                mr: 2,
                border: '1px solid',
                borderColor: 'rgba(0, 0, 0, 0.1)',
                '&.Mui-selected': {
                  backgroundColor: '#000',
                  color: 'white'
                }
              }
            }}
          >
            {children.map((child) => (
              <Tab
                key={child.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={child.avatar} sx={{ width: 32, height: 32 }} />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {child.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', opacity: 0.7 }}>
                        {child.grade}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Overview Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    backgroundColor: '#000',
                    color: 'white',
                    borderRadius: '16px',
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <GradeIcon />
                    <Typography variant="body1">Note Moyenne</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {currentChild.overallGrade}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Performance globale
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CheckCircleIcon sx={{ color: '#22C55E' }} />
                    <Typography variant="body1">Assiduité</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#22C55E' }}>
                    {currentChild.attendance}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Taux de présence
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AssignmentIcon />
                    <Typography variant="body1">Devoirs</Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {currentChild.upcomingAssignments.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    À rendre cette semaine
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Subject Performance */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Performance par Matière
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '16px',
                  overflow: 'hidden'
                }}
              >
                {currentChild.subjects.map((subject, index) => (
                  <Box
                    key={subject.name}
                    sx={{
                      p: 3,
                      borderBottom: index !== currentChild.subjects.length - 1 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {subject.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={subject.grade}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: '#F5F5F5',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getGradeColor(subject.grade)
                                }
                              }}
                            />
                          </Box>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: getGradeColor(subject.grade),
                              minWidth: 45
                            }}
                          >
                            {subject.grade}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Paper>
            </Box>

            {/* Recent Activities */}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Activités Récentes
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
                  {currentChild.recentActivities.map((activity, index) => (
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
                          backgroundColor: activity.type === 'grade' ? '#22C55E' : '#3B82F6',
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

          {/* Right Sidebar */}
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
                      icon: <ChatIcon />,
                      text: 'Contacter les Professeurs',
                      path: '/parent/contact-teachers'
                    },
                    {
                      icon: <CalendarIcon />,
                      text: 'Emploi du Temps',
                      path: '/parent/schedule'
                    },
                    {
                      icon: <EmailIcon />,
                      text: 'Boîte de Réception',
                      path: '/parent/inbox'
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

              {/* Upcoming Assignments */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '16px'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Devoirs à Venir
                </Typography>
                <Stack spacing={2}>
                  {currentChild.upcomingAssignments.map((assignment, index) => (
                    <Paper
                      key={index}
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
                          {assignment.subject}
                        </Typography>
                        <Chip
                          label={assignment.dueDate}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            borderRadius: '8px'
                          }}
                        />
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              </Paper>

              {/* Contact Teachers */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '16px'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Professeurs
                </Typography>
                <Stack spacing={2}>
                  {[
                    { name: 'Prof. Benali', subject: 'Mathématiques' },
                    { name: 'Prof. El Amrani', subject: 'Physique' },
                    { name: 'Prof. Mansouri', subject: 'Français' }
                  ].map((teacher) => (
                    <Button
                      key={teacher.name}
                      sx={{
                        p: 1.5,
                        textAlign: 'left',
                        backgroundColor: '#F5F5F5',
                        borderRadius: '8px',
                        '&:hover': {
                          backgroundColor: '#EAEAEA'
                        }
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {teacher.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {teacher.subject}
                        </Typography>
                      </Box>
                    </Button>
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

export default ParentDashboard; 