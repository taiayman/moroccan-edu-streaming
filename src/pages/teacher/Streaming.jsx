import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  CircularProgress,
  Alert,
  TextField,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  FiberManualRecord as RecordIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import {
  selectPeers,
  selectLocalPeer,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled
} from '@100mslive/hms-video-store';
import { useStream } from '../../hooks/useStream';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentLanguage } from '../../utils/navigation';

const Streaming = () => {
  const { classId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const {
    loading,
    error,
    hmsStore,
    isAudioEnabled,
    isVideoEnabled,
    getParticipants,
    getLocalPeer,
    toggleAudio,
    toggleVideo,
    leaveRoom
  } = useStream(location.state?.roomId);

  // State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    if (hmsStore) {
      // Subscribe to peers updates
      const unsubscribe = hmsStore.subscribe(selectPeers, () => {
        // Update UI when peers change
      });

      return () => unsubscribe();
    }
  }, [hmsStore]);

  const toggleScreenShare = async () => {
    if (hmsStore) {
      try {
        if (isScreenSharing) {
          await hmsStore.actions.setScreenShareEnabled(false);
        } else {
          await hmsStore.actions.setScreenShareEnabled(true);
        }
        setIsScreenSharing(!isScreenSharing);
      } catch (err) {
        console.error('Error toggling screen share:', err);
      }
    }
  };

  const toggleRecording = async () => {
    if (hmsStore) {
      try {
        if (isRecording) {
          await hmsStore.actions.stopRecording();
        } else {
          await hmsStore.actions.startRecording();
        }
        setIsRecording(!isRecording);
      } catch (err) {
        console.error('Error toggling recording:', err);
      }
    }
  };

  const endClass = async () => {
    try {
      await leaveRoom();
      navigate(`/${getCurrentLanguage()}/teacher/dashboard`);
    } catch (err) {
      console.error('Error ending class:', err);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && hmsStore) {
      const message = {
        id: Date.now(),
        sender: user,
        content: newMessage,
        timestamp: new Date()
      };
      hmsStore.actions.sendBroadcastMessage(newMessage);
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const localPeer = getLocalPeer();
  const participants = getParticipants();

  return (
    <Box sx={{ height: '100vh', bgcolor: '#000' }}>
      {/* Main content */}
      <Box sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Video grid */}
        <Box sx={{ height: 'calc(100% - 80px)', p: 2 }}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            {/* Teacher video */}
            <Grid item xs={12} md={isScreenSharing ? 4 : 6}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  bgcolor: '#1a1a1a',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                {localPeer && (
                  <video
                    autoPlay
                    muted
                    playsInline
                    ref={(video) => {
                      if (video && localPeer.videoTrack) {
                        video.srcObject = new MediaStream([localPeer.videoTrack.native]);
                      }
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    color: '#fff',
                    bgcolor: 'rgba(0, 0, 0, 0.6)',
                    px: 2,
                    py: 0.5,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Avatar sx={{ width: 24, height: 24 }}>
                    {user?.displayName?.[0]}
                  </Avatar>
                  <Typography variant="body2">
                    {user?.displayName} (You)
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Screen share or student grid */}
            <Grid item xs={12} md={isScreenSharing ? 8 : 6}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  bgcolor: '#1a1a1a',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                {isScreenSharing ? (
                  <video
                    autoPlay
                    playsInline
                    ref={(video) => {
                      if (video && localPeer?.screenShareTrack) {
                        video.srcObject = new MediaStream([localPeer.screenShareTrack.native]);
                      }
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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

        {/* Controls */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '80px',
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            px: 3
          }}
        >
          <IconButton
            onClick={toggleAudio}
            sx={{ color: isAudioEnabled ? 'primary.main' : 'error.main' }}
          >
            {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
          </IconButton>

          <IconButton
            onClick={toggleVideo}
            sx={{ color: isVideoEnabled ? 'primary.main' : 'error.main' }}
          >
            {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>

          <IconButton
            onClick={toggleScreenShare}
            sx={{ color: isScreenSharing ? 'primary.main' : 'white' }}
          >
            {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
          </IconButton>

          <IconButton
            onClick={toggleRecording}
            sx={{ color: isRecording ? 'error.main' : 'white' }}
          >
            {isRecording ? <StopIcon /> : <RecordIcon />}
          </IconButton>

          <IconButton
            onClick={() => setIsChatOpen(true)}
            sx={{ color: 'white' }}
          >
            <ChatIcon />
          </IconButton>

          <IconButton
            onClick={() => setIsParticipantsOpen(true)}
            sx={{ color: 'white' }}
          >
            <PeopleIcon />
          </IconButton>

          <IconButton
            onClick={() => setIsSettingsOpen(true)}
            sx={{ color: 'white' }}
          >
            <SettingsIcon />
          </IconButton>

          <Button
            variant="contained"
            color="error"
            onClick={endClass}
          >
            End Class
          </Button>
        </Box>
      </Box>

      {/* Chat drawer */}
      <Drawer
        anchor="right"
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        PaperProps={{
          sx: { width: 320, bgcolor: '#1a1a1a', color: 'white' }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Chat</Typography>
            <IconButton onClick={() => setIsChatOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Box sx={{ height: 'calc(100vh - 200px)', overflowY: 'auto', mb: 2 }}>
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  mb: 2,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: message.sender.id === user.id ? 'primary.dark' : 'background.paper'
                }}
              >
                <Typography variant="subtitle2">{message.sender.displayName}</Typography>
                <Typography variant="body2">{message.content}</Typography>
              </Box>
            ))}
          </Box>

          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' }
                }
              }}
            />
            <IconButton onClick={sendMessage} sx={{ color: 'primary.main' }}>
              <SendIcon />
            </IconButton>
          </Stack>
        </Box>
      </Drawer>

      {/* Participants drawer */}
      <Drawer
        anchor="right"
        open={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        PaperProps={{
          sx: { width: 320, bgcolor: '#1a1a1a', color: 'white' }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Participants ({participants.length})</Typography>
            <IconButton onClick={() => setIsParticipantsOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <List>
            {participants.map((peer) => (
              <ListItem
                key={peer.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => hmsStore?.actions.removePeer(peer.id)}
                    sx={{ color: 'error.main' }}
                  >
                    <CloseIcon />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar>{peer.name[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={peer.name}
                  secondary={
                    <Stack direction="row" spacing={1}>
                      {peer.isAudioEnabled && <MicIcon sx={{ fontSize: 16 }} />}
                      {peer.isVideoEnabled && <VideocamIcon sx={{ fontSize: 16 }} />}
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Settings dialog */}
      <Dialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        PaperProps={{
          sx: { bgcolor: '#1a1a1a', color: 'white' }
        }}
      >
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          {/* Add settings content here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Streaming;
