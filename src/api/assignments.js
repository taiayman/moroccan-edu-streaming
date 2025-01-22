import { db } from './config';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';

/**
 * Get upcoming assignments for a user:
 * - We find all assignments that match the course IDs this user is enrolled in
 * - Filter by dueDate to show only upcoming ones
 */
export const getUpcomingAssignments = async (userId) => {
  try {
    const enrollmentsRef = collection(db, 'users', userId, 'enrollments');
    const enrollmentsSnap = await getDocs(enrollmentsRef);

    if (enrollmentsSnap.empty) return [];  

    const courseIds = enrollmentsSnap.docs.map((docSnap) => docSnap.id);

    const assignmentsRef = collection(db, 'assignments');
    const assignmentsSnap = await getDocs(assignmentsRef);
    const now = new Date();

    const upcoming = [];
    assignmentsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (courseIds.includes(data.courseId)) {
        // Compare dates properly
        const dueDate = new Date(data.dueDate);
        if (dueDate > now) {
          upcoming.push({ id: docSnap.id, ...data });
        }
      }
    });

    return upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  } catch (error) {
    console.error('Error fetching upcoming assignments:', error);
    throw error;
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
export const getSubmissionStatus = async (userId, assignmentId) => {
  try {
    const submissionRef = doc(db, 'assignments', assignmentId, 'submissions', userId);
    const submissionSnap = await getDoc(submissionRef);
    
    if (!submissionSnap.exists()) {
      return { status: 'not_submitted' };
    }

    return submissionSnap.data();
  } catch (error) {
    console.error('Error fetching submission status:', error);
    throw error;
  }
};

export const updateAssignmentStatus = async (userId, assignmentId, newStatus) => {
  try {
    // For now, we'll simulate an API call with a delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real application, this would be an API call to update the status
    // Example API call:
    // const response = await fetch(`/api/assignments/${assignmentId}/status`, {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ userId, status: newStatus }),
    // });
    // return response.json();

    // For now, just return a success response
    return {
      success: true,
      message: 'Status updated successfully'
    };
  } catch (error) {
    console.error('Error updating assignment status:', error);
    throw new Error('Failed to update assignment status');
  }
};
