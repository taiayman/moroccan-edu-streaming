// public/streaming/js/student.js
import CONFIG from './config.js';

// Firebase initialization
let database;
let app;

const firebaseConfig = {
  apiKey: "AIzaSyC6gdAOUcIA9w_KuCYXse6aCfZjqLYU71s",
  authDomain: "moroccan-platform-streaming.firebaseapp.com",
  databaseURL: "https://moroccan-platform-streaming-default-rtdb.firebaseio.com",
  projectId: "moroccan-platform-streaming",
  storageBucket: "moroccan-platform-streaming.firebasestorage.app",
  messagingSenderId: "785334032082",
  appId: "1:785334032082:web:07ed141b102ba995417f0b",
  measurementId: "G-K4YKPL8DBS"
};

// Initialize Firebase for streaming (will be called after Firebase SDK loads)
function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    try {
      app = firebase.app();
    } catch {
      app = firebase.initializeApp(firebaseConfig);
    }
    
    // Get database instance
    database = firebase.database();
    console.log('Firebase initialized successfully');
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    showError('Failed to initialize Firebase');
    return false;
  }
}

let callFrame = null;
let isHandRaised = false;
let meetingFullyJoined = false;
let currentUser = null;
let screenShareAvailable = false;

async function initializeDaily() {
  try {
    const roomName = window.DAILY_PARAMS.ROOM_NAME;
    
    if (!roomName) {
      throw new Error('Room name is required');
    }

    // Create Daily iframe with custom UI
    callFrame = window.DailyIframe.createFrame(
      document.getElementById('mainVideo'),
      {
        showLeaveButton: false,
        showFullscreenButton: false,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          zIndex: 1
        }
      }
    );

    // Add event listeners
    callFrame
      .on('joining-meeting', handleJoiningMeeting)
      .on('joined-meeting', handleJoinedMeeting)
      .on('participant-joined', handleParticipantJoined)
      .on('participant-left', handleParticipantLeft)
      .on('track-started', handleTrackStarted)
      .on('track-stopped', handleTrackStopped)
      .on('app-message', handleAppMessage)
      .on('error', handleError);

    // Join the room
    const roomUrl = `https://${CONFIG.DAILY.DOMAIN}/${roomName}`;
    console.log('Joining room with URL:', roomUrl);
    
    try {
      await callFrame.join({
        url: roomUrl,
        showLeaveButton: false
      });

      // Check if screen sharing is available after joining
      setTimeout(async () => {
        try {
          // Try to access screen share methods
          screenShareAvailable = typeof callFrame.startScreenShare === 'function';
          if (screenShareAvailable) {
            updateScreenShareButton(true);
          } else {
            updateScreenShareButton(false);
          }
        } catch (error) {
          console.log('Screen sharing not available:', error);
          updateScreenShareButton(false);
        }
      }, 2000);

      updateConnectionStatus('connected');
      setupControlListeners();

      // Add Firebase listeners after joining
      setupHandRaiseListeners();

    } catch (joinError) {
      if (joinError.message?.includes('Meeting has ended')) {
        showError('This class session has ended');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 3000);
        return;
      }
      throw joinError;
    }

  } catch (error) {
    console.error('Daily initialization failed:', error);
    showError('Failed to join room: ' + (error.errorMsg || error.message));
    if (error.message?.includes('does not exist')) {
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);
    }
  }
}

// Helper function to generate consistent avatar colors
function getAvatarColor(name) {
  const colors = [
    '#2563eb', // blue
    '#059669', // green
    '#7c3aed', // purple
    '#db2777', // pink
    '#ea580c', // orange
    '#0891b2', // cyan
  ];
  
  if (!name) return colors[0];
  
  // Generate a consistent index based on the name
  const index = Array.from(name.toLowerCase())
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  
  return colors[index];
}

// Event handlers
function handleJoiningMeeting(event) {
  console.log('Joining meeting:', event);
  updateConnectionStatus('connecting');
}

function handleJoinedMeeting(event) {
  console.log('Joined meeting:', event);
  meetingFullyJoined = true;
  
  // Add all event listeners for participant and media updates
  callFrame
    .on('participant-updated', handleParticipantUpdated)
    .on('track-started', handleTrackStarted)
    .on('track-stopped', handleTrackStopped)
    .on('active-speaker-change', handleActiveSpeakerChange)
    .on('network-quality-change', handleNetworkQualityChange);

  updateParticipantsList();
  updateMediaControlsState();
}

function handleParticipantJoined(event) {
  console.log('Participant joined:', event.participant);
  updateParticipantsList();
  if (event.participant.owner) {
    showNotification('Teacher joined the room');
  } else {
    notifyParticipantChange('joined', event.participant.user_name);
  }
}

function handleParticipantLeft(event) {
  console.log('Participant left:', event.participant);
  updateParticipantsList();
  if (event.participant.owner) {
    showNotification('Teacher left the room');
  } else {
    notifyParticipantChange('left', event.participant.user_name);
  }
}

function handleParticipantUpdated(event) {
  console.log('Participant updated:', event);
  // Immediately update UI when any participant's state changes
  updateParticipantsList();
}

function handleTrackStarted(event) {
  console.log('Track started:', event);
  updateParticipantsList();
}

function handleTrackStopped(event) {
  console.log('Track stopped:', event);
  updateParticipantsList();
}

function handleActiveSpeakerChange(event) {
  console.log('Active speaker changed:', event);
  updateParticipantsList();
}

function handleNetworkQualityChange(event) {
  console.log('Network quality changed:', event);
  updateParticipantsList();
}

function handleAppMessage(event) {
  const { data } = event;
  if (data.type === 'hand-acknowledgment' && data.acknowledged) {
    isHandRaised = false;
    updateHandRaiseState();
    showNotification('Teacher acknowledged your hand raise');
  } else if (data.type === 'meeting-ended') {
    showNotification('The teacher has ended the class');
    setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const lang = urlParams.get('lang') || 'en';
      window.location.href = `/${lang}/student/dashboard`;
    }, 3000);
  }
}

function handleError(error) {
  console.error('Daily error:', error);
  showError(error.message || 'An error occurred');
  if (error.message?.includes('does not exist')) {
    setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const lang = urlParams.get('lang') || 'en';
      window.location.href = `/${lang}/student/dashboard`;
    }, 3000);
  }
}

// UI Updates
function updateConnectionStatus(status) {
  const statusEl = document.getElementById('connectionStatus');
  if (statusEl) {
    statusEl.className = `status-badge ${status === 'connected' ? 'connected' : ''}`;
  }
}

function updateParticipantsList() {
  const participants = callFrame.participants();
  const listEl = document.getElementById('participantsList');
  
  if (listEl) {
    // Sort participants: teacher first, then local user, then others
    const sortedParticipants = Object.values(participants).sort((a, b) => {
      if (a.owner) return -1;
      if (b.owner) return 1;
      if (a.local) return -1;
      if (b.local) return 1;
      return 0;
    });

    listEl.innerHTML = sortedParticipants
      .map(participant => {
        const isLocal = participant.local;
        const isTeacher = participant.owner;
        const hasAudio = participant.audio;
        const hasVideo = participant.video;
        const isScreenSharing = participant.screen;
        const hasHandRaised = isLocal && isHandRaised;
        const isSpeaking = participant.speaking;
        const networkQuality = participant.networkQuality || 100;

        // Create participant card with media states
        return `
          <div class="participant-card ${isSpeaking ? 'speaking' : ''}" 
               data-participant-id="${participant.session_id}">
            <div class="participant-info">
              <div class="participant-avatar" style="background: ${getAvatarColor(participant.user_name)}">
                ${participant.user_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div class="participant-details">
                <div class="participant-name">
                  ${participant.user_name || 'Anonymous'}
                  ${isLocal ? ' (You)' : ''}
                  ${isTeacher ? ' (Teacher)' : ''}
                </div>
                <div class="participant-status">
                  ${networkQuality < 70 ? '<span class="network-warning">Poor Connection</span>' : ''}
                </div>
              </div>
            </div>
            <div class="participant-controls">
              <i class="fas ${hasAudio ? 'fa-microphone' : 'fa-microphone-slash'} ${hasAudio ? '' : 'text-red-500'} ${isSpeaking ? 'speaking' : ''}"></i>
              <i class="fas ${hasVideo ? 'fa-video' : 'fa-video-slash'} ${hasVideo ? '' : 'text-red-500'}"></i>
              ${isScreenSharing ? '<i class="fas fa-desktop text-blue-400"></i>' : ''}
              ${hasHandRaised ? '<i class="fas fa-hand text-yellow-400"></i>' : ''}
            </div>
          </div>
        `;
      })
      .join('');

    // Add styles for new elements if not already added
    if (!document.getElementById('participant-styles')) {
      const style = document.createElement('style');
      style.id = 'participant-styles';
      style.textContent = `
        .participant-card {
          transition: all 0.3s ease;
        }
        .participant-card.speaking {
          background: var(--surface);
          transform: scale(1.02);
        }
        .participant-controls i {
          transition: all 0.3s ease;
        }
        .participant-controls i.speaking {
          color: var(--success);
          animation: pulse 1s infinite;
        }
        .network-warning {
          font-size: 0.75rem;
          color: var(--warning);
        }
        .participant-status {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Media Controls
function setupControlListeners() {
  document.getElementById('toggleAudioBtn')?.addEventListener('click', toggleAudio);
  document.getElementById('toggleVideoBtn')?.addEventListener('click', toggleVideo);
  document.getElementById('raiseHandBtn')?.addEventListener('click', toggleRaiseHand);
  document.getElementById('leaveBtn')?.addEventListener('click', leaveStream);
  document.getElementById('toggleScreenShareBtn')?.addEventListener('click', toggleScreenShare);
}

async function toggleAudio() {
  try {
    const enabled = !callFrame.localAudio();
    await callFrame.setLocalAudio(enabled);
    updateControlState('toggleAudioBtn', enabled);
    const icon = document.querySelector('#toggleAudioBtn i');
    if (icon) {
      icon.className = enabled ? 'fas fa-microphone' : 'fas fa-microphone-slash';
    }
    // Force an immediate UI update
    updateParticipantsList();
  } catch (error) {
    showError('Failed to toggle audio: ' + error.message);
  }
}

async function toggleVideo() {
  try {
    const enabled = !callFrame.localVideo();
    await callFrame.setLocalVideo(enabled);
    updateControlState('toggleVideoBtn', enabled);
    const icon = document.querySelector('#toggleVideoBtn i');
    if (icon) {
      icon.className = enabled ? 'fas fa-video' : 'fas fa-video-slash';
    }
    // Force an immediate UI update
    updateParticipantsList();
  } catch (error) {
    showError('Failed to toggle video: ' + error.message);
  }
}

async function toggleRaiseHand() {
  try {
    if (!database) {
      if (!initializeFirebase()) {
        throw new Error('Firebase not initialized');
      }
    }

    if (!callFrame) {
      throw new Error('Meeting not initialized');
    }

    isHandRaised = !isHandRaised;
    const participants = callFrame.participants();
    const localParticipant = Object.values(participants).find(p => p.local);
    
    if (!localParticipant) {
      throw new Error('Local participant not found');
    }
    
    // Get the room ID from the URL
    const roomId = window.DAILY_PARAMS.ROOM_NAME;
    
    // Update hand raise status in Firebase
    const handRaiseRef = database.ref(`rooms/${roomId}/handRaises/${localParticipant.session_id}`);
    
    if (isHandRaised) {
      await handRaiseRef.set({
        userId: localParticipant.user_id,
        userName: localParticipant.user_name,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        raised: true,
        sessionId: localParticipant.session_id
      });
      showNotification('Hand raised');
    } else {
      await handRaiseRef.remove();
      showNotification('Hand lowered');
    }

    // Update UI
    updateHandRaiseState();
    
  } catch (error) {
    console.error('Error toggling hand raise:', error);
    showError('Failed to update hand raise status');
    // Reset state if Firebase update fails
    isHandRaised = !isHandRaised;
    updateHandRaiseState();
  }
}

function updateHandRaiseState() {
  const btn = document.getElementById('raiseHandBtn');
  if (btn) {
    btn.classList.toggle('active', isHandRaised);
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = isHandRaised ? 'fas fa-hand' : 'fas fa-hand';
    }
  }
  updateParticipantsList();
}

function updateControlState(btnId, isActive) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.toggle('active', isActive);
  }
}

function updateMediaControlsState() {
  if (callFrame && meetingFullyJoined) {
    const audioEnabled = callFrame.localAudio();
    const videoEnabled = callFrame.localVideo();
    
    updateControlState('toggleAudioBtn', audioEnabled);
    updateControlState('toggleVideoBtn', videoEnabled);
    
    const audioIcon = document.querySelector('#toggleAudioBtn i');
    const videoIcon = document.querySelector('#toggleVideoBtn i');
    
    if (audioIcon) {
      audioIcon.className = audioEnabled ? 'fas fa-microphone' : 'fas fa-microphone-slash';
    }
    if (videoIcon) {
      videoIcon.className = videoEnabled ? 'fas fa-video' : 'fas fa-video-slash';
    }
    
    // Force an immediate UI update
    updateParticipantsList();
  }
}

async function leaveStream() {
  if (callFrame) {
    await callFrame.leave();
    // Get the language parameter from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang') || 'en'; // Default to 'en' if not specified
    window.location.href = `/${lang}/student/dashboard`;
  }
}

// Notifications
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'status-badge connected';
  notification.style.right = '1rem';
  notification.style.left = 'auto';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, CONFIG.UI.NOTIFICATIONS.DURATION);
}

function notifyParticipantChange(action, username) {
  const message = action === 'joined' 
    ? `${username || 'Someone'} joined the room`
    : `${username || 'Someone'} left the room`;
  showNotification(message);
}

// Error handling
function showError(message) {
  console.error(message);
  const errorEl = document.getElementById('streamError');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }
}

// Toggle sidebar for mobile view
window.toggleSidebar = function() {
  document.getElementById('sidebar').classList.toggle('open');
};

window.retryConnection = initializeDaily;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Firebase first
  const firebaseInitialized = initializeFirebase();
  
  // Then initialize Daily
  if (firebaseInitialized) {
    await initializeDaily();
  } else {
    showError('Failed to initialize Firebase. Some features may not work properly.');
    await initializeDaily();
  }
});

// Add Firebase hand raise handling
function setupHandRaiseListeners() {
  try {
    const roomName = window.DAILY_PARAMS.ROOM_NAME;
    if (!roomName) {
      throw new Error('Room name is required for hand raise listeners');
    }

    if (!database) {
      // Try to initialize Firebase again if database is not available
      if (!initializeFirebase()) {
        throw new Error('Firebase database not initialized and could not be initialized');
      }
    }

    if (!callFrame) {
      throw new Error('Meeting not initialized');
    }

    const participants = callFrame.participants();
    const localParticipant = Object.values(participants).find(p => p.local);
    
    if (!localParticipant) {
      throw new Error('Local participant not found');
    }

    const handRaisesRef = database.ref(`rooms/${roomName}/handRaises/${localParticipant.session_id}`);
    
    // Remove any existing listeners
    handRaisesRef.off();
    
    // Set up new listener to sync our state with Firebase
    handRaisesRef.on('value', (snapshot) => {
      const data = snapshot.val();
      isHandRaised = data?.raised || false;
      updateHandRaiseState();
    });

  } catch (error) {
    console.error('Failed to setup hand raise listeners:', error);
    showError('Failed to initialize hand raise feature');
  }
}

function updateScreenShareButton(isAvailable) {
  const btn = document.getElementById('toggleScreenShareBtn');
  if (btn) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isAvailable && !isMobile) {
      btn.style.display = 'flex';
      btn.title = 'Share Screen';
    } else {
      btn.style.display = 'none';
      btn.title = isMobile ? 'Screen sharing not available on mobile' : 'Screen sharing not available';
    }
  }
}

async function toggleScreenShare() {
  try {
    // Check if screen sharing is supported
    if (!screenShareAvailable) {
      throw new Error('Screen sharing is not available on this device or browser');
    }

    // Check if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      throw new Error('Screen sharing is not supported on mobile devices');
    }

    // Check current screen sharing state
    const participants = callFrame.participants();
    const localParticipant = Object.values(participants).find(p => p.local);
    const isSharing = localParticipant?.screen || false;

    if (!isSharing) {
      await callFrame.startScreenShare({
        quality: 'high',
        layout: {
          preset: 'presentationLarge'
        }
      });
      updateControlState('toggleScreenShareBtn', true);
    } else {
      await callFrame.stopScreenShare();
      updateControlState('toggleScreenShareBtn', false);
    }
  } catch (error) {
    console.error('Screen share error:', error);
    showError('Failed to toggle screen share: ' + error.message);
    updateControlState('toggleScreenShareBtn', false);
  }
}
