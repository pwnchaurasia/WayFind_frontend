import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService from '@/src/apis/authService';
import { getAccessToken, getRefreshToken } from '@/src/utils/token';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // 1. Get token from SecureStore
      const auth_token = await getAccessToken();
      const refresh_token = await getRefreshToken();
      console.log('Auth Token:', auth_token)
      console.log('refresh_token Token:', refresh_token)

      if (!auth_token) {
        // No token = not authenticated
        setIsAuthenticated(false);
      } else {
        // 2. Validate token with backend
        const isValid = await AuthService.isAuthenticated(); // This calls your /auth/verify endpoint
        setIsAuthenticated(isValid);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false); // Hide splash screen
    }
  };



  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);