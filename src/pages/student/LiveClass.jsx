import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Stack,
  Paper,
  Avatar,
  Tab,
  Tabs,
  TextField,
  Container
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  ScreenShare as ScreenShareIcon,
  PanTool as PanToolIcon,
  CallEnd as CallEndIcon,
  Chat as ChatIcon,
  People as PeopleIcon
} from '@mui/icons-material';

const LiveClass = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isHandRaised, setIsHandRaised] = useState(false);
  
  const [messages, setMessages] = useState([
    { id: 1, user: 'Prof. Benali', text: 'Bienvenue au cours d\'aujourd\'hui sur le Calcul!', time: '10:00', avatar: '/api/placeholder/32/32', isInstructor: true },
    { id: 2, user: 'Sara', text: 'Merci professeur!', time: '10:01', avatar: '/api/placeholder/32/32' },
    { id: 3, user: 'Ahmed', text: 'Pouvez-vous réexpliquer le dernier point?', time: '10:05', avatar: '/api/placeholder/32/32' }
  ]);
  
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: messages.length + 1,
        user: 'Vous',
        text: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: '/api/placeholder/32/32'
      }]);
      setNewMessage('');
    }
  };

  const participants = [
    { id: 1, name: 'Prof. Benali', role: 'Professeur', isActive: true, avatar: '/api/placeholder/32/32' },
    { id: 2, name: 'Sara Alami', role: 'Étudiant', isActive: true, avatar: '/api/placeholder/32/32' },
    { id: 3, name: 'Ahmed Hassan', role: 'Étudiant', isActive: true, avatar: '/api/placeholder/32/32' },
    { id: 4, name: 'Leila Mansouri', role: 'Étudiant', isActive: true, avatar: '/api/placeholder/32/32' }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#FAFAFA',
      pt: { xs: '70px', md: '90px' },
      pb: 4
    }}>
      <Container maxWidth="xl" sx={{ 
        height: { xs: 'auto', md: 'calc(100vh - 90px)' },
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Main Content */}
        <Box sx={{ 
          height: { xs: 'auto', md: '100%' },
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3
        }}>
          {/* Video Area */}
          <Box sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#000',
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            minHeight: { xs: '60vh', md: 'auto' }
          }}>
            {/* Class Info */}
            <Box sx={{ 
              p: { xs: 1.5, md: 2 }, 
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Typography variant="h6" sx={{ 
                color: 'white', 
                fontWeight: 600,
                fontSize: { xs: '1rem', md: '1.25rem' }
              }}>
                Calcul: Les Dérivées
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Prof. Benali • En direct
              </Typography>
            </Box>

            {/* Main Video */}
            <Box sx={{ 
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              minHeight: { xs: '40vh', md: 'auto' }
            }}>
              <img 
                src="/api/placeholder/1280/720" 
                alt="Flux du professeur" 
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              />
            </Box>

            {/* Student's Video */}
            <Paper
              elevation={3}
              sx={{
                position: 'absolute',
                bottom: { xs: 80, md: 100 },
                right: { xs: 16, md: 24 },
                width: { xs: 120, sm: 160, md: 200 },
                height: { xs: 90, sm: 120, md: 150 },
                bgcolor: 'grey.800',
                overflow: 'hidden',
                borderRadius: '12px',
                border: '2px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <img 
                src="/api/placeholder/200/150" 
                alt="Votre flux"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Paper>

            {/* Controls */}
            <Paper
              elevation={0}
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.95)',
                p: { xs: 1.5, md: 3 },
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Stack 
                direction="row" 
                spacing={{ xs: 1, md: 2 }} 
                justifyContent="center" 
                alignItems="center"
                sx={{
                  flexWrap: { xs: 'wrap', md: 'nowrap' },
                  gap: { xs: 1, md: 0 }
                }}
              >
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  variant="contained"
                  startIcon={isMuted ? <MicOffIcon /> : <MicIcon />}
                  sx={{
                    bgcolor: isMuted ? '#DC2626' : '#1F2937',
                    '&:hover': {
                      bgcolor: isMuted ? '#991B1B' : '#111827',
                    },
                    px: { xs: 2, md: 3 },
                    py: { xs: 1, md: 1.5 },
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: { xs: '0.8rem', md: '0.875rem' }
                  }}
                >
                  {isMuted ? 'Activer' : 'Couper'}
                </Button>

                <Button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  variant="contained"
                  startIcon={isVideoOff ? <VideocamOffIcon /> : <VideocamIcon />}
                  sx={{
                    bgcolor: isVideoOff ? '#DC2626' : '#1F2937',
                    '&:hover': {
                      bgcolor: isVideoOff ? '#991B1B' : '#111827',
                    },
                    px: { xs: 2, md: 3 },
                    py: { xs: 1, md: 1.5 },
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: { xs: '0.8rem', md: '0.875rem' }
                  }}
                >
                  {isVideoOff ? 'Démarrer' : 'Arrêter'}
                </Button>

                <Button
                  variant="contained"
                  startIcon={<ScreenShareIcon />}
                  sx={{
                    bgcolor: '#1F2937',
                    '&:hover': { bgcolor: '#111827' },
                    px: { xs: 2, md: 3 },
                    py: { xs: 1, md: 1.5 },
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    display: { xs: 'none', sm: 'flex' }
                  }}
                >
                  Partager
                </Button>

                <Button
                  onClick={() => setIsHandRaised(!isHandRaised)}
                  variant="contained"
                  startIcon={<PanToolIcon />}
                  sx={{
                    bgcolor: isHandRaised ? '#000' : '#1F2937',
                    '&:hover': {
                      bgcolor: isHandRaised ? '#111827' : '#111827',
                    },
                    px: { xs: 2, md: 3 },
                    py: { xs: 1, md: 1.5 },
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: { xs: '0.8rem', md: '0.875rem' }
                  }}
                >
                  {isHandRaised ? 'Baisser' : 'Lever'}
                </Button>

                <Button
                  variant="contained"
                  startIcon={<CallEndIcon />}
                  sx={{
                    bgcolor: '#DC2626',
                    '&:hover': { bgcolor: '#991B1B' },
                    px: { xs: 2, md: 3 },
                    py: { xs: 1, md: 1.5 },
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: { xs: '0.8rem', md: '0.875rem' }
                  }}
                >
                  Quitter
                </Button>
              </Stack>
            </Paper>
          </Box>

          {/* Chat Sidebar */}
          <Paper
            elevation={0}
            sx={{
              width: { xs: '100%', md: 360 },
              height: { xs: '400px', md: 'auto' },
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'white',
              border: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.1)'
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                px: 2,
                pt: 2,
                '& .MuiTab-root': {
                  minHeight: { xs: 40, md: 48 },
                  fontSize: { xs: '0.8rem', md: '0.875rem' },
                  fontWeight: 600,
                  color: '#666',
                  '&.Mui-selected': {
                    color: '#000'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#000'
                }
              }}
            >
              <Tab
                icon={<ChatIcon sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }} />}
                label="Chat"
                sx={{ flex: 1 }}
              />
              <Tab
                icon={<PeopleIcon sx={{ fontSize: { xs: '1.2rem', md: '1.5rem' } }} />}
                label={`${participants.length}`}
                sx={{ flex: 1 }}
              />
            </Tabs>

            {activeTab === 0 ? (
              <>
                <Box sx={{ 
                  flex: 1, 
                  overflow: 'auto', 
                  p: { xs: 1.5, md: 2 }
                }}>
                  {messages.map((message) => (
                    <Box key={message.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Avatar 
                          src={message.avatar} 
                          sx={{ 
                            width: { xs: 28, md: 32 }, 
                            height: { xs: 28, md: 32 } 
                          }} 
                        />
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            mb: 0.5 
                          }}>
                            <Typography variant="subtitle2" sx={{ 
                              fontWeight: 600,
                              color: message.isInstructor ? '#000' : '#666',
                              fontSize: { xs: '0.8rem', md: '0.875rem' }
                            }}>
                              {message.user}
                              {message.isInstructor && (
                                <Chip
                                  label="Prof"
                                  size="small"
                                  sx={{ 
                                    ml: 1,
                                    height: { xs: 16, md: 20 },
                                    fontSize: { xs: '0.65rem', md: '0.75rem' },
                                    bgcolor: 'rgba(0, 0, 0, 0.1)',
                                    color: '#000'
                                  }}
                                />
                              )}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: '#666',
                              fontSize: { xs: '0.7rem', md: '0.75rem' }
                            }}>
                              {message.time}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ 
                            color: '#000',
                            fontSize: { xs: '0.85rem', md: '0.875rem' }
                          }}>
                            {message.text}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
                <Box
                  component="form"
                  onSubmit={handleSendMessage}
                  sx={{
                    p: { xs: 1.5, md: 2 },
                    borderTop: '1px solid',
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Écrivez un message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        bgcolor: '#F5F5F5',
                        fontSize: { xs: '0.85rem', md: '0.875rem' },
                        '& fieldset': {
                          borderColor: 'transparent'
                        },
                        '&:hover fieldset': {
                          borderColor: '#000'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#000'
                        }
                      }
                    }}
                  />
                </Box>
              </>
            ) : (
              <Box sx={{ 
                flex: 1, 
                overflow: 'auto', 
                p: { xs: 1.5, md: 2 }
              }}>
                {participants.map((participant) => (
                  <Box
                    key={participant.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      '&:hover': {
                        bgcolor: '#F5F5F5',
                        borderRadius: '8px'
                      }
                    }}
                  >
                    <Avatar 
                      src={participant.avatar}
                      sx={{ 
                        width: { xs: 32, md: 40 },
                        height: { xs: 32, md: 40 }
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.85rem', md: '0.875rem' }
                      }}>
                        {participant.name}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#666',
                        fontSize: { xs: '0.8rem', md: '0.875rem' }
                      }}>
                        {participant.role}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: { xs: 6, md: 8 },
                        height: { xs: 6, md: 8 },
                        borderRadius: '50%',
                        bgcolor: participant.isActive ? '#22C55E' : '#666'
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default LiveClass;