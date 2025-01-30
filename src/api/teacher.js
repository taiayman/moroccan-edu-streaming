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

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Get teacher's courses
export const getTeacherCourses = async (teacherId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.COURSES),
      where('teacherId', '==', teacherId)
    );
    
    const snapshot = await getDocs(q);
    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory instead
    return courses.sort((a, b) => {
      const dateA = a.createdAt?.toDate() || new Date(0);
      const dateB = b.createdAt?.toDate() || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting teacher courses:', error);
    throw error;
  }
};

// Get teacher's assignments with submission details
export const getTeacherAssignments = async (teacherId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.ASSIGNMENTS),
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting teacher assignments:', error);
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
    const q = query(
      collection(db, COLLECTIONS.STUDENTS),
      where('teacherId', '==', teacherId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting teacher students:', error);
    throw error;
  }
};

// Create new course
export const createNewCourse = async (courseData) => {
  try {
    const courseRef = doc(collection(db, COLLECTIONS.COURSES));
    await updateDoc(courseRef, {
      ...courseData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return courseRef.id;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

// Create new assignment
export const createNewAssignment = async (assignmentData) => {
  try {
    const assignmentRef = doc(collection(db, COLLECTIONS.ASSIGNMENTS));
    await updateDoc(assignmentRef, {
      ...assignmentData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
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
    console.error('Error getting teacher lessons:', error);
    throw error;
  } 
};

// Start a live class
export const startLiveClass = async (teacherId, classData) => {
  try {
    // First create the scheduled class
    const scheduleRef = await addDoc(collection(db, COLLECTIONS.SCHEDULE), {
      ...classData,
      teacherId,
      status: 'scheduled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Generate a stable channel name without timestamp
    const channelName = `class_${teacherId}_${scheduleRef.id}`;

    // Create an active live class
    const liveClassRef = await addDoc(collection(db, COLLECTIONS.LIVE_CLASSES), {
      ...classData,
      teacherId,
      scheduleId: scheduleRef.id,
      channelName: channelName, // Use the stable channel name
      status: 'active',
      startTime: serverTimestamp(),
      endTime: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      classId: liveClassRef.id,
      channelName: channelName
    };
  } catch (error) {
    console.error('Error scheduling class:', error);
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
      collection(db, COLLECTIONS.SCHEDULE),
      where('teacherId', '==', teacherId)
    );
    
    const snapshot = await getDocs(q);
    const schedules = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter and sort in memory instead
    return schedules
      .filter(schedule => {
        const scheduleDate = schedule.date?.toDate() || new Date(schedule.date);
        return scheduleDate >= startDate && scheduleDate <= endDate;
      })
      .sort((a, b) => {
        const dateA = a.date?.toDate() || new Date(a.date);
        const dateB = b.date?.toDate() || new Date(b.date);
        return dateA - dateB;
      });
  } catch (error) {
    console.error('Error getting teacher schedule:', error);
    throw error;
  }
};

// Get teacher stats
export const getTeacherStats = async (teacherId) => {
  try {
    // Implement statistics gathering logic here
    return {
      totalStudents: 0,
      totalClasses: 0,
      totalAssignments: 0,
      averageAttendance: 0
    };
  } catch (error) {
    console.error('Error getting teacher stats:', error);
    throw error;
  }
};

// Get recent activities
export const getRecentActivities = async (teacherId) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.ACTIVITIES),
      where('teacherId', '==', teacherId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting recent activities:', error);
    throw error;
  }
};

// Calendar Events Collection
const CALENDAR_EVENTS = 'calendar_events';
const CALENDAR_NOTES = 'calendar_notes';

// Save a calendar event
export const saveCalendarEvent = async (teacherId, eventData) => {
  try {
    const eventRef = doc(collection(db, COLLECTIONS.CALENDAR_EVENTS));
    
    // Create a date object that combines the date and time
    const [hours, minutes] = eventData.time.split(':');
    const eventDate = new Date(eventData.date);
    eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const eventDoc = {
      title: eventData.title,
      description: eventData.description,
      teacherId,
      date: eventDate.toISOString().split('T')[0], // Store date as YYYY-MM-DD
      time: eventData.time,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(eventRef, eventDoc);
    return eventRef.id;
  } catch (error) {
    console.error('Error saving calendar event:', error);
    throw error;
  }
};

// Get teacher's calendar events
export const getTeacherCalendarEvents = async (teacherId, startDate, endDate) => {
  try {
    const eventsRef = collection(db, COLLECTIONS.CALENDAR_EVENTS);
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

    // Filter dates in memory
    const startDateStr = startDate instanceof Date 
      ? startDate.toISOString().split('T')[0] 
      : new Date(startDate).toISOString().split('T')[0];
    const endDateStr = endDate instanceof Date 
      ? endDate.toISOString().split('T')[0] 
      : new Date(endDate).toISOString().split('T')[0];

    return events
      .filter(event => event.date >= startDateStr && event.date <= endDateStr)
      .sort((a, b) => {
        // First sort by date
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        // If same date, sort by time
        return (a.time || '').localeCompare(b.time || '');
      });
  } catch (error) {
    console.error('Error getting calendar events:', error);
    throw error;
  }
};

// Update a calendar event
export const updateCalendarEvent = async (eventId, eventData) => {
  try {
    const eventRef = doc(db, COLLECTIONS.CALENDAR_EVENTS, eventId);
    
    const updateData = {
      ...eventData,
      updatedAt: serverTimestamp()
    };

    if (eventData.date && eventData.time) {
      const [hours, minutes] = eventData.time.split(':');
      const eventDate = new Date(eventData.date);
      eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      updateData.date = eventDate.toISOString().split('T')[0];
    }

    await updateDoc(eventRef, updateData);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
};

// Delete a calendar event
export const deleteCalendarEvent = async (teacherId, eventId) => {
  try {
    const eventRef = doc(db, COLLECTIONS.CALENDAR_EVENTS, eventId);
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
    const noteRef = doc(collection(db, COLLECTIONS.CALENDAR_NOTES));
    await updateDoc(noteRef, {
      teacherId,
      date,
      note,
      updatedAt: Timestamp.now()
    });
    return noteRef.id;
  } catch (error) {
    console.error('Error saving calendar note:', error);
    throw error;
  }
};

// Get teacher's calendar notes
export const getTeacherCalendarNotes = async (teacherId, startDate, endDate) => {
  try {
    const q = query(
      collection(db, COLLECTIONS.CALENDAR_NOTES),
      where('teacherId', '==', teacherId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const snapshot = await getDocs(q);
    const notes = {};
    snapshot.docs.forEach(doc => {
      notes[doc.data().date] = doc.data().note;
    });
    return notes;
  } catch (error) {
    console.error('Error getting calendar notes:', error);
    throw error;
  }
};

// Create a Daily.co room and store in Firebase
export const createDailyRoom = async (teacherId, roomData) => {
  try {
    // Generate a unique room name
    const roomName = `class-${teacherId}-${Date.now()}`;

    // Store room data in Firebase
    const roomRef = await addDoc(collection(db, COLLECTIONS.DAILYCO_ROOMS), {
      roomName,
      teacherId,
      title: roomData.title,
      description: roomData.description,
      subject: roomData.subject,
      startTime: roomData.startTime,
      teacherName: roomData.teacherName,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      url: `https://moroccan-edu.daily.co/${roomName}`
    });

    // Return room information
    return {
      roomId: roomRef.id,
      roomName,
      url: `https://moroccan-edu.daily.co/${roomName}`
    };
  } catch (error) {
    console.error('Error creating Daily.co room:', error);
    throw error;
  }
};

// End a Daily.co room
export const endDailyRoom = async (roomId) => {
  try {
    const roomRef = doc(db, COLLECTIONS.DAILYCO_ROOMS, roomId);
    await updateDoc(roomRef, {
      status: 'ended',
      endedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error ending Daily.co room:', error);
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
