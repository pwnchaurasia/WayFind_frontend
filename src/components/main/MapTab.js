// src/components/MapTab.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert
} from 'react-native';
import { colors } from '@/src/constants/colors';
import GroupService from '@/src/apis/groupService';



const MapTabsss = ({ group }) => {
  console.log('Group ID:', group.id);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocations, setUserLocations] = useState([]);

  console.log("I am here in MapTab with group id: ", group.id);

  useEffect(() => {
    fetchGroupMembersLocation();
  }, [group.id]);

  const fetchGroupMembersLocation = async () => {
    try {
      setLoading(true);
      // Simulated fetch for user locations
      const response = await GroupService.getGroupUsersLocation(id)
      // const data = await response.json();
      // setUserLocations(data);
    } catch (error) {
      console.error('Failed to fetch user locations:', error);
      Alert.alert('Error', 'Failed to load group members');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroupMembersLocation();
    setRefreshing(false);
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
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>Interactive Map</Text>
          <Text style={styles.mapSubtext}>Real-time user locations</Text>
          
          {/* Simulated map markers */}
          <View style={styles.markersContainer}>
            {userLocations.map((user, index) => (
              <TouchableOpacity 
                key={user.id} 
                style={[
                  styles.marker,
                  { 
                    top: 50 + (index * 40), 
                    left: 80 + (index * 60),
                  }
                ]}
              >
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.markerImage} />
                ) : (
                  <View style={[
                    styles.markerPlaceholder, 
                    { backgroundColor: getInitialsColor(user.name) }
                  ]}>
                    <Text style={styles.markerText}>
                      {generateInitials(user.name)}
                    </Text>
                  </View>
                )}
                {user.isOnline && <View style={styles.onlineIndicator} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* User List */}
      <ScrollView style={styles.userList}>
        <Text style={styles.sectionTitle}>Active Users</Text>
        {userLocations.map((user) => (
          <View key={user.id} style={styles.userItem}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
            ) : (
              <View style={[
                styles.userAvatarPlaceholder, 
                { backgroundColor: getInitialsColor(user.name) }
              ]}>
                <Text style={styles.userAvatarText}>
                  {generateInitials(user.name)}
                </Text>
              </View>
            )}
            
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userStatus}>
                {user.isOnline ? 'Online' : 'Last seen recently'}
              </Text>
            </View>
            
            <View style={[
              styles.statusDot, 
              { backgroundColor: user.isOnline ? colors.primary : colors.textSecondary }
            ]} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  mapSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  markersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  marker: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  markerPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  markerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
  },
  userList: {
    maxHeight: 200,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    padding: 16,
    paddingBottom: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default MapTabsss;
