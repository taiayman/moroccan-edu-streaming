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
  LinearProgress
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
  Dns as ServerIcon
} from '@mui/icons-material';
import { useAuth } from '../../store/authStore';
import { getAllUsers, getActivityLogs, getSystemSettings, getAnalyticsData } from '../../api/admin';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, logsData, analyticsData] = await Promise.all([
        getAllUsers(),
        getActivityLogs(),
        getAnalyticsData()
      ]);
      setUsers(usersData || []);
      setActivityLogs(logsData || []);
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

  const stats = [
    {
      title: 'Santé du Système',
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
      title: 'Charge Serveur',
      value: `${analytics.serverLoad || 45}%`,
      icon: <ServerIcon sx={{ fontSize: 28, color: '#000' }} />,
      indicator: (
        <LinearProgress 
          variant="determinate" 
          value={analytics.serverLoad || 45}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(0,0,0,0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#FFA000'
            }
          }}
        />
      )
    },
    {
      title: 'Stockage Utilisé',
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
            transform: 'translate(-4px, -4px)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {stat.icon}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {stat.value}
        </Typography>
        <Typography variant="body1" sx={{ color: '#666', mb: 2 }}>
          {stat.title}
        </Typography>
        {stat.indicator}
      </Paper>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f2f0e9',
      pt: '90px',
      pb: 4
    }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Console d'Administration
              </Typography>
              <Typography variant="body1" sx={{ color: '#666' }}>
                Surveillance et gestion du système
              </Typography>
            </Box>

            {/* System Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {stats.map((stat, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <StatCard stat={stat} />
                </Grid>
              ))}
            </Grid>

            {/* User Management */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Box sx={{ 
                    p: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Gestion des Utilisateurs
                    </Typography>
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: '#000',
                        color: '#fff',
                        '&:hover': {
                          backgroundColor: '#333'
                        }
                      }}
                      onClick={() => navigate('/admin/users/new')}
                    >
                      Ajouter Utilisateur
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Utilisateur</TableCell>
                          <TableCell>Rôle</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {users.slice(0, 5).map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="subtitle2">
                                  {user.displayName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#666' }}>
                                  {user.email}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={user.role}
                                size="small"
                                sx={{ 
                                  backgroundColor: '#F5F5F5',
                                  fontWeight: 500
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={user.status || 'active'}
                                size="small"
                                sx={{ 
                                  backgroundColor: 'rgba(0,0,0,0.05)',
                                  color: getStatusColor(user.status || 'active'),
                                  fontWeight: 500
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuClick(e, user.id)}
                              >
                                <MoreIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                  {/* System Alerts */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: '16px',
                      border: '1px solid rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                      Alertes Système
                    </Typography>
                    <Stack spacing={2}>
                      {activityLogs.slice(0, 3).map((log, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: 'rgba(0,0,0,0.02)',
                            border: '1px solid rgba(0,0,0,0.1)'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <WarningIcon sx={{ color: '#FFA000', fontSize: 20 }} />
                            <Typography variant="subtitle2">
                              {log.action}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>

                  {/* Quick Actions */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: '16px',
                      border: '1px solid rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                      Actions Rapides
                    </Typography>
                    <Stack spacing={2}>
                      {[
                        { icon: <ReportsIcon />, text: 'Générer Rapport', action: '/admin/reports' },
                        { icon: <SettingsIcon />, text: 'Paramètres Système', action: '/admin/settings' },
                        { icon: <DatabaseIcon />, text: 'Sauvegarde', action: '/admin/backup' }
                      ].map((action, index) => (
                        <Button
                          key={index}
                          variant="outlined"
                          startIcon={action.icon}
                          onClick={() => navigate(action.action)}
                          sx={{
                            justifyContent: 'flex-start',
                            borderColor: 'rgba(0,0,0,0.1)',
                            color: '#000',
                            '&:hover': {
                              borderColor: '#000',
                              backgroundColor: 'rgba(0,0,0,0.02)'
                            }
                          }}
                        >
                          {action.text}
                        </Button>
                      ))}
                    </Stack>
                  </Paper>
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            borderRadius: '12px'
          }
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Modifier
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ApproveIcon sx={{ mr: 1, fontSize: 20 }} />
          Approuver
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
          Bloquer
        </MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={handleMenuClose} sx={{ color: '#F44336' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Supprimer
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdminDashboard;