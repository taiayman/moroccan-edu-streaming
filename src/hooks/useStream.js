import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  selectPeers, 
  selectLocalPeer,
  selectIsConnectedToRoom,
  selectRoomState
} from '@100mslive/hms-video-store';
import * as streamingService from '../api/streaming';
import { useAuth } from './useAuth';

export const useStream = (roomId = null) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hmsStore, setHMSStore] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // Create a new streaming room
  const createRoom = useCallback(async (courseId, title) => {
    try {
      setLoading(true);
      setError(null);
      const roomData = await streamingService.createRoom(user.uid, courseId);
      const store = await streamingService.joinRoom(roomData.id, user.uid, 'host');
      setHMSStore(store);
      return roomData.id;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Join an existing room
  const joinRoom = useCallback(async (roomId) => {
    try {
      setLoading(true);
      setError(null);
      const store = await streamingService.joinRoom(roomId, user.uid);
      setHMSStore(store);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Leave the current room
  const leaveRoom = useCallback(async () => {
    try {
      await streamingService.leaveRoom();
      setHMSStore(null);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }, [navigate]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    try {
      const enabled = await streamingService.toggleAudio();
      setIsAudioEnabled(enabled);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      const enabled = await streamingService.toggleVideo();
      setIsVideoEnabled(enabled);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Get current participants
  const getParticipants = useCallback(() => {
    if (!hmsStore) return [];
    return hmsStore.getState(selectPeers);
  }, [hmsStore]);

  // Get local peer
  const getLocalPeer = useCallback(() => {
    if (!hmsStore) return null;
    return hmsStore.getState(selectLocalPeer);
  }, [hmsStore]);

  // Check if connected to room
  const isConnected = useCallback(() => {
    if (!hmsStore) return false;
    return hmsStore.getState(selectIsConnectedToRoom);
  }, [hmsStore]);

  // Get room state
  const getRoomState = useCallback(() => {
    if (!hmsStore) return null;
    return hmsStore.getState(selectRoomState);
  }, [hmsStore]);

  // Join room if roomId is provided
  useEffect(() => {
    if (roomId && user) {
      joinRoom(roomId);
    }
    // Cleanup
    return () => {
      if (hmsStore) {
        streamingService.leaveRoom();
      }
    };
  }, [roomId, user, joinRoom]);

  return {
    loading,
    error,
    isAudioEnabled,
    isVideoEnabled,
    hmsStore,
    getParticipants,
    getLocalPeer,
    isConnected,
    getRoomState,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo
  };
};

export default useStream;
