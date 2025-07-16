/**
 * Utility function for HTTP-only cookie logout
 * Use this across the app for consistent logout behavior
 */
export const performLogout = async (redirectPath: string = '/login') => {
  try {
    // Call the logout API to clear HTTP-only cookie
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Include HTTP-only cookies
    });
    
    console.log('✅ Logout successful - HTTP-only cookie cleared');
    return { success: true };
  } catch (error) {
    console.error('❌ Logout failed:', error);
    return { success: false, error };
  } finally {
    // Always redirect to login, even if API call fails
    if (typeof window !== 'undefined') {
      window.location.href = redirectPath;
    }
  }
};

/**
 * Logout with router navigation (for Next.js components)
 */
export const performLogoutWithRouter = async (router: any, redirectPath: string = '/login') => {
  try {
    // Call the logout API to clear HTTP-only cookie
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Include HTTP-only cookies
    });
    
    console.log('✅ Logout successful - HTTP-only cookie cleared');
    return { success: true };
  } catch (error) {
    console.error('❌ Logout failed:', error);
    return { success: false, error };
  } finally {
    // Always redirect to login, even if API call fails
    router.replace(redirectPath);
  }
};
