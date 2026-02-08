/**
 * RideDetails - Redesigned with Premium Dark Mode UI
 * Features: Hero image header, capacity progress bar, route timeline, clean participant cards
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share, Image, Modal, Pressable, Linking, TextInput, Dimensions } from 'react-native'
import React, { useEffect, useState, useMemo } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import RideService from '@/src/apis/rideService'
import UserService from '@/src/apis/userService'
import IntercomService from '@/src/apis/intercomService'
import { useAuth } from '@/src/context/AuthContext'
import { theme } from '@/src/styles/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RideDetails = () => {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const [ride, setRide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    // Vehicle selection for joining/updating
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [vehicleMode, setVehicleMode] = useState('join');
    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [loadingVehicles, setLoadingVehicles] = useState(false);
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [newVehicle, setNewVehicle] = useState({ make: '', model: '', year: '', license_plate: '' });
    const [addingVehicle, setAddingVehicle] = useState(false);
    const [updatingVehicle, setUpdatingVehicle] = useState(false);

    // Admin action modal
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Participant filters
    const [participantFilter, setParticipantFilter] = useState('all');
    const [statusLoading, setStatusLoading] = useState(false);

    const fetchRideDetails = async () => {
        try {
            setLoading(true);
            const data = await RideService.getRideById(id);
            if (data.status === 'success' && data.ride) {
                setRide(data.ride);
            }
        } catch (error) {
            console.error("Failed to fetch ride details", error);
            Alert.alert('Error', error.detail || error.message || 'Could not load ride details');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (id) fetchRideDetails();
    }, [id]);

    // Filtered participants
    const filteredParticipants = useMemo(() => {
        if (!ride?.participants) return [];
        let result = [...ride.participants];

        switch (participantFilter) {
            case 'paid':
                result = result.filter(p => p.has_paid);
                break;
            case 'unpaid':
                result = result.filter(p => !p.has_paid && p.role !== 'banned');
                break;
            case 'pending':
                result = result.filter(p => !p.has_paid || !p.vehicle);
                break;
        }
        return result;
    }, [ride?.participants, participantFilter]);

    // ============================================
    // VEHICLE SELECTION FOR JOINING
    // ============================================

    const fetchVehicles = async () => {
        setLoadingVehicles(true);
        try {
            const data = await UserService.getUserVehicles();
            setVehicles(data.vehicles || []);
            if (data.vehicles?.length > 0) {
                const primary = data.vehicles.find(v => v.is_primary);
                setSelectedVehicle(primary || data.vehicles[0]);
            }
        } catch (error) {
            console.error('Failed to fetch vehicles:', error);
        } finally {
            setLoadingVehicles(false);
        }
    };

    const handleJoinPress = async () => {
        setVehicleMode('join');
        await fetchVehicles();
        setShowVehicleModal(true);
    };

    const handleAddVehicle = async () => {
        if (!newVehicle.make.trim() || !newVehicle.model.trim()) {
            Alert.alert('Error', 'Make and Model are required');
            return;
        }
        setAddingVehicle(true);
        try {
            const vehicleData = {
                make: newVehicle.make.trim(),
                model: newVehicle.model.trim(),
                year: newVehicle.year ? parseInt(newVehicle.year) : null,
                license_plate: newVehicle.license_plate.trim() || null,
                is_primary: vehicles.length === 0,
            };
            const result = await UserService.addVehicle(vehicleData);
            await fetchVehicles();
            if (result.vehicle) setSelectedVehicle(result.vehicle);
            setNewVehicle({ make: '', model: '', year: '', license_plate: '' });
            setShowAddVehicle(false);
            Alert.alert('Success', 'Vehicle added successfully!');
        } catch (error) {
            Alert.alert('Error', error.detail || 'Failed to add vehicle');
        } finally {
            setAddingVehicle(false);
        }
    };

    const handleVehicleConfirm = async () => {
        if (!selectedVehicle) {
            Alert.alert('Select Vehicle', 'Please select a vehicle or add a new one');
            return;
        }
        setShowVehicleModal(false);
        if (vehicleMode === 'join') {
            setJoining(true);
            try {
                await RideService.joinRide(id, { vehicle_info_id: selectedVehicle.id });
                Alert.alert('Success', 'You have joined the ride!');
                fetchRideDetails();
            } catch (error) {
                if (error.detail?.includes('banned')) {
                    Alert.alert('Access Denied', 'You are banned from this ride.');
                } else {
                    Alert.alert('Error', error.detail || 'Failed to join ride');
                }
            } finally {
                setJoining(false);
            }
        } else if (vehicleMode === 'update') {
            setUpdatingVehicle(true);
            try {
                await RideService.updateMyVehicle(id, selectedVehicle.id);
                Alert.alert('Success', 'Vehicle updated successfully!');
                fetchRideDetails();
            } catch (error) {
                Alert.alert('Error', error.detail || 'Failed to update vehicle');
            } finally {
                setUpdatingVehicle(false);
            }
        }
    };

    const handleUpdateVehicle = async () => {
        setShowActionModal(false);
        setVehicleMode('update');
        await fetchVehicles();
        setShowVehicleModal(true);
    };

    // Status Management
    const handleStartRide = async () => {
        Alert.alert("Start Ride", "Are you sure you want to start this ride?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Start Ride",
                onPress: async () => {
                    setStatusLoading(true);
                    try {
                        await RideService.startRide(id);
                        fetchRideDetails();
                        Alert.alert("Success", "Ride has started!");
                    } catch (error) {
                        Alert.alert("Error", error.message || "Failed to start ride");
                    } finally {
                        setStatusLoading(false);
                    }
                }
            }
        ]);
    };

    const handleEndRide = async () => {
        Alert.alert("End Ride", "Are you sure you want to end this ride?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "End Ride",
                style: 'destructive',
                onPress: async () => {
                    setStatusLoading(true);
                    try {
                        await RideService.endRide(id);
                        fetchRideDetails();
                        Alert.alert("Success", "Ride completed!");
                    } catch (error) {
                        Alert.alert("Error", error.message || "Failed to end ride");
                    } finally {
                        setStatusLoading(false);
                    }
                }
            }
        ]);
    };

    const handleShare = async () => {
        if (!ride) return;
        try {
            const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL_DEV;
            const joinUrl = `${baseUrl}/v1/rides/join/${id}`;
            await Share.share({
                message: `Join me on "${ride.name}" ride with ${ride.organization?.name}!\n\n${joinUrl}`,
                title: `Join ${ride.name}`
            });
        } catch (error) {
            console.error(error);
        }
    }

    // ============================================
    // ADMIN ACTIONS
    // ============================================

    const openParticipantActions = (participant) => {
        // Allow if admin OR if it's the current user
        const isSelf = participant.user?.id === user?.id;
        if (!ride.is_admin && !isSelf) return;

        setSelectedParticipant(participant);
        setShowActionModal(true);
    };

    const handleCall = () => {
        if (selectedParticipant?.user?.phone_number) {
            Linking.openURL(`tel:${selectedParticipant.user.phone_number}`);
        }
    };

    const handleMarkPayment = async () => {
        if (!selectedParticipant) return;
        setActionLoading(true);
        try {
            await RideService.markPayment(id, selectedParticipant.id, ride.amount || 0);
            Alert.alert('Success', 'Payment status updated');
            setShowActionModal(false);
            fetchRideDetails();
        } catch (error) {
            Alert.alert('Error', error.detail || 'Failed to update payment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkAttendance = async (status) => {
        if (!selectedParticipant) return;
        setActionLoading(true);
        try {
            await RideService.markAttendance(id, selectedParticipant.id, status);
            Alert.alert('Success', `Marked as ${status}`);
            setShowActionModal(false);
            fetchRideDetails();
        } catch (error) {
            Alert.alert('Error', error.detail || 'Failed to mark attendance');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveParticipant = async () => {
        if (!selectedParticipant) return;
        Alert.alert('Remove Participant', `Remove ${selectedParticipant.user?.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive',
                onPress: async () => {
                    setActionLoading(true);
                    try {
                        await RideService.removeParticipant(id, selectedParticipant.id);
                        Alert.alert('Success', 'Participant removed');
                        setShowActionModal(false);
                        fetchRideDetails();
                    } catch (error) {
                        Alert.alert('Error', error.detail || 'Failed to remove');
                    } finally {
                        setActionLoading(false);
                    }
                }
            }
        ]);
    };

    const handleToggleBan = async () => {
        if (!selectedParticipant) return;
        const isBanned = selectedParticipant.role === 'banned';
        setActionLoading(true);
        try {
            await RideService.toggleBan(id, selectedParticipant.id);
            Alert.alert('Success', isBanned ? 'Unbanned' : 'Banned');
            setShowActionModal(false);
            fetchRideDetails();
        } catch (error) {
            Alert.alert('Error', error.detail || 'Failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSetAsLead = async () => {
        if (!selectedParticipant?.user?.id) return;
        setActionLoading(true);
        try {
            await IntercomService.setLead(id, selectedParticipant.user.id);
            Alert.alert('Success', `${selectedParticipant.user.name} is now the Lead`);
            setShowActionModal(false);
            fetchRideDetails();
        } catch (error) {
            Alert.alert('Error', error.detail || 'Failed to set Lead');
        } finally {
            setActionLoading(false);
        }
    };

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    const getStatusColor = (status) => {
        const colors = {
            'PLANNED': '#00C853', 'planned': '#00C853',
            'ACTIVE': '#00C853', 'active': '#00C853',
            'COMPLETED': '#888', 'completed': '#888',
            'CANCELLED': '#FF5252', 'cancelled': '#FF5252'
        };
        return colors[status] || '#888';
    }

    const generateInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(w => w.charAt(0)).join('').substring(0, 2).toUpperCase();
    }

    const getAvatarColor = (name) => {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        const index = name ? name.charCodeAt(0) % colors.length : 0;
        return colors[index];
    }

    // ============================================
    // RENDER
    // ============================================

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
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

    const filterOptions = [
        { key: 'all', label: 'All' },
        { key: 'paid', label: 'Paid' },
        { key: 'unpaid', label: 'Unpaid' },
        { key: 'pending', label: 'Pending' },
    ];

    return (
        <View style={styles.container}>
            {/* Hero Image Section */}
            <View style={styles.heroSection}>
                <Image
                    source={{ uri: ride.cover_image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800' }}
                    style={styles.heroImage}
                    resizeMode="cover"
                />
                <View style={styles.heroOverlay} />

                {/* Header Icons over image */}
                <SafeAreaView style={styles.heroHeader} edges={['top']}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.heroBtn}>
                        <Feather name="arrow-left" size={22} color="white" />
                    </TouchableOpacity>
                    <View style={styles.heroActions}>
                        {ride.is_admin && ride.status !== 'COMPLETED' && ride.status !== 'completed' && (
                            <TouchableOpacity onPress={() => router.push(`/(main)/rides/${id}/edit`)} style={styles.heroBtn}>
                                <Feather name="edit-2" size={20} color="white" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={handleShare} style={styles.heroBtn}>
                            <Feather name="share-2" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Main Info Card */}
                <View style={styles.infoCard}>
                    {/* Title Row */}
                    <View style={styles.titleRow}>
                        <Text style={styles.rideName}>{ride.name}</Text>
                        <View style={styles.dateBox}>
                            <Text style={styles.dateLabel}>DATE</Text>
                            <Text style={styles.dateValue}>
                                {ride.scheduled_date
                                    ? new Date(ride.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : 'TBD'}
                            </Text>
                        </View>
                    </View>

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
                        <Text style={styles.statusText}>{ride.status?.toUpperCase()}</Text>
                    </View>

                    {/* Capacity Section */}
                    <View style={styles.capacitySection}>
                        <Text style={styles.capacityLabel}>CAPACITY</Text>
                        <Text style={styles.capacityValue}>
                            <Text style={styles.capacityJoined}>{ride.participants_count || 0}</Text>
                            <Text style={styles.capacityTotal}> / {ride.max_riders} Joined</Text>
                        </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, {
                            width: `${Math.min(((ride.participants_count || 0) / ride.max_riders) * 100, 100)}%`
                        }]} />
                    </View>

                    {/* Action Buttons */}
                    {ride.is_admin && (
                        <View style={styles.actionButtonsRow}>
                            {(ride.status === 'PLANNED' || ride.status === 'planned') && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.actionButtonGreen]}
                                    onPress={handleStartRide}
                                    disabled={statusLoading}
                                >
                                    {statusLoading ? <ActivityIndicator size="small" color="white" /> : (
                                        <>
                                            <Feather name="radio" size={16} color="white" />
                                            <Text style={styles.actionButtonText}>Go Live</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                            {(ride.status === 'ACTIVE' || ride.status === 'active') && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.actionButtonGreen]}
                                    onPress={() => router.push(`/(main)/rides/${id}/live`)}
                                >
                                    <Feather name="radio" size={16} color="white" />
                                    <Text style={styles.actionButtonText}>Go Live</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonRed]}
                                onPress={handleEndRide}
                                disabled={statusLoading || ride.status === 'COMPLETED' || ride.status === 'completed'}
                            >
                                <Feather name="x-circle" size={16} color="#FF5252" />
                                <Text style={[styles.actionButtonText, { color: '#FF5252' }]}>End Ride</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Ride Route Section */}
                <View style={styles.routeSection}>
                    <View style={styles.routeHeader}>
                        <View style={styles.routeTitleRow}>
                            <MaterialCommunityIcons name="routes" size={20} color={theme.colors.primary} />
                            <Text style={styles.routeTitle}>Ride Route</Text>
                        </View>
                        <TouchableOpacity style={styles.viewMapBtn}>
                            <Feather name="map" size={14} color={theme.colors.primary} />
                            <Text style={styles.viewMapText}>View Map</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.routeCard}>
                        {ride.checkpoints && ride.checkpoints.length > 0 ? (
                            ride.checkpoints.map((cp, index) => (
                                <View key={cp.id || index} style={styles.routeItem}>
                                    <View style={styles.routeTimeline}>
                                        <View style={[
                                            styles.routeDot,
                                            index === 0 && styles.routeDotStart,
                                            index === ride.checkpoints.length - 1 && styles.routeDotEnd
                                        ]} />
                                        {index < ride.checkpoints.length - 1 && <View style={styles.routeLine} />}
                                    </View>
                                    <View style={styles.routeContent}>
                                        <Text style={[styles.routeLabel, index === ride.checkpoints.length - 1 && styles.routeLabelEnd]}>
                                            {index === 0 ? 'START POINT' : index === ride.checkpoints.length - 1 ? 'END DESTINATION' : 'WAYPOINT'}
                                        </Text>
                                        <Text style={styles.routeAddress}>{cp.address || `${cp.latitude?.toFixed(4)}, ${cp.longitude?.toFixed(4)}`}</Text>
                                        <Text style={styles.routeNote}>
                                            {index === 0 ? (ride.scheduled_date ? new Date(ride.scheduled_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' Assembly' : 'Assembly Point') :
                                                index === ride.checkpoints.length - 1 ? 'Final Reach & Lunch' : 'Regroup & Tea Break'}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyRoute}>
                                <Feather name="map" size={24} color="#555" />
                                <Text style={styles.emptyRouteText}>No checkpoints added</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Participants Section */}
                <View style={styles.participantsSection}>
                    <Text style={styles.participantsTitle}>Participants ({filteredParticipants.length})</Text>

                    {/* Filter Chips */}
                    <View style={styles.filterChipsRow}>
                        {filterOptions.map(opt => (
                            <TouchableOpacity
                                key={opt.key}
                                style={[styles.filterChip, participantFilter === opt.key && styles.filterChipActive]}
                                onPress={() => setParticipantFilter(opt.key)}
                            >
                                <Text style={[styles.filterChipText, participantFilter === opt.key && styles.filterChipTextActive]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Participant Cards */}
                    {filteredParticipants.length > 0 ? (
                        <View style={styles.participantsList}>
                            {filteredParticipants.map((p, index) => {
                                const isBanned = p.role === 'banned';
                                const isPending = !p.has_paid && ride.requires_payment;
                                const isSelf = p.user?.id === user?.id;
                                const canEdit = isSelf && ride.status !== 'COMPLETED' && ride.status !== 'completed' && ride.status !== 'CANCELLED' && ride.status !== 'cancelled';

                                return (
                                    <TouchableOpacity
                                        key={p.id || index}
                                        style={[styles.participantCard, isBanned && styles.bannedCard]}
                                        onPress={() => openParticipantActions(p)}
                                        disabled={!ride.is_admin && !isSelf}
                                        activeOpacity={ride.is_admin || isSelf ? 0.7 : 1}
                                    >
                                        {p.user?.profile_picture ? (
                                            <Image source={{ uri: p.user.profile_picture }} style={styles.participantAvatar} />
                                        ) : (
                                            <View style={[styles.participantAvatar, { backgroundColor: getAvatarColor(p.user?.name) }]}>
                                                <Text style={styles.participantInitials}>{generateInitials(p.user?.name)}</Text>
                                            </View>
                                        )}
                                        <View style={styles.participantInfo}>
                                            <Text style={[styles.participantName, isBanned && styles.bannedText]}>
                                                {p.user?.name || 'Unknown'} {isSelf && '(You)'}
                                            </Text>
                                            <View style={styles.participantMeta}>
                                                <MaterialCommunityIcons name="motorbike" size={12} color={isPending ? '#FF9800' : '#888'} />
                                                <Text style={[styles.participantVehicle, isPending && { color: '#FF9800' }]}>
                                                    {p.vehicle ? `${p.vehicle.make} ${p.vehicle.model}${p.vehicle.license_plate ? ` • ${p.vehicle.license_plate}` : ''}` :
                                                        isPending ? 'PENDING DOCUMENTS' : 'No vehicle info'}
                                                </Text>
                                            </View>
                                        </View>

                                        {canEdit ? (
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedParticipant(p);
                                                    handleUpdateVehicle();
                                                }}
                                                style={{ padding: 8 }}
                                            >
                                                <Feather name="edit-2" size={20} color={theme.colors.primary} />
                                            </TouchableOpacity>
                                        ) : (
                                            <Feather name="chevron-right" size={20} color="#555" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Feather name="user-plus" size={32} color="#555" />
                            <Text style={styles.emptyText}>
                                {participantFilter !== 'all' ? `No ${participantFilter} participants` : 'Be the first to join!'}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Footer - Join Button (non-participants only) */}
            {!ride.is_participant && (ride.status === 'PLANNED' || ride.status === 'planned') && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.joinButton, ride.spots_left <= 0 && styles.disabledButton]}
                        onPress={handleJoinPress}
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
                </View>
            )}

            {/* Admin Action Modal */}
            <Modal visible={showActionModal} transparent animationType="slide" onRequestClose={() => setShowActionModal(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowActionModal(false)}>
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            {selectedParticipant?.user?.profile_picture ? (
                                <Image source={{ uri: selectedParticipant.user.profile_picture }} style={styles.modalAvatar} />
                            ) : (
                                <View style={[styles.modalAvatar, { backgroundColor: getAvatarColor(selectedParticipant?.user?.name) }]}>
                                    <Text style={styles.modalAvatarText}>{generateInitials(selectedParticipant?.user?.name)}</Text>
                                </View>
                            )}
                            <View style={styles.modalHeaderInfo}>
                                <Text style={styles.modalName}>{selectedParticipant?.user?.name || 'Unknown'}</Text>
                                {selectedParticipant?.vehicle && (
                                    <Text style={styles.modalVehicle}>{selectedParticipant.vehicle.make} {selectedParticipant.vehicle.model}</Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setShowActionModal(false)}>
                                <Feather name="x" size={24} color="#888" />
                            </TouchableOpacity>
                        </View>

                        {/* Self Actions */}
                        {selectedParticipant?.user?.id === user?.id && (
                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalActionBtn} onPress={handleUpdateVehicle}>
                                    <View style={[styles.modalActionIcon, { backgroundColor: '#1a2a3a' }]}>
                                        <MaterialCommunityIcons name="motorbike" size={20} color={theme.colors.primary} />
                                    </View>
                                    <Text style={styles.modalActionText}>Change Vehicle</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {selectedParticipant?.user?.phone_number && (
                            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                                <Feather name="phone" size={18} color="white" />
                                <Text style={styles.callButtonText}>Call</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.modalActions}>
                            {ride.requires_payment && (
                                <TouchableOpacity style={styles.modalActionBtn} onPress={handleMarkPayment} disabled={actionLoading}>
                                    <View style={[styles.modalActionIcon, { backgroundColor: selectedParticipant?.has_paid ? '#1a3a1a' : '#3a2a1a' }]}>
                                        <Ionicons name={selectedParticipant?.has_paid ? "checkmark-circle" : "wallet-outline"} size={20} color={selectedParticipant?.has_paid ? theme.colors.primary : "#FFB300"} />
                                    </View>
                                    <Text style={styles.modalActionText}>{selectedParticipant?.has_paid ? 'Payment Confirmed' : 'Mark Payment'}</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.modalActionBtn} onPress={() => handleMarkAttendance('present')} disabled={actionLoading}>
                                <View style={[styles.modalActionIcon, { backgroundColor: '#1a3a1a' }]}>
                                    <Feather name="check" size={20} color={theme.colors.primary} />
                                </View>
                                <Text style={styles.modalActionText}>Mark Present</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.modalActionBtn} onPress={handleToggleBan} disabled={actionLoading}>
                                <View style={[styles.modalActionIcon, { backgroundColor: '#3a2a1a' }]}>
                                    <Feather name={selectedParticipant?.role === 'banned' ? "user-check" : "slash"} size={20} color="#FF9800" />
                                </View>
                                <Text style={styles.modalActionText}>{selectedParticipant?.role === 'banned' ? 'Unban' : 'Ban'}</Text>
                            </TouchableOpacity>

                            {(ride.status === 'ACTIVE' || ride.status === 'active') && (
                                <TouchableOpacity style={styles.modalActionBtn} onPress={handleSetAsLead} disabled={actionLoading}>
                                    <View style={[styles.modalActionIcon, { backgroundColor: '#1a2a3a' }]}>
                                        <Feather name="mic" size={20} color="#2196F3" />
                                    </View>
                                    <Text style={styles.modalActionText}>Set as Lead</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={[styles.modalActionBtn, styles.dangerBtn]} onPress={handleRemoveParticipant} disabled={actionLoading}>
                                <View style={[styles.modalActionIcon, { backgroundColor: '#3a1a1a' }]}>
                                    <Feather name="user-x" size={20} color="#FF5252" />
                                </View>
                                <Text style={[styles.modalActionText, { color: '#FF5252' }]}>Remove</Text>
                            </TouchableOpacity>
                        </View>

                        {actionLoading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            </View>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Vehicle Selection Modal */}
            <Modal visible={showVehicleModal} transparent animationType="slide" onRequestClose={() => setShowVehicleModal(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowVehicleModal(false)}>
                    <Pressable style={styles.vehicleModalContent} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.vehicleModalHeader}>
                            <Text style={styles.vehicleModalTitle}>Select Your Vehicle</Text>
                            <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                                <Feather name="x" size={24} color="#888" />
                            </TouchableOpacity>
                        </View>

                        {loadingVehicles ? (
                            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 40 }} />
                        ) : (
                            <ScrollView style={styles.vehicleList}>
                                {vehicles.map((vehicle) => (
                                    <TouchableOpacity
                                        key={vehicle.id}
                                        style={[styles.vehicleOption, selectedVehicle?.id === vehicle.id && styles.vehicleOptionSelected]}
                                        onPress={() => setSelectedVehicle(vehicle)}
                                    >
                                        <MaterialCommunityIcons name="motorbike" size={24} color={selectedVehicle?.id === vehicle.id ? theme.colors.primary : '#888'} />
                                        <View style={styles.vehicleOptionInfo}>
                                            <Text style={styles.vehicleOptionName}>{vehicle.make} {vehicle.model}</Text>
                                            <Text style={styles.vehicleOptionDetails}>{vehicle.license_plate || 'No plate'}</Text>
                                        </View>
                                        {selectedVehicle?.id === vehicle.id && <Feather name="check-circle" size={22} color={theme.colors.primary} />}
                                    </TouchableOpacity>
                                ))}

                                {!showAddVehicle ? (
                                    <TouchableOpacity style={styles.addVehicleBtn} onPress={() => setShowAddVehicle(true)}>
                                        <Feather name="plus-circle" size={20} color={theme.colors.primary} />
                                        <Text style={styles.addVehicleBtnText}>Add New Vehicle</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.addVehicleForm}>
                                        <TextInput style={styles.input} placeholder="Make (e.g., Royal Enfield)" placeholderTextColor="#666" value={newVehicle.make} onChangeText={(t) => setNewVehicle(p => ({ ...p, make: t }))} />
                                        <TextInput style={styles.input} placeholder="Model (e.g., Himalayan)" placeholderTextColor="#666" value={newVehicle.model} onChangeText={(t) => setNewVehicle(p => ({ ...p, model: t }))} />
                                        <TextInput style={styles.input} placeholder="License Plate" placeholderTextColor="#666" autoCapitalize="characters" value={newVehicle.license_plate} onChangeText={(t) => setNewVehicle(p => ({ ...p, license_plate: t }))} />
                                        <TouchableOpacity style={styles.saveVehicleBtn} onPress={handleAddVehicle} disabled={addingVehicle}>
                                            {addingVehicle ? <ActivityIndicator color="white" /> : <Text style={styles.saveVehicleBtnText}>Save Vehicle</Text>}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </ScrollView>
                        )}

                        <TouchableOpacity style={[styles.confirmBtn, !selectedVehicle && styles.confirmBtnDisabled]} onPress={handleVehicleConfirm} disabled={!selectedVehicle || joining || updatingVehicle}>
                            {joining || updatingVehicle ? <ActivityIndicator color="white" /> : (
                                <Text style={styles.confirmBtnText}>
                                    {selectedVehicle
                                        ? (vehicleMode === 'update' ? `Update to ${selectedVehicle.make} ${selectedVehicle.model}` : `Join with ${selectedVehicle.make} ${selectedVehicle.model}`)
                                        : 'Select a Vehicle'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

export default RideDetails

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', gap: 12 },
    loadingText: { color: '#888', fontSize: 14 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    errorText: { color: '#FF5252', fontSize: 18, fontWeight: '600' },
    backBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    backBtnText: { color: 'white', fontWeight: '600' },

    // Hero Section
    heroSection: { height: 220, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
    heroHeader: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
    heroBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    heroActions: { flexDirection: 'row', gap: 12 },

    // Scroll Content
    scrollView: { flex: 1, marginTop: -40 },

    // Info Card
    infoCard: { backgroundColor: '#1E1E1E', marginHorizontal: 16, borderRadius: 16, padding: 20 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    rideName: { fontSize: 22, fontWeight: 'bold', color: 'white', flex: 1, marginRight: 12 },
    dateBox: { alignItems: 'flex-end' },
    dateLabel: { fontSize: 10, color: '#888', letterSpacing: 1 },
    dateValue: { fontSize: 13, color: 'white', fontWeight: '500' },
    statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, marginBottom: 16 },
    statusText: { color: 'white', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },

    // Capacity
    capacitySection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    capacityLabel: { fontSize: 11, color: '#888', letterSpacing: 1 },
    capacityValue: { fontSize: 14 },
    capacityJoined: { color: 'white', fontWeight: 'bold' },
    capacityTotal: { color: '#888' },
    progressBarBg: { height: 4, backgroundColor: '#333', borderRadius: 2, marginBottom: 20 },
    progressBarFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 2 },

    // Action Buttons
    actionButtonsRow: { flexDirection: 'row', gap: 12 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
    actionButtonGreen: { backgroundColor: theme.colors.primary },
    actionButtonRed: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF5252' },
    actionButtonText: { color: 'white', fontSize: 14, fontWeight: '700' },

    // Route Section
    routeSection: { marginTop: 20, paddingHorizontal: 16 },
    routeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    routeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    routeTitle: { fontSize: 16, fontWeight: 'bold', color: 'white' },
    viewMapBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewMapText: { color: theme.colors.primary, fontSize: 13, fontWeight: '500' },
    routeCard: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 16 },
    routeItem: { flexDirection: 'row' },
    routeTimeline: { alignItems: 'center', marginRight: 12 },
    routeDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.primary },
    routeDotStart: { backgroundColor: theme.colors.primary },
    routeDotEnd: { backgroundColor: '#FF5252' },
    routeLine: { width: 2, flex: 1, backgroundColor: '#333', marginVertical: 4 },
    routeContent: { flex: 1, paddingBottom: 20 },
    routeLabel: { fontSize: 10, color: theme.colors.primary, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
    routeLabelEnd: { color: '#FF5252' },
    routeAddress: { fontSize: 15, color: 'white', fontWeight: '500', marginBottom: 2 },
    routeNote: { fontSize: 12, color: '#888' },
    emptyRoute: { alignItems: 'center', padding: 24, gap: 8 },
    emptyRouteText: { color: '#888', fontSize: 14 },

    // Participants
    participantsSection: { marginTop: 24, paddingHorizontal: 16 },
    participantsTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 12 },
    filterChipsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#2A2A2A' },
    filterChipActive: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#444' },
    filterChipText: { color: '#888', fontSize: 13, fontWeight: '500' },
    filterChipTextActive: { color: 'white' },
    participantsList: { gap: 8 },
    participantCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, gap: 12 },
    bannedCard: { opacity: 0.5 },
    participantAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    participantInitials: { color: 'white', fontWeight: 'bold', fontSize: 15 },
    participantInfo: { flex: 1 },
    participantName: { color: 'white', fontSize: 15, fontWeight: '600', marginBottom: 4 },
    bannedText: { textDecorationLine: 'line-through' },
    participantMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    participantVehicle: { color: '#888', fontSize: 12 },
    emptyState: { alignItems: 'center', padding: 40, gap: 12 },
    emptyText: { color: '#888', fontSize: 14 },

    // Footer
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#121212', borderTopWidth: 1, borderTopColor: '#2A2A2A', padding: 16, paddingBottom: 34 },
    joinButton: { flexDirection: 'row', backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10 },
    disabledButton: { backgroundColor: '#555' },
    joinButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    modalAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    modalAvatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    modalHeaderInfo: { flex: 1 },
    modalName: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    modalVehicle: { color: '#888', fontSize: 13, marginTop: 2 },
    callButton: { flexDirection: 'row', backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
    callButtonText: { color: 'white', fontWeight: '600' },
    modalActions: { gap: 8 },
    modalActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#2A2A2A', borderRadius: 12 },
    modalActionIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    modalActionText: { color: 'white', fontSize: 15, fontWeight: '500' },
    dangerBtn: {},
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },

    // Vehicle Modal
    vehicleModalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '70%' },
    vehicleModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    vehicleModalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    vehicleList: { maxHeight: 300 },
    vehicleOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#2A2A2A', borderRadius: 12, marginBottom: 8 },
    vehicleOptionSelected: { borderWidth: 1, borderColor: theme.colors.primary },
    vehicleOptionInfo: { flex: 1 },
    vehicleOptionName: { color: 'white', fontSize: 15, fontWeight: '600' },
    vehicleOptionDetails: { color: '#888', fontSize: 12, marginTop: 2 },
    addVehicleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
    addVehicleBtnText: { color: theme.colors.primary, fontSize: 15, fontWeight: '500' },
    addVehicleForm: { gap: 12, marginTop: 12 },
    input: { backgroundColor: '#2A2A2A', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, color: 'white', fontSize: 15 },
    saveVehicleBtn: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    saveVehicleBtnText: { color: 'white', fontWeight: '600' },
    confirmBtn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
    confirmBtnDisabled: { backgroundColor: '#555' },
    confirmBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});
