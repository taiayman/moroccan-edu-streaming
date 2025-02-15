export const getCurrentLanguage = () => {
  const path = window.location.pathname;
  const match = path.match(/^\/(ar|en|fr)\//);
  return match ? match[1] : 'ar';
};

export const navigateByRole = (navigate, role) => {
  const lang = getCurrentLanguage();
  switch (role.toLowerCase()) {
    case 'admin':
      navigate(`/${lang}/admin/dashboard`);
      break;
    case 'teacher': 
      navigate(`/${lang}/teacher/dashboard`);
      break;
    case 'parent':
      navigate(`/${lang}/parent/dashboard`);
      break;
    case 'student':
      navigate(`/${lang}/student/dashboard`);
      break;
    default:
      console.error('Unknown role:', role);
      navigate(`/${lang}/auth/login`);
      break;
  }
};

export const isAuthorizedForRoute = (user, path) => {
  if (!user) return false;
  
  // Remove language prefix for role checking
  const pathWithoutLang = path.replace(/^\/(ar|en|fr)\//, '/');
  
  if (pathWithoutLang.startsWith('/admin') && user.role !== 'admin') return false;
  if (pathWithoutLang.startsWith('/teacher') && user.role !== 'teacher') return false;
  if (pathWithoutLang.startsWith('/parent') && user.role !== 'parent') return false;
  if (pathWithoutLang.startsWith('/student') && user.role !== 'student') return false;
  
  return true;
};