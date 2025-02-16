import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from './config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

class AuthService {
  async login(email, password) {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      const token = await user.getIdToken();
      
      const authData = {
        token,
        user: {
          id: user.uid,
          email: user.email,
          ...userData
        }
      };

      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      
      return authData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async verifyAdminRole(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      if (userData.role !== 'admin') {
        throw new Error('User is not an admin');
      }

      return userData;
    } catch (error) {
      console.error('Admin verification error:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      // Create new user
      const { user } = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: userData.email,
        displayName: userData.displayName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        isNewUser: true,
        createdAt: new Date().toISOString()
      });

      const token = await user.getIdToken();
      const authData = {
        token,
        user: {
          id: user.uid,
          email: userData.email,
          displayName: userData.displayName,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
          isNewUser: true
        }
      };

      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      
      return authData;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(auth);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  async refreshUserData(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = {
          ...userDoc.data(),
          id: userId
        };
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      throw error;
    }
  }

  isAuthenticated() {
    return !!localStorage.getItem('token') && !!auth.currentUser;
  }

  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const token = await user.getIdToken();
          callback({
            token,
            user: {
              id: user.uid,
              email: user.email,
              ...userData
            }
          });
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }
}

export default new AuthService();
