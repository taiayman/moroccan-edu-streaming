import React from 'react';
import { Box } from '@mui/material';

const StreamLayout = ({ children }) => {
  return (
    <Box sx={{ 
      height: '100vh',
      backgroundColor: '#1a1a1a'
    }}>
      {children}
    </Box>
  );
};

export default StreamLayout; 