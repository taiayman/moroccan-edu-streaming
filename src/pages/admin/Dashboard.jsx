import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button,
  Stack,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Chip,
  MenuItem,
  Menu,
  Divider,
  LinearProgress,
  Tabs,
  Tab,
  useTheme,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  SupervisorAccount as AdminIcon,
  People as UsersIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  MoreVert as MoreIcon,
  Block as BlockIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  CheckCircleOutline as ApproveIcon,
  Warning as WarningIcon,
  Storage as DatabaseIcon,
  Speed as PerformanceIcon,
  Dns as ServerIcon,
  Assessment as AssessmentIcon,
  LiveTv as LiveTvIcon,
  Timer as TimerIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  SupervisorAccount as SupervisorAccountIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useAuth } from '../../store/authStore';
import { 
  getAllUsers, 
  getActivityLogs, 
  getSystemSettings, 
  getAnalyticsData,
  manageCourses,
  manageAssignments,
  getLiveClasses,
  moderateLiveClass,
  getStudentProgress
} from '../../api/admin';

const StatCard = ({ stat }) => (
  <Box
    sx={{
      position: 'relative',
      height: '100%',
      '&:before': {
        content: '""',
        position: 'absolute',
        top: '8px',
        left: '8px',
        right: '-8px',
        bottom: '-8px',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: '16px',
        zIndex: 0
      }
    }}
  >
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        backgroundColor: '#fff',
        borderRadius: '16px',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.2s',
        border: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        '&:hover': {
          transform: 'translate(-4px, -4px)',
          '& + .glass-shadow': {
            transform: 'translate(4px, 4px)'
          }
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {stat.icon}
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        {stat.value}
      </Typography>
      <Typography variant="body1" sx={{ color: '#666', mb: 1 }}>
        {stat.title}
      </Typography>
      <Typography variant="caption" sx={{ color: '#666' }}>
        {stat.description}
      </Typography>
    </Paper>
  </Box>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [studentProgress, setStudentProgress] = useState([]);
  const [currentTab, setCurrentTab] = useState('users');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserType, setSelectedUserType] = useState('teachers');

  const theme = useTheme();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        usersData, 
        logsData, 
        analyticsData,
        coursesData,
        assignmentsData,
        classesData,
        progressData
      ] = await Promise.all([
        getAllUsers(),
        getActivityLogs(),
        getAnalyticsData(),
        manageCourses('read'),
        manageAssignments('read'),
        getLiveClasses(),
        getStudentProgress('all')
      ]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setActivityLogs(Array.isArray(logsData) ? logsData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setLiveClasses(Array.isArray(classesData) ? classesData : []);
      setStudentProgress(progressData || []);
      setAnalytics(analyticsData || {
        systemHealth: 98,
        activeUsers: 150,
        storageUsed: 75,
        serverLoad: 45
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setLoading(false);
    }
  };

  const handleMenuClick = (event, userId) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserId(null);
  };

  const handleResetProgress = async (studentId) => {
    try {
      await manageAssignments('reset', { studentId });
      loadData();
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  };

  const handleDownloadReport = async (studentId) => {
    try {
      const report = await getStudentProgress(studentId);
      // Implement PDF download logic here
      console.log('Downloading report:', report);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'pending':
        return '#FFA000';
      case 'blocked':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  // Filter users by role
  const teachers = users.filter(user => user.role === 'teacher');
  const students = users.filter(user => user.role === 'student');
  const parents = users.filter(user => user.role === 'parent');

  const stats = [
    {
      title: 'System Health',
      value: `${analytics.systemHealth || 98}%`,
      icon: <PerformanceIcon sx={{ fontSize: 28, color: '#000' }} />,
      indicator: (
        <LinearProgress 
          variant="determinate" 
          value={analytics.systemHealth || 98}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(0,0,0,0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#4CAF50'
            }
          }}
        />
      )
    },
    {
      title: 'Active Users',
      value: users.length,
      icon: <PeopleIcon sx={{ fontSize: 28, color: '#000' }} />,
      indicator: (
        <Typography variant="caption" sx={{ color: '#666' }}>
          {teachers.length} teachers, {students.length} students
        </Typography>
      )
    },
    {
      title: 'Storage Used',
      value: `${analytics.storageUsed || 75}%`,
      icon: <DatabaseIcon sx={{ fontSize: 28, color: '#000' }} />,
      indicator: (
        <LinearProgress 
          variant="determinate" 
          value={analytics.storageUsed || 75}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(0,0,0,0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#2196F3'
            }
          }}
        />
      )
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F8F9FA', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Admin Dashboard
              </Typography>
              <Typography variant="body1" sx={{ color: '#666' }}>
            Monitor and manage your educational platform
              </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <StatCard
              stat={{
                icon: <PerformanceIcon sx={{ fontSize: 28, color: '#000' }} />,
                title: "System Health",
                value: `${analytics.systemHealth || 98}%`,
                description: "Overall platform performance"
              }}
            />
                </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              stat={{
                icon: <PeopleIcon sx={{ fontSize: 28, color: '#000' }} />,
                title: "Active Users",
                value: users.length,
                description: `${teachers.length} teachers, ${students.length} students`
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard
              stat={{
                icon: <WarningIcon sx={{ fontSize: 28, color: '#000' }} />,
                title: "Issues",
                value: activityLogs.filter(log => log.type === 'issue').length,
                description: "Pending issues to resolve"
              }}
            />
          </Grid>
            </Grid>

        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            backgroundColor: '#fff'
          }}
        >
          <Box
            sx={{
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
              bgcolor: '#fff'
            }}
          >
              <Tabs 
                value={currentTab}
                onChange={(e, newValue) => setCurrentTab(newValue)}
                sx={{
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#000',
                    height: 3
                },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: '#666',
                  '&.Mui-selected': {
                    color: '#000'
                  }
                }
              }}
            >
              <Tab label="Users" value="users" />
              <Tab label="System Health" value="system" />
              <Tab label="Reports" value="reports" />
              <Tab label="Issues" value="issues" />
              <Tab label="Settings" value="settings" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {currentTab === 'users' && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Tabs
                    value={selectedUserType}
                    onChange={(e, newValue) => setSelectedUserType(newValue)}
                    sx={{
                      '& .MuiTabs-indicator': {
                        backgroundColor: '#000',
                        height: 3
                      },
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                        color: '#666',
                        '&.Mui-selected': {
                          color: '#000'
                        }
                  }
                }}
              >
                <Tab 
                      label={`Teachers (${teachers.length})`}
                      value="teachers"
                      icon={<SchoolIcon sx={{ fontSize: 20 }} />}
                      iconPosition="start"
                />
                <Tab 
                      label={`Students (${students.length})`}
                      value="students"
                      icon={<PeopleIcon sx={{ fontSize: 20 }} />}
                      iconPosition="start"
                />
                <Tab 
                      label={`Parents (${parents.length})`}
                      value="parents"
                      icon={<SupervisorAccountIcon sx={{ fontSize: 20 }} />}
                      iconPosition="start"
                />
              </Tabs>
            </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedUserType.charAt(0).toUpperCase() + selectedUserType.slice(1)} Management
                    </Typography>
                    <Button
                      variant="contained"
                    startIcon={<PersonAddIcon />}
                      sx={{
                      bgcolor: '#000',
                      '&:hover': { bgcolor: '#333' }
                    }}
                    onClick={() => navigate(`/admin/${selectedUserType}/new`)}
                  >
                    Add New {selectedUserType.slice(0, -1)}
                    </Button>
                  </Box>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#000' }}>User</TableCell>
                        {selectedUserType === 'teachers' && (
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Subjects</TableCell>
                        )}
                        {selectedUserType === 'students' && (
                          <>
                            <TableCell sx={{ fontWeight: 600, color: '#000' }}>Class</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#000' }}>Progress</TableCell>
                          </>
                        )}
                        {selectedUserType === 'parents' && (
                          <TableCell sx={{ fontWeight: 600, color: '#000' }}>Children</TableCell>
                        )}
                        <TableCell sx={{ fontWeight: 600, color: '#000' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#000' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                      {(selectedUserType === 'teachers' ? teachers :
                        selectedUserType === 'students' ? students :
                        parents).map((user) => (
                        <TableRow
                          key={user.id}
                          sx={{
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.02)'
                            }
                          }}
                        >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar src={user.photoURL} alt={user.displayName}>
                                {user.displayName?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {user.displayName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#666' }}>
                                  {user.email}
                                </Typography>
                              </Box>
                              </Box>
                            </TableCell>

                          {selectedUserType === 'teachers' && (
                            <TableCell>
                              <Box>
                                <Accordion 
                                  elevation={0}
                                  sx={{
                                    '&:before': { display: 'none' },
                                    backgroundColor: 'transparent',
                                    '& .MuiAccordionSummary-root': {
                                      minHeight: 'auto',
                                      padding: 0
                                    }
                                  }}
                                >
                                  <AccordionSummary
                                    expandIcon={<ExpandMoreIcon sx={{ fontSize: 20, color: '#666' }} />}
                                    sx={{ flexDirection: 'row-reverse', gap: 1 }}
                                  >
                                    <Stack direction="row" spacing={1}>
                                      {user.subjects?.map((subject, index) => (
                              <Chip 
                                          key={index}
                                          label={subject}
                                size="small"
                                          sx={{ backgroundColor: '#F5F5F5', borderRadius: '8px' }}
                                        />
                                      ))}
                                    </Stack>
                                  </AccordionSummary>
                                  <AccordionDetails sx={{ p: 0, mt: 2 }}>
                                    {/* Current Live Classes */}
                                    {liveClasses.filter(cls => cls.teacherId === user.id && cls.status === 'active').length > 0 && (
                                      <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>
                                          Current Live Classes
                                        </Typography>
                                        <Stack spacing={1}>
                                          {liveClasses
                                            .filter(cls => cls.teacherId === user.id && cls.status === 'active')
                                            .map((cls, index) => (
                                              <Paper
                                                key={index}
                                                elevation={0}
                                sx={{ 
                                                  p: 1.5,
                                                  borderRadius: '8px',
                                                  border: '1px solid #eee',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'space-between'
                                                }}
                                              >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                  <LiveTvIcon sx={{ fontSize: 18, color: '#4CAF50' }} />
                                                  <Typography variant="body2">{cls.subject}</Typography>
                                                </Box>
                                                <Chip
                                                  label="Live Now"
                                                  size="small"
                                                  sx={{
                                                    backgroundColor: '#4CAF50',
                                                    color: 'white',
                                                    borderRadius: '8px',
                                                    height: '24px'
                                                  }}
                                                />
                                              </Paper>
                                            ))}
                                        </Stack>
                                      </Box>
                                    )}

                                    {/* Courses */}
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>
                                        Courses ({courses.filter(course => course.teacherId === user.id).length})
                                      </Typography>
                                      <Stack spacing={1}>
                                        {courses
                                          .filter(course => course.teacherId === user.id)
                                          .map((course, index) => (
                                            <Paper
                                              key={index}
                                              elevation={0}
                                              sx={{
                                                p: 1.5,
                                                borderRadius: '8px',
                                                border: '1px solid #eee'
                                              }}
                                            >
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {course.title}
                                                  </Typography>
                                                  <Typography variant="caption" sx={{ color: '#666' }}>
                                                    {course.schedule?.[0]?.day} {course.schedule?.[0]?.time}
                                                  </Typography>
                                                </Box>
                                                <Chip
                                                  label={`${course.enrolledCount || 0} students`}
                                                  size="small"
                                                  sx={{ backgroundColor: '#F5F5F5', borderRadius: '8px' }}
                                                />
                                              </Box>
                                            </Paper>
                                          ))}
                                      </Stack>
                                    </Box>

                                    {/* Assignments */}
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ color: '#666', mb: 1 }}>
                                        Assignments ({assignments.filter(assign => assign.teacherId === user.id).length})
                                      </Typography>
                                      <Stack spacing={1}>
                                        {assignments
                                          .filter(assign => assign.teacherId === user.id)
                                          .map((assign, index) => (
                                            <Paper
                                              key={index}
                                              elevation={0}
                                              sx={{
                                                p: 1.5,
                                                borderRadius: '8px',
                                                border: '1px solid #eee'
                                              }}
                                            >
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                    {assign.title}
                                                  </Typography>
                                                  <Typography variant="caption" sx={{ color: '#666' }}>
                                                    Due: {new Date(assign.dueDate).toLocaleDateString()}
                                                  </Typography>
                                                </Box>
                                                <Chip
                                                  label={`${assign.submissionCount || 0} submitted`}
                                                  size="small"
                                                  sx={{ backgroundColor: '#F5F5F5', borderRadius: '8px' }}
                                                />
                                              </Box>
                                            </Paper>
                                          ))}
                                      </Stack>
                                    </Box>
                                  </AccordionDetails>
                                </Accordion>
                              </Box>
                            </TableCell>
                          )}

                          {selectedUserType === 'students' && (
                            <>
                              <TableCell>
                                <Typography variant="body2">
                                  {user.class || 'Not assigned'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ width: '100%', maxWidth: 200 }}>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    {user.progress || 0}% Complete
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={user.progress || 0}
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: 'rgba(0,0,0,0.1)',
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: '#4CAF50'
                                      }
                                    }}
                                  />
                                </Box>
                              </TableCell>
                            </>
                          )}

                          {selectedUserType === 'parents' && (
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                {user.children?.map((child, index) => (
                                  <Chip
                                    key={index}
                                    avatar={
                                      <Avatar sx={{ width: 24, height: 24 }}>
                                        {child.name?.charAt(0)}
                                      </Avatar>
                                    }
                                    label={child.name}
                                    size="small"
                                    sx={{ backgroundColor: '#F5F5F5', borderRadius: '8px' }}
                                  />
                                ))}
                              </Stack>
                            </TableCell>
                          )}

                            <TableCell>
                              <Chip 
                                label={user.status || 'active'}
                                size="small"
                                sx={{ 
                                backgroundColor: '#F5F5F5',
                                  color: getStatusColor(user.status || 'active'),
                                borderRadius: '8px',
                                  fontWeight: 500
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuClick(e, user.id)}
                              sx={{
                                color: '#666',
                                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                              }}
                              >
                                <MoreIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
              </Box>
            )}

            {currentTab === 'system' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    System Performance
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<ReportsIcon />}
                    sx={{
                      bgcolor: '#000',
                      '&:hover': { bgcolor: '#333' }
                    }}
                    onClick={() => handleDownloadReport('system')}
                  >
                    Download Report
                  </Button>
                </Box>
                <Grid container spacing={3}>
                  {stats.map((stat, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          borderRadius: '12px',
                          border: '1px solid #eee',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: '#000',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          {stat.icon}
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {stat.title}
                          </Typography>
                        </Box>
                        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
                          {stat.value}
                        </Typography>
                        {stat.indicator}
                </Paper>
              </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {currentTab === 'reports' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Platform Reports
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                        borderRadius: '12px',
                        border: '1px solid #eee'
                    }}
                  >
                      <Typography variant="h6" sx={{ mb: 2 }}>User Activity</Typography>
                    <Stack spacing={2}>
                        <Button
                          variant="outlined"
                          startIcon={<AssessmentIcon />}
                          sx={{
                            borderColor: '#000',
                            color: '#000',
                            justifyContent: 'flex-start',
                            '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' }
                          }}
                          onClick={() => handleDownloadReport('user-activity')}
                        >
                          User Activity Report
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<PeopleIcon />}
                          sx={{
                            borderColor: '#000',
                            color: '#000',
                            justifyContent: 'flex-start',
                            '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' }
                          }}
                          onClick={() => handleDownloadReport('user-growth')}
                        >
                          User Growth Report
                        </Button>
                    </Stack>
                  </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                        borderRadius: '12px',
                        border: '1px solid #eee'
                    }}
                  >
                      <Typography variant="h6" sx={{ mb: 2 }}>System Reports</Typography>
                    <Stack spacing={2}>
                        <Button
                          variant="outlined"
                          startIcon={<PerformanceIcon />}
                          sx={{
                            borderColor: '#000',
                            color: '#000',
                            justifyContent: 'flex-start',
                            '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' }
                          }}
                          onClick={() => handleDownloadReport('performance')}
                        >
                          Performance Report
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<WarningIcon />}
                          sx={{
                              borderColor: '#000',
                            color: '#000',
                            justifyContent: 'flex-start',
                            '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' }
                          }}
                          onClick={() => handleDownloadReport('issues')}
                        >
                          Issue Report
                        </Button>
                    </Stack>
                  </Paper>
              </Grid>
            </Grid>
              </Box>
            )}

            {currentTab === 'issues' && (
              <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Platform Issues
                      </Typography>
                </Box>
                <Stack spacing={2}>
                  {activityLogs
                    .filter(log => log.type === 'issue')
                    .map((issue, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: '12px',
                        border: '1px solid #eee',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: '#000',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <WarningIcon sx={{ color: theme.palette.warning.main }} />
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {issue.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              Reported by: {issue.reportedBy}
                            </Typography>
                    </Box>
                        </Box>
                                <Chip 
                          label={issue.status || 'pending'}
                                  size="small" 
                                  sx={{ 
                            backgroundColor: '#F5F5F5',
                            color: getStatusColor(issue.status || 'pending'),
                            borderRadius: '8px'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {issue.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: '#000',
                            color: '#000',
                            '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' }
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          size="small"
                        variant="contained" 
                          sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
                      >
                          Resolve Issue
                      </Button>
                    </Box>
                  </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {currentTab === 'settings' && (
              <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Platform Settings
                      </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: '12px',
                        border: '1px solid #eee'
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 2 }}>General Settings</Typography>
                      <Stack spacing={2}>
                      <Button 
                          variant="outlined"
                          startIcon={<SettingsIcon />}
                          sx={{
                            borderColor: '#000',
                            color: '#000',
                            justifyContent: 'flex-start',
                            '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' }
                          }}
                        >
                          Platform Configuration
                      </Button>
                        <Button
                          variant="outlined"
                          startIcon={<DatabaseIcon />}
                                  sx={{
                            borderColor: '#000',
                            color: '#000',
                            justifyContent: 'flex-start',
                            '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' }
                          }}
                        >
                          Storage Management
                        </Button>
                      </Stack>
                  </Paper>
                </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: '12px',
                        border: '1px solid #eee'
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 2 }}>Security Settings</Typography>
                      <Stack spacing={2}>
                        <Button
                          variant="outlined"
                          startIcon={<SecurityIcon />}
                          sx={{
                            borderColor: '#000',
                            color: '#000',
                            justifyContent: 'flex-start',
                            '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' }
                          }}
                        >
                          Security Configuration
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<BackupIcon />}
                          sx={{
                            borderColor: '#000',
                            color: '#000',
                            justifyContent: 'flex-start',
                            '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' }
                          }}
                        >
                          Backup Settings
                        </Button>
                      </Stack>
                  </Paper>
                </Grid>
              </Grid>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            borderRadius: '12px',
            border: '1px solid #eee',
            mt: 1,
            '& .MuiMenuItem-root': {
              fontSize: '0.875rem',
              fontWeight: 500,
              py: 1
            }
          }
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ApproveIcon sx={{ mr: 1, fontSize: 20 }} />
          Approve
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
          Block
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleMenuClose} sx={{ color: theme.palette.error.main }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdminDashboard;
