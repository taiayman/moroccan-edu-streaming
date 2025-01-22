import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Alert,
  Stack
} from '@mui/material';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { useAuth } from '../../hooks/useAuth';
import { getUpcomingAssignments, getSubmissionStatus, updateAssignmentStatus } from '../../api/assignments';
import ShimmerCard from '../../components/common/ShimmerCard';
import AssignmentColumn from '../../components/common/AssignmentColumn';
import DraggableAssignmentCard from '../../components/common/DraggableAssignmentCard';

const AssignmentsPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        console.log('Fetching assignments for user:', user);
        const assignmentsData = await getUpcomingAssignments(user.id);
        console.log('Fetched assignments:', assignmentsData);
        
        // Get submission status for each assignment
        const assignmentsWithStatus = await Promise.all(
          assignmentsData.map(async (assignment) => {
            const status = await getSubmissionStatus(user.id, assignment.id);
            return {
              ...assignment,
              status: status.status || 'not_submitted',
              submittedAt: status.submittedAt,
              grade: status.grade
            };
          })
        );

        setAssignments(assignmentsWithStatus);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchAssignments();
    }
  }, [user?.id]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const assignment = assignments.find(a => a.id === active.id);
      if (assignment && over.id !== assignment.status) {
        try {
          // Optimistic update
          setAssignments(assignments.map(a => 
            a.id === active.id ? { ...a, status: over.id } : a
          ));

          // Update in backend
          await updateAssignmentStatus(user.id, active.id, over.id);
        } catch (error) {
          console.error('Error updating assignment status:', error);
          // Revert on error
          setAssignments(assignments);
          setError('Failed to update assignment status. Please try again.');
        }
      }
    }
  };

  const getColumnAssignments = (status) => 
    assignments.filter(a => a.status === status);

  const columns = [
    { id: 'not_submitted', title: 'À faire' },
    { id: 'submitted', title: 'Soumis' },
    { id: 'graded', title: 'Notés' }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f2f0e9',
      pt: '90px',
      pb: 4
    }}>
      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          Devoirs
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Stack spacing={3}>
            {[1, 2, 3].map((index) => (
              <ShimmerCard key={index} height={140} />
            ))}
          </Stack>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: 3,
                alignItems: 'start'
              }}
            >
              {columns.map(column => (
                <AssignmentColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  count={getColumnAssignments(column.id).length}
                >
                  {getColumnAssignments(column.id).map(assignment => (
                    <DraggableAssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                    />
                  ))}
                </AssignmentColumn>
              ))}
            </Box>

            <DragOverlay>
              {activeId ? (
                <DraggableAssignmentCard
                  assignment={assignments.find(a => a.id === activeId)}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </Container>
    </Box>
  );
};

export default AssignmentsPage;
