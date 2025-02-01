import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { updateOnlineStatus, subscribeToUsersPresence } from '../api/presence';

export const usePresence = (userIds = []) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState({});
  const [loading, setLoading] = useState(true);

  // Update current user's online status
  useEffect(() => {
    if (!user?.id) return;

    // Set online when component mounts
    updateOnlineStatus(user.id, true);

    // Set up beforeunload handler
    const handleUnload = () => {
      updateOnlineStatus(user.id, false);
    };
    window.addEventListener('beforeunload', handleUnload);

    // Set offline when component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      updateOnlineStatus(user.id, false);
    };
  }, [user?.id]);

  // Subscribe to presence updates for specified users
  useEffect(() => {
    if (!userIds.length) return;

    setLoading(true);
    const unsubscribe = subscribeToUsersPresence(userIds, (users) => {
      setOnlineUsers(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userIds]);

  return {
    onlineUsers,
    loading,
    isOnline: (userId) => onlineUsers[userId]?.isOnline || false,
    lastSeen: (userId) => onlineUsers[userId]?.lastSeen
  };
}; 