import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit, getDoc, addDoc, where } from 'firebase/firestore';
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
export const getActivityLogs = async (limitCount = 100) => {
  try {
    const logsRef = collection(db, 'activityLogs');
    const q = query(
      logsRef,
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw new Error('Failed to fetch activity logs');
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
    const docSnapshot = await getDoc(settingsRef);
    return docSnapshot.exists() ? docSnapshot.data() : null;
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

// Student Dashboard Management
export const manageCourses = async (action, courseData) => {
  try {
    const coursesRef = collection(db, 'courses');
    if (action === 'create') {
      await addDoc(coursesRef, courseData);
    } else if (action === 'update') {
      await updateDoc(doc(coursesRef, courseData.id), courseData);
    } else if (action === 'delete') {
      await deleteDoc(doc(coursesRef, courseData.id));
    }
    return true;
  } catch (error) {
    console.error('Error managing courses:', error);
    throw error;
  }
};

export const manageAssignments = async (action, assignmentData) => {
  try {
    const assignmentsRef = collection(db, 'assignments');
    if (action === 'create') {
      await addDoc(assignmentsRef, assignmentData);
    } else if (action === 'update') {
      await updateDoc(doc(assignmentsRef, assignmentData.id), assignmentData);
    } else if (action === 'delete') {
      await deleteDoc(doc(assignmentsRef, assignmentData.id));
    }
    return true;
  } catch (error) {
    console.error('Error managing assignments:', error);
    throw error;
  }
};

export const getLiveClasses = async () => {
  try {
    const classesRef = collection(db, 'liveClasses');
    const snapshot = await getDocs(classesRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching live classes:', error);
    throw error;
  }
};

export const moderateLiveClass = async (classId, action) => {
  try {
    const classRef = doc(db, 'liveClasses', classId);
    if (action === 'end') {
      await updateDoc(classRef, { status: 'ended' });
    } else if (action === 'pause') {
      await updateDoc(classRef, { status: 'paused' });
    }
    return true;
  } catch (error) {
    console.error('Error moderating live class:', error);
    throw error;
  }
};

export const getStudentProgress = async (studentId) => {
  try {
    const progressRef = collection(db, 'studentProgress');
    const q = query(progressRef, where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching student progress:', error);
    throw error;
  }
};
