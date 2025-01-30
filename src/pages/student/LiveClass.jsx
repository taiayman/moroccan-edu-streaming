import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
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
  Chat as ChatIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  Send as SendIcon,
  ExitToApp as ExitToAppIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentLanguage } from '../../utils/navigation';
import { joinLiveClass } from '../../api/streaming';

const LiveClass = () => {
  const { classId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // Refs
  const videoRef = useRef(null);

  useEffect(() => {
    joinClass();
    return () => {
      leaveClass();
    };
  }, []);

  const joinClass = async () => {
    try {
      setLoading(true);
      setError(null);

      // Join the live class using 100ms
      const { token, roomId } = await joinLiveClass(
        classId,
        user.id,
        user.displayName || 'Student'
      );

      // Initialize 100ms client
      const response = await fetch(`https://prod-in2.100ms.live/hmsapi/get-token`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          role: 'student',
          room_id: roomId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get HMS token');
      }

      // Set up event listeners for participants, messages, etc.
      // This would typically involve WebSocket connections or polling
      // depending on your implementation

      setLoading(false);
    } catch (err) {
      console.error('Error joining class:', err);
      setError('Failed to join class. Please try again.');
      setLoading(false);
    }
  };

  const leaveClass = async () => {
    try {
      // Clean up 100ms connection
      // This would involve closing WebSocket connections
      // and cleaning up any resources

      navigate(`/${getCurrentLanguage()}/student/dashboard`);
    } catch (err) {
      console.error('Error leaving class:', err);
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    // Implement audio toggle using 100ms API
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    // Implement video toggle using 100ms API
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
      // Implement message sending using 100ms API
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#000' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3, bgcolor: '#000' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', bgcolor: '#000' }}>
      {/* Main content */}
      <Box sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Video container */}
        <Box sx={{ height: 'calc(100% - 80px)', p: 2 }}>
          <Box
            ref={videoRef}
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#1a1a1a'
            }}
          />
        </Box>

        {/* Controls */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '80px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
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

          <Button
            variant="contained"
            color="error"
            startIcon={<ExitToAppIcon />}
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
            <Typography variant="h6">Participants</Typography>
            <IconButton onClick={() => setIsParticipantsOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <List>
            {participants.map((participant) => (
              <ListItem key={participant.id}>
                <ListItemAvatar>
                  <Avatar>{participant.displayName[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={participant.displayName}
                  secondary={
                    <Stack direction="row" spacing={1}>
                      {participant.hasAudio && <MicIcon sx={{ fontSize: 16 }} />}
                      {participant.hasVideo && <VideocamIcon sx={{ fontSize: 16 }} />}
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default LiveClass;