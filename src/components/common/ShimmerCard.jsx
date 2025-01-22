import React from 'react';
import { Paper, Box, Stack } from '@mui/material';

const ShimmerCard = ({ height = 120 }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      border: '1px solid #eee',
      borderRadius: '12px',
      height: 'auto',
      overflow: 'hidden',
      position: 'relative',
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.8) 50%,
          rgba(255, 255, 255, 0) 100%
        )`,
        animation: 'shimmer 1.5s infinite',
        transform: 'translateX(-100%)',
      },
      '@keyframes shimmer': {
        '100%': {
          transform: 'translateX(100%)',
        },
      },
    }}
  >
    {/* Header section */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Box sx={{ flex: 1, mr: 3 }}>
        {/* Title */}
        <Box
          sx={{
            width: '70%',
            height: 28,
            backgroundColor: '#f0f0f0',
            borderRadius: 1,
            mb: 2
          }}
        />
        {/* Description */}
        <Box
          sx={{
            width: '90%',
            height: 16,
            backgroundColor: '#f5f5f5',
            borderRadius: 1,
            mb: 1
          }}
        />
        <Box
          sx={{
            width: '60%',
            height: 16,
            backgroundColor: '#f5f5f5',
            borderRadius: 1
          }}
        />
      </Box>
      {/* Status chip */}
      <Box
        sx={{
          width: 90,
          height: 32,
          backgroundColor: '#f0f0f0',
          borderRadius: 4
        }}
      />
    </Box>

    {/* Footer section */}
    <Stack direction="row" spacing={2}>
      {/* Date chip */}
      <Box
        sx={{
          width: 200,
          height: 32,
          backgroundColor: '#f0f0f0',
          borderRadius: 4
        }}
      />
      {/* Course chip */}
      <Box
        sx={{
          width: 150,
          height: 32,
          backgroundColor: '#f0f0f0',
          borderRadius: 4
        }}
      />
    </Stack>

    {/* Progress bar (optional) */}
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          width: '40%',
          height: 16,
          backgroundColor: '#f5f5f5',
          borderRadius: 1,
          mb: 1
        }}
      />
      <Box
        sx={{
          width: '100%',
          height: 8,
          backgroundColor: '#f0f0f0',
          borderRadius: 4
        }}
      />
    </Box>
  </Paper>
);

export default ShimmerCard; 