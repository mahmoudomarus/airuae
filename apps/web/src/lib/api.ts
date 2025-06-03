/**
 * API utility for making requests to the backend
 */

// Get API base URL from environment or use a default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

// Helper to handle JSON responses
const handleResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    
    if (!response.ok) {
      // If response contains error message, use it; otherwise use status text
      const errorMessage = data.message || data.error || response.statusText;
      throw new Error(errorMessage);
    }
    
    return data;
  }
  
  // For non-JSON responses
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  
  return await response.text();
};

// Get auth token from local storage
const getToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return localStorage.getItem('authToken');
};

// API methods
export const api = {
  /**
   * Make a GET request
   */
  get: async <T>(path: string): Promise<T> => {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers,
    });
    
    return handleResponse(response);
  },
  
  /**
   * Make a POST request with JSON body
   */
  post: async <T>(path: string, data: any = {}): Promise<T> => {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  },
  
  /**
   * Make a PUT request with JSON body
   */
  put: async <T>(path: string, data: any = {}): Promise<T> => {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    
    return handleResponse(response);
  },
  
  /**
   * Make a DELETE request
   */
  delete: async <T>(path: string): Promise<T> => {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers,
    });
    
    return handleResponse(response);
  },
  
  /**
   * Upload a file
   */
  uploadFile: async <T>(path: string, formData: FormData): Promise<T> => {
    const token = getToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    return handleResponse(response);
  },
};
