import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getUpcomingAssignments } from '../../api/assignments';

const StudentProfile = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const assignmentsData = await getUpcomingAssignments(user?.id);
        setCourses([]);
        setAssignments(assignmentsData || []);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchStudentData();
    }
  }, [user]);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f2f0e9',
      pt: '90px',
      pb: 4
    }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Profile Overview */}
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px'
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    margin: '0 auto',
                    backgroundColor: '#bb5c39',
                    fontSize: '3rem'
                  }}
                >
                  {user?.displayName?.[0] || 'S'}
                </Avatar>
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
                  {user?.displayName || 'Student Name'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email || 'student@example.com'}
                </Typography>
              </Box>
              
              <Button
                fullWidth 
                variant="outlined"
                startIcon={<EditIcon />}
                sx={{ mb: 3 }}
              >
                Modifier le profil
              </Button>

              <List disablePadding>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Niveau"
                    secondary={user?.level || 'Non spécifié'}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Date d'inscription"
                    secondary={user?.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('fr-FR')
                      : 'Non spécifié'
                    }
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Details Section */}
          <Grid item xs={12} md={8}>
            {/* Academic Progress */}
            <Paper 
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px'
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Progression Académique
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <SchoolIcon sx={{ fontSize: 40, color: '#bb5c39', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {courses.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cours Inscrits
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <AssignmentIcon sx={{ fontSize: 40, color: '#bb5c39', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {assignments.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Devoirs en cours
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <CalendarIcon sx={{ fontSize: 40, color: '#bb5c39', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {loading ? '-' : '85%'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Taux de présence
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Enrolled Courses */}
            <Paper 
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px'
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Cours Inscrits
              </Typography>
              <Typography variant="body2" color="text.secondary">
                La fonctionnalité des cours est temporairement indisponible
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default StudentProfile;