// hooks/useLocationTracking.js
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import LocationTrackingService from '@/src/services/locationService';
import { requestLocationPermission } from '@/src/utils/permissions';
import { useAuth } from '@/src/context/AuthContext'; // Your auth hook

export const useLocationTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      initializeLocationTracking();
    } else {
      stopTracking();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Handle app state changes
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated && hasPermission) {
        startTracking();
      } else if (nextAppState === 'background') {
        // Keep tracking in background if permission granted
        console.log('App moved to background, continuing location tracking');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, hasPermission]);

  const initializeLocationTracking = async () => {
    const permissionGranted = await requestLocationPermission();
    setHasPermission(permissionGranted);
    
    if (permissionGranted) {
      startTracking();
    }
  };

  const startTracking = async () => {
    const success = await LocationTrackingService.startLocationTracking();
    setIsTracking(success);
  };

  const stopTracking = async () => {
    await LocationTrackingService.stopLocationTracking();
    setIsTracking(false);
  };

  return {
    isTracking,
    hasPermission,
    startTracking,
    stopTracking,
    requestPermission: initializeLocationTracking
  };
};