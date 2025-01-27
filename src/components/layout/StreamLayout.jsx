import React from 'react';
import { Box } from '@mui/material';

const StreamLayout = ({ children }) => {
  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#1a1a1a',
        '& .MuiIconButton-root': {
          color: '#fff'
        }
      }}
    >
      {children}
    </Box>
  );
};

export default StreamLayout; 