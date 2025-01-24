import { db, COLLECTIONS } from './config';
import { collection, doc, getDoc, getDocs, setDoc, query, where, orderBy, increment } from 'firebase/firestore';

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
    if (!userId || !assignmentId) {
      throw new Error('User ID and Assignment ID are required');
    }

    const submissionRef = doc(db, 'assignments', assignmentId, 'submissions', userId);
    
    // Check if submission already exists and its status
    const existingSubmission = await getDoc(submissionRef);
    if (existingSubmission.exists()) {
      const submissionData = existingSubmission.data();
      if (submissionData.status === 'graded') {
        throw new Error('This assignment has already been graded and cannot be resubmitted');
      } else {
        throw new Error('You have already submitted this assignment');
      }
    }

    const now = new Date();
    const submissionDoc = {
      studentId: userId,
      assignmentId,
      content: submissionData.content,
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
      createdAt: now,
      // Include metadata
      grade: null,
      feedback: '',
      gradedBy: null,
      gradedAt: null
    };

    await setDoc(submissionRef, submissionDoc);

    // Update the assignment document to track submission count
    const assignmentRef = doc(db, 'assignments', assignmentId);
    await setDoc(assignmentRef, {
      submissionCount: increment(1),
      lastSubmissionAt: now
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error submitting assignment:', error);
    // Return the specific error message for already submitted assignments
    if (error.message === 'You have already submitted this assignment') {
      throw error;
    }
    throw new Error('Failed to submit assignment');
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
      const data = submissionSnap.data();
      return {
        ...data,
        id: submissionSnap.id,
        submittedAt: data.submittedAt?.toDate() || null,
        updatedAt: data.updatedAt?.toDate() || null,
        gradedAt: data.gradedAt?.toDate() || null
      };
    }

    return {
      status: 'not_submitted',
      content: '',
      submittedAt: null,
      updatedAt: null,
      grade: null,
      feedback: '',
      gradedBy: null,
      gradedAt: null
    };
  } catch (err) {
    console.error('Error getting submission status:', err);
    throw new Error('Failed to get submission status');
  }
};

/**
 * Update assignment submission status
 */
export const updateAssignmentStatus = async (studentId, assignmentId, status, submissionData) => {
  try {
    return await submitAssignment(studentId, assignmentId, submissionData);
  } catch (err) {
    console.error('Error updating assignment status:', err);
    throw new Error('Failed to update assignment status');
  }
};
