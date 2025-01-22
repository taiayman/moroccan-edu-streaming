import { db } from '../api/config';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';

const TEACHER_IDS = ['teacher1', 'teacher2', 'teacher3'];
const STUDENT_ID = 'testStudent123'; // Replace with actual student ID when testing

// Test data for courses
const courses = [
  {
    id: 'math101',
    title: 'Mathématiques: Calcul Intégral',
    description: 'Introduction au calcul intégral et ses applications',
    teacherId: TEACHER_IDS[0],
    createdAt: new Date().toISOString(),
    schedule: [
      { day: 'Lundi', time: '10:00' },
      { day: 'Mercredi', time: '14:00' }
    ],
    imageURL: 'https://example.com/math.jpg'
  },
  {
    id: 'phys201',
    title: 'Physique: Mécanique Quantique',
    description: 'Fondements de la mécanique quantique',
    teacherId: TEACHER_IDS[1],
    createdAt: new Date().toISOString(),
    schedule: [
      { day: 'Mardi', time: '11:00' },
      { day: 'Jeudi', time: '15:00' }
    ],
    imageURL: 'https://example.com/physics.jpg'
  },
  {
    id: 'chem301',
    title: 'Chimie: Chimie Organique',
    description: 'Étude des composés organiques',
    teacherId: TEACHER_IDS[2],
    createdAt: new Date().toISOString(),
    schedule: [
      { day: 'Lundi', time: '16:00' },
      { day: 'Vendredi', time: '09:00' }
    ],
    imageURL: 'https://example.com/chemistry.jpg'
  }
];

// Test data for enrollments
const enrollments = {
  'math101': {
    enrolledAt: new Date().toISOString(),
    progress: 45,
    lastAccessed: new Date().toISOString()
  },
  'phys201': {
    enrolledAt: new Date().toISOString(),
    progress: 30,
    lastAccessed: new Date().toISOString()
  },
  'chem301': {
    enrolledAt: new Date().toISOString(),
    progress: 60,
    lastAccessed: new Date().toISOString()
  }
};

// Test data for assignments
const assignments = [
  {
    id: 'assign1',
    title: 'Dérivées et Intégrales',
    courseId: 'math101',
    description: 'Exercices sur les techniques d\'intégration',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
  },
  {
    id: 'assign2',
    title: 'Équations de Schrödinger',
    courseId: 'phys201',
    description: 'Résolution d\'équations quantiques',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
  },
  {
    id: 'assign3',
    title: 'Réactions Organiques',
    courseId: 'chem301',
    description: 'Mécanismes de réaction',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
  }
];

// Function to seed the test data
export const seedTestData = async () => {
  try {
    // Seed courses
    console.log('Seeding courses...');
    for (const course of courses) {
      await setDoc(doc(db, 'courses', course.id), course);
    }

    // Seed enrollments
    console.log('Seeding enrollments...');
    for (const [courseId, enrollmentData] of Object.entries(enrollments)) {
      await setDoc(
        doc(db, 'users', STUDENT_ID, 'enrollments', courseId),
        enrollmentData
      );
    }

    // Seed assignments
    console.log('Seeding assignments...');
    for (const assignment of assignments) {
      await setDoc(doc(db, 'assignments', assignment.id), assignment);
    }

    console.log('Test data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
};

// Execute the seeding function
seedTestData().catch(console.error);
