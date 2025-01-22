import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  LinearProgress,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
  DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import { useDraggable } from '@dnd-kit/core';

const DraggableAssignmentCard = ({ assignment }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
    transition
  } = useDraggable({
    id: assignment.id,
    data: assignment
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    transition,
  } : undefined;

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return '#4CAF50';
      case 'not_submitted':
        return '#FFA000';
      case 'graded':
        return '#2196F3';
      default:
        return '#666666';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'submitted':
        return 'Soumis';
      case 'not_submitted':
        return 'Non soumis';
      case 'graded':
        return 'Noté';
      default:
        return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid #eee',
          borderRadius: '12px',
          transition: 'all 0.2s',
          opacity: isDragging ? 0.5 : 1,
          cursor: 'grab',
          backgroundColor: '#fff',
          position: 'relative',
          userSelect: 'none',
          '&:hover': {
            borderColor: '#000',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          },
          '&:active': {
            cursor: 'grabbing',
            transform: 'scale(1.02)'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 1,
              }}
            >
              <DragIndicatorIcon 
                sx={{ 
                  color: '#666'
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {assignment.title}
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {assignment.description}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(assignment.status)}
            sx={{
              backgroundColor: getStatusColor(assignment.status),
              color: 'white',
              fontWeight: 500
            }}
          />
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            icon={<AccessTimeIcon />}
            label={`Date limite: ${formatDate(assignment.dueDate)}`}
            variant="outlined"
          />
          <Chip
            icon={<AssignmentIcon />}
            label={`Cours: ${assignment.courseId}`}
            variant="outlined"
          />
        </Stack>

        {assignment.status === 'graded' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Note: {assignment.grade}/100
            </Typography>
            <LinearProgress
              variant="determinate"
              value={assignment.grade}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#4CAF50'
                }
              }}
            />
          </Box>
        )}
      </Paper>
    </div>
  );
};

export default DraggableAssignmentCard; 