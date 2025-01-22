import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Container,
  Tabs,
  Tab,
  Divider,
  LinearProgress,
  Stack,
  Button
} from '@mui/material';
import {
  EmailOutlined as EmailIcon,
  NotificationsNoneOutlined as NotificationsIcon,
  ChatOutlined as ChatIcon,
} from '@mui/icons-material';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeChild, setActiveChild] = useState(0);

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
    if (grade >= 90) return '#4CAF50';
    if (grade >= 80) return '#2196F3';
    if (grade >= 70) return '#FF9800';
    return '#F44336';
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f2f0e9',
      pt: { xs: '70px', md: '90px' },
      pb: 4
    }}>
      <Container maxWidth="lg">
        {/* Child Selection */}
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}
        >
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 500 }}>
            Mes Enfants
          </Typography>
          <Tabs
            value={activeChild}
            onChange={(_, newValue) => setActiveChild(newValue)}
            sx={{
              '.MuiTabs-indicator': {
                backgroundColor: '#000'
              }
            }}
          >
            {children.map((child) => (
              <Tab
                key={child.id}
                label={
                  <Box sx={{ textAlign: 'left', py: 1 }}>
                    <Typography sx={{ fontWeight: 500 }}>
                      {child.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {child.grade}
                    </Typography>
                  </Box>
                }
                sx={{
                  textTransform: 'none',
                  minWidth: 200,
                  alignItems: 'flex-start',
                  '&.Mui-selected': {
                    color: '#000'
                  }
                }}
              />
            ))}
          </Tabs>
        </Paper>

        <Grid container spacing={4}>
          {/* Left Column - Academic Progress */}
          <Grid item xs={12} md={8}>
            {/* Overview */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                Vue d'Ensemble
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Note Moyenne
                    </Typography>
                    <Typography variant="h3" sx={{ 
                      fontWeight: 500,
                      color: getGradeColor(currentChild.overallGrade)
                    }}>
                      {currentChild.overallGrade}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Assiduité
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 500 }}>
                      {currentChild.attendance}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Subject Performance */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                Performance par Matière
              </Typography>
              <Stack spacing={3}>
                {currentChild.subjects.map((subject) => (
                  <Box key={subject.name}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>{subject.name}</Typography>
                      <Typography sx={{ 
                        color: getGradeColor(subject.grade),
                        fontWeight: 500
                      }}>
                        {subject.grade}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={subject.grade}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getGradeColor(subject.grade)
                        }
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Recent Activities */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
                Activités Récentes
              </Typography>
              <Stack spacing={2}>
                {currentChild.recentActivities.map((activity, index) => (
                  <Box key={index}>
                    <Typography variant="body1" gutterBottom>
                      {activity.text}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activity.time}
                    </Typography>
                    {index !== currentChild.recentActivities.length - 1 && (
                      <Divider sx={{ mt: 2 }} />
                    )}
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>

          {/* Right Column - Communication */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid rgba(0, 0, 0, 0.08)',
                height: 'fit-content'
              }}
            >
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>
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
                    icon: <EmailIcon />,
                    text: 'Boîte de Réception',
                    path: '/parent/inbox'
                  },
                  {
                    icon: <NotificationsIcon />,
                    text: 'Notifications',
                    path: '/parent/notifications'
                  }
                ].map((action) => (
                  <Button
                    key={action.text}
                    startIcon={action.icon}
                    onClick={() => navigate(action.path)}
                    variant="outlined"
                    sx={{
                      justifyContent: 'flex-start',
                      py: 1.5,
                      px: 2,
                      color: '#000',
                      borderColor: 'rgba(0, 0, 0, 0.12)',
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        borderColor: 'rgba(0, 0, 0, 0.24)'
                      }
                    }}
                  >
                    {action.text}
                  </Button>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ParentDashboard;
