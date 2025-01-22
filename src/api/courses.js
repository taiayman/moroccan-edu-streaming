import { db } from './config';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

/**
 * Get the courses a user is enrolled in, using the user's enrollments subcollection.
 */
export const getEnrolledCourses = async (userId) => {
  try {
    const enrollmentsRef = collection(db, 'users', userId, 'enrollments');
    const snapshot = await getDocs(enrollmentsRef);

    const enrolledCourses = [];
    for (const docSnap of snapshot.docs) {
      const courseId = docSnap.id; // we used courseId as doc ID
      const courseRef = doc(db, 'courses', courseId);
      const courseDoc = await getDoc(courseRef);

      if (courseDoc.exists()) {
        enrolledCourses.push({ id: courseDoc.id, ...courseDoc.data() });
      }
    }

    return enrolledCourses;
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    throw error;
  }
};

/**
 * Get a user's progress for a single course or overall. 
 * This can read from the enrollments doc which includes progress field.
 */
export const getCourseProgress = async (userId, courseId) => {
  try {
    const enrollmentRef = doc(db, 'users', userId, 'enrollments', courseId);
    const enrollmentSnap = await getDoc(enrollmentRef);
    if (!enrollmentSnap.exists()) {
      return null;
    }

    const { progress } = enrollmentSnap.data();
    return progress; // e.g. 0-100
  } catch (error) {
    console.error('Error fetching course progress:', error);
    throw error;
  }
};
