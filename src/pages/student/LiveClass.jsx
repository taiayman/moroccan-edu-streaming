import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Stack,
  Avatar,
  Chip,
  Divider,
  TextField,
  Button,
  Container,
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
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreVertIcon,
  PictureInPicture as PictureInPictureIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';

const LiveClass = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const [message, setMessage] = useState('');

  // Dummy data for demonstration
  const participants = [
    { id: 1, name: 'Prof. Mohammed', role: 'teacher', isTeaching: true },
    { id: 2, name: 'Sarah Ahmed', role: 'student', isRaisingHand: true },
    { id: 3, name: 'Youssef Alami', role: 'student' },
    // ... more participants
  ];

  const messages = [
    { id: 1, sender: 'Prof. Mohammed', message: 'Bonjour à tous! Nous allons commencer le cours.', time: '10:00' },
    { id: 2, sender: 'Sarah Ahmed', message: 'Bonjour Professeur!', time: '10:01' },
    // ... more messages
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Add message handling logic here
      setMessage('');
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#fff'
    }}>
      {/* Main Content */}
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Video Area */}
        <Box sx={{ flex: 1, p: 2, position: 'relative' }}>
          {/* Main Video */}
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              height: 'calc(100vh - 100px)',
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Video Content */}
            <Box sx={{ 
              position: 'absolute',
              top: 16,
              left: 16,
              right: 16,
              display: 'flex',
              justifyContent: 'space-between',
              zIndex: 2
            }}>
              {/* Live Indicator */}
              <Chip
                label="EN DIRECT"
                sx={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: '#fff',
                  '& .MuiChip-label': {
                    px: 2,
                  },
                  '&::before': {
                    content: '""',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#f44336',
                    display: 'inline-block',
                    marginRight: 1
                  }
                }}
              />
              
              {/* Video Controls */}
              <Stack direction="row" spacing={1}>
                <IconButton size="small" sx={{ color: '#fff', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                  <PictureInPictureIcon />
                </IconButton>
                <IconButton size="small" sx={{ color: '#fff', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                  <SettingsIcon />
                </IconButton>
                <IconButton size="small" sx={{ color: '#fff', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                  <FullscreenIcon />
                </IconButton>
              </Stack>
            </Box>

            {/* Teacher Name Overlay */}
            <Box sx={{ 
              position: 'absolute',
              bottom: 16,
              left: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '4px 12px',
              borderRadius: '20px'
            }}>
              <Avatar sx={{ width: 24, height: 24 }}>M</Avatar>
              <Typography variant="body2">Prof. Mohammed</Typography>
            </Box>
          </Paper>

          {/* Control Bar */}
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={2}
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: '#1a1a1a',
              borderRadius: '16px'
            }}
          >
            <IconButton
              onClick={() => setIsMuted(!isMuted)}
              sx={{
                backgroundColor: isMuted ? '#f44336' : 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                '&:hover': {
                  backgroundColor: isMuted ? '#d32f2f' : 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              {isMuted ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
            
            <IconButton
              onClick={() => setIsVideoOff(!isVideoOff)}
              sx={{
                backgroundColor: isVideoOff ? '#f44336' : 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                '&:hover': {
                  backgroundColor: isVideoOff ? '#d32f2f' : 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              {isVideoOff ? <VideocamOffIcon /> : <VideocamIcon />}
            </IconButton>

            <IconButton
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)'
                }
              }}
            >
              {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
            </IconButton>

            <Button
              variant="contained"
              color="error"
              startIcon={<CloseIcon />}
              sx={{
                borderRadius: '20px',
                px: 3
              }}
            >
              Quitter
            </Button>
          </Stack>
        </Box>

        {/* Sidebar */}
        <Paper
          elevation={0}
          sx={{
            width: 350,
            backgroundColor: '#1a1a1a',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Tabs */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            <Button
              variant={isChatOpen ? 'contained' : 'text'}
              startIcon={<ChatIcon />}
              onClick={() => {
                setIsChatOpen(true);
                setIsPeopleOpen(false);
              }}
              sx={{
                backgroundColor: isChatOpen ? '#000' : 'transparent',
                color: '#fff',
                '&:hover': {
                  backgroundColor: isChatOpen ? '#000' : 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Chat
            </Button>
            <Button
              variant={isPeopleOpen ? 'contained' : 'text'}
              startIcon={<PeopleIcon />}
              onClick={() => {
                setIsPeopleOpen(true);
                setIsChatOpen(false);
              }}
              sx={{
                backgroundColor: isPeopleOpen ? '#000' : 'transparent',
                color: '#fff',
                '&:hover': {
                  backgroundColor: isPeopleOpen ? '#000' : 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Participants
            </Button>
          </Stack>

          {/* Content Area */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {isChatOpen ? (
              <Stack spacing={2}>
                {messages.map((msg) => (
                  <Box key={msg.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {msg.sender}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {msg.time}
                      </Typography>
                    </Box>
                    <Typography variant="body2">{msg.message}</Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Stack spacing={2}>
                {participants.map((participant) => (
                  <Box
                    key={participant.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {participant.name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">
                          {participant.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          {participant.role}
                        </Typography>
                      </Box>
                    </Box>
                    {participant.isTeaching && (
                      <Chip
                        label="Enseigne"
                        size="small"
                        sx={{
                          backgroundColor: '#2196f3',
                          color: '#fff'
                        }}
                      />
                    )}
                    {participant.isRaisingHand && (
                      <Chip
                        label="✋"
                        size="small"
                        sx={{
                          backgroundColor: '#4caf50',
                          color: '#fff'
                        }}
                      />
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          {/* Chat Input */}
          {isChatOpen && (
            <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Stack direction="row" spacing={1}>
                <IconButton size="small" sx={{ color: '#fff' }}>
                  <EmojiIcon />
                </IconButton>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Envoyer un message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
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
                <IconButton
                  size="small"
                  onClick={handleSendMessage}
                  sx={{
                    color: '#fff',
                    backgroundColor: message.trim() ? '#2196f3' : 'rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      backgroundColor: message.trim() ? '#1976d2' : 'rgba(255, 255, 255, 0.2)'
                    }
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default LiveClass;
