import { 
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { db, COLLECTIONS } from './config';

// Simplified createRoom function using only Firestore
export const createRoom = async (teacherId, classId) => {
  try {
    const roomRef = doc(collection(db, 'rooms'));
    await setDoc(roomRef, {
      teacherId,
      classId,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: roomRef.id };
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

// Simplified endLiveClass function
export const endLiveClass = async (roomId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      status: 'ended',
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error ending live class:', error);
    throw error;
  }
};
