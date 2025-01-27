import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AgoraRTC from 'agora-rtc-sdk-ng';
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
import { createAgoraClient } from '../../utils/agora';
import { getCurrentLanguage } from '../../utils/navigation';
import StreamLayout from '../../components/layout/StreamLayout';

const LiveClass = () => {
  const { classId } = useParams();
  const location = useLocation();
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
    if (!location.state?.channelName) {
      setError('Invalid class session');
      return;
    }
    initializeAgora();
    return () => {
      cleanup();
    };
  }, []);

  const initializeAgora = async () => {
    try {
      setLoading(true);
      const agoraClientInstance = createAgoraClient();
      const { channelName } = location.state;
      
      // Generate a random UID between 1 and 999999
      const uid = Math.floor(Math.random() * 999999) + 1;
      
      const { client, localTracks } = await agoraClientInstance.join(channelName, null, uid);
      
      setAgoraClient(client);
      setLocalTracks(localTracks);
      
      // Wait for a short moment to ensure DOM is ready
      setTimeout(() => {
        if (localTracks.videoTrack && localVideoRef.current) {
          localTracks.videoTrack.play(localVideoRef.current);
        }
      }, 100);

      setLoading(false);
    } catch (err) {
      console.error('Error initializing Agora:', err);
      setError('Failed to initialize live class: ' + err.message);
      setLoading(false);
    }
  };

  const cleanup = async () => {
    try {
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
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
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

  const handleLeaveClass = async () => {
    try {
      await cleanup();
      navigate(`/${getCurrentLanguage()}/student/live-classes`);
    } catch (err) {
      console.error('Error leaving class:', err);
    }
  };

  if (loading) {
    return (
      <StreamLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </StreamLayout>
    );
  }

  if (error) {
    return (
      <StreamLayout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </StreamLayout>
    );
  }

  return (
    <StreamLayout>
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
            </Grid>
          </Box>

          {/* Control Bar */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#2f2f2f',
              p: 2
            }}
          >
          <Stack
            direction="row"
              spacing={2}
            justifyContent="center"
            alignItems="center"
          >
            <IconButton
                onClick={toggleAudio}
              sx={{
                color: '#fff',
                  backgroundColor: !isAudioEnabled ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                    backgroundColor: !isAudioEnabled ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
                {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
            <IconButton
                onClick={toggleVideo}
              sx={{
                color: '#fff',
                  backgroundColor: !isVideoEnabled ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                    backgroundColor: !isVideoEnabled ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
                {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton
                onClick={toggleScreenShare}
              sx={{
                color: '#fff',
                  backgroundColor: isScreenSharing ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                    backgroundColor: isScreenSharing ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
            </IconButton>
            <Button
              variant="contained"
              color="error"
                onClick={handleLeaveClass}
                sx={{ px: 3 }}
              >
                Leave Class
            </Button>
          </Stack>
        </Box>
        </Grid>

        {/* Chat Drawer */}
        <Drawer
          anchor="right"
          open={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          variant="persistent"
          sx={{
            width: 350,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 350,
              backgroundColor: '#2f2f2f',
                color: '#fff',
              border: 'none'
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
          <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
              <Stack spacing={2}>
              {messages.map((message) => (
                <Box key={message.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {message.sender.displayName[0]}
                      </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {message.sender.displayName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Box>
                  <Typography variant="body1">{message.content}</Typography>
                  </Box>
                ))}
              </Stack>
          </Box>
            <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                    color: '#fff',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& fieldset': {
                        borderColor: 'transparent'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#fff'
                      }
                    }
                  }}
                />
              <IconButton onClick={sendMessage} sx={{ color: '#fff' }}>
                  <SendIcon />
                </IconButton>
              </Stack>
            </Box>
        </Drawer>

        {/* Participants Drawer */}
        <Drawer
          anchor="right"
          open={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          variant="persistent"
          sx={{
            width: 350,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 350,
              backgroundColor: '#2f2f2f',
              color: '#fff',
              border: 'none'
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
                      (Student)
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
      </Grid>
    </StreamLayout>
  );
};

export default LiveClass;
