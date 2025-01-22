export const navigateByRole = (navigate, role) => {
  switch (role.toLowerCase()) {
    case 'admin':
      navigate('/admin/dashboard');
      break;
    case 'teacher':
      navigate('/teacher/dashboard');
      break;
    case 'parent':
      navigate('/parent/dashboard');
      break;
    case 'student':
      navigate('/student/dashboard');
      break;
    default:
      console.error('Unknown role:', role);
      navigate('/auth/login');
      break;
  }
};

export const isAuthorizedForRoute = (user, path) => {
  if (!user) return false;
  
  if (path.startsWith('/admin') && user.role !== 'admin') return false;
  if (path.startsWith('/teacher') && user.role !== 'teacher') return false;
  if (path.startsWith('/parent') && user.role !== 'parent') return false;
  if (path.startsWith('/student') && user.role !== 'student') return false;
  
  return true;
};