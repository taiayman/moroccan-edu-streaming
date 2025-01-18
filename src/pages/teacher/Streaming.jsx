import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  CallEnd as CallEndIcon,
  Chat as ChatIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  PresentToAll as PresentToAllIcon,
  People as PeopleIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useStream } from '../../hooks/useStream';
import { useAuth } from '../../hooks/useAuth';

const Streaming = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const {
    loading,
    error,
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    endCall,
    createRoom
  } = useStream(roomId);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [streamTitle, setStreamTitle] = useState('');
  const [showStartDialog, setShowStartDialog] = useState(!roomId);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const screenShareStream = useRef(null);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleStartStream = async () => {
    try {
      const newRoomId = await createRoom('course-id', streamTitle);
      navigate(`/teacher/streaming/${newRoomId}`);
      setShowStartDialog(false);
    } catch (error) {
      console.error('Failed to start stream:', error);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        screenShareStream.current = stream;
        localVideoRef.current.srcObject = stream;
        setIsScreenSharing(true);
      } else {
        screenShareStream.current.getTracks().forEach(track => track.stop());
        localVideoRef.current.srcObject = localStream;
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        bgcolor: 'background.default',
        pt: 8
      }}
    >
      <Grid container spacing={2} sx={{ height: 'calc(100% - 64px)', p: 2 }}>
        {/* Main Content */}
        <Grid item xs={12} md={9}>
          <Paper
            elevation={1}
            sx={{
              height: '100%',
              position: 'relative',
              bgcolor: 'grey.900',
              overflow: 'hidden'
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: isScreenSharing ? 'none' : 'scaleX(-1)'
              }}
            />

            {/* Controls */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                p: 2,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)'
              }}
            >
              <IconButton
                onClick={toggleAudio}
                sx={{
                  mx: 1,
                  bgcolor: isAudioEnabled ? 'primary.main' : 'error.main',
                  '&:hover': {
                    bgcolor: isAudioEnabled ? 'primary.dark' : 'error.dark'
                  }
                }}
              >
                {isAudioEnabled ? (
                  <MicIcon sx={{ color: 'white' }} />
                ) : (
                  <MicOffIcon sx={{ color: 'white' }} />
                )}
              </IconButton>

              <IconButton
                onClick={toggleVideo}
                sx={{
                  mx: 1,
                  bgcolor: isVideoEnabled ? 'primary.main' : 'error.main',
                  '&:hover': {
                    bgcolor: isVideoEnabled ? 'primary.dark' : 'error.dark'
                  }
                }}
              >
                {isVideoEnabled ? (
                  <VideocamIcon sx={{ color: 'white' }} />
                ) : (
                  <VideocamOffIcon sx={{ color: 'white' }} />
                )}
              </IconButton>

              <IconButton
                onClick={toggleScreenShare}
                sx={{
                  mx: 1,
                  bgcolor: isScreenSharing ? 'primary.main' : 'inherit',
                  '&:hover': {
                    bgcolor: isScreenSharing ? 'primary.dark' : 'action.hover'
                  }
                }}
              >
                {isScreenSharing ? (
                  <StopScreenShareIcon sx={{ color: 'white' }} />
                ) : (
                  <ScreenShareIcon />
                )}
              </IconButton>

              <IconButton
                onClick={() => setShowParticipants(true)}
                sx={{ mx: 1 }}
              >
                <Badge badgeContent={participants.length} color="primary">
                  <PeopleIcon />
                </Badge>
              </IconButton>

              <IconButton
                onClick={() => setShowSettings(true)}
                sx={{ mx: 1 }}
              >
                <SettingsIcon />
              </IconButton>

              <IconButton
                onClick={endCall}
                sx={{
                  mx: 1,
                  bgcolor: 'error.main',
                  '&:hover': {
                    bgcolor: 'error.dark'
                  }
                }}
              >
                <CallEndIcon sx={{ color: 'white' }} />
              </IconButton>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={3} sx={{ height: '100%' }}>
          <Paper
            elevation={1}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <PeopleIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Participants</Typography>
            </Box>

            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {participants.map((participant) => (
                <ListItem
                  key={participant.id}
                  secondaryAction={
                    <IconButton edge="end" aria-label="mute">
                      <MicOffIcon />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={participant.photoURL}>
                      {participant.displayName?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={participant.displayName}
                    secondary={participant.role}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Start Stream Dialog */}
      <Dialog open={showStartDialog} onClose={() => navigate('/teacher/dashboard')}>
        <DialogTitle>Start New Stream</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Stream Title"
            fullWidth
            variant="outlined"
            value={streamTitle}
            onChange={(e) => setStreamTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/teacher/dashboard')}>Cancel</Button>
          <Button
            onClick={handleStartStream}
            variant="contained"
            disabled={!streamTitle}
          >
            Start Stream
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Streaming;
