// src/components/MapTab.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
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
import { globalStyles, getAvatarColor, generateInitials, getTimeSince } from '@/src/styles/globalStyles';
import { theme } from '@/src/styles/theme';
import GroupService from '@/src/apis/groupService';

const { width, height } = Dimensions.get('window');

const THREE_MINUTES = 3 * 60 * 1000;

const MapTab = ({ group }) => {
  console.log("MapTab component rendered for group:", group);
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
    console.log('In user effect for MapTab');
    initializeLocation();
    fetchGroupMembersLocation();

    // Set up real-time location updates
    const interval = setInterval(() => {
      fetchGroupMembersLocation();
    }, THREE_MINUTES);

    return () => {
      clearInterval(interval);
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [group.id]);

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
          // sendLocationToServer(newLocation);
        }
      );

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembersLocation = async () => {
    try {
      setLoading(true);
      const response = await GroupService.getGroupUsersLocation(group.id)
      
      if(!response || !response.users_location) {
        Alert.alert('Error', 'Failed to load group members');
        throw new Error('No user locations found');
      }

      setUserLocations(response.users_location);
    } catch (error) {
      Alert.alert('Error', 'Failed to load group members');
    } finally {
      setLoading(false);
    }
  };


  // const sendLocationToServer = async (location) => {
  //   try {
  //     // Replace with your actual API endpoint
  //     const your_auth_token = 'your_auth_token_here'; // Replace with your auth token
  //     await fetch(`https://your-api.com/groups/${group.id}/location`, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${your_auth_token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         latitude: location.latitude,
  //         longitude: location.longitude,
  //         timestamp: new Date().toISOString(),
  //       }),
  //     });
  //   } catch (error) {
  //     console.error('Error sending location to server:', error);
  //   }
  // };


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
      <View style={globalStyles.markerContainer}>
        {/* User Avatar */}
        {user.avatar ? (
          <Image 
            source={{ uri: user.avatar }} 
            style={[
              globalStyles.markerImage,
              !user.isOnline && globalStyles.offlineMarker
            ]} 
          />
        ) : (
          <View style={[
            globalStyles.markerPlaceholder, 
            { backgroundColor: getAvatarColor(user.name) },
            !user.isOnline && globalStyles.offlineMarker
          ]}>
            <Text style={globalStyles.markerText}>
              {generateInitials(user.name)}
            </Text>
          </View>
        )}
        
        {/* Online Status Indicator */}
        {user.isOnline && (
          <View style={globalStyles.onlineIndicator}>
            <View style={globalStyles.onlineDot} />
          </View>
        )}
        
        {/* User Name Label */}
        <View style={globalStyles.nameLabel}>
          <Text style={globalStyles.nameLabelText}>{user.name}</Text>
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
        <View style={globalStyles.currentLocationMarker}>
          <View style={globalStyles.currentLocationDot} />
          <View style={globalStyles.currentLocationCircle} />
        </View>
      </Marker>
    );
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={globalStyles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      {/* Map Container */}
      <View style={globalStyles.mapContainer}>
        <MapView
          ref={mapRef}
          style={globalStyles.map}
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
        <View style={globalStyles.mapControls}>
          <TouchableOpacity 
            style={globalStyles.controlButton}
            onPress={centerOnMyLocation}
          >
            <Ionicons name="locate" size={theme.fontSize.lg} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={globalStyles.controlButton}
            onPress={fitAllMarkers}
          >
            <Ionicons name="people" size={theme.fontSize.lg} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Selected User Info */}
        {selectedUser && (
          <View style={globalStyles.userInfoCard}>
            <TouchableOpacity 
              style={globalStyles.closeButton}
              onPress={() => setSelectedUser(null)}
            >
              <Ionicons name="close" size={theme.fontSize.lg} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={globalStyles.userInfoContent}>
              {selectedUser.avatar ? (
                <Image source={{ uri: selectedUser.avatar }} style={globalStyles.userInfoAvatar} />
              ) : (
                <View style={[
                  globalStyles.userInfoAvatarPlaceholder, 
                  { backgroundColor: getAvatarColor(selectedUser.name) }
                ]}>
                  <Text style={globalStyles.userInfoAvatarText}>
                    {generateInitials(selectedUser.name)}
                  </Text>
                </View>
              )}
              
              <View style={globalStyles.userInfoDetails}>
                <Text style={globalStyles.userInfoName}>{selectedUser.name}</Text>
                <Text style={globalStyles.userInfoStatus}>
                  {selectedUser.isOnline ? (
                    <><Ionicons name="radio-button-on" size={theme.fontSize.sm} color={theme.colors.primary} /> Online</>
                  ) : (
                    <><Ionicons name="radio-button-off" size={theme.fontSize.sm} color={theme.colors.textSecondary} /> {getTimeSince(selectedUser.lastSeen)}</>
                  )}
                </Text>
                <Text style={globalStyles.userInfoAccuracy}>
                  Accuracy: ±{selectedUser.accuracy}m
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Active Users List */}
      <View style={globalStyles.usersListContainer}>
        <Text style={globalStyles.sectionTitle}>
          Active Users ({userLocations.filter(u => u.isOnline).length}/{userLocations.length})
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={globalStyles.usersList}
          contentContainerStyle={globalStyles.usersListContent}
        >
          {userLocations.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={[
                globalStyles.userCard,
                selectedUser?.id === user.id && globalStyles.selectedUserCard
              ]}
              onPress={() => focusOnUser(user)}
            >
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={globalStyles.userCardAvatar} />
              ) : (
                <View style={[
                  globalStyles.userCardAvatarPlaceholder, 
                  { backgroundColor: getAvatarColor(user.name) }
                ]}>
                  <Text style={globalStyles.userCardAvatarText}>
                    {generateInitials(user.name)}
                  </Text>
                </View>
              )}
              
              <Text style={globalStyles.userCardName} numberOfLines={1}>
                {user.name}
              </Text>
              
              <View style={globalStyles.userCardStatus}>
                <View style={[
                  globalStyles.statusDot, 
                  { backgroundColor: user.isOnline ? theme.colors.primary : theme.colors.textSecondary }
                ]} />
                <Text style={globalStyles.userCardStatusText}>
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

export default MapTab;
