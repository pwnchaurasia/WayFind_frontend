import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Image,
    StatusBar,
    Modal,
    Dimensions,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { router } from 'expo-router';
import RideService from '@/src/apis/rideService';
import OrganizationService from '@/src/apis/organizationService';
import dayjs from 'dayjs';

// --- CONSTANTS & THEME ---
const { width } = Dimensions.get('window');

const COLORS = {
    primary: '#0df24a',
    backgroundDark: '#102215',
    cardDark: 'rgba(255, 255, 255, 0.05)',
    text: '#ffffff',
    textDim: '#94a3b8',
    danger: '#FF5252',
    border: 'rgba(255, 255, 255, 0.1)',
    activeTab: '#ffffff',
    inactiveTab: '#94a3b8',
};

const PLACEHOLDER_IMAGES = [
    'https://images.unsplash.com/photo-1762178103168-58472e27126e?q=80&w=3338&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1767652784202-214920d12a85?q=80&w=1935&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1758550713886-1ba2390293af?q=80&w=3540&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1762178250159-7429ce17185d?q=80&w=3540&auto=format&fit=crop',
];

const getRandomImage = (id) => {
    if (!id) return PLACEHOLDER_IMAGES[0];
    const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return PLACEHOLDER_IMAGES[sum % PLACEHOLDER_IMAGES.length];
};

export default function RidesScreen() {
    const { user } = useAuth();

    // Data State
    const [activeRides, setActiveRides] = useState([]);
    const [upcomingRides, setUpcomingRides] = useState([]);
    const [pastRides, setPastRides] = useState([]);

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('Upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Modal State
    const [endRideModalVisible, setEndRideModalVisible] = useState(false);
    const [selectedRideId, setSelectedRideId] = useState(null);

    const fetchData = async () => {
        try {
            // 1. Fetch Dashboard to check Admin Status
            const dashboard = await OrganizationService.getDashboard().catch(() => ({}));
            const isAdmin = dashboard?.is_super_admin || dashboard?.is_org_admin;

            // 2. Fetch User's Joined Rides (Base)
            const [activeRes, upcomingRes, pastRes] = await Promise.all([
                RideService.getMyRides({ status: 'active' }).catch(() => ({ rides: [] })),
                RideService.getMyRides({ status: 'planned' }).catch(() => ({ rides: [] })),
                RideService.getMyRides({ status: 'completed' }).catch(() => ({ rides: [] }))
            ]);

            let allActive = activeRes?.rides || [];
            let allUpcoming = upcomingRes?.rides || [];
            let allPast = pastRes?.rides || [];

            // 3. If Admin, Fetch All Rides for Managed Orgs
            if (isAdmin) {
                try {
                    const orgsRes = await OrganizationService.getAllOrganizations();
                    const orgs = Array.isArray(orgsRes) ? orgsRes : (orgsRes?.organizations || []);

                    // Filter for orgs where user is admin/lead/owner
                    // Note: Checking common role field names
                    const adminOrgs = orgs.filter(o => {
                        const r = (o.my_role || o.role || '').toLowerCase();
                        return ['admin', 'owner', 'founder', 'lead'].includes(r);
                    });

                    // Fetch rides for each admin org
                    for (const org of adminOrgs) {
                        const orgRidesRes = await OrganizationService.getOrganizationRides(org.id, true);
                        const orgRides = orgRidesRes?.rides || [];

                        orgRides.forEach(ride => {
                            // Determine status category
                            const status = (ride.status || '').toLowerCase();
                            if (status === 'active') {
                                if (!allActive.some(r => r.id === ride.id)) allActive.push(ride);
                            } else if (status === 'planned' || status === 'scheduled') {
                                if (!allUpcoming.some(r => r.id === ride.id)) allUpcoming.push(ride);
                            } else if (status === 'completed' || status === 'cancelled') {
                                if (!allPast.some(r => r.id === ride.id)) allPast.push(ride);
                            }
                        });
                    }
                } catch (e) {
                    console.error('Failed to fetch admin org rides:', e);
                }
            }

            // 4. Update State
            // Sort Upcoming by Date ASC
            allUpcoming.sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
            // Sort Past by Date DESC
            allPast.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date));

            setActiveRides(allActive);
            setUpcomingRides(allUpcoming);
            setPastRides(allPast);

            if (allActive.length > 0 && filter === 'Upcoming') {
                setFilter('Live');
            }
        } catch (error) {
            console.error('Failed to fetch rides data:', error);
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

    const normalizeUrl = (url) => {
        if (url && url.startsWith('/')) {
            return `${process.env.EXPO_PUBLIC_API_BASE_URL_DEV}${url}`;
        }
        return url;
    };

    const openEndRideModal = (rideId) => {
        setSelectedRideId(rideId);
        setEndRideModalVisible(true);
    };

    const confirmEndRide = async () => {
        if (!selectedRideId) return;
        setEndRideModalVisible(false);
        setIsLoading(true);
        try {
            await RideService.endRide(selectedRideId);
            await fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            setSelectedRideId(null);
        }
    };

    const renderLiveSection = (ride) => {
        if (!ride) return null;

        // Solo check: If max_riders is 1 OR ride_type is exactly 'Quick Ride'
        const isSolo = ride.ride_type === 'Quick Ride' || ride.max_riders === 1;
        const squadName = ride.organization?.name || 'SQUADRA RACING';
        const posterUrl = normalizeUrl(ride.ride_poster_url) || getRandomImage(ride.id);

        return (
            <View style={styles.liveCard}>
                <Image source={{ uri: posterUrl }} style={styles.liveCardBg} resizeMode="cover" />
                <View style={styles.liveCardOverlay} />

                <View style={styles.liveCardBadgeRow}>
                    <View style={styles.squadBadge}>
                        <View style={styles.squadBadgeIcon}>
                            <Text style={{ fontSize: 8, fontWeight: 'bold', color: COLORS.backgroundDark }}>S</Text>
                        </View>
                        <Text style={styles.squadBadgeText}>{squadName.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.liveCardContent}>
                    <View style={styles.liveCardHeader}>
                        <Text style={styles.liveCardTitle}>{ride.name}</Text>
                        <View style={styles.statusChip}>
                            <Text style={styles.statusChipText}>Checked In</Text>
                        </View>
                    </View>

                    <Text style={styles.liveCardSubtitle}>Main Peloton • {ride.num_participants || 1} Riders joined</Text>

                    <TouchableOpacity
                        style={[styles.liveActionButton, isSolo ? { backgroundColor: COLORS.danger } : {}]}
                        activeOpacity={0.9}
                        onPress={() => {
                            if (isSolo) {
                                openEndRideModal(ride.id);
                            } else {
                                router.push(`/(main)/rides/${ride.id}`);
                            }
                        }}
                    >
                        <MaterialCommunityIcons
                            name={isSolo ? "stop-circle-outline" : "play-circle"}
                            size={24}
                            color={isSolo ? "white" : COLORS.backgroundDark}
                        />
                        <Text style={[styles.liveActionText, isSolo ? { color: 'white' } : {}]}>
                            {isSolo ? "END RIDE" : "JOIN RIDE"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderUpcomingCard = (item) => {
        const posterUrl = normalizeUrl(item.ride_poster_url) || getRandomImage(item.id);
        const timeString = dayjs(item.scheduled_date).format('ddd, MMM D • HH:mm');
        const squadName = item.organization?.name || 'SQUAD';

        return (
            <View key={item.id} style={styles.upcomingCard}>
                <View style={styles.upcomingCardInner}>
                    <Image source={{ uri: posterUrl }} style={styles.upcomingImage} />
                    <View style={styles.upcomingInfo}>
                        <Text style={styles.upcomingDate}>{timeString}</Text>
                        <Text style={styles.upcomingTitle} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.upcomingSquadRow}>
                            <View style={styles.upcomingSquadIcon} />
                            <Text style={styles.upcomingSquadText}>{squadName}</Text>
                        </View>
                    </View>
                    <View style={styles.upcomingActions}>
                        <View style={styles.pendingChip}>
                            <Text style={styles.pendingChipText}>Pending</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.checkInButton}
                            onPress={() => router.push(`/(main)/rides/${item.id}`)}
                        >
                            <Text style={styles.checkInText}>Details</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderPastCard = (item) => {
        const posterUrl = normalizeUrl(item.ride_poster_url) || getRandomImage(item.id);
        const distance = (Math.random() * 50 + 10).toFixed(1);
        const timeString = dayjs(item.scheduled_date).format('ddd, MMM D • HH:mm');

        return (
            <TouchableOpacity
                key={item.id}
                style={styles.upcomingCard} // Reusing List Card Style
                onPress={() => router.push(`/(main)/rides/${item.id}`)}
            >
                <View style={styles.upcomingCardInner}>
                    <Image source={{ uri: posterUrl }} style={styles.upcomingImage} />
                    <View style={styles.upcomingInfo}>
                        <Text style={styles.upcomingDate}>{timeString}</Text>
                        <Text style={styles.upcomingTitle} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.pastStatsRow}>
                            <View style={styles.pastStat}>
                                <MaterialCommunityIcons name="map-marker-distance" size={14} color={COLORS.textDim} />
                                <Text style={styles.pastStatText}>{distance} km</Text>
                            </View>
                            <View style={styles.pastStat}>
                                <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={COLORS.textDim} />
                                <Text style={styles.pastStatText}>45m</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.upcomingActions}>
                        <View style={[styles.pendingChip, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                            <Text style={styles.pendingChipText}>COMPLETED</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textDim} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Filtered Data for Search
    const getFilteredRides = () => {
        const all = [...activeRides, ...upcomingRides, ...pastRides];
        if (!searchQuery.trim()) return all;
        return all.filter(r => r.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    };

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />

            <SafeAreaView style={styles.header} edges={['top']}>
                {isSearching ? (
                    <View style={[styles.headerContent, { paddingVertical: 8 }]}>
                        <View style={styles.searchBar}>
                            <MaterialCommunityIcons name="magnify" size={22} color={COLORS.textDim} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search all rides..."
                                placeholderTextColor={COLORS.textDim}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }}>
                                <MaterialCommunityIcons name="close" size={22} color={COLORS.textDim} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.headerContent}>
                        <View style={styles.headerLeft}>
                            <MaterialCommunityIcons name="bike" size={28} color={COLORS.primary} />
                            <Text style={styles.headerTitle}>Rides Library</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <TouchableOpacity style={styles.iconButton} onPress={() => setIsSearching(true)}>
                                <MaterialCommunityIcons name="magnify" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(main)/(tabs)/settings')}>
                                <View>
                                    <MaterialCommunityIcons name="bell-outline" size={24} color={COLORS.text} />
                                    <View style={styles.notificationDot} />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(main)/(tabs)/settings')}>
                                <MaterialCommunityIcons name="cog-outline" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {!isSearching && (
                    <View style={styles.filterContainer}>
                        <View style={styles.filterWrapper}>
                            {['Live', 'Upcoming', 'Past'].map((tab) => {
                                const isActive = filter === tab;
                                return (
                                    <TouchableOpacity
                                        key={tab}
                                        style={[styles.filterTab, isActive && styles.filterTabActive]}
                                        onPress={() => setFilter(tab)}
                                    >
                                        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{tab}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}
            </SafeAreaView>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {isSearching ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>SEARCH RESULTS</Text>
                        <View style={styles.cardList}>
                            {getFilteredRides().length > 0 ? getFilteredRides().map(r =>
                                (r.status === 'active' || r.status === 'ACTIVE')
                                    ? <View key={r.id}>{renderLiveSection(r)}</View> // Show big card for active matches
                                    : (r.status === 'completed' || r.status === 'COMPLETED')
                                        ? renderPastCard(r)
                                        : renderUpcomingCard(r)
                            ) : (
                                <Text style={styles.emptyText}>No matches found.</Text>
                            )}
                        </View>
                    </View>
                ) : (
                    <>
                        {filter === 'Live' && (
                            activeRides.length > 0 ? (
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <View style={styles.liveIndicator}>
                                            <View style={styles.liveDotRing} />
                                            <View style={styles.liveDot} />
                                        </View>
                                        <Text style={styles.sectionTitlePrimary}>Live Now</Text>
                                    </View>
                                    <View style={{ gap: 16 }}>
                                        {activeRides.map(ride => (
                                            <View key={ride.id}>
                                                {renderLiveSection(ride)}
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ) : (
                                <Text style={styles.emptyText}>No active rides currently live.</Text>
                            )
                        )}

                        {filter === 'Upcoming' && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionTitle}>SCHEDULED</Text>
                                </View>
                                <View style={styles.cardList}>
                                    {upcomingRides.length > 0 ? upcomingRides.map(renderUpcomingCard) : (
                                        <Text style={styles.emptyText}>No upcoming rides scheduled.</Text>
                                    )}
                                </View>
                            </View>
                        )}

                        {filter === 'Past' && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionTitle}>RECENT RIDES</Text>
                                </View>
                                <View style={styles.cardList}>
                                    {pastRides.length > 0 ? pastRides.map(renderPastCard) : (
                                        <Text style={styles.emptyText}>No ride history available.</Text>
                                    )}
                                </View>
                            </View>
                        )}
                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={endRideModalVisible}
                onRequestClose={() => setEndRideModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>End Ride?</Text>
                        <Text style={styles.modalText}>Are you sure you want to end this ride?</Text>
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
    header: {
        backgroundColor: 'rgba(16, 34, 21, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 0,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        letterSpacing: -0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        borderWidth: 1,
        borderColor: COLORS.backgroundDark,
    },
    filterContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    filterWrapper: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 4,
        height: 44,
    },
    filterTab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    filterTabActive: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.inactiveTab,
    },
    filterTextActive: {
        color: COLORS.primary,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 24,
    },
    section: {
        gap: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitlePrimary: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textDim,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    seeAllText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.primary,
    },
    liveIndicator: {
        width: 12,
        height: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    liveDotRing: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
        opacity: 0.4,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
    liveCard: {
        height: 320,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: COLORS.cardDark,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    liveCardBg: {
        ...StyleSheet.absoluteFillObject,
    },
    liveCardOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    liveCardBadgeRow: {
        position: 'absolute',
        top: 12,
        left: 12,
    },
    squadBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 8,
        padding: 4,
        paddingRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 6,
    },
    squadBadgeIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    squadBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    liveCardContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        gap: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    liveCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    liveCardTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        marginRight: 8,
    },
    statusChip: {
        backgroundColor: 'rgba(13, 242, 74, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    statusChipText: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: '700',
    },
    liveCardSubtitle: {
        color: COLORS.textDim,
        fontSize: 14,
        marginBottom: 8,
    },
    liveActionButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    liveActionText: {
        color: COLORS.backgroundDark,
        fontSize: 16,
        fontWeight: '700',
    },
    upcomingCard: {
        backgroundColor: COLORS.cardDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    upcomingCardInner: {
        flexDirection: 'row',
        padding: 12,
        gap: 12,
        // alignItems: 'center', // Removed to allow full height for actions
    },
    upcomingImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    upcomingInfo: {
        flex: 1,
        gap: 4,
    },
    upcomingDate: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textDim,
        textTransform: 'uppercase',
    },
    upcomingTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    upcomingSquadRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    upcomingSquadIcon: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
    },
    upcomingSquadText: {
        fontSize: 12,
        color: COLORS.textDim,
    },
    upcomingActions: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        alignSelf: 'stretch',
        flexShrink: 0,
        gap: 8,
    },
    pendingChip: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 999,
    },
    pendingChipText: {
        color: COLORS.textDim,
        fontSize: 10,
        fontWeight: '700',
    },
    checkInButton: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    checkInText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    gridList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    pastCard: {
        width: (width - 16 * 2 - 12) / 2,
        backgroundColor: COLORS.cardDark,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        gap: 8,
    },
    pastImage: {
        width: '100%',
        height: 80,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        opacity: 0.8,
    },
    pastContent: {
        gap: 4,
    },
    pastTitle: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    pastStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    pastStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    pastStatText: {
        color: COLORS.textDim,
        fontSize: 10,
        fontWeight: '500',
    },
    emptyText: {
        color: COLORS.textDim,
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#1e293b',
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
        color: '#94a3b8',
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
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        right: 16,
    },
    fab: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 8,
    },
    fab: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 8,
    },
    cardList: {
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 40,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 14,
    },
});

