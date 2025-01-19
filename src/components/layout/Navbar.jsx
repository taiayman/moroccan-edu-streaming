import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Box,
  useTheme,
  useMediaQuery,
  Badge,
  Container,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';
import { auth } from '../../api/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Get user data from localStorage to include role
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser({
          ...user,
          role: userData?.role || 'student',
          displayName: user.displayName || userData?.displayName || 'User'
        });
      } else {
        setUser(null);
        navigate('/auth/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageMenu = (event) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenu = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageClose = () => {
    setLangAnchorEl(null);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'student':
        return '/student/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'parent':
        return '/parent/dashboard';
      default:
        return '/';
    }
  };

  if (!user) return null;

  return (
    <AppBar 
      position="fixed" 
      sx={{
        backgroundColor: '#fff',
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ minHeight: '70px', px: { xs: 0 } }}>
          {isMobile && (
            <IconButton
              edge="start"
              sx={{ mr: 2, color: '#666' }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h5"
            component="div"
            sx={{
              flexGrow: 1,
              color: '#000',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: { xs: '1.2rem', sm: '1.5rem' }
            }}
            onClick={() => navigate(getDashboardPath())}
          >
            EduPlatform
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mr: 4 }}>
              <Button 
                sx={{ 
                  color: '#666',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#000'
                  }
                }} 
                onClick={() => navigate(getDashboardPath())}
              >
                Dashboard
              </Button>
              {user?.role === 'student' && (
                <Button 
                  sx={{ 
                    color: '#666',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: '#000'
                    }
                  }} 
                  onClick={() => navigate('/student/courses')}
                >
                  My Courses
                </Button>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              sx={{ 
                color: '#666',
                '&:hover': { color: '#000' }
              }}
              onClick={handleLanguageMenu}
            >
              <LanguageIcon />
            </IconButton>

            <IconButton
              sx={{ 
                color: '#666',
                '&:hover': { color: '#000' }
              }}
              onClick={handleNotificationsMenu}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                ml: 1,
                '&:hover': {
                  '& .MuiTypography-root': { color: '#000' },
                  '& .MuiSvgIcon-root': { color: '#000' }
                }
              }}
              onClick={handleMenu}
            >
              <Avatar
                alt={user.displayName}
                src={user.photoURL}
                sx={{
                  width: 38,
                  height: 38,
                  border: '2px solid #eee'
                }}
              />
              {!isMobile && (
                <>
                  <Box sx={{ ml: 1, mr: 0.5 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: '#333',
                        fontWeight: 600,
                        lineHeight: 1.2
                      }}
                    >
                      {user.displayName}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#666',
                        display: 'block',
                        lineHeight: 1.2,
                        textTransform: 'capitalize'
                      }}
                    >
                      {user.role}
                    </Typography>
                  </Box>
                  <KeyboardArrowDownIcon sx={{ color: '#666', fontSize: 20 }} />
                </>
              )}
            </Box>
          </Box>

          {/* Language Menu */}
          <Menu
            anchorEl={langAnchorEl}
            open={Boolean(langAnchorEl)}
            onClose={handleLanguageClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <MenuItem onClick={handleLanguageClose}>English</MenuItem>
            <MenuItem onClick={handleLanguageClose}>العربية</MenuItem>
            <MenuItem onClick={handleLanguageClose}>Français</MenuItem>
          </Menu>

          {/* Notifications Menu */}
          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={handleNotificationsClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 320,
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <Box sx={{ p: 2, pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleNotificationsClose} sx={{ py: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  New assignment posted
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Mathematics: Calculus Chapter 3
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <Box sx={{ p: 1 }}>
              <Button fullWidth sx={{ color: '#666' }}>
                View All Notifications
              </Button>
            </Box>
          </Menu>

          {/* User Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <MenuItem onClick={() => {
              handleClose();
              navigate('/profile');
            }}>
              Profile
            </MenuItem>
            <MenuItem onClick={() => {
              handleClose();
              navigate('/settings');
            }}>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem 
              onClick={() => {
                handleClose();
                handleLogout();
              }}
              sx={{ color: 'error.main' }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;