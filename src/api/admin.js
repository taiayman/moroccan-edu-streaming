// src/api/admin.js
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// Users
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

// Activity Logs
export const getActivityLogs = async () => {
  try {
    const logsRef = collection(db, 'activityLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
};

// Analytics
export const getAnalyticsData = async () => {
  try {
    const analyticsRef = collection(db, 'analytics');
    const snapshot = await getDocs(analyticsRef);
    const data = {};
    snapshot.docs.forEach(doc => {
      data[doc.id] = doc.data();
    });
    return data;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

// Courses management
export const manageCourses = async (action, courseData) => {
  try {
    const coursesRef = collection(db, 'courses');
    if (action === 'read') {
      const snapshot = await getDocs(coursesRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else if (action === 'create') {
      const docRef = await addDoc(coursesRef, {
        ...courseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id };
    } else if (action === 'update') {
      const courseRef = doc(db, 'courses', courseData.id);
      await updateDoc(courseRef, { ...courseData, updatedAt: serverTimestamp() });
      return true;
    } else if (action === 'delete') {
      const courseRef = doc(db, 'courses', courseData.id);
      await deleteDoc(courseRef);
      return true;
    }
  } catch (error) {
    console.error('Error managing courses:', error);
    throw error;
  }
};

// Assignments management
export const manageAssignments = async (action, assignmentData) => {
  try {
    const assignmentsRef = collection(db, 'assignments');
    if (action === 'read') {
      const snapshot = await getDocs(assignmentsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else if (action === 'create') {
      const docRef = await addDoc(assignmentsRef, {
        ...assignmentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id };
    } else if (action === 'update') {
      const assignmentRef = doc(db, 'assignments', assignmentData.id);
      await updateDoc(assignmentRef, { ...assignmentData, updatedAt: serverTimestamp() });
      return true;
    } else if (action === 'delete') {
      const assignmentRef = doc(db, 'assignments', assignmentData.id);
      await deleteDoc(assignmentRef);
      return true;
    }
  } catch (error) {
    console.error('Error managing assignments:', error);
    throw error;
  }
};

// Live Classes
export const getLiveClasses = async () => {
  try {
    const classesRef = collection(db, 'liveClasses');
    const snapshot = await getDocs(classesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching live classes:', error);
    throw error;
  }
};

export const moderateLiveClass = async (classId, action) => {
  try {
    const classRef = doc(db, 'liveClasses', classId);
    let updateData = {};
    if (action === 'end') {
      updateData = { status: 'ended', endedAt: serverTimestamp() };
    } else if (action === 'pause') {
      updateData = { status: 'paused', updatedAt: serverTimestamp() };
    }
    await updateDoc(classRef, updateData);
    return true;
  } catch (error) {
    console.error('Error moderating live class:', error);
    throw error;
  }
};

// Student Progress
export const getStudentProgress = async (studentId) => {
  try {
    const progressRef = collection(db, 'studentProgress');
    const q = query(progressRef, where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching student progress:', error);
    throw error;
  }
};
