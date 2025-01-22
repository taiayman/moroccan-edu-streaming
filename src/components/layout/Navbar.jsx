import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Button,
  Divider,
  ListItemIcon
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useAuth } from '../../store/authStore';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { icon: <AccountIcon fontSize="small" />, text: 'Profile', action: () => navigate('/profile') },
    { icon: <SettingsIcon fontSize="small" />, text: 'Paramètres', action: () => navigate('/settings') },
    { icon: <HelpIcon fontSize="small" />, text: 'Aide', action: () => navigate('/help') }
  ];

  return (
    <AppBar 
      position="fixed"
      elevation={0}
      sx={{ 
        backgroundColor: '#ffffff',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo/Brand */}
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#000',
            fontWeight: 700,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          EduPlatform
        </Typography>

        {/* Right Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Help Button */}
          <Button
            startIcon={<HelpIcon />}
            sx={{
              color: '#666',
              textTransform: 'none',
              '&:hover': {
                color: '#bb5c39'
              }
            }}
          >
            Aide
          </Button>

          {/* Notifications */}
          <IconButton
            size="large"
            sx={{ 
              color: '#666',
              '&:hover': {
                color: '#bb5c39'
              }
            }}
          >
            <NotificationsIcon />
          </IconButton>

          {/* Profile Menu */}
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={handleMenu}
              size="small"
              sx={{ 
                ml: 1,
                '&:hover': {
                  color: '#bb5c39'
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  backgroundColor: '#bb5c39',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                {user?.displayName?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              onClick={handleClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  minWidth: 200,
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  mt: 1.5,
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1.5,
                    gap: 1.5,
                    '&:hover': {
                      backgroundColor: 'rgba(187, 92, 57, 0.05)'
                    }
                  }
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {user?.displayName || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  {user?.email}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              {menuItems.map((item, index) => (
                <MenuItem key={index} onClick={item.action}>
                  <ListItemIcon sx={{ color: '#666' }}>
                    {item.icon}
                  </ListItemIcon>
                  {item.text}
                </MenuItem>
              ))}
              <Divider sx={{ my: 1 }} />
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  color: '#bb5c39',
                  '&:hover': {
                    backgroundColor: 'rgba(187, 92, 57, 0.05)'
                  }
                }}
              >
                <ListItemIcon sx={{ color: '#bb5c39' }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Se déconnecter
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
