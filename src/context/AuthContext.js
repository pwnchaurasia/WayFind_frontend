import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService from '@/src/services/authService';
import { removeToken } from '@/src/utils/token';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  /**
   * Login user and set authentication state
   * @param {Object} userData - User data from authentication
   */
  const login = async (userData) => {
    try {
      setUser(userData);
      setIsAuthenticated(true);
      
      // Optionally fetch fresh user data
      if (!userData) {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Login state update failed:', error);
      // Still set authenticated state even if user fetch fails
      setIsAuthenticated(true);
    }
  };

  /**
   * Logout user and clear all authentication state
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout service (handles backend logout and token cleanup)
      await AuthService.logout();
      
      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Still clear local state even if service call fails
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated (this will handle token validation)
      const isValid = await AuthService.isAuthenticated();
      
      console.log('Authentication status:', isValid);
      setIsAuthenticated(isValid);
      
      if (!isValid) {
        // Clear user data if not authenticated
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      console.log("SettingLoading to be false")
      setIsLoading(false);
    }
  };



  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
