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
    Image,
    ScrollView,
    Dimensions,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import { theme } from '@/src/styles/theme';
import { useAuth } from '@/src/context/AuthContext';
import RideService from '@/src/apis/rideService';
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
            width: 44px; height: 44px; border-radius: 50%;
            border: 3px solid #00C853; overflow: hidden;
            background: #333; display: flex;
            align-items: center; justify-content: center;
        }
        .rider-marker.stale { border-color: #555; filter: grayscale(100%); opacity: 0.6; }
        .rider-marker.selected { border-color: #00BFFF; border-width: 4px; }
        .rider-marker img { width: 100%; height: 100%; border-radius: 50%; }
        .rider-initials { color: white; font-weight: bold; font-size: 14px; }
        .checkpoint-marker {
            width: 28px; height: 28px; border-radius: 50%;
            background: #00BFFF; display: flex;
            align-items: center; justify-content: center;
            color: white; font-weight: bold; font-size: 12px;
        }
        .checkpoint-marker.start { background: #00C853; }
        .checkpoint-marker.end { background: #FF5252; }
        .leaflet-popup-content { margin: 8px 12px; }
        .popup-content { text-align: center; }
        .popup-name { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
        .popup-vehicle { color: #666; font-size: 12px; margin-bottom: 8px; }
        .popup-actions { display: flex; gap: 8px; justify-content: center; }
        .popup-btn { padding: 8px 16px; border-radius: 8px; border: none;
            color: white; font-weight: 600; cursor: pointer; font-size: 12px; }
        .popup-btn.directions { background: #00BFFF; }
        .popup-btn.call { background: #00C853; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // Initialize dark-themed map
        var map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], ${zoom});
        
        // Dark tiles from CartoDB
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap, &copy; CartoDB',
            maxZoom: 19
        }).addTo(map);

        // Store markers and route
        var riderMarkers = {};
        var checkpointMarkers = {};
        var routeLine = null;

        // Handle messages from React Native
        window.updateRiders = function(riders) {
            // Clear old markers
            Object.values(riderMarkers).forEach(m => map.removeLayer(m));
            riderMarkers = {};
            
            riders.forEach(function(rider) {
                var isStale = rider.isStale;
                var initials = rider.initials || 'U';
                var avatarColor = rider.avatarColor || '#FF6B6B';
                
                var markerHtml = rider.profilePicture 
                    ? '<div class="rider-marker' + (isStale ? ' stale' : '') + '"><img src="' + rider.profilePicture + '" /></div>'
                    : '<div class="rider-marker' + (isStale ? ' stale' : '') + '" style="background:' + avatarColor + '"><span class="rider-initials">' + initials + '</span></div>';
                
                var icon = L.divIcon({ html: markerHtml, className: '', iconSize: [44, 44], iconAnchor: [22, 22] });
                var marker = L.marker([rider.lat, rider.lng], { icon: icon }).addTo(map);
                
                var popupHtml = '<div class="popup-content">' +
                    '<div class="popup-name">' + (rider.name || 'Unknown') + '</div>' +
                    '<div class="popup-vehicle">' + (rider.vehicle || 'No vehicle info') + '</div>' +
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
                    className: '', iconSize: [28, 28], iconAnchor: [14, 14]
                });
                checkpointMarkers[i] = L.marker([cp.lat, cp.lng], { icon: icon }).addTo(map);
            });
            
            if (coords.length > 1) {
                routeLine = L.polyline(coords, { color: '#00BFFF', weight: 4, opacity: 0.8 }).addTo(map);
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
    const [activityCount, setActivityCount] = useState(0);
    const [sendingAlert, setSendingAlert] = useState(false);

    // Intercom state (simplified without the hook to avoid crash)
    const [intercomConnected, setIntercomConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Initial map center (India default)
    const [mapCenter] = useState({ lat: 12.9716, lng: 77.5946 });

    // Refs
    const pollIntervalRef = useRef(null);
    const previousActivityCount = useRef(0);
    const appState = useRef(AppState.currentState);

    // ============================================
    // DATA FETCHING
    // ============================================

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

        // Update riders
        const ridersData = riderLocations.map(r => ({
            id: r.user_id,
            lat: r.latitude,
            lng: r.longitude,
            name: r.user?.name || 'Unknown',
            profilePicture: r.user?.profile_picture,
            vehicle: r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : null,
            phone: r.user?.phone_number,
            isStale: isRiderStale(r),
            initials: generateInitials(r.user?.name),
            avatarColor: getAvatarColor(r.user?.name),
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

    const handlePTT = () => {
        // Toggle intercom connection
        setIntercomConnected(!intercomConnected);
        if (!intercomConnected) {
            // Simulate speaking after connecting
            setTimeout(() => setIsSpeaking(true), 500);
            setTimeout(() => setIsSpeaking(false), 2000);
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
        if (!rider.updated_at) return false;
        const lastUpdate = new Date(rider.updated_at).getTime();
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
                <TouchableOpacity style={styles.floatingBtn} onPress={() => Alert.alert('Activity', activities.slice(0, 5).map(a => `• ${a.message}`).join('\n') || 'No recent activity')}>
                    <Feather name="activity" size={22} color="white" />
                    {activityCount > 0 && (
                        <View style={styles.activityBadge}>
                            <Text style={styles.activityBadgeText}>{activityCount > 9 ? '9+' : activityCount}</Text>
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
                            style={[styles.participantAvatar, selectedRider?.user_id === rider.user_id && styles.participantAvatarSelected]}
                            onPress={() => handleRiderSelect(rider)}
                        >
                            {rider.user?.profile_picture ? (
                                <Image
                                    source={{ uri: rider.user.profile_picture }}
                                    style={[styles.participantAvatarImage, isRiderStale(rider) && styles.grayscaleImage]}
                                />
                            ) : (
                                <View style={[styles.participantAvatarPlaceholder, { backgroundColor: isRiderStale(rider) ? '#555' : getAvatarColor(rider.user?.name) }]}>
                                    <Text style={styles.participantAvatarInitials}>{generateInitials(rider.user?.name)}</Text>
                                </View>
                            )}
                            {!isRiderStale(rider) && <View style={styles.participantOnlineDot} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Selected Rider Info Card */}
            {selectedRider && (
                <View style={styles.riderInfoCard}>
                    <View style={styles.riderInfoHeader}>
                        {selectedRider.user?.profile_picture ? (
                            <Image source={{ uri: selectedRider.user.profile_picture }} style={styles.riderInfoAvatar} />
                        ) : (
                            <View style={[styles.riderInfoAvatar, { backgroundColor: getAvatarColor(selectedRider.user?.name) }]}>
                                <Text style={styles.riderInfoInitials}>{generateInitials(selectedRider.user?.name)}</Text>
                            </View>
                        )}
                        <View style={styles.riderInfoDetails}>
                            <Text style={styles.riderInfoName}>{selectedRider.user?.name || 'Unknown'}</Text>
                            <Text style={styles.riderInfoVehicle}>
                                {selectedRider.vehicle ? `${selectedRider.vehicle.make} ${selectedRider.vehicle.model}` : 'No vehicle info'}
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
                    style={[styles.pttBtn, (isSpeaking || intercomConnected) && styles.pttBtnActive]}
                    onPress={handlePTT}
                    activeOpacity={0.8}
                >
                    <View style={styles.pttInner}>
                        {isSpeaking ? (
                            <>
                                <WaveformAnimation active={true} />
                                <Text style={styles.pttLabel}>Speaking...</Text>
                            </>
                        ) : (
                            <>
                                <Feather name={intercomConnected ? "mic" : "headphones"} size={32} color="white" />
                                <Text style={styles.pttLabel}>
                                    {intercomConnected ? 'Tap to Speak' : 'Tap to Connect'}
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
    participantAvatarSelected: { borderColor: '#00BFFF' },
    participantAvatarImage: { width: '100%', height: '100%', borderRadius: 25 },
    participantAvatarPlaceholder: { width: '100%', height: '100%', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    participantAvatarInitials: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    participantOnlineDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#00C853', borderWidth: 2, borderColor: '#1E1E1E' },
    grayscaleImage: { opacity: 0.5 },

    // Rider Info Card
    riderInfoCard: { position: 'absolute', bottom: 180, left: 16, right: 16, backgroundColor: 'rgba(30,30,30,0.95)', borderRadius: 16, padding: 16 },
    riderInfoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    riderInfoAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    riderInfoInitials: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    riderInfoDetails: { flex: 1 },
    riderInfoName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    riderInfoVehicle: { color: '#888', fontSize: 13, marginTop: 2 },
    riderInfoClose: { padding: 4 },
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
    pttInner: { alignItems: 'center', justifyContent: 'center' },
    pttLabel: { color: 'white', fontSize: 10, marginTop: 4, textAlign: 'center', maxWidth: 80 },

    // Fit Button
    fitBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(30,30,30,0.9)', justifyContent: 'center', alignItems: 'center' },

    // Waveform
    waveformContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 32, gap: 3 },
    waveformBar: { width: 4, height: 32, backgroundColor: '#00C853', borderRadius: 2 },
});
