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
  Alert
} from '@mui/material';
import {
  LiveTv as LiveTvIcon,
  Timer as TimerIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getActiveLiveClasses } from '../../api/student';
import { getCurrentLanguage } from '../../utils/navigation';
import ShimmerCard from '../../components/common/ShimmerCard';

const LiveClasses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLiveClasses = async () => {
      try {
        setLoading(true);
        const classes = await getActiveLiveClasses(user.id);
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

  const handleJoinClass = (classId, channelName) => {
    navigate(`/${getCurrentLanguage()}/student/live-class/${classId}`, {
      state: { channelName }
    });
  };

  const ClassCard = ({ liveClass }) => (
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
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {liveClass.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                {liveClass.teacherName || `Prof. ${liveClass.teacherId}`}
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={<TimerIcon sx={{ fontSize: '18px !important' }} />}
              label={`Started ${new Date(liveClass.startTime).toLocaleTimeString()}`}
              sx={{ 
                backgroundColor: '#F5F5F5',
                borderRadius: '8px'
              }}
            />
            <Chip
              label="En Direct"
              sx={{
                backgroundColor: '#ff0000',
                color: '#fff',
                borderRadius: '8px'
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
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '8px',
                zIndex: 0
              }
            }}
          >
            <Button
              variant="contained"
              startIcon={<LiveTvIcon />}
              onClick={() => handleJoinClass(liveClass.id, liveClass.channelName)}
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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          Cours en Direct
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
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
              <Typography variant="body1" color="textSecondary" align="center">
                Aucun cours en direct pour le moment.
              </Typography>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default LiveClasses;
