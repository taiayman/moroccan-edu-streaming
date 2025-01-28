import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AgoraRTC from 'agora-rtc-sdk-ng';
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
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  Chat as ChatIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentLanguage } from '../../utils/navigation';

const appId = process.env.REACT_APP_AGORA_APP_ID || 'YOUR_AGORA_APP_ID_HERE';

const LiveClass = () => {
  console.log('[LIVECLASS] Component render start');

  const { classId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [agoraClient, setAgoraClient] = useState(null);
  const [localTracks, setLocalTracks] = useState({ audioTrack: null, videoTrack: null });
  const [screenTrack, setScreenTrack] = useState(null);

  const [studentUid, setStudentUid] = useState(null);
  const [teacherUid, setTeacherUid] = useState(null);

  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Keep track of all participants, including self
  const [participants, setParticipants] = useState([]);

  // Chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});

  // Flags to handle double mount in Strict Mode
  const joinedRef = useRef(false);
  const cleanupInProgressRef = useRef(false);

  useEffect(() => {
    console.log('[LIVECLASS] useEffect triggered. Channel from location:', location.state?.channelName);

    if (!location.state?.channelName) {
      console.error('[LIVECLASS] No channelName found in location.state');
      setError('Invalid class session');
      setLoading(false);
      return;
    }

    if (!joinedRef.current && !cleanupInProgressRef.current) {
      console.log('[LIVECLASS] Condition to init: joinedRef=', joinedRef.current, 'cleanupInProgressRef=', cleanupInProgressRef.current);
      joinedRef.current = true;
      initializeAgora().catch((err) => {
        console.error('[LIVECLASS] initializeAgora() error:', err);
        setError('Failed to join the live class: ' + err.message);
        setLoading(false);
      });
    }

    return () => {
      console.log('[LIVECLASS] useEffect cleanup (unmount). Calling cleanup()...');
      cleanup();
    };
  }, [location.state?.channelName]);

  // Cleanup
  const cleanup = async () => {
    if (cleanupInProgressRef.current) {
      console.log('[LIVECLASS] cleanup already in progress, skipping');
      return;
    }
    cleanupInProgressRef.current = true;
    console.log('[LIVECLASS] >>> cleanup() called');
    try {
      // Stop local tracks
      for (const track of Object.values(localTracks)) {
        if (track) {
          try {
            track.stop();
            track.close();
          } catch (err) {
            console.error('[LIVECLASS] Error closing track:', err);
          }
        }
      }
      // Stop screen
      if (screenTrack) {
        try {
          screenTrack.stop();
          screenTrack.close();
        } catch (err) {
          console.error('[LIVECLASS] Error closing screen track:', err);
        }
      }
      // Leave
      if (agoraClient && joinedRef.current) {
        console.log('[LIVECLASS] student leaving the channel...');
        try {
          await agoraClient.leave();
          agoraClient.removeAllListeners();
        } catch (err) {
          console.error('[LIVECLASS] Error leaving channel:', err);
        }
      }
    } catch (err) {
      console.error('[LIVECLASS] cleanup error =>', err);
    } finally {
      setAgoraClient(null);
      setLocalTracks({ audioTrack: null, videoTrack: null });
      setScreenTrack(null);
      setTeacherUid(null);
      setParticipants([]);
      setStudentUid(null);
      joinedRef.current = false;
      cleanupInProgressRef.current = false;
      console.log('[LIVECLASS] cleanup finished');
    }
  };

  const initializeAgora = async () => {
    console.log('[LIVECLASS] >>> initializeAgora() called');
    try {
      setLoading(true);
      const { channelName } = location.state;
      console.log('[LIVECLASS] Student joining channel:', channelName);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Generate numeric Agora UID for student
      const agoraUid = Math.floor(Math.random() * 1000000) + 100000;
      console.log('[LIVECLASS] Generated Agora UID:', agoraUid);
      setStudentUid(agoraUid);

      // Create client with same configuration as teacher
      const clientConfig = {
        mode: 'live',
        codec: 'vp8'
      };

      if (process.env.REACT_APP_AGORA_PROXY_SERVER) {
        clientConfig.proxyServer = process.env.REACT_APP_AGORA_PROXY_SERVER;
      }

      if (process.env.REACT_APP_AGORA_TURN_SERVER) {
        clientConfig.turnServer = {
          turnServerURL: process.env.REACT_APP_AGORA_TURN_SERVER,
          username: process.env.REACT_APP_AGORA_TURN_USERNAME,
          password: process.env.REACT_APP_AGORA_TURN_CREDENTIAL
        };
      }

      const client = AgoraRTC.createClient(clientConfig);
      setAgoraClient(client);

      // Set role first - important for live streaming mode
      await client.setClientRole("audience");

      // Join channel with generated numeric UID
      await client.join(appId, channelName, null, agoraUid);
      console.log('[LIVECLASS] Student joined with Agora UID:', agoraUid);

      // Event listeners for teacher's tracks
      client.on('user-published', async (user, mediaType) => {
        try {
          await client.subscribe(user, mediaType);
          console.log('[LIVECLASS] Subscribed to teacher track:', mediaType);

          if (mediaType === 'video') {
            const videoTrack = user.videoTrack;
            // Create container if it doesn't exist
            if (!remoteVideosRef.current[user.uid]) {
              remoteVideosRef.current[user.uid] = document.createElement('div');
              remoteVideosRef.current[user.uid].id = `video-${user.uid}`;
              const container = document.querySelector('.remote-video-container');
              if (container) {
                container.appendChild(remoteVideosRef.current[user.uid]);
              }
            }
            if (videoTrack) {
              videoTrack.play(`video-${user.uid}`);
            }
          } else if (mediaType === 'audio') {
            const audioTrack = user.audioTrack;
            if (audioTrack) {
              audioTrack.play();
            }
          }

          // Update participants state
          setParticipants(prev => {
            const existing = prev.find(p => p.uid === user.uid);
            if (!existing) {
              return [...prev, {
                uid: user.uid,
                displayName: 'Teacher',
                isTeacher: true,
                hasAudio: mediaType === 'audio',
                hasVideo: mediaType === 'video'
              }];
            }
            return prev.map(p => {
              if (p.uid === user.uid) {
                return {
                  ...p,
                  hasAudio: mediaType === 'audio' ? true : p.hasAudio,
                  hasVideo: mediaType === 'video' ? true : p.hasVideo
                };
              }
              return p;
            });
          });
        } catch (error) {
          console.error('[LIVECLASS] Error subscribing to track:', error);
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        console.log('[LIVECLASS] Teacher unpublished:', mediaType);
        // Update participant state when teacher unpublishes tracks
        setParticipants(prev => 
          prev.map(p => {
            if (p.uid === user.uid) {
              return {
                ...p,
                hasAudio: mediaType === 'audio' ? false : p.hasAudio,
                hasVideo: mediaType === 'video' ? false : p.hasVideo
              };
            }
            return p;
          })
        );
      });

      // Create local tracks only if needed (initially hidden)
      const [audioTrack, videoTrack] = await Promise.all([
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack()
      ]);

      // Store tracks but don't publish yet
      setLocalTracks({ audioTrack, videoTrack });

      // Only play local preview
      if (videoTrack && localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      // Add only self to participants (non-publishing)
      setParticipants(prev => [...prev, {
        uid: agoraUid,
        displayName: user.name || `Student ${agoraUid}`,
        isTeacher: false,
        hasAudio: false,
        hasVideo: false
      }]);

    } catch (err) {
      console.error('[LIVECLASS] initializeAgora error:', err);
      setError('Failed to join class');
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleUserJoined = (user) => {
    console.log('[LIVECLASS] user-joined =>', user.uid);
    setParticipants((prev) => {
      if (prev.find((p) => p.uid === user.uid)) {
        console.log('[LIVECLASS] user-joined => user already in participants:', user.uid);
        return prev;
      }
      const isTeacher = user.role === 'teacher';
      if (isTeacher) {
        setTeacherUid(user.uid);
      }
      return [
        ...prev,
        {
          uid: user.uid,
          isTeacher,
          displayName: isTeacher ? (user.displayName || 'Teacher') : (user.displayName || `Student #${user.uid}`),
          hasAudio: false,
          hasVideo: false
        }
      ];
    });
  };

  const handleUserLeft = (user) => {
    console.log('[LIVECLASS] user-left =>', user.uid);
    setParticipants((prev) => {
      const isTeacher = prev.find(p => p.uid === user.uid)?.isTeacher;
      if (isTeacher) {
        setTeacherUid(null);
      }
      return prev.filter((p) => p.uid !== user.uid);
    });
  };

  const handleUserPublished = async (user, mediaType) => {
    console.log('[LIVECLASS] user-published =>', user.uid, mediaType);
    try {
      if (!agoraClient) {
        console.warn('[LIVECLASS] No agoraClient available for subscription');
        return;
      }

      // Subscribe to the remote user
      await agoraClient.subscribe(user, mediaType);
      console.log('[LIVECLASS] Subscribed to', user.uid, mediaType);
      
      // Update participants state
      setParticipants(prev => {
        const existing = prev.find(p => p.uid === user.uid);
        if (!existing) {
          // New participant
          return [...prev, {
            uid: user.uid,
            displayName: user.uid === teacherUid ? 'Teacher' : `Student ${user.uid}`,
            isTeacher: user.uid === teacherUid,
            hasAudio: mediaType === 'audio',
            hasVideo: mediaType === 'video',
            audioTrack: mediaType === 'audio' ? user.audioTrack : null,
            videoTrack: mediaType === 'video' ? user.videoTrack : null
          }];
        }
        
        // Update existing participant
        return prev.map(p => {
          if (p.uid === user.uid) {
            return {
              ...p,
              hasAudio: mediaType === 'audio' ? true : p.hasAudio,
              hasVideo: mediaType === 'video' ? true : p.hasVideo,
              audioTrack: mediaType === 'audio' ? user.audioTrack : p.audioTrack,
              videoTrack: mediaType === 'video' ? user.videoTrack : p.videoTrack
            };
          }
          return p;
        });
      });

      // Play the track
      if (mediaType === 'video' && user.videoTrack && remoteVideosRef.current[user.uid]) {
        user.videoTrack.play(remoteVideosRef.current[user.uid]);
      }
      if (mediaType === 'audio' && user.audioTrack) {
        user.audioTrack.play();
      }
    } catch (err) {
      console.error('[LIVECLASS] Error subscribing:', err);
    }
  };

  const handleUserUnpublished = (user, mediaType) => {
    console.log('[LIVECLASS] user-unpublished =>', user.uid, mediaType);
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.uid === user.uid) {
          if (mediaType === 'audio') {
            return { ...p, hasAudio: false };
          }
          if (mediaType === 'video') {
            return { ...p, hasVideo: false };
          }
        }
        return p;
      })
    );
  };

  // Toggles
  const toggleAudio = async () => {
    console.log('[LIVECLASS] Toggling audio. Current:', isAudioEnabled);
    if (localTracks.audioTrack) {
      await localTracks.audioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled((prev) => !prev);
    }
  };

  const toggleVideo = async () => {
    console.log('[LIVECLASS] Toggling video. Current:', isVideoEnabled);
    if (localTracks.videoTrack) {
      await localTracks.videoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled((prev) => !prev);
    }
  };

  const toggleScreenShare = async () => {
    console.log('[LIVECLASS] Toggling screen share. Currently isScreenSharing=', isScreenSharing);
    if (!isScreenSharing) {
      try {
        const screen = await AgoraRTC.createScreenVideoTrack();
        // Unpublish camera track
        if (agoraClient && localTracks.videoTrack) {
          await agoraClient.unpublish(localTracks.videoTrack);
        }
        // Publish screen
        if (agoraClient) {
          await agoraClient.publish(screen);
        }
        setScreenTrack(screen);
        setIsScreenSharing(true);
      } catch (err) {
        console.error('[LIVECLASS] Error sharing screen =>', err);
      }
    } else {
      if (screenTrack && agoraClient) {
        try {
          await agoraClient.unpublish(screenTrack);
          screenTrack.stop();
          screenTrack.close();
        } catch {}
        setScreenTrack(null);
        // Re-publish camera track
        if (localTracks.videoTrack) {
          await agoraClient.publish(localTracks.videoTrack);
        }
        setIsScreenSharing(false);
      }
    }
  };

  // Chat (simple local example)
  const sendMessage = () => {
    if (newMessage.trim()) {
      const msgObj = {
        id: Date.now(),
        sender: user,
        content: newMessage,
        timestamp: new Date()
      };
      setMessages((old) => [...old, msgObj]);
      setNewMessage('');
    }
  };

  const handleLeaveClass = async () => {
    console.log('[LIVECLASS] handleLeaveClass => leaving...');
    await cleanup();
    navigate(`/${getCurrentLanguage()}/student/dashboard`);
  };

  // Renders
  const renderParticipantItem = (p) => {
    return (
      <ListItem key={p.uid}>
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: p.isTeacher ? '#bb5c39' : 'primary.main' }}>
            {p.displayName?.[0] || 'U'}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>{p.displayName}</Typography>
              {p.isTeacher && (
                <Typography variant="caption" sx={{ color: '#bb5c39' }}>
                  (Teacher)
                </Typography>
              )}
            </Box>
          }
          secondary={
            <Stack direction="row" spacing={1} alignItems="center">
              {p.hasAudio && <MicIcon sx={{ fontSize: 14, color: '#4caf50' }} />}
              {p.hasVideo && <VideocamIcon sx={{ fontSize: 14, color: '#4caf50' }} />}
            </Stack>
          }
        />
      </ListItem>
    );
  };

  const renderVideoContainer = (isLocal, uid, ref) => {
    const participant = participants.find((p) => p.uid === uid);
    const hasAudio = participant?.hasAudio ?? isAudioEnabled;
    const hasVideo = participant?.hasVideo ?? isVideoEnabled;

    return (
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#1a1a1a'
        }}
      >
        <Box
          ref={ref}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 1,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          {isLocal && !isVideoEnabled && (
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
              {user?.displayName?.[0] || 'Y'}
            </Avatar>
          )}
          {!isLocal && !hasVideo && (
            <Avatar sx={{ width: 24, height: 24, bgcolor: '#666' }}>
              {String(uid).slice(-2)}
            </Avatar>
          )}
          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
            {isLocal
              ? `${user?.displayName || 'You'} (You)`
              : participants.find(p => p.uid === uid)?.displayName || `User #${uid}`}
          </Typography>
          {isLocal && !isAudioEnabled && (
            <MicOffIcon sx={{ color: '#ff4d4f', fontSize: 16 }} />
          )}
          {!isLocal && hasAudio && <MicIcon sx={{ color: '#4caf50', fontSize: 16 }} />}
          {!isLocal && hasVideo && <VideocamIcon sx={{ color: '#4caf50', fontSize: 16 }} />}
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#000' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, bgcolor: '#000' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', bgcolor: '#000' }}>
      <Box sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
        <Box
          sx={{
            height: '100%',
            p: 2,
            display: 'grid',
            gridTemplateColumns: teacherUid ? '1fr 1fr' : '1fr',
            gap: 2
          }}
        >
          {/* Teacher's video */}
          <Box 
            className="remote-video-container"
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {teacherUid && (
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#1a1a1a'
                }}
              >
                <div id={`video-${teacherUid}`} style={{ width: '100%', height: '100%' }} />
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 1,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                    Teacher
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          {/* Student's own video */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderVideoContainer(true, studentUid, localVideoRef)}
          </Box>
        </Box>

        {/* Screen share overlay if active */}
        {isScreenSharing && screenTrack && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: '#000',
              zIndex: 10
            }}
          >
            {renderVideoContainer(true, 'screen', (el) => el && screenTrack.play(el))}
          </Box>
        )}

        {/* Control bar */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            px: 2,
            py: 1.5,
            bgcolor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(10px)',
            borderRadius: '50px',
            display: 'flex',
            gap: 1,
            alignItems: 'center'
          }}
        >
          <Tooltip title={isAudioEnabled ? 'Mute' : 'Unmute'}>
            <IconButton onClick={toggleAudio} sx={{ color: '#fff' }}>
              {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={isVideoEnabled ? 'Stop Video' : 'Start Video'}>
            <IconButton onClick={toggleVideo} sx={{ color: '#fff' }}>
              {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}>
            <IconButton onClick={toggleScreenShare} sx={{ color: '#fff' }}>
              {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Chat">
            <IconButton onClick={() => setIsChatOpen(true)} sx={{ color: '#fff' }}>
              <ChatIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Participants">
            <IconButton onClick={() => setIsParticipantsOpen(true)} sx={{ color: '#fff' }}>
              <PeopleIcon />
            </IconButton>
          </Tooltip>

          <Button variant="contained" color="error" onClick={handleLeaveClass} startIcon={<CloseIcon />}>
            Leave
          </Button>
        </Box>
      </Box>

      {/* Chat Drawer */}
      <Drawer
        anchor="right"
        open={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 350 }, backgroundColor: '#1a1a1a', color: '#fff' }
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
            {messages.map((m) => (
              <Box key={m.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Avatar sx={{ width: 24, height: 24 }}>
                    {m?.sender?.displayName?.[0] || 'A'}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {m?.sender?.displayName || 'Anonymous'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    {new Date(m.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
                <Typography variant="body1">{m.content}</Typography>
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
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#fff' }
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
        PaperProps={{
          sx: { width: { xs: '100%', sm: 350 }, backgroundColor: '#1a1a1a', color: '#fff' }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ color: '#fff' }}>Participants</Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        <List>
          {participants.map((participant) => (
            <ListItem key={participant.uid}>
              <ListItemText
                primary={participant.isTeacher ? 'Teacher' : participant.displayName}
                primaryTypographyProps={{ sx: { color: '#fff' } }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                {participant.hasAudio && <MicIcon fontSize="small" />}
                {participant.hasVideo && <VideocamIcon fontSize="small" />}
              </Box>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </Box>
  );
};

export default LiveClass;