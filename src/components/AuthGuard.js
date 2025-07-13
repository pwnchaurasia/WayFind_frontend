import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import LoadingScreen from '@/src/components/LoadingScreen';

/**
 * AuthGuard Component
 * 
 * This component handles authentication-based routing logic.
 * It checks the user's authentication status and redirects accordingly:
 * - If loading: Shows loading screen
 * - If not authenticated: Redirects to login
 * - If authenticated but profile incomplete: Redirects to update profile
 * - If authenticated and profile complete: Redirects to main app
 * 
 * This separation makes the code more modular and testable.
 */
const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoading, isProfileComplete } = useAuth();

  console.log('authGuard: isAuthenticated:', isAuthenticated);
  console.log('authGuard: isLoading:', isLoading);
  console.log('authGuard: isProfileComplete:', isProfileComplete);
  // Show loading screen while checking authentication status
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    // If authenticated but profile is incomplete, redirect to update profile
    if (!isProfileComplete) {
      return <Redirect href="/(auth)/update_profile" />;
    }
    // If authenticated and profile is complete, redirect to main app
    return <Redirect href="/(main)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
};

export default AuthGuard;
