import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Language as LanguageIcon
} from '@mui/icons-material';
import { getCurrentLanguage } from '../../utils/navigation';

const AuthNavbar = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [languageAnchorEl, setLanguageAnchorEl] = React.useState(null);

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
        <Box
          component="img"
          src="/images/logo.jpg"
          alt="Logo"
          sx={{
            width: 40,
            height: 40,
            cursor: 'pointer',
            borderRadius: '12px', // Squircle effect
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)'
            }
          }}
          onClick={() => navigate(`/${getCurrentLanguage()}`)}
        />

        {/* Language Switcher */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            onClick={handleLanguageMenu}
            size="large"
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
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AuthNavbar;