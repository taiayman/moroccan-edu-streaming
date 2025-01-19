export const navigateByRole = (navigate, role) => {
  switch (role) {
    case 'teacher':
      navigate('/teacher/dashboard');
      break;
    case 'parent':
      navigate('/parent/dashboard');
      break;
    case 'student':
    default:
      navigate('/student/dashboard');
      break;
  }
};