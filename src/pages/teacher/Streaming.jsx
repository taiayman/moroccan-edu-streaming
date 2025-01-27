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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem
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
  Send as SendIcon,
  Settings as SettingsIcon,
  PresentToAll as PresentIcon,
  QuestionAnswer as QuestionIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { createAgoraClient } from '../../utils/agora';
import { getCurrentLanguage } from '../../utils/navigation';
import StreamLayout from '../../components/layout/StreamLayout';

const Streaming = () => {
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isQuestionMode, setIsQuestionMode] = useState(false);
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

  const togglePresentationMode = () => {
    setIsPresentationMode(!isPresentationMode);
  };

  const toggleQuestionMode = () => {
    setIsQuestionMode(!isQuestionMode);
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
          <Box sx={{ height: { xs: 'calc(100% - 60px)', md: 'calc(100% - 80px)' }, p: { xs: 1, md: 2 } }}>
            <Grid container spacing={{ xs: 1, md: 2 }} sx={{ height: '100%' }}>
              {/* Local Video */}
              <Grid item xs={12} sm={isScreenSharing ? 6 : 12} md={isScreenSharing ? 3 : 6}>
                <Paper
                  elevation={0}
                  sx={{
                    height: '100%',
                    backgroundColor: '#2f2f2f',
                    borderRadius: { xs: '8px', md: '12px' },
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
                      bottom: { xs: 8, md: 16 },
                      left: { xs: 8, md: 16 },
                      color: '#fff',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      padding: { xs: '2px 8px', md: '4px 12px' },
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: { xs: '0.875rem', md: '1rem' }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
                      {user?.name || 'Teacher'} (You)
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
              height: { xs: '60px', md: '80px' },
              backgroundColor: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: { xs: 1, md: 3 }
            }}
          >
            <Stack
              direction="row"
              spacing={{ xs: 1, md: 2 }}
              alignItems="center"
              justifyContent="center"
              sx={{ width: '100%' }}
            >
              {/* Left Controls */}
              <Stack direction="row" spacing={{ xs: 1, md: 2 }}>
                <Tooltip title={isAudioEnabled ? t('stream.muteAudio') : t('stream.unmuteAudio')}>
                  <IconButton
                    onClick={toggleAudio}
                    sx={{
                      backgroundColor: isAudioEnabled ? 'primary.main' : 'error.main',
                      '&:hover': {
                        backgroundColor: isAudioEnabled ? 'primary.dark' : 'error.dark'
                      },
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                      color: '#fff'
                    }}
                  >
                    {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title={isVideoEnabled ? t('stream.stopVideo') : t('stream.startVideo')}>
                  <IconButton
                    onClick={toggleVideo}
                    sx={{
                      backgroundColor: isVideoEnabled ? 'primary.main' : 'error.main',
                      '&:hover': {
                        backgroundColor: isVideoEnabled ? 'primary.dark' : 'error.dark'
                      },
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                      color: '#fff'
                    }}
                  >
                    {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* Center Controls */}
              <Stack direction="row" spacing={{ xs: 1, md: 2 }}>
                <Tooltip title={isScreenSharing ? t('stream.stopSharing') : t('stream.startSharing')}>
                  <IconButton
                    onClick={toggleScreenShare}
                    sx={{
                      backgroundColor: isScreenSharing ? 'warning.main' : 'primary.main',
                      '&:hover': {
                        backgroundColor: isScreenSharing ? 'warning.dark' : 'primary.dark'
                      },
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                      color: '#fff'
                    }}
                  >
                    {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title={t('stream.presentationMode')}>
                  <IconButton
                    onClick={togglePresentationMode}
                    sx={{
                      backgroundColor: isPresentationMode ? 'warning.main' : 'primary.main',
                      '&:hover': {
                        backgroundColor: isPresentationMode ? 'warning.dark' : 'primary.dark'
                      },
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                      display: { xs: 'none', sm: 'flex' },
                      color: '#fff'
                    }}
                  >
                    <PresentIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* Right Controls */}
              <Stack direction="row" spacing={{ xs: 1, md: 2 }}>
                <Tooltip title={t('stream.chat')}>
                  <IconButton
                    onClick={() => setIsChatOpen(true)}
                    sx={{
                      backgroundColor: 'primary.main',
                      '&:hover': { backgroundColor: 'primary.dark' },
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                      color: '#fff'
                    }}
                  >
                    <ChatIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title={t('stream.participants')}>
                  <IconButton
                    onClick={() => setIsParticipantsOpen(true)}
                    sx={{
                      backgroundColor: 'primary.main',
                      '&:hover': { backgroundColor: 'primary.dark' },
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                      color: '#fff'
                    }}
                  >
                    <PeopleIcon />
                  </IconButton>
                </Tooltip>

                <Button
                  variant="contained"
                  color="error"
                  onClick={handleEndClass}
                  sx={{
                    height: { xs: 40, md: 48 },
                    minWidth: { xs: 100, md: 120 },
                    display: { xs: 'none', sm: 'flex' }
                  }}
                >
                  {t('stream.endClass')}
                </Button>
              </Stack>
            </Stack>
          </Box>

          {/* Mobile End Class Button */}
          <Box
            sx={{
              position: 'fixed',
              top: 16,
              right: 16,
              display: { xs: 'block', sm: 'none' }
            }}
          >
            <IconButton
              color="error"
              onClick={handleEndClass}
              sx={{
                backgroundColor: 'error.main',
                '&:hover': { backgroundColor: 'error.dark' }
              }}
            >
              <CloseIcon />
            </IconButton>
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
            width: { xs: '100%', sm: 350 },
            backgroundColor: '#1a1a1a',
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
            width: { xs: '100%', sm: 350 },
            backgroundColor: '#1a1a1a',
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

      {/* Settings Dialog */}
      <Dialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#2f2f2f',
            color: '#fff'
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Settings</Typography>
            <IconButton onClick={() => setIsSettingsOpen(false)} sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* Audio Settings */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Audio</Typography>
              <TextField
                select
                fullWidth
                label="Microphone"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#bb5c39'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              >
                <MenuItem value="default">Default Microphone</MenuItem>
              </TextField>
            </Box>

            {/* Video Settings */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Video</Typography>
              <TextField
                select
                fullWidth
                label="Camera"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#bb5c39'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              >
                <MenuItem value="default">Default Camera</MenuItem>
              </TextField>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="contained"
            onClick={() => setIsSettingsOpen(false)}
            sx={{
              backgroundColor: '#bb5c39',
              '&:hover': {
                backgroundColor: '#a04b2e'
              }
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </StreamLayout>
  );
};

export default Streaming;
