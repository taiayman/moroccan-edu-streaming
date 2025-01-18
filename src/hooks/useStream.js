import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WebRTCService from '../api/streaming';
import { useAuth } from './useAuth';

export const useStream = (roomId = null) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [activeRooms, setActiveRooms] = useState([]);

  // Create a new streaming room
  const createRoom = useCallback(async (courseId, title) => {
    try {
      setLoading(true);
      setError(null);
      const { roomId, localStream, remoteStream } = await WebRTCService.createRoom(
        user.uid,
        courseId,
        title
      );
      setLocalStream(localStream);
      setRemoteStream(remoteStream);
      return roomId;
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
      const { localStream, remoteStream } = await WebRTCService.joinRoom(roomId);
      setLocalStream(localStream);
      setRemoteStream(remoteStream);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // End the current call
  const endCall = useCallback(async () => {
    try {
      await WebRTCService.endCall();
      setLocalStream(null);
      setRemoteStream(null);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }, [navigate]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    try {
      const isEnabled = await WebRTCService.toggleAudio();
      setIsAudioEnabled(isEnabled);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      const isEnabled = await WebRTCService.toggleVideo();
      setIsVideoEnabled(isEnabled);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Get active rooms for a course
  const getActiveRooms = useCallback(async (courseId) => {
    try {
      setLoading(true);
      setError(null);
      const rooms = await WebRTCService.getActiveRooms(courseId);
      setActiveRooms(rooms);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Join room if roomId is provided
  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
    }
    // Cleanup function
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, joinRoom, localStream]);

  return {
    loading,
    error,
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    activeRooms,
    createRoom,
    joinRoom,
    endCall,
    toggleAudio,
    toggleVideo,
    getActiveRooms
  };
};

export default useStream;
