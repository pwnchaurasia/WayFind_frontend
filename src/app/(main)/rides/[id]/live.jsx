/**
 * LiveRideScreen - Main screen for active ride tracking
 * Features:
 * - Tabbed interface: Activity Feed, Riders List
 * - Auto check-in with location detection
 * - SOS/Alert functionality
 * - Real-time updates
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Animated,
    Vibration,
    AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { theme } from '@/src/styles/theme';
import { useAuth } from '@/src/context/AuthContext';
import RideService from '@/src/apis/rideService';
import LiveRideLocationService from '@/src/services/LiveRideLocationService';
import ActivityFeed from '@/src/components/liveride/ActivityFeed';
import RidersList from '@/src/components/liveride/RidersList';

const TABS = [
    { key: 'activity', label: 'Activity', icon: 'activity' },
    { key: 'riders', label: 'Riders', icon: 'users' },
];

const POLL_INTERVAL = 15000; // 15 seconds

const LiveRideScreen = () => {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();

    // State
    const [loading, setLoading] = useState(true);
    const [ride, setRide] = useState(null);
    const [activeTab, setActiveTab] = useState('activity');
    const [activities, setActivities] = useState([]);
    const [riderLocations, setRiderLocations] = useState([]);
    const [checkpoints, setCheckpoints] = useState([]);
    const [myAttendance, setMyAttendance] = useState({});
    const [isTracking, setIsTracking] = useState(false);
    const [nearbyCheckpoint, setNearbyCheckpoint] = useState(null);
    const [checkingIn, setCheckingIn] = useState(false);
    const [sendingAlert, setSendingAlert] = useState(false);
    const [newActivityIds, setNewActivityIds] = useState(new Set());

    // Refs
    const pollIntervalRef = useRef(null);
    const previousActivityCount = useRef(0);
    const appState = useRef(AppState.currentState);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Fetch live ride data
    const fetchLiveData = useCallback(async () => {
        try {
            const data = await RideService.getLiveData(id);

            if (data.status === 'success') {
                setRide({ status: data.ride_status });
                setRiderLocations(data.rider_locations || []);
                setCheckpoints(data.checkpoints || []);
                setMyAttendance(data.my_attendance || {});

                // Handle new activities
                const newActivities = data.activities || [];
                if (newActivities.length > previousActivityCount.current) {
                    // Mark new activities
                    const existingIds = new Set(activities.map(a => a.id));
                    const newIds = new Set(
                        newActivities
                            .filter(a => !existingIds.has(a.id))
                            .map(a => a.id)
                    );
                    setNewActivityIds(newIds);

                    // Vibrate for new activity (if not first load)
                    if (previousActivityCount.current > 0 && newIds.size > 0) {
                        Vibration.vibrate(100);
                    }
                }

                setActivities(newActivities);
                previousActivityCount.current = newActivities.length;
            }
        } catch (error) {
            console.error('Error fetching live data:', error);
        } finally {
            setLoading(false);
        }
    }, [id, activities]);

    // Start/stop location tracking
    const startTracking = async () => {
        try {
            const permission = await LiveRideLocationService.requestLocationPermission();
            if (!permission.granted) {
                Alert.alert(
                    'Location Required',
                    'Location permission is required for live tracking and auto check-in.',
                    [{ text: 'OK' }]
                );
                return;
            }

            await LiveRideLocationService.startRideTracking(
                id,
                checkpoints,
                (location, nearby) => {
                    // Handle nearby checkpoint detection
                    if (nearby && !myAttendance[nearby.type]) {
                        setNearbyCheckpoint(nearby);
                        startPulseAnimation();
                    } else {
                        setNearbyCheckpoint(null);
                    }
                }
            );

            setIsTracking(true);
        } catch (error) {
            console.error('Failed to start tracking:', error);
            Alert.alert('Error', 'Failed to start location tracking');
        }
    };

    const stopTracking = async () => {
        await LiveRideLocationService.stopRideTracking();
        setIsTracking(false);
        setNearbyCheckpoint(null);
    };

    // Pulse animation for check-in prompt
    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    // Handle check-in
    const handleCheckIn = async () => {
        if (checkingIn) return;

        setCheckingIn(true);
        try {
            const result = await LiveRideLocationService.performCheckIn(id);

            if (result.status === 'success') {
                Alert.alert('✓ Checked In!', result.message);
                setNearbyCheckpoint(null);
                pulseAnim.setValue(1);
                fetchLiveData(); // Refresh data
            } else if (result.status === 'already_checked_in') {
                Alert.alert('Already Checked In', result.message);
                setNearbyCheckpoint(null);
            } else if (result.status === 'not_at_checkpoint') {
                Alert.alert('Not at Checkpoint', result.message);
            }
        } catch (error) {
            Alert.alert('Check-in Failed', error.detail || 'Please try again');
        } finally {
            setCheckingIn(false);
        }
    };

    // Handle SOS alert
    const handleSOS = () => {
        Alert.alert(
            '🚨 Send SOS Alert?',
            'This will notify all riders that you need immediate help.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send SOS',
                    style: 'destructive',
                    onPress: async () => {
                        setSendingAlert(true);
                        try {
                            await LiveRideLocationService.sendSOSAlert(id, 'sos_alert');
                            Alert.alert('SOS Sent', 'All riders have been notified of your emergency.');
                            fetchLiveData();
                        } catch (error) {
                            Alert.alert('Failed', 'Could not send SOS. Please try again.');
                        } finally {
                            setSendingAlert(false);
                        }
                    }
                }
            ]
        );
    };

    // Handle quick alerts
    const handleQuickAlert = (type) => {
        const alertLabels = {
            'low_fuel': 'Low Fuel',
            'breakdown': 'Breakdown',
            'need_help': 'Need Help'
        };

        Alert.alert(
            `Send ${alertLabels[type]} Alert?`,
            'Other riders will see this in the activity feed.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send',
                    onPress: async () => {
                        try {
                            await LiveRideLocationService.sendSOSAlert(id, type);
                            Alert.alert('Alert Sent', 'Riders have been notified.');
                            fetchLiveData();
                        } catch (error) {
                            Alert.alert('Failed', 'Could not send alert.');
                        }
                    }
                }
            ]
        );
    };

    // Handle app state changes
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextState => {
            if (appState.current.match(/inactive|background/) && nextState === 'active') {
                // App came to foreground - refresh data
                fetchLiveData();
            }
            appState.current = nextState;
        });

        return () => subscription?.remove();
    }, [fetchLiveData]);

    // Initialize and cleanup
    useEffect(() => {
        fetchLiveData();

        // Start polling
        pollIntervalRef.current = setInterval(fetchLiveData, POLL_INTERVAL);

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
            stopTracking();
        };
    }, [id]);

    // Start tracking when ride data is loaded
    useEffect(() => {
        if (ride?.status === 'active' && checkpoints.length > 0 && !isTracking) {
            startTracking();
        }
    }, [ride?.status, checkpoints.length]);

    // Refresh on focus
    useFocusEffect(
        useCallback(() => {
            fetchLiveData();
        }, [])
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading live ride...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={22} color="white" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Live Ride</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.liveIndicator}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>
                        {isTracking && (
                            <View style={styles.trackingBadge}>
                                <Feather name="navigation" size={12} color={theme.colors.primary} />
                                <Text style={styles.trackingText}>Tracking</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* SOS Button */}
                <TouchableOpacity
                    style={styles.sosBtn}
                    onPress={handleSOS}
                    disabled={sendingAlert}
                >
                    {sendingAlert ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.sosText}>SOS</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Check-in Prompt (when near checkpoint) */}
            {nearbyCheckpoint && (
                <Animated.View
                    style={[
                        styles.checkInPrompt,
                        { transform: [{ scale: pulseAnim }] }
                    ]}
                >
                    <View style={styles.checkInInfo}>
                        <Feather name="map-pin" size={20} color="white" />
                        <View>
                            <Text style={styles.checkInTitle}>You're at {nearbyCheckpoint.type}</Text>
                            <Text style={styles.checkInSubtitle}>
                                {Math.round(nearbyCheckpoint.distance)}m away - Tap to check in
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.checkInBtn}
                        onPress={handleCheckIn}
                        disabled={checkingIn}
                    >
                        {checkingIn ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <Feather name="check" size={18} color="white" />
                                <Text style={styles.checkInBtnText}>Check In</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Feather
                            name={tab.icon}
                            size={18}
                            color={activeTab === tab.key ? theme.colors.primary : '#888'}
                        />
                        <Text style={[
                            styles.tabLabel,
                            activeTab === tab.key && styles.tabLabelActive
                        ]}>
                            {tab.label}
                        </Text>

                        {/* Badge for new activities */}
                        {tab.key === 'activity' && newActivityIds.size > 0 && activeTab !== 'activity' && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{newActivityIds.size}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeTab === 'activity' ? (
                    <ActivityFeed
                        activities={activities}
                        newActivityIds={newActivityIds}
                        onRefresh={fetchLiveData}
                        refreshing={loading}
                    />
                ) : (
                    <RidersList
                        riders={riderLocations}
                        isAdmin={true} // TODO: Check actual admin status
                        currentUserId={user?.id}
                        onNavigateToRider={(rider) => {
                            // TODO: Open map with directions
                            Alert.alert('Navigate', `Get directions to ${rider.name}`);
                        }}
                    />
                )}
            </View>

            {/* Quick Alert Bar */}
            <View style={styles.alertBar}>
                <TouchableOpacity
                    style={styles.alertBtn}
                    onPress={() => handleQuickAlert('low_fuel')}
                >
                    <MaterialCommunityIcons name="fuel" size={20} color="#FF9800" />
                    <Text style={styles.alertBtnText}>Low Fuel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.alertBtn}
                    onPress={() => handleQuickAlert('breakdown')}
                >
                    <Feather name="tool" size={18} color="#FF5252" />
                    <Text style={styles.alertBtnText}>Breakdown</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.alertBtn}
                    onPress={() => handleQuickAlert('need_help')}
                >
                    <Feather name="help-circle" size={18} color="#2196F3" />
                    <Text style={styles.alertBtnText}>Need Help</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: theme.colors.textSecondary,
        fontSize: 15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backBtn: {
        padding: 8,
    },
    headerCenter: {
        flex: 1,
        marginLeft: 8,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 2,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF1744',
    },
    liveText: {
        color: '#FF1744',
        fontSize: 11,
        fontWeight: '700',
    },
    trackingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 200, 83, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    trackingText: {
        color: theme.colors.primary,
        fontSize: 11,
        fontWeight: '500',
    },
    sosBtn: {
        backgroundColor: '#FF1744',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        minWidth: 60,
        alignItems: 'center',
    },
    sosText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '800',
    },
    checkInPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.primary,
        marginHorizontal: 16,
        marginTop: 12,
        padding: 14,
        borderRadius: 12,
    },
    checkInInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    checkInTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    checkInSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    checkInBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    checkInBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary,
    },
    tabLabel: {
        color: '#888',
        fontSize: 14,
        fontWeight: '500',
    },
    tabLabelActive: {
        color: theme.colors.primary,
    },
    badge: {
        backgroundColor: '#FF1744',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    alertBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    alertBtn: {
        alignItems: 'center',
        gap: 4,
    },
    alertBtnText: {
        color: theme.colors.textSecondary,
        fontSize: 11,
    },
});

export default LiveRideScreen;
