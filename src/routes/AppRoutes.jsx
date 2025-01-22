import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import StudentDashboard from '../pages/student/Dashboard';
import LiveClasses from '../pages/student/LiveClasses';
import LiveClassRoom from '../pages/student/LiveClassRoom';
import AssignmentsPage from '../pages/student/AssignmentsPage';
import SchedulePage from '../pages/student/SchedulePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

const AppRoutes = () => {
  const { user } = useAuth();

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/live-classes" element={
        <ProtectedRoute>
          <LiveClasses />
        </ProtectedRoute>
      } />
      <Route path="/student/live-class/:id" element={
        <ProtectedRoute>
          <LiveClassRoom />
        </ProtectedRoute>
      } />
      <Route path="/student/assignments" element={
        <ProtectedRoute>
          <AssignmentsPage />
        </ProtectedRoute>
      } />
      <Route path="/student/schedule" element={
        <ProtectedRoute>
          <SchedulePage />
        </ProtectedRoute>
      } />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/student/dashboard" />} />
      <Route path="*" element={<Navigate to="/student/dashboard" />} />
    </Routes>
  );
};

export default AppRoutes; 