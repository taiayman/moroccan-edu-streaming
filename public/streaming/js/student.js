// public/streaming/js/student.js
import CONFIG from './config.js';

let callFrame = null;

async function initializeDaily() {
  try {
    // Get room name from URL parameters
    const roomName = window.DAILY_PARAMS.ROOM_NAME;
    
    if (!roomName) {
      throw new Error('Room name is required');
    }

    // Create Daily iframe
    callFrame = window.DailyIframe.createFrame(
      document.getElementById('localStream'),
      {
        showLeaveButton: false,
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
      .on('joined-meeting', handleJoinedMeeting)
      .on('participant-joined', handleParticipantJoined)
      .on('participant-left', handleParticipantLeft)
      .on('track-started', handleTrackStarted)
      .on('track-stopped', handleTrackStopped)
      .on('error', handleError);

    // Join the room using the correct Daily.co domain from config
    const roomUrl = `https://${CONFIG.DAILY.DOMAIN}/${roomName}`;
    console.log('Joining room with URL:', roomUrl);
    
    await callFrame.join({
      url: roomUrl,
      showLeaveButton: false
    });

    // Update UI state
    updateConnectionStatus('connected');
    setupControlListeners();

  } catch (error) {
    console.error('Daily initialization failed:', error);
    showError('Failed to join room: ' + (error.errorMsg || error.message));
  }
}

// Event handlers
function handleJoinedMeeting(event) {
  console.log('Joined meeting:', event);
  updateParticipantsList();
}

function handleParticipantJoined(event) {
  console.log('Participant joined:', event.participant);
  updateParticipantsList();
}

function handleParticipantLeft(event) {
  console.log('Participant left:', event.participant);
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

function handleError(error) {
  console.error('Daily error:', error);
  showError(error.message || 'An error occurred');
  // If room doesn't exist, redirect to dashboard
  if (error.message?.includes('does not exist')) {
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 3000);
  }
}

// UI Updates
function updateConnectionStatus(status) {
  const statusEl = document.getElementById('connectionStatus');
  if (statusEl) {
    statusEl.textContent = status;
    statusEl.className = `px-3 py-1 rounded-full text-sm ${
      status === 'connected' ? 'bg-green-800 text-green-200' : 'bg-gray-800 text-gray-300'
    }`;
  }
}

function updateParticipantsList() {
  const participants = callFrame.participants();
  const listEl = document.getElementById('participantsList');
  
  if (listEl) {
    listEl.innerHTML = Object.values(participants)
      .map(participant => `
        <div class="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              ${participant.user_name?.[0]?.toUpperCase() || '?'}
            </div>
            <span>${participant.user_name || 'Anonymous'}</span>
          </div>
          <div class="flex space-x-2">
            ${participant.audio ? '🎤' : ''}
            ${participant.video ? '📹' : ''}
          </div>
        </div>
      `)
      .join('');
  }
}

// Media Controls
function setupControlListeners() {
  document.getElementById('toggleAudioBtn')?.addEventListener('click', toggleAudio);
  document.getElementById('toggleVideoBtn')?.addEventListener('click', toggleVideo);
  document.getElementById('leaveBtn')?.addEventListener('click', leaveStream);
}

async function toggleAudio() {
  await callFrame.setLocalAudio(!callFrame.localAudio());
  updateControlState('toggleAudioBtn', callFrame.localAudio());
}

async function toggleVideo() {
  await callFrame.setLocalVideo(!callFrame.localVideo());
  updateControlState('toggleVideoBtn', callFrame.localVideo());
}

function updateControlState(btnId, isActive) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.toggle('active', isActive);
  }
}

async function leaveStream() {
  if (callFrame) {
    await callFrame.leave();
    window.location.href = '/dashboard';
  }
}

// Error handling
function showError(message) {
  console.error(message);
  // Create or update error display
  let errorEl = document.getElementById('streamError');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.id = 'streamError';
    errorEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #dc2626;
      color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      z-index: 50;
    `;
    document.body.appendChild(errorEl);
  }
  errorEl.textContent = message;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorEl.remove();
  }, 5000);
}

window.retryConnection = initializeDaily;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initializeDaily);
