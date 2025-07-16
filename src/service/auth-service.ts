import httpClient from './http-client';

interface LoginCredentials {
  mobile: string;
  password: string;
}

interface User {
  id: string;
  name: string;
  mobile: string;
  email: string;
  isVerified: boolean;
  amount: number;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

class AuthService {
  private currentUser: User | null = null;
  private authCheckPromise: Promise<User | null> | null = null;

  /**
   * Login with credentials
   * HTTP-only cookie is set automatically by the server
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await httpClient.post<AuthResponse>('/auth/login', credentials);
      
      if (response.success && response.user) {
        this.currentUser = response.user;
        console.log('✅ Login successful - HTTP-only cookie set by server');
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Check if user is authenticated by calling the backend
   * This is the only reliable way to verify auth with HTTP-only cookies
   */
  async checkAuth(): Promise<User | null> {
    // Prevent multiple simultaneous auth checks
    if (this.authCheckPromise) {
      return this.authCheckPromise;
    }

    this.authCheckPromise = this._performAuthCheck();
    const result = await this.authCheckPromise;
    this.authCheckPromise = null;
    
    return result;
  }

  private async _performAuthCheck(): Promise<User | null> {
    try {
      const response = await httpClient.get<User>('/auth/whoami');
      this.currentUser = response;
      console.log('✅ User authenticated via HTTP-only cookie');
      return response;
    } catch (error) {
      console.log('❌ User not authenticated');
      this.currentUser = null;
      return null;
    }
  }

  /**
   * Get current user data
   * Returns cached data if available, otherwise checks with server
   */
  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    return await this.checkAuth();
  }

  /**
   * Logout user
   * Server will clear the HTTP-only cookie
   */
  async logout(): Promise<void> {
    try {
      await httpClient.post('/auth/logout');
      console.log('✅ Logout successful - HTTP-only cookie cleared');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    } finally {
      // Always clear local user data
      this.currentUser = null;
    }
  }

  /**
   * Check if user is authenticated (synchronous)
   * Only reliable after calling checkAuth() first
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Get cached user data (synchronous)
   * May be null if not fetched yet
   */
  getUser(): User | null {
    return this.currentUser;
  }

  /**
   * Clear cached user data
   */
  clearUser(): void {
    this.currentUser = null;
  }

  /**
   * Initialize authentication state
   * Call this when the app starts
   */
  async initialize(): Promise<User | null> {
    console.log('🔄 Initializing authentication...');
    return await this.checkAuth();
  }

  /**
   * Refresh user data from server
   */
  async refreshUser(): Promise<User | null> {
    this.currentUser = null; // Clear cache
    return await this.checkAuth();
  }
}

export const authService = new AuthService();
export default authService;
