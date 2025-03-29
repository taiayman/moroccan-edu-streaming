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
    // Query active Daily.co rooms based on status
    const q = query(
      collection(db, COLLECTIONS.DAILYCO_ROOMS),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    // Get current time and define max class age (e.g., 2 hours)
    const now = new Date();
    const maxAgeMinutes = 120; 

    // Map documents and ensure startTime is a Date object
    const allActiveStatusClasses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Using createdAt as the effective start time
      startTime: doc.data().createdAt?.toDate(), 
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Filter based on time: Keep classes started within the last maxAgeMinutes
    const currentlyRelevantClasses = allActiveStatusClasses.filter(liveClass => {
      if (!liveClass.startTime || !(liveClass.startTime instanceof Date)) {
         console.warn(`Class ${liveClass.id} skipped due to invalid startTime:`, liveClass.startTime);
         return false; // Skip if no valid start time
      }

      // Calculate the time difference in milliseconds
      const timeDiff = now.getTime() - liveClass.startTime.getTime();
      
      // Keep class if it started within the maxAgeMinutes window and is not in the future
      const isWithinWindow = timeDiff >= 0 && timeDiff < maxAgeMinutes * 60 * 1000;
      if(!isWithinWindow) {
        console.log(`Class ${liveClass.id} filtered out. Start time: ${liveClass.startTime}, Now: ${now}, Diff (ms): ${timeDiff}`);
      }
      return isWithinWindow;
    });
    
    console.log(`Found ${allActiveStatusClasses.length} classes with 'active' status, returning ${currentlyRelevantClasses.length} relevant classes.`);
    return currentlyRelevantClasses;

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
