import {
  HMSReactiveStore,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectLocalPeer,
  selectPeers
} from '@100mslive/hms-video-store';
import { 
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  query,
  where,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, COLLECTIONS, HMS_CONFIG, getHMSHeaders } from './config';

const hmsManager = new HMSReactiveStore();
const hmsStore = hmsManager.getStore();
const hmsActions = hmsManager.getHMSActions();

// Create a room for live class
export const createRoom = async (teacherId, classId) => {
  try {
    // Create room using HMS API
    const headers = await getHMSHeaders();
    const response = await fetch('https://api.100ms.live/v2/rooms', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `Class-${classId}`,
        description: `Live class session for ${classId}`,
        template_id: HMS_CONFIG.templateId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create room');
    }

    const roomData = await response.json();

    // Store room details in Firestore
    const roomRef = doc(db, 'rooms', roomData.id);
    await setDoc(roomRef, {
      teacherId,
      classId,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return roomData;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

// Get management token for teacher
export const getManagementToken = async (roomId, userId, role = 'teacher') => {
  try {
    const token = await hmsActions.getAuthToken({
      roomId,
      userId,
      role: 'host',  // Teacher is always host in 100ms
      appId: HMS_CONFIG.appId,
      appSecret: HMS_CONFIG.appSecret
    });

    return token;
  } catch (error) {
    console.error('Error getting management token:', error);
    throw error;
  }
};

// Join a room
export const joinRoom = async (roomId, userId, role = 'student') => {
  try {
    // Get auth token
    const headers = await getHMSHeaders();
    const response = await fetch("https://api.100ms.live/v2/token", {
      method: 'POST',
      body: JSON.stringify({
        room_id: roomId,
        user_id: userId,
        role
      }),
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to get auth token');
    }

    const { token } = await response.json();

    // Join the room using HMS SDK
    await hmsActions.join({
      userName: userId,
      authToken: token,
      settings: {
        isAudioMuted: true,
        isVideoMuted: false
      }
    });

    return hmsStore;
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
};

// Join a live class (for students)
export const joinLiveClass = async (classId, userId, userName) => {
  try {
    // Get class details from Firestore
    const classRef = doc(db, COLLECTIONS.LIVE_CLASSES, classId);
    const classDoc = await getDoc(classRef);
    
    if (!classDoc.exists()) {
      throw new Error('Class not found');
    }

    const classData = classDoc.data();
    
    // Join the room using HMS SDK
    const store = await joinRoom(classData.roomId, userId, 'student');

    // Add student to participants list
    await updateDoc(classRef, {
      participants: arrayUnion({
        userId,
        userName,
        joinedAt: serverTimestamp()
      })
    });

    return {
      token: store.getState().tokenData.token,
      roomId: classData.roomId
    };
  } catch (error) {
    console.error('Error joining live class:', error);
    throw error;
  }
};

// Leave the room
export const leaveRoom = async () => {
  try {
    await hmsActions.leave();
  } catch (error) {
    console.error('Error leaving room:', error);
    throw error;
  }
};

// Toggle audio
export const toggleAudio = async () => {
  try {
    await hmsActions.setLocalAudioEnabled(
      !hmsStore.getState(selectIsLocalAudioEnabled)
    );
    return hmsStore.getState(selectIsLocalAudioEnabled);
  } catch (error) {
    console.error('Error toggling audio:', error);
    throw error;
  }
};

// Toggle video
export const toggleVideo = async () => {
  try {
    await hmsActions.setLocalVideoEnabled(
      !hmsStore.getState(selectIsLocalVideoEnabled)
    );
    return hmsStore.getState(selectIsLocalVideoEnabled);
  } catch (error) {
    console.error('Error toggling video:', error);
    throw error;
  }
};

// Get room participants
export const getRoomParticipants = () => {
  return hmsStore.getState(selectPeers);
};

// Get local participant
export const getLocalParticipant = () => {
  return hmsStore.getState(selectLocalPeer);
};

// End a live class
export const endLiveClass = async (classId, roomId) => {
  try {
    // Update room status in Firestore
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      status: 'ended',
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // End room in 100ms
    const headers = await getHMSHeaders();
    const response = await fetch(`https://api.100ms.live/v2/rooms/${roomId}/end`, {
      method: 'POST',
      headers
    });

    if (!response.ok) {
      throw new Error('Failed to end room');
    }

    await hmsActions.leave();
    return await response.json();
  } catch (error) {
    console.error('Error ending live class:', error);
    throw error;
  }
};

// Raise hand
export const raiseHand = async (roomId, userId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const raisedHandsRef = collection(roomRef, 'raisedHands');
    
    await addDoc(raisedHandsRef, {
      userId,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error raising hand:', error);
    throw error;
  }
};

// Lower hand
export const lowerHand = async (roomId, userId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const raisedHandsRef = collection(roomRef, 'raisedHands');
    const handDoc = await getDoc(doc(raisedHandsRef, userId));
    
    if (handDoc.exists()) {
      await deleteDoc(doc(raisedHandsRef, userId));
    }
  } catch (error) {
    console.error('Error lowering hand:', error);
    throw error;
  }
};

// Grant permission
export const grantPermission = async (roomId, userId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const permissionsRef = collection(roomRef, 'permissions');
    
    await addDoc(permissionsRef, {
      userId,
      granted: true,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error granting permission:', error);
    throw error;
  }
};

// Revoke permission
export const revokePermission = async (roomId, userId) => {
  try {
    const roomRef = doc(db, 'rooms', roomId);
    const permissionsRef = collection(roomRef, 'permissions');
    const permissionDoc = await getDoc(doc(permissionsRef, userId));
    
    if (permissionDoc.exists()) {
      await deleteDoc(doc(permissionsRef, userId));
    }
  } catch (error) {
    console.error('Error revoking permission:', error);
    throw error;
  }
};
