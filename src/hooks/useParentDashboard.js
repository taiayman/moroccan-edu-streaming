import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  getChildrenOverview,
  getChildrenAssignments,
  getChildPerformance,
  getChildSchedule,
  getChildLiveClasses,
  getParentNotifications
} from '../api/parent';

export const useParentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [children, setChildren] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childPerformance, setChildPerformance] = useState(null);
  const [childSchedule, setChildSchedule] = useState(null);
  const [liveClasses, setLiveClasses] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [childrenData, assignmentsData, notificationsData] = await Promise.all([
        getChildrenOverview(user.id),
        getChildrenAssignments(user.id),
        getParentNotifications(user.id)
      ]);

      setChildren(childrenData);
      setAssignments(assignmentsData);
      setNotifications(notificationsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async (childId) => {
    if (!childId) return;

    try {
      const [performance, schedule, classes] = await Promise.all([
        getChildPerformance(childId),
        getChildSchedule(childId),
        getChildLiveClasses(childId)
      ]);

      setChildPerformance(performance);
      setChildSchedule(schedule);
      setLiveClasses(classes);
      setError(null);
    } catch (err) {
      console.error('Error fetching child data:', err);
      setError('Failed to load child data');
    }
  };

  // Fetch initial dashboard data
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Fetch selected child's data
  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild.id);
    } else {
      setChildPerformance(null);
      setChildSchedule(null);
      setLiveClasses([]);
    }
  }, [selectedChild]);

  return {
    loading,
    error,
    children,
    assignments,
    notifications,
    selectedChild,
    childPerformance,
    childSchedule,
    liveClasses,
    setSelectedChild,
    refreshData: fetchDashboardData,
    refreshChildData: () => selectedChild && fetchChildData(selectedChild.id),
  };
};

export default useParentDashboard;
