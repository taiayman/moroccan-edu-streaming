// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './utils/theme';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Auth Components
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

// Student Components
import StudentDashboard from './pages/student/Dashboard';
import LiveClass from './pages/student/LiveClass';

// Teacher Components
import TeacherDashboard from './pages/teacher/Dashboard';
import Streaming from './pages/teacher/Streaming';

// Parent Components
import ParentDashboard from './pages/parent/Dashboard';

// Layout Components
import Navbar from './components/layout/Navbar';

const PrivateRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // You might want to use a proper loading component
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if user is accessing the correct role-based route
  const path = window.location.pathname;
  const isCorrectRole = (
    (path.startsWith('/student/') && user?.role === 'student') ||
    (path.startsWith('/teacher/') && user?.role === 'teacher') ||
    (path.startsWith('/parent/') && user?.role === 'parent')
  );

  if (!isCorrectRole) {
    // Redirect to the correct dashboard based on role
    if (user?.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />;
    } else if (user?.role === 'parent') {
      return <Navigate to="/parent/dashboard" replace />;
    } else {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return children;
};

const ProtectedLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

const App = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && window.location.pathname === '/') {
      // Redirect to appropriate dashboard based on role
      if (user?.role === 'teacher') {
        window.location.href = '/teacher/dashboard';
      } else if (user?.role === 'parent') {
        window.location.href = '/parent/dashboard';
      } else {
        window.location.href = '/student/dashboard';
      }
    }
  }, [isAuthenticated, user]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth/login" element={<LoginForm />} />
          <Route path="/auth/register" element={<RegisterForm />} />

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <PrivateRoute>
                <ProtectedLayout />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="live-class/:id" element={<LiveClass />} />
          </Route>

          {/* Teacher Routes */}
          <Route
            path="/teacher"
            element={
              <PrivateRoute>
                <ProtectedLayout />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="streaming/:id" element={<Streaming />} />
          </Route>

          {/* Parent Routes */}
          <Route
            path="/parent"
            element={
              <PrivateRoute>
                <ProtectedLayout />
              </PrivateRoute>
            }
          >
            <Route path="dashboard" element={<ParentDashboard />} />
          </Route>

          {/* Default Route */}
          <Route
            path="/"
            element={
              <Navigate to="/auth/login" replace />
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

const AppWithAuth = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWithAuth;