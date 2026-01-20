import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import RideService from '@/src/apis/rideService';
import { useAuth } from '@/src/context/AuthContext';

export default function JoinRideScreen() {
    const { id } = useLocalSearchParams();
    // Note: We don't wait for isLoading - just check isAuthenticated when needed
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [ride, setRide] = useState(null);
    const [error, setError] = useState(null);

    // Track if we've already attempted auto-join to prevent duplicates
    const hasAutoJoined = useRef(false);

    useEffect(() => {
        if (id) {
            fetchRide();
        } else {
            setLoading(false);
            setError('No ride ID provided');
        }
    }, [id]);

    // Auto-join when user returns authenticated after login flow
    useEffect(() => {
        console.log('JoinRide useEffect - authLoading:', authLoading, 'isAuthenticated:', isAuthenticated,
            'ride:', !!ride, 'hasAutoJoined:', hasAutoJoined.current, 'joining:', joining, 'loading:', loading);

        // Only auto-join if:
        // 1. Auth check is complete (not loading)
        // 2. User is authenticated
        // 3. Ride data is loaded
        // 4. We haven't already tried auto-joining
        // 5. Not currently joining
        if (!authLoading && isAuthenticated && ride && !hasAutoJoined.current && !joining && !loading) {
            console.log('✅ Auto-joining ride after auth complete');
            hasAutoJoined.current = true;
            performJoin();
        }
    }, [authLoading, isAuthenticated, ride, loading]);

    const fetchRide = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching ride with id:', id);
            const data = await RideService.getRideById(id);
            console.log('Ride response:', data);
            // Response format usually { status, ride: {...} } or just ride object depending on API wrapper
            // RideService.getRideById returns response.data
            // Backend /v1/rides/{id} returns RideResponse model.

            // Check if response has ride property or is the ride object
            if (data && data.status === 'success') {
                setRide(data.ride);
            } else if (data && data.ride) {
                setRide(data.ride);
            } else {
                setRide(data); // Fallback
            }
        } catch (err) {
            console.error('Failed to fetch ride:', err);
            setError(err?.message || 'Failed to load ride details or ride not found.');
        } finally {
            setLoading(false);
        }
    };

    // Actual join logic - called by handleJoin and auto-join
    const performJoin = async () => {
        if (joining) return; // Prevent duplicate calls

        setJoining(true);
        try {
            await RideService.joinRide(id, { vehicle_info_id: null });

            Alert.alert(
                'Success',
                'You have joined the ride!',
                [
                    {
                        text: 'Go to Ride',
                        onPress: () => router.replace(`/(main)/rides/${id}`)
                    }
                ]
            );
        } catch (err) {
            console.error('Failed to join ride:', err);
            const msg = err?.message || 'Failed to join ride';
            if (msg.includes('already joined') || msg.includes('already a participant')) {
                Alert.alert('Info', 'You have already joined this ride.', [
                    { text: 'Go to Ride', onPress: () => router.replace(`/(main)/rides/${id}`) }
                ]);
            } else {
                Alert.alert('Error', msg);
            }
        } finally {
            setJoining(false);
        }
    };

    // Button handler - checks auth first, then joins
    const handleJoin = async () => {
        // If auth is still loading or not authenticated, redirect to login
        // The returnTo param will bring them back here after login
        if (authLoading || !isAuthenticated) {
            hasAutoJoined.current = false; // Reset so auto-join triggers after login
            router.push({
                pathname: '/(auth)/login',
                params: { returnTo: `/join/ride/${id}` }
            });
            return;
        }

        // User is authenticated, perform the join
        performJoin();
    };

    const handleGoBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(main)');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00C853" />
                    <Text style={styles.loadingText}>Loading ride details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={64} color="#FF4444" />
                    <Text style={styles.errorTitle}>Oops!</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Feather name="map-pin" size={32} color="#00C853" />
                    <Text style={styles.headerTitle}>Join Ride</Text>
                </View>

                {/* Ride Card */}
                <View style={styles.card}>
                    <Text style={styles.rideName}>{ride?.name || 'Ride'}</Text>

                    <View style={styles.infoRow}>
                        <Feather name="calendar" size={16} color="#aaa" />
                        <Text style={styles.infoText}>
                            {ride?.scheduled_date ? new Date(ride.scheduled_date).toLocaleString() : 'Date TBD'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Feather name="users" size={16} color="#00C853" />
                        <Text style={styles.infoText}>
                            {ride?.participants_count || 0} Riders
                        </Text>
                    </View>

                    {ride?.description && (
                        <Text style={styles.description}>{ride.description}</Text>
                    )}
                </View>

                {/* Auth Notice */}
                {(authLoading || !isAuthenticated) && (
                    <View style={styles.authNotice}>
                        <Feather name="info" size={16} color="#FF9800" />
                        <Text style={styles.authNoticeText}>
                            {authLoading
                                ? 'Checking your session...'
                                : "You'll need to login to join this ride"}
                        </Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.joinButton}
                        onPress={handleJoin}
                        disabled={joining}
                    >
                        {joining ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Feather name="plus-circle" size={20} color="#fff" />
                                <Text style={styles.joinButtonText}>
                                    {isAuthenticated ? 'Join Ride' : 'Login & Join'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={handleGoBack}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: '#888',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    errorTitle: {
        color: '#FF4444',
        fontSize: 24,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
    },
    backButton: {
        marginTop: 20,
        backgroundColor: '#333',
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 12,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        gap: 12,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    rideName: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    infoText: {
        color: '#ccc',
        fontSize: 14,
    },
    description: {
        color: '#888',
        fontSize: 14,
        marginTop: 10,
        lineHeight: 20,
    },
    authNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        padding: 14,
        borderRadius: 10,
        gap: 10,
        marginBottom: 20,
    },
    authNoticeText: {
        color: '#FF9800',
        fontSize: 14,
        flex: 1,
    },
    buttonContainer: {
        marginTop: 'auto',
        gap: 12,
    },
    joinButton: {
        flexDirection: 'row',
        backgroundColor: '#00C853',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#888',
        fontSize: 16,
    },
});
