import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Box, Typography, IconButton, Button, Stack, Avatar, Tooltip, CircularProgress, Alert, TextField, Drawer, List, ListItem, ListItemText, ListItemAvatar, Divider, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Mic as MicIcon, MicOff as MicOffIcon, Videocam as VideocamIcon, VideocamOff as VideocamOffIcon, ScreenShare as ScreenShareIcon, StopScreenShare as StopScreenShareIcon, Chat as ChatIcon, People as PeopleIcon, Close as CloseIcon, Send as SendIcon, Settings as SettingsIcon, PresentToAll as PresentIcon, QuestionAnswer as QuestionIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentLanguage } from '../../utils/navigation';

const appId = process.env.REACT_APP_AGORA_APP_ID || 'YOUR_AGORA_APP_ID_HERE';

const Streaming = () => {
    console.log('[STREAMING] Component render start');
    const { classId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [agoraClient, setAgoraClient] = useState(null);
    const [localTracks, setLocalTracks] = useState({ audioTrack: null, videoTrack: null });
    const [screenTrack, setScreenTrack] = useState(null);
    const [teacherUid, setTeacherUid] = useState(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isPresentationMode, setIsPresentationMode] = useState(false);
    const [isQuestionMode, setIsQuestionMode] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState({}); // key: uid => { videoTrack, audioTrack, hasVideo, hasAudio }
    // Chat / UI states
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const localVideoRef = useRef(null);
    const remoteVideosRef = useRef({});

    // Flags to handle double mount in Strict Mode
    const joinedRef = useRef(false);
    const cleanupInProgressRef = useRef(false);

    useEffect(() => {
        console.log('[STREAMING] useEffect triggered. Channel:', location.state?.channelName, 'Auth:', { isAuthenticated, authLoading });
        
        const timeoutIds = [];
        let retries = 0;
        const maxRetries = 8;
        const checkInterval = 750;

        const checkUserData = () => {
            if (user?.id) {
                if (user.role !== 'teacher') {
                    console.error('[STREAMING] User is not a teacher');
                    setError('Only teachers can start live classes');
                    navigate(`/${getCurrentLanguage()}/dashboard`);
                    return;
                }
                console.log('[STREAMING] User data now available:', user.id);
                handleInitialization();
            } else if (retries < maxRetries) {
                retries++;
                console.warn(`[STREAMING] User data check retry ${retries}/${maxRetries}`);
                const timeoutId = setTimeout(checkUserData, checkInterval);
                timeoutIds.push(timeoutId);
            } else {
                console.error('[STREAMING] User data timeout after all retries');
                setError('User profile loading failed - please refresh the page');
                navigate(`/${getCurrentLanguage()}/dashboard`);
            }
        };

        const handleInitialization = () => {
            if (!joinedRef.current && !cleanupInProgressRef.current) {
                console.log('[STREAMING] Initializing with user:', user.id);
                joinedRef.current = true;
                initializeAgora().catch((err) => {
                    console.error('[STREAMING] initializeAgora() error:', err);
                    setError(`Failed to initialize: ${err.message}`);
                });
            }
        };

        if (authLoading) {
            console.log('[STREAMING] Auth loading, waiting...');
            return;
        }

        if (!isAuthenticated) {
            console.error('[STREAMING] User not authenticated');
            setError('Please login to access this feature');
            navigate(`/${getCurrentLanguage()}/auth/login`);
            return;
        }

        // Start checking for user data
        checkUserData();

        return () => {
            console.log('[STREAMING] useEffect cleanup');
            timeoutIds.forEach(clearTimeout); // Clear any pending timeouts
            cleanup();
        };
    }, [location.state?.channelName, isAuthenticated, authLoading, navigate, user, user?.id]);

    const initializeAgora = async () => {
        if (!user || !user.id) {
            console.warn('[STREAMING] User or user.id is missing');
            return;
        }
        
        // Add role validation
        if (user?.role !== 'teacher') {
            console.error('[STREAMING] Unauthorized access - user is not a teacher');
            setError('Only teachers can start live classes');
            navigate(`/${getCurrentLanguage()}/dashboard`);
            return;
        }

        console.log('[STREAMING] >>> initializeAgora() called');
        try {
            setLoading(true);

            const { channelName } = location.state;
            if (!channelName) {
                throw new Error('Channel name is required');
            }

            console.log('[STREAMING] Initializing teacher with channel:', channelName, 'uid:', user.id);

            // Update the Agora client configuration
            const clientConfig = {
                mode: 'live',
                codec: 'vp8'
            };

            // Only add proxy/turn config if env vars are present
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

            // Generate unique numeric UID for Agora
            const agoraUid = Math.floor(Math.random() * 1000000) + 100000;
            console.log('[STREAMING] Generated Agora UID:', agoraUid);

            // Create local A/V tracks before joining
            console.log('[STREAMING] Creating local tracks...');
            const [audioTrack, videoTrack] = await Promise.all([
                AgoraRTC.createMicrophoneAudioTrack(),
                AgoraRTC.createCameraVideoTrack()
            ]);

            // Store tracks first
            setLocalTracks({ audioTrack, videoTrack });

            // Join with numeric UID
            await client.join(appId, channelName, null, agoraUid);
            console.log('[STREAMING] Teacher joined channel with Agora UID:', agoraUid);

            // Set user role attribute - must be set before publishing
            await client.setClientRole("host");

            // Store both Firebase UID and Agora UID
            setTeacherUid({
                firebaseUid: user.id,
                agoraUid: agoraUid
            });

            // Event handlers for student connections
            client.on('user-joined', (user) => {
                console.log('[STREAMING] Student joined:', user.uid);
            });

            client.on('user-left', (user) => {
                console.log('[STREAMING] Student left:', user.uid);
            });

            // Publish tracks after joining and setting role
            try {
                await client.publish([audioTrack, videoTrack]);
                console.log('[STREAMING] Published teacher audio+video tracks successfully');
            } catch (error) {
                console.error('[STREAMING] Error publishing tracks:', error);
                throw error;
            }

            // Play local video preview
            if (videoTrack && localVideoRef.current) {
                console.log('[STREAMING] Playing local video preview');
                videoTrack.play(localVideoRef.current);
            }

        } catch (err) {
            console.error('[STREAMING] ERROR in initializeAgora =>', err);
            await cleanup();
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Add effect to handle local video playback
    useEffect(() => {
        if (localTracks.videoTrack && localVideoRef.current) {
            console.log('[STREAMING] Playing local video track in useEffect');
            localTracks.videoTrack.play(localVideoRef.current);
        }
    }, [localTracks.videoTrack]);

    const handleUserLeft = (user) => {
        console.log('[STREAMING] user-left =>', user.uid);
        if (user.uid) {
            setRemoteUsers((prev) => {
                const newState = { ...prev };
                delete newState[user.uid];
                return newState;
            });
        }
    };

    const handleUserJoined = (user) => {
        console.log('[STREAMING] user-joined =>', user.uid);
        // Don't add users to remoteUsers until they publish tracks
        // This prevents phantom users from appearing
    };

    const handleUserPublished = async (user, mediaType) => {
        console.log('[STREAMING] user-published =>', user.uid, mediaType);
        
        if (!agoraClient) {
            console.log('[STREAMING] No agoraClient yet, ignoring');
            return;
        }

        try {
            await agoraClient.subscribe(user, mediaType);
            console.log('[STREAMING] Subscribed => user:', user.uid, 'mediaType:', mediaType);

            setRemoteUsers((prev) => {
                const existing = prev[user.uid] || { 
                    id: user.uid, 
                    displayName: `Student ${user.uid}`, 
                    hasAudio: false, 
                    hasVideo: false, 
                    videoTrack: null, 
                    audioTrack: null 
                };
                
                const updated = { ...existing };
                if (mediaType === 'video' && user.videoTrack) {
                    updated.videoTrack = user.videoTrack;
                    updated.hasVideo = true;
                }
                if (mediaType === 'audio' && user.audioTrack) {
                    updated.audioTrack = user.audioTrack;
                    updated.hasAudio = true;
                    user.audioTrack.play();
                }
                return { ...prev, [user.uid]: updated };
            });

            if (mediaType === 'video' && user.videoTrack && remoteVideosRef.current[user.uid]) {
                user.videoTrack.play(remoteVideosRef.current[user.uid]);
            }

        } catch (err) {
            console.error('[STREAMING] Error subscribing =>', err);
        }
    };

    const handleUserUnpublished = (user, mediaType) => {
        console.log('[STREAMING] user-unpublished =>', user.uid, mediaType);
        setRemoteUsers((prev) => {
            const updated = { ...prev };
            if (updated[user.uid]) {
                if (mediaType === 'audio') {
                    updated[user.uid].hasAudio = false;
                    updated[user.uid].audioTrack = null;
                }
                if (mediaType === 'video') {
                    updated[user.uid].hasVideo = false;
                    updated[user.uid].videoTrack = null;
                }
                // Remove user completely if they have no audio and no video
                if (!updated[user.uid].hasAudio && !updated[user.uid].hasVideo) {
                    delete updated[user.uid];
                }
            }
            return updated;
        });
    };

    // Cleanup
    const cleanup = async () => {
        if (cleanupInProgressRef.current) {
            console.log('[STREAMING] Cleanup already in progress, skipping');
            return;
        }
        cleanupInProgressRef.current = true;
        console.log('[STREAMING] >>> cleanup() called');
        try {
            // Stop local A/V
            for (const track of Object.values(localTracks)) {
                if (track) {
                    try { track.stop(); track.close(); } catch { }
                }
            }

            // Stop screen
            if (screenTrack) {
                try { screenTrack.stop(); screenTrack.close(); } catch { }
            }

            // Leave channel
            if (agoraClient && joinedRef.current) {
                console.log('[STREAMING] teacher leaving the channel...');
                await agoraClient.leave();
                agoraClient.removeAllListeners();
            }

        } catch (err) {
            console.error('[STREAMING] Cleanup error =>', err);
        } finally {
            setAgoraClient(null);
            setLocalTracks({ audioTrack: null, videoTrack: null });
            setScreenTrack(null);
            setRemoteUsers({});
            setTeacherUid(null);
            joinedRef.current = false;
            cleanupInProgressRef.current = false;
            console.log('[STREAMING] Cleanup finished');
            if (!window.location.pathname.includes('/dashboard') && !isAuthenticated) {
                navigate(`/${getCurrentLanguage()}/dashboard`);
            }
        }
    };

    // Toggles
    const toggleAudio = async () => {
        console.log('[STREAMING] Toggling audio. Current:', isAudioEnabled);
        if (localTracks.audioTrack) {
            await localTracks.audioTrack.setEnabled(!isAudioEnabled);
            setIsAudioEnabled((prev) => !prev);
        }
    };

    const toggleVideo = async () => {
        console.log('[STREAMING] Toggling video. Current:', isVideoEnabled);
        if (localTracks.videoTrack) {
            await localTracks.videoTrack.setEnabled(!isVideoEnabled);
            setIsVideoEnabled((prev) => !prev);
        }
    };

    const toggleScreenShare = async () => {
        console.log('[STREAMING] Toggling screen share. Currently isScreenSharing=', isScreenSharing);
        if (!isScreenSharing) {
            try {
                const screen = await AgoraRTC.createScreenVideoTrack();

                if (agoraClient && localTracks.videoTrack) {
                    await agoraClient.unpublish(localTracks.videoTrack);
                }
                if (agoraClient) {
                    await agoraClient.publish(screen);
                }
                setScreenTrack(screen);
                setIsScreenSharing(true);
            } catch (err) {
                console.error('[STREAMING] Error sharing screen =>', err);
            }
        } else {
            if (screenTrack && agoraClient) {
                try {
                    await agoraClient.unpublish(screenTrack);
                    screenTrack.stop();
                    screenTrack.close();
                } catch { }
                setScreenTrack(null);
                if (localTracks.videoTrack) {
                    await agoraClient.publish(localTracks.videoTrack);
                }
                setIsScreenSharing(false);
            }
        }
    };

    const togglePresentationMode = () => {
        console.log('[STREAMING] Toggling presentation. Current:', isPresentationMode);
        setIsPresentationMode(!isPresentationMode);
    };

    const toggleQuestionMode = () => {
        console.log('[STREAMING] Toggling Q&A. Current:', isQuestionMode);
        setIsQuestionMode(!isQuestionMode);
    };

    const sendMessage = () => {
        if (newMessage.trim()) {
            const msgObj = { id: Date.now(), sender: user, content: newMessage, timestamp: new Date() };
            setMessages((old) => [...old, msgObj]);
            setNewMessage('');
        }
    };

    const handleEndClass = async () => {
        console.log('[STREAMING] handleEndClass => navigating away after cleanup');
        await cleanup();
        navigate(`/${getCurrentLanguage()}/teacher/dashboard`);
    };

    const renderVideoContainer = (isLocal, uid, ref, participant = {}) => {
        const { hasAudio, hasVideo } = participant;
        return (
            <Box sx={{ position: 'relative', width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
                <Box ref={ref} sx={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#000' }} />
                {/* Info overlay */}
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Local track w/ video off => show teacher avatar */}
                    {isLocal && !isVideoEnabled && (
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>{user?.name?.[0] || 'T'}</Avatar>
                    )}
                    {/* Remote track w/ video off => show placeholder */}
                    {!isLocal && !hasVideo && (
                        <Avatar sx={{ width: 24, height: 24, bgcolor: '#666' }}>{String(uid).slice(-2)}</Avatar>
                    )}
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                        {isLocal ? `${user?.name || 'Teacher'} (You)` : remoteUsers[uid]?.displayName || `User #${uid}`}
                    </Typography>
                    {isLocal && !isAudioEnabled && (
                        <MicOffIcon sx={{ color: '#ff4d4f', fontSize: 16 }} />
                    )}
                    {!isLocal && (
                        <>
                            {hasVideo && <VideocamIcon sx={{ color: '#4caf50', fontSize: 16 }} />}
                            {hasAudio && <MicIcon sx={{ color: '#4caf50', fontSize: 16 }} />}
                        </>
                    )}
                </Box>
            </Box>
        );
    };

    // Render conditions
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
                {/* Video Grid */}
                <Box sx={{ height: '100%', p: 2, display: 'grid', gridTemplateColumns: isScreenSharing ? '1fr' : Object.keys(remoteUsers).length > 0 ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr', gap: 2, gridAutoRows: 'minmax(200px, 1fr)' }}>
                    {/* Teacher */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {renderVideoContainer(true, teacherUid, localVideoRef)}
                    </Box>

                    {/* Students */}
                    {Object.entries(remoteUsers).map(([uid, info]) => (
                        <Box key={uid} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {renderVideoContainer(
                                false,
                                uid,
                                (el) => { remoteVideosRef.current[uid] = el; },
                                info
                            )}
                        </Box>
                    ))}
                </Box>

                {/* Screen Sharing Overlay */}
                {isScreenSharing && screenTrack && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: '#000', zIndex: 10 }}>
                        {renderVideoContainer(true, 'screen', (el) => el && screenTrack.play(el), {})}
                    </Box>
                )}

                {/* Control Bar */}
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
                        alignItems: 'center',
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
                        <IconButton onClick={toggleScreenShare} sx={{ color: isScreenSharing ? '#ff4d4d' : '#fff' }}>
                            {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={isPresentationMode ? 'Exit Presentation' : 'Enter Presentation'}>
                        <IconButton onClick={togglePresentationMode} sx={{ color: isPresentationMode ? '#1890ff' : '#fff' }}>
                            <PresentIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={isQuestionMode ? 'End Q&A' : 'Start Q&A'}>
                        <IconButton onClick={toggleQuestionMode} sx={{ color: isQuestionMode ? '#1890ff' : '#fff' }}>
                            <QuestionIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Settings">
                        <IconButton onClick={() => setIsSettingsOpen(true)} sx={{ color: '#fff' }}>
                            <SettingsIcon />
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

                    <Button variant="contained" color="error" onClick={handleEndClass} startIcon={<CloseIcon />}>
                        End Class
                    </Button>
                </Box>
            </Box>

            {/* Chat Drawer */}
            <Drawer
                anchor="right"
                open={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                PaperProps={{ sx: { width: { xs: '100%', sm: 350 }, backgroundColor: '#1a1a1a', color: '#fff' } }}
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
                                    <Avatar sx={{ width: 24, height: 24 }}>{m?.sender?.name?.[0] || 'T'}</Avatar>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {m?.sender?.name || 'Teacher'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
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
                                    '&.Mui-focused fieldset': { borderColor: '#fff' },
                                },
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
                    sx: { 
                        width: { xs: '100%', sm: 350 }, 
                        backgroundColor: '#1a1a1a', 
                        color: '#fff' 
                    }
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ color: '#fff' }}>Participants</Typography>
                </Box>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                <List>
                    {Object.entries(remoteUsers).map(([uid, user]) => (
                        <ListItem key={`participant-${uid}`}>
                            <ListItemText 
                                primary={user.isTeacher ? 'Teacher (Host)' : `Student ${uid}`}
                                primaryTypographyProps={{ sx: { color: '#fff' } }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} PaperProps={{ sx: { bgcolor: '#1a1a1a', color: '#fff', minWidth: 320 } }}>
                <DialogTitle>Settings</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">Configure your audio/video devices here (TODO).</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsSettingsOpen(false)} sx={{ color: '#fff' }}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Streaming;