/**
 * LiveRideLocationService
 * Handles background location tracking during active rides.
 * 
 * Features:
 * - Background location updates every 60 seconds
 * - Auto check-in when near checkpoints
 * - Geofence detection
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import RideService from '@/src/apis/rideService';

const LOCATION_TASK_NAME = 'squadra-live-ride-location';
const LOCATION_UPDATE_INTERVAL = 60000; // 60 seconds
const GEOFENCE_RADIUS = 100; // meters

// Store for active ride data
let activeRideId = null;
let checkpoints = [];
let checkedInCheckpoints = new Set();
let locationSubscription = null;

/**
 * Calculate distance between two points using Haversine formula
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
};

/**
 * Find the nearest checkpoint to current location
 */
export const findNearestCheckpoint = (latitude, longitude, checkpointList) => {
    let nearest = null;
    let minDistance = Infinity;

    for (const cp of checkpointList) {
        const distance = calculateDistance(latitude, longitude, cp.latitude, cp.longitude);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = cp;
        }
    }

    return { checkpoint: nearest, distance: minDistance };
};

/**
 * Check if user is within a checkpoint's radius
 */
export const isNearCheckpoint = (latitude, longitude, checkpoint) => {
    const distance = calculateDistance(latitude, longitude, checkpoint.latitude, checkpoint.longitude);
    const radius = checkpoint.radius_meters || GEOFENCE_RADIUS;
    return {
        isNear: distance <= radius,
        distance,
        radius
    };
};

/**
 * Request location permissions
 */
export const requestLocationPermission = async () => {
    try {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
            return { granted: false, error: 'Foreground location permission denied' };
        }

        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
            console.warn('Background location permission denied - will only track in foreground');
            return { granted: true, background: false };
        }

        return { granted: true, background: true };
    } catch (error) {
        console.error('Error requesting location permission:', error);
        return { granted: false, error: error.message };
    }
};

/**
 * Get current location
 */
export const getCurrentLocation = async () => {
    try {
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp
        };
    } catch (error) {
        console.error('Error getting current location:', error);
        throw error;
    }
};

/**
 * Start tracking location for an active ride
 */
export const startRideTracking = async (rideId, rideCheckpoints, onLocationUpdate) => {
    try {
        // Request permissions first
        const permission = await requestLocationPermission();
        if (!permission.granted) {
            throw new Error('Location permission required for ride tracking');
        }

        // Store ride data
        activeRideId = rideId;
        checkpoints = rideCheckpoints || [];
        checkedInCheckpoints = new Set();

        console.log(`[LiveRide] Starting tracking for ride ${rideId} with ${checkpoints.length} checkpoints`);

        // Start foreground location watching
        locationSubscription = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                distanceInterval: 50, // Update every 50 meters
                timeInterval: LOCATION_UPDATE_INTERVAL,
            },
            async (location) => {
                const locationData = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    heading: location.coords.heading,
                    speed: location.coords.speed ? location.coords.speed * 3.6 : null, // Convert m/s to km/h
                    accuracy: location.coords.accuracy,
                    timestamp: location.timestamp
                };

                console.log(`[LiveRide] Location update:`, locationData.latitude.toFixed(6), locationData.longitude.toFixed(6));

                // Send location to server
                if (activeRideId) {
                    try {
                        const response = await RideService.updateLocation(activeRideId, locationData);

                        // Check if server suggests auto check-in
                        if (response.auto_checkin_available?.should_checkin) {
                            console.log(`[LiveRide] Auto check-in available at ${response.auto_checkin_available.type}`);
                        }
                    } catch (error) {
                        console.error('[LiveRide] Failed to send location:', error);
                    }
                }

                // Check for nearby checkpoints
                const { checkpoint: nearest, distance } = findNearestCheckpoint(
                    locationData.latitude,
                    locationData.longitude,
                    checkpoints
                );

                let nearbyCheckpoint = null;
                if (nearest) {
                    const radius = nearest.radius_meters || GEOFENCE_RADIUS;
                    if (distance <= radius && !checkedInCheckpoints.has(nearest.id)) {
                        nearbyCheckpoint = { ...nearest, distance };
                    }
                }

                // Callback with location data
                if (onLocationUpdate) {
                    onLocationUpdate(locationData, nearbyCheckpoint);
                }
            }
        );

        return { success: true };
    } catch (error) {
        console.error('[LiveRide] Failed to start tracking:', error);
        throw error;
    }
};

/**
 * Stop tracking location
 */
export const stopRideTracking = async () => {
    console.log('[LiveRide] Stopping ride tracking');

    // Remove location subscription
    if (locationSubscription) {
        locationSubscription.remove();
        locationSubscription = null;
    }

    // Clear ride data
    activeRideId = null;
    checkpoints = [];
    checkedInCheckpoints = new Set();

    return { success: true };
};

/**
 * Perform check-in at current location
 */
export const performCheckIn = async (rideId) => {
    try {
        // Get current location
        const location = await getCurrentLocation();

        // Call check-in API
        const response = await RideService.checkIn(rideId, location);

        // Mark checkpoint as checked in locally
        if (response.status === 'success' && response.checkpoint) {
            const checkpointId = checkpoints.find(cp => cp.type === response.checkpoint.type)?.id;
            if (checkpointId) {
                checkedInCheckpoints.add(checkpointId);
            }
        }

        return response;
    } catch (error) {
        console.error('[LiveRide] Check-in failed:', error);
        throw error;
    }
};

/**
 * Send SOS alert
 */
export const sendSOSAlert = async (rideId, alertType = 'sos_alert', message = null) => {
    try {
        const location = await getCurrentLocation();
        const response = await RideService.sendAlert(rideId, alertType, message, location);
        return response;
    } catch (error) {
        console.error('[LiveRide] Failed to send SOS:', error);
        throw error;
    }
};

export default {
    requestLocationPermission,
    getCurrentLocation,
    startRideTracking,
    stopRideTracking,
    performCheckIn,
    sendSOSAlert,
    calculateDistance,
    findNearestCheckpoint,
    isNearCheckpoint
};
