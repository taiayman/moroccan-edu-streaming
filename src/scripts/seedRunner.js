import { db } from '../api/config';
import { doc, setDoc } from 'firebase/firestore';

// Get the current user's ID from localStorage
const getCurrentUserId = () => {
  const user = localStorage.getItem('user');
  if (!user) {
    throw new Error('No user logged in. Please log in first.');
  }
  return JSON.parse(user).id;
};

// Sample course data with proper structure
const courses = [
  {
    id: 'math101',
    title: 'Mathématiques: Calcul Intégral',
    description: 'Introduction au calcul intégral et ses applications',
    teacherId: 'teacher1',
    teacherName: 'Prof. Benali',
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
    teacherId: 'teacher2',
    teacherName: 'Prof. Alami',
    createdAt: new Date().toISOString(),
    schedule: [
      { day: 'Mardi', time: '11:00' },
      { day: 'Jeudi', time: '15:00' }
    ],
    imageURL: 'https://example.com/physics.jpg'
  }
];

// Sample assignments data
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
  }
];

// Function to seed data for current user
export const seedCurrentUserData = async () => {
  try {
    const userId = getCurrentUserId();
    console.log('Seeding data for user:', userId);

    // Seed courses
    for (const course of courses) {
      await setDoc(doc(db, 'courses', course.id), course);
      
      // Create enrollment for the current user
      await setDoc(
        doc(db, 'users', userId, 'enrollments', course.id),
        {
          enrolledAt: new Date().toISOString(),
          progress: 0,
          lastAccessed: new Date().toISOString()
        }
      );
    }

    // Seed assignments
    for (const assignment of assignments) {
      await setDoc(doc(db, 'assignments', assignment.id), assignment);
    }

    console.log('Data seeded successfully for current user!');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};

// Execute the seeding function
seedCurrentUserData().catch(console.error);
