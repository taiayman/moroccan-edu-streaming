import { doc, setDoc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from './config';

import authService from './auth';

export const toggleProStatus = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const newProStatus = !userData.isPro;
    
    await updateDoc(userRef, {
      isPro: newProStatus
    });

    // Refresh the user data in auth context and local storage
    const updatedUserData = await authService.refreshUserData(userId);
    return updatedUserData;
    
  } catch (error) {
    console.error('Error toggling pro status:', error);
    throw error;
  }
};

export const createUserProfile = async (userId, userData) => {
  try {
    if (!userId || !userData) {
      throw new Error('Invalid user data provided');
    }

    const safeUserData = {
      email: userData.email || '',
      role: userData.role || 'student',
      displayName: userData.displayName || 'User',
      firstName: userData.firstName || 'User',
      lastName: userData.lastName || '',
      phoneNumber: userData.phoneNumber || '',
      createdAt: new Date().toISOString(),
      isPro: false // Default to free account
    };

    await setDoc(doc(db, 'users', userId), safeUserData);
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, updateData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!updateData || typeof updateData !== 'object') {
      throw new Error('Invalid update data provided');
    }

    const safeUpdateData = {};
    // Only allow specific fields to be updated
    if ('displayName' in updateData) {
      safeUpdateData.displayName = updateData.displayName;
    }

    if (Object.keys(safeUpdateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Update in Firestore
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, safeUpdateData);

    // Update Firebase Auth profile if displayName is provided
    if (updateData.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: updateData.displayName
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const verifyUserRole = async (userId, requestedRole) => {
  try {
    if (!userId || !requestedRole) {
      throw new Error('User ID and role are required');
    }

    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }
    if (userProfile.role !== requestedRole) {
      throw new Error(`Access denied. You are registered as a ${userProfile.role}, not as a ${requestedRole}.`);
    }
    return userProfile;
  } catch (error) {
    console.error('Error verifying user role:', error);
    throw error;
  }
};

export const getDashboardStats = async (userId) => {
  try {
    // 1) Get user enrollments
    const enrollmentsRef = collection(db, 'users', userId, 'enrollments');
    const enrollmentsSnap = await getDocs(enrollmentsRef);

    const totalCourses = enrollmentsSnap.size;
    let sumProgress = 0;

    for (const enrollmentDoc of enrollmentsSnap.docs) {
      const { progress = 0 } = enrollmentDoc.data();
      sumProgress += progress;
    }
    const avgProgress = totalCourses > 0 ? Math.floor(sumProgress / totalCourses) : 0;

    // 2) Get upcoming assignments
    const assignmentsRef = collection(db, 'assignments');
    const assignmentsSnap = await getDocs(assignmentsRef);

    const courseIds = enrollmentsSnap.docs.map(docSnap => docSnap.id);
    const now = new Date();
    let upcomingCount = 0;

    assignmentsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (courseIds.includes(data.courseId)) {
        const dueDate = new Date(data.dueDate);
        if (dueDate > now) {
          upcomingCount += 1;
        }
      }
    });

    return {
      totalCourses,
      avgProgress,
      upcomingCount,
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};
