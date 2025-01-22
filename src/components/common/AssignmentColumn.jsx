import React from 'react';
import { Paper, Typography, Box, Stack } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';

const AssignmentColumn = ({ id, title, count, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      sx={{
        width: '100%',
        minWidth: 350,
        height: 'fit-content',
        backgroundColor: isOver ? '#f8f8f8' : '#fff',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: isOver ? '#000' : '#eee',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: '8px',
          left: '8px',
          right: '-8px',
          bottom: '-8px',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '16px',
          zIndex: 0
        }
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Column Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid #eee'
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                px: 1.5,
                py: 0.5,
                backgroundColor: '#f0f0f0',
                borderRadius: '12px',
                fontWeight: 500
              }}
            >
              {count}
            </Typography>
          </Stack>
        </Box>

        {/* Column Content */}
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {children}
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
};

export default AssignmentColumn; 