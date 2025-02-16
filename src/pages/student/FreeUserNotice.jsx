import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  WorkspacePremium as PremiumIcon,
  LiveTv as LiveTvIcon,
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';

// Create rtl cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Add Arabic font
const fontFamily = "'Noto Kufi Arabic', sans-serif";

// Create RTL theme with Arabic font
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: fontFamily,
    h3: {
      fontFamily: fontFamily,
      fontWeight: 600,
    },
    body1: {
      fontFamily: fontFamily,
    },
    button: {
      fontFamily: fontFamily,
      fontWeight: 500,
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap');
        body { font-family: ${fontFamily}; }
      `,
    },
  },
});

const FreeUserNotice = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <LiveTvIcon sx={{ fontSize: 40, color: '#00FFA3' }} />,
      title: 'الدروس المباشرة',
      description: 'حضور جميع الحصص المباشرة والتفاعل مع المعلمين'
    },
    {
      icon: <AssignmentIcon sx={{ fontSize: 40, color: '#00FFA3' }} />,
      title: 'الواجبات والتمارين',
      description: 'الوصول إلى جميع الواجبات والتمارين مع التصحيح المباشر'
    },
    {
      icon: <CalendarIcon sx={{ fontSize: 40, color: '#00FFA3' }} />,
      title: 'جدول الحصص',
      description: 'متابعة جدول الحصص الأسبوعي وتنظيم وقت الدراسة'
    }
  ];

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <>
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap');
              * { font-family: ${fontFamily}; }
            `}
          </style>
          <Container 
            maxWidth={false} 
            sx={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(145deg, #1a1f2c 0%, #2d3748 100%)',
              position: 'relative',
              px: 0
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
                py: 1.5,
                borderRadius: 0
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PremiumIcon sx={{ color: '#00FFA3', fontSize: 28 }} />
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, fontFamily }}>
                  ترقية الحساب
                </Typography>
              </Box>
            </Paper>

            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              sx={{
                width: '100%',
                maxWidth: '800px',
                mx: 'auto',
                px: 2,
                py: 4,
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.95rem',
                  mb: 4,
                  textAlign: 'center'
                }}
              >
                للاستفادة من جميع المميزات، يرجى التواصل مع المشرف لترقية حسابك إلى النسخة الكاملة
              </Typography>

              <Grid container spacing={3}>
                {features.map((feature, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card 
                      component={motion.div}
                      whileHover={{ y: -4 }}
                      sx={{ 
                        height: '100%',
                        backgroundColor: 'rgba(26,32,44,0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        '&:hover': {
                          borderColor: '#00FFA3'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Box sx={{ mb: 2 }}>
                          {feature.icon}
                        </Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600,
                            mb: 1,
                            color: '#fff'
                          }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography 
                          variant="body2"
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)'
                          }}
                        >
                          {feature.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Container>
        </>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default FreeUserNotice;