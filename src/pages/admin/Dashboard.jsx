// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  BottomNavigation,
  BottomNavigationAction,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Timer as TimerIcon, People as PeopleIcon, Assignment as AssignmentIcon, LiveTv as LiveTvIcon, History as HistoryIcon, Add as AddIcon, Menu as MenuIcon, Close as CloseIcon, Stars as StarsIcon, WorkspacePremium as PremiumIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, COLLECTIONS } from '../../api/config';
import {
  getAllUsers,
  updateUser,
  deleteUser,
  getActivityLogs,
  getAnalyticsData,
  manageCourses,
  manageAssignments,
  getLiveClasses,
  moderateLiveClass,
} from '../../api/admin';
import { toggleProStatus } from '../../api/users';
import { endDailyRoom } from '../../api/teacher';

const truncateEmail = (email) => {
  const [username, domain] = email.split('@');
  if (!domain) return email;
  return `${username}@...`;
};

// Add this after imports
const fontFamily = "'Noto Kufi Arabic', sans-serif";

// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Update theme to include the Arabic font
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: fontFamily,
    h6: {
      fontFamily: fontFamily,
      fontWeight: 600,
    },
    subtitle1: {
      fontFamily: fontFamily,
      fontWeight: 500,
    },
    body1: {
      fontFamily: fontFamily,
    },
    body2: {
      fontFamily: fontFamily,
    },
    button: {
      fontFamily: fontFamily,
      fontWeight: 500,
    },
    caption: {
      fontFamily: fontFamily,
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap');

        body {
          font-family: ${fontFamily};
        }
      `,
    },
  },
});

// Add these translations near the top with other constants
const fieldLabels = {
  displayName: 'الاسم',
  email: 'البريد الإلكتروني',
  password: 'كلمة المرور',
  role: 'الدور',
  roles: {
    student: 'طالب',
    teacher: 'معلم',
    admin: 'مشرف',
    parent: 'ولي أمر'
  }
};

const AdminDashboard = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editType, setEditType] = useState(''); // 'user' | 'assignment'
  const [editData, setEditData] = useState({});
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    displayName: '',
    email: '',
    role: 'student',
    password: ''
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Update section titles and empty states
  const sectionTitles = {
    users: 'المستخدمين',
    teachers: 'المعلمين',
    students: 'الطلاب',
    parents: 'أولياء الأمور',
    assignments: 'الواجبات',
    liveClasses: 'الحصص المباشرة',
    activity: 'النشاطات'
  };

  const emptyStates = {
    teachers: 'لا يوجد معلمين',
    students: 'لا يوجد طلاب',
    parents: 'لا يوجد أولياء أمور',
    assignments: 'لا يوجد واجبات',
    liveClasses: 'لا يوجد حصص مباشرة',
    activity: 'لا يوجد نشاطات'
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch dailyco_rooms directly from Firestore
      const roomsQuery = query(
        collection(db, COLLECTIONS.DAILYCO_ROOMS),
        orderBy('createdAt', 'desc')
      );
      const roomsSnapshot = await getDocs(roomsQuery);
      const roomsData = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));

      const [
        usersData,
        assignmentsData,
        logsData,
        analyticsData
      ] = await Promise.all([
        getAllUsers(),
        manageAssignments('read'),
        getActivityLogs(),
        getAnalyticsData()
      ]);

      setUsers(usersData);
      setAssignments(assignmentsData);
      setLiveClasses(roomsData);
      setActivityLogs(logsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error(err);
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditOpen = (type, data) => {
    setEditType(type);
    setEditData(data);
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    try {
      if (editType === 'user') {
        await updateUser(editData.id, editData);
      } else if (editType === 'assignment') {
        await manageAssignments('update', editData);
      }
      setEditDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to update.');
    }
  };

  const handleProToggle = async (userId) => {
    try {
      const updatedUser = await toggleProStatus(userId);
      // If the user exists in the system, trigger an auth context update
      if (updatedUser) {
        // Find all instances of this user in our current users list and update them
        setUsers(users.map(user =>
          user.id === userId ? { ...user, ...updatedUser } : user
        ));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to toggle pro status.');
    }
  };

  const handleDelete = async (type, id) => {
    try {
      if (type === 'user') {
        await deleteUser(id);
      } else if (type === 'assignment') {
        await manageAssignments('delete', { id });
      } else if (type === 'liveClass') {
        // End the Daily.co room - this will both delete the room and update Firestore
        await endDailyRoom(id);
      }
      loadData();
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to delete/end class. Please try again.');
    }
  };

  const handleAddUserSave = async () => {
    try {
      await updateUser(null, newUserData); // Pass null as id for creation
      setAddUserDialogOpen(false);
      setNewUserData({
        displayName: '',
        email: '',
        role: 'student',
        password: ''
      });
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to create user.');
    }
  };

  const renderUsersTab = () => {
    const groupedUsers = {
      student: users.filter(u => u.role === 'student'),
      parent: users.filter(u => u.role === 'parent'),
      teacher: users.filter(u => u.role === 'teacher')
    };

    const UserCard = ({ user }) => (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: 'rgba(26,32,44,0.9)',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.05)',
          '&:active': {
            transform: 'scale(0.98)',
            transition: 'transform 0.1s'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: '#00FFA3',
              color: '#0F172A',
              width: 50,
              height: 50,
              fontSize: '1.2rem'
            }}
          >
            {user.displayName?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 500 }}>
              {user.displayName}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {truncateEmail(user.email)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {user.role === 'student' && (
              <IconButton
                onClick={() => handleProToggle(user.id)}
                sx={{
                  color: user.isPro ? '#FFD700' : 'rgba(255,255,255,0.5)',
                  backgroundColor: user.isPro ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    backgroundColor: user.isPro ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.2)'
                  },
                  '&:active': { transform: 'scale(0.95)' }
                }}
              >
                <PremiumIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton
              onClick={() => handleEditOpen('user', user)}
              sx={{
                color: '#00FFA3',
                backgroundColor: 'rgba(0,255,163,0.1)',
                '&:active': { transform: 'scale(0.95)' }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={() => handleDelete('user', user.id)}
              sx={{
                color: '#ef4444',
                backgroundColor: 'rgba(239,68,68,0.1)',
                '&:active': { transform: 'scale(0.95)' }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
    </Paper>
  );

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Teachers Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#00FFA3',
              mb: 2,
              fontWeight: 500,
              px: 1
            }}
          >
            {sectionTitles.teachers}
          </Typography>
          {groupedUsers.teacher.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
          {groupedUsers.teacher.length === 0 && (
            <Typography
              sx={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.7)',
                py: 2
              }}
            >
              {emptyStates.teachers}
            </Typography>
          )}
        </Box>

        {/* Students Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#00FFA3',
              mb: 2,
              fontWeight: 500,
              px: 1
            }}
          >
            {sectionTitles.students}
          </Typography>
          {groupedUsers.student.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
          {groupedUsers.student.length === 0 && (
            <Typography
              sx={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.7)',
                py: 2
              }}
            >
              {emptyStates.students}
            </Typography>
          )}
        </Box>

        {/* Parents Section */}
        <Box>
          <Typography
            variant="h6"
            sx={{
              color: '#00FFA3',
              mb: 2,
              fontWeight: 500,
              px: 1
            }}
          >
            {sectionTitles.parents}
          </Typography>
          {groupedUsers.parent.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
          {groupedUsers.parent.length === 0 && (
            <Typography
              sx={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.7)',
                py: 2
              }}
            >
              {emptyStates.parents}
            </Typography>
          )}
        </Box>
      </motion.div>
    );
  };

  const renderAssignmentsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {assignments.map(assignment => (
        <Paper
          key={assignment.id}
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: 'rgba(26,32,44,0.9)',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
            '&:active': {
              transform: 'scale(0.98)',
              transition: 'transform 0.1s'
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 500 }}>
              {assignment.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {assignment.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  backgroundColor: 'rgba(0,255,163,0.1)',
                  borderRadius: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <TimerIcon sx={{ fontSize: 16, color: '#00FFA3' }} />
                <Typography variant="caption" sx={{ color: '#00FFA3' }}>
                  Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <IconButton
                onClick={() => handleEditOpen('assignment', assignment)}
                sx={{
                  color: '#00FFA3',
                  backgroundColor: 'rgba(0,255,163,0.1)',
                  '&:active': { transform: 'scale(0.95)' }
                }}
              >
                  <EditIcon fontSize="small" />
                </IconButton>
              <IconButton
                onClick={() => handleDelete('assignment', assignment.id)}
                sx={{
                  color: '#ef4444',
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  '&:active': { transform: 'scale(0.95)' }
                }}
              >
                  <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>
          </Box>
        </Paper>
      ))}
      {assignments.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            backgroundColor: 'rgba(26,32,44,0.5)',
            borderRadius: 2,
            border: '1px dashed rgba(255,255,255,0.1)'
          }}
        >
          <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
            {emptyStates.assignments}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            There are no assignments at the moment.
          </Typography>
        </Box>
      )}
    </motion.div>
  );

  const renderLiveClassesTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {liveClasses.filter(liveClass => liveClass.status === 'active').map((liveClass) => (
        <Paper
          key={liveClass.id}
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: 'rgba(26,32,44,0.9)',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
            '&:active': {
              transform: 'scale(0.98)',
              transition: 'transform 0.1s'
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#4CAF50',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': {
                      transform: 'scale(0.95)',
                      boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)',
                    },
                    '70%': {
                      transform: 'scale(1)',
                      boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)',
                    },
                    '100%': {
                      transform: 'scale(0.95)',
                      boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)',
                    },
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: '#4CAF50',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.5px'
                }}
              >
                Live Now
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 500 }}>
              {liveClass.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {liveClass.teacherName}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1 }}>
              {liveClass.subject}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                px: 1.5,
                py: 0.5,
                alignSelf: 'flex-start',
                mb: 1
              }}
            >
              <TimerIcon sx={{ fontSize: 16, color: '#00FFA3' }} />
              <Typography variant="caption" sx={{ color: '#fff' }}>
                Started: {new Date(liveClass.startTime).toLocaleString()}
              </Typography>
            </Box>
            {liveClass.description && (
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  p: 1.5,
                  borderRadius: 1,
                  mb: 1
                }}
              >
                {liveClass.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => {
                  const roomName = liveClass.roomName;
                  const streamingUrl = `/streaming/student.html?room=${roomName}`;
                  window.open(streamingUrl, '_blank');
                }}
                sx={{
                  backgroundColor: '#00FFA3',
                  color: '#0F172A',
                  py: 1,
                  '&:hover': {
                    backgroundColor: '#00cc82'
                  }
                }}
              >
                Join Class
              </Button>
                  <Button
                fullWidth
                variant="outlined"
                onClick={() => handleDelete('liveClass', liveClass.id)}
                sx={{
                  borderColor: '#ef4444',
                  color: '#ef4444',
                  py: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    borderColor: '#ef4444'
                  }
                }}
              >
                End Class
                  </Button>
            </Box>
          </Box>
        </Paper>
      ))}
      {liveClasses.filter(liveClass => liveClass.status === 'active').length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            backgroundColor: 'rgba(26,32,44,0.5)',
            borderRadius: 2,
            border: '1px dashed rgba(255,255,255,0.1)'
          }}
        >
          <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
            {emptyStates.liveClasses}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            There are no active live classes at the moment.
          </Typography>
        </Box>
      )}
    </motion.div>
  );

  const renderActivityLogsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
          {activityLogs.map(log => (
        <Paper
          key={log.id}
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: 'rgba(26,32,44,0.9)',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.05)',
            '&:active': {
              transform: 'scale(0.98)',
              transition: 'transform 0.1s'
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 500 }}>
              {log.action}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              User: {log.userId}
            </Typography>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                backgroundColor: 'rgba(0,255,163,0.1)',
                borderRadius: 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                alignSelf: 'flex-start'
              }}
            >
              <TimerIcon sx={{ fontSize: 16, color: '#00FFA3' }} />
              <Typography variant="caption" sx={{ color: '#00FFA3' }}>
                {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : '-'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      ))}
      {activityLogs.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            backgroundColor: 'rgba(26,32,44,0.5)',
            borderRadius: 2,
            border: '1px dashed rgba(255,255,255,0.1)'
          }}
        >
          <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
            {emptyStates.activity}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            There are no activity logs at the moment.
          </Typography>
        </Box>
      )}
    </motion.div>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress sx={{ color: '#00FFA3' }} />
        </Box>
      );
    }

    switch (tabIndex) {
      case 0: return renderUsersTab();
      case 1: return renderAssignmentsTab();
      case 2: return renderLiveClassesTab();
      case 3: return renderActivityLogsTab();
      default: return null;
    }
  };

  const renderBottomNav = () => (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(26,32,44,0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 0,
        boxShadow: 'none'
      }}
      elevation={0}
    >
      <BottomNavigation
        value={tabIndex}
        onChange={(e, newValue) => setTabIndex(newValue)}
        sx={{
          backgroundColor: 'transparent',
          height: 70,
          '& .MuiBottomNavigationAction-root': {
            color: 'rgba(255,255,255,0.6)',
            '&.Mui-selected': {
              color: '#00FFA3'
            },
            minWidth: 'auto',
            padding: '6px 0'
          }
        }}
      >
        <BottomNavigationAction label="المستخدمين" icon={<PeopleIcon />} />
        <BottomNavigationAction label="الواجبات" icon={<AssignmentIcon />} />
        <BottomNavigationAction label="المباشر" icon={<LiveTvIcon />} />
        <BottomNavigationAction label="النشاطات" icon={<HistoryIcon />} />
      </BottomNavigation>
    </Paper>
  );

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <>
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap');

              * {
                font-family: ${fontFamily};
              }
            `}
          </style>
          <Box
            dir="rtl"
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #1a1f2c 0%, #2d3748 100%)',
              pb: { xs: 9, sm: 9 },
              position: 'relative',
              fontFamily: fontFamily
            }}
          >
            {/* App Bar */}
            <Paper
              elevation={0}
              sx={{
                backgroundColor: 'rgba(26,32,44,0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                px: 2,
                py: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <IconButton
                  onClick={() => setDrawerOpen(true)}
                  sx={{ color: '#fff' }}
                >
                  <MenuIcon />
          </IconButton>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                  {tabIndex === 0 ? 'المستخدمين' :
                   tabIndex === 1 ? 'الواجبات' :
                   tabIndex === 2 ? 'الحصص المباشرة' : 'النشاطات'}
          </Typography>
                {tabIndex === 0 && (
                  <IconButton
                    onClick={() => setAddUserDialogOpen(true)}
                    sx={{
                      backgroundColor: '#00FFA3',
                      color: '#0F172A',
                      '&:hover': { backgroundColor: '#00cc82' },
                      width: 40,
                      height: 40
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                )}
              </Box>
            </Paper>

            {/* Side Drawer */}
            <SwipeableDrawer
              anchor="right"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              onOpen={() => setDrawerOpen(true)}
              PaperProps={{
                sx: {
                  backgroundColor: 'rgba(26,32,44,0.98)',
                  backdropFilter: 'blur(10px)',
                  width: '80%',
                  maxWidth: 300
                }
              }}
            >
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#fff' }}>القائمة</Typography>
                  <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: '#fff' }}>
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                <List>
                  {[
                    { text: 'المستخدمين', icon: <PeopleIcon /> },
                    { text: 'الواجبات', icon: <AssignmentIcon /> },
                    { text: 'الحصص المباشرة', icon: <LiveTvIcon /> },
                    { text: 'النشاطات', icon: <HistoryIcon /> }
                  ].map((item, index) => (
                    <ListItem
                      button
                      key={item.text}
                      onClick={() => {
                        setTabIndex(index);
                        setDrawerOpen(false);
                      }}
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        '&:hover': {
                          backgroundColor: 'rgba(0,255,163,0.1)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: tabIndex === index ? '#00FFA3' : '#fff' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        sx={{
                          '& .MuiListItemText-primary': {
                            color: tabIndex === index ? '#00FFA3' : '#fff'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
        </Box>
            </SwipeableDrawer>

            {/* Main Content */}
            <Container
              maxWidth="xl"
              sx={{
                py: 2,
                px: { xs: 1, sm: 2 }
              }}
            >
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    color: '#ef4444',
                    border: '1px solid #ef4444'
                  }}
                >
                  {error}
                </Alert>
              )}
        {renderTabContent()}
      </Container>

            {renderBottomNav()}

            {/* Update dialog titles and buttons */}
            <Dialog
              open={editDialogOpen}
              onClose={() => setEditDialogOpen(false)}
              fullWidth
              maxWidth="sm"
              PaperProps={{
                sx: {
                  backgroundColor: 'rgba(45,55,72,0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 3
                }
              }}
            >
              <DialogTitle sx={{ color: '#fff', fontSize: '1.5rem', fontWeight: 600 }}>
                تعديل {editType === 'user' ? 'المستخدم' : 'الواجب'}
        </DialogTitle>
              <DialogContent>
          {Object.keys(editData).map(key => {
            if (['id', 'createdAt', 'updatedAt'].includes(key)) return null;
            return (
              <TextField
                key={key}
                label={key}
                value={editData[key]}
                onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                fullWidth
                margin="dense"
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.2)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(0,255,163,0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00FFA3',
                          },
                        },
                      }}
                      InputLabelProps={{
                        style: { color: 'rgba(255,255,255,0.7)' }
                      }}
                      InputProps={{
                        style: { color: '#fff' }
                      }}
              />
            );
          })}
        </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                <Button
                  onClick={() => setEditDialogOpen(false)}
                  sx={{
                    color: '#fff',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  onClick={handleEditSave}
                  variant="contained"
                  sx={{
                    backgroundColor: '#00FFA3',
                    color: '#0F172A',
                    '&:hover': { backgroundColor: '#00cc82' }
                  }}
                >
                  حفظ التغييرات
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog
              open={addUserDialogOpen}
              onClose={() => setAddUserDialogOpen(false)}
              fullWidth
              maxWidth="sm"
              PaperProps={{
                sx: {
                  backgroundColor: 'rgba(45,55,72,0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 3
                }
              }}
            >
              <DialogTitle sx={{ color: '#fff', fontSize: '1.5rem', fontWeight: 600 }}>
                إضافة مستخدم جديد
              </DialogTitle>
              <DialogContent>
                <TextField
                  label={fieldLabels.displayName}
                  value={newUserData.displayName}
                  onChange={(e) => setNewUserData({ ...newUserData, displayName: e.target.value })}
                  fullWidth
                  margin="dense"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(0,255,163,0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00FFA3',
                      },
                    },
                    fontFamily: fontFamily
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)', fontFamily: fontFamily }
                  }}
                  InputProps={{
                    style: { color: '#fff', fontFamily: fontFamily }
                  }}
                />
                <TextField
                  label={fieldLabels.email}
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  fullWidth
                  margin="dense"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(0,255,163,0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00FFA3',
                      },
                    },
                    fontFamily: fontFamily
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)', fontFamily: fontFamily }
                  }}
                  InputProps={{
                    style: { color: '#fff', fontFamily: fontFamily }
                  }}
                />
                <TextField
                  label={fieldLabels.password}
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  fullWidth
                  margin="dense"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(0,255,163,0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00FFA3',
                      },
                    },
                    fontFamily: fontFamily
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)', fontFamily: fontFamily }
                  }}
                  InputProps={{
                    style: { color: '#fff', fontFamily: fontFamily }
                  }}
                />
                <TextField
                  select
                  label={fieldLabels.role}
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  fullWidth
                  margin="dense"
                  variant="outlined"
                  SelectProps={{
                    native: true,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(0,255,163,0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00FFA3',
                      },
                    },
                    fontFamily: fontFamily
                  }}
                  InputLabelProps={{
                    style: { color: 'rgba(255,255,255,0.7)', fontFamily: fontFamily }
                  }}
                  InputProps={{
                    style: { color: '#fff', fontFamily: fontFamily }
                  }}
                >
                  <option value="student">{fieldLabels.roles.student}</option>
                  <option value="teacher">{fieldLabels.roles.teacher}</option>
                  <option value="admin">{fieldLabels.roles.admin}</option>
                  <option value="parent">{fieldLabels.roles.parent}</option>
                </TextField>
              </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                <Button
                  onClick={() => setAddUserDialogOpen(false)}
                  sx={{
                    color: '#fff',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  إلغاء
          </Button>
                <Button
                  onClick={handleAddUserSave}
                  variant="contained"
                  sx={{
                    backgroundColor: '#00FFA3',
                    color: '#0F172A',
                    '&:hover': { backgroundColor: '#00cc82' }
                  }}
                >
                  إنشاء مستخدم
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
        </>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default AdminDashboard;