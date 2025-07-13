import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import LoadingScreen from '@/src/components/LoadingScreen';

/**
 * Index Component - Initial Route Handler
 * 
 * This component acts as the entry point for routing decisions.
 * It checks authentication status and redirects users accordingly:
 * - Loading: Shows loading screen
 * - Authenticated: Redirects to main app
 * - Not authenticated: Redirects to login
 * 
 * This approach works better with Expo Router's file-based routing.
 */
export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    console.log('Index: Still loading authentication status...');
    return <LoadingScreen />;
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    console.log('Index: User is authenticated, redirecting to main');
    return <Redirect href="/(main)" />;
  } else {
    console.log('Index: User is not authenticated, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }
}
