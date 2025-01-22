import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit, getDoc } from 'firebase/firestore';
import { db } from './config';

// User Management
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, userData);
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Activity Monitoring
export const getActivityLogs = async (limit = 100) => {
  try {
    const logsRef = collection(db, 'activityLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(limit));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
};

// System Settings
export const updateSystemSettings = async (settings) => {
  try {
    const settingsRef = doc(db, 'systemSettings', 'general');
    await updateDoc(settingsRef, settings);
    return true;
  } catch (error) {
    console.error('Error updating system settings:', error);
    throw error;
  }
};

export const getSystemSettings = async () => {
  try {
    const settingsRef = doc(db, 'systemSettings', 'general');
    const doc = await getDoc(settingsRef);
    return doc.exists() ? doc.data() : null;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    throw error;
  }
};

// Analytics Data
export const getAnalyticsData = async () => {
  try {
    const analyticsRef = collection(db, 'analytics');
    const snapshot = await getDocs(analyticsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};