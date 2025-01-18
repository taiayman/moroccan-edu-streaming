import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  LiveTv as LiveTvIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Forum as ForumIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

const DRAWER_WIDTH = 240;

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();

  const getMenuItems = () => {
    const commonItems = [
      {
        text: 'Settings',
        icon: <SettingsIcon />,
        path: '/settings'
      }
    ];

    const roleSpecificItems = {
      student: [
        {
          text: 'Dashboard',
          icon: <DashboardIcon />,
          path: '/student/dashboard'
        },
        {
          text: 'My Courses',
          icon: <SchoolIcon />,
          path: '/student/courses'
        },
        {
          text: 'Live Classes',
          icon: <LiveTvIcon />,
          path: '/student/live-classes'
        },
        {
          text: 'Assignments',
          icon: <AssignmentIcon />,
          path: '/student/assignments'
        },
        {
          text: 'Schedule',
          icon: <ScheduleIcon />,
          path: '/student/schedule'
        },
        {
          text: 'Discussion',
          icon: <ForumIcon />,
          path: '/student/discussion'
        }
      ],
      teacher: [
        {
          text: 'Dashboard',
          icon: <DashboardIcon />,
          path: '/teacher/dashboard'
        },
        {
          text: 'My Classes',
          icon: <SchoolIcon />,
          path: '/teacher/classes'
        },
        {
          text: 'Live Streaming',
          icon: <LiveTvIcon />,
          path: '/teacher/streaming'
        },
        {
          text: 'Students',
          icon: <PeopleIcon />,
          path: '/teacher/students'
        },
        {
          text: 'Assignments',
          icon: <AssignmentIcon />,
          path: '/teacher/assignments'
        },
        {
          text: 'Analytics',
          icon: <AssessmentIcon />,
          path: '/teacher/analytics'
        }
      ],
      parent: [
        {
          text: 'Dashboard',
          icon: <DashboardIcon />,
          path: '/parent/dashboard'
        },
        {
          text: 'Children',
          icon: <PeopleIcon />,
          path: '/parent/children'
        },
        {
          text: 'Progress',
          icon: <AssessmentIcon />,
          path: '/parent/progress'
        },
        {
          text: 'Schedule',
          icon: <ScheduleIcon />,
          path: '/parent/schedule'
        }
      ],
      admin: [
        {
          text: 'Dashboard',
          icon: <DashboardIcon />,
          path: '/admin/dashboard'
        },
        {
          text: 'Users',
          icon: <PeopleIcon />,
          path: '/admin/users'
        },
        {
          text: 'Courses',
          icon: <SchoolIcon />,
          path: '/admin/courses'
        },
        {
          text: 'Analytics',
          icon: <AssessmentIcon />,
          path: '/admin/analytics'
        }
      ]
    };

    return [...(roleSpecificItems[userData?.role] || []), ...commonItems];
  };

  const drawerContent = (
    <Box sx={{ overflow: 'auto' }}>
      <List>
        {getMenuItems().map((item, index) => (
          <React.Fragment key={item.text}>
            {index > 0 && index === getMenuItems().length - 1 && (
              <Divider sx={{ my: 1 }} />
            )}
            <ListItem disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) {
                    onClose();
                  }
                }}
                sx={{
                  minHeight: 48,
                  px: 2.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 3,
                    justifyContent: 'center',
                    color: location.pathname === item.path ? 'primary.main' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    color: location.pathname === item.path ? 'primary.main' : 'inherit',
                  }}
                />
              </ListItemButton>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { sm: DRAWER_WIDTH },
        flexShrink: { sm: 0 }
      }}
    >
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{
            keepMounted: true // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid rgba(0, 0, 0, 0.12)',
              boxShadow: 'none'
            }
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid rgba(0, 0, 0, 0.12)',
              boxShadow: 'none',
              top: '64px',
              height: 'calc(100% - 64px)'
            }
          }}
          open
        >
          {drawerContent}
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;
