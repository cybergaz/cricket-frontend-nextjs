interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

class HttpClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const config: RequestInit = {
      method: options.method || 'GET',
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include', // CRITICAL: Always include cookies for HTTP-only auth
    };

    // Add body for non-GET requests
    if (options.body && config.method !== 'GET') {
      if (options.body instanceof FormData) {
        // Remove Content-Type header for FormData (browser will set it with boundary)
        if (config.headers) {
          delete (config.headers as Record<string, string>)['Content-Type'];
        }
        config.body = options.body;
      } else {
        config.body = JSON.stringify(options.body);
      }
    }

    try {
      console.log(`🚀 ${config.method} ${url}`);
      
      const response = await fetch(url, config);
      
      console.log(`📡 Response: ${response.status} ${response.statusText}`);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          console.warn('🔐 Authentication failed');
          // Don't auto-redirect here, let the calling code handle it
        }
        
        throw new Error(data.message || `HTTP Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ Request failed: ${config.method} ${url}`, error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  // POST request
  async post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  // PUT request
  async put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  // DELETE request
  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  // PATCH request
  async patch<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, headers });
  }

  // Upload file
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, { 
      method: 'POST', 
      body: formData 
    });
  }
}

export const httpClient = new HttpClient();
export default httpClient;
