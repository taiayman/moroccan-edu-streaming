import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  Button,
  Stack,
  Avatar,
  Tooltip,
  CircularProgress,
  Alert,
  TextField,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { createAgoraClient, generateToken } from '../../utils/agora';
import { getCurrentLanguage } from '../../utils/navigation';

const LiveClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agoraClient, setAgoraClient] = useState(null);
  const [localTracks, setLocalTracks] = useState({ audioTrack: null, videoTrack: null });
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});

  useEffect(() => {
    initializeAgora();
    return () => {
      cleanup();
    };
  }, []);

  const initializeAgora = async () => {
    try {
      setLoading(true);
      const client = createAgoraClient();
      const token = await generateToken(classId, 'host');
      
      const { localTracks: tracks } = await client.join(classId, token, user.id);
      setAgoraClient(client);
      setLocalTracks(tracks);
      
      // Play local video
      if (tracks.videoTrack) {
        tracks.videoTrack.play(localVideoRef.current);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error initializing Agora:', err);
      setError('Failed to initialize live class');
      setLoading(false);
    }
  };

  const cleanup = async () => {
    if (agoraClient) {
      await agoraClient.leave();
    }
    if (screenTrack) {
      screenTrack.stop();
      screenTrack.close();
    }
    Object.values(localTracks).forEach((track) => {
      if (track) {
        track.stop();
        track.close();
      }
    });
  };

  const toggleAudio = async () => {
    if (localTracks.audioTrack) {
      if (isAudioEnabled) {
        await localTracks.audioTrack.setEnabled(false);
      } else {
        await localTracks.audioTrack.setEnabled(true);
      }
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = async () => {
    if (localTracks.videoTrack) {
      if (isVideoEnabled) {
        await localTracks.videoTrack.setEnabled(false);
      } else {
        await localTracks.videoTrack.setEnabled(true);
      }
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack();
        await agoraClient.unpublish(localTracks.videoTrack);
        await agoraClient.publish(screenTrack);
        setScreenTrack(screenTrack);
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error sharing screen:', err);
      }
    } else {
      if (screenTrack) {
        await agoraClient.unpublish(screenTrack);
        screenTrack.stop();
        screenTrack.close();
        setScreenTrack(null);
        await agoraClient.publish(localTracks.videoTrack);
        setIsScreenSharing(false);
      }
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        sender: user,
        content: newMessage,
        timestamp: new Date()
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleEndClass = async () => {
    try {
      await cleanup();
      navigate(`/${getCurrentLanguage()}/teacher/dashboard`);
    } catch (err) {
      console.error('Error ending class:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
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
    <Box sx={{ height: '100vh', backgroundColor: '#1a1a1a' }}>
      <Grid container sx={{ height: '100%' }}>
        {/* Main Content */}
        <Grid item xs={12} sx={{ height: '100%', position: 'relative' }}>
          {/* Video Grid */}
          <Box sx={{ height: 'calc(100% - 80px)', p: 2 }}>
            <Grid container spacing={2} sx={{ height: '100%' }}>
              {/* Local Video */}
              <Grid item xs={12} md={isScreenSharing ? 3 : 6}>
                <Paper
                  elevation={0}
                  sx={{
                    height: '100%',
                    backgroundColor: '#2f2f2f',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <Box
                    ref={localVideoRef}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      color: '#fff',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Avatar
                      sx={{ width: 24, height: 24, fontSize: '0.875rem' }}
                    >
                      {user?.displayName?.[0]}
                    </Avatar>
                    <Typography variant="body2">
                      {user?.displayName} (You)
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Screen Share or Remote Videos */}
              <Grid item xs={12} md={isScreenSharing ? 9 : 6}>
                <Paper
                  elevation={0}
                  sx={{
                    height: '100%',
                    backgroundColor: '#2f2f2f',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}
                >
                  {isScreenSharing ? (
                    <Box
                      ref={(el) => (remoteVideosRef.current['screen'] = el)}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <Box sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body1" color="white">
                        Waiting for participants...
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Control Bar */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              backgroundColor: '#2f2f2f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              px: 3
            }}
          >
            <Tooltip title={isAudioEnabled ? 'Mute' : 'Unmute'}>
              <IconButton
                onClick={toggleAudio}
                sx={{
                  color: isAudioEnabled ? '#fff' : '#ff4d4d',
                  backgroundColor: isAudioEnabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 77, 77, 0.1)',
                  '&:hover': {
                    backgroundColor: isAudioEnabled ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 77, 77, 0.2)'
                  }
                }}
              >
                {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title={isVideoEnabled ? 'Stop Video' : 'Start Video'}>
              <IconButton
                onClick={toggleVideo}
                sx={{
                  color: isVideoEnabled ? '#fff' : '#ff4d4d',
                  backgroundColor: isVideoEnabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 77, 77, 0.1)',
                  '&:hover': {
                    backgroundColor: isVideoEnabled ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 77, 77, 0.2)'
                  }
                }}
              >
                {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}>
              <IconButton
                onClick={toggleScreenShare}
                sx={{
                  color: isScreenSharing ? '#ff4d4d' : '#fff',
                  backgroundColor: isScreenSharing ? 'rgba(255, 77, 77, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: isScreenSharing ? 'rgba(255, 77, 77, 0.2)' : 'rgba(255, 255, 255, 0.2)'
                  }
                }}
              >
                {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>
            </Tooltip>

            <Box sx={{ flex: 1 }} />

            <Tooltip title="Participants">
              <IconButton
                onClick={() => setIsParticipantsOpen(true)}
                sx={{
                  color: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  }
                }}
              >
                <PeopleIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Chat">
              <IconButton
                onClick={() => setIsChatOpen(true)}
                sx={{
                  color: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                  }
                }}
              >
                <ChatIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              onClick={handleEndClass}
              sx={{
                backgroundColor: '#ff4d4d',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#ff3333'
                }
              }}
            >
              End Class
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Chat Drawer */}
      <Drawer
        anchor="right"
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            backgroundColor: '#2f2f2f',
            color: '#fff'
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Chat</Typography>
          <IconButton onClick={() => setIsChatOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                mb: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.sender.id === user.id ? 'flex-end' : 'flex-start'
              }}
            >
              <Box
                sx={{
                  backgroundColor: message.sender.id === user.id ? '#bb5c39' : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  p: 1.5,
                  maxWidth: '80%'
                }}
              >
                <Typography variant="body2">{message.content}</Typography>
              </Box>
              <Typography variant="caption" sx={{ mt: 0.5, color: 'rgba(255, 255, 255, 0.6)' }}>
                {message.sender.displayName} • {new Date(message.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            InputProps={{
              endAdornment: (
                <IconButton onClick={sendMessage} sx={{ color: '#bb5c39' }}>
                  <SendIcon />
                </IconButton>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(187, 92, 57, 0.5)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#bb5c39'
                }
              }
            }}
          />
        </Box>
      </Drawer>

      {/* Participants Drawer */}
      <Drawer
        anchor="right"
        open={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            backgroundColor: '#2f2f2f',
            color: '#fff'
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Participants ({participants.length + 1})</Typography>
          <IconButton onClick={() => setIsParticipantsOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <List>
          {/* Host */}
          <ListItem>
            <ListItemAvatar>
              <Avatar sx={{ backgroundColor: '#bb5c39' }}>
                {user?.displayName?.[0]}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>{user?.displayName}</Typography>
                  <Typography variant="caption" sx={{ color: '#bb5c39' }}>
                    (Host)
                  </Typography>
                </Box>
              }
            />
          </ListItem>
          {/* Participants */}
          {participants.map((participant) => (
            <ListItem key={participant.id}>
              <ListItemAvatar>
                <Avatar>
                  {participant.displayName[0]}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={participant.displayName} />
            </ListItem>
          ))}
        </List>
      </Drawer>
    </Box>
  );
};

export default LiveClass; 