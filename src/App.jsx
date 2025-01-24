// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './utils/theme';
import { useAuth } from './store/authStore';

// Auth Components
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import RoleSelectionPage from './pages/auth/RoleSelectionPage';

// Student Components
import StudentDashboard from './pages/student/Dashboard';
import LiveClass from './pages/student/LiveClass';
import LiveClasses from './pages/student/LiveClasses';
import AssignmentsPage from './pages/student/AssignmentsPage';
import SchedulePage from './pages/student/SchedulePage';
import StudentRegistration from './pages/student/StudentRegistration';
import AssignmentDetails from './pages/student/AssignmentDetails';
import StudentProfile from './pages/student/Profile';

// Teacher Components
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherAssignments from './pages/teacher/Assignments';
import Streaming from './pages/teacher/Streaming';
import TeacherAssignmentDetails from './pages/teacher/AssignmentDetails';

// Parent Components
import ParentDashboard from './pages/parent/Dashboard';

// Admin Components
import AdminDashboard from './pages/admin/Dashboard';

// Layout Components
import Navbar from './components/layout/Navbar';

// Temporary placeholders for other registration components
const TeacherRegistration = () => (
  <div>Teacher Registration Form - Coming Soon</div>
);

const ParentRegistration = () => (
  <div>Parent Registration Form - Coming Soon</div>
);

const AppRoutes = () => {
  const PrivateRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
  
    if (loading) {
      return <div>Loading...</div>;
    }
  
    if (!isAuthenticated) {
      return <Navigate to="/auth/login" replace />;
    }
  
    const path = window.location.pathname;
    // Check if current path matches user's role
    const basePath = `/${user?.role || 'student'}`;
    const isCorrectRole = path.startsWith(basePath);
  
    if (!isCorrectRole) {
      switch (user?.role) {
        case 'admin':
          return <Navigate to="/admin/dashboard" replace />;
        case 'teacher':
          return <Navigate to="/teacher/dashboard" replace />;
        case 'parent':
          return <Navigate to="/parent/dashboard" replace />;
        default:
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

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/auth/login" element={<LoginForm />} />
      <Route path="/auth/register" element={<RegisterForm />} />
      <Route path="/auth/role-selection" element={<RoleSelectionPage />} />
      <Route path="/teacher/assignments" element={
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
          <Navbar />
          <TeacherAssignments />
        </Box>
      } />
      <Route path="/teacher/assignments/:id" element={<TeacherAssignmentDetails />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <ProtectedLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
      </Route>

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
        <Route path="live-classes" element={<LiveClasses />} />
        <Route path="live-class/:id" element={<LiveClass />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="assignments/:id" element={<AssignmentDetails />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="register" element={<StudentRegistration />} />
        <Route path="profile" element={<StudentProfile />} />
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
        <Route path="register" element={<TeacherRegistration />} />
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
        <Route path="register" element={<ParentRegistration />} />
      </Route>

      {/* Default Route */}
      <Route
        path="/"
        element={
          <Navigate to="/auth/login" replace />
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppRoutes />
      </ThemeProvider>
    </Router>
  );
};

export default App;
