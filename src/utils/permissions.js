// utils/permissions.js
import * as Location from 'expo-location';
import { Audio } from 'expo-audio';
import { Alert, Platform } from 'react-native';

export const requestLocationPermission = async () => {
  try {
    // Check if location services are enabled
    const isLocationEnabled = await Location.hasServicesEnabledAsync();
    if (!isLocationEnabled) {
      Alert.alert(
        'Location Services Disabled',
        'Please enable location services to share your location with group members.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Request foreground permission first
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'This app needs location access to share your location with group members.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // For background location updates (when app is minimized)
    if (Platform.OS === 'android') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert(
          'Background Location',
          'Allow background location to keep sharing your location when the app is closed.',
          [{ text: 'Skip' }, { text: 'Allow' }]
        );
      }
    }

    return true;
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

export const requestAudioPermission = async () => {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Audio Permission Required',
        'This app needs microphone access to record voice messages.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting audio permission:', error);
    return false;
  }
};

export const requestAllPermissions = async () => {
  const locationGranted = await requestLocationPermission();
  const audioGranted = await requestAudioPermission();
  
  return {
    location: locationGranted,
    audio: audioGranted
  };
};