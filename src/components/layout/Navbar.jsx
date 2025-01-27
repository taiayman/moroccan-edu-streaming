import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  ListItemIcon,
  Select
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { useAuth } from '../../store/authStore';
import { getCurrentLanguage } from '../../utils/navigation';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [languageAnchorEl, setLanguageAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageMenu = (event) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    handleLanguageClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate(`/${getCurrentLanguage()}/auth/login`);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    {
      icon: <AccountIcon fontSize="small" />,
      text: t('nav.profile'),
      action: () => navigate(`/${getCurrentLanguage()}/${user?.role || 'student'}/profile`)
    },
    { 
      icon: <SettingsIcon fontSize="small" />, 
      text: t('nav.settings'), 
      action: () => navigate(`/${getCurrentLanguage()}/settings`) 
    },
    { 
      icon: <HelpIcon fontSize="small" />, 
      text: t('nav.help'), 
      action: () => navigate(`/${getCurrentLanguage()}/help`) 
    }
  ];

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        // Remove any corner rounding for the AppBar
        borderRadius: 0
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
          onClick={() => navigate(`/${getCurrentLanguage()}`)}
        >
          {t('nav.brand')}
        </Typography>

        {/* Right Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Language Switcher */}
          <IconButton
            onClick={handleLanguageMenu}
            size="large"
            aria-label={t('nav.language')}
            sx={{
              color: '#666',
              borderRadius: 0,
              '&:hover': {
                color: '#bb5c39'
              }
            }}
          >
            <LanguageIcon />
          </IconButton>
          <Menu
            anchorEl={languageAnchorEl}
            open={Boolean(languageAnchorEl)}
            onClose={handleLanguageClose}
            PaperProps={{
              elevation: 0,
              sx: {
                minWidth: 120,
                backgroundColor: '#ffffff',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                mt: 1.5,
                borderRadius: 0
              }
            }}
          >
            <MenuItem onClick={() => handleLanguageChange('ar')} selected={i18n.language === 'ar'}>
              العربية
            </MenuItem>
            <MenuItem onClick={() => handleLanguageChange('en')} selected={i18n.language === 'en'}>
              English
            </MenuItem>
            <MenuItem onClick={() => handleLanguageChange('fr')} selected={i18n.language === 'fr'}>
              Français
            </MenuItem>
          </Menu>

          {/* Help Button */}
          <Button
            startIcon={<HelpIcon />}
            sx={{
              color: '#666',
              textTransform: 'none',
              // Remove corner rounding
              borderRadius: 0,
              '&:hover': {
                color: '#bb5c39'
              }
            }}
            onClick={() => navigate(`/${getCurrentLanguage()}/help`)}
          >
            {t('nav.help')}
          </Button>

          {/* Notifications */}
          <IconButton
            size="large"
            aria-label={t('nav.notifications')}
            sx={{
              color: '#666',
              borderRadius: 0, // Remove corner rounding
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
              aria-label={t('nav.openUserMenu')}
              sx={{
                ml: 1,
                borderRadius: 0, // Remove corner rounding
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
                  // Keep default rounded shape for the Avatar (remove borderRadius override)
                }}
              >
                {user?.displayName?.charAt(0) || t('nav.defaultUserInitial')}
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
                  // Remove corner rounding for the Menu
                  borderRadius: 0,
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
                  {user?.displayName || t('nav.defaultUserName')}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  {user?.email}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              {menuItems.map((item, index) => (
                <MenuItem
                  key={index}
                  onClick={item.action}
                  sx={{
                    borderRadius: 0 // Remove corner rounding for menu items
                  }}
                >
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
                  borderRadius: 0, // Remove corner rounding
                  '&:hover': {
                    backgroundColor: 'rgba(187, 92, 57, 0.05)'
                  }
                }}
              >
                <ListItemIcon sx={{ color: '#bb5c39' }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                {t('nav.logout')}
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
