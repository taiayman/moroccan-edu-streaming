import { db } from './config';
import { 
  doc, 
  setDoc, 
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

// Store for active listeners
const presenceListeners = new Map();

// Update user's online status
export const updateOnlineStatus = async (userId, isOnline) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error updating online status:', error);
  }
};

// Subscribe to online status changes for a group of users
export const subscribeToUsersPresence = (userIds, callback) => {
  // Create a unique key for this subscription
  const subscriptionKey = userIds.sort().join('-');

  // If we already have a listener for these users, don't create another one
  if (presenceListeners.has(subscriptionKey)) {
    return () => presenceListeners.get(subscriptionKey)();
  }

  // Create a query for these users
  const q = query(
    collection(db, 'users'),
    where('__name__', 'in', userIds)
  );

  // Set up the listener
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const users = {};
    snapshot.forEach((doc) => {
      users[doc.id] = {
        id: doc.id,
        ...doc.data(),
        isOnline: doc.data().isOnline || false,
        lastSeen: doc.data().lastSeen?.toDate()
      };
    });
    callback(users);
  }, (error) => {
    console.error('Error in presence subscription:', error);
  });

  // Store the unsubscribe function
  presenceListeners.set(subscriptionKey, unsubscribe);

  // Return unsubscribe function
  return () => {
    unsubscribe();
    presenceListeners.delete(subscriptionKey);
  };
};

// Get all online users
export const getOnlineUsers = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('isOnline', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastSeen: doc.data().lastSeen?.toDate()
    }));
  } catch (error) {
    console.error('Error getting online users:', error);
    return [];
  }
}; 