// Example usage of HTTP-only cookie authentication

import authService from '@/service/auth-service';
import apiService from '@/service/api-service';
import { handleLogin, handleLogout, checkAuthentication } from '@/lib/auth-utils';

// Example 1: Login in a component
export const loginExample = async () => {
  const result = await handleLogin('9876543210', 'password123');
  
  if (result.success) {
    console.log('Login successful:', result.user);
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } else {
    console.error('Login failed:', result.error);
  }
};

// Example 2: Check authentication status
export const checkAuthExample = async () => {
  const { isAuthenticated, user } = await checkAuthentication();
  
  if (isAuthenticated) {
    console.log('User is authenticated:', user);
  } else {
    console.log('User is not authenticated');
    // Redirect to login
    window.location.href = '/login';
  }
};

// Example 3: Make authenticated API calls
export const apiCallExample = async () => {
  try {
    // All API calls automatically include HTTP-only cookies
    const matches = await apiService.getAllStoredMatches();
    console.log('Matches:', matches);
    
    const userData = await apiService.getUserData();
    console.log('User data:', userData);
    
    // Buy a player
    const buyResult = await apiService.buyPlayer({
      matchId: 'match123',
      playerId: 'player456',
      quantity: 10,
      price: 100
    });
    console.log('Buy result:', buyResult);
    
  } catch (error) {
    console.error('API call failed:', error);
    // If 401, user needs to login again
    if (error.message.includes('401')) {
      window.location.href = '/login';
    }
  }
};

// Example 4: Logout
export const logoutExample = async () => {
  const result = await handleLogout();
  
  if (result.success) {
    console.log('Logout successful');
    // User is redirected to login automatically
  } else {
    console.error('Logout failed:', result.error);
  }
};

// Example 5: Initialize auth on app start
export const initializeAuthExample = async () => {
  try {
    const user = await authService.initialize();
    
    if (user) {
      console.log('User is already authenticated:', user);
      return user;
    } else {
      console.log('User is not authenticated');
      return null;
    }
  } catch (error) {
    console.error('Auth initialization failed:', error);
    return null;
  }
};

// Example 6: Protected route check
export const protectedRouteExample = async () => {
  const user = await authService.checkAuth();
  
  if (!user) {
    // Redirect to login
    window.location.href = '/login';
    return false;
  }
  
  // User is authenticated, allow access
  return true;
};

// Example 7: File upload with authentication
export const uploadExample = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('profile', file);
    
    // Upload automatically includes HTTP-only cookies
    const result = await apiService.uploadProfile(formData);
    console.log('Upload successful:', result);
    
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
