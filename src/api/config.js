import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

export const ROLES = {
  STUDENT: 'student',
  PARENT: 'parent',
  TEACHER: 'teacher',
  ADMIN: 'admin'
};

export default {};
