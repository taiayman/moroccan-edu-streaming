import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/auth';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true
};

// Create context
const AuthContext = createContext(initialState);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setUser(user);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const updateUser = async (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const login = async (userData, token) => {
    // Ensure role is properly stored with the user data
    const userWithRole = {
      ...userData,
      role: userData.role?.toLowerCase() || 'student' // Ensure lowercase and default to student
    };
    
    setUser(userWithRole);
    setIsAuthenticated(true);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userWithRole));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
