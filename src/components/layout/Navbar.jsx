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
    }
  ];

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 0
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo/Brand */}
        <Typography
          variant="h6"
          sx={{
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            letterSpacing: '-0.02em'
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
              color: 'rgba(148, 163, 184, 0.8)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                color: '#00FFA3',
                transform: 'translateY(-2px)',
                backgroundColor: 'rgba(0, 255, 163, 0.08)'
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
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                mt: 1.5,
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                '& .MuiMenuItem-root': {
                  color: 'rgba(148, 163, 184, 0.8)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 255, 163, 0.08)',
                    color: '#00FFA3',
                    transform: 'translateX(5px)'
                  }
                }
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

          {/* Profile Menu */}
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={handleMenu}
              size="small"
              aria-label={t('nav.openUserMenu')}
              sx={{
                ml: 1,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: 'rgba(0, 255, 163, 0.1)',
                  color: '#00FFA3',
                  border: '2px solid #00FFA3',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: '"Plus Jakarta Sans", sans-serif'
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
                  minWidth: 220,
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  mt: 1.5,
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1.5,
                    gap: 1.5,
                    color: 'rgba(148, 163, 184, 0.8)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 255, 163, 0.08)',
                      color: '#00FFA3',
                      transform: 'translateX(5px)',
                      '& .MuiListItemIcon-root': {
                        color: '#00FFA3'
                      }
                    }
                  }
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#fff',
                    fontFamily: '"Plus Jakarta Sans", sans-serif'
                  }}
                >
                  {user?.displayName || t('nav.defaultUserName')}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(148, 163, 184, 0.8)',
                    fontFamily: '"Plus Jakarta Sans", sans-serif'
                  }}
                >
                  {user?.email}
                </Typography>
              </Box>
              <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
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
              <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              <MenuItem
                onClick={handleLogout}
                sx={{
                  color: '#FCA5A5 !important',
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.08) !important',
                    color: '#EF4444 !important',
                    '& .MuiListItemIcon-root': {
                      color: '#EF4444 !important'
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ color: '#FCA5A5' }}>
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
