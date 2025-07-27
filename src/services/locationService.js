// services/LocationService.js
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import API from '@/src/apis/axios';
import * as SecureStore from 'expo-secure-store';
import { getAccessToken } from "@/src/utils/token";


const LOCATION_TASK_NAME = 'background-location-task';

class LocationTrackingService {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.lastLocationUpdate = null;
    this.updateInterval = 3 * 60 * 1000; // 3 minutes in milliseconds
  }

  async startLocationTracking() {
    try {
      // Check if user is logged in
      const token = await getAccessToken();
      if (!token) {
        console.log('User not logged in, skipping location tracking');
        return false;
      }

      if (this.isTracking) {
        console.log('Location tracking already started');
        return true;
      }

      // Start watching position
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: this.updateInterval,
          distanceInterval: 10, // Update if user moves 10 meters
        },
        (location) => {
          this.handleLocationUpdate(location);
        }
      );

      this.isTracking = true;
      console.log('Location tracking started');
      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  async stopLocationTracking() {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
    this.isTracking = false;
    console.log('Location tracking stopped');
  }

  async handleLocationUpdate(location) {
    try {
      const { coords, timestamp } = location;
      
      // Throttle updates - don't send too frequently
      const now = Date.now();
      if (this.lastLocationUpdate && (now - this.lastLocationUpdate) < this.updateInterval) {
        return;
      }

      const locationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        speed: coords.speed,
        heading: coords.heading,
        timestamp: new Date(timestamp).toISOString()
      };

      // Send to backend
      await this.sendLocationToBackend(locationData);
      this.lastLocationUpdate = now;
      
    } catch (error) {
      console.error('Error handling location update:', error);
    }
  }

  async sendLocationToBackend(locationData) {
    try {
      const response = await API.put('/v1/users/me/location', locationData);
      console.log('Location updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error sending location to backend:', error);
      // Don't throw error - we don't want to break the app if location update fails
    }
  }

  async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }
}

// Export singleton instance
export default new LocationTrackingService();