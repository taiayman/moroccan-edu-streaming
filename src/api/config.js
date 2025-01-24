import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
    create: `${API_BASE_URL}/streaming/create`,
    join: `${API_BASE_URL}/streaming/join`,
    end: `${API_BASE_URL}/streaming/end`,
  },
  courses: {
    list: `${API_BASE_URL}/courses`,
    details: (id) => `${API_BASE_URL}/courses/${id}`,
  }
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};
