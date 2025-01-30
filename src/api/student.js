import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db, COLLECTIONS } from './config';

// Get active live classes for a student
export const getActiveLiveClasses = async (studentId) => {
  try {
    // Query active Daily.co rooms
    const q = query(
      collection(db, COLLECTIONS.DAILYCO_ROOMS),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().createdAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
  } catch (error) {
    console.error('Error fetching live classes:', error);
    throw error;
  }
};

// Get active Daily.co rooms
export const getActiveDailyRooms = async () => {
  try {
    const q = query(
      collection(db, COLLECTIONS.DAILYCO_ROOMS),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
  } catch (error) {
    console.error('Error fetching Daily.co rooms:', error);
    throw error;
  }
};

// Get a specific Daily.co room by ID
export const getDailyRoom = async (roomId) => {
  try {
    const roomRef = doc(db, COLLECTIONS.DAILYCO_ROOMS, roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomSnap.data();
    return {
      id: roomSnap.id,
      ...roomData,
      createdAt: roomData.createdAt?.toDate(),
      updatedAt: roomData.updatedAt?.toDate()
    };
  } catch (error) {
    console.error('Error fetching Daily.co room:', error);
    throw error;
  }
};
