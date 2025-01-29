import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import axios from 'axios';

const firebaseConfig = {
  apiKey: "AIzaSyC6gdAOUcIA9w_KuCYXse6aCfZjqLYU71s",
  authDomain: "moroccan-platform-streaming.firebaseapp.com",
  projectId: "moroccan-platform-streaming",
  storageBucket: "moroccan-platform-streaming.firebasestorage.app",
  messagingSenderId: "785334032082",
  appId: "1:785334032082:web:07ed141b102ba995417f0b",
  measurementId: "G-K4YKPL8DBS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence only enabled in one tab.');
  } else if (err.code === 'unimplemented') {
    console.warn('Current browser doesn\'t support persistence.');
  }
});

// Constants
export const ROLES = {
  STUDENT: 'student',
  PARENT: 'parent',
  TEACHER: 'teacher',
  ADMIN: 'admin'
};

// Collections names
export const COLLECTIONS = {
  LESSONS: 'lessons',
  SCHEDULES: 'schedules',
  LIVE_CLASSES: 'liveClasses',
  QUESTIONS: 'questions',
  MESSAGES: 'messages',
  ASSIGNMENTS: 'assignments',
  USERS: 'users',
  CALENDAR_EVENTS: 'calendar_events',
  CALENDAR_NOTES: 'calendar_notes'
};

// API endpoints configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const endpoints = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    logout: `${API_BASE_URL}/auth/logout`,
  },
  streaming: {
    // 100ms API endpoints
    rooms: 'https://api.100ms.live/v2/rooms',
    sessions: 'https://api.100ms.live/v2/sessions',
    tokens: 'https://api.100ms.live/v2/tokens',
    recordings: 'https://api.100ms.live/v2/recordings',
    activeRooms: 'https://api.100ms.live/v2/active-rooms',
    peers: 'https://api.100ms.live/v2/peers'
  },
  courses: {
    list: `${API_BASE_URL}/courses`,
    details: (id) => `${API_BASE_URL}/courses/${id}`,
  }
};

// Add 100ms configuration
export const HMS_CONFIG = {
  tokenEndpoint: 'https://api.100ms.live/v2/tokens',
  // Add your 100ms credentials here
  appId: process.env.REACT_APP_HMS_APP_ID,
  appSecret: process.env.REACT_APP_HMS_APP_SECRET,
  templateId: process.env.REACT_APP_HMS_TEMPLATE_ID,
  meetingUrl: process.env.REACT_APP_HMS_MEETING_URL || 'https://your-app-domain.com/meeting'
};

// Export HMS endpoints separately for better organization
export const HMS_ENDPOINTS = {
  rooms: endpoints.streaming.rooms,
  sessions: endpoints.streaming.sessions,
  tokens: endpoints.streaming.tokens,
  recordings: endpoints.streaming.recordings,
  activePeers: endpoints.streaming.activeRooms,
  peers: endpoints.streaming.peers
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Add 100ms auth headers
export const getHMSHeaders = async () => {
  try {
    // Get management token
    const response = await axios.post('https://api.100ms.live/v2/token/management', {
      access_key: HMS_CONFIG.appId,
      type: 'management',
      role: 'admin'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${HMS_CONFIG.appId}:${HMS_CONFIG.appSecret}`)}`
      }
    });

    return {
      'Authorization': `Bearer ${response.data.token}`,
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('Error getting management token:', error);
    throw error;
  }
};
