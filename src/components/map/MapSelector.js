import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Text,
    TextInput,
    FlatList,
    ActivityIndicator,
    Keyboard,
    Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';

// OSM Server rotation
const OSM_SERVERS = ['a', 'b', 'c'];
const getRandomServer = () => OSM_SERVERS[Math.floor(Math.random() * 3)];

// Marker configuration
const MARKER_TYPES = {
    start: { color: '#22c55e', label: 'Start', icon: '🏁' },
    destination: { color: '#ef4444', label: 'Destination', icon: '🎯' },
    end: { color: '#f97316', label: 'End', icon: '🏠' }
};

// Leaflet HTML template
const getLeafletHTML = (lat, lng, osmServer) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        * { margin: 0; padding: 0; }
        html, body, #map { width: 100%; height: 100%; }
        .custom-marker {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        const map = L.map('map', {
            zoomControl: false
        }).setView([${lat}, ${lng}], 13);
        
        L.tileLayer('https://${osmServer}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        const markers = {};
        const markerColors = {
            start: '#22c55e',
            destination: '#ef4444',
            end: '#f97316'
        };
        const markerIcons = {
            start: '🏁',
            destination: '🎯',
            end: '🏠'
        };

        function createMarkerIcon(type) {
            return L.divIcon({
                className: 'custom-marker',
                html: '<div style="background-color: ' + markerColors[type] + '; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="transform: rotate(45deg); font-size: 14px;">' + markerIcons[type] + '</span></div>',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            });
        }

        let activeMarkerType = 'start';

        map.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // Remove existing marker of same type
            if (markers[activeMarkerType]) {
                map.removeLayer(markers[activeMarkerType]);
            }
            
            // Add new marker
            markers[activeMarkerType] = L.marker([lat, lng], {
                icon: createMarkerIcon(activeMarkerType)
            }).addTo(map);
            
            // Send to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerPlaced',
                markerType: activeMarkerType,
                lat: lat,
                lng: lng
            }));
        });

        // Functions callable from React Native
        window.setMarkerType = function(type) {
            activeMarkerType = type;
        };

        window.flyTo = function(lat, lng, zoom) {
            map.flyTo([lat, lng], zoom || 15);
        };

        window.addMarkerAt = function(type, lat, lng) {
            if (markers[type]) {
                map.removeLayer(markers[type]);
            }
            markers[type] = L.marker([lat, lng], {
                icon: createMarkerIcon(type)
            }).addTo(map);
        };

        window.removeMarker = function(type) {
            if (markers[type]) {
                map.removeLayer(markers[type]);
                delete markers[type];
            }
        };

        window.getMarkers = function() {
            const result = {};
            for (const type in markers) {
                const latlng = markers[type].getLatLng();
                result[type] = { lat: latlng.lat, lng: latlng.lng };
            }
            return result;
        };

        // Signal that map is ready
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
    </script>
</body>
</html>
`;

const MapSelector = ({
    onLocationSelect,  // For single marker mode
    onLocationsSelect, // For multi-marker mode
    initialRegion,
    singleMarkerMode = false,
    markerType = 'start'
}) => {
    const webViewRef = useRef(null);
    const searchTimeout = useRef(null);
    const [osmServer] = useState(getRandomServer());
    const [mapReady, setMapReady] = useState(false);

    const initialLat = initialRegion?.latitude || 12.9716;
    const initialLng = initialRegion?.longitude || 77.5946;

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Marker state
    const [activeMarkerType, setActiveMarkerType] = useState(markerType || 'start');
    const [markers, setMarkers] = useState({ start: null, destination: null, end: null });
    const [selectedAddress, setSelectedAddress] = useState('');

    // Location state
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    // Update marker type when prop changes
    useEffect(() => {
        if (singleMarkerMode && markerType) {
            setActiveMarkerType(markerType);
        }
    }, [singleMarkerMode, markerType]);

    // Send marker type to WebView when it changes
    useEffect(() => {
        if (mapReady && webViewRef.current) {
            webViewRef.current.injectJavaScript(`window.setMarkerType('${activeMarkerType}'); true;`);
        }
    }, [activeMarkerType, mapReady]);

    // Handle messages from WebView
    const handleMessage = useCallback((event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'mapReady') {
                setMapReady(true);
            } else if (data.type === 'markerPlaced') {
                const coords = { latitude: data.lat, longitude: data.lng };

                // Update markers state
                const newMarkers = { ...markers, [data.markerType]: coords };
                setMarkers(newMarkers);

                // Callbacks
                if (singleMarkerMode && onLocationSelect) {
                    onLocationSelect(coords);
                } else if (onLocationsSelect) {
                    onLocationsSelect(newMarkers);
                }

                // Reverse geocode
                reverseGeocode(data.lat, data.lng);
            }
        } catch (error) {
            console.error('WebView message error:', error);
        }
    }, [markers, singleMarkerMode, onLocationSelect, onLocationsSelect]);

    // Reverse geocoding
    const reverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
                { headers: { 'User-Agent': 'WayFind-App/1.0' } }
            );
            const data = await response.json();
            if (data && data.display_name) {
                setSelectedAddress(data.display_name);
            }
        } catch (error) {
            console.error('Reverse geocode error:', error);
            setSelectedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
    };

    // Debounced search
    const handleSearchChange = useCallback((text) => {
        setSearchQuery(text);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (text.length < 3) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                // Using Photon API (by Komoot) - better coverage than Nominatim
                const response = await fetch(
                    `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5&lat=12.97&lon=77.59`,
                    { headers: { 'User-Agent': 'WayFind-App/1.0' } }
                );
                const data = await response.json();
                // Photon returns GeoJSON format
                const results = (data.features || []).map(f => ({
                    place_id: f.properties.osm_id,
                    display_name: [
                        f.properties.name,
                        f.properties.city || f.properties.town || f.properties.village,
                        f.properties.state,
                        f.properties.country
                    ].filter(Boolean).join(', '),
                    lat: f.geometry.coordinates[1],
                    lon: f.geometry.coordinates[0]
                }));
                setSearchResults(results);
                setShowResults(results.length > 0);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);
    }, []);

    // Select search result
    const handleSelectResult = (item) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        // Fly to location
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`window.flyTo(${lat}, ${lng}, 16); true;`);
        }

        // Place marker
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`window.addMarkerAt('${activeMarkerType}', ${lat}, ${lng}); true;`);
        }

        // Update state
        const coords = { latitude: lat, longitude: lng };
        const newMarkers = { ...markers, [activeMarkerType]: coords };
        setMarkers(newMarkers);

        if (singleMarkerMode && onLocationSelect) {
            onLocationSelect(coords);
        } else if (onLocationsSelect) {
            onLocationsSelect(newMarkers);
        }

        setSelectedAddress(item.display_name);
        setSearchQuery(item.display_name.split(',')[0]);
        setShowResults(false);
        try { Keyboard.dismiss(); } catch (e) { /* ignore */ }
    };

    // Get user location
    const getUserLocation = async () => {
        setIsGettingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please enable location access in settings.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });

            const { latitude, longitude } = location.coords;

            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`window.flyTo(${latitude}, ${longitude}, 16); true;`);
            }
        } catch (error) {
            console.error('Location error:', error);
            Alert.alert('Error', 'Could not get your location.');
        } finally {
            setIsGettingLocation(false);
        }
    };

    // Switch marker type
    const switchMarkerType = (type) => {
        setActiveMarkerType(type);
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`window.setMarkerType('${type}'); true;`);
        }
    };

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Feather name="search" size={18} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search location..."
                        placeholderTextColor="#888"
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    />
                    {isSearching && <ActivityIndicator size="small" color="#00C853" />}
                    {searchQuery.length > 0 && !isSearching && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); setShowResults(false); }}>
                            <Feather name="x" size={18} color="#888" />
                        </TouchableOpacity>
                    )}
                </View>

                {showResults && searchResults.length > 0 && (
                    <View style={styles.resultsContainer}>
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item, index) => item.place_id?.toString() || index.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.resultItem} onPress={() => handleSelectResult(item)}>
                                    <Feather name="map-pin" size={14} color="#00C853" />
                                    <Text style={styles.resultText} numberOfLines={2}>{item.display_name}</Text>
                                </TouchableOpacity>
                            )}
                            keyboardShouldPersistTaps="handled"
                            nestedScrollEnabled={true}
                            scrollEnabled={true}
                        />
                    </View>
                )}
            </View>

            {/* Marker Type Selector - only in multi-marker mode */}
            {!singleMarkerMode && (
                <View style={styles.markerTypeContainer}>
                    {Object.keys(MARKER_TYPES).map((type) => {
                        const config = MARKER_TYPES[type];
                        return (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.markerTypeBtn,
                                    { borderColor: config.color },
                                    activeMarkerType === type && { backgroundColor: config.color }
                                ]}
                                onPress={() => switchMarkerType(type)}
                            >
                                <Text style={styles.markerTypeIcon}>{config.icon}</Text>
                                <Text style={[styles.markerTypeText, activeMarkerType === type && styles.markerTypeTextActive]}>
                                    {config.label}
                                </Text>
                                {markers[type] && <Feather name="check" size={12} color={activeMarkerType === type ? 'white' : config.color} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* Map WebView */}
            <WebView
                ref={webViewRef}
                source={{ html: getLeafletHTML(initialLat, initialLng, osmServer) }}
                style={styles.map}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#00C853" />
                        <Text style={styles.loadingText}>Loading map...</Text>
                    </View>
                )}
            />

            {/* Address Card */}
            {selectedAddress ? (
                <View style={styles.addressCard}>
                    <Feather name="map-pin" size={14} color="#00C853" />
                    <Text style={styles.addressText} numberOfLines={2}>{selectedAddress}</Text>
                </View>
            ) : null}

            {/* User Location Button */}
            <TouchableOpacity style={styles.locationButton} onPress={getUserLocation} disabled={isGettingLocation}>
                {isGettingLocation ? (
                    <ActivityIndicator size="small" color="white" />
                ) : (
                    <Feather name="crosshair" size={20} color="white" />
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 350,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#1E1E1E',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
    },
    loadingText: {
        color: '#888',
        marginTop: 10,
    },
    searchContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        zIndex: 100,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 14,
    },
    resultsContainer: {
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        borderRadius: 10,
        marginTop: 4,
        maxHeight: 150,
        elevation: 5,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    resultText: {
        flex: 1,
        color: '#CCC',
        fontSize: 13,
    },
    markerTypeContainer: {
        position: 'absolute',
        top: 60,
        left: 10,
        right: 10,
        flexDirection: 'row',
        gap: 8,
        zIndex: 99,
    },
    markerTypeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 2,
        elevation: 4,
    },
    markerTypeIcon: {
        fontSize: 14,
    },
    markerTypeText: {
        color: '#AAA',
        fontSize: 11,
        fontWeight: '600',
    },
    markerTypeTextActive: {
        color: 'white',
    },
    addressCard: {
        position: 'absolute',
        bottom: 50,
        left: 10,
        right: 60,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        padding: 12,
        borderRadius: 10,
        elevation: 5,
    },
    addressText: {
        flex: 1,
        color: 'white',
        fontSize: 12,
    },
    locationButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: 44,
        height: 44,
        backgroundColor: '#2196F3',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
    },
});

export default MapSelector;
