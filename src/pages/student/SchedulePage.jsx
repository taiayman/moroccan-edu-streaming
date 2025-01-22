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
  Alert
} from '@mui/material';
import {
  Timer as TimerIcon,
  Today as TodayIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getEnrolledCourses } from '../../api/courses';
import ShimmerCard from '../../components/common/ShimmerCard';

const SchedulePage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Days of the week in French
  const daysOfWeek = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche'
  ];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        console.log('Fetching courses for user:', user);
        const coursesData = await getEnrolledCourses(user.id);
        console.log('Fetched courses:', coursesData);
        setCourses(coursesData);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchCourses();
    }
  }, [user?.id]);

  // Organize courses by day
  const coursesByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = courses.filter(course => 
      course.schedule?.some(scheduleItem => scheduleItem.day === day)
    );
    return acc;
  }, {});

  const CourseCard = ({ course, scheduleItem }) => (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid #eee',
        borderRadius: '12px',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: '#000',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Avatar src={course.imageURL} />
        </Grid>
        <Grid item xs>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {course.title}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip
              size="small"
              icon={<TimerIcon />}
              label={scheduleItem.time}
              sx={{ backgroundColor: '#F5F5F5' }}
            />
            <Chip
              size="small"
              icon={<PersonIcon />}
              label={course.teacherName || `Prof. ${course.teacherId}`}
              sx={{ backgroundColor: '#F5F5F5' }}
            />
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );

  const DaySchedule = ({ day, courses }) => (
    <Box sx={{ mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          mb: 2
        }}>
          <TodayIcon sx={{ color: '#666' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {day}
          </Typography>
        </Box>

        <Stack spacing={2}>
          {courses.length > 0 ? (
            courses.map(course => 
              course.schedule
                .filter(scheduleItem => scheduleItem.day === day)
                .map((scheduleItem, index) => (
                  <CourseCard 
                    key={`${course.id}-${index}`}
                    course={course}
                    scheduleItem={scheduleItem}
                  />
                ))
            )
          ) : (
            <Typography variant="body2" color="textSecondary">
              Aucun cours prévu
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f2f0e9',
      pt: '90px',
      pb: 4
    }}>
      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          Emploi du Temps
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Stack spacing={4}>
            {daysOfWeek.slice(0, 3).map((day) => (
              <Paper
                key={day}
                elevation={0}
                sx={{
                  p: 3,
                  backgroundColor: '#fff',
                  borderRadius: '16px',
                  border: '1px solid',
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  mb: 2
                }}>
                  <TodayIcon sx={{ color: '#666' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {day}
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {[1, 2].map((index) => (
                    <ShimmerCard key={index} height={80} />
                  ))}
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : courses.length > 0 ? (
          <Box>
            {daysOfWeek.map(day => (
              <DaySchedule key={day} day={day} courses={coursesByDay[day]} />
            ))}
          </Box>
        ) : (
          <Typography variant="body1" color="textSecondary" align="center">
            Aucun cours trouvé dans l'emploi du temps.
          </Typography>
        )}
      </Container>
    </Box>
  );
};

export default SchedulePage;
