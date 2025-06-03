import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

// Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  firstName?: string;
  lastName?: string;
}

interface AuthResponse {
  access_token: string;
  user: User;
}

// Hook
export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuth({
          user,
          token: storedToken,
          isLoading: false,
          error: null,
        });
      } catch (e) {
        // Invalid stored user data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setAuth({
          user: null,
          token: null,
          isLoading: false,
          error: null,
        });
      }
    } else {
      setAuth(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Login function
  const login = useCallback(async (data: LoginData) => {
    setAuth(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.post<AuthResponse>('/auth/login', data, { withAuth: false });
      
      // Store auth data
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      
      setAuth({
        user: response.user,
        token: response.access_token,
        isLoading: false,
        error: null,
      });
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setAuth(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw err;
    }
  }, []);

  // Register function
  const register = useCallback(async (data: RegisterData) => {
    setAuth(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await api.post<AuthResponse>('/auth/register', data, { withAuth: false });
      
      // Store auth data
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      
      setAuth({
        user: response.user,
        token: response.access_token,
        isLoading: false,
        error: null,
      });
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setAuth(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      throw err;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    
    setAuth({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
  }, []);

  // Return auth state and functions
  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: !!auth.token,
    isLoading: auth.isLoading,
    error: auth.error,
    login,
    register,
    logout,
  };
}
