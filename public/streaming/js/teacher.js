// public/streaming/js/teacher.js
import CONFIG from './config.js';

// Remove the Firebase imports since we'll use the CDN version
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
let raisedHands = new Map();
let meetingFullyJoined = false;
let screenShareAvailable = false;

// Replace the ensureDailyLibraryLoaded function with this one
function ensureDailyLibraryLoaded() {
  return new Promise((resolve, reject) => {
    // If DailyIframe is already available, resolve immediately
    if (window.DailyIframe) {
      console.log('Daily.co library already loaded');
      return resolve(window.DailyIframe);
    }

    console.log('Attempting direct access to Daily.co library...');
    
    // Try to access the global variable after a short delay
    // This might work if the script is loaded but not yet initialized
    setTimeout(() => {
      if (window.DailyIframe) {
        console.log('Daily.co library found after delay');
        resolve(window.DailyIframe);
        return;
      }
      
      console.log('Loading specific version from CDN...');
      
      // If still not available, load it directly from a specific version CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@daily-co/daily-js@0.44.0/dist/daily-iframe.min.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Daily.co script loaded from alternate CDN');
        // Give time for initialization
        setTimeout(() => {
          if (window.DailyIframe) {
            console.log('DailyIframe is now available');
            resolve(window.DailyIframe);
          } else {
            console.error('Daily.co script loaded but DailyIframe is not available');
            reject(new Error('Daily.co library loaded but DailyIframe is not available'));
          }
        }, 1000);
      };
      
      script.onerror = (e) => {
        console.error('Error loading Daily.co script from alternate CDN:', e);
        reject(new Error('Failed to load Daily.co library from alternate CDN'));
      };
      
      document.body.appendChild(script);
    }, 500);
  });
}

async function createRoom(roomName) {
  try {
    console.log('Creating/checking room:', roomName);
    
    // First check if room exists
    let checkResponse;
    try {
      checkResponse = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CONFIG.DAILY.API_KEY}`
        }
      });
    } catch (networkError) {
      console.error('Network error checking room existence:', networkError);
      throw new Error(`Network error checking for room ${roomName}: ${networkError.message}`);
    }

    // If room exists, return its URL
    if (checkResponse.ok) {
      const room = await checkResponse.json();
      console.log('Room exists:', room);
      return `https://${CONFIG.DAILY.DOMAIN}/${roomName}`;
    }

    // If room doesn't exist (404), create it
    if (checkResponse.status === 404) {
      console.log('Room does not exist (404), creating it');
      let createResponse;
      try {
        createResponse = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.DAILY.API_KEY}`
          },
          body: JSON.stringify({
            name: roomName,
            privacy: 'public',
            properties: {
              enable_network_ui: false,
              enable_chat: true,
              enable_screenshare: true,
              enable_prejoin_ui: false,
              start_video_off: false,
              start_audio_off: false,
              exp: Math.round(Date.now() / 1000) + 24 * 60 * 60 // 24 hours from now
            }
          })
        });
      } catch (networkError) {
        console.error('Network error creating room:', networkError);
        throw new Error(`Network error creating room ${roomName}: ${networkError.message}`);
      }

      if (!createResponse.ok) {
        let errorData;
        try {
          errorData = await createResponse.json();
        } catch (parseError) {
          errorData = { error: `Failed to parse error response (Status: ${createResponse.status})` };
        }
        console.error('Failed to create room:', errorData);
        throw new Error(errorData.error || `Failed to create room (Status: ${createResponse.status})`);
      }

      const room = await createResponse.json();
      console.log('Room created:', room);
      return `https://${CONFIG.DAILY.DOMAIN}/${roomName}`;

    } else {
      // Handle other non-ok statuses from the initial check
      let errorData;
      try {
        errorData = await checkResponse.json();
      } catch (parseError) {
         errorData = { error: `Failed to parse error response (Status: ${checkResponse.status})` };
      }
      console.error('Error checking room existence:', errorData);
      throw new Error(errorData.error || `Failed to check room existence (Status: ${checkResponse.status})`);
    }

  } catch (error) {
    // Re-throw the error to be caught by initializeDaily
    console.error('Error in createRoom function:', error);
    throw error; // Propagate the specific error
    // DO NOT return a fallback URL here anymore
  }
}

// Add a global loading timeout
let initializationTimeout;

async function initializeDaily() {
  // Set a global timeout for the entire initialization process
  initializationTimeout = setTimeout(() => {
    console.error('Initialization timed out after 30 seconds');
    showError('Connection timed out. Please reload the page to try again.');
    // Add a retry button to the error message
    const errorEl = document.getElementById('streamError');
    if (errorEl) {
      errorEl.innerHTML = `
        Connection timed out. 
        <button 
          onclick="window.location.reload()" 
          style="background: white; color: #dc2626; border: none; padding: 5px 10px; margin-left: 10px; border-radius: 4px; cursor: pointer;"
        >
          Retry
        </button>
      `;
    }
  }, 30000); // 30 seconds timeout
  
  try {
    const roomName = window.DAILY_PARAMS.ROOM_NAME;
    
    if (!roomName) {
      clearTimeout(initializationTimeout);
      throw new Error('Room name is required');
    }

    console.log('Starting initialization for room:', roomName);
    updateConnectionStatus('connecting');
    
    // Ensure Daily.co library is loaded before using it
    console.log('Waiting for Daily.co library to load...');
    try {
      await ensureDailyLibraryLoaded();
      console.log('Daily.co library loaded successfully');
    } catch (error) {
      console.error('Failed to load Daily.co library:', error);
      clearTimeout(initializationTimeout);
      throw error;
    }

    // Create Daily iframe first
    console.log('Creating Daily iframe');
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
    
    console.log('Daily iframe created');

    // Add event listeners
    console.log('Adding event listeners');
    callFrame
      .on('joining-meeting', handleJoiningMeeting)
      .on('joined-meeting', handleJoinedMeeting)
      .on('participant-joined', handleParticipantJoined)
      .on('participant-left', handleParticipantLeft)
      .on('track-started', handleTrackStarted)
      .on('track-stopped', handleTrackStopped)
      .on('app-message', handleAppMessage)
      .on('error', handleError);

    // Get room URL and join
    console.log('Getting room URL');
    const roomUrl = await createRoom(roomName);
    console.log('Joining room:', roomUrl);
    
    await callFrame.join({
      url: roomUrl,
      showLeaveButton: false
    });
    
    console.log('Successfully joined room');

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

  } catch (error) {
    clearTimeout(initializationTimeout);
    console.error('Daily initialization failed:', error);
    showError('Failed to join room: ' + (error.message || 'Unknown error'));
    
    // Add a retry button to the error message
    const errorEl = document.getElementById('streamError');
    if (errorEl) {
      errorEl.innerHTML = `
        Failed to join room: ${error.message || 'Unknown error'} 
        <button 
          onclick="window.retryConnection()" 
          style="background: white; color: #dc2626; border: none; padding: 5px 10px; margin-left: 10px; border-radius: 4px; cursor: pointer;"
        >
          Retry
        </button>
      `;
    }
  }
}

// Event handlers
function handleJoiningMeeting(event) {
  console.log('Joining meeting:', event);
  updateConnectionStatus('connecting');
}

function handleJoinedMeeting(event) {
  clearTimeout(initializationTimeout); 
  console.log('Joined meeting:', event);
  meetingFullyJoined = true;
  updateParticipantsList();
  updateMediaControlsState();

  // Add media state change listeners
  callFrame
    .on('participant-updated', handleParticipantUpdated)
    .on('track-started', handleTrackStarted)
    .on('track-stopped', handleTrackStopped);
}

function handleParticipantJoined(event) {
  console.log('Participant joined:', event.participant);
  updateParticipantsList();
  notifyParticipantChange('joined', event.participant.user_name);
}

function handleParticipantLeft(event) {
  console.log('Participant left:', event.participant);
  raisedHands.delete(event.participant.session_id);
  updateParticipantsList();
  updateRaisedHandsList();
  notifyParticipantChange('left', event.participant.user_name);
}

function handleTrackStarted(event) {
  console.log('Track started:', event);
  updateParticipantsList();
}

function handleTrackStopped(event) {
  console.log('Track stopped:', event);
  updateParticipantsList();
}

function handleParticipantUpdated(event) {
  console.log('Participant updated:', event);
  updateParticipantsList();
}

function handleAppMessage(event) {
  const { data, participantId } = event;
  if (data.type === 'hand-raised') {
    const participant = callFrame.participants()[participantId];
    if (participant && !participant.local) {
      if (data.raised) {
        raisedHands.set(participantId, data);
        showNotification(`${data.userName || 'A student'} raised their hand`);
        const raisedHandsContainer = document.getElementById('handRaises');
        if (raisedHandsContainer) {
          raisedHandsContainer.style.display = 'block';
          raisedHandsContainer.classList.add('pulse');
          setTimeout(() => raisedHandsContainer.classList.remove('pulse'), 500);
        }
      } else {
        raisedHands.delete(participantId);
      }
      updateRaisedHandsList();
      updateParticipantsList();
    }
  }
}

function handleError(error) {
  console.error('Daily error:', error);
  showError(error.message || 'An error occurred');
  if (error.message?.includes('does not exist')) {
    setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const lang = urlParams.get('lang') || 'en';
      window.location.href = `/${lang}/teacher/dashboard`;
    }, 3000);
  }
}

// UI Updates
function updateConnectionStatus(status) {
  const statusEl = document.getElementById('connectionStatus');
  if (statusEl) {
    statusEl.className = `status-badge ${status === 'connected' ? 'connected' : ''}`;
    statusEl.innerHTML = status === 'connected' 
      ? '<i class="fas fa-check-circle"></i> Connected' 
      : '<i class="fas fa-circle-notch fa-spin"></i> Connecting...';
  }
}

function updateParticipantsList() {
  if (!callFrame) {
    console.warn('Attempted to update participants list, but callFrame is not initialized');
    return;
  }
  
  try {
    const participants = callFrame.participants();
    const listEl = document.getElementById('participantsList');
    const countEl = document.getElementById('participantCount');
    
    if (listEl) {
      const participantCount = Object.keys(participants).length;
      countEl.textContent = `${participantCount} ${participantCount === 1 ? 'Participant' : 'Participants'}`;

      listEl.innerHTML = Object.values(participants)
        .map(participant => {
          const isLocal = participant.local;
          const hasAudio = participant.audio;
          const hasVideo = participant.video;
          const isScreenSharing = participant.screen;
          const hasHandRaised = raisedHands.has(participant.session_id);

          return `
            <div class="participant-card">
              <div class="participant-info">
                <div class="participant-avatar" style="background: ${getAvatarColor(participant.user_name)}">
                  ${participant.user_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div class="participant-details">
                  <div class="participant-name">
                    ${participant.user_name || 'Anonymous'}
                    ${isLocal ? ' (You)' : ''}
                  </div>
                  ${isLocal ? '<div class="participant-role">Teacher</div>' : ''}
                </div>
              </div>
              <div class="participant-controls">
                <i class="fas ${hasAudio ? 'fa-microphone' : 'fa-microphone-slash'} ${hasAudio ? '' : 'text-red-500'}"></i>
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
          .participant-details {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
          .participant-name {
            font-weight: 500;
          }
          .participant-role {
            font-size: 0.75rem;
            color: var(--text-secondary);
          }
          .text-red-500 {
            color: #ef4444;
          }
          .text-blue-400 {
            color: #60a5fa;
          }
          .text-yellow-400 {
            color: #facc15;
          }
        `;
        document.head.appendChild(style);
      }
    }
  } catch (error) {
    console.error('Error updating participants list:', error);
  }
}

function updateRaisedHandsList() {
  const handRaisesContainer = document.getElementById('handRaises');
  const raisedHandsList = document.getElementById('raisedHandsList');
  const countEl = document.getElementById('raisedHandCount');

  if (!handRaisesContainer || !raisedHandsList || !countEl) return;

  if (raisedHands.size > 0) {
    handRaisesContainer.style.display = 'block';
    handRaisesContainer.classList.add('active');
    countEl.textContent = raisedHands.size;

    raisedHandsList.innerHTML = Array.from(raisedHands.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp) // Sort by timestamp
      .map(([participantId, data]) => `
        <div class="hand-raise-item">
          <div class="participant-info">
            <div class="participant-avatar" style="background: ${getAvatarColor(data.userName)}">
              ${data.userName?.[0]?.toUpperCase() || '?'}
            </div>
            <span>${data.userName || 'Anonymous'}</span>
          </div>
          <button 
            onclick="acknowledgeHand('${participantId}')"
            class="acknowledge-btn"
          >
            <i class="fas fa-check"></i>
            <span>Acknowledge</span>
          </button>
        </div>
      `)
      .join('');
  } else {
    handRaisesContainer.style.display = 'none';
    handRaisesContainer.classList.remove('active');
    countEl.textContent = '0';
    raisedHandsList.innerHTML = '';
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

// Media Controls
function setupControlListeners() {
  document.getElementById('toggleAudioBtn')?.addEventListener('click', toggleAudio);
  document.getElementById('toggleVideoBtn')?.addEventListener('click', toggleVideo);
  document.getElementById('toggleScreenShareBtn')?.addEventListener('click', toggleScreenShare);
  document.getElementById('chatBtn')?.addEventListener('click', openChat);
  document.getElementById('endStreamBtn')?.addEventListener('click', endStream);

  // Make acknowledgeHand available globally for the onclick handlers
  window.acknowledgeHand = acknowledgeHand;
}

function openChat() {
  if (!callFrame) {
    console.error('Cannot open chat, callFrame is not initialized');
    showError('Chat is not available yet. Please wait for the connection to establish.');
    return;
  }

  const roomName = window.DAILY_PARAMS.ROOM_NAME;
  const participants = callFrame.participants();
  const localParticipant = Object.values(participants).find(p => p.local);
  const teacherName = localParticipant?.user_name || 'Teacher';
  
  const chatWindow = window.open(
    `chat.html?room=${encodeURIComponent(roomName)}&userName=${encodeURIComponent(teacherName)}&sessionId=${encodeURIComponent(localParticipant?.session_id || '')}&isTeacher=true`,
    'ChatWindow',
    'width=400,height=600,resizable=yes'
  );

  // Handle chat window state for button toggle
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.classList.add('active');
    
    const checkWindow = setInterval(() => {
      if (chatWindow.closed) {
        chatBtn.classList.remove('active');
        clearInterval(checkWindow);
      }
    }, 1000);
  }
}

function updateScreenShareButton(isAvailable) {
  const btn = document.getElementById('toggleScreenShareBtn');
  if (btn) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    if (isAvailable && !isMobile) {
      btn.style.display = 'flex';
      btn.title = 'Share Screen';
    } else {
      btn.style.display = 'none';
      btn.title = isMobile ? 'Screen sharing not available on mobile' : 'Screen sharing not available';
    }
  }
}

// Add resize listener to handle screen share button visibility
window.addEventListener('resize', () => {
  if (screenShareAvailable) {
    updateScreenShareButton(true);
  }
});

async function toggleAudio() {
  if (!callFrame) {
    console.error('Cannot toggle audio, callFrame is not initialized');
    showError('Audio controls are not available yet. Please wait for the connection to establish.');
    return;
  }

  try {
    const enabled = !callFrame.localAudio();
    await callFrame.setLocalAudio(enabled);
    updateControlState('toggleAudioBtn', enabled);
    const icon = document.querySelector('#toggleAudioBtn i');
    icon.className = enabled ? 'fas fa-microphone' : 'fas fa-microphone-slash';
    updateParticipantsList(); // Update the participants list to reflect the change
  } catch (error) {
    console.error('Failed to toggle audio:', error);
    showError('Failed to toggle audio: ' + error.message);
  }
}

async function toggleVideo() {
  if (!callFrame) {
    console.error('Cannot toggle video, callFrame is not initialized');
    showError('Video controls are not available yet. Please wait for the connection to establish.');
    return;
  }

  try {
    const enabled = !callFrame.localVideo();
    await callFrame.setLocalVideo(enabled);
    updateControlState('toggleVideoBtn', enabled);
    const icon = document.querySelector('#toggleVideoBtn i');
    icon.className = enabled ? 'fas fa-video' : 'fas fa-video-slash';
    updateParticipantsList(); // Update the participants list to reflect the change
  } catch (error) {
    console.error('Failed to toggle video:', error);
    showError('Failed to toggle video: ' + error.message);
  }
}

async function toggleScreenShare() {
  if (!callFrame) {
    console.error('Cannot toggle screen share, callFrame is not initialized');
    showError('Screen sharing is not available yet. Please wait for the connection to establish.');
    return;
  }

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

function updateControlState(btnId, isActive) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.toggle('active', isActive);
  }
}

function updateMediaControlsState() {
  if (!callFrame) {
    console.warn('Attempted to update media controls, but callFrame is not initialized');
    return;
  }

  if (callFrame && meetingFullyJoined) {
    try {
      const audioEnabled = callFrame.localAudio();
      const videoEnabled = callFrame.localVideo();
      
      updateControlState('toggleAudioBtn', audioEnabled);
      updateControlState('toggleVideoBtn', videoEnabled);
      
      const audioIcon = document.querySelector('#toggleAudioBtn i');
      const videoIcon = document.querySelector('#toggleVideoBtn i');
      
      if (audioIcon) audioIcon.className = audioEnabled ? 'fas fa-microphone' : 'fas fa-microphone-slash';
      if (videoIcon) videoIcon.className = videoEnabled ? 'fas fa-video' : 'fas fa-video-slash';
      
      updateParticipantsList(); // Update the participants list to reflect current state
    } catch (error) {
      console.error('Error updating media controls state:', error);
    }
  }
}

async function acknowledgeHand(participantId) {
  try {
    const roomId = window.DAILY_PARAMS.ROOM_NAME;
    const handRaiseRef = database.ref(`rooms/${roomId}/handRaises/${participantId}`);
    
    // Remove the hand raise from Firebase
    await handRaiseRef.remove();
    
    // Update local state
    raisedHands.delete(participantId);
    updateRaisedHandsList();
    updateParticipantsList();
    
  } catch (error) {
    console.error('Error acknowledging hand:', error);
    showError('Failed to acknowledge hand raise');
  }
}

async function endStream() {
  if (!callFrame) {
    console.error('Cannot end stream, callFrame is not initialized');
    showError('Cannot end stream, connection not established');
    
    // Fallback to redirect
    setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const lang = urlParams.get('lang') || 'en'; 
      window.location.href = `/${lang}/teacher/dashboard`;
    }, 2000);
    
    return;
  }
  
  try {
    // Notify all participants
    const participants = callFrame.participants();
    Object.keys(participants).forEach(participantId => {
      if (!participants[participantId].local) {
        callFrame.sendAppMessage({ type: 'meeting-ended' }, participantId);
      }
    });

    // Wait briefly for messages to be sent
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await callFrame.leave();
    
    // Get the language parameter from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang') || 'en'; // Default to 'en' if not specified
    window.location.href = `/${lang}/teacher/dashboard`;
  } catch (error) {
    console.error('Error ending stream:', error);
    showError('Failed to end stream properly. Redirecting...');
    
    // Fallback to redirect
    setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const lang = urlParams.get('lang') || 'en'; 
      window.location.href = `/${lang}/teacher/dashboard`;
    }, 2000);
  }
}

// Notifications
function showNotification(message) {
  console.log('Notification:', message);
  const notification = document.createElement('div');
  notification.className = 'status-badge connected';
  notification.style.right = '1rem';
  notification.style.left = 'auto';
  notification.innerHTML = `
    <i class="fas fa-info-circle"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(notification);
  
  // Add fade out animation
  notification.style.animation = 'fadeIn 0.3s ease, fadeOut 0.3s ease forwards';
  notification.style.animationDelay = '0s, 2700ms';
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function notifyParticipantChange(action, username) {
  const message = action === 'joined' 
    ? `${username || 'Someone'} joined the room`
    : `${username || 'Someone'} left the room`;
  showNotification(message);
}

// Error handling
function showError(message) {
  console.error('Error:', message);
  const errorEl = document.getElementById('streamError');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }
}

// Add new styles for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
  }
  
  .text-emerald-400 {
    color: #34d399;
  }

  .status-badge {
    z-index: 1000;
  }
`;
document.head.appendChild(style);

// Add a connection status indicator if it doesn't exist
function ensureConnectionStatus() {
  if (!document.getElementById('connectionStatus')) {
    const statusEl = document.createElement('div');
    statusEl.id = 'connectionStatus';
    statusEl.className = 'status-badge';
    statusEl.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Connecting...';
    document.body.appendChild(statusEl);
  }
}

window.retryConnection = function() {
  // Clear any existing timeout
  if (initializationTimeout) {
    clearTimeout(initializationTimeout);
  }
  
  // Hide any error message
  const errorEl = document.getElementById('streamError');
  if (errorEl) {
    errorEl.style.display = 'none';
  }
  
  // Show connecting status
  updateConnectionStatus('connecting');
  
  // Reinitialize
  initializeDaily();
};

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async () => {
  ensureConnectionStatus();
  
  // Initialize Firebase first
  const firebaseInitialized = initializeFirebase();
  
  // Then initialize Daily
  try {
    if (firebaseInitialized) {
      await initializeDaily();
    } else {
      showError('Failed to initialize Firebase. Some features may not work properly.');
      await initializeDaily();
    }
  } catch (error) {
    console.error('Initialization failed:', error);
    showError('Failed to initialize: ' + error.message);
  }
});

// Update the setupHandRaiseListeners function to be more resilient
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

    const handRaisesRef = database.ref(`rooms/${roomName}/handRaises`);
    
    // Remove any existing listeners
    handRaisesRef.off();
    
    // Set up new listener
    handRaisesRef.on('value', (snapshot) => {
      const handRaises = snapshot.val() || {};
      
      // Clear existing raised hands
      raisedHands.clear();
      
      // Update raised hands map
      Object.entries(handRaises).forEach(([participantId, data]) => {
        if (data.raised) {
          raisedHands.set(participantId, data);
        }
      });
      
      // Update UI
      updateRaisedHandsList();
      updateParticipantsList();
    });
  } catch (error) {
    console.error('Failed to setup hand raise listeners:', error);
    showError('Failed to initialize hand raise feature');
  }
}