import { db, COLLECTIONS } from './config';
import { collection, doc, getDoc, getDocs, setDoc, query, where, orderBy } from 'firebase/firestore';

/**
 * Get upcoming assignments for a user:
 * - We find all assignments that match the course IDs this user is enrolled in
 * - Filter by dueDate to show only upcoming ones
 */
export const getUpcomingAssignments = async (studentId, teacherId) => {
  try {
    const assignmentsRef = collection(db, COLLECTIONS.ASSIGNMENTS);
    let assignmentsQuery;

    if (teacherId) {
      assignmentsQuery = query(
        assignmentsRef,
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
      );
    } else {
      assignmentsQuery = query(
        assignmentsRef,
        orderBy('createdAt', 'desc')
      );
    }

    const assignmentsSnap = await getDocs(assignmentsQuery);
    const assignments = [];

    for (const doc of assignmentsSnap.docs) {
      assignments.push({
        id: doc.id,
        ...doc.data()
      });
    }

    return assignments;
  } catch (err) {
    console.error('Error getting upcoming assignments:', err);
    throw new Error('Failed to get upcoming assignments');
  }
};

/**
 * Submit an assignment. Creates or overwrites the submission document in the
 * submissions subcollection using userId as the document ID.
 */
export const submitAssignment = async (userId, assignmentId, submissionData) => {
  try {
    const submissionRef = doc(db, 'assignments', assignmentId, 'submissions', userId);
    await setDoc(submissionRef, {
      ...submissionData,
      submittedAt: new Date().toISOString(),
      status: 'submitted'
    });
    return true;
  } catch (error) {
    console.error('Error submitting assignment:', error);
    throw error;
  }
};

/**
 * Get submission status and details for a specific assignment
 */
export const getSubmissionStatus = async (studentId, assignmentId) => {
  try {
    if (!studentId || !assignmentId) {
      throw new Error('Student ID and Assignment ID are required');
    }
    
    const submissionRef = doc(db, 'assignments', assignmentId, 'submissions', studentId);
    const submissionSnap = await getDoc(submissionRef);

    if (submissionSnap.exists()) {
      return {
        ...submissionSnap.data(),
        id: submissionSnap.id
      };
    }

    return {
      status: 'not_submitted',
      content: '',
      submittedAt: null,
      grade: null
    };
  } catch (err) {
    console.error('Error getting submission status:', err);
    throw new Error('Failed to get submission status');
  }
};

export const updateAssignmentStatus = async (studentId, assignmentId, status, submissionData) => {
  try {
    if (!studentId || !assignmentId) {
      throw new Error('Student ID and Assignment ID are required');
    }

    const submissionRef = doc(db, 'assignments', assignmentId, 'submissions', studentId);
    
    await setDoc(submissionRef, {
      studentId,
      assignmentId,
      status,
      content: submissionData.content,
      submittedAt: submissionData.submittedAt,
      updatedAt: new Date(),
    }, { merge: true });

    return true;
  } catch (err) {
    console.error('Error updating assignment status:', err);
    throw new Error('Failed to update assignment status');
  }
};
