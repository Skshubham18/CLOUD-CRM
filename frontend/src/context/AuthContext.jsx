import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getMeApi } from '../services/api';

const AuthContext = createContext(null);

export const TOKEN_STORAGE_KEY = 'cloud_crm_jwt_token';
export const USER_STORAGE_KEY = 'cloud_crm_user_info';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify authentication state on mount
  useEffect(() => {
    async function initializeAuth() {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          // ignore corrupted user JSON
        }
      }

      // Verify token freshness with GET /api/auth/me
      try {
        const response = await getMeApi(storedToken);
        if (response.data && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data.user));
        }
      } catch (error) {
        // Token invalid or expired - clean up session
        console.warn('[Auth] Session expired or invalid token:', error.message);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initializeAuth();
  }, []);

  /**
   * Login handler
   */
  const login = async (email, password) => {
    const response = await loginApi({ email, password });
    const { user: authUser, token: authToken } = response.data;

    setToken(authToken);
    setUser(authUser);
    localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));

    return response;
  };

  /**
   * Register handler
   */
  const register = async (userData) => {
    const response = await registerApi(userData);
    return response;
  };

  /**
   * Logout handler
   */
  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
