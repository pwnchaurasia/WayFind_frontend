import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import RideService from '@/src/apis/rideService'
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
            if (data.status === 'success' && data.ride) {
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
            fetchRideDetails();
        } catch (error) {
            Alert.alert('Error', error.message || 'Failed to join ride');
        } finally {
            setJoining(false);
        }
    }

    const handleShare = async () => {
        if (!ride) return;
        try {
            const joinUrl = `squadra://rides/${id}`;
            await Share.share({
                message: `Join me on "${ride.name}" ride with ${ride.organization?.name}!\n\n${joinUrl}`,
                title: `Join ${ride.name}`
            });
        } catch (error) {
            console.error(error);
        }
    }

    const handleCopyLink = async () => {
        const joinUrl = `squadra://rides/${id}`;
        await Clipboard.setStringAsync(joinUrl);
        Alert.alert('Copied!', 'Ride link copied to clipboard');
    }

    const getStatusColor = (status) => {
        const colors = {
            'PLANNED': '#FFB300',
            'ACTIVE': '#00C853',
            'COMPLETED': '#2196F3',
            'CANCELLED': '#FF5252'
        };
        return colors[status] || '#888';
    }

    const getRideTypeLabel = (type) => {
        const types = {
            'ONE_DAY': 'Day Ride',
            'MULTI_DAY': 'Multi-Day',
            'WEEKEND': 'Weekend Trip'
        };
        return types[type] || type;
    }

    const getCheckpointIcon = (type) => {
        const icons = {
            'meetup': 'map-marker',
            'stop': 'map-marker-check',
            'destination': 'flag-checkered',
            'disbursement': 'map-marker-outline'
        };
        return icons[type?.toLowerCase()] || 'map-marker';
    }

    const getCheckpointLabel = (type) => {
        const labels = {
            'meetup': 'Start Point',
            'stop': 'Pit Stop',
            'destination': 'Destination',
            'disbursement': 'End Point'
        };
        return labels[type?.toLowerCase()] || type;
    }

    const generateInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
    }

    const getAvatarColor = (name) => {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
        const index = name ? name.charCodeAt(0) % colors.length : 0;
        return colors[index];
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00C853" />
                <Text style={styles.loadingText}>Loading ride details...</Text>
            </View>
        )
    }

    if (!ride) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Feather name="alert-circle" size={48} color="#FF5252" />
                    <Text style={styles.errorText}>Ride not found</Text>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Text style={styles.backBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Feather name="arrow-left" size={22} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Ride Details</Text>
                <View style={styles.headerActions}>
                    {/* Edit button - only for admins and non-completed rides */}
                    {ride.is_admin && ride.status !== 'COMPLETED' && ride.status !== 'completed' && (
                        <TouchableOpacity
                            onPress={() => router.push(`/(main)/rides/${id}/edit`)}
                            style={styles.headerBtn}
                        >
                            <Feather name="edit-2" size={20} color="#00C853" />
                        </TouchableOpacity>
                    )}
                    {ride.is_admin && (
                        <TouchableOpacity onPress={handleCopyLink} style={styles.headerBtn}>
                            <Feather name="link" size={20} color="white" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
                        <Feather name="share-2" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Ride Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.titleRow}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.rideName}>{ride.name}</Text>
                            <Text style={styles.orgName}>{ride.organization?.name}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
                            <Text style={styles.statusText}>{ride.status}</Text>
                        </View>
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Feather name="calendar" size={16} color="#00C853" />
                            <Text style={styles.metaText}>
                                {ride.scheduled_date
                                    ? new Date(ride.scheduled_date).toLocaleDateString('en-IN', {
                                        day: 'numeric', month: 'short', year: 'numeric'
                                    })
                                    : 'TBD'}
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <MaterialCommunityIcons name="motorbike" size={18} color="#00C853" />
                            <Text style={styles.metaText}>{getRideTypeLabel(ride.ride_type)}</Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{ride.participants_count || 0}</Text>
                            <Text style={styles.statLabel}>Joined</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{ride.spots_left || 0}</Text>
                            <Text style={styles.statLabel}>Spots Left</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{ride.max_riders}</Text>
                            <Text style={styles.statLabel}>Max Riders</Text>
                        </View>
                    </View>
                </View>

                {/* Payment Info */}
                {ride.requires_payment && (
                    <View style={styles.paymentCard}>
                        <View style={styles.paymentHeader}>
                            <Ionicons name="wallet-outline" size={20} color="#FFB300" />
                            <Text style={styles.paymentTitle}>Paid Ride</Text>
                        </View>
                        <Text style={styles.paymentAmount}>₹{ride.amount}</Text>
                        <Text style={styles.paymentNote}>Payment required to join</Text>
                    </View>
                )}

                {/* Checkpoints Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Feather name="map-pin" size={16} color="#00C853" /> Route ({ride.checkpoints?.length || 0} stops)
                    </Text>
                    {ride.checkpoints && ride.checkpoints.length > 0 ? (
                        <View style={styles.checkpointsList}>
                            {ride.checkpoints.map((cp, index) => (
                                <View key={cp.id || index} style={styles.checkpointItem}>
                                    <View style={styles.checkpointLine}>
                                        <View style={[styles.checkpointDot, index === 0 && styles.startDot, index === ride.checkpoints.length - 1 && styles.endDot]} />
                                        {index < ride.checkpoints.length - 1 && <View style={styles.checkpointConnector} />}
                                    </View>
                                    <View style={styles.checkpointContent}>
                                        <Text style={styles.checkpointType}>{getCheckpointLabel(cp.type)}</Text>
                                        <Text style={styles.checkpointAddress} numberOfLines={2}>
                                            {cp.address || `${cp.latitude?.toFixed(4)}, ${cp.longitude?.toFixed(4)}`}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Feather name="map" size={32} color="#555" />
                            <Text style={styles.emptyText}>No checkpoints added yet</Text>
                        </View>
                    )}
                </View>

                {/* Participants Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Feather name="users" size={16} color="#00C853" /> Participants ({ride.participants?.length || 0})
                    </Text>
                    {ride.participants && ride.participants.length > 0 ? (
                        <View style={styles.participantsList}>
                            {ride.participants.map((p, index) => (
                                <View key={p.id || index} style={styles.participantCard}>
                                    <View style={[styles.participantAvatar, { backgroundColor: getAvatarColor(p.user?.name) }]}>
                                        <Text style={styles.participantInitials}>
                                            {generateInitials(p.user?.name)}
                                        </Text>
                                    </View>
                                    <View style={styles.participantInfo}>
                                        <View style={styles.participantNameRow}>
                                            <Text style={styles.participantName}>{p.user?.name || 'Unknown'}</Text>
                                            {p.role === 'lead' && (
                                                <View style={styles.leadBadge}>
                                                    <Feather name="star" size={10} color="#FFB300" />
                                                    <Text style={styles.leadText}>Lead</Text>
                                                </View>
                                            )}
                                        </View>
                                        {p.vehicle && (
                                            <View style={styles.vehicleRow}>
                                                <MaterialCommunityIcons name="motorbike" size={14} color="#888" />
                                                <Text style={styles.vehicleText}>
                                                    {p.vehicle.make} {p.vehicle.model}
                                                    {p.vehicle.license_plate && ` • ${p.vehicle.license_plate}`}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    {ride.requires_payment && (
                                        <View style={[styles.paymentStatus, p.has_paid ? styles.paidStatus : styles.unpaidStatus]}>
                                            <Ionicons
                                                name={p.has_paid ? "checkmark-circle" : "time-outline"}
                                                size={16}
                                                color={p.has_paid ? "#00C853" : "#FFB300"}
                                            />
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Feather name="user-plus" size={32} color="#555" />
                            <Text style={styles.emptyText}>Be the first to join!</Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
                {!ride.is_participant ? (
                    <TouchableOpacity
                        style={[styles.joinButton, ride.spots_left <= 0 && styles.disabledButton]}
                        onPress={handleJoin}
                        disabled={joining || ride.spots_left <= 0}
                    >
                        {joining ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Feather name="user-plus" size={20} color="white" />
                                <Text style={styles.joinButtonText}>
                                    {ride.spots_left <= 0 ? 'Ride Full' : 'Join This Ride'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.joinedFooter}>
                        <View style={styles.joinedBadge}>
                            <Feather name="check-circle" size={20} color="#00C853" />
                            <Text style={styles.joinedText}>You're joined!</Text>
                        </View>
                        {ride.status === 'ACTIVE' && (
                            <TouchableOpacity style={styles.trackButton}>
                                <Feather name="navigation" size={18} color="white" />
                                <Text style={styles.trackButtonText}>Open Map</Text>
                            </TouchableOpacity>
                        )}
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
        backgroundColor: '#121212',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
        gap: 12,
    },
    loadingText: {
        color: '#888',
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    errorText: {
        color: '#888',
        fontSize: 16,
    },
    backBtn: {
        backgroundColor: '#333',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 10,
    },
    backBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    headerBtn: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginHorizontal: 10,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 4,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    infoCard: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 18,
        marginTop: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    titleContainer: {
        flex: 1,
        marginRight: 12,
    },
    rideName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    orgName: {
        fontSize: 14,
        color: '#888',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 11,
        color: 'black',
    },
    metaRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        color: '#CCC',
        fontSize: 13,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#2A2A2A',
        borderRadius: 12,
        paddingVertical: 12,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#00C853',
    },
    statLabel: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#444',
    },
    paymentCard: {
        backgroundColor: '#2A2000',
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#FFB300',
    },
    paymentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    paymentTitle: {
        color: '#FFB300',
        fontWeight: 'bold',
        fontSize: 14,
    },
    paymentAmount: {
        color: '#FFB300',
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 6,
    },
    paymentNote: {
        color: '#886',
        fontSize: 12,
        marginTop: 4,
    },
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 12,
    },
    checkpointsList: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 14,
    },
    checkpointItem: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    checkpointLine: {
        width: 24,
        alignItems: 'center',
    },
    checkpointDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#555',
        borderWidth: 2,
        borderColor: '#888',
    },
    startDot: {
        backgroundColor: '#00C853',
        borderColor: '#00C853',
    },
    endDot: {
        backgroundColor: '#FF5252',
        borderColor: '#FF5252',
    },
    checkpointConnector: {
        width: 2,
        flex: 1,
        backgroundColor: '#444',
        marginVertical: 4,
    },
    checkpointContent: {
        flex: 1,
        marginLeft: 10,
        paddingBottom: 16,
    },
    checkpointType: {
        color: '#00C853',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    checkpointAddress: {
        color: '#AAA',
        fontSize: 13,
    },
    participantsList: {
        gap: 10,
    },
    participantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 12,
    },
    participantAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    participantInitials: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    participantInfo: {
        flex: 1,
        marginLeft: 12,
    },
    participantNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    participantName: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    leadBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#332800',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 3,
    },
    leadText: {
        color: '#FFB300',
        fontSize: 10,
        fontWeight: '600',
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    vehicleText: {
        color: '#888',
        fontSize: 12,
    },
    paymentStatus: {
        padding: 6,
    },
    paidStatus: {},
    unpaidStatus: {},
    emptyState: {
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        padding: 30,
        alignItems: 'center',
        gap: 10,
    },
    emptyText: {
        color: '#666',
        fontSize: 14,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#121212',
        borderTopWidth: 1,
        borderTopColor: '#333',
        padding: 16,
        paddingBottom: 30,
    },
    joinButton: {
        flexDirection: 'row',
        backgroundColor: '#00C853',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    disabledButton: {
        backgroundColor: '#555',
    },
    joinButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    joinedFooter: {
        gap: 10,
    },
    joinedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#1E1E1E',
        paddingVertical: 12,
        borderRadius: 12,
    },
    joinedText: {
        color: '#00C853',
        fontSize: 15,
        fontWeight: '600',
    },
    trackButton: {
        flexDirection: 'row',
        backgroundColor: '#2962FF',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    trackButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
})
