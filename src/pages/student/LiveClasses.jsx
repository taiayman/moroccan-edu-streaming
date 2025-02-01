import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Button,
  Chip,
  Stack,
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  LiveTv as LiveTvIcon,
  Timer as TimerIcon,
  Person as PersonIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getActiveLiveClasses, getDailyRoom } from '../../api/student';
import { getCurrentLanguage } from '../../i18n';
import { auth } from '../../api/config';

const LiveClasses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joiningClass, setJoiningClass] = useState(false);

  useEffect(() => {
    const fetchLiveClasses = async () => {
      try {
        setLoading(true);
        const classes = await getActiveLiveClasses(user.id);
        console.log('Fetched live classes:', classes);
        setLiveClasses(classes);
      } catch (error) {
        console.error('Error fetching live classes:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchLiveClasses();
    }
  }, [user?.id]);

  const handleJoinClass = async (classId) => {
    try {
      setJoiningClass(true);
      setError(null);

      // Get current Firebase user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Get room information
      const room = await getDailyRoom(classId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Extract room name from the URL
      const roomName = room.url.split('/').pop();
      
      // Navigate to our student streaming interface with the room name
      window.location.href = `/streaming/student.html?room=${roomName}`;

    } catch (error) {
      console.error('Error joining class:', error);
      setError('Failed to join class: ' + error.message);
      setJoiningClass(false);
    }
  };

  const ClassCard = ({ liveClass }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '8px',
        backgroundColor: 'rgba(45, 55, 72, 0.9)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }
      }}
    >
      <Grid container alignItems="center" spacing={3}>
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(74, 144, 226, 0.1)',
                color: '#4a90e2',
                width: 48,
                height: 48
              }}
            >
              <SchoolIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 500,
                color: '#fff',
                letterSpacing: '0.3px'
              }}>
                {liveClass.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {liveClass.teacherName || 'Teacher'}
              </Typography>
            </Box>
          </Box>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={<TimerIcon sx={{ fontSize: '18px !important' }} />}
              label={`Started ${new Date(liveClass.startTime).toLocaleTimeString()}`}
              sx={{ 
                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                color: '#4a90e2',
                borderRadius: '4px',
                '& .MuiChip-icon': {
                  color: '#4a90e2'
                }
              }}
            />
            <Chip
              icon={<LiveTvIcon sx={{ fontSize: '18px !important' }} />}
              label="Live"
              sx={{
                backgroundColor: '#4a90e2',
                color: '#fff',
                borderRadius: '4px',
                '& .MuiChip-icon': {
                  color: '#fff'
                }
              }}
            />
          </Stack>
        </Grid>

        <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                borderRadius: '4px',
                zIndex: 0
              }
            }}
          >
            <Button
              variant="contained"
              startIcon={joiningClass ? <CircularProgress size={20} color="inherit" /> : <LiveTvIcon />}
              disabled={joiningClass}
              onClick={() => handleJoinClass(liveClass.id)}
              sx={{
                py: 1.5,
                px: 3,
                backgroundColor: '#4a90e2',
                color: '#fff',
                position: 'relative',
                zIndex: 1,
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.2s',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#357abd',
                  transform: 'translate(-2px, -2px)',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(74, 144, 226, 0.3)',
                  color: '#fff'
                }
              }}
            >
              {joiningClass ? 'Joining...' : 'Join Class'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #1a1f2c 0%, #2d3748 100%)',
      pt: { xs: '80px', sm: '90px' },
      pb: 4
    }}>
      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ 
          fontWeight: 500, 
          mb: 3,
          color: '#fff',
          fontFamily: '"Roboto", sans-serif',
          letterSpacing: '0.5px'
        }}>
          Live Classes
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
          <Stack spacing={3}>
            {[1, 2, 3].map((index) => (
              <Paper
                key={index}
                sx={{
                  p: 3,
                  height: 160,
                  borderRadius: '8px',
                  backgroundColor: 'rgba(45, 55, 72, 0.5)',
                  animation: 'pulse 1.5s infinite'
                }}
              />
            ))}
          </Stack>
        ) : (
          <Stack spacing={3}>
            {liveClasses.length > 0 ? (
              liveClasses.map((liveClass) => (
                <ClassCard key={liveClass.id} liveClass={liveClass} />
              ))
            ) : (
              <Typography variant="body1" sx={{ color: '#fff', textAlign: 'center' }}>
                No live classes available at the moment.
              </Typography>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default LiveClasses;
