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
import ShimmerCard from '../../components/common/ShimmerCard';

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
        border: '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: '#bb5c39',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(187, 92, 57, 0.1)'
        }
      }}
    >
      <Grid container alignItems="center" spacing={3}>
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(187, 92, 57, 0.1)',
                color: '#bb5c39'
              }}
            >
              <SchoolIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 600,
                color: '#2f2f2f'
              }}>
                {liveClass.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {liveClass.teacherName || 'Teacher'}
              </Typography>
            </Box>
          </Box>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={<TimerIcon sx={{ fontSize: '18px !important' }} />}
              label={`Started ${new Date(liveClass.startTime).toLocaleTimeString()}`}
              sx={{ 
                backgroundColor: 'rgba(187, 92, 57, 0.1)',
                color: '#bb5c39',
                borderRadius: '8px',
                '& .MuiChip-icon': {
                  color: '#bb5c39'
                }
              }}
            />
            <Chip
              icon={<LiveTvIcon sx={{ fontSize: '18px !important' }} />}
              label="Live"
              sx={{
                backgroundColor: '#bb5c39',
                color: '#fff',
                borderRadius: '8px',
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
                backgroundColor: 'rgba(187, 92, 57, 0.2)',
                borderRadius: '8px',
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
                backgroundColor: '#bb5c39',
                color: '#fff',
                position: 'relative',
                zIndex: 1,
                border: '1px solid rgba(187, 92, 57, 0.1)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: '#a04b2e',
                  transform: 'translate(-2px, -2px)',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(187, 92, 57, 0.5)',
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
      backgroundColor: '#f8f9fa',
      pt: { xs: '80px', sm: '90px' },
      pb: 4
    }}>
      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          mb: 3,
          color: '#2f2f2f'
        }}>
          Live Classes
        </Typography>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: '8px',
              border: '1px solid rgba(211, 47, 47, 0.1)'
            }}
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Stack spacing={3}>
            {[1, 2, 3].map((index) => (
              <ShimmerCard key={index} height={160} />
            ))}
          </Stack>
        ) : (
          <Stack spacing={3}>
            {liveClasses.length > 0 ? (
              liveClasses.map((liveClass) => (
                <ClassCard key={liveClass.id} liveClass={liveClass} />
              ))
            ) : (
              <Box 
                sx={{ 
                  textAlign: 'center',
                  py: 8,
                  backgroundColor: 'rgba(187, 92, 57, 0.03)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(187, 92, 57, 0.2)'
                }}
              >
                <LiveTvIcon sx={{ 
                  fontSize: 48, 
                  color: 'rgba(187, 92, 57, 0.2)',
                  mb: 2
                }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#666',
                    fontWeight: 500
                  }}
                >
                  No live classes available at the moment
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#888',
                    mt: 1
                  }}
                >
                  Check back later for upcoming classes
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default LiveClasses;
