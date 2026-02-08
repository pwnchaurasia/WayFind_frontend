import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService from '@/src/services/authService';
import { removeToken } from '@/src/utils/token';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Helper to ensure profile picture has full URL
  const normalizeUser = (userData) => {
    if (!userData) return null;
    let avatar = userData.profile_picture_url || userData.avatar;
    if (avatar && avatar.startsWith('/')) {
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL_DEV;
      // Remove trailing slash from base if present
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      avatar = `${cleanBase}${avatar}`;
    }
    return { ...userData, avatar, profile_picture_url: avatar };
  };

  /**
   * Login user and set authentication state
   * @param {Object} userData - User data from authentication
   */
  const login = async (userData) => {
    try {
      setUser(normalizeUser(userData));
      setIsAuthenticated(true);

      // Optionally fetch fresh user data
      if (!userData) {
        const currentUser = await AuthService.getCurrentUser();
        setUser(normalizeUser(currentUser));
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
    let isMounted = true;
    let timeoutId = null;

    const initializeAuth = async () => {
      try {
        // Add timeout to prevent infinite loading (10 seconds max)
        const authCheckPromise = AuthService.isAuthenticated();
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Auth check timeout'));
          }, 10000); // 10 second timeout
        });

        let isValid = false;
        try {
          isValid = await Promise.race([authCheckPromise, timeoutPromise]);
        } catch (timeoutError) {
          console.warn('AuthContext: Auth check timed out, assuming not authenticated');
          isValid = false;
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
        }

        if (isMounted) {
          console.log('AuthContext: Authentication status:', isValid);
          setIsAuthenticated(isValid);

          if (isValid) {
            // If authenticated, check profile completion
            try {
              const response = await AuthService.getCurrentUser();

              if (response.status !== 200) {
                throw new Error(`Failed to fetch user profile: ${response.statusText}`);
              }
              const currentUser = response.data?.user
              console.log('new Current User:', currentUser);
              const normalizedUser = normalizeUser(currentUser);
              setUser(normalizedUser);

              // Check if profile is complete by looking at actual fields
              // User has filled profile if they have a name
              const hasName = currentUser?.name && currentUser.name.trim().length > 0;
              const profileComplete = hasName || currentUser?.is_profile_complete;
              setIsProfileComplete(profileComplete);

            } catch (error) {
              console.error('AuthContext: Failed to get user profile:', error);
              // If we can't get profile, assume it's incomplete
              setIsProfileComplete(false);
            }
          } else {
            // Clear user data if not authenticated
            setUser(null);
            setIsProfileComplete(true); // Reset to default
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('AuthContext: Auth check failed:', error);
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          console.log("AuthContext: Setting loading to false");
          setIsLoading(false);
        }
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    initializeAuth();

    // Check for session expiry from axios interceptor
    const sessionCheckInterval = setInterval(() => {
      if (typeof global !== 'undefined' && global.authSessionExpired) {
        console.log('Session expired detected, logging out...');
        global.authSessionExpired = false;
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    }, 1000);

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
      clearInterval(sessionCheckInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('AuthContext: Manual auth status check...');
      setIsLoading(true);

      // Check if user is authenticated (this will handle token validation)
      const isValid = await AuthService.isAuthenticated();

      console.log('AuthContext: Manual check - Authentication status:', isValid);
      setIsAuthenticated(isValid);

      if (!isValid) {
        // Clear user data if not authenticated
        setUser(null);
      }
    } catch (error) {
      console.error('AuthContext: Manual auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      console.log("AuthContext: Manual check - Setting loading to false");
      setIsLoading(false);
    }
  };

  /**
   * Update profile completion status
   * @param {boolean} isComplete - Profile completion status
   */
  const updateProfileCompletion = (isComplete) => {
    setIsProfileComplete(isComplete);
  };

  /**
   * Manually refresh user profile data
   * @returns {Promise<Object|null>} The user data or null
   */
  const refreshUserProfile = async () => {
    try {
      const response = await AuthService.getCurrentUser();

      if (response.status === 200 && response.data?.user) {
        const currentUser = response.data.user;
        console.log('Refreshed User Profile:', currentUser);
        const normalizedUser = normalizeUser(currentUser);
        setUser(normalizedUser);

        // Check if profile is complete - user must have a name at minimum
        const hasName = currentUser?.name && currentUser.name.trim().length > 0;
        const profileComplete = hasName || currentUser?.is_profile_complete === true;

        console.log('Profile completion check - hasName:', hasName, 'is_profile_complete:', currentUser?.is_profile_complete, 'final:', profileComplete);
        setIsProfileComplete(profileComplete);

        return currentUser;
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      return null;
    }
  };


  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, isProfileComplete, login, logout, checkAuthStatus, updateProfileCompletion, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
