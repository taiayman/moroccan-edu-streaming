import axios from 'axios';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  Timestamp,
  orderBy,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  limit,
  addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, COLLECTIONS } from './config';
import { generateToken } from '../utils/agora';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Get teacher's courses
export const getTeacherCourses = async (teacherId) => {
  try {
    // TODO: Replace with actual API call
    // const response = await axios.get(`${API_BASE_URL}/teachers/${teacherId}/courses`);
    // return response.data;
    
    // Mock data for development
    return [
      {
        id: 1,
        title: 'Mathematics 101',
        description: 'Introduction to Calculus',
        level: 'intermediate',
        schedule: [
          { day: 'Monday', time: '10:00' },
          { day: 'Wednesday', time: '14:00' }
        ],
        enrolledStudents: Array(25).fill().map((_, i) => ({
          id: i + 1,
          name: `Student ${i + 1}`
        }))
      },
      {
        id: 2,
        title: 'Advanced Algebra',
        description: 'Complex algebraic concepts',
        level: 'advanced',
        schedule: [
          { day: 'Tuesday', time: '11:00' },
          { day: 'Thursday', time: '15:00' }
        ],
        enrolledStudents: Array(20).fill().map((_, i) => ({
          id: i + 1,
          name: `Student ${i + 1}`
        }))
      }
    ];
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    throw error;
  }
};

// Get teacher's assignments with submission details
export const getTeacherAssignments = async (teacherId) => {
  try {
    if (!teacherId) {
      console.error('No teacherId provided to getTeacherAssignments');
      throw new Error('Teacher ID is required');
    }

    console.log('Fetching assignments for teacher:', teacherId);
    
    const q = query(
      collection(db, COLLECTIONS.ASSIGNMENTS),
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const assignments = [];

    // Get submissions for each assignment
    for (const doc of snapshot.docs) {
      const assignmentData = doc.data();
      const submissionsQuery = collection(db, 'assignments', doc.id, 'submissions');
      const submissionsSnapshot = await getDocs(submissionsQuery);
      
      const submissions = submissionsSnapshot.docs.map(subDoc => ({
        id: subDoc.id,
        ...subDoc.data()
      }));

      assignments.push({
        id: doc.id,
        ...assignmentData,
        submissions,
        submissionCount: submissions.length,
        lastSubmission: submissions.length > 0
          ? submissions.reduce((latest, sub) =>
              latest.submittedAt > sub.submittedAt ? latest : sub
            ).submittedAt
          : null
      });
    }

    console.log('Fetched assignments with submissions:', assignments);
    return assignments;
  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    throw error;
  }
};

// Get detailed submission information for a specific assignment
export const getAssignmentSubmissions = async (assignmentId) => {
  try {
    if (!assignmentId) {
      throw new Error('Assignment ID is required');
    }

    const submissionsRef = collection(db, 'assignments', assignmentId, 'submissions');
    const submissionsSnap = await getDocs(submissionsRef);
    
    const submissions = [];
    for (const doc of submissionsSnap.docs) {
      const submissionData = doc.data();
      // Get student details
      const studentRef = doc(db, COLLECTIONS.USERS, submissionData.studentId);
      const studentSnap = await getDoc(studentRef);
      
      submissions.push({
        id: doc.id,
        ...submissionData,
        student: studentSnap.exists() ? {
          id: studentSnap.id,
          ...studentSnap.data()
        } : null
      });
    }

    // Sort by submission date
    submissions.sort((a, b) => b.submittedAt - a.submittedAt);
    
    return submissions;
  } catch (error) {
    console.error('Error fetching assignment submissions:', error);
    throw error;
  }
};

// Grade a submission
export const gradeSubmission = async (assignmentId, submissionId, gradeData) => {
  try {
    const submissionRef = doc(db, 'assignments', assignmentId, 'submissions', submissionId);
    await updateDoc(submissionRef, {
      grade: gradeData.grade,
      feedback: gradeData.feedback,
      gradedBy: gradeData.teacherId,
      gradedAt: serverTimestamp(),
      status: 'graded'
    });

    return true;
  } catch (error) {
    console.error('Error grading submission:', error);
    throw error;
  }
};

// Get teacher's students
export const getTeacherStudents = async (teacherId) => {
  try {
    // TODO: Replace with actual API call
    // const response = await axios.get(`${API_BASE_URL}/teachers/${teacherId}/students`);
    // return response.data;
    
    // Mock data for development
    return Array(45).fill().map((_, i) => ({
      id: i + 1,
      name: `Student ${i + 1}`,
      email: `student${i + 1}@example.com`,
      progress: Math.floor(Math.random() * 100),
      enrolledCourses: Math.floor(Math.random() * 3) + 1
    }));
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    throw error;
  }
};

// Create new course
export const createNewCourse = async (courseData) => {
  try {
    // TODO: Replace with actual API call
    // const response = await axios.post(`${API_BASE_URL}/courses`, courseData);
    // return response.data;
    
    // Mock response for development
    return {
      id: Math.floor(Math.random() * 1000),
      ...courseData,
      createdAt: new Date().toISOString(),
      enrolledStudents: []
    };
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

// Create new assignment
export const createNewAssignment = async (assignmentData) => {
  try {
    const assignmentRef = doc(collection(db, COLLECTIONS.ASSIGNMENTS));
    await setDoc(assignmentRef, {
      ...assignmentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active',
      submittedCount: 0,
      totalStudents: 0,
      submissions: []
    });
    return assignmentRef.id;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
};

// Save a lesson plan with documents
export const saveLessonPlan = async (teacherId, lessonData, files = []) => {
  try {
    const lessonRef = doc(collection(db, COLLECTIONS.LESSONS));
    
    // Upload attached files
    const uploadedFiles = await Promise.all(files.map(async (file) => {
      const fileRef = ref(storage, `lessons/${lessonRef.id}/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      return { name: file.name, url, type: file.type };
    }));

    // Save lesson data
    await setDoc(lessonRef, {
      ...lessonData,
      teacherId,
      files: uploadedFiles,
      status: 'pending',
      createdAt: Timestamp.now(),
      weekStartDate: Timestamp.fromDate(new Date(lessonData.weekStartDate))
    });

    return lessonRef.id;
  } catch (error) {
    console.error('Error saving lesson:', error);
    throw error;
  }
};

// Get teacher's lessons
export const getTeacherLessons = async (teacherId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.LESSONS),
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting lessons:', error);
    throw error;
  }
};

// Start a live class
export const startLiveClass = async (teacherId, classData) => {
  try {
    // Generate a unique channel name
    const channelName = `class_${teacherId}_${Date.now()}`;
    
    // Generate Agora token for the host
    const token = await generateToken(channelName, 'host');

    // Create the live class document
    const docRef = await addDoc(collection(db, COLLECTIONS.LIVE_CLASSES), {
      ...classData,
      channelName,
      token,
      status: 'active',
      startTime: serverTimestamp(),
      endTime: null,
      participants: [],
      teacherId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      classId: docRef.id,
      channelName,
      token
    };
  } catch (error) {
    console.error('Error starting live class:', error);
    throw error;
  }
};

// End a live class
export const endLiveClass = async (classId) => {
  try {
    const classRef = doc(db, COLLECTIONS.LIVE_CLASSES, classId);
    await updateDoc(classRef, {
      status: 'ended',
      endedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error ending class:', error);
    throw error;
  }
};

// Listen to student questions in real-time
export const subscribeToQuestions = (classId, callback) => {
  const q = query(
    collection(db, COLLECTIONS.LIVE_CLASSES, classId, COLLECTIONS.QUESTIONS),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const questions = [];
    snapshot.forEach(doc => {
      questions.push({ id: doc.id, ...doc.data() });
    });
    callback(questions);
  });
};

// Answer a student question
export const answerQuestion = async (classId, questionId, answer) => {
  try {
    const questionRef = doc(db, COLLECTIONS.LIVE_CLASSES, classId, COLLECTIONS.QUESTIONS, questionId);
    await updateDoc(questionRef, {
      answer,
      answeredAt: Timestamp.now(),
      status: 'answered'
    });
  } catch (error) {
    console.error('Error answering question:', error);
    throw error;
  }
};

// Get teacher's schedule
export const getTeacherSchedule = async (teacherId, startDate, endDate) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.SCHEDULES),
      where('teacherId', '==', teacherId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting schedule:', error);
    throw error;
  }
};

// Get teacher stats
export const getTeacherStats = async (teacherId) => {
  try {
    // TODO: Replace with actual API call
    // const response = await axios.get(`${API_BASE_URL}/teachers/${teacherId}/stats`);
    // return response.data;
    
    // Mock data for development
    return {
      totalCourses: 5,
      totalStudents: 120,
      successRate: 92,
      averageAttendance: 88,
      completionRate: 85
    };
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    throw error;
  }
};

// Get recent activities
export const getRecentActivities = async (teacherId) => {
  try {
    // TODO: Replace with actual API call
    // const response = await axios.get(`${API_BASE_URL}/teachers/${teacherId}/activities`);
    // return response.data;
    
    // Mock data for development
    return [
      {
        id: 1,
        type: 'submission',
        text: '5 new assignment submissions in Calculus',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        type: 'question',
        text: 'New question in Advanced Algebra discussion',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        type: 'grade',
        text: 'Grades updated for Matrix Operations quiz',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      }
    ];
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
};

// Calendar Events Collection
const CALENDAR_EVENTS = 'calendar_events';
const CALENDAR_NOTES = 'calendar_notes';

// Save a calendar event
export const saveCalendarEvent = async (teacherId, eventData) => {
  try {
    const eventRef = doc(collection(db, CALENDAR_EVENTS));
    await setDoc(eventRef, {
      ...eventData,
      teacherId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return eventRef.id;
  } catch (error) {
    console.error('Error saving calendar event:', error);
    throw error;
  }
};

// Get teacher's calendar events
export const getTeacherCalendarEvents = async (teacherId, startDate, endDate) => {
  try {
    const eventsRef = collection(db, CALENDAR_EVENTS);
    const q = query(
      eventsRef,
      where('teacherId', '==', teacherId)
    );
    
    const snapshot = await getDocs(q);
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Filter dates in memory instead of in query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    return events.filter(event => {
      return event.date >= startDateStr && event.date <= endDateStr;
    });
  } catch (error) {
    console.error('Error getting calendar events:', error);
    throw error;
  }
};

// Update a calendar event
export const updateCalendarEvent = async (eventId, eventData) => {
  try {
    const eventRef = doc(db, CALENDAR_EVENTS, eventId);
    await updateDoc(eventRef, {
      ...eventData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
};

// Delete a calendar event
export const deleteCalendarEvent = async (teacherId, eventId) => {
  try {
    const eventRef = doc(db, CALENDAR_EVENTS, eventId);
    // First verify the event belongs to the teacher
    const eventDoc = await getDoc(eventRef);
    if (!eventDoc.exists()) {
      throw new Error('Event not found');
    }
    const eventData = eventDoc.data();
    if (eventData.teacherId !== teacherId) {
      throw new Error('Unauthorized to delete this event');
    }
    await deleteDoc(eventRef);
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
};

// Save a calendar note
export const saveCalendarNote = async (teacherId, date, note) => {
  try {
    // Use date as document ID to ensure uniqueness per day
    const noteRef = doc(db, CALENDAR_NOTES, `${teacherId}_${date}`);
    await setDoc(noteRef, {
      teacherId,
      date,
      note,
      updatedAt: serverTimestamp()
    }, { merge: true }); // Use merge to update existing notes
  } catch (error) {
    console.error('Error saving calendar note:', error);
    throw error;
  }
};

// Get teacher's calendar notes
export const getTeacherCalendarNotes = async (teacherId, startDate, endDate) => {
  try {
    const notesRef = collection(db, CALENDAR_NOTES);
    const q = query(
      notesRef,
      where('teacherId', '==', teacherId)
    );
    
    const snapshot = await getDocs(q);
    const notes = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      // Only include notes within the date range
      if (data.date >= startDate.toISOString().split('T')[0] && 
          data.date <= endDate.toISOString().split('T')[0]) {
        notes[data.date] = data.note;
      }
    });
    
    return notes;
  } catch (error) {
    console.error('Error getting calendar notes:', error);
    throw error;
  }
};

export const getAllTeachers = async () => {
  try {
    if (!COLLECTIONS.USERS) {
      throw new Error('Users collection is not defined in COLLECTIONS');
    }

    const teachersRef = collection(db, COLLECTIONS.USERS);
    const q = query(
      teachersRef, 
      where('role', '==', 'teacher'),
      orderBy('displayName', 'asc')  // Sort teachers by name
    );
    
    const querySnapshot = await getDocs(q);
    const teachers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      displayName: doc.data().displayName || 'Unknown Teacher'  // Fallback name
    }));

    console.log('Fetched teachers:', teachers);
    return teachers;
  } catch (error) {
    console.error('Error getting teachers:', error);
    throw error;
  }
};
