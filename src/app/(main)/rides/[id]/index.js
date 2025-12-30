import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '@/src/styles/theme'
import RideService from '@/src/apis/rideService'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '@/src/context/AuthContext'

const RideDetails = () => {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    const fetchRideDetails = async () => {
        try {
            setLoading(true);
            const data = await RideService.getRideById(id);
            if (data.ride) {
                setRide(data.ride);
            }
        } catch (error) {
            console.error("Failed to fetch ride details", error);
            Alert.alert('Error', 'Could not load ride details');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (id) fetchRideDetails();
    }, [id]);

    const handleJoin = async () => {
        setJoining(true);
        try {
            await RideService.joinRide(id);
            Alert.alert('Success', 'You have joined the ride!');
            fetchRideDetails(); // Refresh to show updated participant list/status
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to join ride');
        } finally {
            setJoining(false);
        }
    }

    const handleStartRide = async () => {
        // Logic to start ride / navigate to active ride screen
        Alert.alert('Start Ride', 'Starting ride tracking...');
        // router.push(`/(main)/rides/${id}/active`);
    }

    const handleShare = async () => {
        try {
            const result = await Share.share({
                message: `Join me on the ride "${ride.name}"!`,
                url: `https://wayfind.app/rides/${id}` // Deep link
            });
        } catch (error) {
            console.error(error);
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00C853" />
            </View>
        )
    }

    if (!ride) {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'white' }}>Ride not found</Text>
            </View>
        )
    }

    const isParticipant = ride.participants?.some(p => p.user_id === user?.id);
    const isCreator = ride.created_by === user?.id; // Assuming user.id matches

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ride Details</Text>
                <TouchableOpacity onPress={handleShare}>
                    <Feather name="share-2" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.titleCard}>
                    <Text style={styles.rideName}>{ride.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: ride.status === 'ACTIVE' ? '#00C853' : '#FFB300' }]}>
                        <Text style={styles.statusText}>{ride.status}</Text>
                    </View>
                </View>

                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Feather name="calendar" size={20} color="#AAA" />
                        <Text style={styles.infoText}>{new Date(ride.start_time).toLocaleString()}</Text>
                    </View>
                    {ride.description && (
                        <View style={styles.descriptionBox}>
                            <Text style={styles.descriptionText}>{ride.description}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Checkpoints ({ride.checkpoints?.length || 0})</Text>
                    {/* List checkpoints if any */}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Participants ({ride.participants?.length || 0})</Text>
                    <View style={styles.participantsList}>
                        {ride.participants?.map((p, index) => (
                            <View key={index} style={styles.participantItem}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{p.user?.name?.charAt(0) || 'U'}</Text>
                                </View>
                                <Text style={styles.participantName}>{p.user?.name || 'Unknown User'}</Text>
                                {p.role === 'lead' && <Feather name="star" size={16} color="#FFB300" />}
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                {!isParticipant ? (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleJoin}
                        disabled={joining}
                    >
                        {joining ? <ActivityIndicator color="white" /> : <Text style={styles.actionButtonText}>Join Ride</Text>}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.joinedContainer}>
                        <View style={styles.joinedBadge}>
                            <Feather name="check" size={20} color="white" />
                            <Text style={styles.joinedText}>You're joined</Text>
                        </View>
                        {/* If active or starting soon, show Start/Track button */}
                        <TouchableOpacity style={styles.trackButton} onPress={handleStartRide}>
                            <Text style={styles.trackButtonText}>Open Ride Map</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    )
}

export default RideDetails

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background || '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white'
    },
    content: {
        padding: 20
    },
    titleCard: {
        marginBottom: 20
    },
    rideName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 12,
        color: 'black'
    },
    infoSection: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10
    },
    infoText: {
        color: 'white',
        fontSize: 16
    },
    descriptionBox: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#333'
    },
    descriptionText: {
        color: '#CCC',
        lineHeight: 20
    },
    section: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 12
    },
    participantsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12
    },
    participantItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        padding: 8,
        borderRadius: 20,
        gap: 8
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold'
    },
    participantName: {
        color: 'white',
        fontSize: 14
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#333',
        backgroundColor: '#121212'
    },
    actionButton: {
        backgroundColor: '#00C853',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    actionButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    },
    joinedContainer: {
        gap: 12
    },
    joinedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#1E1E1E',
        borderRadius: 12
    },
    joinedText: {
        color: 'white',
        fontSize: 16
    },
    trackButton: {
        backgroundColor: '#2962FF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    trackButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    }
})
