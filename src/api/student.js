import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db, COLLECTIONS } from './config';

// Get active live classes for a student
export const getActiveLiveClasses = async (studentId) => {
  try {
    const now = Timestamp.now();
    
    // Query live classes that are:
    // 1. Currently active (status === 'active')
    // 2. Have started (startTime <= now)
    // 3. Haven't ended (endTime === null OR endTime > now)
    const q = query(
      collection(db, COLLECTIONS.LIVE_CLASSES),
      where('status', '==', 'active'),
      where('startTime', '<=', now),
      where('endTime', '==', null),
      orderBy('startTime', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const liveClasses = [];
    
    for (const doc of snapshot.docs) {
      const classData = {
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate(),
        // Ensure channelName is included in the returned data
        channelName: doc.data().channelName || `class_${doc.data().teacherId}_${doc.data().startTime?.toMillis()}`
      };
      
      // Convert Firestore Timestamp to Date
      if (classData.createdAt) {
        classData.createdAt = classData.createdAt.toDate();
      }
      if (classData.updatedAt) {
        classData.updatedAt = classData.updatedAt.toDate();
      }
      
      // Additional check to ensure the class is truly active
      if (!classData.endTime) {
        liveClasses.push(classData);
      }
    }
    
    return liveClasses;
  } catch (error) {
    console.error('Error fetching live classes:', error);
    throw error;
  }
}; 