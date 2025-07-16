import authService from '@/service/auth-service';

/**
 * Check if user is authenticated
 * Use this in components or pages that need auth status
 */
export const checkAuthentication = async () => {
  try {
    const user = await authService.checkAuth();
    return { isAuthenticated: !!user, user };
  } catch (error) {
    return { isAuthenticated: false, user: null };
  }
};

/**
 * Redirect to login if not authenticated
 * Use this in protected pages
 */
export const requireAuth = async () => {
  const { isAuthenticated } = await checkAuthentication();
  
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return false;
  }
  
  return true;
};

/**
 * Handle login with error handling
 */
export const handleLogin = async (mobile: string, password: string) => {
  try {
    const response = await authService.login({ mobile, password });
    
    if (response.success) {
      return { success: true, user: response.user, message: response.message };
    } else {
      return { success: false, error: response.message || 'Login failed' };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Login failed' };
  }
};

/**
 * Handle logout with error handling
 */
export const handleLogout = async () => {
  try {
    await authService.logout();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Logout failed:', error);
    return { success: false, error: error.message || 'Logout failed' };
  }
};

/**
 * Get current user data
 */
export const getCurrentUser = async () => {
  try {
    const user = await authService.getCurrentUser();
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

/**
 * Refresh user data from server
 */
export const refreshUserData = async () => {
  try {
    const user = await authService.refreshUser();
    return user;
  } catch (error) {
    console.error('Failed to refresh user data:', error);
    return null;
  }
};
