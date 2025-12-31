import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_GOOGLE } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// OSM Tile URL
const OSM_URL_TEMPLATE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const MapSelector = ({ onLocationSelect, initialRegion }) => {
    const [useOSM, setUseOSM] = useState(true); // Default to OSM
    const [region, setRegion] = useState(initialRegion || {
        latitude: 12.9716,
        longitude: 77.5946,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [selectedLocation, setSelectedLocation] = useState(null);

    const handlePress = (e) => {
        const coords = e.nativeEvent.coordinate;
        setSelectedLocation(coords);
        if (onLocationSelect) {
            onLocationSelect(coords);
        }
    };

    const toggleProvider = () => {
        setUseOSM(!useOSM);
    }

    return (
        <View style={styles.container}>
            <MapView
                provider={useOSM ? null : PROVIDER_GOOGLE}
                style={styles.map}
                region={region}
                onRegionChangeComplete={setRegion}
                onPress={handlePress}
                rotateEnabled={false}
            >
                {useOSM && (
                    <UrlTile
                        urlTemplate={OSM_URL_TEMPLATE}
                        maximumZ={19}
                        flipY={false}
                    />
                )}

                {selectedLocation && (
                    <Marker coordinate={selectedLocation} />
                )}
            </MapView>

            <TouchableOpacity
                style={styles.toggleButton}
                onPress={toggleProvider}
            >
                <Feather name="map" size={20} color="white" />
                <Text style={styles.toggleText}>
                    {useOSM ? "Switch to Google" : "Switch to OSM"}
                </Text>
            </TouchableOpacity>

            <View style={styles.instructionBubble}>
                <Text style={styles.instructionText}>Tap map to select location</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 300,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative'
    },
    map: {
        width: '100%',
        height: '100%',
    },
    toggleButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        zIndex: 10
    },
    toggleText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold'
    },
    instructionBubble: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 8,
        borderRadius: 8
    },
    instructionText: {
        color: 'white',
        fontSize: 12
    }
});

export default MapSelector;
