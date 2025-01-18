import axios from 'axios';
import { endpoints, getAuthHeaders } from './config';

class AuthService {
  async login(email, password) {
    try {
      const response = await axios.post(endpoints.auth.login, {
        email,
        password
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await axios.post(endpoints.auth.register, userData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async loginWithGoogle() {
    try {
      const response = await axios.get(`${endpoints.auth.login}/google`);
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  async loginWithFacebook() {
    try {
      const response = await axios.get(`${endpoints.auth.login}/facebook`);
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Facebook login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await axios.post(endpoints.auth.logout, {}, {
        headers: getAuthHeaders()
      });
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

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
}

export default new AuthService();
