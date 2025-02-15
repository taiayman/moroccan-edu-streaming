import { collection, doc, getDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from './config';

// Get overview of all children for a parent
export const getChildrenOverview = async (parentId) => {
  try {
    const childrenRef = collection(db, COLLECTIONS.STUDENTS);
    const q = query(childrenRef, where('parentId', '==', parentId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching children overview:', error);
    throw error;
  }
};

// Get children's assignments
export const getChildrenAssignments = async (parentId) => {
  try {
    // First get children IDs
    const children = await getChildrenOverview(parentId);
    const childrenIds = children.map(child => child.id);
    
    // Then get assignments for all children
    const assignmentsRef = collection(db, COLLECTIONS.ASSIGNMENTS);
    const q = query(assignmentsRef, where('studentId', 'in', childrenIds));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      childName: children.find(child => child.id === doc.data().studentId)?.name
    }));
  } catch (error) {
    console.error('Error fetching children assignments:', error);
    throw error;
  }
};

// Get performance metrics for a specific child
export const getChildPerformance = async (childId) => {
  try {
    const childRef = doc(db, COLLECTIONS.STUDENTS, childId);
    const childDoc = await getDoc(childRef);
    
    if (!childDoc.exists()) {
      throw new Error('Child not found');
    }
    
    // Get attendance, assignments completion, and overall performance
    const performance = childDoc.data().performance || {
      attendance: 0,
      assignments: 0,
      overall: 0
    };
    
    return performance;
  } catch (error) {
    console.error('Error fetching child performance:', error);
    throw error;
  }
};

// Get child's schedule
export const getChildSchedule = async (childId) => {
  try {
    const scheduleRef = collection(db, COLLECTIONS.SCHEDULE);
    const q = query(scheduleRef, where('studentId', '==', childId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching child schedule:', error);
    throw error;
  }
};

// Get child's live classes
export const getChildLiveClasses = async (childId) => {
  try {
    const liveClassesRef = collection(db, COLLECTIONS.LIVE_CLASSES);
    const q = query(liveClassesRef, where('studentIds', 'array-contains', childId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching child live classes:', error);
    throw error;
  }
};

// Get notifications for parent (assignments due, grades, etc.)
export const getParentNotifications = async (parentId) => {
  try {
    const children = await getChildrenOverview(parentId);
    const childrenIds = children.map(child => child.id);
    
    // Get recent assignments and activities
    const [assignments, activities] = await Promise.all([
      getChildrenAssignments(parentId),
      getChildrenActivities(childrenIds)
    ]);
    
    // Combine and sort by date
    const notifications = [
      ...assignments.map(a => ({
        type: 'assignment',
        date: a.dueDate,
        ...a
      })),
      ...activities.map(a => ({
        type: 'activity',
        date: a.timestamp,
        ...a
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return notifications;
  } catch (error) {
    console.error('Error fetching parent notifications:', error);
    throw error;
  }
};

// Helper function to get children's activities
const getChildrenActivities = async (childrenIds) => {
  try {
    const activitiesRef = collection(db, COLLECTIONS.ACTIVITIES);
    const q = query(activitiesRef, where('studentId', 'in', childrenIds));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching children activities:', error);
    throw error;
  }
};

// Update parent preferences
export const updateParentPreferences = async (parentId, preferences) => {
  try {
    const parentRef = doc(db, COLLECTIONS.USERS, parentId);
    await updateDoc(parentRef, { preferences });
    return { success: true };
  } catch (error) {
    console.error('Error updating parent preferences:', error);
    throw error;
  }
};
