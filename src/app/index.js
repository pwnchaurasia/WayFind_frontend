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
  const { isAuthenticated, isLoading, isProfileComplete } = useAuth();

  console.log('Index: isAuthenticated:', isAuthenticated);
  console.log('Index: isLoading:', isLoading);
  console.log('Index: isProfileComplete:', isProfileComplete);

  // Show loading screen while checking authentication
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
}
