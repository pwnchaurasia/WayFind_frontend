import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground,
  StatusBar,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';
import { useAuth } from '@/src/context/AuthContext';
import { router } from 'expo-router';
import OrganizationService from '@/src/apis/organizationService';
import RideService from '@/src/apis/rideService';
import * as Location from 'expo-location';
import dayjs from 'dayjs';

// Standard Dimensions
const { width } = Dimensions.get('window');
const CARD_WIDTH = 280;
const CARD_HEIGHT = CARD_WIDTH * (5 / 4);
const CARD_SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;

// Tailwind Colors Mapping
const COLORS = {
  primary: '#0df20d',
  backgroundDark: '#050a05',
  cardDark: '#0d1a0d',
  danger: '#ff3b3b',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate900: '#0f172a',
  amber500: '#f59e0b',
  primary10: 'rgba(13, 242, 13, 0.1)',
  primary20: 'rgba(13, 242, 13, 0.2)',
  primary30: 'rgba(13, 242, 13, 0.3)',
  primary50: 'rgba(13, 242, 13, 0.5)',
};

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1762178103168-58472e27126e?q=80&w=3338&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1767652784202-214920d12a85?q=80&w=1935&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1758550713886-1ba2390293af?q=80&w=3540&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1762178250159-7429ce17185d?q=80&w=3540&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476994230281-1448088947db?q=80&w=2016&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1983&auto=format&fit=crop',
];

const getRandomImage = (id) => {
  if (!id) return PLACEHOLDER_IMAGES[0];
  const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PLACEHOLDER_IMAGES[sum % PLACEHOLDER_IMAGES.length];
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [joinedRides, setJoinedRides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [endRideModalVisible, setEndRideModalVisible] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState(null);

  const fetchData = async () => {
    try {
      const dashboardData = await OrganizationService.getDashboard();
      setIsSuperAdmin(dashboardData?.is_super_admin || false);
      setIsOrgAdmin(dashboardData?.is_org_admin || false);

      const [activeRes, upcomingRes] = await Promise.all([
        RideService.getMyRides({ status: 'active' }).catch(() => ({ rides: [] })),
        RideService.getMyRides({ status: 'planned' }).catch(() => ({ rides: [] }))
      ]);

      setJoinedRides([...(activeRes?.rides || []), ...(upcomingRes?.rides || [])]);
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleStartSolo = async () => {
    // Check if there's already an active ride
    const activeRide = joinedRides.find(r => r.status === 'active' || r.status === 'ACTIVE');
    if (activeRide) {
      Alert.alert('Ride in Progress', 'You already have an active ride. End it before starting a new one.');
      return;
    }

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to start a ride.');
        return;
      }
      setIsLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      const response = await RideService.startSoloRide({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      if (response && response.ride) {
        router.push(`/(main)/rides/${response.ride.id}`);
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to start solo ride");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndRide = (rideId) => {
    console.log("Open End Ride Modal for:", rideId);
    setSelectedRideId(rideId);
    setEndRideModalVisible(true);
  };

  const confirmEndRide = async () => {
    console.log("Confirming End Ride for:", selectedRideId);
    if (!selectedRideId) return;
    setEndRideModalVisible(false);
    setIsLoading(true);
    try {
      await RideService.endRide(selectedRideId);
      fetchData(); // Refresh list
    } catch (error) {
      // Use simple alert for error, safe enough usually, or could use another modal state
      console.error(error);
      setTimeout(() => Alert.alert("Error", error.message || "Failed to end ride"), 500);
    } finally {
      setIsLoading(false);
      setSelectedRideId(null);
    }
  };

  const normalizeUrl = (url) => {
    if (url && url.startsWith('/')) {
      return `${process.env.EXPO_PUBLIC_API_BASE_URL_DEV}${url}`;
    }
    return url;
  };

  const renderRideCard = ({ item }) => {
    const posterUrl = normalizeUrl(item.ride_poster_url) || getRandomImage(item.id);
    const isActive = item.status === 'active';
    const isSolo = item.ride_type === 'Quick Ride' || item.max_riders === 1;
    const timeString = dayjs(item.scheduled_date).format('HH:mm');
    const squadName = item.organization?.name || 'SQUAD';

    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.cardInner}
          activeOpacity={0.9}
          onPress={() => router.push(`/(main)/rides/${item.id}`)}
        >
          <Image
            source={{ uri: posterUrl }}
            style={styles.cardImage}
          />
          <View style={styles.cardOverlay} />
          <View style={styles.cardContent}>
            {!isSolo && (
              <View style={styles.squadTag}>
                <Text style={styles.squadTagText}>{squadName.toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.cardMainText}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.ride_type || 'Ride'} • {timeString}</Text>
            </View>

            <TouchableOpacity
              style={[
                isActive ? styles.cardButtonActive : styles.cardButtonInactive,
                isActive && !isSolo && { backgroundColor: '#FF5252' }
              ]}
              onPress={() => {
                if (isActive && !isSolo) {
                  handleEndRide(item.id);
                } else {
                  router.push(`/(main)/rides/${item.id}`);
                }
              }}
            >
              <MaterialCommunityIcons
                name={isActive ? (!isSolo ? "stop-circle-outline" : "map-marker-radius") : "clock-outline"}
                size={18}
                color={isActive && !isSolo ? "white" : (isActive ? "black" : "white")}
              />
              <Text style={[
                isActive ? styles.cardButtonTextActive : styles.cardButtonTextInactive,
                isActive && !isSolo && { color: 'white' }
              ]}>
                {isActive ? (!isSolo ? 'END RIDE' : 'OPEN') : 'SCHEDULED'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#050a05" />

      {/* Top Header */}
      <SafeAreaView style={styles.headerContainer} edges={['top']}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerAvatarWrapper}>
              <Image
                source={{ uri: normalizeUrl(user?.profile_picture_url) || `https://ui-avatars.com/api/?name=${user?.name || 'Rider'}&background=0df20d&color=000` }}
                style={styles.headerAvatar}
              />
            </View>
            <View>
              <Text style={styles.headerName}>{user?.name?.toUpperCase() || 'RIDER'}</Text>
              <Text style={styles.headerStatus}>
                {isSuperAdmin ? 'SUPER ADMIN' : (isOrgAdmin ? 'ORG ADMIN' : 'RIDER')}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity><MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.primary} /></TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(main)/(tabs)/settings')}><MaterialCommunityIcons name="cog-outline" size={24} color={COLORS.primary} /></TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Section 1: Fog of War / Gamified Header */}
        <View style={styles.sectionGamified}>
          <View style={styles.gamifiedTop}>
            <View>
              <Text style={styles.fogLabel}>FOG OF WAR</Text>
              <View style={styles.fogValueWrapper}>
                <Text style={styles.fogValue}>42.8</Text>
                <Text style={styles.fogUnit}>%</Text>
              </View>
            </View>
            <View style={styles.badgesRow}>
              <View style={styles.badge}><MaterialCommunityIcons name="weather-night" size={16} color={COLORS.primary} /></View>
              <View style={[styles.badge, styles.badgeOverlap]}><MaterialCommunityIcons name="compass-outline" size={16} color={COLORS.primary} /></View>
              <View style={[styles.badge, styles.badgeOverlap]}><MaterialCommunityIcons name="speedometer" size={16} color={COLORS.primary} /></View>
            </View>
          </View>
          {/* Progress Bar */}
          <View style={styles.xpBarContainer}>
            <View style={[styles.xpBarFill, { width: '42.8%' }]} />
          </View>
        </View>

        {/* Section 2: Joined Rides Carousel */}
        <View style={styles.sectionCarousel}>
          <View style={styles.carouselHeader}>
            <Text style={styles.sectionTitle}>JOINED RIDES</Text>
            {joinedRides.length > 0 &&
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{joinedRides.length} ACTIVE</Text>
              </View>
            }
          </View>

          {joinedRides.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselScroll}
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
              paddingHorizontal={16}
            >
              {joinedRides.map(ride => (
                <View key={ride.id} style={{ marginRight: CARD_SPACING }}>
                  {renderRideCard({ item: ride })}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>NO ACTIVE RIDES</Text>
            </View>
          )}
        </View>

        {/* Section 3: Action Section (Start vs Active) */}
        {joinedRides.find(r => r.status === 'active' || r.status === 'ACTIVE') ?             /* ACTIVE RIDE CARD */
          (() => {
            const activeRide = joinedRides.find(r => r.status === 'active' || r.status === 'ACTIVE');
            const isSolo = activeRide.ride_type === 'Quick Ride' || activeRide.max_riders === 1;
            return (
              <View style={styles.sectionAction}>
                <View style={styles.actionHeader}>
                  <View>
                    <Text style={styles.actionTitle}>SESSION ACTIVE</Text>
                    <Text style={styles.actionSubtitle}>{activeRide.name}</Text>
                  </View>
                  <View style={[styles.actionIconBg, { backgroundColor: 'rgba(13, 242, 13, 0.2)' }]}>
                    <MaterialCommunityIcons name="broadcast" size={20} color={COLORS.primary} />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {!isSolo && (
                    <TouchableOpacity
                      style={[styles.initiateButton, { flex: 1 }]}
                      onPress={() => router.push(`/(main)/rides/${activeRide.id}`)}
                    >
                      <MaterialCommunityIcons name="map-marker-radius" size={20} color={COLORS.primary} />
                      <Text style={styles.initiateButtonText}>GO LIVE</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.initiateButton, { flex: 1, borderColor: COLORS.danger, backgroundColor: 'rgba(255, 59, 59, 0.1)', marginLeft: isSolo ? 0 : 0 }]}
                    onPress={() => handleEndRide(activeRide.id)}
                  >
                    <MaterialCommunityIcons name="stop-circle-outline" size={20} color={COLORS.danger} />
                    <Text style={[styles.initiateButtonText, { color: COLORS.danger }]}>END RIDE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })() : (
            /* START SOLO / GROUP CARD */
            <View style={styles.sectionAction}>
              <View style={styles.actionHeader}>
                <View>
                  <Text style={styles.actionTitle}>Start Solo Ride</Text>
                  <Text style={styles.actionSubtitle}>Ready for a solo session?</Text>
                </View>
                <View style={styles.actionIconBg}>
                  <MaterialCommunityIcons name="navigation" size={24} color={COLORS.primary} />
                </View>
              </View>

              <View style={styles.inviteRow}>
                <View style={styles.inviteAvatars}>
                  <View style={styles.inviteCircle}><MaterialCommunityIcons name="account-plus" size={14} color="rgba(13,242,13,0.4)" /></View>
                  <View style={[styles.inviteCircle, styles.inviteOverlap]}><MaterialCommunityIcons name="account-plus" size={14} color="rgba(13,242,13,0.4)" /></View>
                  <View style={[styles.inviteCircle, styles.inviteOverlap]}><MaterialCommunityIcons name="account-plus" size={14} color="rgba(13,242,13,0.4)" /></View>
                </View>
                <Text style={styles.inviteText}>Invite friends for bonus XP</Text>
              </View>

              <TouchableOpacity style={styles.initiateButton} onPress={handleStartSolo}>
                <MaterialCommunityIcons name="play-circle" size={24} color={COLORS.primary} />
                <Text style={styles.initiateButtonText}>INITIATE SESSION</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.groupButtonLink}
                onPress={() => router.push('/(main)/rides/create?mode=group')}
              >
                <Text style={styles.groupButtonText}>OR PLAN A GROUP RIDE</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.slate500} />
              </TouchableOpacity>
            </View>
          )}

        {/* Section 4: Path Intel Banner */}
        <View style={styles.sectionIntel}>
          <View style={styles.intelIcon}>
            <MaterialCommunityIcons name="weather-windy" size={20} color={COLORS.amber500} />
          </View>
          <View style={styles.intelContent}>
            <Text style={styles.intelLabel}>PATH INTEL ALERT</Text>
            <Text style={styles.intelDesc}>Heavy crosswinds reported 5km ahead on Ridge Pass.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.slate500} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={endRideModalVisible}
        onRequestClose={() => setEndRideModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>End Ride?</Text>
            <Text style={styles.modalText}>Are you sure you want to end this ride? This action cannot be undone.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setEndRideModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmEndRide}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>End Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
  },
  headerContainer: {
    backgroundColor: 'rgba(5, 10, 5, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 242, 13, 0.1)',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatarWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 242, 13, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(13, 242, 13, 0.4)',
    overflow: 'hidden',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  headerName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  headerStatus: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Gamified Section
  sectionGamified: {
    marginBottom: 32,
    gap: 16,
  },
  gamifiedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  fogLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  fogValueWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  fogValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  fogUnit: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 2,
  },
  badgesRow: {
    flexDirection: 'row',
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'black',
    borderWidth: 1,
    borderColor: 'rgba(13, 242, 13, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0df20d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  badgeOverlap: {
    marginLeft: -8,
  },

  xpBarContainer: {
    height: 12,
    backgroundColor: 'rgba(13, 242, 13, 0.1)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(13, 242, 13, 0.2)',
    padding: 2,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    shadowColor: '#0df20d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },

  // Carousel
  sectionCarousel: {
    marginBottom: 32,
  },
  carouselHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.slate500,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  activeBadge: {
    backgroundColor: 'rgba(13, 242, 13, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(13, 242, 13, 0.2)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.primary,
  },
  carouselScroll: {
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardInner: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: COLORS.cardDark,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 5,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
    gap: 12,
  },
  squadTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(13, 242, 13, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(13, 242, 13, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  squadTagText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardMainText: {
    marginBottom: 4,
  },
  cardTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  cardSubtitle: {
    color: COLORS.slate400,
    fontSize: 12,
  },
  cardButtonActive: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  cardButtonInactive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  cardButtonTextActive: {
    color: 'black',
    fontWeight: '700',
    fontSize: 14,
  },
  cardButtonTextInactive: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontWeight: '700',
    fontSize: 12,
  },

  // Action Section
  sectionAction: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 242, 13, 0.2)',
    padding: 20,
    marginBottom: 32,
    shadowColor: '#0df20d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  actionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionSubtitle: {
    color: COLORS.slate400,
    fontSize: 14,
  },
  actionIconBg: {
    backgroundColor: 'rgba(13, 242, 13, 0.2)',
    padding: 8,
    borderRadius: 8,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  inviteAvatars: {
    flexDirection: 'row',
  },
  inviteCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(13, 242, 13, 0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(13, 242, 13, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteOverlap: {
    marginLeft: -12,
  },
  inviteText: {
    color: COLORS.slate400,
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  initiateButton: {
    width: '100%',
    backgroundColor: 'rgba(13, 242, 13, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  initiateButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  groupButtonLink: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  groupButtonText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Path Intel
  sectionIntel: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  intelIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  intelContent: {
    flex: 1,
  },
  intelLabel: {
    color: COLORS.amber500,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  intelDesc: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalText: {
    color: COLORS.slate400,
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.danger,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
});
