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
  Tooltip,
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
  Chat as ChatIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  HandRaised as HandRaisedIcon,
  PanTool as PanToolIcon
} from '@mui/icons-material';
import {
  selectPeers,
  selectLocalPeer
} from '@100mslive/hms-video-store';
import { useStream } from '../../hooks/useStream';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentLanguage } from '../../utils/navigation';
import { raiseHand, lowerHand } from '../../api/streaming';

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
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (hmsStore) {
      // Subscribe to peers updates
      const unsubscribe = hmsStore.subscribe(selectPeers, () => {
        // Update UI when peers change
      });

      // Subscribe to messages
      const messageUnsubscribe = hmsStore.subscribe((state) => state.messages, () => {
        // Update messages when new ones arrive
      });

      return () => {
        unsubscribe();
        messageUnsubscribe();
      };
    }
  }, [hmsStore]);

  const toggleHand = async () => {
    try {
      if (hmsStore) {
        if (isHandRaised) {
          await lowerHand(location.state?.roomId, user.id);
          await hmsStore.actions.sendBroadcastMessage({
            type: 'HAND_LOWERED',
            userId: user.id
          });
        } else {
          await raiseHand(location.state?.roomId, user.id);
          await hmsStore.actions.sendBroadcastMessage({
            type: 'HAND_RAISED',
            userId: user.id
          });
        }
        setIsHandRaised(!isHandRaised);
      }
    } catch (err) {
      console.error('Error toggling hand:', err);
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

  const leaveClass = async () => {
    try {
      await leaveRoom();
      navigate(`/${getCurrentLanguage()}/student/dashboard`);
    } catch (err) {
      console.error('Error leaving class:', err);
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
  const teacher = participants.find(p => p.roleName === 'host');

  return (
    <Box sx={{ height: '100vh', bgcolor: '#000' }}>
      {/* Main content */}
      <Box sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Video grid */}
        <Box sx={{ height: 'calc(100% - 80px)', p: 2 }}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            {/* Teacher video */}
            <Grid item xs={12} md={6}>
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
                {teacher && (
                  <video
                    autoPlay
                    playsInline
                    ref={(video) => {
                      if (video && teacher.videoTrack) {
                        video.srcObject = new MediaStream([teacher.videoTrack.native]);
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
                    {teacher?.name?.[0] || 'T'}
                  </Avatar>
                  <Typography variant="body2">
                    {teacher?.name || 'Teacher'}
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Student video */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  bgcolor: '#1a1a1a',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                {hasPermission && localPeer ? (
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
                ) : (
                  <Box sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body1" color="white">
                      {hasPermission ? 'You have permission to speak' : 'Raise your hand to request permission to speak'}
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
          <Tooltip title={hasPermission ? (isAudioEnabled ? 'Mute' : 'Unmute') : 'Request permission to speak'}>
            <IconButton
              onClick={toggleAudio}
              sx={{ color: !hasPermission ? 'action.disabled' : (isAudioEnabled ? 'primary.main' : 'error.main') }}
              disabled={!hasPermission}
            >
              {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={hasPermission ? (isVideoEnabled ? 'Stop Video' : 'Start Video') : 'Request permission for video'}>
            <IconButton
              onClick={toggleVideo}
              sx={{ color: !hasPermission ? 'action.disabled' : (isVideoEnabled ? 'primary.main' : 'error.main') }}
              disabled={!hasPermission}
            >
              {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
          </Tooltip>

          <IconButton
            onClick={toggleHand}
            sx={{ color: isHandRaised ? 'warning.main' : 'white' }}
          >
            {isHandRaised ? <PanToolIcon /> : <HandRaisedIcon />}
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
            onClick={leaveClass}
          >
            Leave Class
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
              <ListItem key={peer.id}>
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
