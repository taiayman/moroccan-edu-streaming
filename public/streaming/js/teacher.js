// public/streaming/js/teacher.js
import CONFIG from './config.js';

let callFrame = null;
let localTracks = {
  audioTrack: null,
  videoTrack: null,
  screenTrack: null
};

async function createRoom(roomName) {
  try {
    // Create a Daily.co room using their REST API
    const response = await fetch(`https://api.daily.co/v1/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.DAILY.API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create room');
    }

    const room = await response.json();
    return room.url;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
}

async function initializeDaily() {
  try {
    // Get room name from URL parameters
    const roomName = window.DAILY_PARAMS.ROOM_NAME;
    
    if (!roomName) {
      throw new Error('Room name is required');
    }

    // Create the room first
    const roomUrl = await createRoom(roomName);

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

    // Join the room using the created room URL
    await callFrame.join({
      url: roomUrl,
      showLeaveButton: false
    });

    // Update UI state
    updateConnectionStatus('connected');
    setupControlListeners();

  } catch (error) {
    console.error('Daily initialization failed:', error);
    showError('Failed to join room: ' + error.message);
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
  document.getElementById('toggleScreenShareBtn')?.addEventListener('click', toggleScreenShare);
  document.getElementById('endStreamBtn')?.addEventListener('click', endStream);
}

async function toggleAudio() {
  await callFrame.setLocalAudio(!callFrame.localAudio());
  updateControlState('toggleAudioBtn', callFrame.localAudio());
}

async function toggleVideo() {
  await callFrame.setLocalVideo(!callFrame.localVideo());
  updateControlState('toggleVideoBtn', callFrame.localVideo());
}

async function toggleScreenShare() {
  if (!callFrame.localScreenShare()) {
    await callFrame.startScreenShare();
  } else {
    await callFrame.stopScreenShare();
  }
  updateControlState('toggleScreenShareBtn', callFrame.localScreenShare());
}

function updateControlState(btnId, isActive) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.toggle('active', isActive);
  }
}

async function endStream() {
  if (callFrame) {
    await callFrame.leave();
    window.location.href = '/dashboard';
  }
}

// Error handling
function showError(message) {
  const errorEl = document.getElementById('streamError');
  if (errorEl) {
    errorEl.querySelector('p').textContent = message;
    errorEl.classList.remove('hidden');
  }
}

window.retryConnection = initializeDaily;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initializeDaily);