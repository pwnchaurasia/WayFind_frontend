/**
 * LiveRideScreen - Premium Live Tracking with OpenStreetMap
 * Features:
 * - OpenStreetMap via WebView + Leaflet (FREE, no Google Maps!)
 * - Live rider markers with profile pictures
 * - Route polyline from start to destination
 * - Top participant bar with auto-center
 * - Ride stats pill (distance/ETA)
 * - Push-to-Talk intercom button
 * - SOS button, Activity notifications
 * - Gloved-hand optimized touch targets
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
    Image,
    ScrollView,
    Dimensions,
    Linking,
    Platform,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';

import { theme } from '@/src/styles/theme';
import { useAuth } from '@/src/context/AuthContext';
import RideService from '@/src/apis/rideService';
import { useIntercom } from '@/src/hooks/useIntercom';
import LiveRideLocationService from '@/src/services/LiveRideLocationService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const POLL_INTERVAL = 10000; // 10 seconds for responsive updates
const STALE_THRESHOLD = 120000; // 2 minutes - mark rider as offline

/**
 * Generate Leaflet HTML for OpenStreetMap
 */
const generateMapHTML = (centerLat, centerLng, zoom = 13) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        * { margin: 0; padding: 0; }
        html, body, #map { height: 100%; width: 100%; }
        .rider-marker {
            width: 48px; height: 48px; border-radius: 50%;
            border: 3px solid #00C853; overflow: hidden;
            background: #333; display: flex;
            align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }
        .rider-marker.lead { 
            border-color: #FF5252 !important; 
            border-width: 4px !important;
            box-shadow: 0 0 12px rgba(255,82,82,0.6);
        }
        .rider-marker.stale { border-color: #555; filter: grayscale(100%); opacity: 0.5; }
        .rider-marker.no-location { opacity: 0.3; }
        .rider-marker.selected { border-color: #00BFFF; border-width: 4px; }
        .rider-marker img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .rider-initials { color: white; font-weight: bold; font-size: 16px; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
        .lead-badge {
            position: absolute; top: -4px; right: -4px;
            background: #FF5252; color: white;
            font-size: 10px; font-weight: bold;
            padding: 2px 4px; border-radius: 4px;
        }
        .checkpoint-marker {
            width: 32px; height: 32px; border-radius: 50%;
            background: #00BFFF; display: flex;
            align-items: center; justify-content: center;
            color: white; font-weight: bold; font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .checkpoint-marker.start { background: #00C853; }
        .checkpoint-marker.end { background: #FF5252; }
        .leaflet-popup-content { margin: 10px 14px; }
        .popup-content { text-align: center; min-width: 180px; }
        .popup-name { font-weight: bold; font-size: 16px; margin-bottom: 4px; color: #333; }
        .popup-role { font-size: 11px; color: #FF5252; font-weight: 600; margin-bottom: 4px; }
        .popup-vehicle { color: #666; font-size: 13px; margin-bottom: 10px; }
        .popup-actions { display: flex; gap: 8px; justify-content: center; }
        .popup-btn { padding: 10px 16px; border-radius: 8px; border: none;
            color: white; font-weight: 600; cursor: pointer; font-size: 13px; }
        .popup-btn.directions { background: #00BFFF; }
        .popup-btn.call { background: #00C853; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], ${zoom});
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap, &copy; CartoDB',
            maxZoom: 19
        }).addTo(map);

        var riderMarkers = {};
        var checkpointMarkers = {};
        var routeLine = null;

        window.updateRiders = function(riders) {
            Object.values(riderMarkers).forEach(m => map.removeLayer(m));
            riderMarkers = {};
            
            riders.forEach(function(rider) {
                if (!rider.hasLocation && !rider.lat) return;
                
                var isStale = rider.isStale;
                var isLead = rider.isLead;
                var hasLocation = rider.hasLocation;
                var initials = rider.initials || 'U';
                var avatarColor = rider.avatarColor || '#FF6B6B';
                
                var classes = 'rider-marker';
                if (isLead) classes += ' lead';
                if (isStale) classes += ' stale';
                if (!hasLocation) classes += ' no-location';
                
                var markerHtml = rider.profilePicture 
                    ? '<div class="' + classes + '"><img src="' + rider.profilePicture + '" /></div>'
                    : '<div class="' + classes + '" style="background:' + avatarColor + '"><span class="rider-initials">' + initials + '</span></div>';
                
                var icon = L.divIcon({ html: markerHtml, className: '', iconSize: [48, 48], iconAnchor: [24, 24] });
                var marker = L.marker([rider.lat, rider.lng], { icon: icon }).addTo(map);
                
                var roleHtml = isLead ? '<div class="popup-role">🎤 RIDE LEAD</div>' : '';
                var vehicleText = rider.vehicle || 'No vehicle info';
                
                var popupHtml = '<div class="popup-content">' +
                    '<div class="popup-name">' + (rider.name || 'Unknown') + '</div>' +
                    roleHtml +
                    '<div class="popup-vehicle">' + vehicleText + '</div>' +
                    '<div class="popup-actions">' +
                        '<button class="popup-btn directions" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({action:\\'directions\\',rider:' + JSON.stringify(rider) + '}))">Directions</button>' +
                        '<button class="popup-btn call" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({action:\\'call\\',rider:' + JSON.stringify(rider) + '}))">Call</button>' +
                    '</div></div>';
                marker.bindPopup(popupHtml);
                riderMarkers[rider.id] = marker;
            });
        };

        window.updateCheckpoints = function(checkpoints) {
            Object.values(checkpointMarkers).forEach(m => map.removeLayer(m));
            checkpointMarkers = {};
            if (routeLine) map.removeLayer(routeLine);
            
            var coords = [];
            checkpoints.forEach(function(cp, i) {
                coords.push([cp.lat, cp.lng]);
                var type = i === 0 ? 'start' : (i === checkpoints.length - 1 ? 'end' : '');
                var icon = L.divIcon({
                    html: '<div class="checkpoint-marker ' + type + '">' + (i + 1) + '</div>',
                    className: '', iconSize: [32, 32], iconAnchor: [16, 16]
                });
                checkpointMarkers[i] = L.marker([cp.lat, cp.lng], { icon: icon }).addTo(map);
            });
            
            if (coords.length > 1) {
                routeLine = L.polyline(coords, { color: '#00BFFF', weight: 5, opacity: 0.9 }).addTo(map);
            }
        };

        window.centerOnRider = function(lat, lng) {
            map.flyTo([lat, lng], 15, { duration: 0.5 });
        };

        window.fitAllMarkers = function() {
            var allCoords = [];
            Object.values(riderMarkers).forEach(m => allCoords.push(m.getLatLng()));
            Object.values(checkpointMarkers).forEach(m => allCoords.push(m.getLatLng()));
            if (allCoords.length > 0) {
                map.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50] });
            }
        };
    </script>
</body>
</html>
`;
};

/**
 * Toast Notification Component
 */
const ToastNotification = ({ message, visible, onHide }) => {
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            Animated.sequence([
                Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.delay(3000),
                Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
            ]).start(() => onHide());
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.toast}>
                <Feather name="bell" size={16} color="#FFD700" />
                <Text style={styles.toastText}>{message}</Text>
            </View>
        </Animated.View>
    );
};

/**
 * Waveform Animation for PTT
 */
const WaveformAnimation = ({ active }) => {
    const bars = [1, 2, 3, 4, 5];
    const animations = useRef(bars.map(() => new Animated.Value(0.3))).current;

    useEffect(() => {
        if (active) {
            const animateWave = () => {
                const randomAnimations = animations.map((anim, i) =>
                    Animated.sequence([
                        Animated.delay(i * 50),
                        Animated.timing(anim, { toValue: Math.random() * 0.7 + 0.3, duration: 150, useNativeDriver: true }),
                    ])
                );
                Animated.parallel(randomAnimations).start(animateWave);
            };
            animateWave();
        } else {
            animations.forEach(anim => anim.setValue(0.3));
        }
    }, [active]);

    return (
        <View style={styles.waveformContainer}>
            {bars.map((_, i) => (
                <Animated.View
                    key={i}
                    style={[styles.waveformBar, { transform: [{ scaleY: animations[i] }] }]}
                />
            ))}
        </View>
    );
};

/* Activity Modal Component */
const ActivityModal = ({ visible, onClose, activities, onSOSClick, riders }) => {
    // Helper to get rider
    const getRider = (activity) => {
        return riders.find(r => r.user_id === activity.user_id || (activity.user_name && r.name === activity.user_name));
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                <TouchableOpacity style={styles.modalDismiss} onPress={onClose} />

                <View style={styles.modalContent}>
                    <View style={styles.modalHandle} />

                    <View style={styles.modalHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={styles.historyIcon}>
                                <Feather name="clock" size={20} color="#FFD700" />
                            </View>
                            <View>
                                <Text style={styles.modalTitle}>Ride Activity</Text>
                                <Text style={styles.modalSubtitle}>Live Updates • {riders.length} Riders</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Feather name="x" size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.listContent}>
                        {activities.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Feather name="activity" size={40} color="#444" />
                                <Text style={styles.emptyText}>No activity yet...</Text>
                                <Text style={styles.bottomPillText}>RIDE STARTED</Text>
                            </View>
                        ) : (
                            <View>
                                {/* Vertical Timeline Line */}
                                <View style={styles.timelineLine} />

                                {activities.map((item, index) => {
                                    const rider = getRider(item);
                                    const isSOS = item.activity_type === 'sos_alert';
                                    let color = '#00BFFF'; // Default Blue
                                    if (isSOS) color = '#FF5252';
                                    else if (item.message?.includes('Checkpoint') || item.message?.includes('Meeting')) color = '#00C853';
                                    else if (item.message?.includes('Offline')) color = '#888';

                                    return (
                                        <View key={index} style={styles.timelineRow}>
                                            <View style={[styles.timelineAvatarRing, { borderColor: isSOS ? '#FF5252' : color, shadowColor: color }]}>
                                                {rider?.profile_picture ? (
                                                    <Image source={{ uri: rider.profile_picture }} style={styles.timelineAvatarImage} />
                                                ) : (
                                                    <View style={[styles.timelineAvatarPlaceholder, { backgroundColor: '#333' }]}>
                                                        <Text style={styles.timelineAvatarInitials}>{rider?.name ? rider.name.charAt(0) : '?'}</Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={{ flex: 1 }}>
                                                {isSOS ? (
                                                    <View style={styles.sosCardExpanded}>
                                                        <View style={styles.sosHeaderRow}>
                                                            <View style={styles.sosBadge}>
                                                                <Text style={styles.sosBadgeText}>CRITICAL ALERT</Text>
                                                            </View>
                                                            <Text style={styles.sosTime}>{new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                                        </View>
                                                        <Text style={styles.sosTitle}>{item.user_name || 'Rider'} triggered SOS</Text>
                                                        <Text style={styles.sosBody}>Location shared with emergency contacts. Tap to view on map.</Text>
                                                        <TouchableOpacity style={styles.sosButton} onPress={() => onSOSClick(item)}>
                                                            <Feather name="map-pin" size={16} color="white" />
                                                            <Text style={styles.sosButtonText}>View Location</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                ) : (
                                                    <View style={styles.timelineCard}>
                                                        <View style={styles.timelineHeaderRow}>
                                                            <Text style={[styles.timelineTitle, { color: color }]}>
                                                                {item.user_name || 'Rider'} <Text style={{ color: 'white', fontWeight: '400' }}>updated status</Text>
                                                            </Text>
                                                            <Text style={styles.timelineTime}>{new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                                        </View>
                                                        <Text style={styles.timelineSubtitle}>{item.message}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {/* Bottom Pill */}
                        <View style={styles.bottomPillContainer}>
                            <View style={styles.bottomPill}>
                                <View style={styles.liveDot} />
                                <Text style={styles.bottomPillText}>LIVE UPDATES ACTIVE</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const LiveRideScreen = () => {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const webViewRef = useRef(null);

    // Core state
    const [loading, setLoading] = useState(true);
    const [mapReady, setMapReady] = useState(false);
    const [ride, setRide] = useState(null);
    const [riderLocations, setRiderLocations] = useState([]);
    const [checkpoints, setCheckpoints] = useState([]);
    const [activities, setActivities] = useState([]);
    const [selectedRider, setSelectedRider] = useState(null);
    const [isTracking, setIsTracking] = useState(false);

    // UI state
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityCount, setActivityCount] = useState(0);
    const [sendingAlert, setSendingAlert] = useState(false);

    // Voice Intercom
    const {
        isConnected: intercomConnected,
        isSpeaking: isRemoteSpeaking,
        speakerName,
        toggleMute,
        isMuted,
        isLead // Am I the lead?
    } = useIntercom(id, true);

    const isSpeaking = isRemoteSpeaking; // For UI compatibility

    // Initial map center (India default)
    const [mapCenter] = useState({ lat: 12.9716, lng: 77.5946 });

    // Refs
    const pollIntervalRef = useRef(null);
    const previousActivityCount = useRef(0);
    const appState = useRef(AppState.currentState);

    // Sort riders: Speaker > Lead > Others (Alpha)
    const sortedRiders = useMemo(() => {
        return [...riderLocations].sort((a, b) => {
            // Speaker priority
            if (speakerName) {
                if (a.name === speakerName) return -1;
                if (b.name === speakerName) return 1;
            }
            // Lead priority
            if (a.is_lead !== b.is_lead) return a.is_lead ? -1 : 1;
            // Name alpha
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [riderLocations, speakerName]);

    // ============================================
    // DATA FETCHING
    // ============================================

    // ... (fetchLiveData code) ...

    // (Update Render Loop below in same file)

    // ...

    const fetchLiveData = useCallback(async () => {
        try {
            const data = await RideService.getLiveData(id);
            if (data.status === 'success') {
                setRide({ status: data.ride_status, name: data.ride_name });
                setRiderLocations(data.rider_locations || []);
                setCheckpoints(data.checkpoints || []);

                // Handle new activities
                const newActivities = data.activities || [];
                if (newActivities.length > previousActivityCount.current && previousActivityCount.current > 0) {
                    const newestActivity = newActivities[0];
                    if (newestActivity) {
                        setToastMessage(`${newestActivity.user_name}: ${newestActivity.message}`);
                        setShowToast(true);
                        Vibration.vibrate(100);
                    }
                    setActivityCount(prev => prev + (newActivities.length - previousActivityCount.current));
                }
                setActivities(newActivities);
                previousActivityCount.current = newActivities.length;
            }
        } catch (error) {
            console.error('Error fetching live data:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    // Update map when data changes
    useEffect(() => {
        if (mapReady && webViewRef.current) {
            updateMapMarkers();
        }
    }, [riderLocations, checkpoints, mapReady]);

    const updateMapMarkers = () => {
        if (!webViewRef.current) return;

        // Update riders - using new API response format
        const ridersData = riderLocations
            .filter(r => r.has_location && r.latitude && r.longitude) // Only show riders with location
            .map(r => ({
                id: r.user_id,
                lat: r.latitude,
                lng: r.longitude,
                name: r.name || 'Unknown',
                profilePicture: r.profile_picture,
                vehicle: r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}${r.vehicle.license_plate ? ' • ' + r.vehicle.license_plate : ''}` : null,
                phone: r.phone_number,
                role: r.role,
                isLead: r.is_lead,
                hasLocation: r.has_location,
                isStale: isRiderStale(r),
                initials: generateInitials(r.name),
                avatarColor: getAvatarColor(r.name),
            }));
        webViewRef.current.injectJavaScript(`window.updateRiders(${JSON.stringify(ridersData)}); true;`);

        // Update checkpoints
        const cpData = checkpoints.map(cp => ({ lat: cp.latitude, lng: cp.longitude }));
        webViewRef.current.injectJavaScript(`window.updateCheckpoints(${JSON.stringify(cpData)}); true;`);
    };

    // Start location tracking
    const startTracking = async () => {
        try {
            const permission = await LiveRideLocationService.requestLocationPermission();
            if (!permission.granted) {
                Alert.alert('Location Required', 'Location permission is needed for live tracking.');
                return;
            }
            await LiveRideLocationService.startRideTracking(id, checkpoints, () => { });
            setIsTracking(true);
        } catch (error) {
            console.error('Failed to start tracking:', error);
        }
    };

    // ============================================
    // HANDLERS
    // ============================================

    const handleWebViewMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.action === 'directions') {
                handleGetDirections(data.rider);
            } else if (data.action === 'call') {
                handleCallRider(data.rider);
            }
        } catch (e) {
            console.error('WebView message error:', e);
        }
    };

    const handleSOS = () => {
        Alert.alert('🚨 Send SOS Alert?', 'This will notify all riders that you need immediate help.', [
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
        ]);
    };

    const handleRiderSelect = (rider) => {
        setSelectedRider(rider);
        if (webViewRef.current && rider.latitude && rider.longitude) {
            webViewRef.current.injectJavaScript(`window.centerOnRider(${rider.latitude}, ${rider.longitude}); true;`);
        }
    };

    const handleGetDirections = (rider) => {
        const lat = rider.lat || rider.latitude;
        const lng = rider.lng || rider.longitude;
        const url = Platform.select({
            ios: `maps://app?daddr=${lat},${lng}`,
            android: `google.navigation:q=${lat},${lng}`,
        });
        Linking.openURL(url).catch(() => {
            Linking.openURL(`https://www.openstreetmap.org/directions?route=;${lat},${lng}`);
        });
    };

    const handleCallRider = (rider) => {
        const phone = rider.phone || rider.user?.phone_number;
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        } else {
            Alert.alert('No Phone', 'This rider has no phone number on file.');
        }
    };

    const handlePTT = async () => {
        if (!intercomConnected) {
            Alert.alert('Connecting...', 'Voice channel is connecting over LTE/5G.');
            return;
        }

        if (isLead) {
            // Toggle mute status
            const success = await toggleMute();
            if (success) {
                Vibration.vibrate(50);
            }
        } else {
            Alert.alert('Listener Only', 'You are in listener mode. Only the Ride Lead can broadcast voice.');
        }
    };

    const fitAllRiders = () => {
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`window.fitAllMarkers(); true;`);
        }
    };

    // ============================================
    // EFFECTS
    // ============================================

    useEffect(() => {
        fetchLiveData();
        pollIntervalRef.current = setInterval(fetchLiveData, POLL_INTERVAL);
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            LiveRideLocationService.stopRideTracking();
        };
    }, [id]);

    useEffect(() => {
        if (ride?.status === 'active' && checkpoints.length > 0 && !isTracking) {
            startTracking();
        }
    }, [ride?.status, checkpoints.length]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextState => {
            if (appState.current.match(/inactive|background/) && nextState === 'active') {
                fetchLiveData();
            }
            appState.current = nextState;
        });
        return () => subscription?.remove();
    }, [fetchLiveData]);

    useFocusEffect(useCallback(() => { fetchLiveData(); }, []));

    // ============================================
    // HELPERS
    // ============================================

    const isRiderStale = (rider) => {
        // No location = not stale (just unknown)
        if (!rider.has_location) return false;
        if (!rider.last_updated) return false;
        const lastUpdate = new Date(rider.last_updated).getTime();
        return Date.now() - lastUpdate > STALE_THRESHOLD;
    };

    const calculateDistance = () => {
        if (checkpoints.length < 2) return null;
        const start = checkpoints[0];
        const end = checkpoints[checkpoints.length - 1];
        const R = 6371;
        const dLat = (end.latitude - start.latitude) * Math.PI / 180;
        const dLon = (end.longitude - start.longitude) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(start.latitude * Math.PI / 180) * Math.cos(end.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    };

    const calculateETA = () => {
        const distance = calculateDistance();
        if (!distance) return null;
        const avgSpeed = 40;
        const hours = distance / avgSpeed;
        if (hours < 1) return `${Math.round(hours * 60)} min`;
        return `${hours.toFixed(1)} hr`;
    };

    const generateInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name) => {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        return colors[name ? name.charCodeAt(0) % colors.length : 0];
    };

    const handleSOSClick = (activity) => {
        // Attempt to find rider by ID or Name
        const rider = riderLocations.find(r => r.user_id === activity.user_id || (activity.user_name && r.name === activity.user_name) || activity.message.includes(r.name));

        if (rider) {
            handleGetDirections(rider);
            setShowActivityModal(false);
        } else {
            // Fallback: If latitude/longitude in activity metadata? (Not implemented yet)
            Alert.alert('Rider Not Found', 'Could not locate the sender on the map.');
        }
    };

    // ============================================
    // RENDER
    // ============================================

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading live tracking...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Toast Notification */}
            <ToastNotification
                message={toastMessage}
                visible={showToast}
                onHide={() => setShowToast(false)}
            />

            <ActivityModal
                visible={showActivityModal}
                onClose={() => {
                    setShowActivityModal(false);
                    setActivityCount(0); // Mark all as read
                    previousActivityCount.current = activities.length; // Sync ref
                }}
                activities={activities}
                onSOSClick={handleSOSClick}
                riders={sortedRiders}
            />

            {/* OpenStreetMap via WebView */}
            <WebView
                ref={webViewRef}
                source={{ html: generateMapHTML(mapCenter.lat, mapCenter.lng) }}
                style={styles.map}
                onLoad={() => {
                    setMapReady(true);
                    // Initial fit after map loads
                    setTimeout(fitAllRiders, 1000);
                }}
                onMessage={handleWebViewMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scrollEnabled={false}
                bounces={false}
            />

            {/* Top Overlay - Back & Stats */}
            <SafeAreaView style={styles.topOverlay} edges={['top']}>
                {/* Back Button */}
                <TouchableOpacity style={styles.floatingBtn} onPress={() => router.back()}>
                    <Feather name="arrow-left" size={22} color="white" />
                </TouchableOpacity>

                {/* Stats Pill */}
                <View style={styles.statsPill}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{calculateDistance() || '--'} km</Text>
                        <Text style={styles.statLabel}>Distance</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{calculateETA() || '--'}</Text>
                        <Text style={styles.statLabel}>ETA</Text>
                    </View>
                </View>

                {/* Activity Button */}
                <TouchableOpacity style={styles.floatingBtn} onPress={() => setShowActivityModal(true)}>
                    <Feather name="bell" size={22} color="white" />
                    {activityCount > 0 && (
                        <View style={styles.activityBadge}>
                            <Text style={styles.activityBadgeText}>
                                {activityCount > 9 ? '9+' : activityCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </SafeAreaView>

            {/* Top Participant Bar */}
            <View style={styles.participantBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.participantBarContent}>
                    {riderLocations.map((rider) => (
                        <TouchableOpacity
                            key={`bar-${rider.user_id}`}
                            style={[
                                styles.participantAvatar,
                                rider.is_lead && styles.participantAvatarLead,
                                selectedRider?.user_id === rider.user_id && styles.participantAvatarSelected
                            ]}
                            onPress={() => handleRiderSelect(rider)}
                        >
                            {rider.profile_picture ? (
                                <Image
                                    source={{ uri: rider.profile_picture }}
                                    style={[styles.participantAvatarImage, isRiderStale(rider) && styles.grayscaleImage]}
                                />
                            ) : (
                                <View style={[styles.participantAvatarPlaceholder, { backgroundColor: isRiderStale(rider) ? '#555' : getAvatarColor(rider.name) }]}>
                                    <Text style={styles.participantAvatarInitials}>{generateInitials(rider.name)}</Text>
                                </View>
                            )}
                            {rider.is_lead && <View style={styles.leadBadge}><Feather name="mic" size={10} color="white" /></View>}
                            {!isRiderStale(rider) && <View style={[styles.participantOnlineDot, rider.is_lead && styles.leadOnlineDot]} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Selected Rider Info Card */}
            {selectedRider && (
                <View style={[styles.riderInfoCard, selectedRider.is_lead && styles.riderInfoCardLead]}>
                    <View style={styles.riderInfoHeader}>
                        {selectedRider.profile_picture ? (
                            <Image source={{ uri: selectedRider.profile_picture }} style={[styles.riderInfoAvatar, selectedRider.is_lead && styles.riderInfoAvatarLead]} />
                        ) : (
                            <View style={[styles.riderInfoAvatar, { backgroundColor: getAvatarColor(selectedRider.name) }, selectedRider.is_lead && styles.riderInfoAvatarLead]}>
                                <Text style={styles.riderInfoInitials}>{generateInitials(selectedRider.name)}</Text>
                            </View>
                        )}
                        <View style={styles.riderInfoDetails}>
                            <View style={styles.riderInfoNameRow}>
                                <Text style={styles.riderInfoName}>{selectedRider.name || 'Unknown'}</Text>
                                {selectedRider.is_lead && (
                                    <View style={styles.leadTag}>
                                        <Feather name="mic" size={10} color="white" />
                                        <Text style={styles.leadTagText}>LEAD</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.riderInfoVehicle}>
                                {selectedRider.vehicle ? `${selectedRider.vehicle.make} ${selectedRider.vehicle.model}${selectedRider.vehicle.license_plate ? ' • ' + selectedRider.vehicle.license_plate : ''}` : 'No vehicle info'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedRider(null)} style={styles.riderInfoClose}>
                            <Feather name="x" size={20} color="#888" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.riderInfoActions}>
                        <TouchableOpacity style={styles.riderActionBtn} onPress={() => handleGetDirections(selectedRider)}>
                            <Feather name="navigation" size={18} color="white" />
                            <Text style={styles.riderActionText}>Directions</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.riderActionBtn, styles.callBtn]} onPress={() => handleCallRider(selectedRider)}>
                            <Feather name="phone" size={18} color="white" />
                            <Text style={styles.riderActionText}>Call</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Bottom Controls */}
            <SafeAreaView style={styles.bottomControls} edges={['bottom']}>
                {/* SOS Button */}
                <TouchableOpacity style={styles.sosBtn} onPress={handleSOS} disabled={sendingAlert}>
                    {sendingAlert ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.sosText}>SOS</Text>
                    )}
                </TouchableOpacity>

                {/* PTT Button */}
                <TouchableOpacity
                    style={[
                        styles.pttBtn,
                        intercomConnected && !isMuted && isLead && styles.pttBtnActive,
                        !isLead && styles.pttBtnListener
                    ]}
                    onPress={handlePTT}
                    activeOpacity={0.8}
                >
                    <View style={styles.pttInner}>
                        {isSpeaking || (isLead && !isMuted && intercomConnected) ? (
                            <>
                                <WaveformAnimation active={true} />
                                <Text style={styles.pttLabel} numberOfLines={1}>
                                    {isLead && !isMuted ? 'Broadcasting' : (speakerName ? `${speakerName}` : 'Speaking...')}
                                </Text>
                            </>
                        ) : (
                            <>
                                <Feather
                                    name={!intercomConnected ? "mic-off" : (isLead ? (isMuted ? "mic-off" : "mic") : "headphones")}
                                    size={32}
                                    color={intercomConnected ? "white" : "#666"}
                                />
                                <Text style={[styles.pttLabel, !intercomConnected && { color: '#666' }]}>
                                    {!intercomConnected ? 'Connecting...' : (isLead ? (isMuted ? 'Tap to Speak' : 'Tap to Mute') : 'Listening')}
                                </Text>
                            </>
                        )}
                    </View>
                </TouchableOpacity>

                {/* Fit All Button */}
                <TouchableOpacity style={styles.fitBtn} onPress={fitAllRiders}>
                    <Feather name="maximize" size={22} color="white" />
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
};

export default LiveRideScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', gap: 12 },
    loadingText: { color: '#888', fontSize: 14 },

    // Map
    map: { ...StyleSheet.absoluteFillObject },

    // Toast
    toastContainer: { position: 'absolute', top: 100, left: 20, right: 20, zIndex: 1000 },
    toast: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(30,30,30,0.95)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FFD700' },
    toastText: { color: 'white', fontSize: 14, flex: 1 },

    // Top Overlay
    topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
    floatingBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(30,30,30,0.9)', justifyContent: 'center', alignItems: 'center' },
    activityBadge: { position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#FF5252', justifyContent: 'center', alignItems: 'center' },
    activityBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

    // Stats Pill
    statsPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30,30,30,0.9)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
    statItem: { alignItems: 'center' },
    statValue: { color: '#00BFFF', fontSize: 16, fontWeight: 'bold' },
    statLabel: { color: '#888', fontSize: 10, marginTop: 2 },
    statDivider: { width: 1, height: 24, backgroundColor: '#333', marginHorizontal: 16 },

    // Participant Bar
    participantBar: { position: 'absolute', top: 110, left: 0, right: 0 },
    participantBarContent: { paddingHorizontal: 16, gap: 12 },
    participantAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: 'transparent' },
    participantAvatarLead: { borderColor: '#FF5252', borderWidth: 3 },
    participantAvatarSelected: { borderColor: '#00BFFF' },
    participantAvatarImage: { width: '100%', height: '100%', borderRadius: 25 },
    participantAvatarPlaceholder: { width: '100%', height: '100%', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    participantAvatarInitials: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    participantOnlineDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#00C853', borderWidth: 2, borderColor: '#1E1E1E' },
    leadOnlineDot: { backgroundColor: '#FF5252' },
    leadBadge: { position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FF5252', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1E1E1E' },
    grayscaleImage: { opacity: 0.5 },

    // Rider Info Card
    riderInfoCard: { position: 'absolute', bottom: 180, left: 16, right: 16, backgroundColor: 'rgba(30,30,30,0.95)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'transparent' },
    riderInfoCardLead: { borderColor: '#FF5252', borderWidth: 2 },
    riderInfoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    riderInfoAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    riderInfoAvatarLead: { borderWidth: 3, borderColor: '#FF5252' },
    riderInfoInitials: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    riderInfoDetails: { flex: 1 },
    riderInfoNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    riderInfoName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    riderInfoVehicle: { color: '#888', fontSize: 13, marginTop: 2 },
    riderInfoClose: { padding: 4 },
    leadTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FF5252', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    leadTagText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    riderInfoActions: { flexDirection: 'row', gap: 12 },
    riderActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#00BFFF', paddingVertical: 12, borderRadius: 10 },
    callBtn: { backgroundColor: '#00C853' },
    riderActionText: { color: 'white', fontWeight: '600' },

    // Bottom Controls
    bottomControls: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingBottom: 16 },

    // SOS Button
    sosBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#D50000', justifyContent: 'center', alignItems: 'center', shadowColor: '#D50000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
    sosText: { color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 1 },

    // PTT Button
    pttBtn: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(30,30,30,0.95)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#333' },
    pttBtnActive: { borderColor: '#00C853', backgroundColor: 'rgba(0,200,83,0.2)' },
    pttBtnListener: { borderColor: '#666', backgroundColor: 'rgba(50,50,50,0.5)' },
    pttInner: { alignItems: 'center', justifyContent: 'center' },
    pttLabel: { color: 'white', fontSize: 10, marginTop: 4, textAlign: 'center', maxWidth: 80 },

    // Fit Button
    fitBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(30,30,30,0.9)', justifyContent: 'center', alignItems: 'center' },

    // Waveform
    waveformContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 32, gap: 3 },
    waveformBar: { width: 4, height: 32, backgroundColor: '#00C853', borderRadius: 2 },

    /* Activity Modal Styles (Timeline Design) */
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalDismiss: { flex: 1 },
    modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', paddingBottom: 40, overflow: 'hidden' },
    modalHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
    modalTitle: { color: 'white', fontSize: 22, fontWeight: '700' },
    modalSubtitle: { color: '#666', fontSize: 12, marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    historyIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 215, 0, 0.15)', justifyContent: 'center', alignItems: 'center' },
    closeBtn: { padding: 8, backgroundColor: '#222', borderRadius: 12 },

    listContent: { padding: 24, paddingBottom: 80 },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 16 },
    emptyText: { color: '#666', fontSize: 16 },

    // Timeline
    timelineLine: { position: 'absolute', top: 20, bottom: 20, left: 24, width: 2, backgroundColor: '#222', zIndex: -1 },
    timelineRow: { flexDirection: 'row', marginBottom: 24, gap: 16 },
    timelineAvatarRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    timelineAvatarImage: { width: 42, height: 42, borderRadius: 21 },
    timelineAvatarPlaceholder: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' },
    timelineAvatarInitials: { color: '#888', fontWeight: 'bold' },

    // Cards
    timelineCard: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: '#333', flex: 1 },
    timelineHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    timelineTitle: { fontSize: 15, fontWeight: '700', color: 'white' },
    timelineTime: { fontSize: 12, color: '#666' },
    timelineSubtitle: { color: '#999', fontSize: 13, lineHeight: 18 },

    // SOS Expanded
    sosCardExpanded: { backgroundColor: '#2A0E0E', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#5E1818', flex: 1 },
    sosHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sosBadge: { backgroundColor: '#D50000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    sosBadgeText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    sosTime: { color: '#FFAAAA', fontSize: 12 },
    sosTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    sosBody: { color: '#FFCDD2', fontSize: 14, lineHeight: 20, marginBottom: 16 },
    sosButton: { backgroundColor: '#FF5252', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
    sosButtonText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

    // Bottom Pill
    bottomPillContainer: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
    bottomPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8, borderWidth: 1, borderColor: '#333' },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD700' },
    bottomPillText: { color: '#AAA', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
});
