// src/components/MapTab.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '@/src/constants/colors';

const { width, height } = Dimensions.get('window');

const MapTab = ({ group }) => {
  const [userLocations, setUserLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 40.7589, // Default to NYC
    longitude: -73.9851,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const mapRef = useRef(null);
  const locationSubscription = useRef(null);

  // Custom map style for OpenStreetMap look
  const customMapStyle = [
    {
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#212121"
        }
      ]
    },
    {
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#212121"
        }
      ]
    }
  ];

  useEffect(() => {
    initializeLocation();
    fetchGroupLocations();

    // Set up real-time location updates
    const interval = setInterval(() => {
      fetchGroupLocations();
    }, 10000); // Update every 10 seconds

    return () => {
      clearInterval(interval);
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const initializeLocation = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to show your location on the map.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.openAppSettingsAsync() }
          ]
        );
        setLocationPermission(false);
        setLoading(false);
        return;
      }

      setLocationPermission(true);

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(newLocation);
      setMapRegion({
        ...newLocation,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Start watching location changes
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(newLocation);
          
          // Send location to server
          sendLocationToServer(newLocation);
        }
      );

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupLocations = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`https://your-api.com/groups/${group.id}/locations`, {
        headers: {
          'Authorization': `Bearer ${your_auth_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const locations = await response.json();
        setUserLocations(locations);
      } else {
        // Fallback to mock data for development
        setUserLocations([
          {
            id: '1',
            userId: '1',
            name: 'Mahdi Fadaee',
            latitude: 40.7589,
            longitude: -73.9851,
            avatar: null,
            isOnline: true,
            lastSeen: new Date(),
            accuracy: 10,
          },
          {
            id: '2',
            userId: '3',
            name: 'Hooman Abasi',
            latitude: 40.7614,
            longitude: -73.9776,
            avatar: null,
            isOnline: true,
            lastSeen: new Date(),
            accuracy: 15,
          },
          {
            id: '3',
            userId: '2',
            name: 'Arman',
            latitude: 40.7505,
            longitude: -73.9934,
            avatar: null,
            isOnline: false,
            lastSeen: new Date(Date.now() - 300000), // 5 minutes ago
            accuracy: 20,
          },
          {
            id: '4',
            userId: '4',
            name: 'Duxica Team',
            latitude: 40.7580,
            longitude: -73.9855,
            avatar: null,
            isOnline: true,
            lastSeen: new Date(),
            accuracy: 8,
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching group locations:', error);
      // Set mock data on error
      setUserLocations([
        {
          id: '1',
          userId: '1',
          name: 'Mahdi Fadaee',
          latitude: 40.7589,
          longitude: -73.9851,
          avatar: null,
          isOnline: true,
          lastSeen: new Date(),
          accuracy: 10,
        },
        {
          id: '2',
          userId: '3',
          name: 'Hooman Abasi',
          latitude: 40.7614,
          longitude: -73.9776,
          avatar: null,
          isOnline: true,
          lastSeen: new Date(),
          accuracy: 15,
        },
      ]);
    }
  };

  const sendLocationToServer = async (location) => {
    try {
      // Replace with your actual API endpoint
      await fetch(`https://your-api.com/groups/${group.id}/location`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${your_auth_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error sending location to server:', error);
    }
  };

  const generateInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getInitialsColor = (name) => {
    const colorOptions = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorOptions[Math.abs(hash) % colorOptions.length];
  };

  const getTimeSince = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const focusOnUser = (user) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: user.latitude,
        longitude: user.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
    setSelectedUser(user);
  };

  const centerOnMyLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const fitAllMarkers = () => {
    if (mapRef.current && userLocations.length > 0) {
      const coordinates = userLocations.map(user => ({
        latitude: user.latitude,
        longitude: user.longitude,
      }));
      
      if (currentLocation) {
        coordinates.push(currentLocation);
      }

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const renderMarker = (user) => (
    <Marker
      key={user.id}
      coordinate={{
        latitude: user.latitude,
        longitude: user.longitude,
      }}
      onPress={() => setSelectedUser(user)}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.markerContainer}>
        {/* User Avatar */}
        {user.avatar ? (
          <Image 
            source={{ uri: user.avatar }} 
            style={[
              styles.markerImage,
              !user.isOnline && styles.offlineMarker
            ]} 
          />
        ) : (
          <View style={[
            styles.markerPlaceholder, 
            { backgroundColor: getInitialsColor(user.name) },
            !user.isOnline && styles.offlineMarker
          ]}>
            <Text style={styles.markerText}>
              {generateInitials(user.name)}
            </Text>
          </View>
        )}
        
        {/* Online Status Indicator */}
        {user.isOnline && (
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
          </View>
        )}
        
        {/* User Name Label */}
        <View style={styles.nameLabel}>
          <Text style={styles.nameLabelText}>{user.name}</Text>
        </View>
      </View>
    </Marker>
  );

  const renderCurrentLocationMarker = () => {
    if (!currentLocation) return null;

    return (
      <Marker
        coordinate={currentLocation}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.currentLocationMarker}>
          <View style={styles.currentLocationDot} />
          <View style={styles.currentLocationCircle} />
        </View>
      </Marker>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={mapRegion}
          customMapStyle={customMapStyle}
          showsUserLocation={false} // We'll use custom marker
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          showsBuildings={true}
          showsTraffic={false}
          onRegionChangeComplete={setMapRegion}
          mapType="standard" // Uses OpenStreetMap data
        >
          {/* Render user markers */}
          {userLocations.map(renderMarker)}
          
          {/* Render current location marker */}
          {renderCurrentLocationMarker()}
        </MapView>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={centerOnMyLocation}
          >
            <Ionicons name="locate" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={fitAllMarkers}
          >
            <Ionicons name="people" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Selected User Info */}
        {selectedUser && (
          <View style={styles.userInfoCard}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedUser(null)}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.userInfoContent}>
              {selectedUser.avatar ? (
                <Image source={{ uri: selectedUser.avatar }} style={styles.userInfoAvatar} />
              ) : (
                <View style={[
                  styles.userInfoAvatarPlaceholder, 
                  { backgroundColor: getInitialsColor(selectedUser.name) }
                ]}>
                  <Text style={styles.userInfoAvatarText}>
                    {generateInitials(selectedUser.name)}
                  </Text>
                </View>
              )}
              
              <View style={styles.userInfoDetails}>
                <Text style={styles.userInfoName}>{selectedUser.name}</Text>
                <Text style={styles.userInfoStatus}>
                  {selectedUser.isOnline ? (
                    <><Ionicons name="radio-button-on" size={12} color={colors.primary} /> Online</>
                  ) : (
                    <><Ionicons name="radio-button-off" size={12} color={colors.textSecondary} /> {getTimeSince(selectedUser.lastSeen)}</>
                  )}
                </Text>
                <Text style={styles.userInfoAccuracy}>
                  Accuracy: ±{selectedUser.accuracy}m
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Active Users List */}
      <View style={styles.usersListContainer}>
        <Text style={styles.sectionTitle}>
          Active Users ({userLocations.filter(u => u.isOnline).length}/{userLocations.length})
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.usersList}
          contentContainerStyle={styles.usersListContent}
        >
          {userLocations.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={[
                styles.userCard,
                selectedUser?.id === user.id && styles.selectedUserCard
              ]}
              onPress={() => focusOnUser(user)}
            >
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.userCardAvatar} />
              ) : (
                <View style={[
                  styles.userCardAvatarPlaceholder, 
                  { backgroundColor: getInitialsColor(user.name) }
                ]}>
                  <Text style={styles.userCardAvatarText}>
                    {generateInitials(user.name)}
                  </Text>
                </View>
              )}
              
              <Text style={styles.userCardName} numberOfLines={1}>
                {user.name}
              </Text>
              
              <View style={styles.userCardStatus}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: user.isOnline ? colors.primary : colors.textSecondary }
                ]} />
                <Text style={styles.userCardStatusText}>
                  {user.isOnline ? 'Online' : getTimeSince(user.lastSeen)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textPrimary,
    fontSize: 16,
    marginTop: 10,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapControls: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'column',
  },
  controlButton: {
    backgroundColor: colors.surface,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  markerPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  markerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  offlineMarker: {
    opacity: 0.6,
    borderColor: colors.textSecondary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 2,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  nameLabel: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  nameLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  currentLocationMarker: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    position: 'absolute',
  },
  currentLocationCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary + '30',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  userInfoCard: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  userInfoAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfoAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfoDetails: {
    flex: 1,
  },
  userInfoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userInfoStatus: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userInfoAccuracy: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  usersListContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: 140,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  usersList: {
    paddingLeft: 20,
  },
  usersListContent: {
    paddingRight: 20,
  },
  userCard: {
    width: 80,
    alignItems: 'center',
    marginRight: 16,
    padding: 8,
    borderRadius: 12,
  },
  selectedUserCard: {
    backgroundColor: colors.primary + '20',
  },
  userCardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  userCardAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  userCardAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userCardName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  userCardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  userCardStatusText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});

export default MapTab;