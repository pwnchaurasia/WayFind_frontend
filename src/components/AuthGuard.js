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
 * - If authenticated: Redirects to main app
 * - If not authenticated: Redirects to login
 * 
 * This separation makes the code more modular and testable.
 */
const AuthGuard = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication status
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(main)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
};

export default AuthGuard;
