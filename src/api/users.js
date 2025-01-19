import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './config';

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
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', userId), safeUserData);
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
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